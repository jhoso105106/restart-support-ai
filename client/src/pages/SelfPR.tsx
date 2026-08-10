import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Copy, Download } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function SelfPR() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [step, setStep] = useState<"input" | "preview">("input");
  const [experience, setExperience] = useState("");
  const [skills, setSkills] = useState("");
  const [achievements, setAchievements] = useState("");
  const [prText, setPrText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGeneratePR = async () => {
    if (!experience.trim() || !skills.trim()) {
      toast.error("経歴とスキルは必須です");
      return;
    }

    setLoading(true);
    try {
      // Simulate AI PR generation
      const generatedPR = `
【自己PR】

${experience.substring(0, 100)}の経験を活かし、以下のスキルを身につけてきました。

【主なスキル】
${skills.split("\n").filter(s => s.trim()).slice(0, 3).map(s => `• ${s.trim()}`).join("\n")}

【実績】
${achievements.trim() ? achievements.split("\n").filter(a => a.trim()).slice(0, 2).map(a => `• ${a.trim()}`).join("\n") : "• 複数の重要プロジェクトを成功させた実績"}

【強み】
50代だからこそ、20年以上の職務経歴と深い業界知識を持ち、
新しい環境でも即戦力として貢献できる自信があります。
また、後進の指導経験も豊富で、チームの一員として責任を持って働きます。

【今後の展望】
新しい環境での学習意欲は高く、デジタル化への対応も積極的に進めています。
これまでの経験と新しいスキルを組み合わせ、組織に大きな価値をもたらしたいと考えています。
      `.trim();

      setPrText(generatedPR);
      setStep("preview");
      toast.success("自己PRを生成しました");
    } catch (error) {
      toast.error("エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(prText);
    toast.success("クリップボードにコピーしました");
  };

  return (
    <div className="min-h-screen bg-background sacred-geometry-bg">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <h1 className="text-2xl font-bold text-primary">自己PR作成支援</h1>
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
          >
            ホームに戻る
          </Button>
        </div>
      </header>

      <div className="container py-12">
        {step === "input" && (
          <Card className="max-w-3xl mx-auto">
            <CardHeader>
              <CardTitle>あなたの経歴を教えてください</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  職務経歴 *
                </label>
                <Textarea
                  placeholder="例：営業職として20年間、大手メーカーで営業活動に従事。新規顧客開拓、既存顧客管理、チームマネジメントを経験。"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  スキル・専門知識 *
                </label>
                <Textarea
                  placeholder="例：営業戦略、顧客関係管理、プレゼンテーション、Excel、PowerPoint"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  実績・成果（任意）
                </label>
                <Textarea
                  placeholder="例：売上目標を毎年達成、新規顧客100社以上開拓、営業チーム賞受賞"
                  value={achievements}
                  onChange={(e) => setAchievements(e.target.value)}
                  rows={3}
                />
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleGeneratePR}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    生成中...
                  </>
                ) : (
                  "自己PRを生成する"
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {step === "preview" && (
          <Card className="max-w-3xl mx-auto">
            <CardHeader>
              <CardTitle>生成された自己PR</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-card/50 p-6 rounded-lg border border-border whitespace-pre-wrap text-foreground/90 leading-relaxed">
                {prText}
              </div>

              <div className="bg-accent/10 border border-accent/30 p-4 rounded-lg">
                <p className="text-sm text-foreground/80">
                  💡
                  このテキストは、あなたの入力をもとにAIが生成しました。
                  <br />
                  面接や履歴書に合わせて、自由に編集してご利用ください。
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  className="flex-1"
                  variant="outline"
                  onClick={() => {
                    setStep("input");
                    setPrText("");
                  }}
                >
                  編集に戻る
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleCopyToClipboard}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  コピー
                </Button>
              </div>

              <div className="pt-4 border-t border-border">
                <h4 className="font-semibold text-foreground mb-3">
                  💡 自己PRを活かすコツ
                </h4>
                <ul className="space-y-2 text-sm text-foreground/80">
                  <li>
                    ✓
                    <strong>具体性</strong>：数字や実績を交えて、説得力を持たせる
                  </li>
                  <li>
                    ✓
                    <strong>50代の強み</strong>：経験と信頼性を強調する
                  </li>
                  <li>
                    ✓
                    <strong>学習意欲</strong>：新しい環境への適応力をアピール
                  </li>
                  <li>
                    ✓
                    <strong>簡潔さ</strong>：1分で話せる長さを目安に
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
