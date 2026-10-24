import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { claimInvites, listPlans } from "@/lib/plan-store";
import { requireMe } from "@/lib/session";
import { goalLine, money, ROLE_LABEL } from "./format";

export const metadata: Metadata = { title: "Your kingdoms · Ledgerlands" };

export default function KingdomsPage() {
  return (
    <>
      <h1>Your kingdoms</h1>
      <p className="lede">Each plan is its own kingdom, with its own goal and its own buildings. Make one for the family, one for stocks, one for anything you save toward.</p>
      <Suspense fallback={<div className="plans"><div className="plan-card skeleton" /><div className="plan-card skeleton" /></div>}>
        <Plans />
      </Suspense>
    </>
  );
}

async function Plans() {
  const me = await requireMe();
  await claimInvites(me.userId, me.verifiedEmails);
  const plans = await listPlans(me.userId);
  return (
    <div className="plans">
      {plans.map((p) => (
        <Link key={p.id} href={`/app/plans/${p.id}`} className="plan-card">
          <span className="kind">{p.kind}</span>
          <b>{p.name}</b>
          <span className="worth-sm">{p.holdings ? money(p.value, p.currency) : "No buildings yet"}</span>
          <span>{goalLine(p)}</span>
          <span className="meta">
            {ROLE_LABEL[p.role]}
            {p.members > 1 ? ` · ${p.members} people` : ""}
          </span>
        </Link>
      ))}
      <Link href="/app/new" className="plan-card new">
        <span className="plus" aria-hidden="true">+</span>
        {plans.length ? "New kingdom" : "Found your first kingdom"}
      </Link>
    </div>
  );
}
