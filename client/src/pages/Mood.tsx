import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  getHistory,
  saveMoodHistory,
  type MoodHistoryItem,
} from "@/lib/history-api";
import { Loader2, AlertTriangle, Heart } from "lucide-react";
import { useLocation } from "wouter";
import KokoroHeader from "@/components/KokoroHeader";

type Step = "mood-select" | "situation" | "response" | "crisis";

const MOOD_OPTIONS = [
  { level: 5, label: "とても良い", emoji: "😊", color: "bg-green-100" },
  { level: 4, label: "良い", emoji: "🙂", color: "bg-blue-100" },
  { level: 3, label: "普通", emoji: "😐", color: "bg-yellow-100" },
  { level: 2, label: "悪い", emoji: "😔", color: "bg-orange-100" },
  { level: 1, label: "とても悪い", emoji: "😢", color: "bg-red-100" },
];

const CONTEXT_OPTIONS = [
  "before_interview",
  "after_rejection",
  "daily_check",
  "other",
];

const CONTEXT_LABELS: Record<string, string> = {
  before_interview: "面接前",
  after_rejection: "不採用後",
  daily_check: "日々のチェック",
  other: "その他",
};

export default function Mood() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState<Step>("mood-select");
  const [moodLevel, setMoodLevel] = useState(3);
  const [moodText, setMoodText] = useState("");
  const [context, setContext] = useState("daily_check");
  const [situation, setSituation] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [suggestedAction, setSuggestedAction] = useState("");
  const [crisisDetected, setCrisisDetected] = useState(false);
  const [crisisResources, setCrisisResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [history, setHistory] = useState<MoodHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState("");

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError("");
    try {
      const items = await getHistory("mood", 5);
      setHistory(items.filter((item): item is MoodHistoryItem => item.type === "mood"));
    } catch (error) {
      setHistoryError(
        error instanceof Error ? error.message : "気分履歴を取得できませんでした。"
      );
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const handleCheckMood = async () => {
    if (!situation.trim()) {
      setErrorMessage("今の気持ちを入力してください。");
      return;
    }

    setErrorMessage("");
    setLoading(true);
    try {
      const response = await fetch("/api/mood/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moodLevel,
          moodText: moodText || undefined,
          context,
          situation,
        }),
      });
      const responseText = await response.text();
      let result: {
        crisisDetected?: boolean;
        resources?: Array<{ name: string; phone: string; hours: string }>;
        aiResponse?: string;
        suggestedAction?: string;
        error?: string;
      };
      try {
        result = JSON.parse(responseText);
      } catch {
        throw new Error(`AI傾聴に失敗しました（HTTP ${response.status}）`);
      }

      if (!response.ok) {
        throw new Error(result.error || "AI傾聴に失敗しました。");
      }

      if (result.crisisDetected && result.resources) {
        setCrisisDetected(true);
        setCrisisResources(result.resources || []);
        setStep("crisis");
      } else if (result.aiResponse && result.suggestedAction) {
        setAiResponse(result.aiResponse || "");
        setSuggestedAction(result.suggestedAction || "rest");
        setStep("response");
        try {
          await saveMoodHistory(moodLevel, situation);
          await loadHistory();
        } catch (historySaveError) {
          setHistoryError(
            historySaveError instanceof Error
              ? historySaveError.message
              : "気分履歴を保存できませんでした。"
          );
        }
      } else {
        throw new Error(result.error || "AI傾聴に失敗しました。");
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "AI傾聴に失敗しました。"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = () => {
    switch (suggestedAction) {
      case "practice_interview":
        navigate("/interview");
        break;
      case "consult_window":
        // Navigate to support with a recommended highlight and reason for demo clarity
        // Use a sensible default recommended resource id present in our static data
        navigate(`/support?highlight=${encodeURIComponent("tokyo-central-mental-health-center")}&reason=${encodeURIComponent("あなたの相談内容に基づき、この窓口をおすすめしています")}`);
        break;
      case "community_activity":
        navigate("/support?category=community");
        break;
      default:
        navigate("/dashboard");
    }
  };

  if (crisisDetected) {
    return (
      <div className="min-h-screen bg-background sacred-geometry-bg">
        <KokoroHeader />

        <div className="container py-12">
          <Card className="max-w-2xl mx-auto border-red-200 bg-red-50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-8 h-8 text-red-600" />
                <CardTitle className="text-red-900">
                  あなたの安全が最優先です
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-red-800">
                今、あなたは苦しい状態にあるようです。一人で抱え込まないでください。
                以下の窓口に、すぐにご相談ください。
              </p>

              <div className="space-y-3">
                {crisisResources.map((resource, idx) => (
                  <div
                    key={idx}
                    className="bg-white p-4 rounded-lg border border-red-200"
                  >
                    <h4 className="font-semibold text-foreground mb-2">
                      {resource.name}
                    </h4>
                    <p className="text-sm text-foreground/70 mb-2">
                      {resource.hours}
                    </p>
                    <a
                      href={`tel:${resource.phone}`}
                      className="text-red-600 font-semibold hover:underline"
                    >
                      📞 {resource.phone}
                    </a>
                  </div>
                ))}
              </div>

              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <p className="text-sm text-blue-900">
                  💙 あなたの命は大切です。
                  <br />
                  今この瞬間、専門家に話を聞いてもらうことで、
                  <br />
                  状況は必ず変わります。
                </p>
              </div>

              <Button
                className="w-full"
                variant="outline"
                onClick={() => navigate("/")}
              >
                ホームに戻る
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background sacred-geometry-bg">
      <KokoroHeader><Button variant="outline" onClick={() => navigate("/history")}>履歴</Button></KokoroHeader>

      <div className="container py-12">
        {step === "mood-select" && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>今のあなたの気分は？</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-5 gap-3">
                {MOOD_OPTIONS.map((option) => (
                  <button
                    key={option.level}
                    onClick={() => {
                      setMoodLevel(option.level);
                      setStep("situation");
                    }}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      moodLevel === option.level
                        ? "border-accent bg-accent/10"
                        : "border-border hover:border-accent/50"
                    }`}
                  >
                    <div className="text-3xl mb-2">{option.emoji}</div>
                    <div className="text-xs font-medium text-foreground">
                      {option.label}
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {step === "situation" && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>状況を教えてください</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  どのような時ですか？
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {CONTEXT_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setContext(opt)}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        context === opt
                          ? "border-accent bg-accent/10"
                          : "border-border hover:border-accent/50"
                      }`}
                    >
                      {CONTEXT_LABELS[opt]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  今の気持ちを教えてください *
                </label>
                <Textarea
                  placeholder="例：何社も落ちて、自分には価値がない気がする..."
                  value={situation}
                  onChange={(e) => setSituation(e.target.value)}
                  rows={5}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  気分の一言（任意）
                </label>
                <input
                  type="text"
                  placeholder="例：不安、落ち込み、疲れた..."
                  value={moodText}
                  onChange={(e) => setMoodText(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg"
                />
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleCheckMood}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    処理中...
                  </>
                ) : (
                  <>
                    <Heart className="w-4 h-4 mr-2" />
                    AI傾聴を受ける
                  </>
                )}
              </Button>
              {errorMessage && (
                <p className="text-sm text-destructive" role="alert">
                  {errorMessage}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {step === "response" && aiResponse && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>AIからのメッセージ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-card/50 p-6 rounded-lg border border-border whitespace-pre-wrap">
                {aiResponse}
              </div>

              <div className="bg-accent/10 border border-accent/30 p-4 rounded-lg">
                <p className="text-sm font-semibold text-foreground mb-2">
                  💡 次のステップ
                </p>
                <p className="text-sm text-foreground/80">
                  {suggestedAction === "practice_interview" &&
                    "面接練習を通じて、自信をつけるお手伝いをします。"}
                  {suggestedAction === "consult_window" &&
                    "専門家の相談窓口をご紹介します。"}
                  {suggestedAction === "community_activity" &&
                    "地域の活動や居場所を探してみませんか？"}
                  {suggestedAction === "rest" &&
                    "今は無理をせず、ゆっくり休むことも大切です。"}
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  className="flex-1"
                  variant="outline"
                  onClick={() => {
                    setStep("mood-select");
                    setSituation("");
                    setMoodText("");
                  }}
                >
                  もう一度チェック
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleActionClick}
                >
                  次のステップへ
                </Button>
              </div>
              <div className="rounded-xl border border-green-800/20 bg-green-50/70 p-4">
                <p className="mb-3 text-sm leading-6">医療機関への相談も選択肢の一つです。希望する場合は、東京都の公式データから精神科・心療内科を探せます。</p>
                <Button className="w-full" variant="outline" onClick={() => navigate("/medical-support")}>
                  精神科・心療内科を探す
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="max-w-2xl mx-auto mt-8">
          <CardHeader>
            <CardTitle>最近の気分チェック</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-xs text-foreground/60">
              このブラウザに保存された識別子に紐づく直近5件です。
            </p>
            {historyLoading ? (
              <div className="flex items-center justify-center gap-2 py-6 text-foreground/70">
                <Loader2 className="h-4 w-4 animate-spin" />
                読み込み中...
              </div>
            ) : historyError ? (
              <div className="space-y-3 py-4 text-center">
                <p className="text-sm text-destructive" role="alert">
                  {historyError}
                </p>
                <Button variant="outline" size="sm" onClick={() => void loadHistory()}>
                  再読み込み
                </Button>
              </div>
            ) : history.length === 0 ? (
              <p className="py-6 text-center text-sm text-foreground/70">
                気分チェックの履歴はまだありません。
              </p>
            ) : (
              <div className="space-y-3">
                {history.map(item => (
                  <div key={item.id} className="rounded-lg border border-border p-4">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="font-medium">気分 {item.mood}/5</span>
                      <time className="text-xs text-foreground/60">
                        {new Date(`${item.createdAt}Z`).toLocaleString("ja-JP")}
                      </time>
                    </div>
                    <p className="whitespace-pre-wrap text-sm text-foreground/80">
                      {item.comment}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
