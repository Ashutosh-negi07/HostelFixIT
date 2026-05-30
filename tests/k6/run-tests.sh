#!/usr/bin/env bash
# =============================================================================
#  HostelFixIT — k6 Full Test Runner (Local PostgreSQL, no Docker)
#
#  Usage:
#    bash tests/k6/run-tests.sh              # full run (~20 min)
#    SOAK_DURATION=2m bash tests/k6/run-tests.sh   # shorter soak
# =============================================================================

set -uo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
BACKEND_DIR="$ROOT/backend"
K6_DIR="$ROOT/tests/k6"
RESULTS="$K6_DIR/results"
PG_BIN="/opt/homebrew/opt/postgresql@16/bin"
SOAK_DURATION="${SOAK_DURATION:-5m}"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'
step() { echo -e "\n${CYAN}${BOLD}━━━ $* ${NC}"; }
ok()   { echo -e "${GREEN}  ✅  $*${NC}"; }
warn() { echo -e "${YELLOW}  ⚠️   $*${NC}"; }
fail() { echo -e "${RED}  ❌  $*${NC}"; exit 1; }

mkdir -p "$RESULTS"

# ── CLEANUP: always restore Supabase .env on exit ─────────────────────────────
cleanup() {
  echo ""
  step "Cleanup: Restoring original Supabase .env..."
  [[ -f "$BACKEND_DIR/.env.backup" ]] && cp "$BACKEND_DIR/.env.backup" "$BACKEND_DIR/.env" && ok "Supabase .env restored"
  step "Cleanup: Stopping test backend..."
  pkill -f "spring-boot:run" 2>/dev/null && ok "Backend stopped" || ok "Backend already stopped"
  # Ensure ddl-auto is back to validate
  sed -i '' 's/ddl-auto=update/ddl-auto=validate/' "$BACKEND_DIR/src/main/resources/application.properties" 2>/dev/null || true
}
trap cleanup EXIT

# ─────────────────────────────────────────────────────────────────────────────
step "1/7  Prerequisites"
command -v k6   >/dev/null || fail "k6 not installed  →  brew install k6"
command -v node >/dev/null || fail "node not installed"
"$PG_BIN/pg_isready" -q   || fail "PostgreSQL not running  →  brew services start postgresql@16"
ok "k6, node, PostgreSQL all ready"

# ─────────────────────────────────────────────────────────────────────────────
step "2/7  Backup Supabase .env"
cp "$BACKEND_DIR/.env" "$BACKEND_DIR/.env.backup"
ok "Backed up to backend/.env.backup"

# ─────────────────────────────────────────────────────────────────────────────
step "3/7  Fresh local database"
"$PG_BIN/psql" postgres -c "DROP DATABASE IF EXISTS hostelfixit_test;" 2>&1
"$PG_BIN/psql" postgres -c "DROP USER     IF EXISTS hf_test;"          2>&1
"$PG_BIN/psql" postgres -c "CREATE USER hf_test WITH PASSWORD 'hf_test_pass';" 2>&1
"$PG_BIN/psql" postgres -c "CREATE DATABASE hostelfixit_test OWNER hf_test;"   2>&1
"$PG_BIN/psql" hostelfixit_test -c "GRANT ALL ON SCHEMA public TO hf_test; ALTER SCHEMA public OWNER TO hf_test;" 2>&1
ok "hostelfixit_test created"

# ─────────────────────────────────────────────────────────────────────────────
step "4/7  Switch backend → local DB"
cp "$BACKEND_DIR/.env.test" "$BACKEND_DIR/.env"
# Allow Hibernate to create schema on empty DB
sed -i '' 's/ddl-auto=validate/ddl-auto=update/' "$BACKEND_DIR/src/main/resources/application.properties"
ok "Backend configured for local PostgreSQL"

# ─────────────────────────────────────────────────────────────────────────────
step "5/7  Start backend (waits up to 90s)"
cd "$BACKEND_DIR"
./mvnw spring-boot:run -q > "$RESULTS/backend.log" 2>&1 &
BACKEND_PID=$!

READY=false
for i in $(seq 1 45); do
  sleep 2
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/actuator/health 2>/dev/null || echo "000")
  if [[ "$STATUS" == "200" ]]; then READY=true; break; fi
  if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo ""
    fail "Backend crashed! Check: $RESULTS/backend.log"
  fi
  printf "."
done
echo ""
$READY || fail "Backend did not start within 90s. Check: $RESULTS/backend.log"
ok "Backend up on port 8080 (PID $BACKEND_PID)"

# Revert ddl-auto — schema now exists, future restarts only validate
sed -i '' 's/ddl-auto=update/ddl-auto=validate/' "$BACKEND_DIR/src/main/resources/application.properties"
ok "ddl-auto restored to validate"
cd "$ROOT"

# ─────────────────────────────────────────────────────────────────────────────
step "6/7  Seed test data"
node "$ROOT/seed.js" > "$RESULTS/seed.log" 2>&1 \
  && ok "Seed complete — see results/seed.log" \
  || warn "Seed had errors — check results/seed.log (tests may still pass if admin user was auto-created)"

# ─────────────────────────────────────────────────────────────────────────────
step "7/7  k6 Tests"

run_test() {
  local NAME="$1" FILE="$2" LABEL="$3" EXTRA="${4:-}"
  echo ""
  echo -e "${CYAN}${BOLD}"
  echo "  ╔══════════════════════════════════════════════════╗"
  printf "  ║  %-48s  ║\n" "$NAME"
  printf "  ║  %-48s  ║\n" "$LABEL"
  echo "  ╚══════════════════════════════════════════════════╝"
  echo -e "${NC}"
  k6 run --no-color $EXTRA "$K6_DIR/$FILE" 2>&1 | tee "$RESULTS/${FILE%.js}.log"
  echo ""
}

run_test "SMOKE TEST"  "smoke.js"  "1 VU · 1 pass · ~30 seconds"
run_test "LOAD TEST"   "load.js"   "26 VUs · 5 min · realistic traffic"
run_test "STRESS TEST" "stress.js" "90 VUs · 9 min · breaking point"
run_test "SOAK TEST"   "soak.js"   "16 VUs · ${SOAK_DURATION} · endurance" "-e SOAK_DURATION=${SOAK_DURATION}"

# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}"
echo "  ╔══════════════════════════════════════════════════╗"
echo "  ║         ALL TESTS COMPLETE  ✅                   ║"
echo "  ╚══════════════════════════════════════════════════╝"
echo -e "${NC}"
echo "  Results saved to: tests/k6/results/"
echo "    smoke.log   load.log   stress.log   soak.log   backend.log"
echo ""
echo -e "${CYAN}Quick summary (smoke test):${NC}"
grep -E "✓|✗|http_req_duration|http_req_failed|checks_" "$RESULTS/smoke.log" | head -15 || true
