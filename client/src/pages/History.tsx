import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  getHistory,
  type HistoryItem,
  type HistoryType,
  type MoodHistoryItem,
} from "@/lib/history-api";
import {
  HeartPulse,
  Loader2,
  MessageCircleHeart,
  Mic2,
  TrendingUp,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
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

const moodChartConfig = {
  mood: {
    label: "気分",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

const MoodSummary = ({ items }: { items: MoodHistoryItem[] }) => {
  if (items.length === 0) return null;

  const chronologicalItems = [...items].reverse();
  const average = items.reduce((sum, item) => sum + item.mood, 0) / items.length;
  const chartData = chronologicalItems.map(item => ({
    mood: item.mood,
    date: new Date(`${item.createdAt}Z`).toLocaleDateString("ja-JP", {
      month: "numeric",
      day: "numeric",
    }),
    dateTime: formatDate(item.createdAt),
  }));
  const latest = items[0];

  return (
    <Card aria-labelledby="mood-summary-title">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" aria-hidden="true" />
          <CardTitle id="mood-summary-title" className="text-xl">
            最近の気分の推移
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-3 gap-2 text-center sm:gap-4">
          <div className="rounded-xl bg-primary/8 px-2 py-3">
            <p className="text-xs text-foreground/65">平均</p>
            <p className="mt-1 text-xl font-bold text-primary sm:text-2xl">
              {average.toFixed(1)}<span className="text-sm font-medium">/5</span>
            </p>
          </div>
          <div className="rounded-xl bg-primary/8 px-2 py-3">
            <p className="text-xs text-foreground/65">最新</p>
            <p className="mt-1 text-xl font-bold text-primary sm:text-2xl">
              {latest.mood}<span className="text-sm font-medium">/5</span>
            </p>
          </div>
          <div className="rounded-xl bg-primary/8 px-2 py-3">
            <p className="text-xs text-foreground/65">記録数</p>
            <p className="mt-1 text-xl font-bold text-primary sm:text-2xl">
              {items.length}<span className="text-sm font-medium">件</span>
            </p>
          </div>
        </div>

        <ChartContainer
          config={moodChartConfig}
          className="h-[220px] w-full aspect-auto"
          role="img"
          aria-label={`直近${items.length}件の気分の推移。平均${average.toFixed(1)}、最新${latest.mood}。`}
        >
          <LineChart data={chartData} margin={{ top: 10, right: 12, left: -20, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={10} />
            <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tickLine={false} axisLine={false} />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  hideLabel
                  formatter={(value, _name, item) => (
                    <div className="space-y-1">
                      <p className="text-foreground/65">{item.payload.dateTime}</p>
                      <p className="font-medium">気分：{String(value)}/5</p>
                    </div>
                  )}
                />
              }
            />
            <Line
              dataKey="mood"
              type="monotone"
              stroke="var(--color-mood)"
              strokeWidth={3}
              dot={{ r: 4, fill: "var(--color-mood)" }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ChartContainer>
        <p className="text-center text-xs text-foreground/60">
          直近{items.length}件の記録です。数値は診断ではなく、ご自身の振り返りの目安です。
        </p>
      </CardContent>
    </Card>
  );
};

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

const timelineMeta = {
  mood: {
    label: "気分チェック",
    icon: HeartPulse,
    dotClassName: "border-amber-300 bg-amber-100 text-amber-800",
  },
  counseling: {
    label: "AI相談",
    icon: MessageCircleHeart,
    dotClassName: "border-emerald-300 bg-emerald-100 text-emerald-800",
  },
  interview: {
    label: "面接練習",
    icon: Mic2,
    dotClassName: "border-sky-300 bg-sky-100 text-sky-800",
  },
} as const;

const HistoryTimeline = ({ items }: { items: HistoryItem[] }) => (
  <section aria-labelledby="timeline-title" className="space-y-4">
    <div className="flex items-center gap-2 px-1">
      <MessageCircleHeart className="h-5 w-5 text-primary" aria-hidden="true" />
      <h2 id="timeline-title" className="text-xl font-bold">
        あなたの歩み
      </h2>
    </div>
    <p className="px-1 text-sm text-foreground/65">
      気分チェック、AI相談、面接練習を新しい順にまとめています。
    </p>
    <ol className="space-y-0" aria-label="活動履歴の時系列">
      {items.map((item, index) => {
        const meta = timelineMeta[item.type];
        const Icon = meta.icon;
        const isLast = index === items.length - 1;

        return (
          <li key={`${item.type}-${item.id}`} className="relative grid grid-cols-[2.75rem_minmax(0,1fr)] gap-3 pb-5">
            {!isLast && (
              <span
                className="absolute bottom-0 left-[1.34rem] top-11 w-px bg-border"
                aria-hidden="true"
              />
            )}
            <div className="relative z-10 flex flex-col items-center pt-2">
              <span
                className={`grid h-10 w-10 place-items-center rounded-full border-2 ${meta.dotClassName}`}
                title={meta.label}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span className="sr-only">{meta.label}</span>
              </span>
            </div>
            <HistoryCard item={item} />
          </li>
        );
      })}
    </ol>
  </section>
);

export default function History() {
  const [, navigate] = useLocation();
  const [filter, setFilter] = useState<Filter>("all");
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [moodItems, setMoodItems] = useState<MoodHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [historyItems, recentMoodItems] = await Promise.all([
        getHistory(filter, 50),
        getHistory("mood", 7),
      ]);
      setItems(historyItems);
      setMoodItems(
        recentMoodItems.filter((item): item is MoodHistoryItem => item.type === "mood")
      );
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

          {!loading && !error && <MoodSummary items={moodItems} />}

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
              {filter === "all" ? (
                <HistoryTimeline items={items} />
              ) : (
                items.map(item => <HistoryCard key={`${item.type}-${item.id}`} item={item} />)
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
