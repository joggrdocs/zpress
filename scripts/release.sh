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

# ── pre-flight checks ──────────────────────────

info "Running pre-flight checks..."

# Must be run from repo root
[[ -f "package.json" ]] || fail "Run this script from the repository root"

# Require main branch
branch="$(git branch --show-current)"
[[ "$branch" == "main" ]] || warn "Not on main branch (currently on '$branch')"

# Require pnpm
command -v pnpm &>/dev/null || fail "pnpm is not installed"

ok "Pre-flight checks passed"

# ── quality checks ──────────────────────────────

info "Running quality checks..."
pnpm check
ok "Quality checks passed"

# ── version ─────────────────────────────────────

info "Applying changeset versions..."

if ls .changeset/*.md &>/dev/null 2>&1; then
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

# Strip the CI auth token from .npmrc so local npm login is used
cp .npmrc .npmrc.bak
grep -v '_authToken' .npmrc.bak > .npmrc || true

# Strip provenance from package.json files (only works in CI)
readonly PACKAGES=(packages/core packages/ui packages/cli packages/zpress)
for pkg in "${PACKAGES[@]}"; do
  cp "$pkg/package.json" "$pkg/package.json.bak"
  node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('$pkg/package.json', 'utf8'));
    delete pkg.publishConfig.provenance;
    fs.writeFileSync('$pkg/package.json', JSON.stringify(pkg, null, 2) + '\n');
  "
done

cleanup() {
  mv .npmrc.bak .npmrc
  for pkg in "${PACKAGES[@]}"; do
    mv "$pkg/package.json.bak" "$pkg/package.json"
  done
}
trap cleanup EXIT

pnpm changeset publish
ok "Packages published"

# ── tag & push ──────────────────────────────────

info "Pushing commits and tags to origin..."
git push --follow-tags
ok "Pushed to origin"

printf "\n${GREEN}🎉 Release complete!${NC}\n"
