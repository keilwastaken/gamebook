#!/bin/bash
set -euo pipefail

echo "=== Lint ==="
pnpm lint

echo ""
echo "=== Typecheck ==="
pnpm typecheck

echo ""
echo "=== Unit & Component Tests ==="
pnpm test

echo ""
echo "=== Doc Link Verification ==="
node scripts/verify-doc-links.js

echo ""
echo "All harness checks passed."
