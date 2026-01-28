#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if ! command -v node >/dev/null 2>&1; then
  echo "Error: Node.js is required to run the dev setup."
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "Error: npm is required to run the dev setup."
  exit 1
fi

if [ -f package-lock.json ]; then
  if [ ! -d node_modules ]; then
    echo "Installing dependencies with npm ci..."
    npm ci
  else
    echo "Dependencies already installed; skipping npm ci."
  fi
else
  echo "Installing dependencies with npm install..."
  npm install
fi

DEV_SCRIPT="$(node -e "const pkg=require('./package.json');process.stdout.write(pkg.scripts && pkg.scripts.dev ? pkg.scripts.dev : '')")"
if [ -n "$DEV_SCRIPT" ]; then
  echo "Starting dev server on http://localhost:3000..."
  if echo "$DEV_SCRIPT" | grep -qi "vite"; then
    PORT=3000 npm run dev -- --port 3000 --host localhost
  else
    PORT=3000 npm run dev
  fi
  exit 0
fi

echo "No npm 'dev' script found. Starting minimal local server on http://localhost:3000..."

node <<'NODE'
const http = require("http");

const port = 3000;
const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Queen's Palace</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.5; color: #111; }
      .card { max-width: 720px; padding: 24px; border: 1px solid #ddd; border-radius: 12px; }
      h1 { margin: 0 0 12px; font-size: 24px; }
      p { margin: 0 0 12px; }
      code { background: #f6f6f6; padding: 2px 6px; border-radius: 4px; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>Queen's Palace local server</h1>
      <p>The dev setup script is running and serving this page at <code>http://localhost:3000</code>.</p>
      <p>If the full app UI is not wired yet, this placeholder confirms the local server is live.</p>
      <p>Press <code>Ctrl+C</code> in the terminal to stop the server.</p>
    </div>
  </body>
</html>`;

const server = http.createServer((req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(html);
});

server.listen(port, "localhost", () => {
  console.log(`Dev server running at http://localhost:${port}`);
  console.log("Press Ctrl+C to stop.");
});
NODE
