-- Ledgerlands schema. Safe to run more than once (npm run db:migrate).
-- Users live in Clerk; we store their Clerk user id, never a password.

create table if not exists plans (
  id uuid primary key default gen_random_uuid(),
  owner_id text not null,
  name text not null check (char_length(name) between 1 and 60),
  kind text not null,
  currency char(3) not null default 'USD',
  goal_amount numeric(16, 2) check (goal_amount > 0),
  goal_date date,
  target_mix jsonb not null default '{}'::jsonb,
  drift_pct numeric(5, 2) not null default 5,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One row per person on a plan. The owner has a row too, so every access check reads this table.
-- An invite is a row with an email and no user_id yet; it is claimed when that person signs in with a verified email.
create table if not exists plan_members (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references plans(id) on delete cascade,
  user_id text,
  email text not null,
  role text not null check (role in ('owner', 'editor', 'viewer')),
  invited_at timestamptz not null default now(),
  joined_at timestamptz,
  unique (plan_id, email)
);

create unique index if not exists plan_members_plan_user on plan_members (plan_id, user_id) where user_id is not null;
create index if not exists plan_members_user on plan_members (user_id);
create index if not exists plan_members_pending_email on plan_members (email) where user_id is null;

-- What a plan holds. Each holding becomes a building in that plan's kingdom.
-- unit_price is what the person entered for now; live prices replace it in Phase 3 (price_source).
create table if not exists holdings (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references plans(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  symbol text check (symbol is null or char_length(symbol) between 1 and 12),
  asset_class text not null,
  quantity numeric(24, 8) not null check (quantity > 0),
  unit_cost numeric(18, 4) not null check (unit_cost >= 0),
  unit_price numeric(18, 4) not null check (unit_price >= 0),
  price_source text not null default 'manual',
  created_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists holdings_plan on holdings (plan_id);
