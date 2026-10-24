import Link from "next/link";
import { Suspense } from "react";
import { UserButton } from "@clerk/nextjs";
import AuthProvider from "@/components/auth-provider";
import Logo from "@/components/logo";
import ThemeToggle from "@/components/theme-toggle";
import { requireUserId } from "@/lib/session";
import "./shell.css";

// Shell for the signed-in product: kingdoms (plans) and Learn Finance. Everything inside needs an account.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="shell">
        <header className="shell-head">
          <Link className="brand" href="/app" aria-label="Your kingdoms">
            <Logo />
            Ledgerlands
          </Link>
          <nav aria-label="App">
            <Link className="tab" href="/app">Kingdoms</Link>
            <Link className="tab" href="/learn">Learn</Link>
            <ThemeToggle />
            <span className="user"><UserButton /></span>
          </nav>
        </header>
        <main className="shell-main">
          <Suspense fallback={null}>
            <SignedInOnly>{children}</SignedInOnly>
          </Suspense>
        </main>
      </div>
    </AuthProvider>
  );
}

async function SignedInOnly({ children }: { children: React.ReactNode }) {
  await requireUserId();
  return children;
}
