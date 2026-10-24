// Rules for plans (kingdoms) and the people on them. Pure so they can be tested on their own.
export const PLAN_KINDS = ["Personal", "Family", "Retirement", "Stocks", "Funds and ETFs", "Crypto", "Commodities", "Bonds", "Other"] as const;
export const CURRENCIES = ["USD", "EUR", "GBP", "INR", "CAD", "AUD"] as const;
export const ROLES = ["owner", "editor", "viewer"] as const;

export type PlanKind = (typeof PLAN_KINDS)[number];
export type Currency = (typeof CURRENCIES)[number];
export type Role = (typeof ROLES)[number];

export type PlanInput = {
  name: string;
  kind: PlanKind;
  currency: Currency;
  goalAmount: number | null;
  goalDate: string | null; // YYYY-MM-DD
};

export type Invite = { email: string; role: Exclude<Role, "owner"> };

type Checked<T> = { kind: "ok"; value: T } | { kind: "invalid"; error: string };

const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,24}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function text(v: unknown, max: number): string {
  return typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, max) : "";
}

function oneOf<T extends string>(list: readonly T[], v: unknown): T | undefined {
  return list.find((x) => x === v);
}

export function isPlanId(v: unknown): v is string {
  return typeof v === "string" && UUID.test(v);
}

export function checkPlan(fields: Record<string, unknown>, now = new Date()): Checked<PlanInput> {
  const name = text(fields.name, 60);
  if (!name) return { kind: "invalid", error: "Give your kingdom a name." };

  const kind = oneOf(PLAN_KINDS, fields.kind);
  if (!kind) return { kind: "invalid", error: "Pick what this kingdom is for." };

  const currency = oneOf(CURRENCIES, fields.currency ?? "USD");
  if (!currency) return { kind: "invalid", error: "Pick a currency." };

  const rawAmount = text(fields.goalAmount, 24).replace(/[,\s]/g, "");
  let goalAmount: number | null = null;
  if (rawAmount) {
    goalAmount = Number(rawAmount);
    if (!Number.isFinite(goalAmount) || goalAmount <= 0 || goalAmount >= 1e13) {
      return { kind: "invalid", error: "The goal amount should be a positive number." };
    }
    goalAmount = Math.round(goalAmount * 100) / 100;
  }

  const rawDate = text(fields.goalDate, 10);
  let goalDate: string | null = null;
  if (rawDate) {
    const d = new Date(`${rawDate}T00:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(rawDate) || Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== rawDate) {
      return { kind: "invalid", error: "The goal date doesn't look right." };
    }
    if (rawDate <= now.toISOString().slice(0, 10)) return { kind: "invalid", error: "The goal date should be in the future." };
    if (d.getUTCFullYear() > now.getUTCFullYear() + 80) return { kind: "invalid", error: "Pick a goal date within 80 years." };
    goalDate = rawDate;
  }

  return { kind: "ok", value: { name, kind, currency, goalAmount, goalDate } };
}

export function checkInvite(fields: Record<string, unknown>, ownEmail: string): Checked<Invite> {
  const email = text(fields.email, 254).toLowerCase();
  if (!EMAIL.test(email)) return { kind: "invalid", error: "That email doesn't look right." };
  if (email === ownEmail.toLowerCase()) return { kind: "invalid", error: "You're already on this kingdom." };
  const role = fields.role === "editor" || fields.role === "viewer" ? fields.role : undefined;
  if (!role) return { kind: "invalid", error: "Pick viewer or editor." };
  return { kind: "ok", value: { email, role } };
}

// What each role may do. Viewers see; editors also change the plan; only the owner manages people and can delete it.
export function can(role: Role, action: "view" | "edit" | "manage"): boolean {
  if (action === "view") return true;
  if (action === "edit") return role === "owner" || role === "editor";
  return role === "owner";
}
