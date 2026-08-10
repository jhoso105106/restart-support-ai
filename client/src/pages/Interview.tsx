import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ArrowRight, ChevronLeft } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

type Step = "setup" | "questions" | "practice" | "feedback";

export default function Interview() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [step, setStep] = useState<Step>("setup");
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const generateQuestionsMutation = trpc.interview.generateQuestions.useMutation();
  const generateFeedbackMutation = trpc.interview.generateFeedback.useMutation();
  const saveSessionMutation = trpc.interview.saveSession.useMutation();

  const handleGenerateQuestions = async () => {
    if (!jobTitle.trim()) {
      toast.error("職種を入力してください");
      return;
    }

    setLoading(true);
    try {
      const result = await generateQuestionsMutation.mutateAsync({
        jobTitle,
        jobDescription: jobDescription || undefined,
      });

      if (result.success) {
        setQuestions(result.questions);
        setCurrentQuestionIndex(0);
        setAnswer("");
        setFeedback(null);
        setStep("practice");
        toast.success("質問を生成しました");
      } else {
        toast.error(result.error || "質問の生成に失敗しました");
      }
    } catch (error) {
      toast.error("エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateFeedback = async () => {
    if (!answer.trim()) {
      toast.error("回答を入力してください");
      return;
    }

    setLoading(true);
    try {
      const currentQuestion = questions[currentQuestionIndex];
      const result = await generateFeedbackMutation.mutateAsync({
        question: currentQuestion.question,
        answer,
      });

      if (result.success) {
        setFeedback(result.feedback);
        setStep("feedback");
        toast.success("フィードバックを生成しました");
      } else {
        toast.error(result.error || "フィードバックの生成に失敗しました");
      }
    } catch (error) {
      toast.error("エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setAnswer("");
      setFeedback(null);
      setStep("practice");
    } else {
      toast.success("すべての質問が完了しました");
      setStep("questions");
    }
  };

  const handleSaveSession = async () => {
    setLoading(true);
    try {
      const result = await saveSessionMutation.mutateAsync({
        jobTitle,
        jobDescription: jobDescription || undefined,
        questions: JSON.stringify(questions),
        answers: JSON.stringify(
          questions.map((_, i) => (i === currentQuestionIndex ? answer : ""))
        ),
        feedback: JSON.stringify(feedback),
      });

      if (result.success) {
        toast.success("セッションを保存しました");
        navigate("/dashboard");
      } else {
        toast.error(result.error || "セッションの保存に失敗しました");
      }
    } catch (error) {
      toast.error("エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background sacred-geometry-bg">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <h1 className="text-2xl font-bold text-primary">AI面接練習</h1>
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
          >
            ホームに戻る
          </Button>
        </div>
      </header>

      <div className="container py-12">
        {step === "setup" && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>面接練習の準備</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  応募職種 *
                </label>
                <Input
                  placeholder="例：営業職、企画職、システムエンジニア"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  職種の詳細説明（任意）
                </label>
                <Textarea
                  placeholder="求人票から職務内容や要件を貼り付けてください"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  rows={5}
                />
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleGenerateQuestions}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    質問を生成する
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {step === "practice" && questions.length > 0 && (
          <Card className="max-w-3xl mx-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  質問 {currentQuestionIndex + 1}/{questions.length}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep("setup")}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  戻る
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-card/50 p-6 rounded-lg border border-border">
                <p className="text-lg font-semibold text-foreground mb-2">
                  {questions[currentQuestionIndex].question}
                </p>
                {questions[currentQuestionIndex].tips && (
                  <p className="text-sm text-foreground/70 mt-2">
                    💡 {questions[currentQuestionIndex].tips}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  あなたの回答
                </label>
                <Textarea
                  placeholder="あなたの経験や考えを、具体的に述べてください"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  rows={6}
                />
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleGenerateFeedback}
                disabled={loading || !answer.trim()}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    フィードバック生成中...
                  </>
                ) : (
                  <>
                    フィードバックを受け取る
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {step === "feedback" && feedback && (
          <Card className="max-w-3xl mx-auto">
            <CardHeader>
              <CardTitle>フィードバック</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    具体性: {feedback.specificity?.score}/5
                  </h4>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    {feedback.specificity?.feedback}
                  </p>
                </div>

                <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200 dark:border-green-800">
                  <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                    強みの伝わりやすさ: {feedback.strengthCommunication?.score}/5
                  </h4>
                  <p className="text-sm text-green-800 dark:text-green-200">
                    {feedback.strengthCommunication?.feedback}
                  </p>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                  <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
                    経験の活かし方: {feedback.ageAdvantage?.score}/5
                  </h4>
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    {feedback.ageAdvantage?.feedback}
                  </p>
                </div>

                <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                  <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
                    改善例
                  </h4>
                  <p className="text-sm text-purple-800 dark:text-purple-200">
                    {feedback.improvementExample}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  className="flex-1"
                  variant="outline"
                  onClick={handleNextQuestion}
                >
                  {currentQuestionIndex < questions.length - 1
                    ? "次の質問へ"
                    : "完了"}
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSaveSession}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      保存中...
                    </>
                  ) : (
                    "セッションを保存"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
