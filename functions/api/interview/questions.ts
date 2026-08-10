type InterviewQuestion = {
  id: number;
  question: string;
  tips: string;
};

type WorkersAi = {
  run(
    model: string,
    input: {
      messages: Array<{ role: "system" | "user"; content: string }>;
      response_format: { type: "json_object" };
      max_tokens: number;
    }
  ): Promise<{ response: string }>;
};

type Env = {
  AI: WorkersAi;
};

type PagesContext = {
  request: Request;
  env: Env;
};

const MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
const MAX_JOB_TITLE_LENGTH = 200;
const MAX_JOB_DESCRIPTION_LENGTH = 6_000;

const isInterviewQuestion = (value: unknown): value is InterviewQuestion => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const question = value as Record<string, unknown>;
  return (
    typeof question.question === "string" &&
    question.question.trim().length > 0 &&
    typeof question.tips === "string" &&
    question.tips.trim().length > 0
  );
};

const jsonResponse = (body: unknown, status = 200) =>
  Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });

export const onRequestPost = async ({
  request,
  env,
}: PagesContext): Promise<Response> => {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ error: "リクエストの形式が正しくありません。" }, 400);
  }

  if (typeof payload !== "object" || payload === null) {
    return jsonResponse({ error: "リクエストの形式が正しくありません。" }, 400);
  }

  const { jobTitle, jobDescription } = payload as Record<string, unknown>;
  if (
    typeof jobTitle !== "string" ||
    jobTitle.trim().length === 0 ||
    jobTitle.length > MAX_JOB_TITLE_LENGTH ||
    (jobDescription !== undefined &&
      (typeof jobDescription !== "string" ||
        jobDescription.length > MAX_JOB_DESCRIPTION_LENGTH))
  ) {
    return jsonResponse({ error: "入力内容を確認してください。" }, 400);
  }

  if (!env.AI || typeof env.AI.run !== "function") {
    console.error("Workers AI binding AI is unavailable");
    return jsonResponse(
      {
        error: "Workers AI binding AI is unavailable.",
        code: "AI_BINDING_UNAVAILABLE",
      },
      500
    );
  }

  let result: { response: string };
  try {
    result = await env.AI.run(MODEL, {
      messages: [
        {
          role: "system",
          content:
            "あなたは50代以上の求職者を支援する日本のキャリアコーチです。応募職種に合わせた、実践的で偏見のない面接質問を作成します。出力は指定されたJSON形式だけにしてください。",
        },
        {
          role: "user",
          content: `以下の応募情報を基に、面接練習用の質問を5件作成してください。

応募職種:
${jobTitle.trim()}

職種の詳細:
${typeof jobDescription === "string" && jobDescription.trim() ? jobDescription.trim() : "指定なし"}

各質問は、経験・スキル・転職理由・新しい環境への適応などをバランスよく扱ってください。各質問に、回答時のポイントを日本語で1つ付けてください。

次のJSONオブジェクトだけを返してください:
{"questions":[{"question":"質問文","tips":"回答のポイント"}]}`,
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 1_500,
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error("Workers AI run failed:", error);
    return jsonResponse(
      {
        error: "Workers AI request failed.",
        code: "AI_RUN_FAILED",
        detail,
      },
      502
    );
  }

  let responseBody: unknown;
  try {
    responseBody = JSON.parse(result.response);
  } catch {
    console.error("Workers AI returned invalid JSON for interview questions");
    return jsonResponse({ error: "質問の生成結果を読み取れませんでした。" }, 502);
  }

  const rawQuestions =
    typeof responseBody === "object" && responseBody !== null
      ? (responseBody as Record<string, unknown>).questions
      : undefined;
  if (
    !Array.isArray(rawQuestions) ||
    rawQuestions.length !== 5 ||
    !rawQuestions.every(isInterviewQuestion)
  ) {
    console.error("Workers AI returned an invalid interview question format");
    return jsonResponse({ error: "質問の生成結果が不正です。" }, 502);
  }

  return jsonResponse({
    questions: rawQuestions.map((question, index) => ({
      id: index + 1,
      question: question.question.trim(),
      tips: question.tips.trim(),
    })),
  });
};
