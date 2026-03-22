#!/usr/bin/env bash
#
# Local dev: Meilisearch + Chrome (optional) + web + workers.
# Loads repo-root .env into the environment so Next.js (apps/web) and workers
# share the same DATA_DIR, db.db and queue.db — without symlinking .env per package.

set -euo pipefail

# Always run from repository root (works when invoked from any cwd)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if a port is in use
port_in_use() {
    lsof -i :"$1" >/dev/null 2>&1
}

load_root_env() {
    if [[ ! -f ".env" ]]; then
        echo "Error: No .env file in $SCRIPT_DIR"
        echo "  cp .env.sample .env"
        echo "  Then set DATA_DIR (absolute path) and NEXTAUTH_SECRET."
        exit 1
    fi
    # Export all variables assigned in .env so child processes (pnpm web / workers) inherit them
    set -a
    # shellcheck disable=SC1091
    source ".env"
    set +a
}

# Check if Docker is installed
if ! command_exists docker; then
    echo "Error: Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if pnpm is installed
if ! command_exists pnpm; then
    echo "Error: pnpm is not installed. Please install pnpm first."
    exit 1
fi

load_root_env

if [[ -z "$DATA_DIR" || "$DATA_DIR" =~ ^[[:space:]]*$ ]]; then
    echo "Error: DATA_DIR is missing or empty in .env."
    echo "  Set DATA_DIR to an absolute path (e.g. $HOME/karakeep-data)."
    exit 1
fi

if [[ -z "${NEXTAUTH_SECRET:-}" ]]; then
    echo "Error: NEXTAUTH_SECRET is missing in .env."
    echo "  Generate one with: openssl rand -base64 36"
    exit 1
fi

# Start Meilisearch if not already running
if ! port_in_use 7700; then
    echo "Starting Meilisearch..."
    docker run -d -p 7700:7700 --name karakeep-meilisearch getmeili/meilisearch:v1.37.0
else
    echo "Meilisearch is already running on port 7700"
fi

# Point the app at local Meilisearch unless the user already configured search
if [[ -z "${MEILI_ADDR:-}" ]]; then
    export MEILI_ADDR="http://127.0.0.1:7700"
    echo "MEILI_ADDR not set; using $MEILI_ADDR (Docker Meilisearch on 7700)."
fi

# Start Chrome if not already running (optional; Playwright can also use its bundled browser)
if ! port_in_use 9222; then
    echo "Starting headless Chrome..."
    docker run -d -p 9222:9222 --name karakeep-chrome gcr.io/zenika-hub/alpine-chrome:124 \
        --no-sandbox \
        --disable-gpu \
        --disable-dev-shm-usage \
        --remote-debugging-address=0.0.0.0 \
        --remote-debugging-port=9222 \
        --hide-scrollbars
else
    echo "Chrome is already running on port 9222"
fi

# If Docker Chrome is up and the user did not set a debugger URL, connect workers to it
if [[ -z "${BROWSER_WEBSOCKET_URL:-}" ]] && port_in_use 9222 && command_exists curl && command_exists node; then
    sleep 1
    if CHROME_JSON="$(curl -fsS --max-time 5 http://127.0.0.1:9222/json/version 2>/dev/null)"; then
        WS_URL="$(printf '%s' "$CHROME_JSON" | node -e "
          let s = '';
          process.stdin.on('data', (c) => { s += c; });
          process.stdin.on('end', () => {
            try {
              const u = JSON.parse(s).webSocketDebuggerUrl;
              if (u) process.stdout.write(u);
            } catch { /* ignore */ }
          });
        ")"
        if [[ -n "$WS_URL" ]]; then
            export BROWSER_WEBSOCKET_URL="$WS_URL"
            echo "Using Docker Chrome for crawling: BROWSER_WEBSOCKET_URL is set."
        fi
    fi
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    pnpm install
fi

# Create DATA_DIR if it doesn't exist
if [ ! -d "$DATA_DIR" ]; then
    echo "Creating DATA_DIR at $DATA_DIR..."
    mkdir -p "$DATA_DIR"
fi

echo "Running database migrations..."
pnpm run db:migrate

echo "Starting web app and workers (same env: DATA_DIR=$DATA_DIR)..."
pnpm web & WEB_PID=$!
pnpm workers & WORKERS_PID=$!

# Function to handle script termination
cleanup() {
    echo "Shutting down services..."
    kill $WEB_PID $WORKERS_PID 2>/dev/null
    docker stop karakeep-meilisearch karakeep-chrome 2>/dev/null
    docker rm karakeep-meilisearch karakeep-chrome 2>/dev/null
    exit 0
}

# Wait for web app to be ready (max 30 seconds)
echo "Waiting for web app to start..."
ATTEMPT=0
while [ $ATTEMPT -lt 30 ]; do
    if nc -z localhost 3000 2>/dev/null; then
        break
    fi
    sleep 1
    ATTEMPT=$((ATTEMPT + 1))
    if [ $ATTEMPT -eq 30 ]; then
        echo "Warning: Web app may not have started properly after 30 seconds"
    fi
done

# Set up trap to catch termination signals
trap cleanup SIGINT SIGTERM

echo "Development environment is running!"
echo "Web app: http://localhost:3000"
echo "Meilisearch: http://localhost:7700"
echo "Chrome debugger: http://localhost:9222"
echo "Press Ctrl+C to stop all services"

# Wait for user interrupt
wait
