#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

SERVER_PID=""
FRONTEND_PID=""
TMP_DIR=""
REQUEST_RESET=0

log() {
  printf '[forgepoint] %s\n' "$*"
}

usage() {
  cat <<'USAGE'
Usage: ./start.sh [--reset] [--oneshot]

Options:
  --reset    Reset generated demo repository and extension storage before startup.
  --oneshot  Exit after the smoke checks pass.
USAGE
}

fail() {
  printf '[forgepoint] ERROR: %s\n' "$*" >&2
  for log_file in "${SERVER_LOG:-}" "${FRONTEND_LOG:-}"; do
    if [[ -n "$log_file" && -f "$log_file" ]]; then
      printf '\n[forgepoint] %s tail:\n' "$log_file" >&2
      tail -n 80 "$log_file" >&2 || true
    fi
  done
  exit 1
}

require_command() {
  local command_name="$1"
  command -v "$command_name" >/dev/null 2>&1 || fail "missing required command: $command_name"
}

reset_generated_path() {
  local path="$1"
  case "$path" in
    "$DATA_DIR"/*)
      if [[ -e "$path" ]]; then
        log "resetting generated path: $path"
        rm -rf -- "$path"
      fi
      ;;
    *)
      fail "refusing to reset path outside FORGEPOINT_DATA_DIR: $path"
      ;;
  esac
}

cleanup() {
  for pid in "$FRONTEND_PID" "$SERVER_PID"; do
    if [[ -n "$pid" ]] && kill -0 "$pid" >/dev/null 2>&1; then
      log "stopping pid=$pid"
      kill "$pid" >/dev/null 2>&1 || true
      wait "$pid" >/dev/null 2>&1 || true
    fi
  done
  if [[ -n "$TMP_DIR" && -d "$TMP_DIR" ]]; then
    rm -rf "$TMP_DIR"
  fi
}

load_envrc() {
  if [[ ! -f "$ROOT_DIR/.envrc" ]]; then
    return
  fi

  local override_names=(
    BUN
    FORGEPOINT_CONFIG
    FORGEPOINT_DATA_DIR
    FORGEPOINT_DEMO_FIXTURE
    FORGEPOINT_EXTENSION_DIR
    FORGEPOINT_FRONTEND_LISTEN
    FORGEPOINT_FRONTEND_URL
    FORGEPOINT_LISTEN
    FORGEPOINT_ONESHOT
    FORGEPOINT_OPERATOR_CODE
    FORGEPOINT_READY_TIMEOUT_SECONDS
    FORGEPOINT_RESET_DEMO_DATA
    FORGEPOINT_SERVER_URL
    PUBLIC_FORGEPOINT_OPERATOR_CODE
  )
  for name in "${override_names[@]}"; do
    eval "SNAP_${name}_SET=\"\${${name}+1}\""
    eval "SNAP_${name}_VALUE=\"\${${name}-}\""
  done

  if command -v direnv >/dev/null 2>&1; then
    eval "$(direnv export bash)"
  else
    log ".envrc found but direnv is unavailable; attempting plain shell source"
    set +e
    set -a
    # shellcheck disable=SC1091
    source "$ROOT_DIR/.envrc"
    local rc=$?
    set +a
    set -e
    if [[ "$rc" -ne 0 ]]; then
      fail ".envrc could not be loaded without direnv"
    fi
  fi

  for name in "${override_names[@]}"; do
    local set_marker
    eval "set_marker=\"\${SNAP_${name}_SET}\""
    if [[ -n "$set_marker" ]]; then
      eval "export ${name}=\"\${SNAP_${name}_VALUE}\""
    fi
  done
}

expect_status() {
  local label="$1"
  local expected="$2"
  local body_file="$3"
  shift 3

  local status
  status="$(curl -sS -o "$body_file" -w '%{http_code}' "$@")" || fail "$label request failed"
  if [[ "$status" != "$expected" ]]; then
    printf '\n[forgepoint] %s returned HTTP %s, expected %s\n' "$label" "$status" "$expected" >&2
    printf '[forgepoint] response body:\n' >&2
    sed -n '1,180p' "$body_file" >&2 || true
    exit 1
  fi
  log "ok - $label ($status)"
}

expect_contains() {
  local label="$1"
  local body_file="$2"
  local needle="$3"

  if ! grep -Fq "$needle" "$body_file"; then
    printf '\n[forgepoint] %s response did not contain: %s\n' "$label" "$needle" >&2
    printf '[forgepoint] response body:\n' >&2
    sed -n '1,180p' "$body_file" >&2 || true
    exit 1
  fi
}

json_assert() {
  local label="$1"
  local body_file="$2"
  local expression="$3"

  if ! "$BUN" --eval '
const fs = require("fs");
const [file, expression, label] = process.argv.slice(1);
let json;
try {
  json = JSON.parse(fs.readFileSync(file, "utf8"));
} catch (error) {
  console.error(`[forgepoint] ${label} did not return valid JSON: ${error.message}`);
  process.exit(1);
}
let ok = false;
try {
  ok = Boolean(Function("json", `"use strict"; return (${expression});`)(json));
} catch (error) {
  console.error(`[forgepoint] ${label} JSON assertion threw: ${error.message}`);
  console.error(`[forgepoint] assertion: ${expression}`);
  process.exit(1);
}
if (!ok) {
  console.error(`[forgepoint] ${label} JSON assertion failed: ${expression}`);
  console.error(JSON.stringify(json, null, 2).slice(0, 12000));
  process.exit(1);
}
' "$body_file" "$expression" "$label"; then
    exit 1
  fi
}

json_value() {
  local body_file="$1"
  local expression="$2"
  "$BUN" --eval '
const fs = require("fs");
const [file, expression] = process.argv.slice(1);
const json = JSON.parse(fs.readFileSync(file, "utf8"));
const value = Function("json", `"use strict"; return (${expression});`)(json);
if (value !== undefined && value !== null) {
  process.stdout.write(String(value));
}
' "$body_file" "$expression"
}

extract_json_string() {
  local field="$1"
  local body_file="$2"
  json_value "$body_file" "json[\"$field\"]"
}

wait_for_url() {
  local label="$1"
  local url="$2"
  local expected="$3"
  local deadline=$((SECONDS + READY_TIMEOUT_SECONDS))
  local body_file="$TMP_DIR/wait-${label}.body"

  while ((SECONDS < deadline)); do
    if [[ -n "$SERVER_PID" ]] && ! kill -0 "$SERVER_PID" >/dev/null 2>&1; then
      fail "server exited while waiting for $label"
    fi
    if [[ -n "$FRONTEND_PID" ]] && ! kill -0 "$FRONTEND_PID" >/dev/null 2>&1; then
      fail "frontend exited while waiting for $label"
    fi

    local status
    status="$(curl -sS -o "$body_file" -w '%{http_code}' "$url" 2>/dev/null || true)"
    if [[ "$status" == "$expected" ]]; then
      return 0
    fi
    sleep 0.25
  done

  fail "$label did not become ready within ${READY_TIMEOUT_SECONDS}s"
}

trap cleanup EXIT
trap 'cleanup; exit 130' INT TERM

while [[ $# -gt 0 ]]; do
  case "$1" in
    --reset)
      REQUEST_RESET=1
      shift
      ;;
    --oneshot)
      export FORGEPOINT_ONESHOT=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      usage >&2
      fail "unknown argument: $1"
      ;;
  esac
done

load_envrc

CONFIG="${FORGEPOINT_CONFIG:-config/production-testbed.cue}"
DATA_DIR="${FORGEPOINT_DATA_DIR:-/private/tmp/forgepoint-production-testbed}"
DEMO_FIXTURE="${FORGEPOINT_DEMO_FIXTURE:-fixtures/demo/conference.json}"
RESET_DEMO_DATA="${FORGEPOINT_RESET_DEMO_DATA:-0}"
BACKEND_LISTEN="${FORGEPOINT_LISTEN:-127.0.0.1:8080}"
BACKEND_URL="${FORGEPOINT_SERVER_URL:-http://${BACKEND_LISTEN}}"
FRONTEND_LISTEN="${FORGEPOINT_FRONTEND_LISTEN:-127.0.0.1:4321}"
FRONTEND_HOST="${FRONTEND_LISTEN%:*}"
FRONTEND_PORT="${FRONTEND_LISTEN##*:}"
FRONTEND_URL="${FORGEPOINT_FRONTEND_URL:-http://${FRONTEND_LISTEN}}"
READY_TIMEOUT_SECONDS="${FORGEPOINT_READY_TIMEOUT_SECONDS:-30}"
ONESHOT="${FORGEPOINT_ONESHOT:-0}"
OPERATOR_CODE="${FORGEPOINT_OPERATOR_CODE:-}"
BUN="${BUN:-$HOME/.bun/bin/bun}"

if [[ "$REQUEST_RESET" == "1" ]]; then
  RESET_DEMO_DATA=1
fi

if [[ -z "$OPERATOR_CODE" ]]; then
  fail "FORGEPOINT_OPERATOR_CODE is required. Put a seeded operator code in .envrc or export it before running start.sh."
fi

if [[ "$DATA_DIR" != /* ]]; then
  fail "FORGEPOINT_DATA_DIR must be absolute in production-testbed mode: $DATA_DIR"
fi

require_command cargo
require_command curl
require_command git
[[ -x "$BUN" ]] || fail "missing Bun executable: $BUN"

export FORGEPOINT_CONFIG="$CONFIG"
export FORGEPOINT_DATA_DIR="$DATA_DIR"
export FORGEPOINT_EXTENSION_DIR="${FORGEPOINT_EXTENSION_DIR:-$ROOT_DIR/extensions/first-party}"
export FORGEPOINT_TLS_TERMINATED=true
export FORGEPOINT_OPERATOR_CODE="$OPERATOR_CODE"
export FORGEPOINT_LISTEN="$BACKEND_LISTEN"
export FORGEPOINT_SERVER_URL="$BACKEND_URL"
export PUBLIC_FORGEPOINT_OPERATOR_CODE="${PUBLIC_FORGEPOINT_OPERATOR_CODE:-$OPERATOR_CODE}"

if [[ ! -f "$DEMO_FIXTURE" ]]; then
  fail "demo fixture not found: $DEMO_FIXTURE"
fi

mkdir -p "$DATA_DIR/metadata"
DEMO_STATE="$DATA_DIR/metadata/demo-state.json"
if [[ "$RESET_DEMO_DATA" == "1" || ! -f "$DEMO_STATE" ]]; then
  cp "$DEMO_FIXTURE" "$DEMO_STATE"
  reset_generated_path "$DATA_DIR/repositories/forgepoint/forgepoint.git"
  reset_generated_path "$DATA_DIR/metadata/demo-repository-workdir"
  reset_generated_path "$DATA_DIR/extensions/storage"
  log "seeded demo state: $DEMO_STATE"
fi

TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/forgepoint-start.XXXXXX")"
SERVER_LOG="${FORGEPOINT_SERVER_LOG:-$DATA_DIR/server.log}"
FRONTEND_LOG="${FORGEPOINT_FRONTEND_LOG:-$DATA_DIR/frontend.log}"

TARGET_DIR="${CARGO_TARGET_DIR:-target}"
if [[ "$TARGET_DIR" == /* ]]; then
  SERVER_BIN="$TARGET_DIR/debug/forgepoint-server"
else
  SERVER_BIN="$ROOT_DIR/$TARGET_DIR/debug/forgepoint-server"
fi

log "building forgepoint-server"
cargo build -p forgepoint-server

log "building Astro frontend"
(cd frontend && "$BUN" run build)

log "checking production-testbed startup gates"
"$SERVER_BIN" --check

log "starting Rust server at $BACKEND_URL"
log "starting Astro frontend at $FRONTEND_URL"
log "data dir: $DATA_DIR"
log "server log: $SERVER_LOG"
log "frontend log: $FRONTEND_LOG"
"$SERVER_BIN" >"$SERVER_LOG" 2>&1 &
SERVER_PID="$!"

wait_for_url "server readyz" "$BACKEND_URL/readyz" 200

(
  cd frontend
  FORGEPOINT_SERVER_URL="$BACKEND_URL" \
    PUBLIC_FORGEPOINT_OPERATOR_CODE="$PUBLIC_FORGEPOINT_OPERATOR_CODE" \
    "$BUN" run preview -- --host "$FRONTEND_HOST" --port "$FRONTEND_PORT"
) >"$FRONTEND_LOG" 2>&1 &
FRONTEND_PID="$!"

wait_for_url "frontend shell" "$FRONTEND_URL/" 200

expect_status "frontend shell" 200 "$TMP_DIR/frontend.html" \
  "$FRONTEND_URL/"
expect_contains "frontend shell" "$TMP_DIR/frontend.html" "Forgepoint"
expect_contains "rendered UI through Astro" "$TMP_DIR/frontend.html" 'data-smoke="rendered-ui-live"'

expect_status "frontend readyz" 200 "$TMP_DIR/readyz.json" \
  "$FRONTEND_URL/readyz"
json_assert "frontend readyz" "$TMP_DIR/readyz.json" \
  'json.ready === true && json.mode === "production-testbed" && json.checks.extensionStorageSchema === true && json.checks.extensionStorageDocuments === true && json.checks.wasmtimeResolversExecuted === true && json.checks.demoRepositoryRefs === true && json.unsupported.some((surface) => surface.id === "legacy_v1_api" && surface.pathPrefix === "/api/v1/") && json.unsupported.some((surface) => surface.id === "git_receive_pack")'

expect_status "unsupported legacy v1 route fails explicitly through Astro" 501 "$TMP_DIR/legacy-v1.json" \
  "$FRONTEND_URL/api/v1/repositories"
json_assert "unsupported legacy v1 route fails explicitly through Astro" "$TMP_DIR/legacy-v1.json" \
  'json.errors[0].extensions.code === "UNSUPPORTED" && json.errors[0].extensions.surface === "legacy_v1_api"'

expect_status "unsupported OIDC callback fails explicitly through Astro" 501 "$TMP_DIR/oidc-callback.json" \
  "$FRONTEND_URL/auth/oidc/prod/callback"
json_assert "unsupported OIDC callback fails explicitly through Astro" "$TMP_DIR/oidc-callback.json" \
  'json.errors[0].extensions.code === "UNSUPPORTED" && json.errors[0].extensions.surface === "oidc_browser_callback"'

expect_status "operator code exchange through Astro" 200 "$TMP_DIR/token.json" \
  -H "content-type: application/json" \
  --data "{\"grantType\":\"urn:forgepoint:grant:operator-code\",\"subjectToken\":\"$OPERATOR_CODE\",\"subjectTokenType\":\"urn:forgepoint:token-type:operator-code\",\"requestedResource\":\"forgepoint://repository/repo_01HV0K4XAVE2H6R5M8KJZ8Q1A3\",\"requestedActions\":[\"graphql:read\",\"graphql:write\",\"events:read\",\"git:read\",\"checks:read\"]}" \
  "$FRONTEND_URL/auth/token-exchange"

ACCESS_TOKEN="$(extract_json_string accessToken "$TMP_DIR/token.json")"
if [[ -z "$ACCESS_TOKEN" ]]; then
  fail "operator code exchange did not return accessToken"
fi

expect_status "GraphQL through Astro" 200 "$TMP_DIR/graphql.json" \
  -H "authorization: Bearer $ACCESS_TOKEN" \
  -H "content-type: application/json" \
  --data '{"query":"{ viewer { authenticated } instance { capabilities } workspace repository extensionInstallations extensionResolvers activityEvents }"}' \
  "$FRONTEND_URL/graphql"
json_assert "GraphQL viewer through Astro" "$TMP_DIR/graphql.json" \
  'json.data.viewer.authenticated === true && json.data.viewer.permissions.includes("git:read")'
json_assert "GraphQL Git data through Astro" "$TMP_DIR/graphql.json" \
  'json.data.repository.path === "forgepoint/forgepoint" && typeof json.data.repository.headOid === "string" && json.data.repository.refs.length > 0 && json.data.repository.commits.length > 0 && json.data.repository.treeEntries.length > 0 && json.data.repository.blobs.length > 0'
json_assert "GraphQL storage data through Astro" "$TMP_DIR/graphql.json" \
  'json.data.workspace.name === "Forgepoint Labs" && json.data.repository.pullRequests.length > 0 && json.data.repository.checks.length > 0 && json.data.extensionInstallations.length === 3 && json.data.activityEvents.length > 0'
json_assert "GraphQL typed resolver data through Astro" "$TMP_DIR/graphql.json" \
  'json.data.extensionResolvers.length === 3 && json.data.extensionResolvers.every((resolver) => resolver.status === "executed" && !Object.prototype.hasOwnProperty.call(resolver, "result")) && json.data.extensionResolvers.some((resolver) => resolver.id === "ext_code_browser" && resolver.outputType === "forgepoint.code-browser/summary.v1" && resolver.output.methods.includes("repository_refs") && resolver.output.blobPreviews === json.data.repository.blobs.length)'
json_assert "GraphQL demo convenience aggregate through Astro" "$TMP_DIR/graphql.json" \
  'json.data.demo.repository.headOid === json.data.repository.headOid'
GRAPHQL_HEAD_OID="$(json_value "$TMP_DIR/graphql.json" 'json.data.repository.headOid')"
if [[ -z "$GRAPHQL_HEAD_OID" ]]; then
  fail "GraphQL did not return repository.headOid"
fi
GRAPHQL_BRANCHES="$(json_value "$TMP_DIR/graphql.json" 'json.data.repository.branches.map((branch) => branch.name).join(", ")')"
GRAPHQL_EXTENSIONS="$(json_value "$TMP_DIR/graphql.json" 'json.data.extensionInstallations.map((extension) => extension.id).join(", ")')"
log "seeded repository path: $DATA_DIR/repositories/forgepoint/forgepoint.git"
log "seeded branches: $GRAPHQL_BRANCHES"
log "installed extensions: $GRAPHQL_EXTENSIONS"
json_value "$TMP_DIR/graphql.json" 'json.data.repository.diff.patch' >"$TMP_DIR/graphql-diff.patch"
SSR_HEAD_OID="$(sed -n 's/.*data-smoke-head-oid="\([^"]*\)".*/\1/p' "$TMP_DIR/frontend.html" | head -n 1)"
if [[ "$SSR_HEAD_OID" != "$GRAPHQL_HEAD_OID" ]]; then
  fail "rendered frontend headOid $SSR_HEAD_OID did not match GraphQL headOid $GRAPHQL_HEAD_OID"
fi

expect_status "event session through Astro" 200 "$TMP_DIR/events-session.json" \
  -X POST \
  -H "origin: $FRONTEND_URL" \
  -H "sec-fetch-site: same-origin" \
  -H "authorization: Bearer $ACCESS_TOKEN" \
  -H "content-type: application/json" \
  --data '{}' \
  "$FRONTEND_URL/events/session"

EVENT_SESSION="$(extract_json_string session "$TMP_DIR/events-session.json")"
if [[ -z "$EVENT_SESSION" ]]; then
  fail "event session request did not return session"
fi

expect_status "event stream through Astro" 200 "$TMP_DIR/events.json" \
  "$FRONTEND_URL/events?session=$EVENT_SESSION"
expect_contains "event stream through Astro" "$TMP_DIR/events.json" 'dev.forgepoint.instance.started'
expect_status "event session reuse fails closed through Astro" 401 "$TMP_DIR/events-reuse.json" \
  "$FRONTEND_URL/events?session=$EVENT_SESSION"
json_assert "event session reuse fails closed through Astro" "$TMP_DIR/events-reuse.json" \
  'json.errors[0].extensions.code === "UNAUTHENTICATED"'

for extension_id in ext_pull_requests ext_code_browser ext_checks; do
  expect_status "extension ${extension_id} manifest session" 200 "$TMP_DIR/${extension_id}-manifest-session.json" \
    -X POST \
    -H "origin: $FRONTEND_URL" \
    -H "sec-fetch-site: same-origin" \
    -H "authorization: Bearer $ACCESS_TOKEN" \
    -H "content-type: application/json" \
    --data '{}' \
    "$FRONTEND_URL/_extensions/session"
  EXTENSION_SESSION="$(extract_json_string session "$TMP_DIR/${extension_id}-manifest-session.json")"
  if [[ -z "$EXTENSION_SESSION" ]]; then
    fail "extension ${extension_id} manifest session request did not return session"
  fi

  expect_status "extension ${extension_id} manifest through Astro" 200 "$TMP_DIR/${extension_id}-manifest.json" \
    "$FRONTEND_URL/_extensions/${extension_id}/manifest.json?session=$EXTENSION_SESSION"
  expect_contains "extension ${extension_id} manifest through Astro" "$TMP_DIR/${extension_id}-manifest.json" '"schemaVersion": "forgepoint.ui-extension/v1"'
  json_assert "extension ${extension_id} manifest declares mountable slots" "$TMP_DIR/${extension_id}-manifest.json" \
    "json.id === \"$extension_id\" && json.slots.length > 0 && json.slots.every((slot) => slot.slot.startsWith(\"repository.\") && typeof slot.element === \"string\" && slot.element.length > 0)"

  expect_status "extension ${extension_id} asset session" 200 "$TMP_DIR/${extension_id}-asset-session.json" \
    -X POST \
    -H "origin: $FRONTEND_URL" \
    -H "sec-fetch-site: same-origin" \
    -H "authorization: Bearer $ACCESS_TOKEN" \
    -H "content-type: application/json" \
    --data '{}' \
    "$FRONTEND_URL/_extensions/session"
  EXTENSION_ASSET_SESSION="$(extract_json_string session "$TMP_DIR/${extension_id}-asset-session.json")"
  if [[ -z "$EXTENSION_ASSET_SESSION" ]]; then
    fail "extension ${extension_id} asset session request did not return session"
  fi

  expect_status "extension ${extension_id} asset through Astro" 200 "$TMP_DIR/${extension_id}-asset.js" \
    "$FRONTEND_URL/_extensions/${extension_id}/assets/index.js?session=$EXTENSION_ASSET_SESSION"
  expect_contains "extension ${extension_id} asset through Astro" "$TMP_DIR/${extension_id}-asset.js" 'customElements.define'
done

expect_status "Git upload-pack without token fails closed through Astro" 401 "$TMP_DIR/git-no-token.json" \
  "$FRONTEND_URL/git/forgepoint/forgepoint.git/info/refs?service=git-upload-pack"
json_assert "Git upload-pack without token fails closed through Astro" "$TMP_DIR/git-no-token.json" \
  'json.errors[0].extensions.code === "UNAUTHENTICATED"'

expect_status "Git upload-pack with wrong token fails closed through Astro" 401 "$TMP_DIR/git-wrong-token.json" \
  -H "authorization: Bearer wrong-token" \
  "$FRONTEND_URL/git/forgepoint/forgepoint.git/info/refs?service=git-upload-pack"
json_assert "Git upload-pack with wrong token fails closed through Astro" "$TMP_DIR/git-wrong-token.json" \
  'json.errors[0].extensions.code === "UNAUTHENTICATED"'

expect_status "operator code exchange for non-Git credential" 200 "$TMP_DIR/no-git-token.json" \
  -H "content-type: application/json" \
  --data "{\"grantType\":\"urn:forgepoint:grant:operator-code\",\"subjectToken\":\"$OPERATOR_CODE\",\"subjectTokenType\":\"urn:forgepoint:token-type:operator-code\",\"requestedResource\":\"forgepoint://repository/repo_01HV0K4XAVE2H6R5M8KJZ8Q1A3\",\"requestedActions\":[\"graphql:read\"]}" \
  "$FRONTEND_URL/auth/token-exchange"
NO_GIT_TOKEN="$(extract_json_string accessToken "$TMP_DIR/no-git-token.json")"
if [[ -z "$NO_GIT_TOKEN" ]]; then
  fail "non-Git credential exchange did not return accessToken"
fi
expect_status "Git upload-pack without git read scope fails closed through Astro" 403 "$TMP_DIR/git-no-read-scope.json" \
  -H "authorization: Bearer $NO_GIT_TOKEN" \
  "$FRONTEND_URL/git/forgepoint/forgepoint.git/info/refs?service=git-upload-pack"
json_assert "Git upload-pack without git read scope fails closed through Astro" "$TMP_DIR/git-no-read-scope.json" \
  'json.errors[0].extensions.code === "FORBIDDEN"'

log "checking seeded Git refs through Astro"
git -c "http.extraHeader=Authorization: Bearer $ACCESS_TOKEN" \
  ls-remote "$FRONTEND_URL/git/forgepoint/forgepoint.git" \
  >"$TMP_DIR/git-ls-remote.log" 2>&1 || fail "git ls-remote through Astro failed"
if ! grep -Fq "${GRAPHQL_HEAD_OID}"$'\t'"refs/heads/main" "$TMP_DIR/git-ls-remote.log"; then
  printf '[forgepoint] git ls-remote output did not match GraphQL headOid %s\n' "$GRAPHQL_HEAD_OID" >&2
  sed -n '1,120p' "$TMP_DIR/git-ls-remote.log" >&2 || true
  exit 1
fi

log "cloning seeded Git repository through Astro"
GIT_SMOKE_CLONE="$TMP_DIR/forgepoint-clone"
git -c "http.extraHeader=Authorization: Bearer $ACCESS_TOKEN" \
  clone "$FRONTEND_URL/git/forgepoint/forgepoint.git" "$GIT_SMOKE_CLONE" \
  >"$TMP_DIR/git-clone.log" 2>&1 || fail "git clone through Astro failed"
test -f "$GIT_SMOKE_CLONE/README.md" || fail "git clone did not fetch README.md"
CLONED_HEAD_OID="$(git -C "$GIT_SMOKE_CLONE" rev-parse HEAD)"
if [[ "$CLONED_HEAD_OID" != "$GRAPHQL_HEAD_OID" ]]; then
  fail "git clone HEAD $CLONED_HEAD_OID did not match GraphQL headOid $GRAPHQL_HEAD_OID"
fi
if [[ "$CLONED_HEAD_OID" != "$SSR_HEAD_OID" ]]; then
  fail "git clone HEAD $CLONED_HEAD_OID did not match rendered frontend headOid $SSR_HEAD_OID"
fi
git -C "$GIT_SMOKE_CLONE" diff --patch --find-renames HEAD~1 HEAD \
  >"$TMP_DIR/git-diff.patch" || fail "git diff against cloned repository failed"
if ! cmp -s "$TMP_DIR/graphql-diff.patch" "$TMP_DIR/git-diff.patch"; then
  printf '[forgepoint] GraphQL diff patch did not match git diff HEAD~1 HEAD\n' >&2
  diff -u "$TMP_DIR/git-diff.patch" "$TMP_DIR/graphql-diff.patch" >&2 || true
  exit 1
fi
git -C "$GIT_SMOKE_CLONE" \
  -c "http.extraHeader=Authorization: Bearer $ACCESS_TOKEN" \
  fetch origin main \
  >"$TMP_DIR/git-fetch.log" 2>&1 || fail "git fetch through Astro failed"
git -C "$GIT_SMOKE_CLONE" \
  -c "http.extraHeader=Authorization: Bearer $ACCESS_TOKEN" \
  fetch origin refs/heads/ui/repository-intelligence:refs/remotes/origin/ui/repository-intelligence \
  >"$TMP_DIR/git-fetch-branch.log" 2>&1 || fail "git branch-specific fetch through Astro failed"
git -C "$GIT_SMOKE_CLONE" rev-parse refs/remotes/origin/ui/repository-intelligence \
  >"$TMP_DIR/git-fetch-branch-rev.log" || fail "branch-specific fetch did not create remote ref"
log "ok - Git clone/fetch through Astro"

expect_status "Git receive-pack fails closed through Astro" 501 "$TMP_DIR/git-receive-pack.json" \
  -H "authorization: Bearer $ACCESS_TOKEN" \
  "$FRONTEND_URL/git/forgepoint/forgepoint.git/info/refs?service=git-receive-pack"
json_assert "Git receive-pack fails closed through Astro" "$TMP_DIR/git-receive-pack.json" \
  'json.errors[0].extensions.code === "UNSUPPORTED" && json.errors[0].extensions.surface === "git_receive_pack" && json.errors[0].message.includes("receive-pack")'

log "end-to-end production-testbed smoke passed"

if [[ "$ONESHOT" == "1" ]]; then
  exit 0
fi

log "Astro frontend: $FRONTEND_URL"
log "Rust server: $BACKEND_URL"
log "press Ctrl-C to stop both processes"
wait "$FRONTEND_PID"
