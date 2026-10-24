import type { Metadata } from "next";
import Link from "next/link";
import { createPlan } from "../actions";
import { PlanForm } from "../forms";

export const metadata: Metadata = { title: "New kingdom · Ledgerlands" };

// The layout already requires sign-in; createPlan checks again on submit.
export default function NewPlanPage() {
  return (
    <>
      <Link className="back" href="/app">← Your kingdoms</Link>
      <h1>Found a new kingdom</h1>
      <p className="lede">Name it, say what it’s for, and add a goal if you have one. You can change all of this later.</p>
      <PlanForm action={createPlan} submit="Create kingdom" />
    </>
  );
}
