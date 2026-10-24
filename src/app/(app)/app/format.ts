import type { Plan } from "@/lib/plan-store";
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
