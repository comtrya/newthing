<script setup lang="ts">
import { computed, h, type VNode } from "vue";
import Avi from "../components/Avi.vue";
import Chip from "../components/Chip.vue";
import Icon from "../components/Icon.vue";

const props = defineProps<{ groups: string[]; repo: string }>();

const ownerName = computed(() => props.groups[0] ?? "workspace");
const repoName = computed(() => props.repo);
const repoSubpath = computed(() => props.groups.slice(1));

interface TabSpec {
  label: string;
  to?: string;
  active?: boolean;
  count?: string;
}
const repoBase = computed(() => `/r/${[...props.groups, props.repo].join("/")}`);
const tabs = computed<TabSpec[]>(() => [
  { label: "Overview", to: repoBase.value },
  { label: "Code", to: `${repoBase.value}/code`, active: true },
  { label: "PRs", to: `${repoBase.value}/pulls`, count: "12" },
  { label: "Issues", to: `${repoBase.value}/issues/board`, count: "31" },
  { label: "CI", to: `${repoBase.value}/pipelines` },
  { label: "Releases", to: `${repoBase.value}/releases` },
]);

interface TreeRowData {
  depth: number;
  icon: "folder" | "file";
  name: string;
  hint?: string;
  active?: boolean;
}

const treeRows: TreeRowData[] = [
  { depth: 0, icon: "folder", name: ".github" },
  { depth: 0, icon: "folder", name: "crates" },
  { depth: 1, icon: "folder", name: "comtrya" },
  { depth: 1, icon: "folder", name: "comtrya-actions" },
  { depth: 2, icon: "folder", name: "src" },
  { depth: 3, icon: "file", name: "actions.rs", hint: "2.1k" },
  { depth: 3, icon: "file", name: "brew.rs", hint: "412", active: true },
  { depth: 3, icon: "file", name: "file.rs", hint: "318" },
  { depth: 3, icon: "file", name: "git.rs", hint: "540" },
  { depth: 3, icon: "file", name: "package.rs", hint: "822" },
  { depth: 3, icon: "file", name: "yum.rs", hint: "291" },
  { depth: 2, icon: "file", name: "Cargo.toml", hint: "44" },
  { depth: 1, icon: "folder", name: "comtrya-cli" },
  { depth: 1, icon: "folder", name: "comtrya-lib" },
  { depth: 0, icon: "folder", name: "docs" },
  { depth: 0, icon: "folder", name: "examples" },
  { depth: 0, icon: "folder", name: "tests" },
  { depth: 0, icon: "file", name: ".gitignore", hint: "38" },
  { depth: 0, icon: "file", name: "Cargo.lock", hint: "3.2k" },
  { depth: 0, icon: "file", name: "Cargo.toml", hint: "62" },
  { depth: 0, icon: "file", name: "LICENSE", hint: "MPL" },
  { depth: 0, icon: "file", name: "README.md", hint: "4.1k" },
  { depth: 0, icon: "file", name: "flake.nix", hint: "118" },
];

type TokKind = "key" | "str" | "num" | "cm" | "fn" | "ty" | "pn";
interface Tok {
  k?: TokKind;
  s: string;
}
type CodeLine = { n: number; toks: Tok[] };

function tk(s: string, k?: TokKind): Tok {
  return { s, k };
}

const codeLines: CodeLine[] = [
  { n: 1, toks: [tk("// crates/comtrya-actions/src/brew.rs", "cm")] },
  { n: 2, toks: [tk("// Wraps `brew install` with retries on transient 5xx/network errors.", "cm")] },
  { n: 3, toks: [tk("")] },
  { n: 4, toks: [tk("use ", "key"), tk("std::time::Duration;")] },
  { n: 5, toks: [tk("use ", "key"), tk("tokio_retry::{strategy::ExponentialBackoff, Retry};")] },
  { n: 6, toks: [tk("use ", "key"), tk("tracing::{debug, info, warn};")] },
  { n: 7, toks: [tk("")] },
  { n: 8, toks: [tk("use ", "key"), tk("crate", "pn"), tk("::{Action, ActionResult, Atom, Context};")] },
  { n: 9, toks: [tk("")] },
  { n: 10, toks: [tk("/// `brew install` with retry-on-transient.", "cm")] },
  { n: 11, toks: [tk("/// Defaults: 5 attempts, 800ms base, capped at 10s.", "cm")] },
  { n: 12, toks: [tk("#[", "pn"), tk("derive", "fn"), tk("(Debug, Clone, serde::Deserialize)]", "pn")] },
  { n: 13, toks: [tk("pub struct ", "key"), tk("BrewInstall ", "ty"), tk("{", "pn")] },
  { n: 14, toks: [tk("    "), tk("pub ", "key"), tk("list: "), tk("Vec", "ty"), tk("<"), tk("String", "ty"), tk(">,")] },
  { n: 15, toks: [tk("    "), tk("#[", "pn"), tk("serde"), tk("(default)", "pn"), tk("]")] },
  { n: 16, toks: [tk("    "), tk("pub ", "key"), tk("retry: "), tk("RetryPolicy", "ty"), tk(",")] },
  { n: 17, toks: [tk("}", "pn")] },
  { n: 18, toks: [tk("")] },
  { n: 19, toks: [tk("#[", "pn"), tk("async_trait", "fn"), tk("::async_trait]", "pn")] },
  { n: 20, toks: [tk("impl ", "key"), tk("Action ", "ty"), tk("for ", "key"), tk("BrewInstall ", "ty"), tk("{", "pn")] },
  { n: 21, toks: [tk("    "), tk("async fn ", "key"), tk("plan", "fn"), tk("(", "pn"), tk("&self, ctx: &"), tk("Context", "ty"), tk(")", "pn"), tk(" -> "), tk("Vec", "ty"), tk("<"), tk("Atom", "ty"), tk("> {")] },
  { n: 22, toks: [tk("        "), tk("let ", "key"), tk("missing = self.list.iter()")] },
  { n: 23, toks: [tk("            .filter("), tk("|p|", "pn"), tk(" !ctx.brew.has(p))")] },
  { n: 24, toks: [tk("            .cloned()")] },
  { n: 25, toks: [tk("            .collect::<"), tk("Vec", "ty"), tk("<"), tk("_", "ty"), tk(">>();")] },
  { n: 26, toks: [tk("        debug!("), tk("?", "pn"), tk("missing, "), tk("\"brew install plan\"", "str"), tk(");")] },
  { n: 27, toks: [tk("        missing.into_iter().map("), tk("Atom", "ty"), tk("::BrewInstall).collect()")] },
  { n: 28, toks: [tk("    "), tk("}", "pn")] },
  { n: 29, toks: [tk("")] },
  { n: 30, toks: [tk("    "), tk("async fn ", "key"), tk("apply", "fn"), tk("(", "pn"), tk("&self, atom: "), tk("Atom", "ty"), tk(")", "pn"), tk(" -> "), tk("ActionResult", "ty"), tk(" {")] },
  { n: 31, toks: [tk("        "), tk("let ", "key"), tk("strat = "), tk("ExponentialBackoff", "ty"), tk("::from_millis("), tk("800", "num"), tk(")")] },
  { n: 32, toks: [tk("            .max_delay("), tk("Duration", "ty"), tk("::from_secs("), tk("10", "num"), tk("))")] },
  { n: 33, toks: [tk("            .take(self.retry.attempts);")] },
  { n: 34, toks: [tk("        "), tk("Retry", "ty"), tk("::spawn(strat, || "), tk("brew_exec", "fn"), tk("(atom.clone())).await")] },
  { n: 35, toks: [tk("    "), tk("}", "pn")] },
  { n: 36, toks: [tk("}", "pn")] },
];

function tokClass(k?: TokKind): string {
  if (!k) return "";
  return `tok-${k}`;
}
</script>

<template>
  <div class="repo-code-page">
    <header class="hairline-b repo-code-head">
      <span class="repo-head-folder"><Icon name="folder" /></span>
      <span class="mono repo-owner">{{ ownerName }}</span>
      <span class="path-sep">/</span>
      <span class="mono repo-name">{{ repoName }}</span>
      <span v-for="seg in repoSubpath" :key="seg" class="path-subseg">
        <span class="path-sep">/</span>
        <span class="mono repo-name">{{ seg }}</span>
      </span>
      <Chip :mono="true" tone="info" class="repo-private">private</Chip>
      <span class="spacer" />
      <nav class="repo-tabs">
        <RouterLink
          v-for="tab in tabs"
          :key="tab.label"
          :to="tab.to ?? '#'"
          class="tab"
          :class="{ 'is-on': tab.active }"
        >
          <span>{{ tab.label }}</span>
          <span v-if="tab.count" class="count">{{ tab.count }}</span>
        </RouterLink>
      </nav>
    </header>

    <div class="hairline-b repo-code-subbar">
      <button class="btn btn-sm">
        <Icon name="branch" />
        <span class="mono">main</span>
        <Icon name="chevD" />
      </button>
      <span class="mono subbar-meta">247 branches</span>
      <span class="path-sep">·</span>
      <span class="mono subbar-meta">14 tags</span>
      <span class="spacer" />
      <div class="goto-file">
        <Icon name="search" />
        <span>Go to file</span>
        <span class="spacer" />
        <span class="kbd">t</span>
      </div>
      <button class="btn btn-sm">
        <Icon name="terminal" />
        <span>Code</span>
        <Icon name="chevD" />
      </button>
      <button class="btn btn-sm btn-primary">
        <Icon name="plus" />
        <span>Add</span>
      </button>
    </div>

    <div class="repo-code-body">
      <aside class="hairline-r repo-tree no-scrollbar">
        <header class="tree-head">
          <span class="eyebrow">Tree</span>
          <span class="spacer" />
          <span class="tree-filter"><Icon name="filter" /></span>
        </header>
        <div
          v-for="(row, i) in treeRows"
          :key="i"
          class="tree-row"
          :class="{ 'is-active': row.active }"
          :style="{ paddingLeft: `${10 + row.depth * 14}px` }"
        >
          <span class="tree-icon"><Icon :name="row.icon" /></span>
          <span class="mono trunc tree-name">{{ row.name }}</span>
          <span v-if="row.hint" class="mono tree-hint">{{ row.hint }}</span>
        </div>
      </aside>

      <section class="repo-viewer">
        <div class="hairline-b viewer-crumbs">
          <span class="mono crumb">crates</span>
          <span class="path-sep">/</span>
          <span class="mono crumb">comtrya-actions</span>
          <span class="path-sep">/</span>
          <span class="mono crumb">src</span>
          <span class="path-sep">/</span>
          <span class="mono crumb crumb-active">brew.rs</span>
          <span class="spacer" />
          <span class="file-meta">412 lines · 11.8 KB · LF · UTF-8</span>
        </div>

        <div class="hairline-b viewer-last-commit">
          <Avi name="David Mc" :hue="215" :size="20" />
          <span class="commit-user">@rawkode</span>
          <span class="commit-msg">brew(retry): exponential backoff on 429/5xx</span>
          <span class="spacer" />
          <span class="mono commit-sha">d3a91f4</span>
          <span class="commit-when">2 hours ago</span>
          <span class="commit-ci">
            <Icon name="check" />
            <span>passing</span>
          </span>
          <button class="btn btn-sm btn-ghost"><Icon name="dot3" /></button>
        </div>

        <div class="viewer-toolbar">
          <button class="btn btn-sm btn-ghost is-on">Source</button>
          <button class="btn btn-sm btn-ghost">Blame</button>
          <button class="btn btn-sm btn-ghost">History</button>
          <span class="spacer" />
          <button class="btn btn-sm btn-ghost"><Icon name="ai" /><span>Explain</span></button>
          <button class="btn btn-sm btn-ghost">Raw</button>
          <button class="btn btn-sm btn-ghost">Edit</button>
        </div>

        <div class="viewer-body no-scrollbar">
          <pre class="code-row code-pre">
<div v-for="line in codeLines" :key="line.n" class="code-line">
<span class="gutter mono tnum code-lineno">{{ line.n }}</span><span class="code-tokens"><span v-for="(t, i) in line.toks" :key="i" :class="tokClass(t.k)">{{ t.s }}</span></span></div>
          </pre>

          <div class="glass ai-digest">
            <div class="ai-digest-head">
              <span class="ai-digest-icon"><Icon name="ai" /></span>
              <span class="eyebrow ai-digest-eyebrow">Co-pilot · file digest</span>
              <span class="spacer" />
              <span class="kbd">⌘.</span>
            </div>
            <p class="ai-digest-body">
              This file implements the <span class="mono inline-mono">BrewInstall</span> action.
              It plans by diffing against the installed-formulae cache held on <span class="mono">ctx.brew</span>,
              then runs each missing formula through an <span class="text-fg">exponential-backoff retry</span> on
              transient errors. <span class="muted">3 functions, no panic paths, cyclomatic complexity 4.</span>
            </p>
            <div class="ai-digest-actions">
              <button class="btn btn-sm">Ask about this</button>
              <button class="btn btn-sm">Show test coverage</button>
              <button class="btn btn-sm">Find callers</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.repo-code-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.repo-code-head {
  padding: 14px 22px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.repo-head-folder { color: var(--fg-3); display: inline-flex; }
.repo-owner { font-size: 13px; color: var(--fg-3); }
.repo-name { font-size: 14px; color: var(--fg); font-weight: 600; }
.path-sep { color: var(--fg-4); }
.path-subseg { display: contents; }
.repo-private { margin-left: 4px; }
.spacer { flex: 1; }
.repo-tabs { display: flex; gap: 0; }
.repo-tabs .tab { height: 26px; padding: 0 9px; }

.repo-code-subbar {
  padding: 10px 22px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.subbar-meta { font-size: 11.5px; color: var(--fg-3); }
.goto-file {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 10px;
  height: 26px;
  width: 240px;
  border-radius: 7px;
  background: var(--surface);
  border: 0.5px solid var(--line);
  color: var(--fg-3);
  font-size: 12px;
}

.repo-code-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.repo-tree {
  width: 260px;
  flex-shrink: 0;
  padding: 10px 6px;
  overflow-y: auto;
  background: var(--surface);
}
.tree-head {
  padding: 0 8px 8px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.tree-filter { color: var(--fg-4); display: inline-flex; }
.tree-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding-top: 4px;
  padding-bottom: 4px;
  padding-right: 10px;
  border-radius: 6px;
  color: var(--fg-2);
  background: transparent;
  font-size: 12px;
  height: 24px;
}
.tree-row.is-active {
  color: var(--fg);
  background: var(--surface-2);
}
.tree-icon { color: var(--fg-3); display: inline-flex; }
.tree-name {
  flex: 1;
  font-family: var(--font-mono);
  font-size: 11.5px;
}
.tree-hint {
  font-size: 10px;
  color: var(--fg-4);
}

.repo-viewer {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.viewer-crumbs {
  padding: 10px 18px;
  display: flex;
  align-items: center;
  gap: 4px;
}
.crumb {
  font-size: 12px;
  color: var(--fg-3);
}
.crumb-active { color: var(--fg); }
.file-meta {
  font-size: 11px;
  color: var(--fg-3);
}

.viewer-last-commit {
  padding: 10px 18px;
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--surface);
}
.commit-user { font-size: 12px; color: var(--fg); }
.commit-msg { font-size: 12px; color: var(--fg-2); }
.commit-sha {
  font-size: 11px;
  color: var(--accent);
}
.commit-when { font-size: 11px; color: var(--fg-3); }
.commit-ci {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--ok);
  font-size: 11px;
}

.viewer-toolbar {
  padding: 8px 18px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}
.btn-ghost.is-on { color: var(--fg); }

.viewer-body {
  flex: 1;
  overflow: auto;
  padding: 0 6px 20px;
}

.code-pre {
  margin: 0;
  padding: 0 12px;
}
.code-line {
  display: flex;
  gap: 16px;
  padding-left: 4px;
  white-space: pre;
}
.code-lineno {
  width: 32px;
  text-align: right;
  flex-shrink: 0;
}
.code-tokens {
  color: var(--fg-2);
  white-space: pre;
}

.ai-digest {
  margin: 14px 18px 0;
  padding: 14px;
  background: linear-gradient(135deg, oklch(78% 0.14 280 / 0.10), var(--glass));
  border-color: oklch(78% 0.14 280 / 0.30);
}
.ai-digest-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.ai-digest-icon { color: oklch(80% 0.14 280); display: inline-flex; }
.ai-digest-eyebrow { color: oklch(80% 0.14 280); }
.ai-digest-body {
  font-size: 12px;
  color: var(--fg-2);
  line-height: 1.55;
  margin: 0;
}
.inline-mono { color: var(--fg); }
.text-fg { color: var(--fg); }
.muted { color: var(--fg-3); }
.ai-digest-actions {
  display: flex;
  gap: 6px;
  margin-top: 10px;
}

@media (max-width: 860px) {
  .repo-code-body { flex-direction: column; }
  .repo-tree {
    width: 100%;
    max-height: 240px;
    border-right: 0;
    border-bottom: 0.5px solid var(--line);
  }
  .repo-tabs { display: none; }
}
</style>
