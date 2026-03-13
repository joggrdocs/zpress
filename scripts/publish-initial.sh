#!/usr/bin/env bash
# publish-initial.sh
#
# Auto-discovers all publishable packages, checks npm for each,
# and publishes any that are missing as v0.1.0 (no provenance).
#
# Usage:
#   ./scripts/publish-initial.sh
#
# Safe to re-run — already-published packages are skipped.
# After running, configure npm trusted publishers so CI can use provenance:
#   https://www.npmjs.com/package/<pkg>/access

set -euo pipefail

PACKAGES_DIR="packages"

# Verify npm auth before doing anything
echo "==> Checking npm auth..."
if ! npm whoami &>/dev/null; then
  echo ""
  echo "    Not logged in to npm. Run:"
  echo "      npm login"
  echo "    then re-run this script."
  exit 1
fi
NPM_USER=$(npm whoami)
echo "    logged in as: ${NPM_USER}"
PUBLISHED=()
SKIPPED=()
TAGS_TO_PUSH=()
INITIAL_VERSION="0.1.0"

pkg_field() {
  node -e "process.stdout.write(String(require('./$1').$2 ?? ''))"
}

npm_published_version() {
  npm view "$1" version 2>/dev/null || true
}

handle_package() {
  local pkg_dir="$1"
  local pkg_json="${pkg_dir}/package.json"

  [[ -f "$pkg_json" ]] || return

  local name is_private has_publish_config
  name=$(pkg_field "$pkg_json" "name")
  is_private=$(pkg_field "$pkg_json" "private")
  has_publish_config=$(node -e "process.stdout.write(String(!!require('./${pkg_json}').publishConfig))")

  # skip private or non-publishable packages
  [[ "$is_private" == "true" ]] && return
  [[ "$has_publish_config" != "true" ]] && return

  local npm_version
  npm_version=$(npm_published_version "$name")

  if [[ -n "$npm_version" ]]; then
    SKIPPED+=("${name}@${npm_version}")
    return
  fi

  echo ""
  echo "  => ${name} (not on npm — publishing as ${INITIAL_VERSION})"

  # stash the current version so we can restore it after publishing
  local current_version
  current_version=$(pkg_field "$pkg_json" "version")

  # temporarily set to 0.1.0 if needed
  if [[ "$current_version" != "$INITIAL_VERSION" ]]; then
    node -e "
      const fs = require('fs');
      const p = JSON.parse(fs.readFileSync('${pkg_json}', 'utf8'));
      p.version = '${INITIAL_VERSION}';
      fs.writeFileSync('${pkg_json}', JSON.stringify(p, null, 2) + '\n');
    "
    echo "     version: ${current_version} -> ${INITIAL_VERSION}"
  fi

  echo "     building..."
  pnpm --filter "$name" build

  echo "     publishing..."
  pnpm --filter "$name" exec npm publish --access public --no-provenance

  # restore original version
  if [[ "$current_version" != "$INITIAL_VERSION" ]]; then
    node -e "
      const fs = require('fs');
      const p = JSON.parse(fs.readFileSync('${pkg_json}', 'utf8'));
      p.version = '${current_version}';
      fs.writeFileSync('${pkg_json}', JSON.stringify(p, null, 2) + '\n');
    "
    echo "     version restored: ${current_version}"
  fi

  local tag="${name}@${INITIAL_VERSION}"
  if git tag "$tag" 2>/dev/null; then
    TAGS_TO_PUSH+=("$tag")
    echo "     tagged: ${tag}"
  else
    echo "     tag ${tag} already exists, skipping"
  fi

  PUBLISHED+=("$tag")
}

echo "==> Scanning packages for unpublished..."

for pkg_dir in "${PACKAGES_DIR}"/*/; do
  handle_package "${pkg_dir%/}"
done

if [[ ${#SKIPPED[@]} -gt 0 ]]; then
  echo ""
  echo "==> Already published (skipped):"
  for s in "${SKIPPED[@]}"; do echo "     ${s}"; done
fi

if [[ ${#PUBLISHED[@]} -eq 0 ]]; then
  echo ""
  echo "==> All packages already published. Nothing to do."
  exit 0
fi

echo ""
echo "==> Published:"
for p in "${PUBLISHED[@]}"; do echo "     ${p}"; done

if [[ ${#TAGS_TO_PUSH[@]} -gt 0 ]]; then
  echo ""
  echo "==> Pushing tags to origin..."
  git push origin "${TAGS_TO_PUSH[@]}"
  echo "    GitHub will create releases automatically from the new tags."
fi

echo ""
echo "==> Done. Next: add trusted publishers on npm so CI can use provenance:"
for p in "${PUBLISHED[@]}"; do
  pkg_name="${p%@*}"
  echo "    https://www.npmjs.com/package/${pkg_name}/access"
done
