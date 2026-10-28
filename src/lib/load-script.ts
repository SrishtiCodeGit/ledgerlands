export const THREE_URL = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";

// Loads one classic script once, in order. The 3D world and the Steward bot are plain browser scripts
// in public/legacy, shared by the landing page and the plan pages.
export function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[data-src="${src}"]`);
    if (existing) {
      if (existing.dataset.loaded === "1") resolve();
      else existing.addEventListener("load", () => resolve(), { once: true });
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.dataset.src = src;
    s.async = false;
    s.addEventListener("load", () => { s.dataset.loaded = "1"; resolve(); }, { once: true });
    s.addEventListener("error", () => reject(new Error(`Could not load ${src}`)), { once: true });
    document.body.appendChild(s);
  });
}

// What public/legacy/world.js puts on window.
export type KingdomBuilding = { id: string; style: string; cost: number; value: number; tier: number };
export type KingdomHandle = { destroy(): void };
export type KingdomMood = "up" | "down" | "flat";
declare global {
  interface Window {
    LLWorld?: {
      mount(host: HTMLElement, opts?: { holdings?: KingdomBuilding[]; mood?: KingdomMood; onHover?: (id: string | null, x: number, y: number) => void }): KingdomHandle | null;
    };
  }
}
