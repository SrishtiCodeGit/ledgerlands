import type { Metadata } from "next";

export const metadata: Metadata = { title: "Learn Finance · Ledgerlands" };

// Phase 0 placeholder for the Duolingo-style path. Lessons, XP and streaks arrive in Phase 5.
const UNITS = [
  "Money basics",
  "Saving and compound interest",
  "Stocks",
  "Funds and ETFs",
  "Bonds and interest rates",
  "Risk and diversification",
  "Reading your kingdom",
  "Planning and projections",
];

export default function LearnPage() {
  return (
    <>
      <span className="preview-tag">Preview · lessons arrive in Phase 5</span>
      <h1>Learn Finance</h1>
      <p className="lede">Five-minute lessons that build real money skills. Keep a streak, earn XP, and decorate your kingdom as you level up.</p>
      <div className="stats">
        <div><b>0</b><span>XP</span></div>
        <div><b>0 days</b><span>Streak</span></div>
        <div><b>Squire</b><span>Level</span></div>
      </div>
      <ol className="path">
        {UNITS.map((u, i) => (
          <li key={u} className={i === 0 ? "" : "locked"}>
            <span className="node">{i + 1}</span>
            <span>{u}</span>
          </li>
        ))}
      </ol>
    </>
  );
}
