import { Leaf, Sparkles } from "lucide-react";
import type { ReactNode } from "react";

type KokoroLetterProps = {
  title: string;
  eyebrow?: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export default function KokoroLetter({
  title,
  eyebrow = "ココロナビからの手紙",
  children,
  actions,
  className = "",
}: KokoroLetterProps) {
  return (
    <article className={`kokoro-letter ${className}`}>
      <div className="kokoro-letter__ornament" aria-hidden="true">
        <span />
        <Leaf className="h-5 w-5" />
        <span />
      </div>
      <div className="kokoro-letter__intro">
        <header className="kokoro-letter__header">
          <p className="kokoro-letter__eyebrow">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            {eyebrow}
          </p>
          <h2>{title}</h2>
        </header>
        <img
          className="kokoro-letter__mascot"
          src="/images/kokonyabi-letter-web.png"
          alt="手紙を届ける案内猫のここにゃび"
          width="180"
          height="270"
        />
      </div>
      <div className="kokoro-letter__body">{children}</div>
      <footer className="kokoro-letter__footer">
        <p>
          あなたのペースで、一歩ずつ。
          <span>ココロナビ</span>
        </p>
        <Leaf className="h-7 w-7" aria-hidden="true" />
      </footer>
      {actions && <div className="kokoro-letter__actions">{actions}</div>}
    </article>
  );
}
