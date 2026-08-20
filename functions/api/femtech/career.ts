type CareerCategory =
  | "child_rearing"
  | "career_resume"
  | "work_life_balance"
  | "interview_for_mothers";

type WorkersAi = {
  run(
    model: string,
    input: {
      messages: Array<{ role: "system" | "user"; content: string }>;
      response_format: { type: "json_object" };
      max_tokens: number;
    }
  ): Promise<{ response: string | Record<string, unknown> }>;
};

type PagesContext = {
  request: Request;
  env: { AI: WorkersAi };
};

// Use the same model as the working mood endpoint on this account.
const MODEL = "@cf/meta/llama-3.1-8b-instruct-fast";
const CATEGORIES: CareerCategory[] = [
  "child_rearing",
  "career_resume",
  "work_life_balance",
  "interview_for_mothers",
];

const CATEGORY_LABELS: Record<CareerCategory, string> = {
  child_rearing: "育児との両立",
  career_resume: "キャリア再開",
  work_life_balance: "仕事と生活のバランス",
  interview_for_mothers: "母親・ケア責任のある方の面接対策",
};

const jsonResponse = (body: unknown, status = 200) =>
  Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });

export const onRequestPost = async ({ request, env }: PagesContext) => {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ error: "リクエストの形式が正しくありません。" }, 400);
  }

  if (typeof payload !== "object" || payload === null) {
    return jsonResponse({ error: "リクエストの形式が正しくありません。" }, 400);
  }

  const { action, category, context } = payload as Record<string, unknown>;
  if (
    (action !== "advice" && action !== "questions") ||
    typeof category !== "string" ||
    !CATEGORIES.includes(category as CareerCategory) ||
    (context !== undefined &&
      (typeof context !== "string" || context.length > 4_000))
  ) {
    return jsonResponse({ error: "入力内容を確認してください。" }, 400);
  }

  if (!env.AI || typeof env.AI.run !== "function") {
    return jsonResponse(
      { error: "AIサービスを利用できません。", code: "AI_BINDING_UNAVAILABLE" },
      503
    );
  }

  const selectedCategory = category as CareerCategory;
  const situation =
    typeof context === "string" && context.trim()
      ? context.trim()
      : "詳しい状況の指定なし";
  const task =
    action === "questions"
      ? `面接やキャリア相談の準備に使える実践的な質問を5件作成し、それぞれに短い回答のポイントを付けてください。\n\n{"questions":[{"question":"質問文","tips":"回答のポイント"}]}`
      : `相談者が次の一歩を選べる、温かく具体的なアドバイスを日本語で300文字以内にまとめてください。\n\n{"advice":"アドバイス本文"}`;

  let result: { response: string | Record<string, unknown> };
  try {
    result = await env.AI.run(MODEL, {
      messages: [
        {
          role: "system",
          content:
            "あなたは再就職を目指す女性、母親、家族のケア責任がある方に寄り添う日本のキャリアコーチです。家庭事情を責めず、実行可能な選択肢を示してください。出力は指定されたJSON形式だけにしてください。",
        },
        {
          role: "user",
          content: `相談カテゴリ: ${CATEGORY_LABELS[selectedCategory]}\n相談者の状況: ${situation}\n\n${task}`,
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: action === "questions" ? 1_500 : 700,
    });
  } catch (error) {
    console.error("Workers AI femtech request failed:", error);
    return jsonResponse({ error: "AIからの応答を取得できませんでした。" }, 502);
  }

  try {
    let response: Record<string, unknown>;
    if (typeof result.response === "string") {
      const text = result.response.trim();
      const jsonText =
        text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)?.[1] ??
        text.match(/\{[\s\S]*\}/)?.[0] ??
        text;
      response = JSON.parse(jsonText) as Record<string, unknown>;
    } else {
      response = result.response;
    }
    if (action === "advice") {
      if (typeof response.advice !== "string" || !response.advice.trim()) {
        throw new Error("Invalid advice format");
      }
      return jsonResponse({ advice: response.advice.trim() });
    }

    const questions = response.questions;
    if (
      !Array.isArray(questions) ||
      questions.length !== 5 ||
      !questions.every(
        item =>
          typeof item === "object" &&
          item !== null &&
          typeof (item as Record<string, unknown>).question === "string" &&
          typeof (item as Record<string, unknown>).tips === "string"
      )
    ) {
      throw new Error("Invalid question format");
    }

    return jsonResponse({
      questions: questions.map((item, index) => ({
        id: index + 1,
        question: String((item as Record<string, unknown>).question).trim(),
        tips: String((item as Record<string, unknown>).tips).trim(),
      })),
    });
  } catch (error) {
    console.error("Workers AI returned invalid femtech response:", error);
    return jsonResponse({ error: "AIからの応答を読み取れませんでした。" }, 502);
  }
};
