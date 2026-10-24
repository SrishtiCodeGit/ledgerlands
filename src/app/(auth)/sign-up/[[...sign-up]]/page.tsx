import type { Metadata } from "next";
import { Suspense } from "react";
import { SignUp } from "@clerk/nextjs";

export const metadata: Metadata = { title: "Create your account · Ledgerlands" };

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="auth-card-fallback" />}>
      <SignUp />
    </Suspense>
  );
}
