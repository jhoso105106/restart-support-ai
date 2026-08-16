import { Button } from "@/components/ui/button";
import { ArrowRight, Building2, HeartHandshake, Hospital, House, Leaf, MessageCircleHeart, Mic2 } from "lucide-react";
import { useLocation } from "wouter";

const menuItems = [
  { title: "面接練習", description: "自信を持って話せるように", path: "/interview", icon: Mic2, color: "orange" },
  { title: "気分チェック", description: "今の気持ちをゆっくり整理", path: "/mood", icon: MessageCircleHeart, color: "yellow" },
  { title: "相談窓口を探す", description: "あなたに合う公的な相談先へ", path: "/support", icon: Building2, color: "green" },
  { title: "母親向け面接対策", description: "暮らしと仕事の両立を応援", path: "/womens-health?category=interview_for_mothers", icon: HeartHandshake, color: "coral" },
  { title: "精神科・心療内科を探す", description: "東京都の公式データから医療機関を検索", path: "/medical-support", icon: Hospital, color: "blue" },
] as const;

export default function Dashboard() {
  const [, navigate] = useLocation();
  return (
    <div className="min-h-screen bg-background sacred-geometry-bg kokoro-shell">
      <header className="sticky top-0 z-50">
        <div className="kokoro-header">
          <Button className="header-home" variant="ghost" aria-label="ホーム" onClick={() => navigate("/")}>
            <House className="h-6 w-6" /><span>ホーム</span>
          </Button>
          <div className="kokoro-logo"><Leaf className="h-9 w-9" /><h1>ココロナビ</h1></div>
          <Leaf className="header-leaf h-9 w-9" aria-hidden="true" />
        </div>
      </header>
      <main className="kokoro-main">
        <div className="hero-illustration" role="img" aria-label="湖畔の自然の中で穏やかに座る女性" />
        <section className="about-paper">
          <h2><Leaf className="h-7 w-7" />ココロナビについて</h2>
          <p>ココロナビは、女性の再就職や暮らしの不安に寄り添う総合サポートアプリです。面接の準備だけでなく、気持ちの整理、学び直し、信頼できる公的支援窓口探しまで、次の一歩を自分のペースで考えられるよう支援します。</p>
        </section>
        <section className="feature-grid" aria-label="サポートメニュー">
          {menuItems.map(item => {
            const Icon = item.icon;
            return <button key={item.path} className={`feature-card${item.path === "/medical-support" ? " feature-card--wide" : ""}`} onClick={() => navigate(item.path)}>
              <span className={`feature-icon feature-icon--${item.color}`}><Icon /></span>
              <span className="feature-copy"><strong>{item.title}</strong><small>{item.description}</small></span>
              <ArrowRight className="feature-arrow" />
            </button>;
          })}
        </section>
        <p className="closing-message"><Leaf />ひとりで抱え込まず、できることから少しずつ始めていきましょう。<Leaf /></p>
      </main>
    </div>
  );
}
