import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { can } from "@/lib/plans";
import { getPlan, listMembers } from "@/lib/plan-store";
import { requireMe } from "@/lib/session";
import { deletePlan, invite, leavePlan, removeMember, updatePlan } from "../../actions";
import { goalLine, ROLE_LABEL } from "../../format";
import { ConfirmButton, InviteForm, PlanForm } from "../../forms";

export const metadata: Metadata = { title: "Kingdom · Ledgerlands" };

export default function PlanPage({ params }: PageProps<"/app/plans/[id]">) {
  return (
    <>
      <Link className="back" href="/app">← Your kingdoms</Link>
      <Suspense fallback={<h1 className="skeleton-line">Loading kingdom…</h1>}>
        <PlanDetail params={params} />
      </Suspense>
    </>
  );
}

async function PlanDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await requireMe();
  const plan = await getPlan(me.userId, id);
  if (!plan) notFound();
  const members = await listMembers(me.userId, id);
  const editable = can(plan.role, "edit");
  const owner = can(plan.role, "manage");

  return (
    <>
      <div className="plan-head">
        <span className="kind">{plan.kind} · {ROLE_LABEL[plan.role]}</span>
        <h1>{plan.name}</h1>
        <p className="lede">{goalLine(plan)}</p>
      </div>

      <section className="panel soon">
        <h2>The kingdom</h2>
        <p>Holdings and the 3D kingdom for this plan arrive in the next phase. Each holding will become a building here.</p>
      </section>

      {editable && (
        <section className="panel">
          <h2>Details</h2>
          <PlanForm action={updatePlan.bind(null, plan.id)} plan={plan} submit="Save changes" />
        </section>
      )}

      <section className="panel">
        <h2>People</h2>
        <ul className="members">
          {members.map((m) => (
            <li key={m.id}>
              <span className="who">{m.email}{m.email === me.email ? " (you)" : ""}</span>
              <span className="role">{m.role === "owner" ? "Owner" : m.role === "editor" ? "Can edit" : "Can view"}{m.joined ? "" : " · invited"}</span>
              {owner && m.role !== "owner" && (
                <form action={removeMember.bind(null, plan.id, m.id)}>
                  <button className="btn-link">Remove</button>
                </form>
              )}
            </li>
          ))}
        </ul>
        {owner ? (
          <>
            <p className="hint">Invite family or a partner. They sign up with the same email and the kingdom appears in their list.</p>
            <InviteForm action={invite.bind(null, plan.id)} />
          </>
        ) : (
          <ConfirmButton action={leavePlan.bind(null, plan.id)} question={`Leave "${plan.name}"? The owner can invite you again.`}>
            Leave this kingdom
          </ConfirmButton>
        )}
      </section>

      {owner && (
        <section className="panel danger">
          <h2>Delete kingdom</h2>
          <p>This removes the plan for everyone on it. It can’t be undone.</p>
          <ConfirmButton action={deletePlan.bind(null, plan.id)} question={`Delete "${plan.name}" for everyone? This can't be undone.`}>
            Delete kingdom
          </ConfirmButton>
        </section>
      )}
    </>
  );
}
