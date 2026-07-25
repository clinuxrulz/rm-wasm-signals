#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

case "${1:-all}" in
  core)
    echo "=== Building core ==="
    pnpm build:core
    ;;
  node)
    echo "=== Building node ==="
    pnpm build:node
    ;;
  all)
    echo "=== Building core ==="
    pnpm build:core
    echo "=== Building node ==="
    pnpm build:node
    ;;
  rm)
    echo "=== Building core ==="
    pnpm build:core
    echo "=== Building node (rm-wasm-signals only) ==="
    pnpm build:node:rm
    echo "=== Running (rm-wasm-signals only) ==="
    pnpm run:node:rm
    exit 0
    ;;
  run)
    echo "=== Running ==="
    node --expose-gc packages/node/dist/index.js
    exit 0
    ;;
  run-rm)
    echo "=== Running (rm-wasm-signals only) ==="
    node --expose-gc packages/node/dist/run-rm.rm.js
    exit 0
    ;;
  help|--help|-h)
    echo "Usage: $0 [core|node|all|rm|run|run-rm|help]"
    echo ""
    echo "  core     Build core package only"
    echo "  node     Build node package only"
    echo "  all      Build core + node (default)"
    echo "  rm       Build + run rm-wasm-signals benchmark"
    echo "  run      Run the node benchmark"
    echo "  run-rm   Run rm-wasm-signals-only benchmark"
    echo "  help     Show this help"
    exit 0
    ;;
  *)
    echo "Unknown arg: $1"
    echo "Usage: $0 [core|node|all|rm|run|run-rm|help]"
    exit 1
    ;;
esac

echo "=== Done ==="
