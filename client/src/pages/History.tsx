import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getHistory, type HistoryItem, type HistoryType } from "@/lib/history-api";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useLocation } from "wouter";
import KokoroHeader from "@/components/KokoroHeader";

type Filter = HistoryType | "all";

const FILTERS: Array<{ value: Filter; label: string }> = [
  { value: "all", label: "すべて" },
  { value: "mood", label: "気分チェック" },
  { value: "counseling", label: "AI相談" },
  { value: "interview", label: "面接練習" },
];

const formatDate = (value: string) => new Date(`${value}Z`).toLocaleString("ja-JP");

const HistoryCard = ({ item }: { item: HistoryItem }) => {
  if (item.type === "mood") {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-lg">気分チェック：{item.mood}/5</CardTitle>
            <time className="text-xs text-foreground/60">{formatDate(item.createdAt)}</time>
          </div>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-foreground/80">{item.comment}</p>
        </CardContent>
      </Card>
    );
  }

  if (item.type === "counseling") {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-lg">AI相談</CardTitle>
            <time className="text-xs text-foreground/60">{formatDate(item.createdAt)}</time>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="mb-1 text-xs font-medium text-foreground/60">相談内容</p>
            <p className="whitespace-pre-wrap text-foreground/80">{item.consultation}</p>
          </div>
          <div>
            <p className="mb-1 text-xs font-medium text-foreground/60">アドバイス</p>
            <p className="whitespace-pre-wrap text-foreground/80">{item.advice}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-lg">面接練習</CardTitle>
          <time className="text-xs text-foreground/60">{formatDate(item.createdAt)}</time>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="mb-1 text-xs font-medium text-foreground/60">質問</p>
          <p className="whitespace-pre-wrap text-foreground/80">{item.question}</p>
        </div>
        <div>
          <p className="mb-1 text-xs font-medium text-foreground/60">回答</p>
          <p className="whitespace-pre-wrap text-foreground/80">{item.answer}</p>
        </div>
        {item.score !== null && (
          <p className="text-sm font-medium text-accent">スコア：{item.score}/5</p>
        )}
      </CardContent>
    </Card>
  );
};

export default function History() {
  const [, navigate] = useLocation();
  const [filter, setFilter] = useState<Filter>("all");
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setItems(await getHistory(filter, 50));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "履歴を取得できませんでした。");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  return (
    <div className="min-h-screen bg-background sacred-geometry-bg">
      <KokoroHeader />

      <main className="container py-8 sm:py-12">
        <div className="mx-auto max-w-3xl space-y-6">
          <Card className="border-amber-200 bg-amber-50/80">
            <CardContent className="pt-6 text-sm text-amber-950">
              履歴はこのブラウザ内の匿名識別子に紐づきます。localStorageを消去すると以前の履歴へアクセスできなくなります。個人を特定できる情報は入力しないでください。
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-2" aria-label="履歴の種類">
            {FILTERS.map(option => (
              <Button
                key={option.value}
                variant={filter === option.value ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-foreground/70">
              <Loader2 className="h-5 w-5 animate-spin" /> 読み込み中...
            </div>
          ) : error ? (
            <Card>
              <CardContent className="space-y-4 py-10 text-center">
                <p className="text-destructive" role="alert">{error}</p>
                <Button variant="outline" onClick={() => void loadItems()}>再読み込み</Button>
              </CardContent>
            </Card>
          ) : items.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-foreground/70">
                この種類の履歴はまだありません。
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {items.map(item => <HistoryCard key={`${item.type}-${item.id}`} item={item} />)}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
