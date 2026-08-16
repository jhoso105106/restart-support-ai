import KokoroHeader from "@/components/KokoroHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Hospital, Loader2, MapPin, Phone, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type MedicalInstitution = {
  id: string;
  name: string;
  facilityType: string;
  area: string;
  address: string;
  phone: string;
  departments: string;
  url: string | null;
  sourceName: string;
  sourceUrl: string;
  datasetId: string;
  resourceId: string;
  dataAsOf: string;
};

export default function MedicalSupport() {
  const [items, setItems] = useState<MedicalInstitution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [area, setArea] = useState("すべて");
  const [department, setDepartment] = useState("すべて");
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(20);

  useEffect(() => {
    fetch("/data/mental-health-medical-institutions.json")
      .then(response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then(data => setItems(Array.isArray(data.items) ? data.items : []))
      .catch(() => setError("医療機関データを読み込めませんでした。"))
      .finally(() => setLoading(false));
  }, []);

  const areas = useMemo(() => ["すべて", ...Array.from(new Set(items.map(item => item.area))).sort((a, b) => a.localeCompare(b, "ja"))], [items]);
  const results = useMemo(() => items.filter(item => {
    const areaMatches = area === "すべて" || item.area === area;
    const departmentMatches = department === "すべて" || (department === "精神科" ? item.departments.includes("精神") : item.departments.includes(department));
    const queryMatches = !query.trim() || `${item.name} ${item.address} ${item.departments}`.toLowerCase().includes(query.trim().toLowerCase());
    return areaMatches && departmentMatches && queryMatches;
  }), [items, area, department, query]);

  return (
    <div className="min-h-screen bg-background sacred-geometry-bg">
      <KokoroHeader />
      <main className="container py-8 sm:py-12">
        <div className="mx-auto max-w-5xl space-y-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center justify-center gap-3"><Hospital className="h-7 w-7 text-green-700" />精神科・心療内科を探す</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-xl border border-amber-700/20 bg-amber-50 p-4 text-sm leading-7 text-amber-950">
                この検索は診断や医療機関の評価を行うものではありません。受診を希望する方が、厚生労働省の公式オープンデータから候補を探すための機能です。診療内容・予約方法は受診前に公式サイト等でご確認ください。
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div><label htmlFor="medical-area" className="mb-2 block">地域</label><select id="medical-area" value={area} onChange={event => { setArea(event.target.value); setLimit(20); }} className="w-full border px-3">{areas.map(value => <option key={value}>{value}</option>)}</select></div>
                <div><label htmlFor="medical-department" className="mb-2 block">診療科</label><select id="medical-department" value={department} onChange={event => { setDepartment(event.target.value); setLimit(20); }} className="w-full border px-3"><option>すべて</option><option>精神科</option><option>心療内科</option></select></div>
                <div><label htmlFor="medical-query" className="mb-2 block">施設名・住所</label><div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/50" /><input id="medical-query" value={query} onChange={event => { setQuery(event.target.value); setLimit(20); }} className="w-full pl-10" placeholder="例：中野、メンタル" /></div></div>
              </div>
              <p className="text-sm text-foreground/65">収録範囲：東京23区（厚生労働省「医療情報ネット」2026年6月1日時点）。該当 {results.length}件</p>
            </CardContent>
          </Card>

          {loading ? <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div> : error ? <Card><CardContent className="py-10 text-center text-destructive">{error}</CardContent></Card> : (
            <div className="space-y-4">
              {results.slice(0, limit).map(item => <Card key={item.id}>
                <CardContent className="space-y-4 pt-6">
                  <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-bold">{item.name}</h2><p className="mt-1 text-sm text-foreground/65">{item.facilityType}・{item.area}</p></div><span className="rounded-full bg-green-700 px-3 py-1 text-xs font-bold text-white">公的オープンデータ</span></div>
                  <p className="rounded-lg bg-green-50 p-3 text-sm"><strong>診療科：</strong>{item.departments}</p>
                  <div className="grid gap-3 text-sm md:grid-cols-2"><div className="flex gap-2"><MapPin className="h-4 w-4 shrink-0 text-green-800" />{item.address}</div>{item.phone && <div className="flex gap-2"><Phone className="h-4 w-4 shrink-0 text-green-800" /><a className="font-bold underline" href={`tel:${item.phone.split("・")[0]}`}>{item.phone}</a></div>}</div>
                  <div className="space-y-2 border-t pt-4 text-xs text-foreground/70">
                    <p><span className="font-bold">出典：</span>{item.sourceName}</p>
                    <p><span className="font-bold">データ基準日：</span>{item.dataAsOf}</p>
                    <div className="flex flex-wrap gap-4">{item.url && <a className="font-bold text-green-900 underline" href={item.url} target="_blank" rel="noopener noreferrer">医療機関の公式サイト <ExternalLink className="inline h-3 w-3" /></a>}<a className="font-bold text-green-900 underline" href={item.sourceUrl} target="_blank" rel="noopener noreferrer">原典オープンデータ <ExternalLink className="inline h-3 w-3" /></a></div>
                  </div>
                </CardContent>
              </Card>)}
              {limit < results.length && <Button className="w-full" variant="outline" onClick={() => setLimit(value => value + 20)}>さらに20件表示</Button>}
              {!results.length && <Card><CardContent className="py-10 text-center">条件に一致する医療機関がありません。</CardContent></Card>}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
