import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { costOf, nextTier, STYLE_FOR, summarize, TIER_NAMES, tierFor, valueOf } from "@/lib/holdings";
import { can } from "@/lib/plans";
import { getPlan, listHoldings, listMembers } from "@/lib/plan-store";
import { requireMe } from "@/lib/session";
import { addHolding, deletePlan, invite, leavePlan, removeHolding, removeMember, updateHolding, updatePlan } from "../../actions";
import { BUILDING_NAME, goalLine, money, moneyExact, pct, ROLE_LABEL, signedMoney } from "../../format";
import { ConfirmButton, HoldingForm, InviteForm, PlanForm } from "../../forms";
import KingdomView, { type BuildingLabel } from "./kingdom-view";

export const metadata: Metadata = { title: "Kingdom · Ledgerlands" };

export default function PlanPage({ params }: PageProps<"/app/plans/[id]">) {
  return (
    <>
      <Link className="back" href="/app">← Your kingdoms</Link>
      <Suspense fallback={<div className="realm skeleton" />}>
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
  const [holdings, members] = await Promise.all([listHoldings(me.userId, id), listMembers(me.userId, id)]);
  const editable = can(plan.role, "edit");
  const owner = can(plan.role, "manage");
  const sum = summarize(holdings, plan.goalAmount);
  const cur = plan.currency;

  const buildings = holdings.map((h) => ({ id: h.id, style: STYLE_FOR[h.assetClass], cost: costOf(h), value: valueOf(h), tier: tierFor(valueOf(h), cur) }));
  const labels: Record<string, BuildingLabel> = Object.fromEntries(
    holdings.map((h) => {
      const gain = valueOf(h) - costOf(h);
      return [h.id, { name: `${h.name} · ${TIER_NAMES[tierFor(valueOf(h), cur) - 1]} ${BUILDING_NAME[STYLE_FOR[h.assetClass]].toLowerCase()}`, line: `${money(valueOf(h), cur)} (${signedMoney(gain, cur)})`, up: gain >= 0 }];
    }),
  );

  return (
    <>
      <KingdomView buildings={buildings} labels={labels}>
        <span className="kind">{plan.kind} · {ROLE_LABEL[plan.role]}</span>
        <h1>{plan.name}</h1>
        {holdings.length ? (
          <>
            <p className="worth">{money(sum.value, cur)}</p>
            <p className={sum.gain >= 0 ? "up" : "down"}>
              {signedMoney(sum.gain, cur)}{sum.gainPct !== null ? ` (${pct(sum.gainPct)})` : ""} since you bought
            </p>
          </>
        ) : (
          <p className="quiet">An empty island, waiting for its first building.</p>
        )}
        {sum.goalPct !== null && (
          <div className="goal" role="img" aria-label={`${Math.round(sum.goalPct)}% of the goal`}>
            <div className="goal-bar"><i style={{ width: `${sum.goalPct}%` }} /></div>
            <span>{Math.round(sum.goalPct)}% · {goalLine(plan)}</span>
          </div>
        )}
      </KingdomView>

      {holdings.length === 0 && editable && (
        <section className="panel first-run" id="add">
          <h2>Add your first building</h2>
          <p>Tell us one thing this kingdom holds. Stocks become towers, funds become market halls, gold becomes a mine, bonds and cash a vault, crypto a crystal spire. Each starts as an Outpost and grows into a Manor, a Stronghold and finally a Citadel as its value grows.</p>
          <HoldingForm action={addHolding.bind(null, plan.id)} currency={cur} submit="Raise building" />
        </section>
      )}
      {holdings.length === 0 && !editable && (
        <section className="panel soon">
          <p>Nothing has been added to this kingdom yet. You can view it; the owner or an editor adds holdings.</p>
        </section>
      )}

      {holdings.length > 0 && (
        <section className="panel wide">
          <div className="panel-head">
            <h2>Buildings</h2>
            <span className="meta">{holdings.length} {holdings.length === 1 ? "holding" : "holdings"} · paid {money(sum.cost, cur)}</span>
          </div>
          <div className="mix" aria-label="Mix by kind">
            {sum.byClass.map((c) => (
              <i key={c.assetClass} className={`mix-${STYLE_FOR[c.assetClass]}`} style={{ flexGrow: c.share }} title={`${c.assetClass} ${Math.round(c.share * 100)}%`} />
            ))}
          </div>
          <p className="mix-key">
            {sum.byClass.map((c) => (
              <span key={c.assetClass}><i className={`mix-${STYLE_FOR[c.assetClass]}`} />{c.assetClass} {Math.round(c.share * 100)}%</span>
            ))}
          </p>
          <ul className="holdings">
            {holdings.map((h) => {
              const value = valueOf(h), gain = value - costOf(h), next = nextTier(value, cur);
              return (
                <li key={h.id}>
                  <div className="h-main">
                    <b>{h.name}{h.symbol ? <span className="sym"> {h.symbol}</span> : null}</b>
                    <span>{h.assetClass} · {h.quantity.toLocaleString("en-US")} × {moneyExact(h.unitPrice, cur)}</span>
                    <span className="tier">
                      <b>{TIER_NAMES[tierFor(value, cur) - 1]} {BUILDING_NAME[STYLE_FOR[h.assetClass]].toLowerCase()}</b>
                      {next ? (
                        <>
                          <span className="tier-bar" aria-hidden="true"><i style={{ width: `${next.progress * 100}%` }} /></span>
                          grows into a {next.name} at {money(next.at, cur)}
                        </>
                      ) : " · the highest tier"}
                    </span>
                  </div>
                  <div className="h-num">
                    <b>{money(value, cur)}</b>
                    <span className={gain >= 0 ? "up" : "down"}>{signedMoney(gain, cur)}</span>
                  </div>
                  {editable && (
                    <details className="h-edit">
                      <summary>Edit</summary>
                      <HoldingForm action={updateHolding.bind(null, plan.id, h.id)} holding={h} currency={cur} submit="Save" />
                      <form action={removeHolding.bind(null, plan.id, h.id)}>
                        <button className="btn-link">Remove {h.name}</button>
                      </form>
                    </details>
                  )}
                </li>
              );
            })}
          </ul>
          {editable && (
            <details className="add-more" id="add">
              <summary className="btn-quiet">+ Add a building</summary>
              <HoldingForm action={addHolding.bind(null, plan.id)} currency={cur} submit="Raise building" />
            </details>
          )}
        </section>
      )}

      <details className="panel settings">
        <summary><h2>Plan settings and people</h2><span className="meta">{members.length} {members.length === 1 ? "person" : "people"}</span></summary>

        {editable && (
          <div className="sub">
            <h3>Details</h3>
            <PlanForm action={updatePlan.bind(null, plan.id)} plan={plan} submit="Save changes" />
          </div>
        )}

        <div className="sub">
          <h3>People</h3>
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
        </div>

        {owner && (
          <div className="sub danger">
            <h3>Delete kingdom</h3>
            <p>This removes the plan and its buildings for everyone on it. It can’t be undone.</p>
            <ConfirmButton action={deletePlan.bind(null, plan.id)} question={`Delete "${plan.name}" for everyone? This can't be undone.`}>
              Delete kingdom
            </ConfirmButton>
          </div>
        )}
      </details>
    </>
  );
}
