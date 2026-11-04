"use client";

import { useEffect, useRef, useState } from "react";
import { loadScript, THREE_URL, type KingdomBuilding, type KingdomMood } from "@/lib/load-script";

export type BuildingLabel = { name: string; line: string; up: boolean };

// The plan's own 3D kingdom: each holding is a building, drawn by public/legacy/world.js.
// mood sets the owl: "up" cheers now and then, "down" droops, "flat" just keeps watch.
// onSelect fires when a building is tapped or clicked without dragging.
export default function KingdomView({ buildings, labels, mood, onSelect }: {
  buildings: KingdomBuilding[];
  labels: Record<string, BuildingLabel>;
  mood: KingdomMood;
  onSelect?: (id: string) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const select = useRef(onSelect);
  const [failed, setFailed] = useState(false);
  const [tip, setTip] = useState<{ id: string; x: number; y: number } | null>(null);
  const key = JSON.stringify(buildings);

  useEffect(() => {
    select.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    let alive = true;
    let world: { destroy(): void } | null = null;
    loadScript(THREE_URL)
      .then(() => loadScript("/legacy/owl.js"))
      .then(() => loadScript("/legacy/world.js"))
      .then(() => {
        const el = host.current;
        if (!alive || !el) return;
        world = window.LLWorld?.mount(el, {
          holdings: JSON.parse(key) as KingdomBuilding[],
          mood,
          onHover: (id, x, y) => {
            const r = el.getBoundingClientRect();
            setTip(id ? { id, x: x - r.left, y: y - r.top } : null);
          },
          onSelect: (id) => select.current?.(id),
        }) ?? null;
        if (!world) setFailed(true);
      })
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
      world?.destroy();
    };
  }, [key, mood]);

  const label = tip && labels[tip.id];
  return (
    <div className={`realm${failed ? " flat" : ""}`}>
      <div ref={host} className="realm-canvas" aria-hidden="true" />
      {label && (
        <div className="realm-tip" style={{ left: tip.x, top: tip.y }} role="status">
          <b>{label.name}</b>
          <span className={label.up ? "up" : "down"}>{label.line}</span>
        </div>
      )}
      {failed && <p className="realm-failed">The 3D kingdom couldn’t start in this browser. Your buildings are still listed under Buildings.</p>}
    </div>
  );
}
