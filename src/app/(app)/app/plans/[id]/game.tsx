"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { UserButton } from "@clerk/nextjs";
import ThemeToggle from "@/components/theme-toggle";
import type { KingdomBuilding, KingdomMood } from "@/lib/load-script";
import KingdomView, { type BuildingLabel } from "./kingdom-view";

export type PanelId = "buildings" | "build" | "settings";
type Panel = { id: PanelId; label: string; title: string; content: React.ReactNode; primary?: boolean };

// A kingdom as a full-screen game: the island fills the screen, the numbers float in a corner,
// and everything else opens as a drawer over the world from the toolbar at the bottom.
export default function Game({ buildings, labels, mood, stats, owlLine, panels, start }: {
  buildings: KingdomBuilding[];
  labels: Record<string, BuildingLabel>;
  mood: KingdomMood;
  stats: React.ReactNode;
  owlLine: string;
  panels: Panel[];
  start: PanelId | null;
}) {
  const [open, setOpen] = useState<PanelId | null>(start);
  const [selected, setSelected] = useState<string | null>(null);

  // The page behind the game shouldn't scroll while it's open.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Tapping a building opens the list at that building.
  const onSelect = useCallback((id: string) => { setSelected(id); setOpen("buildings"); }, []);
  useEffect(() => {
    if (!selected || open !== "buildings") return;
    document.querySelectorAll(".holdings li.selected").forEach((li) => li.classList.remove("selected"));
    const el = document.getElementById(`b-${selected}`);
    el?.classList.add("selected");
    el?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [selected, open]);

  const current = panels.find((p) => p.id === open);
  return (
    <div className="game">
      <KingdomView buildings={buildings} labels={labels} mood={mood} onSelect={onSelect} />

      <header className="hud-top">
        <Link className="hud-back" href="/app" aria-label="Back to your kingdoms">← Kingdoms</Link>
        <div className="hud-stats">{stats}</div>
        <div className="hud-right">
          <ThemeToggle />
          <span className="user"><UserButton /></span>
        </div>
      </header>

      <p className={`owl-says ${mood}`} role="status"><span aria-hidden="true" className="owl-dot" />{owlLine}</p>

      <nav className="hud-bar" aria-label="Kingdom">
        {panels.map((p) => (
          <button key={p.id} type="button" className={`${p.primary ? "primary" : ""}${open === p.id ? " on" : ""}`}
            aria-expanded={open === p.id} aria-controls="drawer" onClick={() => setOpen(open === p.id ? null : p.id)}>
            {p.label}
          </button>
        ))}
      </nav>

      <aside id="drawer" className={`drawer${current ? " open" : ""}`} aria-label={current?.title} inert={!current}>
        <div className="drawer-head">
          <h2>{current?.title}</h2>
          <button type="button" className="icon-btn" aria-label="Close" onClick={() => setOpen(null)}>✕</button>
        </div>
        {/* Every panel stays mounted so a half-filled form keeps its values when you switch. */}
        {panels.map((p) => (
          <div key={p.id} className="drawer-body" hidden={p.id !== open}>{p.content}</div>
        ))}
      </aside>
    </div>
  );
}
