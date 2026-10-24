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
| `src/app/(app)` | Product shell: kingdoms (`/app`) and Learn Finance (`/learn`) |
| `src/app/api/early-access` | Saves early-access signups as private files in Vercel Blob |
| `src/lib` | Theme handling and signup validation (with tests) |
| `public/legacy` | The 3D world and bot as plain scripts; they become React components in Phase 2 |

## Environment

`BLOB_READ_WRITE_TOKEN` comes from the connected Vercel Blob store. Pull it with `vercel env pull`.

## Plan

Build plan, Monte Carlo methodology and decision log: [Ledgerlands · Build Plan & Methodology](https://claude.ai/artifact/UMyTrjrqsGrCQeKtoVNzYM).
