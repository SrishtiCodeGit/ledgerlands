import type { Metadata } from "next";

export const metadata: Metadata = { title: "Your kingdoms · Ledgerlands" };

// Phase 0 placeholder: shows the shape of the plans screen. Sign-in and real plans arrive in Phase 1.
const EXAMPLE_PLANS = [
  { name: "Family retirement", line: "Shared with your family" },
  { name: "Stocks", line: "Personal, higher risk" },
  { name: "Commodities", line: "Gold and silver" },
];

export default function KingdomsPage() {
  return (
    <>
      <span className="preview-tag">Preview · sign-in arrives in Phase 1</span>
      <h1>Your kingdoms</h1>
      <p className="lede">Each plan is its own kingdom, with its own goal, target mix and projections. Make one for the family, one for stocks, one for anything you save toward.</p>
      <div className="plans">
        {EXAMPLE_PLANS.map((p) => (
          <div key={p.name} className="plan-card">
            <b>{p.name}</b>
            <span>{p.line}</span>
            <span>Example plan</span>
          </div>
        ))}
        <div className="plan-card new">+ New plan</div>
      </div>
    </>
  );
}
