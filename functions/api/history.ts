type HistoryType = "mood" | "interview" | "counseling";

type D1Result<T> = {
  results: T[];
  success: boolean;
};

type D1PreparedStatement = {
  bind(...values: unknown[]): D1PreparedStatement;
  all<T>(): Promise<D1Result<T>>;
  run(): Promise<{ success: boolean; meta?: { last_row_id?: number } }>;
};

type D1Database = {
  prepare(query: string): D1PreparedStatement;
  batch(
    statements: D1PreparedStatement[]
  ): Promise<Array<{ success: boolean; meta?: { last_row_id?: number } }>>;
};

type Env = {
  DB?: D1Database;
};

type PagesContext = {
  request: Request;
  env: Env;
};

type MoodRow = {
  id: number;
  mood: number;
  comment: string;
  created_at: string;
};

type InterviewRow = {
  id: number;
  question: string;
  answer: string;
  score: number | null;
  created_at: string;
};

type CounselingRow = {
  id: number;
  consultation: string;
  advice: string;
  created_at: string;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const HISTORY_TYPES: HistoryType[] = ["mood", "interview", "counseling"];

const jsonResponse = (body: unknown, status = 200) =>
  Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });

const errorResponse = (code: string, message: string, status: number) =>
  jsonResponse({ error: { code, message } }, status);

const getUserId = (request: Request): string | null => {
  const value = request.headers.get("X-User-Id")?.trim() ?? "";
  return UUID_PATTERN.test(value) ? value.toLowerCase() : null;
};

const parseLimit = (url: URL): number => {
  const requested = Number(url.searchParams.get("limit") ?? "50");
  if (!Number.isInteger(requested) || requested < 1) return 50;
  return Math.min(requested, 100);
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNonEmptyString = (
  value: unknown,
  maximumLength: number
): value is string =>
  typeof value === "string" &&
  value.trim().length > 0 &&
  value.length <= maximumLength;

const ensureUserStatement = (db: D1Database, userId: string) =>
  db
    .prepare("INSERT OR IGNORE INTO users (id, name) VALUES (?, ?)")
    .bind(userId, "匿名ユーザー");

const getMoodHistory = async (
  db: D1Database,
  userId: string,
  limit: number
) => {
  const result = await db
    .prepare(
      `SELECT id, mood, comment, created_at
       FROM mood_logs
       WHERE user_id = ?
       ORDER BY created_at DESC, id DESC
       LIMIT ?`
    )
    .bind(userId, limit)
    .all<MoodRow>();

  return result.results.map(row => ({
    id: row.id,
    type: "mood" as const,
    mood: row.mood,
    comment: row.comment,
    createdAt: row.created_at,
  }));
};

const getInterviewHistory = async (
  db: D1Database,
  userId: string,
  limit: number
) => {
  const result = await db
    .prepare(
      `SELECT id, question, answer, score, created_at
       FROM interview_history
       WHERE user_id = ?
       ORDER BY created_at DESC, id DESC
       LIMIT ?`
    )
    .bind(userId, limit)
    .all<InterviewRow>();

  return result.results.map(row => ({
    id: row.id,
    type: "interview" as const,
    question: row.question,
    answer: row.answer,
    score: row.score,
    createdAt: row.created_at,
  }));
};

const getCounselingHistory = async (
  db: D1Database,
  userId: string,
  limit: number
) => {
  const result = await db
    .prepare(
      `SELECT id, consultation, advice, created_at
       FROM counseling_history
       WHERE user_id = ?
       ORDER BY created_at DESC, id DESC
       LIMIT ?`
    )
    .bind(userId, limit)
    .all<CounselingRow>();

  return result.results.map(row => ({
    id: row.id,
    type: "counseling" as const,
    consultation: row.consultation,
    advice: row.advice,
    createdAt: row.created_at,
  }));
};

export const onRequestGet = async ({
  request,
  env,
}: PagesContext): Promise<Response> => {
  if (!env.DB) {
    return errorResponse(
      "DB_BINDING_UNAVAILABLE",
      "履歴データベースを利用できません。",
      503
    );
  }

  const userId = getUserId(request);
  if (!userId) {
    return errorResponse(
      "INVALID_USER_ID",
      "ブラウザ識別子が正しくありません。",
      400
    );
  }

  const url = new URL(request.url);
  const requestedType = url.searchParams.get("type") ?? "all";
  if (requestedType !== "all" && !HISTORY_TYPES.includes(requestedType as HistoryType)) {
    return errorResponse("INVALID_TYPE", "履歴の種類が正しくありません。", 400);
  }

  const limit = parseLimit(url);

  try {
    if (requestedType === "mood") {
      return jsonResponse({ items: await getMoodHistory(env.DB, userId, limit) });
    }
    if (requestedType === "interview") {
      return jsonResponse({
        items: await getInterviewHistory(env.DB, userId, limit),
      });
    }
    if (requestedType === "counseling") {
      return jsonResponse({
        items: await getCounselingHistory(env.DB, userId, limit),
      });
    }

    const groupedItems = await Promise.all([
      getMoodHistory(env.DB, userId, limit),
      getInterviewHistory(env.DB, userId, limit),
      getCounselingHistory(env.DB, userId, limit),
    ]);
    const items = groupedItems
      .flat()
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .slice(0, limit);

    return jsonResponse({ items });
  } catch (error) {
    console.error("D1 history query failed:", error);
    return errorResponse(
      "HISTORY_QUERY_FAILED",
      "履歴を取得できませんでした。",
      500
    );
  }
};

export const onRequestPost = async ({
  request,
  env,
}: PagesContext): Promise<Response> => {
  if (!env.DB) {
    return errorResponse(
      "DB_BINDING_UNAVAILABLE",
      "履歴データベースを利用できません。",
      503
    );
  }

  const userId = getUserId(request);
  if (!userId) {
    return errorResponse(
      "INVALID_USER_ID",
      "ブラウザ識別子が正しくありません。",
      400
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return errorResponse(
      "INVALID_JSON",
      "リクエストの形式が正しくありません。",
      400
    );
  }

  if (!isRecord(payload) || !HISTORY_TYPES.includes(payload.type as HistoryType)) {
    return errorResponse("INVALID_TYPE", "履歴の種類が正しくありません。", 400);
  }

  try {
    if (payload.type === "mood") {
      if (
        !Number.isInteger(payload.mood) ||
        Number(payload.mood) < 1 ||
        Number(payload.mood) > 5 ||
        !isNonEmptyString(payload.comment, 4_000)
      ) {
        return errorResponse(
          "INVALID_INPUT",
          "気分履歴の入力内容を確認してください。",
          400
        );
      }

      const results = await env.DB.batch([
        ensureUserStatement(env.DB, userId),
        env.DB
          .prepare(
            "INSERT INTO mood_logs (user_id, mood, comment) VALUES (?, ?, ?)"
          )
          .bind(userId, payload.mood, payload.comment.trim()),
      ]);
      const id = results[1]?.meta?.last_row_id;
      return jsonResponse({ success: true, id }, 201);
    }

    if (payload.type === "counseling") {
      if (
        !isNonEmptyString(payload.consultation, 4_000) ||
        !isNonEmptyString(payload.advice, 10_000)
      ) {
        return errorResponse(
          "INVALID_INPUT",
          "相談履歴の入力内容を確認してください。",
          400
        );
      }

      const results = await env.DB.batch([
        ensureUserStatement(env.DB, userId),
        env.DB
          .prepare(
            `INSERT INTO counseling_history
             (user_id, consultation, advice)
             VALUES (?, ?, ?)`
          )
          .bind(
            userId,
            payload.consultation.trim(),
            payload.advice.trim()
          ),
      ]);
      const id = results[1]?.meta?.last_row_id;
      return jsonResponse({ success: true, id }, 201);
    }

    if (!Array.isArray(payload.items) || payload.items.length < 1 || payload.items.length > 20) {
      return errorResponse(
        "INVALID_INPUT",
        "面接履歴は1件以上20件以下で指定してください。",
        400
      );
    }

    const interviewItems = payload.items;
    const validItems = interviewItems.every(item => {
      if (!isRecord(item)) return false;
      const scoreIsValid =
        item.score === null ||
        item.score === undefined ||
        (Number.isInteger(item.score) && Number(item.score) >= 0 && Number(item.score) <= 5);
      return (
        isNonEmptyString(item.question, 4_000) &&
        isNonEmptyString(item.answer, 10_000) &&
        scoreIsValid
      );
    });
    if (!validItems) {
      return errorResponse(
        "INVALID_INPUT",
        "面接履歴の入力内容を確認してください。",
        400
      );
    }

    const statements = interviewItems.map(item => {
      const record = item as Record<string, unknown>;
      return env.DB!.prepare(
        `INSERT INTO interview_history
         (user_id, question, answer, score)
         VALUES (?, ?, ?, ?)`
      ).bind(
        userId,
        String(record.question).trim(),
        String(record.answer).trim(),
        record.score ?? null
      );
    });
    await env.DB.batch([ensureUserStatement(env.DB, userId), ...statements]);
    return jsonResponse({ success: true, count: statements.length }, 201);
  } catch (error) {
    console.error("D1 history insert failed:", error);
    return errorResponse(
      "HISTORY_SAVE_FAILED",
      "履歴を保存できませんでした。",
      500
    );
  }
};
