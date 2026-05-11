#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

SERVER_PID=""
FRONTEND_PID=""
TMP_DIR=""
REQUEST_RESET=0

log() {
  printf '[comtrya] %s\n' "$*"
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
  printf '[comtrya] ERROR: %s\n' "$*" >&2
  for log_file in "${SERVER_LOG:-}" "${FRONTEND_LOG:-}"; do
    if [[ -n "$log_file" && -f "$log_file" ]]; then
      printf '\n[comtrya] %s tail:\n' "$log_file" >&2
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
      fail "refusing to reset path outside COMTRYA_DATA_DIR: $path"
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
    COMTRYA_CONFIG
    COMTRYA_DATA_DIR
    COMTRYA_DEMO_FIXTURE
    COMTRYA_EXTERNAL_DEMO
    COMTRYA_EXTENSION_DIR
    COMTRYA_FRONTEND_LISTEN
    COMTRYA_FRONTEND_URL
    COMTRYA_LISTEN
    COMTRYA_ONESHOT
    COMTRYA_OPERATOR_CODE
    COMTRYA_READY_TIMEOUT_SECONDS
    COMTRYA_RESET_DEMO_DATA
    COMTRYA_SERVER_URL
    COMTRYA_SESSION_TTL_SECONDS
    PUBLIC_COMTRYA_OPERATOR_CODE
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
    printf '\n[comtrya] %s returned HTTP %s, expected %s\n' "$label" "$status" "$expected" >&2
    printf '[comtrya] response body:\n' >&2
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
    printf '\n[comtrya] %s response did not contain: %s\n' "$label" "$needle" >&2
    printf '[comtrya] response body:\n' >&2
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
  console.error(`[comtrya] ${label} did not return valid JSON: ${error.message}`);
  process.exit(1);
}
let ok = false;
try {
  ok = Boolean(Function("json", `"use strict"; return (${expression});`)(json));
} catch (error) {
  console.error(`[comtrya] ${label} JSON assertion threw: ${error.message}`);
  console.error(`[comtrya] assertion: ${expression}`);
  process.exit(1);
}
if (!ok) {
  console.error(`[comtrya] ${label} JSON assertion failed: ${expression}`);
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

find_headless_browser() {
  if [[ -n "${COMTRYA_BROWSER_BIN:-}" ]]; then
    [[ -x "$COMTRYA_BROWSER_BIN" ]] || fail "COMTRYA_BROWSER_BIN is not executable: $COMTRYA_BROWSER_BIN"
    printf '%s' "$COMTRYA_BROWSER_BIN"
    return
  fi

  local candidates=(
    "google-chrome"
    "google-chrome-stable"
    "chromium"
    "chromium-browser"
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    "/Applications/Google Chrome Dev.app/Contents/MacOS/Google Chrome Dev"
    "/Applications/Chromium.app/Contents/MacOS/Chromium"
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"
  )
  for candidate in "${candidates[@]}"; do
    if [[ "$candidate" == */* ]]; then
      if [[ -x "$candidate" ]]; then
        printf '%s' "$candidate"
        return
      fi
    else
      local resolved
      resolved="$(command -v "$candidate" 2>/dev/null || true)"
      if [[ -n "$resolved" ]]; then
        printf '%s' "$resolved"
        return
      fi
    fi
  done

  return 1
}

assert_extension_browser_surfaces_render() {
  local evidence_file="$1"
  local browser_log="$2"
  local graphql_file="$3"
  local browser_bin
  browser_bin="$(find_headless_browser)" || fail "extension browser smoke requires Chrome/Chromium or COMTRYA_BROWSER_BIN"

  local profile_dir="$TMP_DIR/headless-browser-profile"
  local browser_stdout="$TMP_DIR/headless-browser.stdout"
  local debugging_port="${COMTRYA_BROWSER_DEBUG_PORT:-$((24000 + RANDOM % 20000))}"
  local browser_pid=""
  rm -rf "$profile_dir"
  mkdir -p "$profile_dir"

  "$browser_bin" \
    --headless=new \
    --disable-gpu \
    --disable-dev-shm-usage \
    --no-default-browser-check \
    --no-first-run \
    --no-sandbox \
    --remote-debugging-address=127.0.0.1 \
    --remote-debugging-port="$debugging_port" \
    --user-data-dir="$profile_dir" \
    about:blank >"$browser_stdout" 2>"$browser_log" &
  browser_pid="$!"

  local deadline=$((SECONDS + READY_TIMEOUT_SECONDS))
  until curl -sSf "http://127.0.0.1:${debugging_port}/json" >/dev/null 2>&1; do
    if ! kill -0 "$browser_pid" >/dev/null 2>&1; then
      printf '\n[comtrya] headless browser exited before DevTools became ready: %s\n' "$browser_bin" >&2
      printf '[comtrya] browser log:\n' >&2
      sed -n '1,180p' "$browser_log" >&2 || true
      fail "headless browser did not start"
    fi
    if ((SECONDS >= deadline)); then
      kill "$browser_pid" >/dev/null 2>&1 || true
      wait "$browser_pid" >/dev/null 2>&1 || true
      fail "headless browser DevTools did not become ready"
    fi
    sleep 0.25
  done

  if ! "$BUN" --eval '
const fs = require("fs");
const [port, pageUrl, graphqlFile, outputFile] = process.argv.slice(1);
const graphql = JSON.parse(fs.readFileSync(graphqlFile, "utf8")).data;

const expected = {
  filePath: graphql.repository.files[0]?.path,
  diffPath: graphql.repository.diff?.path,
  treeEntries: `${graphql.repository.treeEntries.length} tree entries`,
  pullTitle: graphql.repository.pullRequests[0]?.title,
  checkName: graphql.repository.checks[0]?.name,
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function pageTarget() {
  for (const _ of Array.from({ length: 80 })) {
    const targets = await fetch(`http://127.0.0.1:${port}/json`).then((response) =>
      response.json(),
    );
    const target = targets.find((candidate) => candidate.type === "page");
    if (target?.webSocketDebuggerUrl) {
      return target;
    }
    await sleep(250);
  }
  throw new Error("Chrome DevTools did not expose a page target");
}

async function connect(target) {
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  const pending = new Map();
  let nextId = 1;
  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (!message.id || !pending.has(message.id)) {
      return;
    }
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) {
      reject(new Error(message.error.message ?? JSON.stringify(message.error)));
    } else {
      resolve(message.result);
    }
  };
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = () => reject(new Error("Chrome DevTools websocket failed"));
  });
  return {
    send(method, params = {}) {
      const id = nextId++;
      ws.send(JSON.stringify({ id, method, params }));
      return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
    },
    close() {
      ws.close();
    },
  };
}

function collectExpression() {
  return `(() => {
    const surfaces = {};
    for (const name of [
      "extension-surface-code-browser",
      "extension-surface-pull-requests",
      "extension-surface-checks",
    ]) {
      const element = document.querySelector("[data-smoke=\\\"" + name + "\\\"]");
      surfaces[name] = {
        rendered: element?.dataset.extensionRendered ?? null,
        text: element?.innerText || element?.textContent || "",
      };
    }
    return {
      mountedSlots: document.querySelector("#extension-slots")?.dataset.mountedSlots ?? null,
      extensionIssues: document.querySelector("#extension-slots")?.dataset.extensionIssues ?? null,
      hosts: Array.from(document.querySelectorAll("comtrya-extension-host")).map((host) => ({
        slot: host.dataset.extensionSlot ?? null,
        extension: host.dataset.extensionId ?? null,
      })),
      surfaces,
      extensionPill: document.querySelector("#extension-pill")?.textContent ?? "",
      readyPill: document.querySelector("#ready-pill")?.textContent ?? "",
    };
  })()`;
}

function evidenceIsReady(evidence) {
  const slots = new Set(evidence.hosts.map((host) => host.slot));
  return (
    evidence.mountedSlots === "3" &&
    evidence.extensionIssues === "0" &&
    slots.has("repository.code") &&
    slots.has("repository.overview") &&
    slots.has("repository.checks") &&
    evidence.surfaces["extension-surface-code-browser"]?.rendered === "non-empty" &&
    evidence.surfaces["extension-surface-pull-requests"]?.rendered === "non-empty" &&
    evidence.surfaces["extension-surface-checks"]?.rendered === "non-empty" &&
    evidence.surfaces["extension-surface-code-browser"]?.text.includes(expected.filePath) &&
    evidence.surfaces["extension-surface-code-browser"]?.text.includes(expected.diffPath) &&
    evidence.surfaces["extension-surface-code-browser"]?.text.includes(expected.treeEntries) &&
    evidence.surfaces["extension-surface-pull-requests"]?.text.includes(expected.pullTitle) &&
    evidence.surfaces["extension-surface-checks"]?.text.includes(expected.checkName)
  );
}

const target = await pageTarget();
const cdp = await connect(target);
try {
  await cdp.send("Runtime.enable");
  await cdp.send("Page.enable");
  await cdp.send("Page.navigate", { url: pageUrl });

  let lastEvidence = {};
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    const result = await cdp.send("Runtime.evaluate", {
      expression: collectExpression(),
      returnByValue: true,
    });
    if (result.exceptionDetails) {
      const detail =
        result.exceptionDetails.exception?.description ??
        result.exceptionDetails.text ??
        "DOM collection threw";
      fs.writeFileSync(
        outputFile,
        JSON.stringify({ exception: detail, exceptionDetails: result.exceptionDetails }, null, 2),
      );
      throw new Error(detail);
    }
    lastEvidence = result.result?.value ?? {};
    if (evidenceIsReady(lastEvidence)) {
      fs.writeFileSync(outputFile, JSON.stringify(lastEvidence, null, 2));
      process.exit(0);
    }
    await sleep(250);
  }
  fs.writeFileSync(outputFile, JSON.stringify(lastEvidence, null, 2));
  throw new Error("mounted extension surfaces did not become ready");
} finally {
  cdp.close();
}
' "$debugging_port" "$FRONTEND_URL/" "$graphql_file" "$evidence_file"; then
    kill "$browser_pid" >/dev/null 2>&1 || true
    wait "$browser_pid" >/dev/null 2>&1 || true
    printf '\n[comtrya] headless browser host-path smoke failed with %s\n' "$browser_bin" >&2
    printf '[comtrya] browser evidence:\n' >&2
    sed -n '1,220p' "$evidence_file" >&2 || true
    printf '[comtrya] browser log:\n' >&2
    sed -n '1,180p' "$browser_log" >&2 || true
    exit 1
  fi

  kill "$browser_pid" >/dev/null 2>&1 || true
  wait "$browser_pid" >/dev/null 2>&1 || true

  log "ok - browser host path mounted non-empty extension surfaces"
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
      export COMTRYA_ONESHOT=1
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

if [[ "${COMTRYA_ONESHOT:-0}" == "1" && -z "${COMTRYA_SESSION_TTL_SECONDS+x}" ]]; then
  export COMTRYA_SESSION_TTL_SECONDS=2
fi

CONFIG="${COMTRYA_CONFIG:-config/production-testbed.cue}"
DATA_DIR="${COMTRYA_DATA_DIR:-/private/tmp/comtrya-production-testbed}"
DEMO_FIXTURE="${COMTRYA_DEMO_FIXTURE:-fixtures/demo/conference.json}"
RESET_DEMO_DATA="${COMTRYA_RESET_DEMO_DATA:-0}"
BACKEND_LISTEN="${COMTRYA_LISTEN:-127.0.0.1:8080}"
BACKEND_URL="${COMTRYA_SERVER_URL:-http://${BACKEND_LISTEN}}"
FRONTEND_LISTEN="${COMTRYA_FRONTEND_LISTEN:-127.0.0.1:4321}"
FRONTEND_HOST="${FRONTEND_LISTEN%:*}"
FRONTEND_PORT="${FRONTEND_LISTEN##*:}"
FRONTEND_URL="${COMTRYA_FRONTEND_URL:-http://${FRONTEND_LISTEN}}"
READY_TIMEOUT_SECONDS="${COMTRYA_READY_TIMEOUT_SECONDS:-30}"
ONESHOT="${COMTRYA_ONESHOT:-0}"
OPERATOR_CODE="${COMTRYA_OPERATOR_CODE:-}"
SESSION_TTL_SECONDS="${COMTRYA_SESSION_TTL_SECONDS:-300}"
BUN="${BUN:-$(command -v bun || true)}"
if [[ -z "$BUN" && -x "$HOME/.bun/bin/bun" ]]; then
  BUN="$HOME/.bun/bin/bun"
fi

if [[ "$REQUEST_RESET" == "1" ]]; then
  RESET_DEMO_DATA=1
fi

if [[ -z "$OPERATOR_CODE" ]]; then
  fail "COMTRYA_OPERATOR_CODE is required. Put a seeded operator code in .envrc or export it before running start.sh."
fi

if [[ "$DATA_DIR" != /* ]]; then
  fail "COMTRYA_DATA_DIR must be absolute in production-testbed mode: $DATA_DIR"
fi
if ! [[ "$SESSION_TTL_SECONDS" =~ ^[0-9]+$ ]]; then
  fail "COMTRYA_SESSION_TTL_SECONDS must be an integer number of seconds: $SESSION_TTL_SECONDS"
fi

require_command cargo
require_command curl
require_command git
[[ -x "$BUN" ]] || fail "missing Bun executable: $BUN"

export COMTRYA_CONFIG="$CONFIG"
export COMTRYA_DATA_DIR="$DATA_DIR"
export COMTRYA_EXTERNAL_DEMO="${COMTRYA_EXTERNAL_DEMO:-0}"
export COMTRYA_EXTENSION_DIR="${COMTRYA_EXTENSION_DIR:-$ROOT_DIR/extensions/first-party}"
export COMTRYA_TLS_TERMINATED=true
export COMTRYA_OPERATOR_CODE="$OPERATOR_CODE"
export COMTRYA_LISTEN="$BACKEND_LISTEN"
export COMTRYA_SERVER_URL="$BACKEND_URL"
export COMTRYA_SESSION_TTL_SECONDS="$SESSION_TTL_SECONDS"
export PUBLIC_COMTRYA_OPERATOR_CODE="${PUBLIC_COMTRYA_OPERATOR_CODE:-$OPERATOR_CODE}"

if [[ ! -f "$DEMO_FIXTURE" ]]; then
  fail "demo fixture not found: $DEMO_FIXTURE"
fi

mkdir -p "$DATA_DIR/metadata"
DEMO_STATE="$DATA_DIR/metadata/demo-state.json"
if [[ "$RESET_DEMO_DATA" == "1" || ! -f "$DEMO_STATE" ]]; then
  cp "$DEMO_FIXTURE" "$DEMO_STATE"
  reset_generated_path "$DATA_DIR/repositories/comtrya/comtrya.git"
  reset_generated_path "$DATA_DIR/metadata/demo-repository-workdir"
  reset_generated_path "$DATA_DIR/extensions/storage"
  log "seeded demo state: $DEMO_STATE"
fi

TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/comtrya-start.XXXXXX")"
SERVER_LOG="${COMTRYA_SERVER_LOG:-$DATA_DIR/server.log}"
FRONTEND_LOG="${COMTRYA_FRONTEND_LOG:-$DATA_DIR/frontend.log}"

TARGET_DIR="${CARGO_TARGET_DIR:-target}"
if [[ "$TARGET_DIR" == /* ]]; then
  SERVER_BIN="$TARGET_DIR/debug/comtrya-server"
else
  SERVER_BIN="$ROOT_DIR/$TARGET_DIR/debug/comtrya-server"
fi

log "building comtrya-server"
cargo build -p comtrya-server

log "building Astro frontend"
(cd frontend && "$BUN" run build)

log "checking production-testbed startup gates"
"$SERVER_BIN" --check

log "starting Rust server at $BACKEND_URL"
log "starting Astro frontend at $FRONTEND_URL"
log "data dir: $DATA_DIR"
log "session ttl: ${SESSION_TTL_SECONDS}s"
log "server log: $SERVER_LOG"
log "frontend log: $FRONTEND_LOG"
"$SERVER_BIN" >"$SERVER_LOG" 2>&1 &
SERVER_PID="$!"

wait_for_url "server readyz" "$BACKEND_URL/readyz" 200

(
  cd frontend
  COMTRYA_SERVER_URL="$BACKEND_URL" \
    PUBLIC_COMTRYA_OPERATOR_CODE="$PUBLIC_COMTRYA_OPERATOR_CODE" \
    "$BUN" run preview -- --host "$FRONTEND_HOST" --port "$FRONTEND_PORT"
) >"$FRONTEND_LOG" 2>&1 &
FRONTEND_PID="$!"

wait_for_url "frontend shell" "$FRONTEND_URL/" 200

expect_status "frontend shell" 200 "$TMP_DIR/frontend.html" \
  "$FRONTEND_URL/"
expect_contains "frontend shell" "$TMP_DIR/frontend.html" "Comtrya"
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
  --data "{\"grantType\":\"urn:comtrya:grant:operator-code\",\"subjectToken\":\"$OPERATOR_CODE\",\"subjectTokenType\":\"urn:comtrya:token-type:operator-code\",\"requestedResource\":\"comtrya://repository/repo_01HV0K4XAVE2H6R5M8KJZ8Q1A3\",\"requestedActions\":[\"graphql:read\",\"graphql:write\",\"events:read\",\"git:read\",\"checks:read\"]}" \
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
  'json.data.repository.path === "comtrya/comtrya" && typeof json.data.repository.headOid === "string" && json.data.repository.refs.length > 0 && json.data.repository.commits.length > 0 && json.data.repository.treeEntries.length > 0 && json.data.repository.blobs.length > 0'
json_assert "GraphQL storage data through Astro" "$TMP_DIR/graphql.json" \
  'json.data.workspace.name === "Comtrya Labs" && json.data.repository.pullRequests.length > 0 && json.data.repository.checks.length > 0 && json.data.extensionInstallations.length === 3 && json.data.activityEvents.length > 0'
json_assert "GraphQL typed resolver data through Astro" "$TMP_DIR/graphql.json" \
  'json.data.extensionResolvers.length === 3 && json.data.extensionResolvers.every((resolver) => resolver.status === "executed" && !Object.prototype.hasOwnProperty.call(resolver, "result")) && json.data.extensionResolvers.some((resolver) => resolver.id === "ext_code_browser" && resolver.outputType === "comtrya.code-browser/summary.v1" && resolver.output.methods.includes("repository_refs") && resolver.output.blobPreviews === json.data.repository.blobs.length)'
json_assert "GraphQL demo convenience aggregate through Astro" "$TMP_DIR/graphql.json" \
  'json.data.demo.repository.headOid === json.data.repository.headOid'
GRAPHQL_HEAD_OID="$(json_value "$TMP_DIR/graphql.json" 'json.data.repository.headOid')"
if [[ -z "$GRAPHQL_HEAD_OID" ]]; then
  fail "GraphQL did not return repository.headOid"
fi
GRAPHQL_BRANCHES="$(json_value "$TMP_DIR/graphql.json" 'json.data.repository.branches.map((branch) => branch.name).join(", ")')"
GRAPHQL_EXTENSIONS="$(json_value "$TMP_DIR/graphql.json" 'json.data.extensionInstallations.map((extension) => extension.id).join(", ")')"
log "seeded repository path: $DATA_DIR/repositories/comtrya/comtrya.git"
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
expect_contains "event stream through Astro" "$TMP_DIR/events.json" 'dev.comtrya.instance.started'
expect_status "event session reuse fails closed through Astro" 401 "$TMP_DIR/events-reuse.json" \
  "$FRONTEND_URL/events?session=$EVENT_SESSION"
json_assert "event session reuse fails closed through Astro" "$TMP_DIR/events-reuse.json" \
  'json.errors[0].extensions.code === "UNAUTHENTICATED"'

if (( SESSION_TTL_SECONDS <= 5 )); then
  expect_status "short-lived event session through Astro" 200 "$TMP_DIR/events-expiring-session.json" \
    -X POST \
    -H "origin: $FRONTEND_URL" \
    -H "sec-fetch-site: same-origin" \
    -H "authorization: Bearer $ACCESS_TOKEN" \
    -H "content-type: application/json" \
    --data '{}' \
    "$FRONTEND_URL/events/session"
  EXPIRING_EVENT_SESSION="$(extract_json_string session "$TMP_DIR/events-expiring-session.json")"
  if [[ -z "$EXPIRING_EVENT_SESSION" ]]; then
    fail "short-lived event session request did not return session"
  fi
  sleep "$((SESSION_TTL_SECONDS + 1))"
  expect_status "expired event session fails closed through Astro" 401 "$TMP_DIR/events-expired.json" \
    "$FRONTEND_URL/events?session=$EXPIRING_EVENT_SESSION"
  json_assert "expired event session fails closed through Astro" "$TMP_DIR/events-expired.json" \
    'json.errors[0].extensions.code === "UNAUTHENTICATED" && json.errors[0].message.includes("expired")'
else
  log "skipping expired session smoke because session ttl is ${SESSION_TTL_SECONDS}s"
fi

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
  expect_contains "extension ${extension_id} manifest through Astro" "$TMP_DIR/${extension_id}-manifest.json" '"schemaVersion": "comtrya.ui-extension/v1"'
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

assert_extension_browser_surfaces_render \
  "$TMP_DIR/frontend-browser-evidence.json" \
  "$TMP_DIR/frontend-browser.log" \
  "$TMP_DIR/graphql.json"

expect_status "Git upload-pack without token fails closed through Astro" 401 "$TMP_DIR/git-no-token.json" \
  "$FRONTEND_URL/git/comtrya/comtrya.git/info/refs?service=git-upload-pack"
json_assert "Git upload-pack without token fails closed through Astro" "$TMP_DIR/git-no-token.json" \
  'json.errors[0].extensions.code === "UNAUTHENTICATED"'

expect_status "Git upload-pack with wrong token fails closed through Astro" 401 "$TMP_DIR/git-wrong-token.json" \
  -H "authorization: Bearer wrong-token" \
  "$FRONTEND_URL/git/comtrya/comtrya.git/info/refs?service=git-upload-pack"
json_assert "Git upload-pack with wrong token fails closed through Astro" "$TMP_DIR/git-wrong-token.json" \
  'json.errors[0].extensions.code === "UNAUTHENTICATED"'

expect_status "operator code exchange for non-Git credential" 200 "$TMP_DIR/no-git-token.json" \
  -H "content-type: application/json" \
  --data "{\"grantType\":\"urn:comtrya:grant:operator-code\",\"subjectToken\":\"$OPERATOR_CODE\",\"subjectTokenType\":\"urn:comtrya:token-type:operator-code\",\"requestedResource\":\"comtrya://repository/repo_01HV0K4XAVE2H6R5M8KJZ8Q1A3\",\"requestedActions\":[\"graphql:read\"]}" \
  "$FRONTEND_URL/auth/token-exchange"
NO_GIT_TOKEN="$(extract_json_string accessToken "$TMP_DIR/no-git-token.json")"
if [[ -z "$NO_GIT_TOKEN" ]]; then
  fail "non-Git credential exchange did not return accessToken"
fi
expect_status "Git upload-pack without git read scope fails closed through Astro" 403 "$TMP_DIR/git-no-read-scope.json" \
  -H "authorization: Bearer $NO_GIT_TOKEN" \
  "$FRONTEND_URL/git/comtrya/comtrya.git/info/refs?service=git-upload-pack"
json_assert "Git upload-pack without git read scope fails closed through Astro" "$TMP_DIR/git-no-read-scope.json" \
  'json.errors[0].extensions.code === "FORBIDDEN"'

log "checking seeded Git refs through Astro"
git -c "http.extraHeader=Authorization: Bearer $ACCESS_TOKEN" \
  ls-remote "$FRONTEND_URL/git/comtrya/comtrya.git" \
  >"$TMP_DIR/git-ls-remote.log" 2>&1 || {
  sed -n '1,160p' "$TMP_DIR/git-ls-remote.log" >&2 || true
  fail "git ls-remote through Astro failed"
}
if ! grep -Fq "${GRAPHQL_HEAD_OID}"$'\t'"refs/heads/main" "$TMP_DIR/git-ls-remote.log"; then
  printf '[comtrya] git ls-remote output did not match GraphQL headOid %s\n' "$GRAPHQL_HEAD_OID" >&2
  sed -n '1,120p' "$TMP_DIR/git-ls-remote.log" >&2 || true
  exit 1
fi

log "cloning seeded Git repository through Astro"
GIT_SMOKE_CLONE="$TMP_DIR/comtrya-clone"
git -c "http.extraHeader=Authorization: Bearer $ACCESS_TOKEN" \
  clone "$FRONTEND_URL/git/comtrya/comtrya.git" "$GIT_SMOKE_CLONE" \
  >"$TMP_DIR/git-clone.log" 2>&1 || {
  sed -n '1,200p' "$TMP_DIR/git-clone.log" >&2 || true
  fail "git clone through Astro failed"
}
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
  printf '[comtrya] GraphQL diff patch did not match git diff HEAD~1 HEAD\n' >&2
  diff -u "$TMP_DIR/git-diff.patch" "$TMP_DIR/graphql-diff.patch" >&2 || true
  exit 1
fi
git -C "$GIT_SMOKE_CLONE" \
  -c "http.extraHeader=Authorization: Bearer $ACCESS_TOKEN" \
  fetch origin main \
  >"$TMP_DIR/git-fetch.log" 2>&1 || {
  sed -n '1,200p' "$TMP_DIR/git-fetch.log" >&2 || true
  fail "git fetch through Astro failed"
}
git -C "$GIT_SMOKE_CLONE" \
  -c "http.extraHeader=Authorization: Bearer $ACCESS_TOKEN" \
  fetch origin refs/heads/ui/repository-intelligence:refs/remotes/origin/ui/repository-intelligence \
  >"$TMP_DIR/git-fetch-branch.log" 2>&1 || {
  sed -n '1,200p' "$TMP_DIR/git-fetch-branch.log" >&2 || true
  fail "git branch-specific fetch through Astro failed"
}
git -C "$GIT_SMOKE_CLONE" rev-parse refs/remotes/origin/ui/repository-intelligence \
  >"$TMP_DIR/git-fetch-branch-rev.log" || fail "branch-specific fetch did not create remote ref"
log "ok - Git clone/fetch through Astro"

expect_status "Git receive-pack fails closed through Astro" 501 "$TMP_DIR/git-receive-pack.json" \
  -H "authorization: Bearer $ACCESS_TOKEN" \
  "$FRONTEND_URL/git/comtrya/comtrya.git/info/refs?service=git-receive-pack"
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
