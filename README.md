# Autonomous SaaS Builder

A 7-agent autonomous build pipeline that constructed a SaaS prototype over ~150 cycles — each cycle planning a feature, writing the code, running QA, and self-deploying — without manual coding.

---

## What This Is

This is an experiment in autonomous software construction. Instead of writing the app by hand, I designed a pipeline where seven Claude Code agents collaborate in sequence — each with a narrow, scoped role — and the loop repeats, adding one feature per cycle.

The app it produced — TruckerFlow, a trucking business management tool — is the **evidence the pipeline works**, not the project itself. The pipeline is the project.

**This is a prototype and proof of concept.** The app has rough edges and bugs; the goal was to answer a specific question: *can a well-structured agentic pipeline produce genuinely usable software — not just scaffolding or toy code?*

---

## The 7-Agent Loop

Each cycle runs all seven agents in sequence. Agents communicate through files — no shared memory, no direct calls between agents.

```
saas-run.sh
  │
  ├─ 1. Planner       reads project_memory.json → writes cycle_plan.md
  ├─ 2. Builder       reads cycle_plan.md + codebase → writes/edits source files
  ├─ 3. Validator     runs tsc + npm run build → fixes errors, writes build report
  ├─ 4. QA            writes + runs Playwright tests → writes test results
  ├─ 5. Evaluator     reads QA results → marks feature complete or incomplete
  ├─ 6. Journalist    writes structured build log entry
  └─ 7. State Writer  updates project_memory.json, increments cycle counter
```

If the Evaluator marks a feature incomplete, the Planner re-queues it next cycle. No human intervention needed to recover from a failed build.

The loop is controlled by:
- `paused` file — create this file to stop the loop cleanly at the end of the current cycle
- `blockers.json` — agents write here when they hit something unresolvable; the cycle stops for human review
- `systemd` timer — schedules cycles on the VPS (every 6 hours while active)

---

## Repository Structure

```
autonomous-saas-builder/
├── pipeline/
│   ├── saas-run.sh          # The build loop — bash state machine driving all 7 agents
│   └── prompts/
│       ├── 01-planner.md    # Decides the next feature each cycle
│       ├── 02-builder.md    # Implements the feature end-to-end
│       ├── 03-validator.md  # Runs tsc + build, fixes errors
│       ├── 04-qa.md         # Writes and runs Playwright tests
│       ├── 05-evaluator.md  # Judges quality, marks feature pass/fail
│       ├── 06-journalist.md # Writes structured build log
│       └── 07-state-writer.md # Updates project_memory.json
├── app/                     # TruckerFlow v7 — Next.js 14 source (pipeline output)
│   ├── app/                 # Next.js App Router pages and API routes
│   ├── components/          # React components
│   ├── lib/                 # Auth, db, utilities
│   ├── prisma/              # Schema and migrations
│   └── ...
├── docs/
│   └── architecture.md      # Detailed pipeline design notes
└── README.md
```

---

## The App: TruckerFlow

A trucking business management SaaS for owner-operators. Built entirely by the pipeline over ~150 cycles.

**27 shipped features including:**
- Trip and expense tracking with cost-per-mile calculations
- AI receipt scanner (Claude Vision — photo to expense entry)
- Settlement slip and bank statement import
- IFTA mileage report generation
- Income projection calculator with break-even rate
- P&L dashboard with customizable widgets
- Stripe subscription billing (trial, monthly, annual)
- NextAuth v5 with credentials + two-factor auth (email OTP)
- Forgot password, email verification, account deletion
- CSV import with auto-column mapping
- Data export (CSV, PDF)
- Mobile-responsive throughout

**Tech stack:** Next.js 14 · TypeScript · Tailwind CSS · NextAuth v5 · Prisma · PostgreSQL · Stripe · Anthropic Claude · Resend · Playwright

---

## Key Engineering Decisions

**Why 7 separate agents instead of one?**
Context window limits. A single agent asked to "build a SaaS" drifts, loses track of earlier decisions, and produces inconsistent code across sessions. Scoping each agent to one task — plan, build, validate, test, judge, document, update state — keeps each session focused and recoverable.

**Why file-based communication?**
Files survive between Claude sessions. `project_memory.json` is the persistent brain — it carries the feature list, architecture decisions, and cycle history across every session. Without it, each cycle would start from scratch.

**Why `output: 'standalone'` for Next.js?**
The standalone output bundles everything the app needs into `.next/standalone/`. A single `pm2 restart` redeploys without reinstalling dependencies — the Builder agent can deploy in one shell command after a build.

**Why Playwright for QA instead of unit tests?**
The QA agent writes tests *for the feature it just saw built* rather than maintaining a static test suite. Playwright tests against the running app catch integration problems that unit tests miss. The test suite evolves with the app automatically.

**What didn't work well:**
- The Builder occasionally made architectural decisions that conflicted with earlier cycles, requiring human correction
- QA tests sometimes tested implementation details rather than behavior, making them brittle across rebuilds
- The Evaluator was too lenient in early cycles, passing features with obvious gaps

---

## Running Locally

The pipeline requires Claude Code and a Postgres database. The app itself runs standalone.

```bash
# App only (no pipeline)
cd app
cp .env.example .env.local   # fill in DATABASE_URL and AUTH_SECRET at minimum
npm install
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

For the full pipeline, see [`docs/architecture.md`](docs/architecture.md).

---

## What I'd Do Differently

This was a first pass at autonomous SaaS construction. If I ran it again:

1. **Stricter Evaluator** — require specific acceptance criteria per feature, not a quality score
2. **Regression tests** — the QA agent should re-run the full existing test suite each cycle, not just tests for the new feature
3. **Schema migration discipline** — the Builder should generate Prisma migrations rather than editing the schema directly; several cycles broke earlier data models
4. **Smaller features** — some cycles tried to build too much at once; features scoped to under ~200 lines of new code had significantly higher pass rates

---

---

## Author

**Victor Foster**
- GitHub: [@vfoster-repo](https://github.com/vfoster-repo)
- LinkedIn: [Victor Foster](https://linkedin.com/in/vfoster-connect)
- Email: victorfoster@hotmail.com

---

## License

MIT — see [LICENSE](LICENSE)
