import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

const cards = [
  {
    id: "interview",
    title: "面接練習",
    icon: "📝",
    action: "/interview",
    tone: "warm",
    subtitle: "自己PRの言葉を整える",
  },
  {
    id: "mood",
    title: "気分チェック",
    icon: "😊",
    action: "/mood",
    tone: "gold",
    subtitle: "心の状態を整える",
  },
  {
    id: "support",
    title: "相談窓口を探す",
    icon: "🏠",
    action: "/support",
    tone: "green",
    subtitle: "地域の支援を見つける",
  },
  {
    id: "mother",
    title: "母親向け面接対策",
    icon: "👩‍👧",
    action: "/womens-health?category=interview_for_mothers",
    tone: "peach",
    subtitle: "育児と仕事を両立する",
  },
] as const;

export default function Dashboard() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-[#edf0e4] text-[#2e3b2d]">
      <div className="mx-auto max-w-[480px] px-3 py-4 md:py-8">
        <div className="koro-shell rounded-[30px] border border-[#d9dfd0] bg-[#f3f5ef] p-3 shadow-[0_8px_18px_rgba(85,118,86,0.08)]">
          <header className="mb-3 flex items-center justify-between rounded-[22px] bg-[#f1f5ef] px-3 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#4f8a58] text-2xl text-white shadow-sm">
                🏠
              </div>
              <div className="text-[2.1rem] font-black tracking-tight text-[#4f8a58] [font-family:'Noto_Sans_JP','Yu_Gothic','sans-serif']">
                ココロナビ
              </div>
            </div>
            <div className="rounded-full bg-[#e8efe0] px-3 py-1.5 text-sm font-semibold text-[#4d5c4c] shadow-inner">
              Made with AI
            </div>
          </header>

          <section className="hero-scene mb-5 overflow-hidden rounded-[28px] bg-[linear-gradient(180deg,#bfe4d1_0%,#d6e8d0_32%,#dfeecf_49%,#dfe9d0_100%)] px-2 pb-2 pt-2">
            <div className="hero-illustration relative h-[270px]">
              <div className="absolute left-2 top-4 h-3 w-20 rounded-full bg-white/60 blur-[2px]" />
              <div className="absolute left-8 top-10 h-10 w-10 rounded-full bg-white/40 blur-[1px]" />
              <div className="absolute left-20 top-12 h-16 w-16 rounded-full bg-white/35" />

              <div className="absolute left-0 top-20 h-24 w-24 rounded-full bg-[#4b7c54]/80 blur-[2px]" />
              <div className="absolute left-5 top-16 h-14 w-14 rounded-full bg-[#4b7c54]/70 blur-[2px]" />
              <div className="absolute left-16 top-18 h-12 w-12 rounded-full bg-[#4b7c54]/70 blur-[2px]" />

              <div className="absolute left-0 bottom-4 h-24 w-24 rounded-full bg-[#8dbb78]/80 blur-[2px]" />
              <div className="absolute right-0 bottom-3 h-20 w-20 rounded-full bg-[#8dbb78]/80 blur-[2px]" />

              <div className="absolute left-1/2 top-[18px] h-[140px] w-[170px] -translate-x-1/2 rounded-[52%_48%_42%_58%/56%_54%_46%_44%] bg-[#f5d2a1] shadow-inner" />
              <div className="absolute left-1/2 top-[42px] h-[110px] w-[110px] -translate-x-1/2 rounded-full bg-[#f7d5a5]" />
              <div className="absolute left-[calc(50%-51px)] top-[46px] h-[20px] w-[20px] rounded-full bg-[#3d2a2a]" />
              <div className="absolute left-[calc(50%+31px)] top-[46px] h-[20px] w-[20px] rounded-full bg-[#3d2a2a]" />
              <div className="absolute left-1/2 top-[78px] h-3 w-10 -translate-x-1/2 rounded-full bg-[#a35a3f]" />
              <div className="absolute left-1/2 top-[96px] h-7 w-14 -translate-x-1/2 rounded-full bg-[#f2b86e]" />

              <div className="absolute left-1/2 top-[118px] h-[120px] w-[90px] -translate-x-1/2 rounded-[28px] bg-[#f0a95e]" />
              <div className="absolute left-[calc(50%-46px)] top-[124px] h-[84px] w-[32px] rounded-[16px] bg-[#f0b16d]" />
              <div className="absolute left-[calc(50%+18px)] top-[124px] h-[84px] w-[32px] rounded-[16px] bg-[#f0b16d]" />
              <div className="absolute left-1/2 top-[176px] h-[52px] w-[120px] -translate-x-1/2 rounded-[30px] bg-[#f5c88e]" />

              <div className="absolute left-[calc(50%-75px)] top-[170px] h-[56px] w-[56px] rounded-full bg-[#f0b16d]" />
              <div className="absolute left-[calc(50%+18px)] top-[170px] h-[56px] w-[56px] rounded-full bg-[#f0b16d]" />
              <div className="absolute left-[calc(50%-105px)] top-[204px] h-[64px] w-[28px] rounded-full bg-[#242631]" />
              <div className="absolute left-[calc(50%+78px)] top-[204px] h-[64px] w-[28px] rounded-full bg-[#242631]" />
              <div className="absolute left-[calc(50%-50px)] top-[220px] h-[26px] w-[110px] rounded-full bg-[#242631]" />

              <div className="absolute left-12 bottom-5 h-12 w-8 rounded-full bg-[#378064]" />
              <div className="absolute right-12 bottom-5 h-12 w-8 rounded-full bg-[#378064]" />
              <div className="absolute left-10 bottom-6 h-6 w-12 rounded-full bg-[#6db269]" />
              <div className="absolute right-8 bottom-6 h-6 w-12 rounded-full bg-[#6db269]" />
            </div>
          </section>

          <section className="rounded-[26px] bg-[#edf2ea] px-5 py-5 shadow-inner shadow-[#dfe6d7]">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#dfecc9] text-2xl shadow-sm">
                🌿
              </div>
              <div className="text-[2rem] font-black leading-none tracking-tight text-[#2d3d2a] [font-family:'Noto_Sans_JP','Yu_Gothic','sans-serif']">
                ココロナビについて
              </div>
            </div>

            <p className="text-[1rem] leading-[1.85] text-[#3c4a3c]">
              ココロナビは、女性の再就職や暮らしの不安に寄り添う総合サポートアプリです。面接の準備だけでなく、気持ちの整理、学び直し、信頼できる公的支援窓口探しまで、次の一歩を自分のペースで考えられるよう支援します。
            </p>
          </section>

          <section className="mt-5 grid grid-cols-2 gap-3">
            {cards.map(card => (
              <button
                key={card.id}
                type="button"
                onClick={() => navigate(card.action)}
                className={`koro-card ${card.tone} group flex min-h-[150px] flex-col justify-between rounded-[22px] border border-[#dfe6d6] p-4 text-left shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md`}
              >
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-[18px] bg-white/30 text-4xl shadow-inner">
                  {card.icon}
                </div>
                <div className="space-y-1">
                  <div className="text-[1.55rem] font-black leading-none text-[#2d3c2c] [font-family:'Noto_Sans_JP','Yu_Gothic','sans-serif']">
                    {card.title}
                  </div>
                  <div className="mt-2 text-sm font-medium text-[#4a5647]">
                    {card.subtitle}
                  </div>
                </div>
                <div className="mt-3 text-right text-2xl text-[#49634f]">›</div>
              </button>
            ))}
          </section>

          <div className="mt-5 rounded-[26px] bg-[#edf2ea] px-5 py-4 text-center text-[1.1rem] font-medium italic text-[#465b4a]">
            ひとりで抱え込まず、できることから少しずつ始めましょう。
          </div>
        </div>
      </div>
    </div>
  );
}
