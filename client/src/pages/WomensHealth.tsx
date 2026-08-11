import { useEffect, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Trash2, Heart, Briefcase } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

const SYMPTOMS = [
  "cramps",
  "headache",
  "bloating",
  "fatigue",
  "mood_changes",
  "back_pain",
  "nausea",
];

const SYMPTOM_LABELS: Record<string, string> = {
  cramps: "月経痛",
  headache: "頭痛",
  bloating: "むくみ",
  fatigue: "疲労感",
  mood_changes: "気分の変化",
  back_pain: "腰痛",
  nausea: "吐き気",
};

const CAREER_CATEGORIES = [
  { value: "child_rearing", label: "育児との両立支援" },
  { value: "career_resume", label: "キャリア再開支援" },
  { value: "work_life_balance", label: "仕事と生活のバランス" },
  { value: "interview_for_mothers", label: "母親向けの面接対策" },
];

export default function WomensHealth() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const isMothersInterview =
    new URLSearchParams(window.location.search).get("category") ===
    "interview_for_mothers";
  const [activeTab, setActiveTab] = useState<"menstrual" | "career">(
    isMothersInterview ? "career" : "menstrual"
  );

  // Menstrual cycle state
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [flow, setFlow] = useState<"light" | "moderate" | "heavy">("moderate");
  const [mood, setMood] = useState("");
  const [notes, setNotes] = useState("");

  // Career advice state
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

  useEffect(() => {
    setCareerQuestions([]);
    setCareerAdvice("");
  }, [selectedCategory]);

  // Queries
  const { data: cyclesData, isLoading: isLoadingCycles, refetch: refetchCycles } =
    trpc.femtech.getMenstrualCycles.useQuery();

  const { data: careerSupportData, isLoading: isLoadingCareer } =
    trpc.femtech.getCareerSupport.useQuery();

  // Mutations
  const createCycleMutation = trpc.femtech.createMenstrualCycle.useMutation({
    onSuccess: () => {
      toast.success("月経周期を記録しました");
      setStartDate("");
      setEndDate("");
      setSelectedSymptoms([]);
      setFlow("moderate");
      setMood("");
      setNotes("");
      refetchCycles();
    },
    onError: () => {
      toast.error("月経周期の記録に失敗しました");
    },
  });

  const deleteCycleMutation = trpc.femtech.deleteMenstrualCycle.useMutation({
    onSuccess: () => {
      toast.success("記録を削除しました");
      refetchCycles();
    },
    onError: () => {
      toast.error("削除に失敗しました");
    },
  });

  const cycles = cyclesData?.cycles || [];
  const careerSupport = careerSupportData?.support || [];

  const handleCreateCycle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate) {
      toast.error("開始日を入力してください");
      return;
    }

    createCycleMutation.mutate({
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      symptoms: selectedSymptoms.length > 0 ? selectedSymptoms : undefined,
      flow: flow as "light" | "moderate" | "heavy",
      mood: mood || undefined,
      notes: notes || undefined,
    });
  };

  const requestCareerSupport = async (action: "advice" | "questions") => {
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
    let result: {
      advice?: string;
      questions?: Array<{ id: number; question: string; tips: string }>;
      error?: string;
    };
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
      toast.success("アドバイスを生成しました");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "アドバイス生成に失敗しました");
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
      toast.error(error instanceof Error ? error.message : "質問の生成に失敗しました");
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  return (
    <div className="min-h-screen bg-background sacred-geometry-bg">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex min-h-16 items-center justify-between gap-2 py-3">
          <h1 className="min-w-0 text-lg font-bold leading-tight text-primary sm:text-2xl">
            女性のための総合サポート
          </h1>
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0"
            onClick={() => navigate("/")}
          >
            ホームに戻る
          </Button>
        </div>
      </header>

      <div className="container py-12">
        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8 border-b border-border">
          <button
            onClick={() => setActiveTab("menstrual")}
            className={`pb-4 px-4 font-medium transition-colors ${
              activeTab === "menstrual"
                ? "text-accent border-b-2 border-accent"
                : "text-foreground/60 hover:text-foreground"
            }`}
          >
            <Heart className="inline mr-2 w-4 h-4" />
            月経周期管理
          </button>
          <button
            onClick={() => setActiveTab("career")}
            className={`pb-4 px-4 font-medium transition-colors ${
              activeTab === "career"
                ? "text-accent border-b-2 border-accent"
                : "text-foreground/60 hover:text-foreground"
            }`}
          >
            <Briefcase className="inline mr-2 w-4 h-4" />
            キャリア支援
          </button>
        </div>

        {/* Menstrual Cycle Tab */}
        {activeTab === "menstrual" && (
          <div className="space-y-8">
            {/* Form Card */}
            <Card>
              <CardHeader>
                <CardTitle>月経周期を記録</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateCycle} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startDate">開始日</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="endDate">終了日（オプション）</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>経血の量</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {["light", "moderate", "heavy"].map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => setFlow(f as "light" | "moderate" | "heavy")}
                          className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                            flow === f
                              ? "border-accent bg-accent/10"
                              : "border-border hover:border-accent/50"
                          }`}
                        >
                          {f === "light" && "少ない"}
                          {f === "moderate" && "普通"}
                          {f === "heavy" && "多い"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>症状（複数選択可）</Label>
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      {SYMPTOMS.map((symptom) => (
                        <div
                          key={symptom}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={symptom}
                            checked={selectedSymptoms.includes(symptom)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedSymptoms([...selectedSymptoms, symptom]);
                              } else {
                                setSelectedSymptoms(
                                  selectedSymptoms.filter((s) => s !== symptom)
                                );
                              }
                            }}
                          />
                          <Label
                            htmlFor={symptom}
                            className="font-normal cursor-pointer"
                          >
                            {SYMPTOM_LABELS[symptom]}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="mood">気分</Label>
                    <Input
                      id="mood"
                      placeholder="e.g., 不安定、疲れた、良い"
                      value={mood}
                      onChange={(e) => setMood(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="notes">メモ</Label>
                    <Textarea
                      id="notes"
                      placeholder="その他の情報や詳細"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={createCycleMutation.isPending}
                    className="w-full"
                  >
                    {createCycleMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                        記録中...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 w-4 h-4" />
                        月経周期を記録
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Cycles List */}
            <Card>
              <CardHeader>
                <CardTitle>月経周期の履歴</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingCycles ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
                    <p className="text-foreground/70">読み込み中...</p>
                  </div>
                ) : cycles.length === 0 ? (
                  <p className="text-foreground/70 text-center py-8">
                    月経周期の記録がまだありません
                  </p>
                ) : (
                  <div className="space-y-4">
                    {cycles.map((cycle: any) => (
                      <div
                        key={cycle.id}
                        className="p-4 border border-border rounded-lg space-y-2"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-foreground">
                              {new Date(cycle.startDate).toLocaleDateString(
                                "ja-JP"
                              )}{" "}
                              開始
                            </p>
                            {cycle.endDate && (
                              <p className="text-sm text-foreground/70">
                                終了:{" "}
                                {new Date(cycle.endDate).toLocaleDateString(
                                  "ja-JP"
                                )}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteCycleMutation.mutate({ id: cycle.id })}
                            disabled={deleteCycleMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>

                        {cycle.flow && (
                          <p className="text-sm text-foreground/80">
                            経血の量: {cycle.flow}
                          </p>
                        )}

                        {cycle.symptoms && (
                          <div className="flex flex-wrap gap-1">
                            {JSON.parse(cycle.symptoms).map((symptom: string) => (
                              <span
                                key={symptom}
                                className="inline-block px-2 py-1 bg-accent/10 text-accent rounded-full text-xs"
                              >
                                {SYMPTOM_LABELS[symptom] || symptom}
                              </span>
                            ))}
                          </div>
                        )}

                        {cycle.mood && (
                          <p className="text-sm text-foreground/80">
                            気分: {cycle.mood}
                          </p>
                        )}

                        {cycle.notes && (
                          <p className="text-sm text-foreground/70 italic">
                            {cycle.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Career Support Tab */}
        {activeTab === "career" && (
          <div className="space-y-8">
            {/* Advice Generation Card */}
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
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="mt-2 w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                    >
                      {CAREER_CATEGORIES.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="careerContext">詳しい状況（オプション）</Label>
                    <Textarea
                      id="careerContext"
                      placeholder="e.g., 子どもが3歳で、週3回の柔軟な勤務体制を探しています"
                      value={careerContext}
                      onChange={(e) => setCareerContext(e.target.value)}
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
                          <Loader2 className="mr-2 w-4 h-4 animate-spin" />
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
                          <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                          質問を生成中...
                        </>
                      ) : (
                        selectedCategory === "interview_for_mothers"
                          ? "母親向けの面接質問を生成"
                          : "相談内容に合う質問を生成"
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {careerAdvice && (
              <Card>
                <CardHeader>
                  <CardTitle>AIからのアドバイス</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap leading-relaxed text-foreground/80">
                    {careerAdvice}
                  </p>
                </CardContent>
              </Card>
            )}

            {careerQuestions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>生成された質問</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {careerQuestions.map((item) => (
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

            {/* Career Support History */}
            <Card>
              <CardHeader>
                <CardTitle>受け取ったアドバイス</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingCareer ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
                    <p className="text-foreground/70">読み込み中...</p>
                  </div>
                ) : careerSupport.length === 0 ? (
                  <p className="text-foreground/70 text-center py-8">
                    アドバイスの履歴がまだありません
                  </p>
                ) : (
                  <div className="space-y-4">
                    {careerSupport.map((item: any) => (
                      <div
                        key={item.id}
                        className="p-4 border border-border rounded-lg space-y-2"
                      >
                        <p className="font-medium text-accent">
                          {CAREER_CATEGORIES.find((c) => c.value === item.category)?.label}
                        </p>
                        <p className="text-foreground/80 whitespace-pre-wrap leading-relaxed">
                          {item.content}
                        </p>
                        <p className="text-xs text-foreground/50">
                          {new Date(item.createdAt).toLocaleDateString("ja-JP")}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
