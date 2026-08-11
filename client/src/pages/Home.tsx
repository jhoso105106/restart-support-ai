import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Heart, MessageSquare, Users } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect } from "react";

// Development mode flag - matches useAuth.ts
const DEV_MODE = true;

export default function Home() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  // In development mode, automatically redirect to dashboard
  useEffect(() => {
    if (DEV_MODE && isAuthenticated && user) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated && user && !DEV_MODE) {
    return (
      <div className="min-h-screen bg-background sacred-geometry-bg">
        <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container flex items-center justify-between h-16">
            <div className="text-2xl font-bold text-primary">再スタート応援AI</div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-foreground">{user.name || user.email}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/dashboard")}
              >
                こころナビ
              </Button>
            </div>
          </div>
        </nav>

        <div className="container py-12">
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <MessageSquare className="w-8 h-8 text-accent mb-2" />
                <CardTitle>AI面接練習</CardTitle>
                <CardDescription>職種に応じた想定質問で面接対策</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground/70 mb-4">
                  50代向けの面接対策。具体的なフィードバックで改善を支援します。
                </p>
            <Button
              className="w-full"
              onClick={() => navigate("/dashboard")}
            >
              こころナビを見る
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Heart className="w-8 h-8 text-accent mb-2" />
                <CardTitle>気分チェック</CardTitle>
                <CardDescription>AI傾聴で心をサポート</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground/70 mb-4">
                  不安や落ち込みに寄り添い、次の一歩を一緒に考えます。
                </p>
                <Button
                  className="w-full"
                  onClick={() => navigate("/mood")}
                >
                  気分をチェック
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Users className="w-8 h-8 text-accent mb-2" />
                <CardTitle>支援窓口</CardTitle>
                <CardDescription>信頼できる相談先を案内</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground/70 mb-4">
                  就労支援、メンタルケア、地域活動など、必要な支援をつなぎます。
                </p>
                <Button
                  className="w-full"
                  onClick={() => navigate("/support")}
                >
                  相談窓口を探す
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow md:col-span-2">
              <CardHeader>
                <Heart className="w-8 h-8 text-accent mb-2" />
                <CardTitle>女性のための総合サポート</CardTitle>
                <CardDescription>月経周期管理とキャリア支援</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground/70 mb-4">
                  月経周期の追跡、症状管理、育児との両立支援、キャリア再開アドバイスなど、女性特有のニーズをサポートします。
                </p>
                <Button
                  className="w-full"
                  onClick={() => navigate("/womens-health")}
                >
                  女性サポートを利用する
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button
                  variant="outline"
                  className="w-full mt-3"
                  onClick={() =>
                    navigate(
                      "/womens-health?category=interview_for_mothers"
                    )
                  }
                >
                  母親向けの面接質問へ
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="mt-12 p-8 bg-card rounded-lg border border-border">
            <h2 className="text-2xl font-bold text-primary mb-4">
              再就職の<span className="accent-text">再スタート</span>を応援します
            </h2>
            <p className="text-foreground/80 leading-relaxed">
              50代での再就職は、不安も大きいもの。このアプリは、面接対策だけでなく、心の支えになることを目指しています。
              AIが24時間、あなたの相談相手に。必要に応じて、信頼できる公的支援へもつなぎます。
              一人ではありません。一緒に、次の一歩を踏み出しましょう。
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Landing page for unauthenticated users
  return (
    <div className="min-h-screen bg-background sacred-geometry-bg">
      {/* Header */}
      <header className="border-b border-border/30 bg-card/30 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <h1 className="text-2xl font-bold text-primary">再スタート応援AI</h1>
          <Button onClick={() => navigate("/auth")}>ログイン</Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container py-20 md:py-32">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold text-primary mb-6 leading-tight">
              50代の再就職を支える
              <br />
              <span className="accent-text">AIキャリアコーチ</span>
            </h2>
            <p className="text-lg text-foreground/80 mb-8 leading-relaxed">
              仕事を探すだけじゃない。再挑戦する勇気を支える。
              <br />
              面接対策、心のサポート、信頼できる相談先への接続。
              <br />
              すべてを一つのアプリで。
            </p>
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90"
              onClick={() => navigate("/auth")}
            >
              今すぐ始める
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-primary/10 rounded-2xl blur-3xl"></div>
            <div className="relative bg-card rounded-2xl p-8 border border-border/50">
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-3 h-3 rounded-full bg-accent mt-1.5"></div>
                  <div>
                    <p className="font-semibold text-foreground">AI面接練習</p>
                    <p className="text-sm text-foreground/60">職種に応じた質問で実践的に対策</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-3 h-3 rounded-full bg-accent mt-1.5"></div>
                  <div>
                    <p className="font-semibold text-foreground">心理的サポート</p>
                    <p className="text-sm text-foreground/60">AIが共感的に傾聴し、気持ちを整理</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-3 h-3 rounded-full bg-accent mt-1.5"></div>
                  <div>
                    <p className="font-semibold text-foreground">支援窓口案内</p>
                    <p className="text-sm text-foreground/60">公的相談先へ信頼できるつながり</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container py-20">
        <h3 className="text-3xl font-bold text-primary text-center mb-12">
          3つの<span className="accent-text">サポート機能</span>
        </h3>

        <div className="grid md:grid-cols-3 gap-8">
          <Card className="border-border/50 hover:border-accent/50 transition-colors">
            <CardHeader>
              <MessageSquare className="w-10 h-10 text-accent mb-3" />
              <CardTitle className="text-primary">AI面接練習</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-foreground/80">
                職種に応じた想定質問を自動生成。チャット形式で何度も練習できます。
              </p>
              <ul className="space-y-2 text-sm text-foreground/70">
                <li>✓ 具体性のフィードバック</li>
                <li>✓ 強みの伝わりやすさ評価</li>
                <li>✓ 改善例の提示</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-border/50 hover:border-accent/50 transition-colors">
            <CardHeader>
              <Heart className="w-10 h-10 text-accent mb-3" />
              <CardTitle className="text-primary">気分チェック・AI傾聴</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-foreground/80">
                不採用や不安に直面した時、AIが共感的に寄り添います。
              </p>
              <ul className="space-y-2 text-sm text-foreground/70">
                <li>✓ 気持ちの言語化をサポート</li>
                <li>✓ 次の行動を一緒に考える</li>
                <li>✓ 危機検知と緊急対応</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-border/50 hover:border-accent/50 transition-colors">
            <CardHeader>
              <Users className="w-10 h-10 text-accent mb-3" />
              <CardTitle className="text-primary">支援窓口案内</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-foreground/80">
                東京都の公的相談窓口を、あなたの状況に応じて提案します。
              </p>
              <ul className="space-y-2 text-sm text-foreground/70">
                <li>✓ 就労支援窓口</li>
                <li>✓ メンタルヘルス相談</li>
                <li>✓ 地域活動・リスキリング</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-20 text-center">
        <div className="max-w-2xl mx-auto">
          <h3 className="text-3xl font-bold text-primary mb-6">
            再就職の<span className="accent-text">再スタート</span>、今から始めましょう
          </h3>
          <p className="text-lg text-foreground/80 mb-8">
            50代だからこそ、経験と知恵がある。
            <br />
            その価値を最大限に引き出すお手伝いをします。
          </p>
          <Button
            size="lg"
            className="bg-primary hover:bg-primary/90"
            onClick={() => navigate("/auth")}
          >
            無料で始める
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 bg-card/30 backdrop-blur-sm py-8 mt-20">
        <div className="container text-center text-sm text-foreground/60">
          <p>再スタート応援AI © 2026 | 50代の再就職を支えるAIキャリアコーチ</p>
        </div>
      </footer>
    </div>
  );
}
