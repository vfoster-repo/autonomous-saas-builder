# Pipeline Architecture

## Overview

The pipeline is a bash state machine (`saas-run.sh`) that drives seven Claude Code agents in sequence. Each agent is a separate, isolated Claude session — they share no memory except files written to the project directory.

## State Files

| File | Owner | Purpose |
|------|-------|---------|
| `project_memory.json` | State Writer (read by all) | Persistent project state — feature list, architecture, cycle count, scores history |
| `cycle_plan.md` | Planner → Builder | The current cycle's feature spec |
| `cycle_log/` | Journalist | Per-cycle build log entries |
| `blockers.json` | Any agent | Unresolvable problems that need human review |
| `paused` | Human | Create this file to stop the loop cleanly |

## Agent Contracts

### 1. Planner (`01-planner.md`)
- **Reads:** `project_memory.json`
- **Writes:** `cycle_plan.md`
- **Decision:** Which feature from `features_pending` to build next, and a precise spec for the Builder to follow
- **Constraint:** Must not change architecture. Must not modify source files.

### 2. Builder (`02-builder.md`)
- **Reads:** `cycle_plan.md`, all source files
- **Writes:** Source files (new and modified), Prisma schema/migrations if needed
- **Decision:** How to implement the spec — component structure, API design, database schema
- **Constraint:** Must match existing patterns. Must not break existing features.

### 3. Validator (`03-validator.md`)
- **Runs:** `tsc --noEmit`, `npm run build`
- **Writes:** Build report
- **Decision:** Fix TypeScript errors and build failures before passing to QA
- **Constraint:** Up to 3 self-correction attempts before writing a blocker

### 4. QA (`04-qa.md`)
- **Reads:** `cycle_plan.md`, build report
- **Writes:** Playwright test file for the new feature, test results
- **Runs:** Tests against `localhost:{PORT}`
- **Decision:** Write tests that verify the feature spec, not implementation details
- **Key:** Also re-runs a subset of smoke tests for previously shipped features to catch regressions

### 5. Evaluator (`05-evaluator.md`)
- **Reads:** `cycle_plan.md`, test results, build report
- **Writes:** Evaluation result (`pass` / `incomplete`), quality notes
- **Decision:** Is the feature complete per the spec? Are there regressions?
- **If incomplete:** Feature stays in `features_pending`; Planner will re-queue it

### 6. Journalist (`06-journalist.md`)
- **Reads:** `cycle_plan.md`, evaluation result, test results
- **Writes:** Structured log entry to `cycle_log/cycle_NNN.md`
- **Captures:** What was built, what decisions were made, what passed/failed

### 7. State Writer (`07-state-writer.md`)
- **Reads:** `project_memory.json`, evaluation result
- **Writes:** Updated `project_memory.json`
- **Updates:** Moves completed feature from `features_pending` to `features_complete`, increments cycle counter, records timestamp

## Failure Modes

### Build failure (Validator)
The Validator attempts self-correction up to 3 times. If still failing, it writes to `blockers.json` and exits. The loop stops. Human reviews the blocker, fixes the code or updates the plan, deletes the blocker entry, and restarts.

### QA failure (Evaluator)
If tests fail but the code builds, the Evaluator marks the feature `incomplete` and writes quality notes. The Planner picks it up next cycle with the failure notes in context — the Builder knows what went wrong and tries again.

### Auth / environment failure (pre-flight)
`saas-run.sh` runs pre-flight checks before invoking any agent: Claude auth, writable paths, accessible database. Fails fast with a clear error before spending any API usage.

## Deployment

The Builder deploys after a successful build:

```bash
# After npm run build:
cp -r .next/static .next/standalone/.next/static
cp .env.local .next/standalone/.env.local
sudo -u agent pm2 restart {PM2_NAME}
```

The app runs from `.next/standalone/server.js` via pm2, proxied by Caddy at `truckerflow.vfoster.pro/{BASEPATH}`.

## project_memory.json Schema

```json
{
  "version": "v7",
  "cycle": 344,
  "phase": "production",
  "architecture": {
    "basePath": "/truckerflow-v7",
    "port": 3007,
    "pm2Name": "truckerflow-v7",
    "framework": "nextjs14",
    "auth": "nextauth-v5",
    "db": "postgresql://...",
    "orm": "prisma"
  },
  "features_complete": ["landing_page", "auth_and_db_setup", "..."],
  "features_pending": [],
  "scores_history": [
    { "cycle": 1, "total": 46, "breakdown": {...} },
    { "cycle": 146, "total": 91, "breakdown": {...} }
  ],
  "last_updated": "2026-05-01T16:22:45Z"
}
```

## Scheduling

On the VPS, the loop was triggered by a `systemd` timer (`trucking-agent.timer`) running every 6 hours. The `orchestrator.timer` ran a broader orchestrator that could launch `saas-run.sh` as well.

The pipeline is currently stopped (`paused` file present, timers disabled).
