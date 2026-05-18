<script setup lang="ts">
import { computed } from "vue";
import Avi from "../components/Avi.vue";
import Chip from "../components/Chip.vue";
import Icon from "../components/Icon.vue";
import type { IconKey } from "../components/icons";

const props = defineProps<{ groups: string[]; repo: string; id?: string }>();

const repoPath = computed(() =>
  [...props.groups, props.repo].filter(Boolean).join("/"),
);
const prId = computed(() => props.id ?? "247");

type StackState = "approved" | "reviewing" | "pending" | "changes";

interface StackItem {
  id: number;
  title: string;
  state: StackState;
  files: number;
  add: number;
  del: number;
  time: string;
}

const stack: StackItem[] = [
  { id: 1, title: "Extract Atom enum", state: "approved", files: 2, add: 64, del: 18, time: "1h" },
  { id: 2, title: "Introduce HostAdapter", state: "reviewing", files: 3, add: 87, del: 24, time: "1h" },
  { id: 3, title: "Migrate brew + yum", state: "pending", files: 4, add: 218, del: 142, time: "30m" },
  { id: 4, title: "Drop cfg-target on CLI", state: "pending", files: 1, add: 43, del: 4, time: "20m" },
];
const activeIndex = 1;

type TokKind = "key" | "str" | "num" | "cm" | "fn" | "ty" | "pn";
interface Tok {
  k?: TokKind;
  s: string;
}

interface DiffRowData {
  ln: [number | null, number | null];
  k?: "add" | "del";
  toks: Tok[];
  hl?: boolean;
}

function tk(s: string, k?: TokKind): Tok {
  return { s, k };
}

const diff1: DiffRowData[] = [
  { ln: [1, 1], toks: [tk("use ", "key"), tk("std::path::PathBuf;")] },
  { ln: [2, 2], toks: [tk("use ", "key"), tk("async_trait::async_trait;")] },
  { ln: [3, 3], toks: [tk("")] },
  { ln: [4, null], k: "del", toks: [tk("// host module: branch on cfg(target_os)", "cm")] },
  { ln: [5, null], k: "del", toks: [tk("#[", "pn"), tk("cfg", "fn"), tk("(target_os = ", "pn"), tk("\"macos\"", "str"), tk(")]", "pn")] },
  { ln: [6, null], k: "del", toks: [tk("pub use ", "key"), tk("macos::*;")] },
  { ln: [null, 4], k: "add", toks: [tk("/// Per-host capability surface. Implementations live in", "cm")] },
  { ln: [null, 5], k: "add", toks: [tk("/// `host::{macos, linux, windows}` and are picked at boot.", "cm")] },
  { ln: [null, 6], k: "add", toks: [tk("#[", "pn"), tk("async_trait", "fn"), tk("]", "pn")] },
  { ln: [null, 7], k: "add", toks: [tk("pub trait ", "key"), tk("HostAdapter", "ty"), tk(": "), tk("Send ", "ty"), tk("+ "), tk("Sync ", "ty"), tk("{")] },
  { ln: [null, 8], k: "add", hl: true, toks: [tk("    "), tk("async fn ", "key"), tk("resolve", "fn"), tk("(&self, p: &"), tk("PathBuf", "ty"), tk(") -> "), tk("Resolved", "ty"), tk(";")] },
  { ln: [null, 9], k: "add", toks: [tk("    "), tk("async fn ", "key"), tk("spawn", "fn"), tk("(&self, cmd: "), tk("Cmd", "ty"), tk(") -> "), tk("Output", "ty"), tk(";")] },
  { ln: [null, 10], k: "add", toks: [tk("    "), tk("async fn ", "key"), tk("user", "fn"), tk("(&self) -> "), tk("User", "ty"), tk(";")] },
  { ln: [null, 11], k: "add", toks: [tk("    "), tk("async fn ", "key"), tk("privilege", "fn"), tk("(&self) -> "), tk("Privilege", "ty"), tk(";")] },
  { ln: [null, 12], k: "add", toks: [tk("}")] },
];

const diff2: DiffRowData[] = [
  { ln: [12, 14], toks: [tk("")] },
  { ln: [13, 15], toks: [tk("pub fn ", "key"), tk("current", "fn"), tk("() -> "), tk("Box", "ty"), tk("<"), tk("dyn ", "key"), tk("HostAdapter", "ty"), tk("> {")] },
  { ln: [14, 16], k: "del", toks: [tk("    macos::Host::new()")] },
  { ln: [null, 17], k: "add", toks: [tk("    "), tk("#[", "pn"), tk("cfg", "fn"), tk("(target_os = ", "pn"), tk("\"macos\"", "str"), tk(")] ", "pn"), tk("{ "), tk("Box", "ty"), tk("::new(macos::Host) }")] },
  { ln: [null, 18], k: "add", toks: [tk("    "), tk("#[", "pn"), tk("cfg", "fn"), tk("(target_os = ", "pn"), tk("\"linux\"", "str"), tk(")] ", "pn"), tk("{ "), tk("Box", "ty"), tk("::new(linux::Host) }")] },
  { ln: [15, 19], toks: [tk("}")] },
];

interface ReviewerSpec {
  name: string;
  state: "approved" | "commenting" | "pending" | "changes";
  hue: number;
}
const reviewers: ReviewerSpec[] = [
  { name: "@nia", state: "approved", hue: 320 },
  { name: "@jules", state: "commenting", hue: 140 },
  { name: "@kepa", state: "pending", hue: 60 },
];

const reviewerConfig: Record<ReviewerSpec["state"], { c: string; icon: IconKey; label: string }> = {
  approved: { c: "var(--ok)", icon: "check", label: "approved" },
  commenting: { c: "var(--info)", icon: "msg", label: "commenting" },
  pending: { c: "var(--fg-4)", icon: "clock", label: "pending" },
  changes: { c: "var(--err)", icon: "x", label: "requested" },
};

const checks: Array<[string, "ok" | "info"]> = [
  ["build · linux", "ok"],
  ["build · darwin", "ok"],
  ["test · unit", "ok"],
  ["test · e2e", "ok"],
  ["clippy", "ok"],
  ["coverage 84%", "info"],
];

interface MsgSpec {
  author: string;
  hue: number;
  self?: boolean;
  when: string;
  body: string;
}
const messages: MsgSpec[] = [
  {
    author: "@nia",
    hue: 320,
    when: "1h",
    body: "Should resolve() really return a non-fallible Resolved? If the path is unreadable on Windows we lose the error type.",
  },
  {
    author: "@rawkode",
    hue: 215,
    self: true,
    when: "55m",
    body: "Good call. I had it Result<Resolved> in the first draft but it leaked into every action. Compromise: return Resolved with an error variant?",
  },
];
const closingMsg: MsgSpec = {
  author: "@jules",
  hue: 140,
  when: "22m",
  body: "Patch LGTM — but let's name it ResolveError, not Unreadable. It'll grow.",
};

function tokClass(k?: TokKind): string {
  return k ? `tok-${k}` : "";
}

function pipState(i: number): { bg: string; color: string; border: string; shadow: string } {
  const s = stack[i]?.state;
  const isActive = i === activeIndex;
  if (s === "approved") {
    return {
      bg: "var(--ok)",
      color: "#0a0b0e",
      border: "var(--ok)",
      shadow: "none",
    };
  }
  if (isActive) {
    return {
      bg: "var(--accent)",
      color: "#0a0b0e",
      border: "var(--accent)",
      shadow: "0 0 0 4px var(--accent-soft)",
    };
  }
  return {
    bg: "var(--surface-2)",
    color: "var(--fg-3)",
    border: "var(--fg-4)",
    shadow: "none",
  };
}

function stackItemTone(state: StackState) {
  if (state === "approved") return "ok" as const;
  if (state === "reviewing") return "accent" as const;
  return null;
}
</script>

<template>
  <div class="pr-page">
    <header class="hairline-b pr-head">
      <div class="pr-head-row">
        <Chip tone="accent" :dot="true">open</Chip>
        <span class="mono pr-repo">{{ repoPath }}</span>
        <span class="mono pr-num">#{{ prId }}</span>
        <span class="spacer" />
        <button class="btn btn-sm"><Icon name="eye" /><span>Subscribe</span></button>
        <button class="btn btn-sm"><Icon name="dot3" /></button>
      </div>
      <div class="pr-title-row">
        <h1 class="serif pr-title">
          Decouple host adapters from CLI parsing
        </h1>
        <div class="pr-meta">
          <span>
            <span class="mono accent">feat/decouple-host</span>
            →
            <span class="mono fg2">main</span>
          </span>
          <span>opened by <span class="fg2">@rawkode</span> · 2h</span>
        </div>
      </div>

      <div class="pr-stack-strip">
        <template v-for="(s, i) in stack" :key="s.id">
          <div class="pip-wrap">
            <div
              class="pip"
              :style="{
                background: pipState(i).bg,
                color: pipState(i).color,
                borderColor: pipState(i).border,
                boxShadow: pipState(i).shadow,
              }"
            >
              <Icon v-if="s.state === 'approved'" name="check" />
              <span v-else>{{ i + 1 }}</span>
            </div>
            <span
              class="pip-label"
              :class="{ 'is-active': i === activeIndex }"
            >{{ s.title }}</span>
          </div>
          <div
            v-if="i < stack.length - 1"
            class="pip-connector"
            :style="{ background: i < activeIndex ? 'var(--ok)' : 'var(--line-2)' }"
          />
        </template>
      </div>
    </header>

    <div class="pr-body">
      <aside class="hairline-r pr-stack-rail no-scrollbar">
        <div class="stack-rail-head">
          <span class="eyebrow">Review stack</span>
          <span class="spacer" />
          <span class="mono stack-rail-count">4 layers</span>
        </div>
        <div class="stack-rail-list">
          <div
            v-for="(s, i) in stack"
            :key="s.id"
            class="stack-item"
            :class="{ 'is-active': i === activeIndex }"
          >
            <div class="stack-item-head">
              <span class="mono stack-index">{{ i + 1 }}</span>
              <span class="stack-item-title" :class="{ 'is-active': i === activeIndex }">
                {{ s.title }}
              </span>
              <span v-if="s.state === 'approved'" class="ok-icon">
                <Icon name="check" />
              </span>
            </div>
            <div class="stack-item-stats">
              <span class="mono add-num">+{{ s.add }}</span>
              <span class="mono del-num">−{{ s.del }}</span>
              <span class="files-num">{{ s.files }} files</span>
              <span class="spacer" />
              <Chip v-if="stackItemTone(s.state)" :mono="true" :tone="stackItemTone(s.state)!" :dot="true">
                {{ s.state }}
              </Chip>
            </div>
          </div>
        </div>

        <section class="stack-rail-section">
          <div class="eyebrow stack-section-label">Reviewers</div>
          <div
            v-for="r in reviewers"
            :key="r.name"
            class="reviewer-row"
          >
            <Avi :name="r.name.slice(1, 3).toUpperCase()" :hue="r.hue" :size="20" />
            <span class="reviewer-name">{{ r.name }}</span>
            <span class="spacer" />
            <span class="reviewer-state" :style="{ color: reviewerConfig[r.state].c }">
              <Icon :name="reviewerConfig[r.state].icon" />
              <span>{{ reviewerConfig[r.state].label }}</span>
            </span>
          </div>
        </section>

        <section class="stack-rail-section">
          <div class="eyebrow stack-section-label">Checks · 6/6</div>
          <div v-for="[name, state] in checks" :key="name" class="check-row">
            <span :style="{ color: state === 'ok' ? 'var(--ok)' : 'var(--info)' }">
              <Icon :name="state === 'ok' ? 'check' : 'clock'" />
            </span>
            <span class="mono check-name">{{ name }}</span>
          </div>
        </section>
      </aside>

      <section class="pr-diff-pane no-scrollbar">
        <div class="glass ai-summary">
          <div class="ai-summary-head">
            <span class="ai-icon"><Icon name="ai" /></span>
            <span class="eyebrow ai-eyebrow">Layer digest · 2/4</span>
            <span class="spacer" />
            <Chip :mono="true">low risk</Chip>
          </div>
          <div class="serif ai-summary-title">
            Introduce <span class="mono ai-inline-mono">HostAdapter</span> trait
          </div>
          <p class="ai-summary-body">
            Adds a per-OS trait that the action executor uses instead of inline
            <span class="mono fg">cfg(target_os)</span>
            branches. The CLI still owns parsing — only execution is delegated.
            <span class="fg3">3 files touched, 1 new test, no public API change.</span>
          </p>
        </div>

        <div class="file-header">
          <span class="file-icon"><Icon name="file" /></span>
          <span class="mono file-path">crates/comtrya-lib/src/host.rs</span>
          <Chip :mono="true" tone="ok">+87</Chip>
          <Chip :mono="true" tone="err">−24</Chip>
          <span class="spacer" />
          <button class="btn btn-sm btn-ghost">Viewed</button>
          <button class="btn btn-sm btn-ghost"><Icon name="dot3" /></button>
        </div>

        <div class="glass diff-card">
          <div
            v-for="(row, i) in diff1"
            :key="`d1-${i}`"
            class="code-row diff-row"
            :class="{
              'diff-add': row.k === 'add',
              'diff-del': row.k === 'del',
              'diff-hl': row.hl,
            }"
          >
            <span class="mono tnum diff-ln">{{ row.ln[0] ?? "" }}</span>
            <span class="mono tnum diff-ln diff-ln-r">{{ row.ln[1] ?? "" }}</span>
            <span class="diff-marker" :class="{ 'is-add': row.k === 'add', 'is-del': row.k === 'del' }">{{
              row.k === "add" ? "+" : row.k === "del" ? "−" : " "
            }}</span>
            <span class="diff-content">
              <span
                v-for="(t, ti) in row.toks"
                :key="ti"
                :class="tokClass(t.k)"
              >{{ t.s }}</span>
            </span>
          </div>

          <div class="thread">
            <div class="thread-anchor">
              <span class="thread-anchor-icon"><Icon name="msg" /></span>
              <span>
                Conversation on
                <span class="mono fg2">L8 · resolve()</span>
              </span>
              <span class="spacer" />
              <Chip :mono="true" tone="accent" :dot="true">3 unread</Chip>
              <button class="btn btn-sm btn-ghost">Collapse</button>
            </div>

            <div class="thread-messages">
              <div v-for="m in messages" :key="m.author + m.when" class="msg-wrap">
                <Avi :name="m.author.slice(1, 3).toUpperCase()" :hue="m.hue" :size="22" />
                <div class="msg-bubble" :class="{ 'is-self': m.self }">
                  <div class="msg-head">
                    <span class="msg-author">{{ m.author }}</span>
                    <span class="msg-when">{{ m.when }}</span>
                  </div>
                  <p class="msg-body">{{ m.body }}</p>
                </div>
              </div>

              <div class="ai-suggest">
                <span class="ai-suggest-icon"><Icon name="ai" /></span>
                <div class="ai-suggest-content">
                  <div class="ai-suggest-eyebrow">Co-pilot · suggested resolution</div>
                  <p class="ai-suggest-body">
                    Add a <span class="mono fg">Resolved::Unreadable(io::Error)</span> variant.
                    Existing match arms in <span class="mono">file.rs</span> already fall through to
                    <span class="mono">Resolved::Missing</span>, so callers stay source-compatible.
                  </p>
                  <div class="ai-suggest-actions">
                    <button class="btn btn-sm btn-primary">Apply patch</button>
                    <button class="btn btn-sm">Show diff</button>
                    <button class="btn btn-sm btn-ghost">Dismiss</button>
                  </div>
                </div>
              </div>

              <div class="msg-wrap">
                <Avi :name="closingMsg.author.slice(1, 3).toUpperCase()" :hue="closingMsg.hue" :size="22" />
                <div class="msg-bubble">
                  <div class="msg-head">
                    <span class="msg-author">{{ closingMsg.author }}</span>
                    <span class="msg-when">{{ closingMsg.when }}</span>
                  </div>
                  <p class="msg-body">{{ closingMsg.body }}</p>
                </div>
              </div>
            </div>

            <div class="thread-compose">
              <Avi name="DM" :hue="215" :size="22" />
              <div class="compose-bubble">
                <div class="compose-prompt">
                  Reply or <span class="kbd">/</span> for actions…
                </div>
                <div class="compose-actions">
                  <Chip :mono="true">/approve</Chip>
                  <Chip :mono="true">/request-changes</Chip>
                  <Chip :mono="true">/suggest</Chip>
                  <Chip :mono="true">/ask co-pilot</Chip>
                  <span class="spacer" />
                  <button class="btn btn-sm">Resolve thread</button>
                  <button class="btn btn-sm btn-primary">Reply</button>
                </div>
              </div>
            </div>
          </div>

          <div class="hairline-t diff-continued">
            <div
              v-for="(row, i) in diff2"
              :key="`d2-${i}`"
              class="code-row diff-row"
              :class="{
                'diff-add': row.k === 'add',
                'diff-del': row.k === 'del',
              }"
            >
              <span class="mono tnum diff-ln">{{ row.ln[0] ?? "" }}</span>
              <span class="mono tnum diff-ln diff-ln-r">{{ row.ln[1] ?? "" }}</span>
              <span class="diff-marker" :class="{ 'is-add': row.k === 'add', 'is-del': row.k === 'del' }">{{
                row.k === "add" ? "+" : row.k === "del" ? "−" : " "
              }}</span>
              <span class="diff-content">
                <span
                  v-for="(t, ti) in row.toks"
                  :key="ti"
                  :class="tokClass(t.k)"
                >{{ t.s }}</span>
              </span>
            </div>
          </div>
        </div>

        <div class="layer-controls">
          <button class="btn"><Icon name="check" /><span>Approve layer 2</span></button>
          <button class="btn"><Icon name="msg" /><span>Request changes</span></button>
          <button class="btn btn-ghost">Skip to next layer →</button>
          <span class="spacer" />
          <span class="layer-hint">
            Reviewing <span class="mono">2 of 4</span> · <span class="mono">⌘↓</span> next
          </span>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.pr-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.pr-head { padding: 14px 24px; }
.pr-head-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.pr-repo { font-size: 11px; color: var(--fg-3); }
.pr-num { font-size: 11px; color: var(--fg-4); }
.spacer { flex: 1; }

.pr-title-row {
  display: flex;
  align-items: flex-end;
  gap: 14px;
}
.pr-title {
  font-size: 26px;
  line-height: 1.1;
  margin: 0;
  font-weight: 400;
  letter-spacing: -0.01em;
  flex: 1;
}
.pr-meta {
  display: flex;
  gap: 14px;
  font-size: 11px;
  color: var(--fg-3);
}
.accent { color: var(--accent); }
.fg2 { color: var(--fg-2); }
.fg3 { color: var(--fg-3); }
.fg { color: var(--fg); }

.pr-stack-strip {
  margin-top: 16px;
  display: flex;
  align-items: center;
  gap: 0;
}
.pip-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
  position: relative;
}
.pip {
  width: 24px;
  height: 24px;
  border-radius: 999px;
  border: 0.5px solid;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
}
.pip-label {
  font-size: 11.5px;
  color: var(--fg-3);
}
.pip-label.is-active {
  color: var(--fg);
  font-weight: 500;
}
.pip-connector {
  flex: 1;
  height: 1.5px;
  margin: 0 2px;
}

.pr-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.pr-stack-rail {
  width: 280px;
  flex-shrink: 0;
  padding: 14px 0;
  overflow-y: auto;
  background: var(--surface);
}
.stack-rail-head {
  padding: 0 16px 8px;
  display: flex;
  align-items: baseline;
  gap: 6px;
}
.stack-rail-count {
  font-size: 10px;
  color: var(--fg-3);
}
.stack-rail-list {
  padding: 0 8px;
}
.stack-item {
  padding: 10px 10px;
  border-radius: 10px;
  margin-bottom: 4px;
  border: 0.5px solid transparent;
}
.stack-item.is-active {
  border-color: var(--accent-line);
  background: var(--surface-2);
}
.stack-item-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}
.stack-index {
  font-size: 10px;
  color: var(--fg-3);
  width: 18px;
  height: 18px;
  border-radius: 5px;
  background: var(--surface);
  border: 0.5px solid var(--line);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.stack-item-title {
  flex: 1;
  font-size: 12.5px;
  color: var(--fg-2);
}
.stack-item-title.is-active {
  color: var(--fg);
  font-weight: 500;
}
.ok-icon { color: var(--ok); display: inline-flex; }

.stack-item-stats {
  display: flex;
  align-items: center;
  gap: 6px;
  padding-left: 26px;
}
.add-num { font-size: 10.5px; color: var(--ok); }
.del-num { font-size: 10.5px; color: var(--err); }
.files-num { font-size: 10.5px; color: var(--fg-4); }

.stack-rail-section {
  padding: 16px 16px 0;
  margin-top: 8px;
  border-top: 0.5px solid var(--line);
}
.stack-section-label { margin-bottom: 8px; }

.reviewer-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 0;
}
.reviewer-name {
  font-size: 12px;
  color: var(--fg);
}
.reviewer-state {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
}

.check-row {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 4px 0;
  font-size: 11.5px;
}
.check-name { color: var(--fg-2); }

.pr-diff-pane {
  flex: 1;
  overflow-y: auto;
  padding: 18px 22px;
}

.ai-summary {
  padding: 14px;
  margin-bottom: 18px;
  border-color: oklch(78% 0.14 280 / 0.30);
  background: linear-gradient(135deg, oklch(78% 0.14 280 / 0.10), var(--glass));
}
.ai-summary-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.ai-icon { color: oklch(80% 0.14 280); display: inline-flex; }
.ai-eyebrow { color: oklch(80% 0.14 280); }
.ai-summary-title {
  font-size: 18px;
  color: var(--fg);
  margin-bottom: 6px;
  font-weight: 400;
}
.ai-inline-mono { font-size: 15px; }
.ai-summary-body {
  font-size: 12.5px;
  color: var(--fg-2);
  line-height: 1.6;
  margin: 0;
}

.file-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}
.file-icon { color: var(--fg-3); display: inline-flex; }
.file-path {
  font-size: 12.5px;
  color: var(--fg);
}

.diff-card {
  padding: 0;
  overflow: hidden;
}
.diff-row {
  display: flex;
  gap: 0;
  background: transparent;
  border-left: 2px solid transparent;
  padding-left: 2px;
}
.diff-row.diff-add { background: var(--add); }
.diff-row.diff-del { background: var(--del); }
.diff-row.diff-hl {
  border-left: 2px solid var(--accent);
  padding-left: 0;
}
.diff-ln {
  width: 42px;
  padding: 1px 8px 1px 0;
  text-align: right;
  color: var(--fg-4);
  flex-shrink: 0;
}
.diff-ln-r { border-right: 0.5px solid var(--line); }
.diff-marker {
  width: 18px;
  text-align: center;
  color: var(--fg-4);
  flex-shrink: 0;
}
.diff-marker.is-add { color: var(--ok); }
.diff-marker.is-del { color: var(--err); }
.diff-content {
  flex: 1;
  color: var(--fg);
  padding: 1px 6px;
  white-space: pre;
}

.thread {
  background: var(--surface);
  border-top: 0.5px solid var(--line);
  border-bottom: 0.5px solid var(--line);
  padding: 10px 14px 14px;
}
.thread-anchor {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: var(--fg-3);
  margin-bottom: 10px;
}
.thread-anchor-icon { color: var(--accent); display: inline-flex; }

.thread-messages {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.msg-wrap {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}
.msg-bubble {
  flex: 1;
  padding: 8px 12px;
  border-radius: 10px;
  background: var(--bg-2);
  border: 0.5px solid var(--line);
}
.msg-bubble.is-self {
  background: var(--accent-soft);
  border-color: var(--accent-line);
}
.msg-head {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 4px;
}
.msg-author {
  font-size: 12px;
  font-weight: 500;
  color: var(--fg);
}
.msg-when { font-size: 11px; color: var(--fg-3); }
.msg-body {
  font-size: 12.5px;
  color: var(--fg-2);
  line-height: 1.55;
  margin: 0;
}

.ai-suggest {
  margin-left: 32px;
  padding: 10px 12px;
  border-radius: 10px;
  background: oklch(78% 0.14 280 / 0.10);
  border: 0.5px solid oklch(78% 0.14 280 / 0.25);
  display: flex;
  gap: 10px;
}
.ai-suggest-icon {
  color: oklch(80% 0.14 280);
  flex-shrink: 0;
  margin-top: 1px;
  display: inline-flex;
}
.ai-suggest-content { flex: 1; }
.ai-suggest-eyebrow {
  font-size: 11px;
  color: oklch(80% 0.14 280);
  margin-bottom: 4px;
}
.ai-suggest-body {
  font-size: 12px;
  color: var(--fg-2);
  line-height: 1.55;
  margin: 0 0 8px;
}
.ai-suggest-actions {
  display: flex;
  gap: 6px;
}

.thread-compose {
  margin-top: 12px;
  display: flex;
  gap: 10px;
  align-items: flex-start;
}
.compose-bubble {
  flex: 1;
  border-radius: 10px;
  background: var(--bg-2);
  border: 0.5px solid var(--line-2);
  padding: 8px 10px;
}
.compose-prompt {
  font-size: 12px;
  color: var(--fg-3);
}
.compose-actions {
  display: flex;
  gap: 4px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.diff-continued { padding: 0; }

.layer-controls {
  margin-top: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.layer-hint {
  font-size: 11px;
  color: var(--fg-3);
}

@media (max-width: 860px) {
  .pr-body { flex-direction: column; }
  .pr-stack-rail {
    width: 100%;
    border-right: 0;
    border-bottom: 0.5px solid var(--line);
    max-height: 320px;
  }
  .pip-label { display: none; }
}
</style>
