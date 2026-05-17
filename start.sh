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

Environment:
  COMTRYA_BROWSER_SMOKE=1  Run the headless browser extension smoke in interactive mode.
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
    COMTRYA_BROWSER_SMOKE
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

write_issue_storage_snapshot() {
  local issue_id="$1"
  local output_file="$2"

  "$BUN" --eval '
const fs = require("fs");
const [documentsFile, issueId, outputFile] = process.argv.slice(1);
let found = null;
for (const line of fs.readFileSync(documentsFile, "utf8").split(/\n/)) {
  if (!line.trim()) continue;
  const record = JSON.parse(line);
  if (record.collection === "issues" && record.id === issueId) {
    found = record;
  }
}
if (!found) {
  console.error(`[comtrya] issue storage record not found: ${issueId}`);
  process.exit(1);
}
fs.writeFileSync(outputFile, JSON.stringify(found, null, 2));
' "$DATA_DIR/extensions/storage/documents.jsonl" "$issue_id" "$output_file"
}

write_issue_closed_wasm_event() {
  local issue_id="$1"
  local output_file="$2"

  "$BUN" --eval '
const fs = require("fs");
const [eventsFile, issueId, outputFile] = process.argv.slice(1);
let found = null;
for (const line of fs.readFileSync(eventsFile, "utf8").split(/\n/)) {
  if (!line.trim()) continue;
  const record = JSON.parse(line);
  if (record.data?.eventType !== "dev.comtrya.issues.closed") continue;
  let decodedPayload = null;
  try {
    decodedPayload = JSON.parse(Buffer.from(record.data.payloadB64 ?? "", "base64").toString("utf8"));
  } catch {
    decodedPayload = null;
  }
  if (decodedPayload?.id === issueId) {
    found = { ...record, decodedPayload };
  }
}
if (!found) {
  console.error(`[comtrya] WASM close event not found for issue: ${issueId}`);
  process.exit(1);
}
fs.writeFileSync(outputFile, JSON.stringify(found, null, 2));
' "$DATA_DIR/extensions/storage/events.jsonl" "$issue_id" "$output_file"
}

assert_v3_cutover_static_smoke() {
  local wat_hit
  wat_hit="$(find "$ROOT_DIR/extensions/first-party" -name '*.wat' -print -quit)"
  if [[ -n "$wat_hit" ]]; then
    fail "first-party extension still ships component WAT stub: $wat_hit"
  fi

  if rg -n 'matches_op\(' "$ROOT_DIR/crates/server/src/main.rs" >"$TMP_DIR/matches-op.txt"; then
    printf '[comtrya] matches_op residue:\n' >&2
    sed -n '1,80p' "$TMP_DIR/matches-op.txt" >&2 || true
    fail "obsolete matches_op handler routing still exists"
  fi

  if ! "$BUN" --eval '
const fs = require("fs");
const path = require("path");
const [rootDir] = process.argv.slice(1);
const extRoot = path.join(rootDir, "extensions", "first-party");
const ids = fs
  .readdirSync(extRoot)
  .filter((name) => fs.statSync(path.join(extRoot, name)).isDirectory())
  .sort();
if (ids.length === 0) {
  throw new Error("no first-party extensions found");
}
for (const id of ids) {
  const root = path.join(extRoot, id);
  const manifestPath = path.join(root, "manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  if (manifest.platformWitVersion !== "0.1.0") {
    throw new Error(`${id} platformWitVersion is ${JSON.stringify(manifest.platformWitVersion)}`);
  }
  const expectedComponent = `dist/${id}.wasm`;
  if (manifest.wasmComponent !== expectedComponent) {
    throw new Error(`${id} wasmComponent is ${JSON.stringify(manifest.wasmComponent)}, expected ${expectedComponent}`);
  }
  const cargoToml = path.join(root, "component", "Cargo.toml");
  if (!fs.existsSync(cargoToml)) {
    throw new Error(`${id} is missing component/Cargo.toml`);
  }
  const wasmPath = path.join(root, "dist", `${id}.wasm`);
  if (!fs.existsSync(wasmPath)) {
    throw new Error(`${id} is missing ${path.relative(rootDir, wasmPath)}`);
  }
  const wasm = fs.readFileSync(wasmPath);
  if (wasm.length < 8 || wasm.subarray(0, 4).toString("binary") !== "\0asm") {
    throw new Error(`${id} dist artifact is not a real wasm module`);
  }
}
' "$ROOT_DIR"; then
    fail "first-party extension static cutover checks failed"
  fi

  log "ok - v3 static cutover checks (no WAT, no matches_op, real platform WASM)"
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
  local repo_path="$3"
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
const [port, pageUrl, outputFile] = process.argv.slice(1);

// Widgets that must mount somewhere on the repo dashboard. Their default
// slot is irrelevant to the smoke — under the hybrid model the user can
// move any widget to any slot. We only require that each widget renders.
const expectedWidgets = [
  { tagName: "comtrya-repository-summary", label: "Repository",            origin: "core" },
  { tagName: "comtrya-core-code-browser",  label: "Code · ",               origin: "core" },
  { tagName: "comtrya-issues-list",        label: "Issues",                origin: "extension" },
  { tagName: "comtrya-pulls-overview",     label: "Repo · pulls overview", origin: "extension" },
  { tagName: "comtrya-checks-board",       label: "Checks board",          origin: "extension" },
];

const expectedSlots = ["repository.main", "repository.sidebar"];

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

const COLLECT_EXPRESSION = `(() => {
  const slots = {};
  for (const slot of ["repository.main", "repository.sidebar"]) {
    const mount = document.querySelector("[data-extension-slot-mount=\\\"" + slot + "\\\"]");
    if (!mount) {
      slots[slot] = { mounted: false };
      continue;
    }
    slots[slot] = {
      mounted: true,
      children: Array.from(mount.children).map((child) => child.tagName.toLowerCase()),
      text: (mount.innerText || mount.textContent || "").trim(),
    };
  }
  const widgetTags = Array.from(
    document.querySelectorAll("[data-extension-slot-mount] *")
  ).map((node) => node.tagName.toLowerCase());
  const dashboardText = (
    document.querySelector("[data-smoke=\\\"repo-dashboard\\\"]")?.parentElement?.innerText ||
    document.body?.innerText ||
    ""
  ).trim();
  return {
    headings: Array.from(document.querySelectorAll("h1, h2")).map((heading) => heading.textContent?.trim()),
    pageHeadSmoke: document.querySelector("[data-smoke=\\\"repo-dashboard\\\"]") ? "present" : null,
    slots,
    widgetTags,
    dashboardText,
  };
})()`;

function evidenceIsReady(evidence) {
  if (evidence.pageHeadSmoke !== "present") return false;
  if (!evidence.headings?.includes("comtrya/comtrya")) return false;
  // Both generic slots must mount (even if empty until widgets resolve).
  for (const slot of expectedSlots) {
    const got = evidence.slots?.[slot];
    if (!got?.mounted) return false;
  }
  // Each expected widget must render somewhere inside the dashboard.
  for (const expected of expectedWidgets) {
    if (!evidence.widgetTags?.includes(expected.tagName)) return false;
    if (expected.label && !evidence.dashboardText?.includes(expected.label)) return false;
  }
  return true;
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
      expression: COLLECT_EXPRESSION,
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
  throw new Error("repo dashboard extension slots did not become ready");
} finally {
  cdp.close();
}
' "$debugging_port" "$FRONTEND_URL/r/$repo_path" "$evidence_file"; then
    kill "$browser_pid" >/dev/null 2>&1 || true
    wait "$browser_pid" >/dev/null 2>&1 || true
    printf '\n[comtrya] headless browser repo-dashboard smoke failed with %s\n' "$browser_bin" >&2
    printf '[comtrya] browser evidence:\n' >&2
    sed -n '1,220p' "$evidence_file" >&2 || true
    printf '[comtrya] browser log:\n' >&2
    sed -n '1,180p' "$browser_log" >&2 || true
    exit 1
  fi

  kill "$browser_pid" >/dev/null 2>&1 || true
  wait "$browser_pid" >/dev/null 2>&1 || true

  log "ok - browser repo dashboard mounted core + extension widgets into repository.main / repository.sidebar"
}

assert_issue_close_browser_smoke() {
  local issue_id="$1"
  local workspace_id="$2"
  local issue_number="$3"
  local evidence_file="$4"
  local browser_log="$5"
  local before_file="$TMP_DIR/issue-close-browser-before.json"
  local after_file="$TMP_DIR/issue-close-browser-after.json"
  local event_file="$TMP_DIR/issue-close-browser-event.json"

  write_issue_storage_snapshot "$issue_id" "$before_file"
  json_assert "browser close issue starts open" "$before_file" \
    'json.data.state === "open" && (json.data.closedAt === null || json.data.closedAt === undefined)'

  local browser_bin
  browser_bin="$(find_headless_browser)" || fail "issue close browser smoke requires Chrome/Chromium or COMTRYA_BROWSER_BIN"

  local profile_dir="$TMP_DIR/headless-issue-close-profile"
  local browser_stdout="$TMP_DIR/headless-issue-close.stdout"
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
const [port, pageUrl, issueId, outputFile] = process.argv.slice(1);

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

const collectExpression = `(() => {
  const main = document.querySelector("[data-smoke=\\"issue-detail-main\\"]");
  const buttons = Array.from(document.querySelectorAll("button")).map((button) => ({
    text: (button.textContent || "").trim(),
    disabled: button.disabled,
  }));
  return {
    url: location.href,
    ready: Boolean(main),
    issueId: main?.dataset.issueId ?? null,
    text: (main?.innerText || document.body.innerText || "").trim(),
    buttons,
    closeVisible: buttons.some((button) => button.text === "Close issue" && !button.disabled),
    reopenVisible: buttons.some((button) => button.text === "Reopen issue"),
  };
})()`;

async function collect(cdp) {
  const result = await cdp.send("Runtime.evaluate", {
    expression: collectExpression,
    returnByValue: true,
  });
  if (result.exceptionDetails) {
    const detail =
      result.exceptionDetails.exception?.description ??
      result.exceptionDetails.text ??
      "DOM collection threw";
    throw new Error(detail);
  }
  return result.result?.value ?? {};
}

async function waitFor(cdp, predicate, label) {
  let lastEvidence = {};
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    lastEvidence = await collect(cdp);
    if (predicate(lastEvidence)) {
      return lastEvidence;
    }
    await sleep(250);
  }
  fs.writeFileSync(outputFile, JSON.stringify({ label, lastEvidence }, null, 2));
  throw new Error(`${label} did not become ready`);
}

const clickExpression = `(() => {
  const button = Array.from(document.querySelectorAll("button")).find(
    (candidate) => (candidate.textContent || "").trim() === "Close issue",
  );
  if (!button) {
    throw new Error("Close issue button missing");
  }
  button.click();
  return true;
})()`;

const target = await pageTarget();
const cdp = await connect(target);
try {
  await cdp.send("Runtime.enable");
  await cdp.send("Page.enable");
  await cdp.send("Page.navigate", { url: pageUrl });

  const beforeClick = await waitFor(
    cdp,
    (evidence) => evidence.ready && evidence.issueId === issueId && evidence.closeVisible,
    "issue close button",
  );

  const clickResult = await cdp.send("Runtime.evaluate", {
    expression: clickExpression,
    returnByValue: true,
  });
  if (clickResult.exceptionDetails) {
    const detail =
      clickResult.exceptionDetails.exception?.description ??
      clickResult.exceptionDetails.text ??
      "close click threw";
    throw new Error(detail);
  }

  const afterClick = await waitFor(
    cdp,
    (evidence) =>
      evidence.ready &&
      evidence.issueId === issueId &&
      evidence.reopenVisible &&
      !evidence.closeVisible,
    "issue closed UI",
  );

  fs.writeFileSync(outputFile, JSON.stringify({ beforeClick, afterClick }, null, 2));
} finally {
  cdp.close();
}
' "$debugging_port" "$FRONTEND_URL/x/issues/$workspace_id/$issue_number" "$issue_id" "$evidence_file"; then
    kill "$browser_pid" >/dev/null 2>&1 || true
    wait "$browser_pid" >/dev/null 2>&1 || true
    printf '\n[comtrya] browser issue-close smoke failed with %s\n' "$browser_bin" >&2
    printf '[comtrya] browser evidence:\n' >&2
    sed -n '1,220p' "$evidence_file" >&2 || true
    printf '[comtrya] browser log:\n' >&2
    sed -n '1,180p' "$browser_log" >&2 || true
    exit 1
  fi

  kill "$browser_pid" >/dev/null 2>&1 || true
  wait "$browser_pid" >/dev/null 2>&1 || true

  write_issue_storage_snapshot "$issue_id" "$after_file"
  json_assert "browser close issue storage changed to closed" "$after_file" \
    'json.data.state === "closed" && json.data.stateReason === "completed" && typeof json.data.closedAt === "string" && json.version > 1'
  write_issue_closed_wasm_event "$issue_id" "$event_file"
  json_assert "browser close issue emitted ext_issues WASM event" "$event_file" \
    'json.data.emitterExtension === "ext_issues" && json.data.eventType === "dev.comtrya.issues.closed" && json.decodedPayload.id === json.data.sourceUri.split("/").pop()'

  log "ok - browser close issue fired ext_issues WASM close and updated storage"
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
BROWSER_SMOKE="${COMTRYA_BROWSER_SMOKE:-0}"
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
require_command rg
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
  reset_generated_path "$DATA_DIR/repositories"
  reset_generated_path "$DATA_DIR/metadata/demo-repository-workdir"
  reset_generated_path "$DATA_DIR/extensions/storage"
  log "seeded demo state: $DEMO_STATE"
fi

TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/comtrya-start.XXXXXX")"
SERVER_LOG="${COMTRYA_SERVER_LOG:-$DATA_DIR/server.log}"
FRONTEND_LOG="${COMTRYA_FRONTEND_LOG:-$DATA_DIR/frontend.log}"

assert_v3_cutover_static_smoke

TARGET_DIR="${CARGO_TARGET_DIR:-target}"
if [[ "$TARGET_DIR" == /* ]]; then
  SERVER_BIN="$TARGET_DIR/debug/comtrya-server"
else
  SERVER_BIN="$ROOT_DIR/$TARGET_DIR/debug/comtrya-server"
fi

free_port() {
  local addr="$1"
  local pids
  pids="$(lsof -t -nP -iTCP@"$addr" -sTCP:LISTEN 2>/dev/null || true)"
  if [[ -n "$pids" ]]; then
    log "killing leftover process on $addr: $pids"
    # shellcheck disable=SC2086
    kill -9 $pids 2>/dev/null || true
    sleep 0.5
  fi
}

free_port "$BACKEND_LISTEN"
free_port "$FRONTEND_LISTEN"

log "building comtrya-server"
cargo build -p comtrya-server

log "building Vue shell"
(cd frontend && "$BUN" run build)

log "checking production-testbed startup gates"
"$SERVER_BIN" --check

log "starting Rust server at $BACKEND_URL"
log "starting Vue shell at $FRONTEND_URL"
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
expect_contains "frontend shell HTML" "$TMP_DIR/frontend.html" "Comtrya Shell v3"
expect_contains "frontend shell HTML loads Vue assets" "$TMP_DIR/frontend.html" "/assets/index-"

expect_status "frontend readyz" 200 "$TMP_DIR/readyz.json" \
  "$FRONTEND_URL/readyz"
json_assert "frontend readyz" "$TMP_DIR/readyz.json" \
  'json.ready === true && json.mode === "production-testbed" && json.checks.extensionStorageSchema === true && json.checks.extensionStorageDocuments === true && json.checks.demoRepositoryRefs === true && json.unsupported.some((surface) => surface.id === "git_receive_pack")'

expect_status "unsupported OIDC callback fails explicitly through Vue shell" 501 "$TMP_DIR/oidc-callback.json" \
  "$FRONTEND_URL/auth/oidc/prod/callback"
json_assert "unsupported OIDC callback fails explicitly through Vue shell" "$TMP_DIR/oidc-callback.json" \
  'json.errors[0].extensions.code === "UNSUPPORTED" && json.errors[0].extensions.surface === "oidc_browser_callback"'

expect_status "operator code exchange through Vue shell" 200 "$TMP_DIR/token.json" \
  -H "content-type: application/json" \
  --data "{\"grantType\":\"urn:comtrya:grant:operator-code\",\"subjectToken\":\"$OPERATOR_CODE\",\"subjectTokenType\":\"urn:comtrya:token-type:operator-code\",\"requestedResource\":\"comtrya://repository/repo_01HV0K4XAVE2H6R5M8KJZ8Q1A3\",\"requestedActions\":[\"graphql:read\",\"graphql:write\",\"events:read\",\"git:read\",\"checks:read\"]}" \
  "$FRONTEND_URL/auth/token-exchange"

ACCESS_TOKEN="$(extract_json_string accessToken "$TMP_DIR/token.json")"
if [[ -z "$ACCESS_TOKEN" ]]; then
  fail "operator code exchange did not return accessToken"
fi

expect_status "GraphQL through Vue shell" 200 "$TMP_DIR/graphql.json" \
  -H "authorization: Bearer $ACCESS_TOKEN" \
  -H "content-type: application/json" \
  --data '{"query":"{ viewer { authenticated } instance { capabilities } workspace repository extensionInstallations }"}' \
  "$FRONTEND_URL/graphql"
json_assert "GraphQL viewer through Vue shell" "$TMP_DIR/graphql.json" \
  'json.data.viewer.authenticated === true && json.data.viewer.permissions.includes("git:read")'
json_assert "GraphQL Git data through Vue shell" "$TMP_DIR/graphql.json" \
  'json.data.repository.path === "comtrya/comtrya" && typeof json.data.repository.headOid === "string" && json.data.repository.refs.length > 0 && json.data.repository.commits.length > 0 && json.data.repository.treeEntries.length > 0 && json.data.repository.blobs.length > 0'
json_assert "GraphQL storage data through Vue shell" "$TMP_DIR/graphql.json" \
  'json.data.workspace.name === "Comtrya Labs" && json.data.repository.pullRequests.length > 0 && json.data.repository.checks.length > 0 && json.data.extensionInstallations.length === 5'
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

expect_status "event session through Vue shell" 200 "$TMP_DIR/events-session.json" \
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

expect_status "event stream through Vue shell" 200 "$TMP_DIR/events.json" \
  "$FRONTEND_URL/events?session=$EVENT_SESSION"
expect_contains "event stream through Vue shell" "$TMP_DIR/events.json" 'dev.comtrya.instance.started'
expect_status "event session reuse fails closed through Vue shell" 401 "$TMP_DIR/events-reuse.json" \
  "$FRONTEND_URL/events?session=$EVENT_SESSION"
json_assert "event session reuse fails closed through Vue shell" "$TMP_DIR/events-reuse.json" \
  'json.errors[0].extensions.code === "UNAUTHENTICATED"'

if (( SESSION_TTL_SECONDS <= 5 )); then
  expect_status "short-lived event session through Vue shell" 200 "$TMP_DIR/events-expiring-session.json" \
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
  sleep "$((SESSION_TTL_SECONDS + 2))"
  expect_status "expired event session fails closed through Vue shell" 401 "$TMP_DIR/events-expired.json" \
    "$FRONTEND_URL/events?session=$EXPIRING_EVENT_SESSION"
  json_assert "expired event session fails closed through Vue shell" "$TMP_DIR/events-expired.json" \
    'json.errors[0].extensions.code === "UNAUTHENTICATED" && json.errors[0].message.includes("expired")'
else
  log "skipping expired session smoke because session ttl is ${SESSION_TTL_SECONDS}s"
fi

for extension_id in ext_pull_requests ext_checks ext_issues ext_epics; do
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

  expect_status "extension ${extension_id} manifest through Vue shell" 200 "$TMP_DIR/${extension_id}-manifest.json" \
    "$FRONTEND_URL/_extensions/${extension_id}/manifest.json?session=$EXTENSION_SESSION"
  expect_contains "extension ${extension_id} manifest through Vue shell" "$TMP_DIR/${extension_id}-manifest.json" '"schemaVersion": "comtrya.ui-extension/v2"'
  # Manifest is identity, not behavior. Slot bindings, routes, and resource
  # cards are runtime registrations through the SDK — they must not appear
  # as declarative arrays in the manifest.
  json_assert "extension ${extension_id} manifest is identity-only" "$TMP_DIR/${extension_id}-manifest.json" \
    "json.id === \"$extension_id\" && typeof json.assets === \"object\" && Array.isArray(json.permissions) && !(json.contributes && (json.contributes.slots || json.contributes.routes || json.contributes.cards))"

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

  expect_status "extension ${extension_id} asset through Vue shell" 200 "$TMP_DIR/${extension_id}-asset.js" \
    "$FRONTEND_URL/_extensions/${extension_id}/assets/index.js?session=$EXTENSION_ASSET_SESSION"
  expect_contains "extension ${extension_id} asset through Vue shell" "$TMP_DIR/${extension_id}-asset.js" 'customElements.define'
done

if [[ "$ONESHOT" == "1" || "$BROWSER_SMOKE" == "1" ]]; then
  assert_extension_browser_surfaces_render \
    "$TMP_DIR/frontend-browser-evidence.json" \
    "$TMP_DIR/frontend-browser.log" \
    "comtrya/comtrya"
else
  log "skipping browser repo dashboard smoke in interactive mode; set COMTRYA_BROWSER_SMOKE=1 or pass --oneshot to require it"
fi

expect_status "Git upload-pack without token fails closed through Vue shell" 401 "$TMP_DIR/git-no-token.json" \
  "$FRONTEND_URL/git/comtrya/comtrya.git/info/refs?service=git-upload-pack"
json_assert "Git upload-pack without token fails closed through Vue shell" "$TMP_DIR/git-no-token.json" \
  'json.errors[0].extensions.code === "UNAUTHENTICATED"'

expect_status "Git upload-pack with wrong token fails closed through Vue shell" 401 "$TMP_DIR/git-wrong-token.json" \
  -H "authorization: Bearer wrong-token" \
  "$FRONTEND_URL/git/comtrya/comtrya.git/info/refs?service=git-upload-pack"
json_assert "Git upload-pack with wrong token fails closed through Vue shell" "$TMP_DIR/git-wrong-token.json" \
  'json.errors[0].extensions.code === "UNAUTHENTICATED"'

expect_status "operator code exchange for non-Git credential" 200 "$TMP_DIR/no-git-token.json" \
  -H "content-type: application/json" \
  --data "{\"grantType\":\"urn:comtrya:grant:operator-code\",\"subjectToken\":\"$OPERATOR_CODE\",\"subjectTokenType\":\"urn:comtrya:token-type:operator-code\",\"requestedResource\":\"comtrya://repository/repo_01HV0K4XAVE2H6R5M8KJZ8Q1A3\",\"requestedActions\":[\"graphql:read\"]}" \
  "$FRONTEND_URL/auth/token-exchange"
NO_GIT_TOKEN="$(extract_json_string accessToken "$TMP_DIR/no-git-token.json")"
if [[ -z "$NO_GIT_TOKEN" ]]; then
  fail "non-Git credential exchange did not return accessToken"
fi
expect_status "Git upload-pack without git read scope fails closed through Vue shell" 403 "$TMP_DIR/git-no-read-scope.json" \
  -H "authorization: Bearer $NO_GIT_TOKEN" \
  "$FRONTEND_URL/git/comtrya/comtrya.git/info/refs?service=git-upload-pack"
json_assert "Git upload-pack without git read scope fails closed through Vue shell" "$TMP_DIR/git-no-read-scope.json" \
  'json.errors[0].extensions.code === "FORBIDDEN"'

log "checking seeded Git refs through Vue shell"
git -c "http.extraHeader=Authorization: Bearer $ACCESS_TOKEN" \
  ls-remote "$FRONTEND_URL/git/comtrya/comtrya.git" \
  >"$TMP_DIR/git-ls-remote.log" 2>&1 || {
  sed -n '1,160p' "$TMP_DIR/git-ls-remote.log" >&2 || true
  fail "git ls-remote through Vue shell failed"
}
if ! grep -Fq "${GRAPHQL_HEAD_OID}"$'\t'"refs/heads/main" "$TMP_DIR/git-ls-remote.log"; then
  printf '[comtrya] git ls-remote output did not match GraphQL headOid %s\n' "$GRAPHQL_HEAD_OID" >&2
  sed -n '1,120p' "$TMP_DIR/git-ls-remote.log" >&2 || true
  exit 1
fi

log "cloning seeded Git repository through Vue shell"
GIT_SMOKE_CLONE="$TMP_DIR/comtrya-clone"
git -c "http.extraHeader=Authorization: Bearer $ACCESS_TOKEN" \
  clone "$FRONTEND_URL/git/comtrya/comtrya.git" "$GIT_SMOKE_CLONE" \
  >"$TMP_DIR/git-clone.log" 2>&1 || {
  sed -n '1,200p' "$TMP_DIR/git-clone.log" >&2 || true
  fail "git clone through Vue shell failed"
}
test -f "$GIT_SMOKE_CLONE/README.md" || fail "git clone did not fetch README.md"
CLONED_HEAD_OID="$(git -C "$GIT_SMOKE_CLONE" rev-parse HEAD)"
if [[ "$CLONED_HEAD_OID" != "$GRAPHQL_HEAD_OID" ]]; then
  fail "git clone HEAD $CLONED_HEAD_OID did not match GraphQL headOid $GRAPHQL_HEAD_OID"
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
  fail "git fetch through Vue shell failed"
}
git -C "$GIT_SMOKE_CLONE" \
  -c "http.extraHeader=Authorization: Bearer $ACCESS_TOKEN" \
  fetch origin refs/heads/ui/repository-intelligence:refs/remotes/origin/ui/repository-intelligence \
  >"$TMP_DIR/git-fetch-branch.log" 2>&1 || {
  sed -n '1,200p' "$TMP_DIR/git-fetch-branch.log" >&2 || true
  fail "git branch-specific fetch through Vue shell failed"
}
git -C "$GIT_SMOKE_CLONE" rev-parse refs/remotes/origin/ui/repository-intelligence \
  >"$TMP_DIR/git-fetch-branch-rev.log" || fail "branch-specific fetch did not create remote ref"
log "ok - Git clone/fetch through Vue shell"

expect_status "Git receive-pack fails closed through Vue shell" 501 "$TMP_DIR/git-receive-pack.json" \
  -H "authorization: Bearer $ACCESS_TOKEN" \
  "$FRONTEND_URL/git/comtrya/comtrya.git/info/refs?service=git-receive-pack"
json_assert "Git receive-pack fails closed through Vue shell" "$TMP_DIR/git-receive-pack.json" \
  'json.errors[0].extensions.code === "UNSUPPORTED" && json.errors[0].extensions.surface === "git_receive_pack" && json.errors[0].message.includes("receive-pack")'

expect_status "workspace homepage renders" 200 "$TMP_DIR/home.html" \
  "$FRONTEND_URL/"
expect_contains "workspace homepage serves Vue shell" "$TMP_DIR/home.html" \
  "Comtrya Shell v3"

REPO_STATUS="$(curl -sS -o "$TMP_DIR/repo-two-segment.html" -w '%{http_code}' "$FRONTEND_URL/r/comtrya/comtrya")" \
  || fail "repo route request failed"
if [[ "$REPO_STATUS" == "200" ]]; then
  expect_contains "/r/comtrya/comtrya serves Vue shell" "$TMP_DIR/repo-two-segment.html" \
    "Comtrya Shell v3"
  log "ok - /r/comtrya/comtrya returns 200 (seed two-segment)"
elif [[ "$REPO_STATUS" == "404" ]]; then
  expect_status "/r/comtrya resolves (single-segment fallback)" 200 "$TMP_DIR/repo-one-segment.html" \
    "$FRONTEND_URL/r/comtrya"
  expect_contains "/r/comtrya serves Vue shell" "$TMP_DIR/repo-one-segment.html" \
    "Comtrya Shell v3"
  log "ok - /r/comtrya returns 200 (single-segment)"
else
  fail "unexpected status from /r/comtrya/comtrya: $REPO_STATUS"
fi

expect_status "unknown repo path serves Vue fallback" 200 "$TMP_DIR/repo-unknown.html" \
  "$FRONTEND_URL/r/no-such-repo-anywhere"
expect_contains "unknown repo path serves Vue shell" "$TMP_DIR/repo-unknown.html" \
  "Comtrya Shell v3"

expect_status "/x/pulls/ mounts extension page" 200 "$TMP_DIR/ext-pulls.html" \
  "$FRONTEND_URL/x/pulls/"
expect_contains "/x/pulls/ serves Vue shell" "$TMP_DIR/ext-pulls.html" \
  "Comtrya Shell v3"

expect_status "/x/issues/ mounts extension page" 200 "$TMP_DIR/ext-issues.html" \
  "$FRONTEND_URL/x/issues/"
expect_contains "/x/issues/ serves Vue shell" "$TMP_DIR/ext-issues.html" \
  "Comtrya Shell v3"

expect_status "/x/epics/ mounts extension page" 200 "$TMP_DIR/ext-epics.html" \
  "$FRONTEND_URL/x/epics/"
expect_contains "/x/epics/ serves Vue shell" "$TMP_DIR/ext-epics.html" \
  "Comtrya Shell v3"

expect_status "unknown /x/ prefix serves Vue fallback" 200 "$TMP_DIR/ext-bogus.html" \
  "$FRONTEND_URL/x/bogus-not-installed/"
expect_contains "unknown /x/ prefix serves Vue shell" "$TMP_DIR/ext-bogus.html" \
  "Comtrya Shell v3"

expect_status "instance page renders" 200 "$TMP_DIR/instance.html" \
  "$FRONTEND_URL/instance"
expect_contains "/instance serves Vue shell" "$TMP_DIR/instance.html" \
  "Comtrya Shell v3"

expect_status "new-repo page renders" 200 "$TMP_DIR/new-repo.html" \
  "$FRONTEND_URL/new"
expect_contains "/new serves Vue shell" "$TMP_DIR/new-repo.html" \
  "Comtrya Shell v3"

NEW_REPO_PATH="rawkode/hello/rawkode"
expect_status "createRepository mutation through Vue shell" 200 "$TMP_DIR/create-repo.json" \
  -H "content-type: application/json" \
  --data "{\"query\":\"mutation(\$input: CreateRepositoryInput!) { createRepository(input: \$input) { repository { id path } } }\",\"variables\":{\"input\":{\"path\":\"$NEW_REPO_PATH\"}}}" \
  "$FRONTEND_URL/graphql"
json_assert "createRepository mutation returns nested-path repo" "$TMP_DIR/create-repo.json" \
  "json.data.createRepository.repository.path === \"$NEW_REPO_PATH\" && json.data.createRepository.repository.id.startsWith(\"repo_\")"

expect_status "newly-created nested repo path resolves" 200 "$TMP_DIR/new-repo-resolved.html" \
  "$FRONTEND_URL/r/$NEW_REPO_PATH"
expect_contains "newly-created nested repo path serves Vue shell" "$TMP_DIR/new-repo-resolved.html" \
  "Comtrya Shell v3"

expect_status "createRepository conflict on duplicate path" 409 "$TMP_DIR/create-repo-dup.json" \
  -H "content-type: application/json" \
  --data "{\"query\":\"mutation(\$input: CreateRepositoryInput!) { createRepository(input: \$input) { repository { id } } }\",\"variables\":{\"input\":{\"path\":\"$NEW_REPO_PATH\"}}}" \
  "$FRONTEND_URL/graphql"
json_assert "createRepository conflict carries CONFLICT code" "$TMP_DIR/create-repo-dup.json" \
  'json.errors[0].extensions.code === "CONFLICT"'

expect_status "createRepository rejects invalid path segment" 400 "$TMP_DIR/create-repo-bad.json" \
  -H "content-type: application/json" \
  --data '{"query":"mutation($input: CreateRepositoryInput!) { createRepository(input: $input) { repository { id } } }","variables":{"input":{"path":"Bad/Segment"}}}' \
  "$FRONTEND_URL/graphql"
json_assert "createRepository invalid-path carries BAD_USER_INPUT code" "$TMP_DIR/create-repo-bad.json" \
  'json.errors[0].extensions.code === "BAD_USER_INPUT"'

# ── Relations API ──────────────────────────────────────────────────────────
RELATION_FROM="comtrya://issue/iss_01HV0K4XAVE2H6R5M8KJZ8Q1B1"
RELATION_TO="comtrya://epic/epc_01HV0K4XAVE2H6R5M8KJZ8Q1B2"
expect_status "relations.create writes a relation" 200 "$TMP_DIR/rel-create.json" \
  -H "content-type: application/json" \
  --data "{\"query\":\"mutation(\$input: CreateRelationInput!) { relations.create(input: \$input) { id kind from to } }\",\"variables\":{\"input\":{\"from\":\"$RELATION_FROM\",\"to\":\"$RELATION_TO\",\"kind\":\"comtrya://rel/part-of\"}}}" \
  "$FRONTEND_URL/graphql"
json_assert "relations.create returns the relation with rel_ id" "$TMP_DIR/rel-create.json" \
  "json.data.relations.create.kind === \"comtrya://rel/part-of\" && json.data.relations.create.from === \"$RELATION_FROM\" && json.data.relations.create.to === \"$RELATION_TO\" && json.data.relations.create.id.startsWith(\"rel_\")"
RELATION_ID="$(json_value "$TMP_DIR/rel-create.json" 'json.data.relations.create.id')"

expect_status "relations.create is idempotent on (from,to,kind)" 200 "$TMP_DIR/rel-create-again.json" \
  -H "content-type: application/json" \
  --data "{\"query\":\"mutation(\$input: CreateRelationInput!) { relations.create(input: \$input) { id } }\",\"variables\":{\"input\":{\"from\":\"$RELATION_FROM\",\"to\":\"$RELATION_TO\",\"kind\":\"comtrya://rel/part-of\"}}}" \
  "$FRONTEND_URL/graphql"
json_assert "relations.create is idempotent" "$TMP_DIR/rel-create-again.json" \
  "json.data.relations.create.id === \"$RELATION_ID\""

expect_status "relations.outgoing returns the relation" 200 "$TMP_DIR/rel-outgoing.json" \
  -H "content-type: application/json" \
  --data "{\"query\":\"query(\$from: ResourceURN!) { relations.outgoing(from: \$from) { id to } }\",\"variables\":{\"from\":\"$RELATION_FROM\"}}" \
  "$FRONTEND_URL/graphql"
json_assert "relations.outgoing is non-empty" "$TMP_DIR/rel-outgoing.json" \
  "json.data.relations.outgoing.length === 1 && json.data.relations.outgoing[0].to === \"$RELATION_TO\""

expect_status "relations.incoming returns the relation" 200 "$TMP_DIR/rel-incoming.json" \
  -H "content-type: application/json" \
  --data "{\"query\":\"query(\$to: ResourceURN!) { relations.incoming(to: \$to) { id from } }\",\"variables\":{\"to\":\"$RELATION_TO\"}}" \
  "$FRONTEND_URL/graphql"
json_assert "relations.incoming is non-empty" "$TMP_DIR/rel-incoming.json" \
  "json.data.relations.incoming.length === 1 && json.data.relations.incoming[0].from === \"$RELATION_FROM\""

expect_status "relations.create rejects malformed verb URI" 400 "$TMP_DIR/rel-bad-verb.json" \
  -H "content-type: application/json" \
  --data "{\"query\":\"mutation(\$input: CreateRelationInput!) { relations.create(input: \$input) { id } }\",\"variables\":{\"input\":{\"from\":\"$RELATION_FROM\",\"to\":\"$RELATION_TO\",\"kind\":\"not-a-verb-uri\"}}}" \
  "$FRONTEND_URL/graphql"
json_assert "malformed verb is BAD_USER_INPUT" "$TMP_DIR/rel-bad-verb.json" \
  'json.errors[0].extensions.code === "BAD_USER_INPUT"'

expect_status "relations.create rejects self-link" 400 "$TMP_DIR/rel-self.json" \
  -H "content-type: application/json" \
  --data "{\"query\":\"mutation(\$input: CreateRelationInput!) { relations.create(input: \$input) { id } }\",\"variables\":{\"input\":{\"from\":\"$RELATION_FROM\",\"to\":\"$RELATION_FROM\",\"kind\":\"comtrya://rel/part-of\"}}}" \
  "$FRONTEND_URL/graphql"

SYM_LOW="comtrya://issue/iss_01HV0K4XAVE2H6R5M8KJZ8Q1A1"
SYM_HIGH="comtrya://issue/iss_01HV0K4XAVE2H6R5M8KJZ8Q1B9"
expect_status "relations.create symmetric verb stores canonical direction" 200 "$TMP_DIR/rel-sym.json" \
  -H "content-type: application/json" \
  --data "{\"query\":\"mutation(\$input: CreateRelationInput!) { relations.create(input: \$input) { id from to } }\",\"variables\":{\"input\":{\"from\":\"$SYM_HIGH\",\"to\":\"$SYM_LOW\",\"kind\":\"comtrya://rel/relates-to\"}}}" \
  "$FRONTEND_URL/graphql"
json_assert "symmetric verb canonicalised (lex-smaller as from)" "$TMP_DIR/rel-sym.json" \
  "json.data.relations.create.from === \"$SYM_LOW\" && json.data.relations.create.to === \"$SYM_HIGH\""

expect_status "outgoing for symmetric verb finds the relation from either side" 200 "$TMP_DIR/rel-sym-outgoing.json" \
  -H "content-type: application/json" \
  --data "{\"query\":\"query(\$from: ResourceURN!) { relations.outgoing(from: \$from, kind: \\\"comtrya://rel/relates-to\\\") { id } }\",\"variables\":{\"from\":\"$SYM_HIGH\"}}" \
  "$FRONTEND_URL/graphql"
json_assert "symmetric outgoing from non-canonical side still returns one" "$TMP_DIR/rel-sym-outgoing.json" \
  'json.data.relations.outgoing.length === 1'

expect_status "relations.delete removes the relation" 200 "$TMP_DIR/rel-delete.json" \
  -H "content-type: application/json" \
  --data "{\"query\":\"mutation(\$input: DeleteRelationInput!) { relations.delete(input: \$input) }\",\"variables\":{\"input\":{\"id\":\"$RELATION_ID\"}}}" \
  "$FRONTEND_URL/graphql"
json_assert "relations.delete reports true" "$TMP_DIR/rel-delete.json" \
  'json.data.relations.delete === true'

expect_status "relations.outgoing after delete is empty" 200 "$TMP_DIR/rel-outgoing-after.json" \
  -H "content-type: application/json" \
  --data "{\"query\":\"query(\$from: ResourceURN!) { relations.outgoing(from: \$from) { id } }\",\"variables\":{\"from\":\"$RELATION_FROM\"}}" \
  "$FRONTEND_URL/graphql"
json_assert "relations.outgoing now empty for the deleted side" "$TMP_DIR/rel-outgoing-after.json" \
  'json.data.relations.outgoing.length === 0'

# ── Comments API ────────────────────────────────────────────────────────────
COMMENT_TARGET="comtrya://issue/iss_01HV0K4XAVE2H6R5M8KJZ8Q1C9"
expect_status "comments.create on a target" 200 "$TMP_DIR/cmt-create.json" \
  -H "content-type: application/json" \
  --data "{\"query\":\"mutation(\$input: CreateCommentInput!) { comments.create(input: \$input) { id target parent bodyMarkdown } }\",\"variables\":{\"input\":{\"target\":\"$COMMENT_TARGET\",\"bodyMarkdown\":\"top-level comment\"}}}" \
  "$FRONTEND_URL/graphql"
json_assert "comment created with cmt_ id and matching target" "$TMP_DIR/cmt-create.json" \
  "json.data.comments.create.target === \"$COMMENT_TARGET\" && json.data.comments.create.parent === null && json.data.comments.create.id.startsWith(\"cmt_\")"
COMMENT_TOP_ID="$(json_value "$TMP_DIR/cmt-create.json" 'json.data.comments.create.id')"
COMMENT_TOP_REF="comtrya://comment/$COMMENT_TOP_ID"

expect_status "comments.create reply (nested)" 200 "$TMP_DIR/cmt-reply.json" \
  -H "content-type: application/json" \
  --data "{\"query\":\"mutation(\$input: CreateCommentInput!) { comments.create(input: \$input) { id parent } }\",\"variables\":{\"input\":{\"target\":\"$COMMENT_TARGET\",\"parent\":\"$COMMENT_TOP_REF\",\"bodyMarkdown\":\"reply body\"}}}" \
  "$FRONTEND_URL/graphql"
json_assert "reply carries the parent ref" "$TMP_DIR/cmt-reply.json" \
  "json.data.comments.create.parent === \"$COMMENT_TOP_REF\""

expect_status "comments.create rejects parent on a different target" 400 "$TMP_DIR/cmt-bad-parent.json" \
  -H "content-type: application/json" \
  --data "{\"query\":\"mutation(\$input: CreateCommentInput!) { comments.create(input: \$input) { id } }\",\"variables\":{\"input\":{\"target\":\"comtrya://issue/iss_01HV0K4XAVE2H6R5M8KJZ8Q1DD\",\"parent\":\"$COMMENT_TOP_REF\",\"bodyMarkdown\":\"wrong\"}}}" \
  "$FRONTEND_URL/graphql"
json_assert "wrong-target parent rejected" "$TMP_DIR/cmt-bad-parent.json" \
  'json.errors[0].extensions.code === "BAD_USER_INPUT"'

expect_status "comments.thread returns both comments in order" 200 "$TMP_DIR/cmt-thread.json" \
  -H "content-type: application/json" \
  --data "{\"query\":\"query(\$target: ResourceURN!) { comments.thread(target: \$target) { id parent bodyMarkdown } }\",\"variables\":{\"target\":\"$COMMENT_TARGET\"}}" \
  "$FRONTEND_URL/graphql"
json_assert "thread has two comments, parent is the top one" "$TMP_DIR/cmt-thread.json" \
  "json.data.comments.thread.length === 2 && json.data.comments.thread[0].id === \"$COMMENT_TOP_ID\" && json.data.comments.thread[1].parent === \"$COMMENT_TOP_REF\""

expect_status "comments.update edits body" 200 "$TMP_DIR/cmt-update.json" \
  -H "content-type: application/json" \
  --data "{\"query\":\"mutation(\$input: UpdateCommentInput!) { comments.update(input: \$input) { id bodyMarkdown editedAt } }\",\"variables\":{\"input\":{\"id\":\"$COMMENT_TOP_ID\",\"bodyMarkdown\":\"edited body\"}}}" \
  "$FRONTEND_URL/graphql"
json_assert "comment body updated and editedAt set" "$TMP_DIR/cmt-update.json" \
  'json.data.comments.update.bodyMarkdown === "edited body" && typeof json.data.comments.update.editedAt === "string"'

expect_status "comments.delete removes the comment" 200 "$TMP_DIR/cmt-delete.json" \
  -H "content-type: application/json" \
  --data "{\"query\":\"mutation(\$input: DeleteCommentInput!) { comments.delete(input: \$input) }\",\"variables\":{\"input\":{\"id\":\"$COMMENT_TOP_ID\"}}}" \
  "$FRONTEND_URL/graphql"
json_assert "comments.delete returns true" "$TMP_DIR/cmt-delete.json" \
  'json.data.comments.delete === true'

# ── ext_issues end-to-end via canonical ops ────────────────────────────────
ISSUE_REPOSITORY_URI="comtrya://workspace/ws_01HV0K4XAVE2H6R5M8KJZ8Q1A3"
expect_status "open-issue with workspace + title" 200 "$TMP_DIR/iss-create.json" \
  -H "authorization: Bearer $ACCESS_TOKEN" \
  -H "content-type: application/json" \
  --data '{"repository":"comtrya://workspace/ws_01HV0K4XAVE2H6R5M8KJZ8Q1A3","title":"first issue","bodyMarkdown":"This issue tracks the first slice of work. Follow-up work is filed as #2.\n\nMore detail will be added as the design lands.","projectName":"kernel","labels":["kind::ux","priority::p0","good-first-issue"]}' \
  "$FRONTEND_URL/api/ops/ext_issues/issues/open-issue"
json_assert "issue created with iss_ id and number 1" "$TMP_DIR/iss-create.json" \
  'json.id.startsWith("iss_") && json.number === 1 && json.state === "open"'
ISSUE_ONE_ID="$(json_value "$TMP_DIR/iss-create.json" 'json.id')"

expect_status "open-issue increments number per workspace" 200 "$TMP_DIR/iss-create-2.json" \
  -H "authorization: Bearer $ACCESS_TOKEN" \
  -H "content-type: application/json" \
  --data '{"repository":"comtrya://workspace/ws_01HV0K4XAVE2H6R5M8KJZ8Q1A3","title":"second issue","bodyMarkdown":"","projectName":"kernel","labels":["kind::bug","priority::p1"]}' \
  "$FRONTEND_URL/api/ops/ext_issues/issues/open-issue"
json_assert "second issue is number 2" "$TMP_DIR/iss-create-2.json" \
  'json.number === 2'

expect_status "open-issue rejects empty title" 400 "$TMP_DIR/iss-bad.json" \
  -H "authorization: Bearer $ACCESS_TOKEN" \
  -H "content-type: application/json" \
  --data '{"repository":"comtrya://workspace/ws_01HV0K4XAVE2H6R5M8KJZ8Q1A3","title":"   ","bodyMarkdown":""}' \
  "$FRONTEND_URL/api/ops/ext_issues/issues/open-issue"
json_assert "empty title is bad-input" "$TMP_DIR/iss-bad.json" \
  'json.code === "bad-input"'

expect_status "list-issues returns the issues, newest first" 200 "$TMP_DIR/iss-list.json" \
  -H "authorization: Bearer $ACCESS_TOKEN" \
  -H "content-type: application/json" \
  --data '{"repository":"comtrya://workspace/ws_01HV0K4XAVE2H6R5M8KJZ8Q1A3","limit":1024}' \
  "$FRONTEND_URL/api/ops/ext_issues/issues/list-issues"
json_assert "list returns 2 open issues, latest number first" "$TMP_DIR/iss-list.json" \
  'json.length === 2 && json[0].number === 2 && json[1].number === 1 && json.every((i) => i.state === "open")'

expect_status "by-number-issue resolves" 200 "$TMP_DIR/iss-by-num.json" \
  -H "authorization: Bearer $ACCESS_TOKEN" \
  -H "content-type: application/json" \
  --data '{"workspaceId":"ws_01HV0K4XAVE2H6R5M8KJZ8Q1A3","number":1}' \
  "$FRONTEND_URL/api/ops/ext_issues/issues/by-number-issue"
json_assert "by-number returns the first issue by id" "$TMP_DIR/iss-by-num.json" \
  "json.id === \"$ISSUE_ONE_ID\""

expect_status "close-issue transitions to closed" 200 "$TMP_DIR/iss-close.json" \
  -H "authorization: Bearer $ACCESS_TOKEN" \
  -H "content-type: application/json" \
  --data "{\"id\":\"$ISSUE_ONE_ID\",\"reason\":\"completed\"}" \
  "$FRONTEND_URL/api/ops/ext_issues/issues/close-issue"
json_assert "issue is now closed with reason completed and closedAt set" "$TMP_DIR/iss-close.json" \
  'json.state === "closed" && json.stateReason === "completed" && typeof json.closedAt === "string"'
write_issue_closed_wasm_event "$ISSUE_ONE_ID" "$TMP_DIR/iss-close-event.json"
json_assert "close issue emitted ext_issues WASM event" "$TMP_DIR/iss-close-event.json" \
  'json.data.emitterExtension === "ext_issues" && json.data.eventType === "dev.comtrya.issues.closed" && json.decodedPayload.id === json.data.sourceUri.split("/").pop()'

expect_status "reopen-issue returns to open" 200 "$TMP_DIR/iss-reopen.json" \
  -H "authorization: Bearer $ACCESS_TOKEN" \
  -H "content-type: application/json" \
  --data "\"$ISSUE_ONE_ID\"" \
  "$FRONTEND_URL/api/ops/ext_issues/issues/reopen-issue"
json_assert "issue is back to open" "$TMP_DIR/iss-reopen.json" \
  'json.state === "open"'

if [[ "$ONESHOT" == "1" || "$BROWSER_SMOKE" == "1" ]]; then
  expect_status "open-issue for browser close smoke" 200 "$TMP_DIR/iss-browser-create.json" \
    -H "authorization: Bearer $ACCESS_TOKEN" \
    -H "content-type: application/json" \
    --data '{"repository":"comtrya://workspace/ws_01HV0K4XAVE2H6R5M8KJZ8Q1A3","title":"browser close WASM smoke","bodyMarkdown":"close through the extension page button"}' \
    "$FRONTEND_URL/api/ops/ext_issues/issues/open-issue"
  json_assert "browser close smoke issue starts open" "$TMP_DIR/iss-browser-create.json" \
    'json.state === "open" && typeof json.id === "string" && typeof json.number === "number"'
  BROWSER_CLOSE_ISSUE_ID="$(json_value "$TMP_DIR/iss-browser-create.json" 'json.id')"
  BROWSER_CLOSE_ISSUE_NUMBER="$(json_value "$TMP_DIR/iss-browser-create.json" 'json.number')"
  assert_issue_close_browser_smoke \
    "$BROWSER_CLOSE_ISSUE_ID" \
    "ws_01HV0K4XAVE2H6R5M8KJZ8Q1A3" \
    "$BROWSER_CLOSE_ISSUE_NUMBER" \
    "$TMP_DIR/issue-close-browser-evidence.json" \
    "$TMP_DIR/issue-close-browser.log"
else
  log "skipping browser issue close smoke in interactive mode; set COMTRYA_BROWSER_SMOKE=1 or pass --oneshot to require it"
fi

expect_status "by-refs-issue batch returns parallel array" 200 "$TMP_DIR/iss-by-refs.json" \
  -H "authorization: Bearer $ACCESS_TOKEN" \
  -H "content-type: application/json" \
  --data "[\"comtrya://issue/$ISSUE_ONE_ID\",\"comtrya://issue/iss_00000000000000000000000000\"]" \
  "$FRONTEND_URL/api/ops/ext_issues/issues/by-refs-issue"
json_assert "batch is two entries, first found, second null" "$TMP_DIR/iss-by-refs.json" \
  "json.length === 2 && json[0].id === \"$ISSUE_ONE_ID\" && json[1] === null"

expect_status "state-counts-for-refs-issue aggregates" 200 "$TMP_DIR/iss-counts.json" \
  -H "authorization: Bearer $ACCESS_TOKEN" \
  -H "content-type: application/json" \
  --data "[\"comtrya://issue/$ISSUE_ONE_ID\"]" \
  "$FRONTEND_URL/api/ops/ext_issues/issues/state-counts-for-refs-issue"
json_assert "counts: 1 open, 0 closed" "$TMP_DIR/iss-counts.json" \
  'json.open === 1 && json.closed === 0'

expect_status "open-issue for explicit part-of relation" 200 "$TMP_DIR/iss-with-epic.json" \
  -H "authorization: Bearer $ACCESS_TOKEN" \
  -H "content-type: application/json" \
  --data '{"repository":"comtrya://workspace/ws_01HV0K4XAVE2H6R5M8KJZ8Q1A3","title":"linked to epic","bodyMarkdown":""}' \
  "$FRONTEND_URL/api/ops/ext_issues/issues/open-issue"
ISSUE_LINKED_ID="$(json_value "$TMP_DIR/iss-with-epic.json" 'json.id')"

expect_status "relations.create writes explicit issue part-of link" 200 "$TMP_DIR/iss-rel-create.json" \
  -H "authorization: Bearer $ACCESS_TOKEN" \
  -H "content-type: application/json" \
  --data "{\"query\":\"mutation(\$input: CreateRelationInput!) { relations.create(input: \$input) { id kind from to } }\",\"variables\":{\"input\":{\"from\":\"comtrya://issue/$ISSUE_LINKED_ID\",\"to\":\"comtrya://epic/epc_01HV0K4XAVE2H6R5M8KJZ8Q1F0\",\"kind\":\"comtrya://rel/part-of\"}}}" \
  "$FRONTEND_URL/graphql"

expect_status "relations.outgoing shows the explicit part-of link" 200 "$TMP_DIR/iss-rel.json" \
  -H "authorization: Bearer $ACCESS_TOKEN" \
  -H "content-type: application/json" \
  --data "{\"query\":\"query(\$from: ResourceURN!) { relations.outgoing(from: \$from, kind: \\\"comtrya://rel/part-of\\\") { to } }\",\"variables\":{\"from\":\"comtrya://issue/$ISSUE_LINKED_ID\"}}" \
  "$FRONTEND_URL/graphql"
json_assert "outgoing part-of points at the epic URI" "$TMP_DIR/iss-rel.json" \
  'json.data.relations.outgoing.length === 1 && json.data.relations.outgoing[0].to === "comtrya://epic/epc_01HV0K4XAVE2H6R5M8KJZ8Q1F0"'

# ── ext_epics end-to-end + cross-extension composition ─────────────────────
expect_status "create-epic" 200 "$TMP_DIR/epc-create.json" \
  -H "authorization: Bearer $ACCESS_TOKEN" \
  -H "content-type: application/json" \
  --data '{"workspace":"comtrya://workspace/ws_01HV0K4XAVE2H6R5M8KJZ8Q1A3","title":"Q4 platform launch","bodyMarkdown":"big stuff","ownerRef":null,"targetDate":null,"labels":[],"parentEpicRef":null}' \
  "$FRONTEND_URL/api/ops/ext_epics/epics/create-epic"
json_assert "epic created with epc_ id, state=PLANNED" "$TMP_DIR/epc-create.json" \
  'json.id.startsWith("epc_") && json.state === "PLANNED"'
EPIC_ROOT_ID="$(json_value "$TMP_DIR/epc-create.json" 'json.id')"
EPIC_ROOT_REF="comtrya://epic/$EPIC_ROOT_ID"

expect_status "create-epic with parentEpicRef writes part-of" 200 "$TMP_DIR/epc-child.json" \
  -H "authorization: Bearer $ACCESS_TOKEN" \
  -H "content-type: application/json" \
  --data "{\"workspace\":\"comtrya://workspace/ws_01HV0K4XAVE2H6R5M8KJZ8Q1A3\",\"title\":\"child epic\",\"bodyMarkdown\":\"\",\"ownerRef\":null,\"targetDate\":null,\"labels\":[],\"parentEpicRef\":\"$EPIC_ROOT_REF\"}" \
  "$FRONTEND_URL/api/ops/ext_epics/epics/create-epic"
EPIC_CHILD_ID="$(json_value "$TMP_DIR/epc-child.json" 'json.id')"

expect_status "children-of-epic returns the child epic" 200 "$TMP_DIR/epc-children.json" \
  -H "authorization: Bearer $ACCESS_TOKEN" \
  -H "content-type: application/json" \
  --data "\"$EPIC_ROOT_REF\"" \
  "$FRONTEND_URL/api/ops/ext_epics/epics/children-of-epic"
json_assert "childrenOf has the child epic URI" "$TMP_DIR/epc-children.json" \
  "json.length === 1 && json[0] === \"comtrya://epic/$EPIC_CHILD_ID\""

expect_status "issue A linked to root epic" 200 "$TMP_DIR/epc-iss-a.json" \
  -H "authorization: Bearer $ACCESS_TOKEN" \
  -H "content-type: application/json" \
  --data '{"repository":"comtrya://workspace/ws_01HV0K4XAVE2H6R5M8KJZ8Q1A3","title":"A","bodyMarkdown":""}' \
  "$FRONTEND_URL/api/ops/ext_issues/issues/open-issue"
ISSUE_A_ID="$(json_value "$TMP_DIR/epc-iss-a.json" 'json.id')"
expect_status "issue B linked to root epic" 200 "$TMP_DIR/epc-iss-b.json" \
  -H "authorization: Bearer $ACCESS_TOKEN" \
  -H "content-type: application/json" \
  --data '{"repository":"comtrya://workspace/ws_01HV0K4XAVE2H6R5M8KJZ8Q1A3","title":"B","bodyMarkdown":""}' \
  "$FRONTEND_URL/api/ops/ext_issues/issues/open-issue"
ISSUE_B_ID="$(json_value "$TMP_DIR/epc-iss-b.json" 'json.id')"

for ISSUE_ID_TO_LINK in "$ISSUE_A_ID" "$ISSUE_B_ID"; do
  expect_status "relations.create issue $ISSUE_ID_TO_LINK part-of epic" 200 "$TMP_DIR/epc-rel-$ISSUE_ID_TO_LINK.json" \
    -H "authorization: Bearer $ACCESS_TOKEN" \
    -H "content-type: application/json" \
    --data "{\"query\":\"mutation(\$input: CreateRelationInput!) { relations.create(input: \$input) { id } }\",\"variables\":{\"input\":{\"from\":\"comtrya://issue/$ISSUE_ID_TO_LINK\",\"to\":\"$EPIC_ROOT_REF\",\"kind\":\"comtrya://rel/part-of\"}}}" \
    "$FRONTEND_URL/graphql"
done

expect_status "close issue B" 200 "$TMP_DIR/epc-close-b.json" \
  -H "authorization: Bearer $ACCESS_TOKEN" \
  -H "content-type: application/json" \
  --data "{\"id\":\"$ISSUE_B_ID\",\"reason\":\"completed\"}" \
  "$FRONTEND_URL/api/ops/ext_issues/issues/close-issue"

expect_status "issues-in-epic returns both linked issues" 200 "$TMP_DIR/epc-issues-in.json" \
  -H "authorization: Bearer $ACCESS_TOKEN" \
  -H "content-type: application/json" \
  --data "\"$EPIC_ROOT_REF\"" \
  "$FRONTEND_URL/api/ops/ext_epics/epics/issues-in-epic"
json_assert "issuesIn has the two issue URIs" "$TMP_DIR/epc-issues-in.json" \
  "json.length === 2 && json.includes(\"comtrya://issue/$ISSUE_A_ID\") && json.includes(\"comtrya://issue/$ISSUE_B_ID\")"

expect_status "progress-epic aggregates across issues and child epics" 200 "$TMP_DIR/epc-progress.json" \
  -H "authorization: Bearer $ACCESS_TOKEN" \
  -H "content-type: application/json" \
  --data "\"$EPIC_ROOT_REF\"" \
  "$FRONTEND_URL/api/ops/ext_epics/epics/progress-epic"
json_assert "progress is 1 open issue + 1 closed issue + 1 open child epic = 33%" "$TMP_DIR/epc-progress.json" \
  'json.issuesOpen === 1 && json.issuesClosed === 1 && json.childEpicsOpen === 1 && json.childEpicsClosed === 0 && json.percentComplete === 33'

expect_status "change-state-epic to DONE sets closedAt" 200 "$TMP_DIR/epc-state.json" \
  -H "authorization: Bearer $ACCESS_TOKEN" \
  -H "content-type: application/json" \
  --data "{\"id\":\"$EPIC_CHILD_ID\",\"state\":\"DONE\"}" \
  "$FRONTEND_URL/api/ops/ext_epics/epics/change-state-epic"
json_assert "child epic state is DONE" "$TMP_DIR/epc-state.json" \
  'json.state === "DONE"'

expect_status "list-epics returns both epics for the workspace" 200 "$TMP_DIR/epc-list.json" \
  -H "authorization: Bearer $ACCESS_TOKEN" \
  -H "content-type: application/json" \
  --data '{"workspace":"comtrya://workspace/ws_01HV0K4XAVE2H6R5M8KJZ8Q1A3","limit":1024}' \
  "$FRONTEND_URL/api/ops/ext_epics/epics/list-epics"
json_assert "list has 2 epics" "$TMP_DIR/epc-list.json" \
  'json.length === 2'

expect_status "change-state-epic rejects unknown state" 400 "$TMP_DIR/epc-bad-state.json" \
  -H "authorization: Bearer $ACCESS_TOKEN" \
  -H "content-type: application/json" \
  --data "{\"id\":\"$EPIC_ROOT_ID\",\"state\":\"GREEN\"}" \
  "$FRONTEND_URL/api/ops/ext_epics/epics/change-state-epic"
json_assert "unknown state rejected as bad-input" "$TMP_DIR/epc-bad-state.json" \
  'json.code === "bad-input"'

# ── ext_pull_requests auto-close-on-merge reactor ──────────────────────────
expect_status "open-issue for reactor target" 200 "$TMP_DIR/rx-issue.json" \
  -H "authorization: Bearer $ACCESS_TOKEN" \
  -H "content-type: application/json" \
  --data '{"repository":"comtrya://workspace/ws_01HV0K4XAVE2H6R5M8KJZ8Q1A3","title":"reactor target","bodyMarkdown":""}' \
  "$FRONTEND_URL/api/ops/ext_issues/issues/open-issue"
REACTOR_ISSUE_ID="$(json_value "$TMP_DIR/rx-issue.json" 'json.id')"

expect_status "create-pull" 200 "$TMP_DIR/rx-pr.json" \
  -H "authorization: Bearer $ACCESS_TOKEN" \
  -H "content-type: application/json" \
  --data '{"repository":"comtrya://workspace/ws_01HV0K4XAVE2H6R5M8KJZ8Q1A3/repository/repo_01HV0K4XAVE2H6R5M8KJZ8Q1A3","title":"reactor PR","bodyMarkdown":"","headRef":"feature/x","baseRef":"main","authorRef":null}' \
  "$FRONTEND_URL/api/ops/ext_pull_requests/pulls/create-pull"
json_assert "pr created with pul_ id and DRAFT state" "$TMP_DIR/rx-pr.json" \
  'json.id.startsWith("pul_") && json.state === "DRAFT"'
REACTOR_PR_ID="$(json_value "$TMP_DIR/rx-pr.json" 'json.id')"
REACTOR_PR_REF="comtrya://pull_request/$REACTOR_PR_ID"
REACTOR_ISSUE_REF="comtrya://issue/$REACTOR_ISSUE_ID"

expect_status "relations.create closes (extension-minted verb)" 200 "$TMP_DIR/rx-rel.json" \
  -H "authorization: Bearer $ACCESS_TOKEN" \
  -H "content-type: application/json" \
  --data "{\"query\":\"mutation(\$input: CreateRelationInput!) { relations.create(input: \$input) { id kind } }\",\"variables\":{\"input\":{\"from\":\"$REACTOR_PR_REF\",\"to\":\"$REACTOR_ISSUE_REF\",\"kind\":\"comtrya://rel/com.comtrya.pulls/closes\"}}}" \
  "$FRONTEND_URL/graphql"
json_assert "closes relation written" "$TMP_DIR/rx-rel.json" \
  'json.data.relations.create.kind === "comtrya://rel/com.comtrya.pulls/closes"'

expect_status "merge-pull transitions to MERGED" 200 "$TMP_DIR/rx-merge.json" \
  -H "authorization: Bearer $ACCESS_TOKEN" \
  -H "content-type: application/json" \
  --data "{\"id\":\"$REACTOR_PR_ID\",\"mergedByRef\":null}" \
  "$FRONTEND_URL/api/ops/ext_pull_requests/pulls/merge-pull"
json_assert "pr is MERGED with mergedAt timestamp" "$TMP_DIR/rx-merge.json" \
  'json.state === "MERGED" && typeof json.mergedAt === "string"'

expect_status "by-ref-issue shows the issue auto-closed by the reactor" 200 "$TMP_DIR/rx-issue-after.json" \
  -H "authorization: Bearer $ACCESS_TOKEN" \
  -H "content-type: application/json" \
  --data "\"$REACTOR_ISSUE_REF\"" \
  "$FRONTEND_URL/api/ops/ext_issues/issues/by-ref-issue"
json_assert "issue is now closed with reason=completed and closedByRef=PR" "$TMP_DIR/rx-issue-after.json" \
  "json.state === \"closed\" && json.stateReason === \"completed\" && json.closedByRef === \"$REACTOR_PR_REF\""
write_issue_closed_wasm_event "$REACTOR_ISSUE_ID" "$TMP_DIR/rx-issue-closed-event.json"
json_assert "reactor close emitted ext_issues WASM event" "$TMP_DIR/rx-issue-closed-event.json" \
  "json.data.emitterExtension === \"ext_issues\" && json.data.eventType === \"dev.comtrya.issues.closed\" && json.decodedPayload.id === \"$REACTOR_ISSUE_ID\""

expect_status "close-pull rejects merged PR" 409 "$TMP_DIR/rx-close-merged.json" \
  -H "authorization: Bearer $ACCESS_TOKEN" \
  -H "content-type: application/json" \
  --data "{\"id\":\"$REACTOR_PR_ID\",\"closedByRef\":null}" \
  "$FRONTEND_URL/api/ops/ext_pull_requests/pulls/close-pull"

IMPORT_REPO_PATH="imported/comtrya-mirror"
IMPORT_SOURCE_URL="file://$DATA_DIR/repositories/comtrya/comtrya.git"
expect_status "importRepository (clone) mutation through Vue shell" 200 "$TMP_DIR/import-repo.json" \
  -H "content-type: application/json" \
  --data "{\"query\":\"mutation(\$input: CreateRepositoryInput!) { createRepository(input: \$input) { repository { id path defaultBranch importedFrom } } }\",\"variables\":{\"input\":{\"path\":\"$IMPORT_REPO_PATH\",\"cloneFromUrl\":\"$IMPORT_SOURCE_URL\"}}}" \
  "$FRONTEND_URL/graphql"
json_assert "imported repo carries clone source and inferred default branch" "$TMP_DIR/import-repo.json" \
  "json.data.createRepository.repository.path === \"$IMPORT_REPO_PATH\" && json.data.createRepository.repository.defaultBranch === \"main\" && json.data.createRepository.repository.importedFrom === \"$IMPORT_SOURCE_URL\""

expect_status "imported repo path resolves" 200 "$TMP_DIR/import-repo-resolved.html" \
  "$FRONTEND_URL/r/$IMPORT_REPO_PATH"
expect_contains "imported repo path serves Vue shell" "$TMP_DIR/import-repo-resolved.html" \
  "Comtrya Shell v3"

log "checking imported repo is reachable through Git smart HTTP"
git -c "http.extraHeader=Authorization: Bearer $ACCESS_TOKEN" \
  ls-remote "$FRONTEND_URL/git/$IMPORT_REPO_PATH.git" \
  >"$TMP_DIR/git-imported-ls-remote.log" 2>&1 || {
  sed -n '1,160p' "$TMP_DIR/git-imported-ls-remote.log" >&2 || true
  fail "git ls-remote on imported repo failed"
}
if ! grep -Fq $'\trefs/heads/main' "$TMP_DIR/git-imported-ls-remote.log"; then
  printf '[comtrya] imported repo missing refs/heads/main:\n' >&2
  sed -n '1,160p' "$TMP_DIR/git-imported-ls-remote.log" >&2 || true
  exit 1
fi
log "ok - imported repo serves refs via /git/$IMPORT_REPO_PATH.git"

expect_status "repositoryByPath returns code-browser data for imported repo" 200 "$TMP_DIR/imported-repo-files.json" \
  -H "content-type: application/json" \
  --data "{\"query\":\"query(\$segments: [String!]!) { workspace { repositoryByPath(segments: \$segments) { id path defaultBranch files { path size kind } } } }\",\"variables\":{\"segments\":[\"imported\",\"comtrya-mirror\"]}}" \
  "$FRONTEND_URL/graphql"
json_assert "imported repo exposes a non-empty file tree via repositoryByPath" "$TMP_DIR/imported-repo-files.json" \
  'json.data.workspace.repositoryByPath && Array.isArray(json.data.workspace.repositoryByPath.files) && json.data.workspace.repositoryByPath.files.length > 0 && json.data.workspace.repositoryByPath.files.some((f) => f.path === "README.md")'

log "end-to-end production-testbed smoke passed"

# ── Dogfood: snapshot this working tree (committed + uncommitted, minus
# .git/target/node_modules/dist) into a tmp bare repo and import it as
# `comtrya/dogfood`. We deliberately do NOT clone from `$ROOT_DIR/.git`
# because that only sees committed state and skips the CUE files and
# MDX docs a contributor may be iterating on. The snapshot lives under
# $TMP_DIR and is recreated every run.
if [[ -d "$ROOT_DIR/.git" ]]; then
  log "snapshotting working tree for dogfood import"
  DOGFOOD_SNAPSHOT="$TMP_DIR/dogfood-snapshot"
  DOGFOOD_BARE="$TMP_DIR/dogfood-bare.git"
  mkdir -p "$DOGFOOD_SNAPSHOT"
  rsync -a \
    --exclude='.git' \
    --exclude='target' \
    --exclude='node_modules' \
    --exclude='dist' \
    --exclude='.direnv' \
    --exclude='.envrc' \
    --exclude='*.wasm' \
    "$ROOT_DIR/" "$DOGFOOD_SNAPSHOT/"
  (
    cd "$DOGFOOD_SNAPSHOT"
    git init --quiet --initial-branch=main
    git -c "user.email=dogfood@comtrya.dev" -c "user.name=Comtrya Dogfood" \
        add . >/dev/null
    git -c "user.email=dogfood@comtrya.dev" -c "user.name=Comtrya Dogfood" \
        commit --quiet --no-gpg-sign -m "Working-tree snapshot for dogfood import" || true
  )
  if [[ -d "$DOGFOOD_SNAPSHOT/.git" ]]; then
    git clone --quiet --bare "$DOGFOOD_SNAPSHOT" "$DOGFOOD_BARE" || true
  fi
  if [[ -d "$DOGFOOD_BARE" ]]; then
    DOGFOOD_PATH="comtrya/dogfood"
    DOGFOOD_URL="file://$DOGFOOD_BARE"
    DOGFOOD_OUT="$TMP_DIR/dogfood-import.json"
    log "importing snapshot as $DOGFOOD_PATH"
    HTTP_CODE="$(curl -sS -o "$DOGFOOD_OUT" -w "%{http_code}" \
        -H "origin: $FRONTEND_URL" \
        -H "sec-fetch-site: same-origin" \
        -H "authorization: Bearer $ACCESS_TOKEN" \
        -H "content-type: application/json" \
        --data "{\"query\":\"mutation(\$input: CreateRepositoryInput!) { createRepository(input: \$input) { repository { id path defaultBranch importedFrom } } }\",\"variables\":{\"input\":{\"path\":\"$DOGFOOD_PATH\",\"cloneFromUrl\":\"$DOGFOOD_URL\"}}}" \
        "$FRONTEND_URL/graphql" || true)"
    if [[ "$HTTP_CODE" == "200" ]] && ! grep -q '"errors"' "$DOGFOOD_OUT" 2>/dev/null; then
      log "ok — dogfood at $FRONTEND_URL/r/$DOGFOOD_PATH"
    else
      log "warn — dogfood import returned HTTP $HTTP_CODE: $(head -c 220 "$DOGFOOD_OUT" 2>/dev/null)"
    fi
  else
    log "warn — could not produce dogfood bare repo; skipping import"
  fi
fi

if [[ "$ONESHOT" == "1" ]]; then
  exit 0
fi

log "Vue shell: $FRONTEND_URL"
log "Rust server: $BACKEND_URL"
log "press Ctrl-C to stop both processes"
wait "$FRONTEND_PID"
