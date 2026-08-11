import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";

export default function Dashboard() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background sacred-geometry-bg">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <h1 className="text-2xl font-bold text-primary">ココロナビ</h1>
          <Button variant="ghost" onClick={() => navigate("/")}>
            ホームに戻る
          </Button>
        </div>
      </header>

      <main className="container py-12">
        <div className="space-y-8">
          <Card className="border-primary/30">
            <CardContent className="pt-6 space-y-4">
              <div>
                <h2 className="text-xl font-bold text-primary mb-2">
                  ココロナビについて
                </h2>
                <p className="text-sm leading-7 text-foreground/80">
                  ココロナビは、女性の再就職や暮らしの不安に寄り添う総合サポートアプリです。
                  面接の準備だけでなく、気持ちの整理、学び直し、信頼できる公的支援窓口探しまで、
                  次の一歩を自分のペースで考えられるよう支援します。
                </p>
              </div>
              <div className="grid gap-3 md:grid-cols-3 text-sm">
                <div className="rounded-md border border-border bg-muted/40 p-4">
                  <h3 className="font-semibold text-primary mb-1">面接練習</h3>
                  <p className="text-foreground/70">
                    希望する職種に合わせた質問で、経験や強みの伝え方を練習できます。
                  </p>
                </div>
                <div className="rounded-md border border-border bg-muted/40 p-4">
                  <h3 className="font-semibold text-primary mb-1">気分チェック</h3>
                  <p className="text-foreground/70">
                    不安や緊張を言葉にし、AIから次の行動のヒントを受け取れます。
                  </p>
                </div>
                <div className="rounded-md border border-border bg-muted/40 p-4">
                  <h3 className="font-semibold text-primary mb-1">支援窓口案内</h3>
                  <p className="text-foreground/70">
                    東京都などの公的情報から、状況に合う相談先や学びの場を探せます。
                  </p>
                </div>
              </div>
              <p className="text-sm font-medium text-primary">
                ひとりで抱え込まず、できることから少しずつ始めていきましょう。
              </p>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button className="h-auto py-6" onClick={() => navigate("/interview")}>
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
            <Button
              className="h-auto py-6"
              onClick={() =>
                navigate(
                  "/womens-health?category=interview_for_mothers"
                )
              }
              variant="outline"
            >
              母親向け面接対策
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
