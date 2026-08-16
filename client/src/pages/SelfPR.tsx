import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/utils/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Copy, ArrowLeft, Sparkles } from "lucide-react";
import { useLocation } from "wouter";
import KokoroHeader from "@/components/KokoroHeader";
import { toast } from "sonner";

export default function SelfPR() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [step, setStep] = useState<"input" | "preview">("input");
  const [experience, setExperience] = useState("");
  const [skills, setSkills] = useState("");
  const [achievements, setAchievements] = useState("");
  const [prText, setPrText] = useState("");

  const generateMutation = trpc.selfPR.generate.useMutation({
    onSuccess: (data) => {
      if (data.success && data.prText) {
        setPrText(data.prText);
        setStep("preview");
        toast.success("自己PRを生成しました");
      } else {
        toast.error(data.error || "生成に失敗しました");
      }
    },
    onError: (error) => {
      toast.error(error.message || "エラーが発生しました");
    },
  });

  const handleGeneratePR = async () => {
    if (!experience.trim() || !skills.trim()) {
      toast.error("経歴とスキルは必須です");
      return;
    }

    generateMutation.mutate({
      experience,
      skills,
      achievements: achievements || undefined,
    });
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(prText);
    toast.success("クリップボードにコピーしました");
  };

  return (
    <div className="min-h-screen bg-background sacred-geometry-bg">
      <KokoroHeader />

      <div className="container py-8 max-w-4xl">
        <div className="mb-8 text-center">
          <p className="text-muted-foreground">
            あなたのこれまでの歩みを、次のキャリアに繋げる力強い言葉に変換します。
          </p>
        </div>

        {step === "input" && (
          <Card className="border-t-4 border-t-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                あなたの経歴を教えてください
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground flex justify-between">
                  <span>職務経歴 <span className="text-destructive">*</span></span>
                  <span className="text-xs font-normal text-muted-foreground">どのようなお仕事をされてきましたか？</span>
                </label>
                <Textarea
                  placeholder="例：営業職として20年間、大手メーカーで営業活動に従事。新規顧客開拓、既存顧客管理、チームマネジメントを経験。"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  rows={5}
                  className="resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground flex justify-between">
                  <span>スキル・専門知識 <span className="text-destructive">*</span></span>
                  <span className="text-xs font-normal text-muted-foreground">得意なことや資格、専門スキル</span>
                </label>
                <Textarea
                  placeholder="例：営業戦略、顧客関係管理、プレゼンテーション、Excel、後進の育成"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground flex justify-between">
                  <span>実績・成果（任意）</span>
                  <span className="text-xs font-normal text-muted-foreground">数字や具体的なエピソードなど</span>
                </label>
                <Textarea
                  placeholder="例：売上目標を毎年達成、新規顧客100社以上開拓、営業チーム賞受賞"
                  value={achievements}
                  onChange={(e) => setAchievements(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>

              <Button
                className="w-full h-12 text-lg shadow-lg"
                onClick={handleGeneratePR}
                disabled={generateMutation.isPending}
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    AIが自己PRを作成しています...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    AIで自己PRを生成する
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {step === "preview" && (
          <div className="space-y-6">
            <Card className="border-t-4 border-t-primary shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl">生成された自己PR</CardTitle>
                <Button variant="outline" size="sm" onClick={handleCopyToClipboard}>
                  <Copy className="w-4 h-4 mr-2" />
                  コピー
                </Button>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="bg-muted/30 p-6 rounded-lg border border-border whitespace-pre-wrap text-foreground/90 leading-relaxed font-sans min-h-[300px]">
                  {prText}
                </div>

                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <Button
                    className="flex-1 h-12"
                    variant="outline"
                    onClick={() => setStep("input")}
                  >
                    内容を修正する
                  </Button>
                  <Button
                    className="flex-1 h-12"
                    onClick={handleCopyToClipboard}
                  >
                    この内容をコピーする
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-6">
                <h4 className="font-bold text-primary mb-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  50代の自己PRをさらに良くするポイント
                </h4>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="bg-background p-4 rounded-md border border-primary/10">
                    <p className="font-semibold text-sm mb-1">具体性を加える</p>
                    <p className="text-xs text-muted-foreground">「売上向上」だけでなく「前年比120%の売上向上」など、数字を入れると信頼感が増します。</p>
                  </div>
                  <div className="bg-background p-4 rounded-md border border-primary/10">
                    <p className="font-semibold text-sm mb-1">柔軟性をアピール</p>
                    <p className="text-xs text-muted-foreground">「新しいツール（SlackやZoom等）も積極的に活用している」旨を添えると、適応力の高さを伝えられます。</p>
                  </div>
                  <div className="bg-background p-4 rounded-md border border-primary/10">
                    <p className="font-semibold text-sm mb-1">育成の視点</p>
                    <p className="text-xs text-muted-foreground">プレイングマネージャーとしての経験や、後輩への技術継承ができる点は大きな強みです。</p>
                  </div>
                  <div className="bg-background p-4 rounded-md border border-primary/10">
                    <p className="font-semibold text-sm mb-1">企業への貢献</p>
                    <p className="text-xs text-muted-foreground">自分のやりたいことだけでなく、「企業が抱える課題をどう解決できるか」の視点で整えましょう。</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
