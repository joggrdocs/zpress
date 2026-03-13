#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$EXT_DIR"

# ── Pre-flight checks ──────────────────────────────────────────────

if ! command -v pnpm &>/dev/null; then
  echo "error: pnpm is not installed" >&2
  exit 1
fi

if [ -z "${VSCE_PAT:-}" ]; then
  echo "error: VSCE_PAT environment variable is not set" >&2
  echo "" >&2
  echo "Create a Personal Access Token at:" >&2
  echo "  https://dev.azure.com/joggr/_usersSettings/tokens" >&2
  echo "" >&2
  echo "Scope: Marketplace > Manage" >&2
  echo "" >&2
  echo "Then run:" >&2
  echo "  VSCE_PAT=<token> ./scripts/publish.sh" >&2
  exit 1
fi

# ── Typecheck & build ──────────────────────────────────────────────

echo "==> Typechecking..."
pnpm typecheck

echo "==> Building..."
pnpm build

# ── Package (dry-run to verify) ────────────────────────────────────

echo "==> Packaging..."
pnpm package

VSIX_FILE=$(ls -1 *.vsix 2>/dev/null | head -1)

if [ -z "$VSIX_FILE" ]; then
  echo "error: no .vsix file found after packaging" >&2
  exit 1
fi

echo "==> Packaged: $VSIX_FILE"

# ── Publish ────────────────────────────────────────────────────────

echo "==> Publishing to VS Code Marketplace..."
npx @vscode/vsce publish --pat "$VSCE_PAT" --no-git-tag-version

echo "==> Cleaning up..."
rm -f "$VSIX_FILE"

echo "==> Done! Extension published."
