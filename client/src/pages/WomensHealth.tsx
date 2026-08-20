import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  getHistory,
  saveCounselingHistory,
  type CounselingHistoryItem,
} from "@/lib/history-api";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import KokoroHeader from "@/components/KokoroHeader";
import KokoroLetter from "@/components/KokoroLetter";
import { trpc } from "@/lib/trpc";

const CAREER_CATEGORIES = [
  { value: "child_rearing", label: "育児との両立支援" },
  { value: "career_resume", label: "キャリア再開支援" },
  { value: "work_life_balance", label: "仕事と生活のバランス" },
  { value: "interview_for_mothers", label: "母親向けの面接対策" },
];

type CareerSupportResult = {
  advice?: string;
  questions?: Array<{ id: number; question: string; tips: string }>;
  error?: string;
};

export default function WomensHealth() {
  const [, navigate] = useLocation();
  const isMothersInterview =
    new URLSearchParams(window.location.search).get("category") ===
    "interview_for_mothers";
  const [selectedCategory, setSelectedCategory] = useState(
    isMothersInterview ? "interview_for_mothers" : "child_rearing"
  );
  const [careerContext, setCareerContext] = useState("");
  const [careerQuestions, setCareerQuestions] = useState<
    Array<{ id: number; question: string; tips: string }>
  >([]);
  const [careerAdvice, setCareerAdvice] = useState("");
  const [isGeneratingAdvice, setIsGeneratingAdvice] = useState(false);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [careerHistory, setCareerHistory] = useState<CounselingHistoryItem[]>([]);
  const [isLoadingCareerHistory, setIsLoadingCareerHistory] = useState(true);
  const [careerHistoryError, setCareerHistoryError] = useState("");
  const generateAdviceMutation = trpc.femtech.generateCareerAdvice.useMutation();
  const generateQuestionsMutation = trpc.femtech.generateCareerQuestions.useMutation();

  const loadCareerHistory = useCallback(async () => {
    setIsLoadingCareerHistory(true);
    setCareerHistoryError("");
    try {
      const items = await getHistory("counseling", 10);
      setCareerHistory(
        items.filter(
          (item): item is CounselingHistoryItem => item.type === "counseling"
        )
      );
    } catch (error) {
      setCareerHistoryError(
        error instanceof Error ? error.message : "相談履歴を取得できませんでした"
      );
    } finally {
      setIsLoadingCareerHistory(false);
    }
  }, []);

  useEffect(() => {
    setCareerQuestions([]);
    setCareerAdvice("");
  }, [selectedCategory]);

  useEffect(() => {
    void loadCareerHistory();
  }, [loadCareerHistory]);

  const requestCareerSupport = async (
    action: "advice" | "questions"
  ): Promise<CareerSupportResult> => {
    const response = await fetch("/api/femtech/career", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        category: selectedCategory,
        context: careerContext || undefined,
      }),
    });
    const responseText = await response.text();

    // Cloudflare Pages Functions are not mounted by the Express development
    // server. In that environment, reuse the existing tRPC implementation.
    if (
      response.status === 404 ||
      (import.meta.env.DEV && responseText.trimStart().startsWith("<"))
    ) {
      const input = {
        category: selectedCategory as
          | "child_rearing"
          | "career_resume"
          | "work_life_balance"
          | "interview_for_mothers",
        context: careerContext || undefined,
      };
      if (action === "advice") {
        const fallback = await generateAdviceMutation.mutateAsync(input);
        if (!fallback.success || !fallback.advice) {
          throw new Error(fallback.error || "アドバイスを取得できませんでした");
        }
        return { advice: fallback.advice };
      }

      const fallback = await generateQuestionsMutation.mutateAsync(input);
      if (!fallback.success || !fallback.questions) {
        throw new Error(fallback.error || "質問を取得できませんでした");
      }
      return {
        questions: fallback.questions.map((item, index) => ({
          id: index + 1,
          question: item.question,
          tips: item.tips,
        })),
      };
    }

    let result: CareerSupportResult;
    try {
      result = JSON.parse(responseText);
    } catch {
      throw new Error(`AI応答の取得に失敗しました（HTTP ${response.status}）`);
    }
    if (!response.ok) {
      throw new Error(result.error || "AI応答の取得に失敗しました");
    }
    return result;
  };

  const handleGenerateAdvice = async () => {
    setIsGeneratingAdvice(true);
    try {
      const result = await requestCareerSupport("advice");
      if (!result.advice) throw new Error("アドバイスを取得できませんでした");
      setCareerAdvice(result.advice);
      const categoryLabel =
        CAREER_CATEGORIES.find(category => category.value === selectedCategory)
          ?.label ?? selectedCategory;
      const consultation = careerContext.trim()
        ? `${categoryLabel}\n${careerContext.trim()}`
        : categoryLabel;
      toast.success("アドバイスを生成しました");
      try {
        await saveCounselingHistory(consultation, result.advice);
        await loadCareerHistory();
      } catch (historyError) {
        const message =
          historyError instanceof Error
            ? historyError.message
            : "相談履歴を保存できませんでした";
        setCareerHistoryError(message);
        toast.error(`アドバイスは生成されましたが、${message}`);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "アドバイス生成に失敗しました"
      );
    } finally {
      setIsGeneratingAdvice(false);
    }
  };

  const handleGenerateQuestions = async () => {
    setIsGeneratingQuestions(true);
    try {
      const result = await requestCareerSupport("questions");
      if (!result.questions) throw new Error("質問を取得できませんでした");
      setCareerQuestions(result.questions);
      toast.success("質問を生成しました");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "質問の生成に失敗しました"
      );
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  return (
    <div className="min-h-screen bg-background sacred-geometry-bg">
      <KokoroHeader><Button variant="outline" size="sm" onClick={() => navigate("/history")}>履歴</Button></KokoroHeader>

      <main className="container py-8 sm:py-12">
        <div className="mx-auto max-w-3xl space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>キャリア支援アドバイス</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="category">相談内容</Label>
                  <select
                    id="category"
                    value={selectedCategory}
                    onChange={event => setSelectedCategory(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
                  >
                    {CAREER_CATEGORIES.map(category => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="careerContext">詳しい状況（任意）</Label>
                  <Textarea
                    id="careerContext"
                    placeholder="例：子どもが3歳で、週3回の柔軟な勤務体制を探しています"
                    value={careerContext}
                    onChange={event => setCareerContext(event.target.value)}
                    rows={4}
                  />
                </div>

                <div className="grid gap-3">
                  <Button
                    onClick={handleGenerateAdvice}
                    disabled={isGeneratingAdvice}
                    className="w-full"
                  >
                    {isGeneratingAdvice ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        生成中...
                      </>
                    ) : (
                      "アドバイスを取得"
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleGenerateQuestions}
                    disabled={isGeneratingQuestions}
                    className="w-full"
                  >
                    {isGeneratingQuestions ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        質問を生成中...
                      </>
                    ) : selectedCategory === "interview_for_mothers" ? (
                      "母親向けの面接質問を生成"
                    ) : (
                      "相談内容に合う質問を生成"
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {careerAdvice && (
            <KokoroLetter title="あなたのキャリアに寄せて">
                <p className="whitespace-pre-wrap leading-relaxed text-foreground/80">
                  {careerAdvice}
                </p>
            </KokoroLetter>
          )}

          {careerQuestions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>生成された質問</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {careerQuestions.map(item => (
                    <div key={item.id} className="space-y-2">
                      <p className="font-medium text-foreground">
                        {item.id}. {item.question}
                      </p>
                      <p className="text-sm text-foreground/70">💡 {item.tips}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>受け取ったアドバイス</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-xs text-foreground/60">
                このブラウザに保存された識別子に紐づく履歴です。
              </p>
              {isLoadingCareerHistory ? (
                <div className="py-8 text-center">
                  <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin text-primary" />
                  <p className="text-foreground/70">読み込み中...</p>
                </div>
              ) : careerHistoryError ? (
                <div className="space-y-3 py-4 text-center">
                  <p className="text-sm text-destructive" role="alert">
                    {careerHistoryError}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void loadCareerHistory()}
                  >
                    再読み込み
                  </Button>
                </div>
              ) : careerHistory.length === 0 ? (
                <p className="py-8 text-center text-foreground/70">
                  アドバイスの履歴がまだありません
                </p>
              ) : (
                <div className="space-y-4">
                  {careerHistory.map(item => (
                    <div
                      key={item.id}
                      className="space-y-2 rounded-lg border border-border p-4"
                    >
                      <p className="whitespace-pre-wrap font-medium text-accent">
                        {item.consultation}
                      </p>
                      <p className="whitespace-pre-wrap leading-relaxed text-foreground/80">
                        {item.advice}
                      </p>
                      <p className="text-xs text-foreground/50">
                        {new Date(`${item.createdAt}Z`).toLocaleString("ja-JP")}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
