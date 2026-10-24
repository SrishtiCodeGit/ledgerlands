import { ClerkProvider } from "@clerk/nextjs";

// Clerk is loaded only on the product and sign-in pages, not on the landing page. Colors follow the brand tokens in globals.css.
export default function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/app"
      signUpFallbackRedirectUrl="/app"
      afterSignOutUrl="/"
      appearance={{
        variables: {
          colorPrimary: "#0d8a5f",
          colorBackground: "var(--bot-bg)",
          colorForeground: "var(--ink)",
          colorMutedForeground: "var(--muted)",
          colorInput: "var(--field)",
          colorInputForeground: "var(--ink)",
          colorNeutral: "var(--ink)",
          fontFamily: "var(--font)",
          borderRadius: "14px",
        },
      }}
    >
      {children}
    </ClerkProvider>
  );
}
