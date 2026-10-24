import type { Plan } from "@/lib/plan-store";
import type { BuildingStyle } from "@/lib/holdings";
import type { Role } from "@/lib/plans";

export const ROLE_LABEL: Record<Role, string> = { owner: "Yours", editor: "You can edit", viewer: "You can view" };

export function money(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

export function goalLine(p: Pick<Plan, "goalAmount" | "goalDate" | "currency">): string {
  const date = p.goalDate
    ? new Date(`${p.goalDate}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" })
    : "";
  if (p.goalAmount && date) return `Goal ${money(p.goalAmount, p.currency)} by ${date}`;
  if (p.goalAmount) return `Goal ${money(p.goalAmount, p.currency)}`;
  if (date) return `Goal date ${date}`;
  return "No goal set yet";
}

export const BUILDING_NAME: Record<BuildingStyle, string> = { tower: "Tower", hall: "Market hall", wizard: "Crystal spire", mine: "Gold mine", vault: "Vault" };

export function moneyExact(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);
}

export function signedMoney(amount: number, currency: string): string {
  return `${amount >= 0 ? "+" : "−"}${money(Math.abs(amount), currency)}`;
}

export function pct(fraction: number): string {
  return `${fraction >= 0 ? "+" : "−"}${Math.abs(fraction * 100).toFixed(1)}%`;
}
