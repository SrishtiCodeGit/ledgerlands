"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { checkHolding } from "@/lib/holdings";
import { checkInvite, checkPlan } from "@/lib/plans";
import * as store from "@/lib/plan-store";
import { requireMe, requireUserId } from "@/lib/session";

export type FormState = { error?: string; done?: string } | null;

const fields = (fd: FormData) => Object.fromEntries(fd.entries());

export async function createPlan(_: FormState, fd: FormData): Promise<FormState> {
  const me = await requireMe();
  const r = checkPlan(fields(fd));
  if (r.kind === "invalid") return { error: r.error };
  const id = await store.createPlan(me.userId, me.email, r.value);
  revalidatePath("/app");
  redirect(`/app/plans/${id}`);
}

export async function updatePlan(planId: string, _: FormState, fd: FormData): Promise<FormState> {
  const userId = await requireUserId();
  const r = checkPlan(fields(fd));
  if (r.kind === "invalid") return { error: r.error };
  if (!(await store.updatePlan(userId, planId, r.value))) return { error: "You can't change this kingdom." };
  revalidatePath(`/app/plans/${planId}`);
  return { done: "Saved." };
}

export async function invite(planId: string, _: FormState, fd: FormData): Promise<FormState> {
  const me = await requireMe();
  const r = checkInvite(fields(fd), me.email);
  if (r.kind === "invalid") return { error: r.error };
  if (!(await store.inviteMember(me.userId, planId, r.value))) return { error: "Only the owner can invite people." };
  revalidatePath(`/app/plans/${planId}`);
  return { done: `Invited ${r.value.email}. They'll see this kingdom when they sign in with that email.` };
}

export async function removeMember(planId: string, memberId: string): Promise<void> {
  const userId = await requireUserId();
  await store.removeMember(userId, planId, memberId);
  revalidatePath(`/app/plans/${planId}`);
}

export async function leavePlan(planId: string): Promise<void> {
  const userId = await requireUserId();
  await store.leavePlan(userId, planId);
  revalidatePath("/app");
  redirect("/app");
}

export async function deletePlan(planId: string): Promise<void> {
  const userId = await requireUserId();
  await store.deletePlan(userId, planId);
  revalidatePath("/app");
  redirect("/app");
}

export async function addHolding(planId: string, _: FormState, fd: FormData): Promise<FormState> {
  const userId = await requireUserId();
  const r = checkHolding(fields(fd));
  if (r.kind === "invalid") return { error: r.error };
  if (!(await store.addHolding(userId, planId, r.value))) return { error: "You can't add to this kingdom." };
  revalidatePath(`/app/plans/${planId}`);
  return { done: `${r.value.name} is rising in your kingdom.` };
}

export async function updateHolding(planId: string, holdingId: string, _: FormState, fd: FormData): Promise<FormState> {
  const userId = await requireUserId();
  const r = checkHolding(fields(fd));
  if (r.kind === "invalid") return { error: r.error };
  if (!(await store.updateHolding(userId, planId, holdingId, r.value))) return { error: "You can't change this holding." };
  revalidatePath(`/app/plans/${planId}`);
  return { done: "Saved." };
}

export async function removeHolding(planId: string, holdingId: string): Promise<void> {
  const userId = await requireUserId();
  await store.removeHolding(userId, planId, holdingId);
  revalidatePath(`/app/plans/${planId}`);
}
