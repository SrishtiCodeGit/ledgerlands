import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import { themeInitScript } from "@/lib/theme";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Ledgerlands · Money is confusing. Your kingdom isn't.",
  description:
    "Ledgerlands turns your investments into a living kingdom, so you see at a glance what's growing, what needs care, and what to do next.",
  openGraph: {
    title: "Ledgerlands",
    description: "Money is confusing. Your kingdom isn't. See your investments as a living kingdom.",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#bfe6dc" },
    { media: "(prefers-color-scheme: dark)", color: "#04140f" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // data-theme is set by the init script before React hydrates, so the attribute differs on purpose.
    <html lang="en" className={outfit.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
