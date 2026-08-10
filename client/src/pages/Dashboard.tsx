import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, BarChart3, Calendar, TrendingUp } from "lucide-react";
import { useLocation } from "wouter";

export default function Dashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const { data: interviewData, isLoading: isLoadingInterview } =
    trpc.interview.getSessions.useQuery();
  const { data: moodData, isLoading: isLoadingMood } =
    trpc.mood.getLogs.useQuery();
  const { data: learningData, isLoading: isLoadingLearning } =
    trpc.learning.getLogs.useQuery();

  const interviews = interviewData?.sessions || [];
  const moods = moodData?.logs || [];
  const learnings = learningData?.logs || [];

  const isLoading = isLoadingInterview || isLoadingMood || isLoadingLearning;

  // Calculate statistics
  const totalInterviews = interviews.length;
  const totalMoodChecks = moods.length;
  const averageMood =
    moods.length > 0
      ? (moods.reduce((sum: number, log: any) => sum + log.moodLevel, 0) /
          moods.length).toFixed(1)
      : 0;
  const completedLearnings = learnings.filter(
    (log: any) => log.completionStatus === "completed"
  ).length;

  return (
    <div className="min-h-screen bg-background sacred-geometry-bg">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <h1 className="text-2xl font-bold text-primary">こころナビ</h1>
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
          >
            ホームに戻る
          </Button>
        </div>
      </header>

      <div className="container py-12">
        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
            <p className="text-foreground/70">読み込み中...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Statistics Cards */}
            <div className="grid md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary mb-2">
                      {totalInterviews}
                    </div>
                    <p className="text-sm text-foreground/70">面接練習</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-accent mb-2">
                      {totalMoodChecks}
                    </div>
                    <p className="text-sm text-foreground/70">気分チェック</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary mb-2">
                      {averageMood}
                    </div>
                    <p className="text-sm text-foreground/70">平均気分スコア</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-accent mb-2">
                      {completedLearnings}
                    </div>
                    <p className="text-sm text-foreground/70">完了した活動</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Interview Sessions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-accent" />
                  面接練習履歴
                </CardTitle>
              </CardHeader>
              <CardContent>
                {interviews.length === 0 ? (
                  <p className="text-foreground/70 text-center py-8">
                    まだ面接練習を行っていません
                  </p>
                ) : (
                  <div className="space-y-3">
                    {interviews.map((interview: any) => (
                      <div
                        key={interview.id}
                        className="p-4 bg-card/50 rounded-lg border border-border hover:border-accent/50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-foreground">
                              {interview.jobTitle}
                            </h4>
                            <p className="text-sm text-foreground/70 mt-1">
                              {new Date(interview.createdAt).toLocaleDateString(
                                "ja-JP"
                              )}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              navigate(`/interview-detail/${interview.id}`)
                            }
                          >
                            詳細
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Mood Logs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-accent" />
                  気分ログ
                </CardTitle>
              </CardHeader>
              <CardContent>
                {moods.length === 0 ? (
                  <p className="text-foreground/70 text-center py-8">
                    まだ気分チェックを行っていません
                  </p>
                ) : (
                  <div className="space-y-3">
                    {moods.slice().reverse().map((mood: any) => (
                      <div
                        key={mood.id}
                        className="p-4 bg-card/50 rounded-lg border border-border"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-2xl">
                                {mood.moodLevel === 5 && "😊"}
                                {mood.moodLevel === 4 && "🙂"}
                                {mood.moodLevel === 3 && "😐"}
                                {mood.moodLevel === 2 && "😔"}
                                {mood.moodLevel === 1 && "😢"}
                              </span>
                              {mood.moodText && (
                                <span className="text-sm font-medium text-foreground">
                                  {mood.moodText}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-foreground/70">
                              {new Date(mood.createdAt).toLocaleDateString(
                                "ja-JP"
                              )}
                            </p>
                          </div>
                          {mood.suggestedAction && (
                            <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded">
                              {mood.suggestedAction === "practice_interview" &&
                                "面接練習"}
                              {mood.suggestedAction === "consult_window" &&
                                "相談窓口"}
                              {mood.suggestedAction === "community_activity" &&
                                "地域活動"}
                              {mood.suggestedAction === "rest" && "休息"}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Learning Activities */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-accent" />
                  学習活動
                </CardTitle>
              </CardHeader>
              <CardContent>
                {learnings.length === 0 ? (
                  <p className="text-foreground/70 text-center py-8">
                    まだ学習活動を記録していません
                  </p>
                ) : (
                  <div className="space-y-3">
                    {learnings.map((learning: any) => (
                      <div
                        key={learning.id}
                        className={`p-4 rounded-lg border ${
                          learning.completionStatus === "completed"
                            ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
                            : "bg-card/50 border-border"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-foreground">
                              {learning.activityTitle}
                            </h4>
                            <p className="text-sm text-foreground/70 mt-1">
                              {new Date(learning.createdAt).toLocaleDateString(
                                "ja-JP"
                              )}
                            </p>
                          </div>
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              learning.completionStatus === "completed"
                                ? "bg-green-200 text-green-900 dark:bg-green-800 dark:text-green-100"
                                : "bg-yellow-200 text-yellow-900 dark:bg-yellow-800 dark:text-yellow-100"
                            }`}
                          >
                            {learning.completionStatus === "completed"
                              ? "完了"
                              : "進行中"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-3 gap-4">
              <Button
                className="h-auto py-6"
                onClick={() => navigate("/interview")}
              >
                面接練習を始める
              </Button>
              <Button
                className="h-auto py-6"
                onClick={() => navigate("/mood")}
                variant="outline"
              >
                気分をチェック
              </Button>
              <Button
                className="h-auto py-6"
                onClick={() => navigate("/support")}
                variant="outline"
              >
                相談窓口を探す
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
