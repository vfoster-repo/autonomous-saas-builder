#!/bin/bash
# saas-run.sh -- TruckerFlow 7-agent autonomous build loop
# Each cycle: PLANNER -> BUILDER -> VALIDATOR -> QA -> EVALUATOR -> JOURNALIST -> STATE WRITER

set -euo pipefail

# ----------------------------------------------
# ROOT GUARD -- run as agent user, not root
# ----------------------------------------------
if [ "$(id -u)" -eq 0 ]; then
    exec su -s /bin/bash agent -c "bash $0 $*"
fi

# ----------------------------------------------
# PATHS
# ----------------------------------------------
AGENT_DIR="$AGENT_ROOT"
SAAS_DIR="$AGENT_DIR/saas-agent"
TESTS_DIR="$SAAS_DIR/tests"
PROMPTS_DIR="$SAAS_DIR/prompts"
MEMORY_FILE="$SAAS_DIR/project_memory.json"
BLOCKERS_FILE="$SAAS_DIR/blockers.json"
LOGS_DIR="$SAAS_DIR/logs"
STATE_FILE="$AGENT_DIR/current_state.txt"
PAUSED_FILE="$SAAS_DIR/paused"

# ----------------------------------------------
# RESOLVE CYCLE NUMBER
# ----------------------------------------------
CYCLE=$(python3 -c "
import json, sys
try:
    m = json.load(open('$MEMORY_FILE'))
    print(m.get('cycle', 1))
except Exception as e:
    print(1)
" 2>/dev/null || echo "1")

BASEPATH=$(python3 -c "
import json
try:
    m = json.load(open('$MEMORY_FILE'))
    print(m.get('architecture', {}).get('basePath', '/truckerflow-v2'))
except:
    print('/truckerflow-v2')
" 2>/dev/null || echo "/truckerflow-v2")

PORT=$(python3 -c "
import json
try:
    m = json.load(open('$MEMORY_FILE'))
    print(m.get('architecture', {}).get('port', 3002))
except:
    print(3002)
" 2>/dev/null || echo "3002")

# Derive pm2 process name from basePath (strip leading slash)
PM2_NAME="${BASEPATH#/}"

# App directory is versioned -- each build gets its own folder
APP_DIR="$SAAS_DIR/app-${PM2_NAME}"

CYCLE_TAG=$(printf '%03d' "$CYCLE")
CYCLE_LOG_DIR="$LOGS_DIR/cycle_${CYCLE_TAG}"

# ----------------------------------------------
# PAUSE CHECK -- exit immediately if paused
# ----------------------------------------------
if [ -f "$PAUSED_FILE" ]; then
    echo "$(date +'%Y-%m-%d %H:%M:%S') -- Orchestrator is paused. Skipping cycle ${CYCLE}." \
        >> "$LOGS_DIR/latest.log" 2>/dev/null || true
    exit 0
fi

# ----------------------------------------------
# PRE-FLIGHT CHECKS
# ----------------------------------------------
preflight_fail() {
    echo "PRE-FLIGHT FAILED: $1" >&2
    mkdir -p "$LOGS_DIR"
    echo "$(date +'%Y-%m-%d %H:%M:%S') PRE-FLIGHT FAILED: $1" >> "$LOGS_DIR/latest.log" 2>/dev/null || true
    exit 1
}

# Check state.json is writable
python3 -c "open('$WEB_DIR/orchestrator/state.json', 'a').close()" 2>/dev/null \
    || preflight_fail "state.json not writable -- run: chown agent:agent $WEB_DIR/orchestrator/state.json"

# Check logs dir is writable
mkdir -p "$LOGS_DIR"
touch "$LOGS_DIR/.write_test" 2>/dev/null \
    || preflight_fail "logs dir not writable -- run: chown agent:agent $LOGS_DIR"
rm -f "$LOGS_DIR/.write_test"

# Check Claude is authenticated
claude -p "ping" --dangerously-skip-permissions < /dev/null > /dev/null 2>&1 \
    || preflight_fail "Claude auth failed -- run: cp /root/.claude/.credentials.json /home/agent/.claude/.credentials.json && chown agent:agent /home/agent/.claude/.credentials.json"

echo "PRE-FLIGHT: all checks passed"

# ----------------------------------------------
# DIRECTORY & LOG SETUP
# ----------------------------------------------
mkdir -p "$CYCLE_LOG_DIR/screenshots" "$APP_DIR" "$TESTS_DIR" "$LOGS_DIR"

# Symlink app/ -> versioned dir so builder writes always land in the right place
rm -f "$SAAS_DIR/app"
ln -sfn "$APP_DIR" "$SAAS_DIR/app"

LOG_FILE="$CYCLE_LOG_DIR/run.log"
LATEST_LOG="$LOGS_DIR/latest.log"

# Rotate latest.log and tee all output
: > "$LATEST_LOG"
exec > >(tee -a "$LOG_FILE" "$LATEST_LOG") 2>&1

echo "================================================================"
echo "  TRUCKERFLOW AGENT -- CYCLE ${CYCLE}"
echo "  $(date +'%Y-%m-%d %H:%M:%S')"
echo "================================================================"

# ----------------------------------------------
# MARK STATE: running
# ----------------------------------------------
cat > "$STATE_FILE" <<STATE
PHASE: running
AGENT: truckerflow
CYCLE: ${CYCLE}
STARTED: $(date +'%Y-%m-%d %H:%M:%S')
STATE

# ----------------------------------------------
# DASHBOARD STATE WRITER
# ----------------------------------------------
DASHBOARD_STATE="$WEB_DIR/orchestrator/state.json"

update_dash_state() {
    local status="$1"   # "running" or "complete" or "error"
    local agent="${2:-}"
    python3 - <<PYEOF
import json, datetime
from pathlib import Path

p = Path("$DASHBOARD_STATE")
try:
    d = json.loads(p.read_text())
except Exception:
    d = {}

DALLAS_TZ = datetime.timezone(datetime.timedelta(hours=-5))  # CDT = UTC-5
now_utc = datetime.datetime.now(datetime.timezone.utc)
now = now_utc.isoformat()
ts = now_utc.astimezone(DALLAS_TZ).strftime("%Y-%m-%d %H:%M:%S CDT")
status = "$status"
agent  = "$agent"
cycle  = $CYCLE

if status == "running":
    d["active_task_id"]   = "truckerflow-agent"
    d["active_task_name"] = "TruckerFlow SaaS Builder"
    d["active_since"]     = now
    label = f"Cycle {cycle}" + (f" -- {agent}" if agent else "")
    # Also update the task entry's last_status so the table shows "running" not "idle"
    for t in d.get("tasks", []):
        if t.get("id") == "truckerflow-agent":
            t["last_status"] = "running"
            t["last_run"] = now
    d.setdefault("recent_log", []).append(
        f"[{ts}] [INFO] Started {label}"
    )
else:
    d["active_task_id"]   = None
    d["active_task_name"] = None
    d["active_since"]     = None
    # Update last_run on the task entry
    for t in d.get("tasks", []):
        if t.get("id") == "truckerflow-agent":
            t["last_run"]    = now
            t["last_status"] = status
    d.setdefault("recent_log", []).append(
        f"[{ts}] [INFO] Cycle {cycle} {status}"
    )

# Cap recent_log at 50 lines
d["recent_log"] = d.get("recent_log", [])[-50:]
d["last_updated"] = now
p.write_text(json.dumps(d, indent=2))
PYEOF
}

# Mark cycle as running in dashboard
update_dash_state "running"

# ----------------------------------------------
# LIVE STATUS -- writes $WEB_DIR/builder-live.json
# ----------------------------------------------
LIVE_STATUS_FILE="$WEB_DIR/builder-live.json"
LIVE_COMPLETED_FILE="/tmp/saas_completed_agents_${CYCLE}.json"

# Initialize completed agents list for this cycle
[ -f "$LIVE_COMPLETED_FILE" ] || echo "[]" > "$LIVE_COMPLETED_FILE"

update_live_status() {
    local agent="$1"      # e.g. "02-builder"
    local event="$2"      # "start" | "done"
    local feature=""
    feature=$(python3 -c "
import json
try:
    p = json.load(open('$SAAS_DIR/plan.json'))
    print(p.get('feature_id', ''))
except:
    try:
        m = json.load(open('$MEMORY_FILE'))
        pend = m.get('features_pending', [])
        print(pend[0] if pend else '')
    except:
        print('')
" 2>/dev/null || echo "")

    local agent_label
    case "$agent" in
        01-planner)   agent_label="Planner — picking next feature & writing plan" ;;
        02-builder)   agent_label="Builder — writing code" ;;
        03-validator) agent_label="Validator — checking TypeScript, ESLint, auth, basePath" ;;
        04-qa)        agent_label="QA — running Playwright browser tests" ;;
        05-evaluator) agent_label="Evaluator — scoring the app 0–100" ;;
        06-journalist) agent_label="Journalist — writing cycle summary" ;;
        07-state-writer) agent_label="State Writer — updating project memory" ;;
        *)            agent_label="$agent" ;;
    esac

    if [ "$event" = "done" ]; then
        # Append to completed list
        python3 -c "
import json, datetime
try:
    completed = json.load(open('$LIVE_COMPLETED_FILE'))
except:
    completed = []
completed.append({
    'agent': '$agent',
    'label': '$agent_label',
    'finished_at': datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')
})
json.dump(completed, open('$LIVE_COMPLETED_FILE', 'w'))
" 2>/dev/null || true
    fi

    python3 -c "
import json, datetime, os
try:
    completed = json.load(open('$LIVE_COMPLETED_FILE'))
except:
    completed = []
try:
    m = json.load(open('$MEMORY_FILE'))
    features_done = len(m.get('features_complete', []))
    features_total = len(m.get('features_complete', [])) + len(m.get('features_pending', []))
    features_complete = m.get('features_complete', [])
    sh = m.get('scores_history', [])
    latest_score = sh[-1]['total'] if sh else None
except:
    features_done, features_total, features_complete, latest_score = 0, 27, [], None
status = {
    'cycle': $CYCLE,
    'feature': '$feature',
    'current_agent': '$agent' if '$event' == 'start' else None,
    'current_agent_label': '$agent_label' if '$event' == 'start' else None,
    'current_agent_started': datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ') if '$event' == 'start' else None,
    'completed_this_cycle': completed,
    'features_done': features_done,
    'features_total': features_total,
    'features_complete': features_complete,
    'latest_score': latest_score,
    'updated_at': datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')
}
json.dump(status, open('$LIVE_STATUS_FILE', 'w'), indent=2)
# Append cycle record to history when state-writer finishes
if '$agent' == '07-state-writer' and '$event' == 'done':
    hist_file = os.path.join(os.path.dirname('$LIVE_STATUS_FILE'), 'builder-live-history.json')
    try:
        history = json.load(open(hist_file))
    except:
        history = []
    if not any(h.get('cycle') == $CYCLE for h in history):
        history.append({
            'cycle': $CYCLE,
            'feature': '$feature',
            'score': latest_score,
            'features_done': features_done,
            'timestamp': datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')
        })
    json.dump(history, open(hist_file, 'w'), indent=2)
" 2>/dev/null || true
}

# ----------------------------------------------
# BLOCKER CHECK
# ----------------------------------------------
check_blockers() {
    local active
    active=$(python3 -c "
import json, sys
try:
    b = json.load(open('$BLOCKERS_FILE'))
    print('true' if b.get('active') else 'false')
except:
    print('false')
" 2>/dev/null || echo "false")

    if [ "$active" = "true" ]; then
        local msg
        msg=$(python3 -c "
import json
try:
    b = json.load(open('$BLOCKERS_FILE'))
    print(b.get('message', 'Action required'))
except:
    print('Blocker active')
" 2>/dev/null || echo "Blocker active")

        echo ""
        echo "!!!! BLOCKER ACTIVE -- PAUSING ORCHESTRATOR !!!!"
        echo "Message: $msg"
        echo ""
        touch "$PAUSED_FILE"
        cat > "$STATE_FILE" <<STATE
PHASE: blocked
AGENT: truckerflow
CYCLE: ${CYCLE}
BLOCKED_AT: $(date +'%Y-%m-%d %H:%M:%S')
STATE
        exit 0
    fi
}

# ----------------------------------------------
# RUN AGENT -- wraps a single Claude Code invocation
# ----------------------------------------------
run_agent() {
    local role="$1"         # e.g. "01-planner"
    local prompt_file="$2"  # e.g. $WORK_DIR/prompts/01-planner.md
    local work_dir="${3:-$SAAS_DIR}"
    local report_file="$CYCLE_LOG_DIR/${role}.log"

    echo ""
    echo "----------------------------------------------------------------"
    echo "  AGENT: $role  |  $(date +'%H:%M:%S')"
    echo "----------------------------------------------------------------"

    update_dash_state "running" "$role"
    update_live_status "$role" "start"
    check_blockers

    if [ ! -f "$prompt_file" ]; then
        echo "ERROR: Prompt file not found: $prompt_file"
        exit 1
    fi

    # Build context suffix injected at end of every prompt
    local memory_json blockers_json
    memory_json=$(python3 -m json.tool "$MEMORY_FILE" 2>/dev/null || cat "$MEMORY_FILE" 2>/dev/null || echo "{}")
    blockers_json=$(python3 -m json.tool "$BLOCKERS_FILE" 2>/dev/null || cat "$BLOCKERS_FILE" 2>/dev/null || echo '{"active":false}')

    local context_suffix
    context_suffix=$(cat <<CONTEXT

---
## SESSION CONTEXT (injected by saas-run.sh)

- Date: $(date +'%Y-%m-%d')
- Time: $(date +'%H:%M:%S')
- Cycle: ${CYCLE}
- Your role this turn: ${role}
- Cycle log directory: ${CYCLE_LOG_DIR}
- App base path (BASEPATH): ${BASEPATH}
- App port (PORT): ${PORT}
- pm2 process name (PM2_NAME): ${PM2_NAME}

**IMPORTANT**: Wherever you see \`{BASEPATH}\` or \`{PORT}\` in these instructions, substitute the values above.
All fetch() calls, curl URLs, API paths, navigation hrefs, and pm2 names must use these values -- never hardcode a path or port number.

### Key Paths
- App directory: ${APP_DIR}
- Tests directory: ${TESTS_DIR}
- Memory file: ${MEMORY_FILE}
- Blockers file: ${BLOCKERS_FILE}
- Plan file: ${SAAS_DIR}/plan.json
- Dev journal: ${SAAS_DIR}/dev_journal.md
- Codebase index: ${SAAS_DIR}/codebase_index.json

### project_memory.json (current state)
\`\`\`json
${memory_json}
\`\`\`

### blockers.json
\`\`\`json
${blockers_json}
\`\`\`
CONTEXT
)

    # For validator and builder-retry: inject build health output if available
    if [[ "$role" == "03-validator" || "$role" == "02-builder-retry" ]] && [ -f "$CYCLE_LOG_DIR/build_output.txt" ]; then
        local build_out
        build_out=$(tail -80 "$CYCLE_LOG_DIR/build_output.txt")
        context_suffix="${context_suffix}

### Post-Builder Health Check Output
\`\`\`
${build_out}
\`\`\`
"
    fi

    context_suffix="${context_suffix}
Begin immediately. Do not pause or ask clarifying questions. Complete your full role before stopping.
"

    local full_prompt
    full_prompt="$(cat "$prompt_file")${context_suffix}"

    mkdir -p "$work_dir"
    cd "$work_dir"

    # Invoke Claude Code (claude CLI)
    claude --dangerously-skip-permissions \
        --model claude-opus-4-5 \
        -p "$full_prompt" 2>&1 | tee "$report_file" || {
        echo "WARNING: agent $role returned non-zero exit (may be normal)"
    }

    check_blockers
    update_live_status "$role" "done"
    echo "  -> $role finished at $(date +'%H:%M:%S')"
}

# ----------------------------------------------
# AGENT 1 -- PLANNER
# ----------------------------------------------
run_agent "01-planner" "$PROMPTS_DIR/01-planner.md" "$SAAS_DIR"

# ----------------------------------------------
# AGENT 2 -- BUILDER
# ----------------------------------------------
run_agent "02-builder" "$PROMPTS_DIR/02-builder.md" "$APP_DIR"

# ----------------------------------------------
# POST-BUILDER HEALTH CHECK
# ----------------------------------------------
echo ""
echo "POST-BUILDER: Checking app health on port ${PORT}..."
BUILD_HEALTH="unknown"
for i in 1 2 3 4 5; do
    if curl -sf --max-time 10 "http://localhost:${PORT}${BASEPATH}" > /dev/null 2>&1; then
        BUILD_HEALTH="ok"
        echo "POST-BUILDER: App responding on port ${PORT} ✓"
        break
    fi
    echo "POST-BUILDER: Attempt $i/5 -- not yet responding, waiting 10s..."
    sleep 10
done

# Capture last 100 lines of npm build / pm2 logs for validator context
BUILD_LOG_FILE="$CYCLE_LOG_DIR/build_output.txt"
{
    echo "=== pm2 logs (last 50 lines) ==="
    pm2 logs "${PM2_NAME}" --lines 50 --nostream 2>/dev/null || echo "(no pm2 logs)"
    echo ""
    echo "=== npm run build output (last 50 lines) ==="
    tail -50 "$APP_DIR/.next/trace" 2>/dev/null || echo "(no build trace)"
} > "$BUILD_LOG_FILE" 2>&1

if [ "$BUILD_HEALTH" != "ok" ]; then
    echo "POST-BUILDER: WARNING -- app not responding after 5 attempts. Validator will get error context."
    echo "BUILD_STATUS: UNHEALTHY" >> "$BUILD_LOG_FILE"
else
    echo "BUILD_STATUS: HEALTHY -- HTTP 200 on port ${PORT}" >> "$BUILD_LOG_FILE"
fi

# ----------------------------------------------
# AGENT 3 -- VALIDATOR
# ----------------------------------------------
run_agent "03-validator" "$PROMPTS_DIR/03-validator.md" "$APP_DIR"

# Builder retry if validator wrote an error report
if [ -f "$CYCLE_LOG_DIR/error_report.md" ]; then
    echo ""
    echo "Validator flagged errors -- running Builder retry pass..."
    run_agent "02-builder-retry" "$PROMPTS_DIR/02-builder.md" "$APP_DIR"
    rm -f "$CYCLE_LOG_DIR/error_report.md"
fi

# ----------------------------------------------
# AGENT 4 -- QA (Playwright browser tests)
# ----------------------------------------------
run_agent "04-qa" "$PROMPTS_DIR/04-qa.md" "$SAAS_DIR"

# ----------------------------------------------
# AGENT 5 -- EVALUATOR
# ----------------------------------------------
run_agent "05-evaluator" "$PROMPTS_DIR/05-evaluator.md" "$SAAS_DIR"

# ----------------------------------------------
# AGENT 6 -- JOURNALIST
# ----------------------------------------------
run_agent "06-journalist" "$PROMPTS_DIR/06-journalist.md" "$SAAS_DIR"

# ----------------------------------------------
# AGENT 7 -- STATE WRITER
# ----------------------------------------------
run_agent "07-state-writer" "$PROMPTS_DIR/07-state-writer.md" "$SAAS_DIR"

# ----------------------------------------------
# CYCLE COMPLETE
# ----------------------------------------------
echo ""
echo "================================================================"
echo "  CYCLE ${CYCLE} COMPLETE -- $(date +'%Y-%m-%d %H:%M:%S')"
echo "================================================================"

cat > "$STATE_FILE" <<STATE
PHASE: complete
AGENT: truckerflow
CYCLE: ${CYCLE}
COMPLETED: $(date +'%Y-%m-%d %H:%M:%S')
STATE

update_dash_state "complete"
