import type { Metadata } from "next";
import { Suspense } from "react";
import { SignIn } from "@clerk/nextjs";

export const metadata: Metadata = { title: "Sign in · Ledgerlands" };

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="auth-card-fallback" />}>
      <SignIn />
    </Suspense>
  );
}
