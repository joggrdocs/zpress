#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────
# release.sh — manual local release for zpress
# ──────────────────────────────────────────────

readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[0;33m'
readonly CYAN='\033[0;36m'
readonly NC='\033[0m'

info()  { printf "${CYAN}▸ %s${NC}\n" "$1"; }
ok()    { printf "${GREEN}✓ %s${NC}\n" "$1"; }
warn()  { printf "${YELLOW}⚠ %s${NC}\n" "$1"; }
fail()  { printf "${RED}✗ %s${NC}\n" "$1"; exit 1; }

readonly PACKAGES=(packages/core packages/ui packages/cli packages/zpress)

# ── cleanup trap (registered early) ──────────

cleanup() {
  if [[ -f .npmrc.bak ]]; then
    mv .npmrc.bak .npmrc
  fi
  for pkg in "${PACKAGES[@]}"; do
    if [[ -f "$pkg/package.json.bak" ]]; then
      mv "$pkg/package.json.bak" "$pkg/package.json"
    fi
  done
}
trap cleanup EXIT

# ── pre-flight checks ──────────────────────────

info "Running pre-flight checks..."

# Must be run from repo root
[[ -f "package.json" ]] || fail "Run this script from the repository root"

# Require main branch
branch="$(git branch --show-current)"
[[ "$branch" == "main" ]] || warn "Not on main branch (currently on '$branch')"

# Clean working tree (version bump will create changes)
[[ -z "$(git status --porcelain)" ]] || fail "Working tree is dirty — commit or stash changes first"

# Require pnpm
command -v pnpm &>/dev/null || fail "pnpm is not installed"

# Require npm auth (local publish uses ~/.npmrc credentials)
npm_user="$(npm whoami 2>/dev/null)" || fail "Not logged in to npm — run 'npm login' first"
info "Authenticated as npm user: $npm_user"

ok "Pre-flight checks passed"

# ── quality checks ──────────────────────────────

info "Running quality checks..."
pnpm check
ok "Quality checks passed"

# ── version ─────────────────────────────────────

info "Applying changeset versions..."

if compgen -G ".changeset/*.md" >/dev/null; then
  pnpm changeset version
  ok "Versions bumped"

  # Commit the version bumps
  git add .
  git commit -m "chore(repo): version packages"
  ok "Version bump committed"
else
  warn "No pending changesets found — publishing with current versions"
fi

# ── build ───────────────────────────────────────

info "Building all packages..."
pnpm build
ok "Build complete"

# ── publish ─────────────────────────────────────

info "Publishing packages to npm..."

# Replace .npmrc with a minimal version that npm understands.
# The repo .npmrc has pnpm-specific settings (auto-install-peers) and a
# CI-only auth token (${NPM_TOKEN}). Neither works for local npm publish.
# Local auth comes from ~/.npmrc (set by `npm login`).
cp .npmrc .npmrc.bak
printf "# Temporary .npmrc for local publish (restored after release)\n" > .npmrc

# Strip provenance from package.json files (only works in CI with OIDC)
for pkg in "${PACKAGES[@]}"; do
  cp "$pkg/package.json" "$pkg/package.json.bak"
  node -e "
    const fs = require('fs');
    const p = JSON.parse(fs.readFileSync('$pkg/package.json', 'utf8'));
    if (p.publishConfig) { delete p.publishConfig.provenance; }
    fs.writeFileSync('$pkg/package.json', JSON.stringify(p, null, 2) + '\n');
  "
done

pnpm changeset publish
ok "Packages published"

# ── tag & push ──────────────────────────────────

info "Pushing commits and tags to origin..."
git push --follow-tags
ok "Pushed to origin"

printf "\n${GREEN}🎉 Release complete!${NC}\n"
