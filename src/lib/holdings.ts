// Rules for holdings, and the sums a kingdom shows. Pure so they can be tested on their own.
export const ASSET_CLASSES = ["Stocks", "Funds and ETFs", "Crypto", "Gold and metals", "Bonds", "Cash", "Other"] as const;
export type AssetClass = (typeof ASSET_CLASSES)[number];

// The building each kind of holding becomes. Holdings of the same style share a district.
export type BuildingStyle = "tower" | "hall" | "wizard" | "mine" | "vault";
export const STYLE_FOR: Record<AssetClass, BuildingStyle> = {
  Stocks: "tower",
  "Funds and ETFs": "hall",
  Crypto: "wizard",
  "Gold and metals": "mine",
  Bonds: "vault",
  Cash: "vault",
  Other: "hall",
};

export type HoldingInput = {
  name: string;
  symbol: string | null;
  assetClass: AssetClass;
  quantity: number;
  unitCost: number;
  unitPrice: number;
};

export type Holding = HoldingInput & { id: string };

type Checked<T> = { kind: "ok"; value: T } | { kind: "invalid"; error: string };

function text(v: unknown, max: number): string {
  return typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, max) : "";
}

// Reads a number typed by a person: allows "1,200.50" and "$300", refuses anything else.
function amount(v: unknown): number | null {
  const s = text(v, 32).replace(/[,\s$€£₹]/g, "");
  if (!s) return null;
  if (!/^\d*\.?\d+$/.test(s)) return NaN;
  return Number(s);
}

export function checkHolding(fields: Record<string, unknown>): Checked<HoldingInput> {
  const name = text(fields.name, 60);
  if (!name) return { kind: "invalid", error: "Name the holding, for example Apple or S&P 500 fund." };

  const symbol = text(fields.symbol, 12).toUpperCase() || null;
  if (symbol && !/^[A-Z0-9.\-^=]+$/.test(symbol)) return { kind: "invalid", error: "The ticker can use letters, numbers, dots and dashes." };

  const assetClass = ASSET_CLASSES.find((c) => c === fields.assetClass);
  if (!assetClass) return { kind: "invalid", error: "Pick what kind of holding this is." };

  const quantity = amount(fields.quantity);
  if (quantity === null || !Number.isFinite(quantity) || quantity <= 0 || quantity >= 1e15) {
    return { kind: "invalid", error: "The quantity should be a number above zero." };
  }

  const unitCost = amount(fields.unitCost);
  if (unitCost === null || !Number.isFinite(unitCost) || unitCost >= 1e13) {
    return { kind: "invalid", error: "Enter what you paid for each unit." };
  }

  const now = amount(fields.unitPrice);
  if (now !== null && (!Number.isFinite(now) || now >= 1e13)) return { kind: "invalid", error: "The price now doesn't look right." };

  return {
    kind: "ok",
    value: { name, symbol, assetClass, quantity: round(quantity, 8), unitCost: round(unitCost, 4), unitPrice: round(now ?? unitCost, 4) },
  };
}

function round(n: number, places: number): number {
  const f = 10 ** places;
  return Math.round(n * f) / f;
}

export const valueOf = (h: Pick<HoldingInput, "quantity" | "unitPrice">) => h.quantity * h.unitPrice;
export const costOf = (h: Pick<HoldingInput, "quantity" | "unitCost">) => h.quantity * h.unitCost;

export type Summary = {
  value: number;
  cost: number;
  gain: number;
  gainPct: number | null; // null when nothing was paid
  byClass: { assetClass: AssetClass; value: number; share: number }[]; // largest first
  goalPct: number | null; // share of the goal reached, capped at 100; null without a goal
};

export function summarize(holdings: HoldingInput[], goalAmount: number | null): Summary {
  let value = 0, cost = 0;
  const by = new Map<AssetClass, number>();
  for (const h of holdings) {
    const v = valueOf(h);
    value += v;
    cost += costOf(h);
    by.set(h.assetClass, (by.get(h.assetClass) ?? 0) + v);
  }
  const byClass = [...by]
    .map(([assetClass, v]) => ({ assetClass, value: v, share: value > 0 ? v / value : 0 }))
    .sort((a, b) => b.value - a.value);
  return {
    value,
    cost,
    gain: value - cost,
    gainPct: cost > 0 ? (value - cost) / cost : null,
    byClass,
    goalPct: goalAmount ? Math.min(100, (value / goalAmount) * 100) : null,
  };
}

// ----- building tiers -----
// A building grows through four tiers as its holding's value grows: Outpost, Manor, Stronghold, Citadel.
// Steps are in US dollars and scaled for other currencies so a tier means roughly the same amount everywhere.
export const TIER_NAMES = ["Outpost", "Manor", "Stronghold", "Citadel"] as const;
export type Tier = 1 | 2 | 3 | 4;
const TIER_STEPS_USD = [1_000, 10_000, 50_000];
const CURRENCY_SCALE: Record<string, number> = { USD: 1, EUR: 1, GBP: 1, CAD: 1.4, AUD: 1.5, INR: 80 };

export function tierSteps(currency: string): number[] {
  const k = CURRENCY_SCALE[currency] ?? 1;
  return TIER_STEPS_USD.map((s) => s * k);
}

export function tierFor(value: number, currency: string): Tier {
  const steps = tierSteps(currency);
  return (1 + steps.filter((s) => value >= s).length) as Tier;
}

// How far a holding is from its next tier, for the "grows into a Stronghold at $10,000" hint.
export function nextTier(value: number, currency: string): { name: string; at: number; progress: number } | null {
  const t = tierFor(value, currency);
  if (t === 4) return null;
  const steps = tierSteps(currency), from = t === 1 ? 0 : steps[t - 2], at = steps[t - 1];
  return { name: TIER_NAMES[t], at, progress: Math.max(0, Math.min(1, (value - from) / (at - from))) };
}
