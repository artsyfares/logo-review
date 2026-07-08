# CLAUDE.md

Guidance for Claude Code (and any human) working in this repository.

## What this project is

LogoAI is an AI design-intelligence platform for branding professionals — a collaborative critique/iteration partner, not a logo generator. Full product vision: [docs/PRODUCT_VISION.md](docs/PRODUCT_VISION.md). Current build plan: [ROADMAP.md](ROADMAP.md).

**Read the vision doc before proposing new features.** Every feature must trace back to one of the 9 principles below — if it doesn't, it's scope creep.

## Product Principles (non-negotiable)

1. Professional quality over speed.
2. Explanation over prediction.
3. Iteration over replacement.
4. Education over automation.
5. Collaboration over generation.
6. Transparency over black-box decisions.
7. Designer control over AI control.
8. Maintainability over shortcuts.
9. Scalability over temporary solutions.

Concretely, this means:
- **Never emit a bare score.** Every score/verdict ships with the reasoning, the principles invoked, and a confidence level. If a UI mock or API shape shows a number with no explanation attached, it's wrong.
- **Deterministic analysis + AI reasoning, not AI alone.** Measurable properties (contrast ratios, symmetry, whitespace ratios, color palette extraction, stroke-width consistency) are computed with real algorithms in the analysis service. The LLM reasons over those computed facts plus the image — it doesn't eyeball contrast ratios itself.
- **The designer decides.** The AI proposes redesign directions with trade-offs; it never auto-applies a redesign or silently "fixes" the user's logo.

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Web app | Next.js (App Router) + TypeScript + Tailwind CSS | Fast iteration, server components for AI streaming, one deploy target (Vercel) |
| Analysis service | Python (FastAPI) | Mature libraries for raster/vector analysis (Pillow, OpenCV, svgelements/lxml, colormath), kept separate so heavy image work doesn't block the web app's request cycle |
| Database | PostgreSQL via Neon, accessed with Drizzle ORM | SQL-native, typesafe, edge/serverless-friendly (no cold-start proxy issues like Prisma+edge) |
| Auth | Clerk | Ships orgs/teams/roles primitives out of the box — needed later for Phase 4 collaboration, not worth hand-rolling |
| File storage | Any S3-compatible provider via `apps/web/src/lib/object-storage.ts` — Backblaze B2 (current, free tier needs no card) or Cloudflare R2 (better long-term economics, no egress fees, but requires a card even for its free tier) | R2 was the original choice but blocked on requiring a credit card; B2 is a drop-in swap since the code only needs `STORAGE_ENDPOINT`/credentials/bucket, nothing Cloudflare-specific. Revisit R2 once a card is available and cost matters more than it does at zero-traffic dev stage. |
| AI provider | Pluggable — Gemini (`gemini-2.5-flash`, default) or Anthropic (`claude-opus-4-8`), switch via `AI_PROVIDER` env var | One live test on Opus cost $0.18/review — real money during active development/iteration. User explicitly opted for cheapest-viable for now (Gemini's free tier), with Anthropic kept as a one-env-var swap for when quality is prioritized over cost again. `apps/web/src/lib/ai/providers/` implements a shared `AIReviewProvider` interface so both share the same review schema, system prompt, and validation — no other code needs to know which provider is active. |
| Analysis service hosting | Fly.io or Railway | Simple deploy for a small Python service, no need for full AWS/K8s at this stage |
| Package manager | pnpm (web), uv (Python) | Fast, standard for each ecosystem |

These are defaults chosen for a solo, AI-assisted build optimizing for speed of iteration. Revisit only if a concrete limitation shows up — don't swap technologies preemptively.

## Repository Structure

```
logo-review/
├── apps/
│   └── web/                 # Next.js app — UI, API routes, auth, DB access
├── services/
│   └── analysis/            # Python FastAPI — raster/vector analysis, deterministic scoring
├── packages/
│   └── shared/              # Shared TS types (review schema, API contracts) used by apps/web
├── docs/
│   └── PRODUCT_VISION.md
├── CLAUDE.md
└── ROADMAP.md
```

This structure doesn't exist yet — it's created in Phase 0 of the roadmap. Don't invent a different layout mid-build; if a task needs a new top-level folder, add it here first.

## Architecture (high level)

1. User uploads a logo (raster and/or vector) in `apps/web`.
2. `apps/web` sends the asset to `services/analysis`, which computes deterministic metrics (contrast, symmetry, color palette, whitespace, scalability signals) and returns a structured facts object.
3. `apps/web` sends the image + the deterministic facts to Claude with a schema-constrained prompt (tool use) requiring the full structured review shape (see "AI Review" in the vision doc: executive summary, scores, confidence, strengths/weaknesses, redesign directions, etc.) — the LLM never invents the measurable facts, it interprets them.
4. The review is persisted (Postgres) and rendered in structured UI sections, never a single blob of prose.
5. Follow-up chat messages are scoped to the project and include prior review context so the AI can answer "why does this feel unbalanced" without re-deriving everything.

## Development Conventions

- TypeScript strict mode everywhere in `apps/web` and `packages/shared`.
- No comments that restate what code does; comments only for non-obvious *why*.
- Small, reviewable increments — prefer finishing one roadmap task cleanly over half-finishing several.
- Every AI-facing schema (the review shape, redesign-direction shape, etc.) lives in `packages/shared` as the single source of truth for both the prompt's tool schema and the frontend's TypeScript types — don't duplicate the shape by hand in two places.
- Don't build collaboration/org/permission plumbing before Phase 4 — Clerk is set up early because retrofitting auth is painful, but org/role UI stays out until the roadmap calls for it.

## Working Agreements (solo + AI-assisted)

- Use the task list (`TaskCreate`/`TaskUpdate`) for any multi-step unit of work; check off `ROADMAP.md` items as they land.
- When a roadmap task turns out to be bigger than it looked, split it in `ROADMAP.md` rather than silently expanding scope inside one PR-sized change.
- Before starting a new phase, re-skim `docs/PRODUCT_VISION.md` for that phase's section — it has more nuance than the roadmap's task-list summary.

## Commands

All web commands can be run from the repo root (pnpm workspace) or from `apps/web`.

```bash
# Web app (apps/web)
pnpm dev                 # start Next.js dev server (localhost:3000)
pnpm --filter web run build
pnpm --filter web run lint
pnpm --filter web run typecheck
pnpm --filter web run db:generate   # generate a Drizzle migration from schema.ts
pnpm --filter web run db:migrate    # apply migrations (needs DATABASE_URL)
pnpm --filter web run db:studio     # Drizzle Studio DB browser

# Analysis service (services/analysis)
cd services/analysis
uv sync
uv run uvicorn app.main:app --reload --port 8000
uv run pytest -q
```

`apps/web` requires a `.env.local` — copy `apps/web/.env.example` and fill in real values (Neon `DATABASE_URL`, Clerk keys, R2 credentials, `ANTHROPIC_API_KEY`, `ANALYSIS_SERVICE_URL`). Without Clerk keys set, `next dev` auto-provisions temporary "keyless" dev credentials and prints a claim URL — fine for local iteration, but claim them (or set real keys) before deploying.
