# Ledgerlands

Your portfolio as a living 3D kingdom. Every holding becomes a building: gains glow, dips darken, and an AI guide (the Steward) explains what moved in plain words.

Live: https://ledgerlands-site.vercel.app

## Run it locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Checks

```bash
npm run check   # lint, type-check, unit tests
npm run build   # production build
```

CI runs both on every push (`.github/workflows/ci.yml`). Pushes to `main` deploy to production on Vercel.

## Layout

| Path | What it is |
| --- | --- |
| `src/app/(marketing)` | Landing page: full-screen 3D kingdom, sky text, Steward early-access bot |
| `src/app/(auth)` | Sign-in and sign-up (Clerk) |
| `src/app/(app)` | Signed-in product: kingdoms (`/app`, one per plan, shared with family as viewer or editor) and Learn Finance (`/learn`) |
| `src/app/api/early-access` | Saves early-access signups as private files in Vercel Blob |
| `src/lib` | Plan rules and signup validation (with tests), database queries, session helpers, theme |
| `src/proxy.ts` | Clerk session on each request; pages and Server Functions check sign-in themselves |
| `db/schema.sql` | Database tables (plans, plan members) |
| `public/legacy` | The 3D world and bot as plain scripts; they become React components in Phase 2 |

## Environment

All keys come from the Vercel project. Pull them with `vercel env pull .env.local`.

| Variable | From |
| --- | --- |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob store (early-access signups) |
| `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk (accounts) |
| `DATABASE_URL` | Neon Postgres (plans) |

After changing `db/schema.sql`, apply it with `npm run db:migrate`. The schema is safe to run more than once.

## Plan

Build plan, Monte Carlo methodology and decision log: [Ledgerlands · Build Plan & Methodology](https://claude.ai/artifact/UMyTrjrqsGrCQeKtoVNzYM).
