import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, MapPin, Phone, Globe, Clock, ExternalLink } from "lucide-react";
import { useLocation } from "wouter";

const CATEGORIES = [
  { value: "employment", label: "就労支援" },
  { value: "mental", label: "メンタルヘルス" },
  { value: "community", label: "地域活動" },
  { value: "reskilling", label: "リスキリング" },
];

const AGE_GROUPS = ["全年齢", "20代以下", "30代", "40代", "50代", "60代以上"];

type SupportResource = {
  id: string | number;
  name: string;
  category: string;
  description?: string | null;
  address?: string | null;
  phone?: string | null;
  website?: string | null;
  businessHours?: string | null;
  targetAge: string[];
  region: string[];
  sourceName: string;
  sourceUrl: string;
};

const isOptionalString = (value: unknown): value is string | null | undefined =>
  value === undefined || value === null || typeof value === "string";

const isSupportResource = (value: unknown): value is SupportResource => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const resource = value as Record<string, unknown>;
  return (
    (typeof resource.id === "string" || typeof resource.id === "number") &&
    typeof resource.name === "string" &&
    typeof resource.category === "string" &&
    Array.isArray(resource.region) &&
    resource.region.every(region => typeof region === "string") &&
    typeof resource.sourceName === "string" &&
    typeof resource.sourceUrl === "string" &&
    isOptionalString(resource.description) &&
    isOptionalString(resource.address) &&
    isOptionalString(resource.phone) &&
    isOptionalString(resource.website) &&
    isOptionalString(resource.businessHours) &&
    Array.isArray(resource.targetAge) &&
    resource.targetAge.every(age => typeof age === "string")
  );
};

export default function Support() {
  const [, navigate] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState("employment");
  const [selectedRegion, setSelectedRegion] = useState("全国");
  const [selectedAge, setSelectedAge] = useState("全年齢");
  const [resources, setResources] = useState<SupportResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const loadResources = async () => {
      try {
        const response = await fetch("/data/support-resources.json", {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`Failed to load support resources: ${response.status}`);
        }

        const data: unknown = await response.json();
        if (!Array.isArray(data) || !data.every(isSupportResource)) {
          throw new Error("Support resources data has an invalid format");
        }

        setResources(data);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Failed to load support resources:", error);
          setLoadError(true);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    void loadResources();
    return () => controller.abort();
  }, []);

  const filteredResources = resources.filter(
    resource =>
      resource.category === selectedCategory &&
      resource.region.includes(selectedRegion) &&
      (selectedAge === "全年齢" ||
        resource.targetAge.includes(selectedAge) ||
        resource.targetAge.includes("全年齢"))
  );
  const regions = [
    "全国",
    ...Array.from(
      new Set(resources.flatMap(resource => resource.region))
    )
      .filter(region => region !== "全国"),
  ];

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
              <label
                htmlFor="support-resource-region"
                className="block text-sm font-medium text-foreground mb-3"
              >
                対象地域
              </label>
              <select
                id="support-resource-region"
                value={selectedRegion}
                onChange={event => setSelectedRegion(event.target.value)}
                className="h-11 w-full rounded-lg border-2 border-border bg-background px-3 text-sm outline-none focus:border-accent"
              >
                {regions.map(region => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="support-resource-age"
                className="block text-sm font-medium text-foreground mb-3"
              >
                年齢層
              </label>
              <select
                id="support-resource-age"
                value={selectedAge}
                onChange={event => setSelectedAge(event.target.value)}
                className="h-11 w-full rounded-lg border-2 border-border bg-background px-3 text-sm outline-none focus:border-accent"
              >
                {AGE_GROUPS.map(age => (
                  <option key={age} value={age}>
                    {age}
                  </option>
                ))}
              </select>
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
          ) : loadError ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-foreground/70">
                  支援窓口データを読み込めませんでした。
                  <br />
                  時間をおいて再度お試しください。
                </p>
              </CardContent>
            </Card>
          ) : filteredResources.length === 0 ? (
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
            filteredResources.map((resource) => (
              <Card key={resource.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-bold text-primary mb-1">
                        {resource.name}
                      </h3>
                      <p className="text-sm text-accent font-medium">
                        {resource.category === "employment" && "就労支援"}
                        {resource.category === "mental" && "メンタルヘルス"}
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
                        対象：{resource.targetAge.join("・")}
                      </p>
                    )}

                    <a
                      href={resource.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-foreground/60 hover:text-accent hover:underline"
                    >
                      出典：{resource.sourceName}
                      <ExternalLink className="h-3 w-3" />
                    </a>
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
