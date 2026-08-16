import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, MapPin, Phone, Globe, Clock, ExternalLink, Sparkles, Hospital } from "lucide-react";
import { useLocation } from "wouter";
import KokoroHeader from "@/components/KokoroHeader";

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
  // new metadata fields for open data visibility
  sourceType?: string; // e.g., 'tokyo', 'national', 'ward'
  datasetId?: string;
  lastUpdated?: string;
  portalUrl?: string;
};

type ConsultationMethod = "any" | "phone" | "visit";
type Recommendation = { resource: SupportResource; score: number; reasons: string[] };

const NEED_OPTIONS = [
  { value: "employment", label: "再就職や仕事探し" },
  { value: "reskilling", label: "資格・研修・学び直し" },
  { value: "mental", label: "不安や気持ちの不調" },
  { value: "community", label: "生活の悩み・地域とのつながり" },
] as const;

const rankResources = (
  resources: SupportResource[],
  region: string,
  need: string,
  method: ConsultationMethod
): Recommendation[] =>
  resources
    .map(resource => {
      let score = 0;
      const reasons: string[] = [];
      if (resource.category === need) {
        score += 60;
        reasons.push(`${NEED_OPTIONS.find(option => option.value === need)?.label ?? "お悩み"}に対応しています`);
      }
      if (resource.region.includes(region) && region !== "東京都全域") {
        score += 30;
        reasons.push(`${region}にある窓口です`);
      } else if (resource.region.includes("東京都全域")) {
        score += 12;
        reasons.push("東京都内から利用できる窓口です");
      }
      if (method === "phone" && resource.phone) {
        score += 15;
        reasons.push("電話で問い合わせできます");
      }
      if (method === "visit" && resource.address && !resource.address.includes("非公開")) {
        score += 15;
        reasons.push("所在地が公開されており対面相談を検討できます");
      }
      if (method === "any") score += 5;
      return { resource, score, reasons };
    })
    .filter(item => item.resource.category === need)
    .sort((left, right) => right.score - left.score || left.resource.name.localeCompare(right.resource.name, "ja"))
    .slice(0, 3);

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
    // optional metadata fields may be absent or strings
    (resource.sourceType === undefined || typeof resource.sourceType === 'string') &&
    (resource.datasetId === undefined || typeof resource.datasetId === 'string') &&
    (resource.lastUpdated === undefined || typeof resource.lastUpdated === 'string') &&
    (resource.portalUrl === undefined || typeof resource.portalUrl === 'string') &&
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
  const [location, navigate] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState("employment");
  const [selectedRegion, setSelectedRegion] = useState("東京都全域");
  const [selectedAge, setSelectedAge] = useState("全年齢");
  const [resources, setResources] = useState<SupportResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [diagnosisRegion, setDiagnosisRegion] = useState("東京都全域");
  const [diagnosisNeed, setDiagnosisNeed] = useState("employment");
  const [diagnosisMethod, setDiagnosisMethod] = useState<ConsultationMethod>("any");
  const [recommendations, setRecommendations] = useState<Recommendation[] | null>(null);
  const [expandedRecommendation, setExpandedRecommendation] = useState<string | number | null>(null);

  // Highlighting when navigated from AI (e.g., /support?highlight=tokyo-mental-health-welfare-center&reason=...)
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [highlightReason, setHighlightReason] = useState<string | null>(null);

  useEffect(() => {
    // read query params from location (wouter) or fallback to window.location
    const search = typeof location === 'string' ? new URLSearchParams(location.split('?')[1]) : new URLSearchParams(window.location.search);
    const hid = search.get('highlight');
    const reason = search.get('reason');
    if (hid) {
      setHighlightId(hid);
      setHighlightReason(reason ? decodeURIComponent(reason) : null);
    }
  }, [location]);

  useEffect(() => {
    if (!isLoading && highlightId) {
      const el = document.getElementById(`resource-${highlightId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('ring-4', 'ring-yellow-300');
        // remove highlight after a short timeout so it doesn't persist forever
        setTimeout(() => el.classList.remove('ring-4', 'ring-yellow-300'), 5000);
      }
    }
  }, [isLoading, highlightId]);

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

  const runDiagnosis = () => {
    const ranked = rankResources(resources, diagnosisRegion, diagnosisNeed, diagnosisMethod);
    setRecommendations(ranked);
    setExpandedRecommendation(null);
    setSelectedCategory(diagnosisNeed);
    setSelectedRegion(diagnosisRegion);
    window.setTimeout(() => document.getElementById("recommendation-results")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  };

  return (
    <div className="min-h-screen bg-background sacred-geometry-bg">
      <KokoroHeader />

      <div className="container py-12">
            {/* Tokyo Open Data banner */}
            <div className="mb-6 p-4 rounded-md bg-green-600 text-white shadow-sm">
              <p className="font-bold text-base md:text-lg">東京都オープンデータ活用</p>
              <p className="text-sm md:text-base mt-1">東京都福祉局「社会福祉施設等一覧（令和7年10月1日時点）」の公式CSVを活用しています。各カードでデータセットID・リソースID・更新日・原典CSVを確認できます。</p>
            </div>
        <Card className="mb-8 border-green-700/30">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-3"><Sparkles className="h-6 w-6 text-green-700" />3分でわかる かんたん支援診断</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-center text-foreground/75">3つの質問から、東京都の公式データにある支援窓口をおすすめ順にご案内します。</p>
            <div className="grid gap-5 md:grid-cols-3">
              <div>
                <label htmlFor="diagnosis-region" className="mb-2 block">お住まい・利用したい地域</label>
                <select id="diagnosis-region" value={diagnosisRegion} onChange={event => setDiagnosisRegion(event.target.value)} className="w-full border px-3">
                  {regions.filter(region => region !== "全国").map(region => <option key={region}>{region}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="diagnosis-need" className="mb-2 block">今、一番困っていること</label>
                <select id="diagnosis-need" value={diagnosisNeed} onChange={event => setDiagnosisNeed(event.target.value)} className="w-full border px-3">
                  {NEED_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="diagnosis-method" className="mb-2 block">希望する相談方法</label>
                <select id="diagnosis-method" value={diagnosisMethod} onChange={event => setDiagnosisMethod(event.target.value as ConsultationMethod)} className="w-full border px-3">
                  <option value="any">どちらでもよい</option><option value="phone">電話で相談したい</option><option value="visit">対面で相談したい</option>
                </select>
              </div>
            </div>
            <Button className="w-full" size="lg" onClick={runDiagnosis} disabled={isLoading || loadError}><Sparkles />おすすめの窓口を診断する</Button>
          </CardContent>
        </Card>

        {recommendations && (
          <section id="recommendation-results" className="mb-10 scroll-mt-28">
            <h2 className="mb-4 text-center text-2xl font-bold">あなたへのおすすめ</h2>
            <div className="grid gap-4 lg:grid-cols-3">
              {recommendations.map((item, index) => <Card key={item.resource.id} className="border-green-700/30">
                <CardContent className="pt-6">
                  <div className="mb-3 flex items-center justify-between"><span className="rounded-full bg-green-700 px-3 py-1 text-sm font-bold text-white">おすすめ {index + 1}</span><span className="text-sm font-bold text-green-800">適合度 {item.score}点</span></div>
                  <h3 className="mb-3 text-lg font-bold">{item.resource.name}</h3>
                  <div className="mb-4 rounded-xl bg-green-50/80 p-3">
                    <p className="mb-2 text-xs font-bold text-green-900">推薦理由</p>
                    <ul className="space-y-2 text-sm text-foreground/75">{item.reasons.map(reason => <li key={reason}>✓ {reason}</li>)}</ul>
                  </div>
                  <div className="mb-5 space-y-1 border-t border-green-900/15 pt-3 text-xs text-foreground/70">
                    <p><span className="font-bold">出典：</span>{item.resource.sourceName}</p>
                    <p><span className="font-bold">データ更新日：</span>{item.resource.lastUpdated || "原典で確認"}</p>
                    <a className="inline-flex items-center gap-1 font-bold text-green-900 underline" href={item.resource.portalUrl ?? item.resource.sourceUrl} target="_blank" rel="noopener noreferrer">公式データを確認する<ExternalLink className="h-3 w-3" /></a>
                  </div>
                  <Button
                    className="w-full"
                    variant="outline"
                    aria-expanded={expandedRecommendation === item.resource.id}
                    onClick={() => setExpandedRecommendation(current => current === item.resource.id ? null : item.resource.id)}
                  >
                    {expandedRecommendation === item.resource.id ? "詳細を閉じる" : "詳しい情報を見る"}
                  </Button>
                  {expandedRecommendation === item.resource.id && (
                    <div className="mt-4 space-y-3 rounded-xl border border-green-800/20 bg-green-50/70 p-4 text-sm">
                      {item.resource.description && <p>{item.resource.description}</p>}
                      {item.resource.address && <div className="flex gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-green-800" /><span>{item.resource.address}</span></div>}
                      {item.resource.phone && <div className="flex gap-2"><Phone className="mt-0.5 h-4 w-4 shrink-0 text-green-800" /><a className="font-bold text-green-900 underline" href={`tel:${item.resource.phone}`}>{item.resource.phone}</a></div>}
                    </div>
                  )}
                </CardContent>
              </Card>)}
            </div>
          </section>
        )}

        <Card className="mb-10 border-green-800/25 bg-green-50/60">
          <CardContent className="flex flex-col items-start gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold"><Hospital className="h-5 w-5 text-green-800" />医療機関への相談を考えている方へ</h2>
              <p className="mt-2 text-sm leading-6 text-foreground/75">厚生労働省の公式オープンデータから、精神科・心療内科の候補を地域や診療科で検索できます。</p>
            </div>
            <Button className="shrink-0" variant="outline" onClick={() => navigate("/medical-support")}>精神科・心療内科を探す</Button>
          </CardContent>
        </Card>

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
          {highlightReason && (
            <div className="max-w-2xl mx-auto p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-900">
              <p className="font-medium">おすすめの窓口</p>
              <p className="mt-1">{highlightReason}</p>
            </div>
          )}
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
                          <Card key={resource.id} id={`resource-${resource.id}`} className={`hover:shadow-lg transition-shadow ${highlightId === String(resource.id) ? 'ring-4 ring-yellow-300' : ''}`}>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-baseline gap-3">
                        <h3 className="text-lg font-bold text-primary mb-1">
                          {resource.name}
                        </h3>
                        {/* Tokyo open data badge if sourceType === 'tokyo' */}
                        {resource.sourceType === 'tokyo' ? (
                          <span className="text-sm font-semibold bg-green-600 text-white px-3 py-1 rounded-full shadow-sm">東京都オープンデータ</span>
                        ) : (
                          <span className="text-sm font-medium bg-muted px-2 py-1 rounded-md text-foreground/70">{resource.sourceType || resource.sourceName}</span>
                        )}
                      </div>

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

                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm text-foreground/80 space-y-1">
                        {resource.datasetId && (
                          <div>データセット: <span className="font-medium text-foreground">{resource.datasetId}</span></div>
                        )}
                        {resource.lastUpdated && (
                          <div>最終更新: <span className="font-medium text-foreground">{resource.lastUpdated}</span></div>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        {resource.portalUrl && (
                          <a
                            href={resource.portalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-accent hover:underline"
                          >
                            データソースを確認
                          </a>
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
                    </div>
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
