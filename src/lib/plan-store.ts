// Database reads and writes for plans and their members. Every query takes the caller's user id
// and checks their role in SQL, so a missing check in a page can't leak or change someone else's plan.
import { sql } from "./db.ts";
import { isPlanId, type Invite, type PlanInput, type Role } from "./plans.ts";

export type Plan = PlanInput & { id: string; role: Role; members: number; createdAt: string };
export type Member = { id: string; email: string; role: Role; joined: boolean };

type Row = Record<string, unknown>;

function toPlan(r: Row): Plan {
  return {
    id: r.id as string,
    name: r.name as string,
    kind: r.kind as Plan["kind"],
    currency: r.currency as Plan["currency"],
    goalAmount: r.goal_amount === null ? null : Number(r.goal_amount),
    goalDate: (r.goal_date as string | null) ?? null,
    role: r.role as Role,
    members: Number(r.members),
    createdAt: r.created_at as string,
  };
}

const PLAN_COLUMNS = `p.id, p.name, p.kind, p.currency, p.goal_amount::float8 as goal_amount, p.goal_date::text as goal_date,
  p.created_at::text as created_at, m.role, (select count(*) from plan_members c where c.plan_id = p.id) as members`;

// Turns pending invites sent to any of this person's verified emails into memberships.
export async function claimInvites(userId: string, verifiedEmails: string[]): Promise<void> {
  if (!verifiedEmails.length) return;
  await sql()`
    update plan_members m set user_id = ${userId}, joined_at = now()
    where m.user_id is null and m.email = any(${verifiedEmails})
      and not exists (select 1 from plan_members x where x.plan_id = m.plan_id and x.user_id = ${userId})`;
}

export async function listPlans(userId: string): Promise<Plan[]> {
  const rows = await sql().query(
    `select ${PLAN_COLUMNS} from plans p join plan_members m on m.plan_id = p.id and m.user_id = $1 order by p.created_at`,
    [userId],
  );
  return (rows as Row[]).map(toPlan);
}

export async function getPlan(userId: string, planId: string): Promise<Plan | null> {
  if (!isPlanId(planId)) return null;
  const rows = await sql().query(
    `select ${PLAN_COLUMNS} from plans p join plan_members m on m.plan_id = p.id and m.user_id = $1 where p.id = $2`,
    [userId, planId],
  );
  return rows.length ? toPlan(rows[0] as Row) : null;
}

export async function listMembers(userId: string, planId: string): Promise<Member[]> {
  if (!isPlanId(planId)) return [];
  const rows = (await sql()`
    select m.id, m.email, m.role, m.user_id is not null as joined from plan_members m
    where m.plan_id = ${planId} and exists (select 1 from plan_members me where me.plan_id = ${planId} and me.user_id = ${userId})
    order by case m.role when 'owner' then 0 when 'editor' then 1 else 2 end, m.invited_at`) as Row[];
  return rows.map((r) => ({ id: r.id as string, email: r.email as string, role: r.role as Role, joined: Boolean(r.joined) }));
}

export async function createPlan(userId: string, email: string, p: PlanInput): Promise<string> {
  const rows = (await sql()`
    with plan as (
      insert into plans (owner_id, name, kind, currency, goal_amount, goal_date)
      values (${userId}, ${p.name}, ${p.kind}, ${p.currency}, ${p.goalAmount}, ${p.goalDate})
      returning id
    ), owner as (
      insert into plan_members (plan_id, user_id, email, role, joined_at)
      select id, ${userId}, ${email}, 'owner', now() from plan
    )
    select id from plan`) as Row[];
  return rows[0].id as string;
}

// Owners and editors may change the plan's details.
export async function updatePlan(userId: string, planId: string, p: PlanInput): Promise<boolean> {
  if (!isPlanId(planId)) return false;
  const rows = await sql()`
    update plans set name = ${p.name}, kind = ${p.kind}, currency = ${p.currency},
      goal_amount = ${p.goalAmount}, goal_date = ${p.goalDate}, updated_at = now()
    where id = ${planId} and exists (
      select 1 from plan_members m where m.plan_id = ${planId} and m.user_id = ${userId} and m.role in ('owner', 'editor'))
    returning id`;
  return rows.length > 0;
}

export async function deletePlan(userId: string, planId: string): Promise<boolean> {
  if (!isPlanId(planId)) return false;
  const rows = await sql()`delete from plans where id = ${planId} and owner_id = ${userId} returning id`;
  return rows.length > 0;
}

// Only the owner invites. Re-inviting the same email updates its role; the owner's own row never changes.
export async function inviteMember(userId: string, planId: string, invite: Invite): Promise<boolean> {
  if (!isPlanId(planId)) return false;
  const rows = await sql()`
    insert into plan_members (plan_id, email, role)
    select ${planId}, ${invite.email}, ${invite.role}
    where exists (select 1 from plans where id = ${planId} and owner_id = ${userId})
    on conflict (plan_id, email) do update set role = excluded.role where plan_members.role <> 'owner'
    returning id`;
  return rows.length > 0;
}

export async function removeMember(userId: string, planId: string, memberId: string): Promise<boolean> {
  if (!isPlanId(planId) || !isPlanId(memberId)) return false;
  const rows = await sql()`
    delete from plan_members where id = ${memberId} and plan_id = ${planId} and role <> 'owner'
      and exists (select 1 from plans where id = ${planId} and owner_id = ${userId})
    returning id`;
  return rows.length > 0;
}

export async function leavePlan(userId: string, planId: string): Promise<boolean> {
  if (!isPlanId(planId)) return false;
  const rows = await sql()`delete from plan_members where plan_id = ${planId} and user_id = ${userId} and role <> 'owner' returning id`;
  return rows.length > 0;
}
