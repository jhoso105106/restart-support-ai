export type HistoryType = "mood" | "interview" | "counseling";

export type MoodHistoryItem = {
  id: number;
  type: "mood";
  mood: number;
  comment: string;
  createdAt: string;
};

export type InterviewHistoryItem = {
  id: number;
  type: "interview";
  question: string;
  answer: string;
  score: number | null;
  createdAt: string;
};

export type CounselingHistoryItem = {
  id: number;
  type: "counseling";
  consultation: string;
  advice: string;
  createdAt: string;
};

export type HistoryItem =
  | MoodHistoryItem
  | InterviewHistoryItem
  | CounselingHistoryItem;

const STORAGE_KEY = "restart-support-history-user-id";
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const getHistoryUserId = (): string => {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored && UUID_PATTERN.test(stored)) return stored.toLowerCase();

  const generated = window.crypto.randomUUID();
  window.localStorage.setItem(STORAGE_KEY, generated);
  return generated;
};

const requestHistory = async <T>(
  path: string,
  init?: RequestInit
): Promise<T> => {
  let userId: string;
  try {
    userId = getHistoryUserId();
  } catch {
    throw new Error("ブラウザの履歴識別子を保存できませんでした。");
  }

  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-User-Id": userId,
      ...init?.headers,
    },
  });
  const responseText = await response.text();
  let result: unknown;
  try {
    result = JSON.parse(responseText);
  } catch {
    throw new Error(`履歴APIから不正な応答が返されました（HTTP ${response.status}）`);
  }

  if (!response.ok) {
    const message =
      typeof result === "object" &&
      result !== null &&
      "error" in result &&
      typeof result.error === "object" &&
      result.error !== null &&
      "message" in result.error &&
      typeof result.error.message === "string"
        ? result.error.message
        : "履歴APIの処理に失敗しました。";
    throw new Error(message);
  }

  return result as T;
};

export const getHistory = async (
  type: HistoryType | "all" = "all",
  limit = 50
): Promise<HistoryItem[]> => {
  const search = new URLSearchParams({ type, limit: String(limit) });
  const result = await requestHistory<{ items: HistoryItem[] }>(
    `/api/history?${search}`
  );
  return result.items;
};

export const saveMoodHistory = async (mood: number, comment: string) =>
  requestHistory<{ success: true; id?: number }>("/api/history", {
    method: "POST",
    body: JSON.stringify({ type: "mood", mood, comment }),
  });

export const saveCounselingHistory = async (
  consultation: string,
  advice: string
) =>
  requestHistory<{ success: true; id?: number }>("/api/history", {
    method: "POST",
    body: JSON.stringify({ type: "counseling", consultation, advice }),
  });
