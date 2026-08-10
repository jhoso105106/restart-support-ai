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

type MoodResponse = {
  message: string;
  suggestedAction: "practice_interview" | "consult_window" | "community_activity" | "rest";
};

const MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
const MAX_SITUATION_LENGTH = 4_000;
const CRISIS_KEYWORDS = ["自殺", "死", "消えたい", "終わりにしたい", "自傷", "傷つけたい"];

const jsonResponse = (body: unknown, status = 200) =>
  Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });

const isMoodResponse = (value: unknown): value is MoodResponse => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const response = value as Record<string, unknown>;
  return (
    typeof response.message === "string" &&
    response.message.trim().length > 0 &&
    ["practice_interview", "consult_window", "community_activity", "rest"].includes(
      String(response.suggestedAction)
    )
  );
};

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

  const { moodLevel, moodText, context, situation } = payload as Record<string, unknown>;
  if (
    typeof moodLevel !== "number" ||
    moodLevel < 1 ||
    moodLevel > 5 ||
    typeof situation !== "string" ||
    situation.trim().length === 0 ||
    situation.length > MAX_SITUATION_LENGTH ||
    (moodText !== undefined && typeof moodText !== "string") ||
    (context !== undefined && typeof context !== "string")
  ) {
    return jsonResponse({ error: "入力内容を確認してください。" }, 400);
  }

  if (CRISIS_KEYWORDS.some(keyword => situation.includes(keyword))) {
    return jsonResponse({
      crisisDetected: true,
      resources: [
        { name: "厚生労働省 相談窓口", phone: "0570-064-556", hours: "24時間" },
        { name: "よりそいホットライン", phone: "0120-279-556", hours: "24時間" },
        { name: "いのちの電話", phone: "0570-783-556", hours: "24時間" },
      ],
    });
  }

  if (!env.AI || typeof env.AI.run !== "function") {
    return jsonResponse({ error: "AIサービスを利用できません。" }, 503);
  }

  let result: { response: string };
  try {
    result = await env.AI.run(MODEL, {
      messages: [
        {
          role: "system",
          content:
            "あなたは50代以上の求職者に寄り添う日本のキャリアコーチです。相談者の気持ちを否定せず、短く温かく応答してください。診断・治療は行わず、緊急時の案内も行いません。指定されたJSON形式だけを返してください。",
        },
        {
          role: "user",
          content: `気分レベル: ${moodLevel}/5
きっかけ: ${typeof context === "string" ? context : "日々のチェック"}
気分の一言: ${typeof moodText === "string" && moodText.trim() ? moodText.trim() : "指定なし"}
状況: ${situation.trim()}

120文字以内で共感的なメッセージを作成し、次の行動を1つ選んでください。
suggestedAction は practice_interview, consult_window, community_activity, rest のいずれかです。

{"message":"メッセージ","suggestedAction":"rest"}`,
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 400,
    });
  } catch (error) {
    console.error("Workers AI mood request failed:", error);
    return jsonResponse({ error: "AIからの応答を取得できませんでした。" }, 502);
  }

  try {
    const response = JSON.parse(result.response) as unknown;
    if (!isMoodResponse(response)) {
      throw new Error("Invalid response format");
    }

    return jsonResponse({
      crisisDetected: false,
      aiResponse: response.message.trim(),
      suggestedAction: response.suggestedAction,
    });
  } catch (error) {
    console.error("Workers AI returned invalid mood response:", error);
    return jsonResponse({ error: "AIからの応答を読み取れませんでした。" }, 502);
  }
};
