import Link from "next/link";
import Logo from "@/components/logo";
import ThemeToggle from "@/components/theme-toggle";
import "./shell.css";

// Shell for the signed-in product: kingdoms (plans) and Learn Finance.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="shell">
      <header className="shell-head">
        <Link className="brand" href="/" aria-label="Ledgerlands home">
          <Logo />
          Ledgerlands
        </Link>
        <nav aria-label="App">
          <Link className="tab" href="/app">Kingdoms</Link>
          <Link className="tab" href="/learn">Learn</Link>
          <ThemeToggle />
        </nav>
      </header>
      <main className="shell-main">{children}</main>
    </div>
  );
}
