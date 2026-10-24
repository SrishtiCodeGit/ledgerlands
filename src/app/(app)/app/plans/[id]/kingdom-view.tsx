"use client";

import { useEffect, useRef, useState } from "react";
import { loadScript, THREE_URL, type KingdomBuilding } from "@/lib/load-script";

export type BuildingLabel = { name: string; line: string; up: boolean };

// The plan's own 3D kingdom: each holding is a building, drawn by public/legacy/world.js.
// Children float over it (the plan's name, value and goal).
export default function KingdomView({ buildings, labels, children }: { buildings: KingdomBuilding[]; labels: Record<string, BuildingLabel>; children: React.ReactNode }) {
  const host = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const [tip, setTip] = useState<{ id: string; x: number; y: number } | null>(null);
  const key = JSON.stringify(buildings);

  useEffect(() => {
    let alive = true;
    let world: { destroy(): void } | null = null;
    loadScript(THREE_URL)
      .then(() => loadScript("/legacy/world.js"))
      .then(() => {
        const el = host.current;
        if (!alive || !el) return;
        world = window.LLWorld?.mount(el, {
          holdings: JSON.parse(key) as KingdomBuilding[],
          onHover: (id, x, y) => {
            const r = el.getBoundingClientRect();
            setTip(id ? { id, x: x - r.left, y: y - r.top } : null);
          },
        }) ?? null;
        if (!world) setFailed(true);
      })
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
      world?.destroy();
    };
  }, [key]);

  const label = tip && labels[tip.id];
  return (
    <div className={`realm${failed ? " flat" : ""}`}>
      <div ref={host} className="realm-canvas" aria-hidden="true" />
      <div className="realm-over">{children}</div>
      {label && (
        <div className="realm-tip" style={{ left: tip.x, top: tip.y }} role="status">
          <b>{label.name}</b>
          <span className={label.up ? "up" : "down"}>{label.line}</span>
        </div>
      )}
      {!failed && <span className="realm-hint">Drag to look around</span>}
    </div>
  );
}
