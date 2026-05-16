#!/bin/bash
# release.sh — semver-bump + build + publish + push for company-mcp-server.
#
# Bun-only: all CLI calls use Bun. npm is only the registry destination.
# Adapted from the topsyde-utils release script with these improvements:
#   - Runs `bun run typecheck` before tests (catches type errors pre-publish).
#   - After successful publish, pushes the version-bump commit AND a git tag to origin.

set -u

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m'

error_exit() {
  echo -e "${RED}ERROR: $1${NC}" >&2
  exit 1
}

show_usage() {
  echo -e "${BLUE}Usage:${NC} $0 [patch|minor|major] [tag] [options]"
  echo -e "  patch: 1.0.0 -> 1.0.1 (default)"
  echo -e "  minor: 1.0.0 -> 1.1.0"
  echo -e "  major: 1.0.0 -> 2.0.0"
  echo -e "  tag:   npm dist-tag (default: latest)"
  echo -e "  --dry-run        Skip publish, do not modify package.json"
  echo -e "  --test-publish   Simulate publish via 'bun publish --dry-run'"
  echo -e "  --skip-tests     Skip typecheck + tests (not recommended)"
}

DRY_RUN=false
TEST_PUBLISH=false
SKIP_TESTS=false
VERSION_TYPE="patch"
TAG="latest"
EXPLICIT_VERSION_TYPE=false

for arg in "$@"; do
  case "$arg" in
    --dry-run)       DRY_RUN=true ;;
    --test-publish)  TEST_PUBLISH=true ;;
    --skip-tests)    SKIP_TESTS=true ;;
    -h|--help)       show_usage; exit 0 ;;
    patch|minor|major) VERSION_TYPE="$arg"; EXPLICIT_VERSION_TYPE=true ;;
    --*)             error_exit "Unknown flag: $arg" ;;
    *)
      if [ "$EXPLICIT_VERSION_TYPE" = true ]; then
        TAG="$arg"
      else
        error_exit "Unexpected positional arg: $arg (specify version type first)"
      fi
      ;;
  esac
done

cd "$(dirname "$0")/.."

if [ -n "$(git status --porcelain)" ]; then
  error_exit "Working tree has uncommitted changes. Commit or stash before releasing."
fi

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "main" ]; then
  echo -e "${YELLOW}WARNING: Not on main (currently on '$CURRENT_BRANCH').${NC}"
  read -p "Proceed anyway? (y/n) " -n 1 -r
  echo
  [[ ! $REPLY =~ ^[Yy]$ ]] && exit 0
fi

# Read current version via bun (no node/npm dependency)
CURRENT_VERSION=$(bun -e "console.log(JSON.parse(await Bun.file('package.json').text()).version)") \
  || error_exit "Failed to read current version from package.json"

calculate_new_version() {
  local current=$1 type=$2
  IFS='.' read -r major minor patch <<< "$current"
  case "$type" in
    patch) echo "$major.$minor.$((patch + 1))" ;;
    minor) echo "$major.$((minor + 1)).0" ;;
    major) echo "$((major + 1)).0.0" ;;
  esac
}
NEW_VERSION=$(calculate_new_version "$CURRENT_VERSION" "$VERSION_TYPE")

# Bun-based package.json version writer (replaces `npm version --no-git-tag-version`)
write_version() {
  local v=$1
  bun -e "
    const pkg = JSON.parse(await Bun.file('package.json').text());
    pkg.version = '$v';
    await Bun.write('package.json', JSON.stringify(pkg, null, 2) + '\n');
  " || error_exit "Failed to write version $v to package.json"
}

if [ "$DRY_RUN" = true ]; then
  echo -e "${YELLOW}DRY RUN — no publishing, no version bump${NC}"
elif [ "$TEST_PUBLISH" = true ]; then
  echo -e "${YELLOW}TEST PUBLISH — simulates publish via 'bun publish --dry-run'${NC}"
fi

echo -e "${YELLOW}Package:${NC}        company-mcp-server"
echo -e "${YELLOW}Current version:${NC} $CURRENT_VERSION"
echo -e "${YELLOW}New version:${NC}     $NEW_VERSION"
echo -e "${YELLOW}npm tag:${NC}         $TAG"
echo -e "${YELLOW}Branch:${NC}          $CURRENT_BRANCH"
echo
read -p "Proceed? (y/n) " -n 1 -r
echo
[[ ! $REPLY =~ ^[Yy]$ ]] && { echo -e "${RED}Release canceled${NC}"; exit 0; }

START_TIME=$(date +%s)

if [ "$SKIP_TESTS" = false ]; then
  echo -e "${YELLOW}Running typecheck...${NC}"
  bun run typecheck || error_exit "Typecheck failed"
  echo -e "${GREEN}Typecheck clean${NC}"

  echo -e "${YELLOW}Running tests...${NC}"
  bun test tests/client.test.ts tests/shared tests/tools || error_exit "Tests failed"
  echo -e "${GREEN}Tests passed${NC}"
else
  echo -e "${YELLOW}WARNING: Tests skipped (--skip-tests)${NC}"
fi

revert_version() {
  echo -e "${YELLOW}Reverting package.json to $CURRENT_VERSION...${NC}"
  write_version "$CURRENT_VERSION" && echo -e "${GREEN}Reverted${NC}" \
    || echo -e "${RED}Failed to revert. Manually set version to $CURRENT_VERSION${NC}"
}

if [ "$DRY_RUN" = false ] && [ "$TEST_PUBLISH" = false ]; then
  echo -e "${YELLOW}Bumping version to $NEW_VERSION...${NC}"
  write_version "$NEW_VERSION"
  echo -e "${GREEN}Version bumped${NC}"
fi

echo -e "${YELLOW}Building...${NC}"
bun run build || { [ "$DRY_RUN" = false ] && [ "$TEST_PUBLISH" = false ] && revert_version; error_exit "Build failed"; }
echo -e "${GREEN}Build complete${NC}"

echo -e "${YELLOW}Publishing $NEW_VERSION (tag=$TAG)...${NC}"
PUBLISH_SUCCESS=false
if [ "$DRY_RUN" = true ]; then
  echo -e "${YELLOW}DRY RUN: would run 'bun publish --tag $TAG --no-git-checks'${NC}"
  PUBLISH_SUCCESS=true
elif [ "$TEST_PUBLISH" = true ]; then
  echo -e "${YELLOW}TEST PUBLISH: 'bun publish --dry-run --tag $TAG --no-git-checks'${NC}"
  bun publish --dry-run --tag "$TAG" --no-git-checks && PUBLISH_SUCCESS=true || PUBLISH_SUCCESS=false
else
  bun publish --tag "$TAG" --no-git-checks && PUBLISH_SUCCESS=true || PUBLISH_SUCCESS=false
fi

if [ "$PUBLISH_SUCCESS" = false ]; then
  [ "$DRY_RUN" = false ] && [ "$TEST_PUBLISH" = false ] && revert_version
  error_exit "Publish failed"
fi

if [ "$DRY_RUN" = false ] && [ "$TEST_PUBLISH" = false ]; then
  echo -e "${YELLOW}Committing version bump...${NC}"
  git add package.json
  git commit -m "chore(release): company-mcp-server@$NEW_VERSION" \
    || error_exit "Failed to commit version bump"
  echo -e "${GREEN}Committed${NC}"

  echo -e "${YELLOW}Tagging v$NEW_VERSION...${NC}"
  git tag "v$NEW_VERSION" \
    || error_exit "Failed to create tag"
  echo -e "${GREEN}Tagged${NC}"

  echo -e "${YELLOW}Pushing commit + tag to origin...${NC}"
  git push origin "$CURRENT_BRANCH" || error_exit "Failed to push commit"
  git push origin "v$NEW_VERSION"   || error_exit "Failed to push tag"
  echo -e "${GREEN}Pushed${NC}"
fi

END_TIME=$(date +%s)
ELAPSED=$((END_TIME - START_TIME))

DIST_SIZE=$(du -sh dist 2>/dev/null | cut -f1)
DIST_FILES=$(find dist -type f 2>/dev/null | wc -l | xargs)

echo
if [ "$DRY_RUN" = true ]; then
  echo -e "${GREEN}Dry run complete.${NC} Would publish $NEW_VERSION (tag=$TAG)."
elif [ "$TEST_PUBLISH" = true ]; then
  echo -e "${GREEN}Test publish complete.${NC} Would publish $NEW_VERSION (tag=$TAG)."
else
  echo -e "${GREEN}Published $NEW_VERSION (tag=$TAG)${NC}"
  echo -e "${GREEN}npm:${NC}     https://www.npmjs.com/package/company-mcp-server"
  echo -e "${GREEN}Run with:${NC} bunx company-mcp-server"
fi
echo -e "${GREEN}Elapsed:${NC} ${ELAPSED}s"
echo -e "${GREEN}Dist:${NC}    $DIST_SIZE ($DIST_FILES files)"
