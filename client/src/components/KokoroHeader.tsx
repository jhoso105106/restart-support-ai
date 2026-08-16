import { Button } from "@/components/ui/button";
import { House, Leaf } from "lucide-react";
import { useLocation } from "wouter";

export default function KokoroHeader({ children }: { children?: React.ReactNode }) {
  const [, navigate] = useLocation();
  return (
    <header className="kokoro-shared-header sticky top-0 z-50">
      <div className="kokoro-header">
        <Button className="header-home" variant="ghost" aria-label="ホーム" onClick={() => navigate("/dashboard")}>
          <House className="h-6 w-6" /><span>ホーム</span>
        </Button>
        <div className="kokoro-logo"><Leaf className="h-9 w-9" /><h1>ココロナビ</h1></div>
        <div className="header-end">{children ?? <Leaf className="header-leaf h-9 w-9" aria-hidden="true" />}</div>
      </div>
    </header>
  );
}
