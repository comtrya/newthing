<script setup lang="ts">
import { computed } from "vue";
import Chip from "../components/Chip.vue";
import Icon from "../components/Icon.vue";
import Kv from "../components/Kv.vue";

interface StageInfo {
  label: string;
  state: "ok" | "fail" | "run";
  time: string;
  active?: boolean;
}

interface DagNodeInfo {
  id: string;
  x: number;
  y: number;
  w: number;
  label: string;
  state: "ok" | "fail" | "run" | "skip" | "trigger";
  time?: string;
  iconName?: "tag" | "bolt";
  active?: boolean;
}

const stages: StageInfo[] = [
  { label: "Lint", state: "ok", time: "0:12" },
  { label: "Build", state: "ok", time: "2:04" },
  { label: "Test", state: "ok", time: "1:48", active: true },
  { label: "Sign", state: "ok", time: "0:14" },
  { label: "Publish", state: "ok", time: "0:30" },
];

const dagNodes: DagNodeInfo[] = [
  { id: "trig", x: 14, y: 0, w: 320, label: "tag · v0.9.0", iconName: "tag", state: "trigger" },
  { id: "lint", x: 14, y: 70, w: 152, label: "lint · clippy", state: "ok", time: "0:12" },
  { id: "fmt", x: 182, y: 70, w: 152, label: "lint · rustfmt", state: "ok", time: "0:04" },
  { id: "blin", x: 14, y: 150, w: 152, label: "build · linux", state: "ok", time: "1:42" },
  { id: "bmac", x: 182, y: 150, w: 152, label: "build · darwin", state: "ok", time: "2:04" },
  { id: "tunit", x: 14, y: 230, w: 152, label: "test · unit", state: "ok", time: "0:24" },
  { id: "tlin", x: 182, y: 230, w: 152, label: "test · linux", state: "ok", time: "1:48", active: true },
  { id: "tmac", x: 14, y: 310, w: 152, label: "test · darwin", state: "ok", time: "1:32" },
  { id: "te2e", x: 182, y: 310, w: 152, label: "test · e2e", state: "ok", time: "1:18" },
  { id: "sign", x: 14, y: 410, w: 320, label: "sign · cosign", state: "ok", time: "0:14" },
  { id: "ghcr", x: 14, y: 490, w: 152, label: "publish · ghcr", state: "ok", time: "0:18" },
  { id: "crates", x: 182, y: 490, w: 152, label: "publish · crates", state: "ok", time: "0:22" },
  { id: "release", x: 14, y: 570, w: 152, label: "release · forge", state: "ok", time: "0:08" },
  { id: "notify", x: 182, y: 570, w: 152, label: "notify · matrix", state: "ok", time: "0:02" },
];

const edges: ReadonlyArray<readonly [string, string]> = [
  ["trig", "lint"], ["trig", "fmt"],
  ["lint", "blin"], ["lint", "bmac"], ["fmt", "blin"], ["fmt", "bmac"],
  ["blin", "tunit"], ["blin", "tlin"], ["bmac", "tmac"], ["bmac", "te2e"],
  ["tunit", "sign"], ["tlin", "sign"], ["tmac", "sign"], ["te2e", "sign"],
  ["sign", "ghcr"], ["sign", "crates"],
  ["ghcr", "release"], ["crates", "notify"],
];

const dagWidth = 348;
const dagHeight = 720;

const dagPaths = computed(() => {
  const find = (id: string) => dagNodes.find((n) => n.id === id);
  return edges.map(([a, b]) => {
    const A = find(a)!;
    const B = find(b)!;
    const x1 = A.x + A.w / 2;
    const y1 = A.y + 36;
    const x2 = B.x + B.w / 2;
    const y2 = B.y;
    const dy = (y2 - y1) / 2;
    return `M${x1},${y1} C${x1},${y1 + dy} ${x2},${y2 - dy} ${x2},${y2}`;
  });
});

function stageColor(state: StageInfo["state"]): string {
  return state === "ok" ? "var(--ok)" : state === "fail" ? "var(--err)" : "var(--info)";
}

function nodeTone(state: DagNodeInfo["state"]) {
  return {
    ok: { c: "var(--ok)", bg: "var(--ok-soft)" },
    fail: { c: "var(--err)", bg: "var(--err-soft)" },
    run: { c: "var(--info)", bg: "var(--info-soft)" },
    skip: { c: "var(--fg-4)", bg: "var(--surface-2)" },
    trigger: { c: "var(--accent)", bg: "var(--accent-soft)" },
  }[state];
}

interface LogLine {
  n: number;
  kind: "info" | "step" | "out" | "ok" | "warn" | "err";
  ts: string;
  parts: ReadonlyArray<{ text: string; tone?: "highlight" | "subject" }>;
}

const logLines: LogLine[] = [
  { n: 1, kind: "info", ts: "14:04:22.018", parts: [{ text: "▸ Starting job " }, { text: "test · linux · stable", tone: "highlight" }, { text: " on runner " }, { text: "ip-10-2-4-19", tone: "subject" }] },
  { n: 2, kind: "step", ts: "14:04:22.041", parts: [{ text: "▸ " }, { text: "checkout", tone: "highlight" }, { text: " · actions/checkout@v4" }] },
  { n: 3, kind: "out", ts: "14:04:22.512", parts: [{ text: "  Fetched " }, { text: "12,841", tone: "highlight" }, { text: " objects in " }, { text: "423ms", tone: "subject" }] },
  { n: 4, kind: "step", ts: "14:04:22.601", parts: [{ text: "▸ " }, { text: "rustup install stable", tone: "highlight" }] },
  { n: 5, kind: "out", ts: "14:04:24.118", parts: [{ text: "  rustc " }, { text: "1.78.0", tone: "highlight" }, { text: " (9b00956 2024-04-29)" }] },
  { n: 6, kind: "step", ts: "14:04:24.220", parts: [{ text: "▸ " }, { text: "cargo test --workspace --locked", tone: "highlight" }] },
  { n: 7, kind: "out", ts: "14:04:24.882", parts: [{ text: "    Compiling " }, { text: "comtrya-lib", tone: "highlight" }, { text: " v0.9.0" }] },
  { n: 8, kind: "out", ts: "14:04:28.143", parts: [{ text: "    Compiling " }, { text: "comtrya-actions", tone: "highlight" }, { text: " v0.9.0" }] },
  { n: 9, kind: "out", ts: "14:04:34.001", parts: [{ text: "    Compiling " }, { text: "comtrya", tone: "highlight" }, { text: " v0.9.0" }] },
  { n: 10, kind: "out", ts: "14:04:41.722", parts: [{ text: "    Finished `test` profile [unoptimized + debuginfo] in 17.5s" }] },
  { n: 11, kind: "out", ts: "14:04:41.881", parts: [{ text: "    Running " }, { text: "unittests src/lib.rs", tone: "highlight" }] },
  { n: 12, kind: "ok", ts: "14:04:43.020", parts: [{ text: "    test result: " }, { text: "ok", tone: "highlight" }, { text: ". " }, { text: "127 passed", tone: "subject" }, { text: "; 0 failed; 0 ignored" }] },
  { n: 13, kind: "out", ts: "14:04:43.118", parts: [{ text: "    Running " }, { text: "tests/integration.rs", tone: "highlight" }] },
  { n: 14, kind: "ok", ts: "14:04:43.220", parts: [{ text: "    test result: " }, { text: "ok", tone: "highlight" }, { text: ". " }, { text: "121 passed", tone: "subject" }, { text: "; 0 failed; 0 ignored" }] },
  { n: 15, kind: "step", ts: "14:04:43.301", parts: [{ text: "▸ " }, { text: "cargo llvm-cov report", tone: "highlight" }] },
  { n: 16, kind: "out", ts: "14:04:43.812", parts: [{ text: "  Coverage: " }, { text: "84.3%", tone: "highlight" }, { text: " of " }, { text: "12,847 lines", tone: "subject" }] },
  { n: 17, kind: "ok", ts: "14:04:43.918", parts: [{ text: "✓ Job complete · " }, { text: "1m 48s", tone: "highlight" }] },
];

function lineColor(kind: LogLine["kind"]): string {
  return {
    info: "var(--info)",
    step: "var(--accent)",
    out: "var(--fg-2)",
    ok: "var(--ok)",
    warn: "var(--warn)",
    err: "var(--err)",
  }[kind];
}
</script>

<template>
  <div class="pipelines-page">
    <div class="hairline-b pipelines-header">
      <div class="pipelines-breadcrumb">
        <span class="ok-icon"><Icon name="bolt" /></span>
        <span class="mono crumb-faint">rawkode/core · pipelines</span>
        <span class="crumb-sep">/</span>
        <span class="mono crumb-faint">release.yaml</span>
        <span class="crumb-sep">/</span>
        <span class="mono crumb-active">run · #1842</span>
        <span class="spacer" />
        <Chip tone="ok" :dot="true">passing</Chip>
        <button class="btn btn-sm"><Icon name="retry" /><span>Re-run</span></button>
        <button class="btn btn-sm"><Icon name="dot3" /></button>
      </div>
      <div class="pipelines-titlerow">
        <h1 class="serif pipelines-title">Release · build, sign, publish</h1>
        <div class="pipelines-kv">
          <Kv k="Triggered by"><span class="mono">tag v0.9.0</span></Kv>
          <Kv k="Commit"><span class="mono accent">d3a91f4</span></Kv>
          <Kv k="Started">14:02:18 BST</Kv>
          <Kv k="Duration"><span class="mono">4m 28s</span></Kv>
        </div>
      </div>
      <div class="stage-bar">
        <div v-for="s in stages" :key="s.label" class="stage">
          <div
            class="stage-track"
            :style="{ background: stageColor(s.state) }"
          />
          <div class="stage-label-row">
            <span class="stage-label" :class="{ 'is-active': s.active }">{{ s.label }}</span>
            <span class="mono tnum stage-time">{{ s.time }}</span>
            <span class="spacer" />
            <span class="stage-check" :style="{ color: stageColor(s.state) }">
              <Icon name="check" />
            </span>
          </div>
        </div>
      </div>
    </div>

    <div class="pipelines-body">
      <aside class="hairline-r pipelines-dag-pane">
        <div class="pipelines-dag-head">
          <span class="eyebrow">Job graph</span>
          <span class="spacer" />
          <Chip :mono="true">14 jobs</Chip>
          <Chip :mono="true" tone="ok" :dot="true">0 failing</Chip>
        </div>
        <div class="dag" :style="{ width: `${dagWidth}px`, height: `${dagHeight}px` }">
          <svg :width="dagWidth" :height="dagHeight" class="dag-svg">
            <path
              v-for="(d, i) in dagPaths"
              :key="i"
              :d="d"
              fill="none"
              stroke="var(--line-2)"
              stroke-width="1"
            />
          </svg>
          <div
            v-for="n in dagNodes"
            :key="n.id"
            class="dag-node"
            :class="{ 'is-active': n.active }"
            :style="{ left: `${n.x}px`, top: `${n.y}px`, width: `${n.w}px` }"
          >
            <span
              class="dag-node-icon"
              :style="{ background: nodeTone(n.state).bg, color: nodeTone(n.state).c }"
            >
              <Icon :name="n.state === 'ok' ? 'check' : (n.iconName ?? 'bolt')" />
            </span>
            <span class="mono dag-node-label">{{ n.label }}</span>
            <span v-if="n.time" class="mono tnum dag-node-time">{{ n.time }}</span>
          </div>
        </div>
      </aside>

      <section class="pipelines-logs">
        <div class="hairline-b pipelines-logs-head">
          <span class="ok-icon"><Icon name="check" /></span>
          <span class="logs-title">test · linux · stable</span>
          <Chip :mono="true" tone="ok">1m 48s</Chip>
          <span class="spacer" />
          <Chip :mono="true">ubuntu-24.04</Chip>
          <Chip :mono="true">4 vCPU · 16 GB</Chip>
          <button class="btn btn-sm btn-ghost"><Icon name="search" /></button>
          <button class="btn btn-sm btn-ghost">Raw</button>
        </div>

        <div class="pipelines-logs-body no-scrollbar">
          <pre class="mono logs-pre">
            <div v-for="line in logLines" :key="line.n" class="log-row">
              <span class="tnum log-line-num">{{ line.n }}</span>
              <span class="tnum log-ts">{{ line.ts }}</span>
              <span class="log-content">
                <span
                  v-for="(p, i) in line.parts"
                  :key="i"
                  :style="
                    p.tone === 'highlight'
                      ? { color: lineColor(line.kind), fontWeight: 500 }
                      : p.tone === 'subject'
                        ? { color: 'var(--fg)' }
                        : undefined
                  "
                >{{ p.text }}</span>
              </span>
            </div>
            <div class="log-tail">
              <span class="live-dot" />
              <span>Streaming complete · job exited 0</span>
            </div>
          </pre>
        </div>

        <div class="hairline-t pipelines-logs-foot">
          <span class="logs-summary">248 tests · 0 failed · 0 skipped · 1.71s</span>
          <span class="spacer" />
          <button class="btn btn-sm"><Icon name="eye" /><span>Coverage 84%</span></button>
          <button class="btn btn-sm">Download artifact ↓</button>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.pipelines-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.pipelines-header {
  padding: 14px 22px;
}

.pipelines-breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.ok-icon { color: var(--ok); display: inline-flex; }
.crumb-faint { font-size: 11px; color: var(--fg-3); }
.crumb-active { font-size: 11px; color: var(--fg); }
.crumb-sep { color: var(--fg-4); }
.spacer { flex: 1; }
.accent { color: var(--accent); }

.pipelines-titlerow {
  display: flex;
  align-items: flex-end;
  gap: 18px;
}
.pipelines-title {
  font-size: 24px;
  line-height: 1.1;
  margin: 0;
  font-weight: 400;
  flex: 1;
}
.pipelines-kv {
  display: flex;
  gap: 18px;
  font-size: 11px;
  color: var(--fg-3);
}

.stage-bar {
  margin-top: 14px;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 4px;
}
.stage { position: relative; padding-top: 6px; }
.stage-track {
  height: 4px;
  border-radius: 999px;
  opacity: 0.8;
}
.stage-label-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-top: 6px;
}
.stage-label { font-size: 12px; color: var(--fg-2); }
.stage-label.is-active { color: var(--fg); font-weight: 500; }
.stage-time { font-size: 10.5px; color: var(--fg-3); }
.stage-check { display: inline-flex; }

.pipelines-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.pipelines-dag-pane {
  width: 380px;
  flex-shrink: 0;
  padding: 16px 12px 16px 16px;
  overflow-y: auto;
  background: var(--surface);
}
.pipelines-dag-head {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
}

.dag {
  position: relative;
}
.dag-svg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.dag-node {
  position: absolute;
  height: 36px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 10px;
  background: var(--bg-2);
  border: 0.5px solid var(--line-2);
  border-radius: 8px;
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.04) inset;
}
.dag-node.is-active {
  background: var(--surface-3);
  border-color: var(--accent-line);
  box-shadow: 0 0 0 3px var(--accent-soft);
}
.dag-node-icon {
  width: 18px;
  height: 18px;
  border-radius: 5px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.dag-node-label {
  font-size: 11.5px;
  color: var(--fg);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dag-node-time {
  font-size: 10px;
  color: var(--fg-3);
}

.pipelines-logs {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.pipelines-logs-head {
  padding: 10px 18px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.logs-title { font-size: 13px; color: var(--fg); font-weight: 500; }

.pipelines-logs-body {
  flex: 1;
  overflow: auto;
  background: var(--bg-2);
}
.logs-pre {
  margin: 0;
  padding: 12px 0;
  font-size: 11.5px;
  line-height: 1.55;
  color: var(--fg-2);
}
.log-row {
  display: flex;
  gap: 14px;
  padding: 0 18px;
  white-space: pre;
}
.log-line-num { width: 24px; color: var(--fg-4); text-align: right; }
.log-ts { width: 96px; color: var(--fg-4); }
.log-content { flex: 1; }
.log-tail {
  padding: 12px 18px 18px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--fg-3);
  font-size: 11px;
}

.pipelines-logs-foot {
  padding: 10px 18px;
  display: flex;
  align-items: center;
  gap: 14px;
  background: var(--surface);
}
.logs-summary { font-size: 11.5px; color: var(--fg-3); }

@media (max-width: 860px) {
  .pipelines-body { flex-direction: column; }
  .pipelines-dag-pane {
    width: 100%;
    border-right: 0;
    border-bottom: 0.5px solid var(--line);
    max-height: 280px;
  }
}
</style>
