import Link from "next/link";
import AuthProvider from "@/components/auth-provider";
import Logo from "@/components/logo";
import ThemeToggle from "@/components/theme-toggle";
import "./auth.css";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="auth">
        <header className="auth-head">
          <Link className="brand" href="/" aria-label="Ledgerlands home">
            <Logo />
            Ledgerlands
          </Link>
          <ThemeToggle />
        </header>
        <main className="auth-main">
          <div className="auth-pitch">
            <h1>Your kingdom is waiting.</h1>
            <p>One account, a kingdom for every goal.</p>
          </div>
          {children}
        </main>
      </div>
    </AuthProvider>
  );
}
