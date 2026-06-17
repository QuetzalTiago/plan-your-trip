#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Voyager — WSL local environment initializer
#
# !! This is a bash script — run it from a WSL terminal or via the
#    PowerShell launcher, NOT directly from Windows PowerShell. !!
#
# From Windows PowerShell:
#   .\scripts\init-local.ps1
#
# From a WSL terminal (bash):
#   bash scripts/init-wsl.sh
#
# What it does:
#   1. Verifies Docker (Docker Desktop with WSL2 integration) is running
#   2. Creates .env.local from the example template if it doesn't exist
#   3. Warns if GEMINI_API_KEY is not set
#   4. Runs docker compose up --build
#   5. Tails logs until Ctrl-C
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$ROOT_DIR/.env.local"
ENV_EXAMPLE="$ROOT_DIR/.env.local.example"

# ─── Colors ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'; YELLOW='\033[1;33m'; GREEN='\033[0;32m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

info()  { echo -e "${CYAN}[voyager]${RESET} $*"; }
ok()    { echo -e "${GREEN}[voyager]${RESET} $*"; }
warn()  { echo -e "${YELLOW}[voyager]${RESET} $*"; }
error() { echo -e "${RED}[voyager] ERROR:${RESET} $*" >&2; }

# ─── Banner ───────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}Voyager — Local Dev Init (WSL + Docker)${RESET}"
echo "────────────────────────────────────────────────"
echo ""

# ─── 1. Check Docker ──────────────────────────────────────────────────────────
info "Checking Docker..."

if ! command -v docker &>/dev/null; then
  error "Docker is not installed or not in PATH."
  echo ""
  echo "  Install Docker Desktop for Windows and enable WSL2 integration:"
  echo "  https://docs.docker.com/desktop/wsl/"
  echo ""
  exit 1
fi

if ! docker info &>/dev/null; then
  error "Docker daemon is not running."
  echo ""
  echo "  Start Docker Desktop on Windows, then retry."
  echo "  Make sure WSL2 integration is enabled in Docker Desktop → Settings → Resources → WSL Integration."
  echo ""
  exit 1
fi

ok "Docker is running. $(docker version --format 'Engine {{.Server.Version}}')"

# ─── 2. Verify Docker Compose ─────────────────────────────────────────────────
if ! docker compose version &>/dev/null; then
  error "Docker Compose V2 not found. Update Docker Desktop to 4.x or later."
  exit 1
fi

ok "Docker Compose $(docker compose version --short) found."

# ─── 3. Create .env.local if missing ─────────────────────────────────────────
if [ ! -f "$ENV_FILE" ]; then
  if [ -f "$ENV_EXAMPLE" ]; then
    cp "$ENV_EXAMPLE" "$ENV_FILE"
    warn ".env.local created from template."
    echo ""
    echo -e "  ${BOLD}Action required:${RESET} open ${CYAN}.env.local${RESET} and add your Anthropic API key:"
    echo -e "  ${CYAN}ANTHROPIC_API_KEY=sk-ant-...${RESET}"
    echo ""
  else
    # Create minimal .env.local
    cat > "$ENV_FILE" <<'EOF'
# Gemini API key — required for AI agent features
# Get yours at https://aistudio.google.com/apikey
GEMINI_API_KEY=

# SerpAPI key for flights, hotels, events
# Get yours at https://serpapi.com/
SERPAPI_API_KEY=

# Local user ID injected into every request (no real auth locally)
LOCAL_USER_ID=00000000-0000-0000-0000-000000000001
EOF
    warn ".env.local created. Add your GEMINI_API_KEY and SERPAPI_API_KEY before using AI features."
    echo ""
  fi
else
  ok ".env.local found."
fi

# ─── 4. Check API keys ────────────────────────────────────────────────────────
GEMINI_KEY=$(grep -E '^GEMINI_API_KEY=' "$ENV_FILE" | cut -d= -f2- | tr -d '[:space:]' || true)
SERPAPI_KEY=$(grep -E '^SERPAPI_API_KEY=' "$ENV_FILE" | cut -d= -f2- | tr -d '[:space:]' || true)

if [ -z "$GEMINI_KEY" ]; then
  warn "GEMINI_API_KEY is not set in .env.local"
  echo "  The app will start, but AI agent features will fail until you add it."
  echo ""
fi

if [ -z "$SERPAPI_KEY" ]; then
  warn "SERPAPI_API_KEY is not set in .env.local"
  echo "  Flight, hotel, and event search will not work until you add your SerpAPI key."
  echo ""
fi

# ─── 5. Check WSL version (informational) ────────────────────────────────────
if command -v wsl.exe &>/dev/null; then
  WSL_VERSION=$(wsl.exe --status 2>/dev/null | grep -i "Default Version" | tr -d '\r' || echo "unknown")
  info "WSL status: $WSL_VERSION"
fi

# ─── 6. Build and start services ─────────────────────────────────────────────
cd "$ROOT_DIR"

echo ""
info "Building Docker images..."
docker compose build

echo ""
info "Starting services (detached)..."
docker compose up -d

# ─── 7. Wait for services to be healthy ──────────────────────────────────────
echo ""
info "Waiting for services to be ready..."

wait_for_port() {
  local host=$1 port=$2 name=$3 retries=0
  until nc -z "$host" "$port" 2>/dev/null; do
    retries=$((retries + 1))
    if [ "$retries" -ge 30 ]; then
      warn "$name did not become ready in time — check logs: docker compose logs $name"
      return
    fi
    sleep 2
  done
  ok "$name is ready on port $port"
}

wait_for_port localhost 5432 "PostgreSQL"
wait_for_port localhost 4000 "API server"
wait_for_port localhost 5173 "Frontend (Vite)"

# ─── 8. Summary ──────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}────────────────────────────────────────────────${RESET}"
echo -e "${BOLD}  Voyager is running locally${RESET}"
echo -e "${GREEN}────────────────────────────────────────────────${RESET}"
echo ""
echo -e "  ${BOLD}Frontend${RESET}    http://localhost:5173"
echo -e "  ${BOLD}API${RESET}         http://localhost:4000"
echo -e "  ${BOLD}PostgreSQL${RESET}  localhost:5432"
echo ""
echo -e "  ${CYAN}Local user:${RESET}  ${LOCAL_USER_ID:-00000000-0000-0000-0000-000000000001}"
echo -e "  ${CYAN}Gemini key:${RESET}  ${GEMINI_KEY:+set ✓}${GEMINI_KEY:-NOT SET ✗}"
echo -e "  ${CYAN}SerpAPI:${RESET}     ${SERPAPI_KEY:+set ✓}${SERPAPI_KEY:-NOT SET ✗}"
echo ""
echo -e "  ${BOLD}Commands:${RESET}"
echo -e "    docker compose logs -f            # tail all logs"
echo -e "    docker compose logs -f api         # API logs only"
echo -e "    docker compose down                # stop everything"
echo -e "    docker compose down -v             # stop + delete PostgreSQL data"
echo ""
info "Tailing logs (Ctrl-C to stop watching — services keep running)..."
echo ""
docker compose logs -f
