"use client";

import { useActionState } from "react";
import { CURRENCIES, PLAN_KINDS, type PlanInput } from "@/lib/plans";
import type { FormState } from "./actions";

type Action = (state: FormState, fd: FormData) => Promise<FormState>;

function Status({ state }: { state: FormState }) {
  if (state?.error) return <p className="form-msg err" role="alert">{state.error}</p>;
  if (state?.done) return <p className="form-msg ok" role="status">{state.done}</p>;
  return null;
}

export function PlanForm({ action, plan, submit }: { action: Action; plan?: PlanInput; submit: string }) {
  const [state, run, pending] = useActionState(action, null);
  return (
    <form action={run} className="form">
      <label>
        <span>Name</span>
        <input name="name" required maxLength={60} defaultValue={plan?.name} placeholder="Family retirement" />
      </label>
      <div className="row">
        <label>
          <span>What it’s for</span>
          <select name="kind" defaultValue={plan?.kind ?? "Personal"}>
            {PLAN_KINDS.map((k) => <option key={k}>{k}</option>)}
          </select>
        </label>
        <label>
          <span>Currency</span>
          <select name="currency" defaultValue={plan?.currency ?? "USD"}>
            {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
      </div>
      <div className="row">
        <label>
          <span>Goal amount <i>optional</i></span>
          <input name="goalAmount" inputMode="decimal" defaultValue={plan?.goalAmount ?? ""} placeholder="500,000" />
        </label>
        <label>
          <span>Goal date <i>optional</i></span>
          <input name="goalDate" type="date" defaultValue={plan?.goalDate ?? ""} />
        </label>
      </div>
      <Status state={state} />
      <button className="btn-primary" disabled={pending}>{pending ? "Saving…" : submit}</button>
    </form>
  );
}

export function InviteForm({ action }: { action: Action }) {
  const [state, run, pending] = useActionState(action, null);
  return (
    <form action={run} className="form invite">
      <div className="row">
        <label className="grow">
          <span>Email</span>
          <input name="email" type="email" required placeholder="sam@example.com" />
        </label>
        <label>
          <span>Can</span>
          <select name="role" defaultValue="viewer">
            <option value="viewer">View</option>
            <option value="editor">Edit</option>
          </select>
        </label>
      </div>
      <Status state={state} />
      <button className="btn-quiet" disabled={pending}>{pending ? "Inviting…" : "Invite"}</button>
    </form>
  );
}

// A form button that asks before doing something that can't be undone.
export function ConfirmButton({ action, question, children }: { action: () => Promise<void>; question: string; children: React.ReactNode }) {
  return (
    <form action={action} onSubmit={(e) => { if (!confirm(question)) e.preventDefault(); }}>
      <button className="btn-danger">{children}</button>
    </form>
  );
}
