import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, MapPin, Phone, Globe, Clock } from "lucide-react";
import { useLocation } from "wouter";

const CATEGORIES = [
  { value: "employment", label: "就労支援" },
  { value: "mental_health", label: "メンタルヘルス" },
  { value: "labor", label: "労働相談" },
  { value: "community", label: "地域活動" },
  { value: "reskilling", label: "リスキリング" },
];

const AREAS = [
  { value: "Tokyo", label: "東京都全域" },
  { value: "Chiyoda", label: "千代田区" },
  { value: "Minato", label: "港区" },
  { value: "All", label: "全国" },
];

type SupportResource = {
  id: string | number;
  name: string;
  category: string;
  description?: string | null;
  address?: string | null;
  phone?: string | null;
  website?: string | null;
  businessHours?: string | null;
  targetAge?: string | null;
};

const FALLBACK_RESOURCES: SupportResource[] = [
  {
    id: "fallback-hello-work-tokyo",
    name: "ハローワーク東京",
    category: "employment",
    description:
      "職業相談、職業紹介、応募書類・面接に関する相談を行う国の就労支援窓口です。",
    website: "https://www.hellowork.mhlw.go.jp/",
    targetAge: "全年齢",
  },
  {
    id: "fallback-tokyo-shigoto-center",
    name: "東京しごとセンター",
    category: "employment",
    description:
      "就職相談、セミナー、職業紹介などを提供する東京都の就労支援施設です。",
    address: "東京都千代田区飯田橋3-10-3",
    phone: "03-5211-1571",
    website: "https://www.tokyoshigoto.jp/",
    targetAge: "全年齢",
  },
  {
    id: "fallback-mental-health-dial",
    name: "こころの健康相談統一ダイヤル",
    category: "mental_health",
    description:
      "こころの健康に関する相談窓口につながる全国共通の電話相談です。",
    phone: "0570-064-556",
    businessHours: "受付時間は地域により異なります。",
    targetAge: "全年齢",
  },
];

export default function Support() {
  const [, navigate] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState("employment");
  const [selectedArea, setSelectedArea] = useState("Tokyo");
  const [hasTimedOut, setHasTimedOut] = useState(false);

  const {
    data: resourcesData,
    isLoading: isLoadingResources,
    isError: hasResourceError,
  } =
    trpc.support.getResources.useQuery({
      category: selectedCategory,
      targetArea: selectedArea,
    }, {
      retry: false,
    });

  useEffect(() => {
    setHasTimedOut(false);
    if (!isLoadingResources) {
      return;
    }

    const timeout = window.setTimeout(() => setHasTimedOut(true), 5_000);
    return () => window.clearTimeout(timeout);
  }, [isLoadingResources, selectedCategory, selectedArea]);

  const useFallbackResources = hasResourceError || hasTimedOut;
  const resources: SupportResource[] = useFallbackResources
    ? FALLBACK_RESOURCES
    : resourcesData?.resources || [];
  const isLoading = isLoadingResources && !useFallbackResources;

  return (
    <div className="min-h-screen bg-background sacred-geometry-bg">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <h1 className="text-2xl font-bold text-primary">支援窓口案内</h1>
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
          >
            ホームに戻る
          </Button>
        </div>
      </header>

      <div className="container py-12">
        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>支援窓口を探す</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                支援の種類
              </label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setSelectedCategory(cat.value)}
                    className={`p-3 rounded-lg border-2 text-sm transition-all ${
                      selectedCategory === cat.value
                        ? "border-accent bg-accent/10"
                        : "border-border hover:border-accent/50"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                対象地域
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {AREAS.map((area) => (
                  <button
                    key={area.value}
                    onClick={() => setSelectedArea(area.value)}
                    className={`p-3 rounded-lg border-2 text-sm transition-all ${
                      selectedArea === area.value
                        ? "border-accent bg-accent/10"
                        : "border-border hover:border-accent/50"
                    }`}
                  >
                    {area.label}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resources List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
              <p className="text-foreground/70">読み込み中...</p>
            </div>
          ) : resources.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-foreground/70">
                  該当する支援窓口が見つかりません。
                  <br />
                  別の条件で検索してみてください。
                </p>
              </CardContent>
            </Card>
          ) : (
            resources.map((resource) => (
              <Card key={resource.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-bold text-primary mb-1">
                        {resource.name}
                      </h3>
                      <p className="text-sm text-accent font-medium">
                        {resource.category === "employment" && "就労支援"}
                        {resource.category === "mental_health" && "メンタルヘルス"}
                        {resource.category === "labor" && "労働相談"}
                        {resource.category === "community" && "地域活動"}
                        {resource.category === "reskilling" && "リスキリング"}
                      </p>
                    </div>

                    {resource.description && (
                      <p className="text-foreground/80">{resource.description}</p>
                    )}

                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      {resource.address && (
                        <div className="flex gap-2">
                          <MapPin className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-foreground">住所</p>
                            <p className="text-foreground/70">{resource.address}</p>
                          </div>
                        </div>
                      )}

                      {resource.phone && (
                        <div className="flex gap-2">
                          <Phone className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-foreground">電話</p>
                            <a
                              href={`tel:${resource.phone}`}
                              className="text-accent hover:underline"
                            >
                              {resource.phone}
                            </a>
                          </div>
                        </div>
                      )}

                      {resource.businessHours && (
                        <div className="flex gap-2">
                          <Clock className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-foreground">受付時間</p>
                            <p className="text-foreground/70">
                              {resource.businessHours}
                            </p>
                          </div>
                        </div>
                      )}

                      {resource.website && (
                        <div className="flex gap-2">
                          <Globe className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-foreground">ウェブサイト</p>
                            <a
                              href={resource.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-accent hover:underline"
                            >
                              詳細を見る
                            </a>
                          </div>
                        </div>
                      )}
                    </div>

                    {resource.targetAge && (
                      <p className="text-xs text-foreground/60">
                        対象：{resource.targetAge}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Info Box */}
        <Card className="mt-12 bg-accent/5 border-accent/30">
          <CardContent className="pt-6">
            <h3 className="font-bold text-foreground mb-2">💡 支援窓口の選び方</h3>
            <ul className="space-y-2 text-sm text-foreground/80">
              <li>
                ✓
                <strong>就労支援</strong>：職業紹介、キャリア相談、面接対策
              </li>
              <li>
                ✓
                <strong>メンタルヘルス</strong>：心の悩み、不安、落ち込みの相談
              </li>
              <li>
                ✓
                <strong>労働相談</strong>：労働条件、ハラスメント、権利に関する相談
              </li>
              <li>
                ✓
                <strong>地域活動</strong>：居場所、ボランティア、交流の場
              </li>
              <li>
                ✓
                <strong>リスキリング</strong>：スキルアップ、職業訓練、学び直し
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
