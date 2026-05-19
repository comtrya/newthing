<script setup lang="ts">
import { computed } from "vue";
import Avi from "../components/Avi.vue";
import Chip from "../components/Chip.vue";
import Icon from "../components/Icon.vue";
import type { IconKey } from "../components/icons";

const props = defineProps<{ groups: string[]; repo: string }>();
const repoPath = computed(() =>
  [...props.groups, props.repo].filter(Boolean).join(" / "),
);

interface FilterRowSpec {
  icon?: IconKey;
  dot?: string;
  av?: string;
  hue?: number;
  name: string;
  count?: string;
  active?: boolean;
}

interface FilterGroupSpec {
  title: string;
  rows: FilterRowSpec[];
}

const filterGroups: FilterGroupSpec[] = [
  {
    title: "State",
    rows: [
      { icon: "issue", name: "Open", count: "31", active: true },
      { icon: "check", name: "Closed", count: "248" },
    ],
  },
  {
    title: "Type",
    rows: [
      { dot: "oklch(70% 0.19 25)", name: "bug", count: "14" },
      { dot: "oklch(78% 0.14 215)", name: "enhancement", count: "9" },
      { dot: "oklch(80% 0.13 130)", name: "docs", count: "4" },
      { dot: "oklch(80% 0.14 80)", name: "question", count: "3" },
      { dot: "oklch(72% 0.16 280)", name: "discussion", count: "1" },
    ],
  },
  {
    title: "Milestones",
    rows: [
      { icon: "tag", name: "v0.10 — DAG runs", count: "12 of 18" },
      { icon: "tag", name: "v0.11 — Windows", count: "0 of 9" },
      { icon: "tag", name: "Backlog", count: "11" },
    ],
  },
  {
    title: "People",
    rows: [
      { av: "DM", hue: 215, name: "@rawkode", count: "14" },
      { av: "NI", hue: 320, name: "@nia", count: "8" },
      { av: "JU", hue: 140, name: "@jules", count: "4" },
      { av: "KE", hue: 60, name: "@kepa", count: "2" },
    ],
  },
];

interface TagSpec {
  name: string;
  color: string;
}

interface ReactionSpec {
  emoji: string;
  count: number;
}

interface IssueRowSpec {
  title: string;
  num: number;
  age: string;
  comments: number;
  tags: TagSpec[];
  milestone: string | null;
  assignee: { initials: string; hue: number } | null;
  state: "open" | "closed";
  pinned?: boolean;
  reactions?: ReactionSpec[];
  comment?: string;
}

const issues: IssueRowSpec[] = [
  {
    title: "Workers should respect $COMTRYA_PARALLELISM",
    num: 252,
    age: "12m",
    comments: 0,
    tags: [{ name: "bug", color: "oklch(70% 0.19 25)" }],
    milestone: "v0.10",
    assignee: { initials: "DM", hue: 215 },
    state: "open",
    reactions: [{ emoji: "👀", count: 3 }],
  },
  {
    title: "Idempotency check fails on macOS 14 ARM when /opt/homebrew is non-default",
    num: 248,
    age: "2h",
    comments: 7,
    tags: [
      { name: "bug", color: "oklch(70% 0.19 25)" },
      { name: "macos", color: "var(--fg-4)" },
    ],
    milestone: "v0.10",
    assignee: { initials: "NI", hue: 320 },
    state: "open",
    pinned: true,
    reactions: [
      { emoji: "👍", count: 8 },
      { emoji: "🙏", count: 2 },
    ],
    comment: "Confirmed on M3 — workaround in #240",
  },
  {
    title: "Add Wezterm action for terminal config drops",
    num: 245,
    age: "5h",
    comments: 2,
    tags: [{ name: "enhancement", color: "oklch(78% 0.14 215)" }],
    milestone: "v0.11",
    assignee: null,
    state: "open",
    reactions: [{ emoji: "💯", count: 4 }],
  },
  {
    title: "Docs: explain DAG ordering when two actions touch the same file",
    num: 244,
    age: "8h",
    comments: 1,
    tags: [{ name: "docs", color: "oklch(80% 0.13 130)" }],
    milestone: "v0.10",
    assignee: { initials: "JU", hue: 140 },
    state: "open",
  },
  {
    title: "Run brew updates in batched mode by default (perf)",
    num: 243,
    age: "1d",
    comments: 11,
    tags: [
      { name: "enhancement", color: "oklch(78% 0.14 215)" },
      { name: "perf", color: "oklch(80% 0.14 80)" },
    ],
    milestone: "v0.11",
    assignee: { initials: "DM", hue: 215 },
    state: "open",
    reactions: [
      { emoji: "👍", count: 14 },
      { emoji: "🚀", count: 6 },
      { emoji: "👀", count: 2 },
    ],
    comment: "On a fresh laptop this is ~38s → ~9s in my benchmark.",
  },
  {
    title: "Question: can manifests import other manifests by URL?",
    num: 241,
    age: "2d",
    comments: 4,
    tags: [{ name: "question", color: "oklch(80% 0.14 80)" }],
    milestone: null,
    assignee: null,
    state: "open",
  },
  {
    title: "Windows: privilege escalation surface needs a clear story",
    num: 235,
    age: "4d",
    comments: 18,
    tags: [
      { name: "discussion", color: "oklch(72% 0.16 280)" },
      { name: "windows", color: "var(--fg-4)" },
    ],
    milestone: "v0.11",
    assignee: { initials: "KE", hue: 60 },
    state: "open",
    reactions: [
      { emoji: "💬", count: 18 },
      { emoji: "🧠", count: 5 },
    ],
  },
];

function tagStyle(color: string) {
  return {
    color,
    borderColor: `${color}55`,
    background: `${color}1a`,
  };
}
</script>

<template>
  <div class="issues-page">
    <header class="hairline-b issues-head">
      <div>
        <div class="eyebrow">{{ repoPath }} · 31 open</div>
        <h1 class="serif issues-title">Issues</h1>
      </div>
      <span class="spacer" />
      <div class="issues-search">
        <Icon name="search" />
        <span>is:open assignee:@me</span>
        <span class="spacer" />
        <span class="kbd">/</span>
      </div>
      <button class="btn"><Icon name="filter" /><span>Saved views</span><Icon name="chevD" /></button>
      <button class="btn btn-primary"><Icon name="plus" /><span>New issue</span></button>
    </header>

    <div class="issues-body">
      <aside class="hairline-r issues-filters no-scrollbar">
        <div v-for="g in filterGroups" :key="g.title" class="filter-group">
          <div class="eyebrow filter-group-title">{{ g.title }}</div>
          <div
            v-for="r in g.rows"
            :key="r.name"
            class="filter-row"
            :class="{ 'is-active': r.active }"
          >
            <span v-if="r.icon" class="filter-icon"><Icon :name="r.icon" /></span>
            <span v-if="r.dot" class="filter-dot" :style="{ background: r.dot }" />
            <Avi v-if="r.av" :name="r.av" :hue="r.hue ?? 200" :size="18" />
            <span class="trunc filter-name">{{ r.name }}</span>
            <span v-if="r.count" class="mono tnum filter-count">{{ r.count }}</span>
          </div>
        </div>
      </aside>

      <div class="issues-list no-scrollbar">
        <div class="issues-toolbar">
          <Chip :mono="true" tone="accent" :dot="true">31 results</Chip>
          <span class="spacer" />
          <div class="view-toggle">
            <button class="btn btn-sm view-btn is-on">List</button>
            <button class="btn btn-sm btn-ghost">Board</button>
            <button class="btn btn-sm btn-ghost">Timeline</button>
          </div>
          <button class="btn btn-sm">Sort: Newest<Icon name="chevD" /></button>
        </div>

        <div class="glass milestone-card">
          <div class="milestone-head">
            <span class="milestone-icon"><Icon name="tag" /></span>
            <span class="milestone-name">v0.10 — DAG runs</span>
            <span class="mono milestone-due">due May 28</span>
            <span class="spacer" />
            <span class="mono tnum milestone-progress">12 / 18 · 67%</span>
          </div>
          <div class="bar"><span style="width: 67%" /></div>
        </div>

        <div class="glass issues-card">
          <div
            v-for="issue in issues"
            :key="issue.num"
            class="issue-row"
            :class="{ 'is-pinned': issue.pinned }"
          >
            <span
              class="issue-state-icon"
              :style="{ color: issue.state === 'open' ? 'var(--ok)' : 'var(--err)' }"
            >
              <Icon name="issue" />
            </span>
            <div class="issue-main">
              <div class="issue-title-row">
                <Chip v-if="issue.pinned" :mono="true" tone="accent" :dot="true">pinned</Chip>
                <span class="issue-title">{{ issue.title }}</span>
                <Chip
                  v-for="tag in issue.tags"
                  :key="tag.name"
                  :mono="true"
                  :style="tagStyle(tag.color)"
                >{{ tag.name }}</Chip>
              </div>
              <div class="issue-meta">
                <span class="mono">#{{ issue.num }}</span>
                <span>opened {{ issue.age }} ago by <span class="meta-strong">@rawkode</span></span>
                <span v-if="issue.milestone" class="issue-milestone">
                  <Icon name="tag" /><span>{{ issue.milestone }}</span>
                </span>
              </div>
              <div v-if="issue.reactions || issue.comment" class="reaction-bar">
                <span
                  v-for="r in issue.reactions"
                  :key="r.emoji"
                  class="reaction-pill"
                >
                  <span class="reaction-emoji">{{ r.emoji }}</span>
                  <span class="mono tnum">{{ r.count }}</span>
                </span>
                <span v-if="issue.comment" class="reaction-quote">"{{ issue.comment }}"</span>
              </div>
            </div>
            <div class="issue-aside">
              <span v-if="issue.comments > 0" class="issue-comments">
                <Icon name="msg" /><span class="mono tnum">{{ issue.comments }}</span>
              </span>
              <Avi
                v-if="issue.assignee"
                :name="issue.assignee.initials"
                :hue="issue.assignee.hue"
                :size="22"
              />
              <span v-else class="assignee-empty" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.issues-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.issues-head {
  padding: 18px 24px;
  display: flex;
  align-items: center;
  gap: 14px;
}
.issues-title {
  font-size: 28px;
  line-height: 1.05;
  margin: 0;
  font-weight: 400;
  letter-spacing: -0.01em;
}
.spacer { flex: 1; }
.issues-search {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 10px;
  height: 30px;
  width: 320px;
  border-radius: 8px;
  background: var(--surface);
  border: 0.5px solid var(--line);
  color: var(--fg-3);
  font-size: 12px;
}

.issues-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.issues-filters {
  width: 220px;
  flex-shrink: 0;
  padding: 16px 14px;
  overflow-y: auto;
  background: var(--surface);
}
.filter-group { margin-bottom: 16px; }
.filter-group-title {
  margin-bottom: 6px;
  padding-left: 4px;
}
.filter-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 8px;
  border-radius: 6px;
  color: var(--fg-2);
  font-size: 12px;
  height: 26px;
}
.filter-row.is-active {
  background: var(--surface-2);
  color: var(--fg);
}
.filter-icon { color: var(--fg-3); display: inline-flex; }
.filter-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
}
.filter-name { flex: 1; }
.filter-count {
  font-size: 10.5px;
  color: var(--fg-3);
}

.issues-list {
  flex: 1;
  padding: 16px 22px;
  overflow-y: auto;
}

.issues-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
}
.view-toggle {
  display: flex;
  gap: 0;
  padding: 2px;
  border-radius: 8px;
  background: var(--surface-2);
}
.view-btn.is-on { background: var(--surface-3); }

.milestone-card {
  padding: 14px;
  margin-bottom: 16px;
}
.milestone-head {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 8px;
}
.milestone-icon { color: var(--accent); display: inline-flex; }
.milestone-name {
  font-size: 13px;
  font-weight: 600;
}
.milestone-due {
  font-size: 11px;
  color: var(--fg-3);
}
.milestone-progress {
  font-size: 11px;
  color: var(--fg-2);
}

.issues-card { overflow: hidden; }

.issue-row {
  padding: 14px 16px;
  border-bottom: 0.5px solid var(--line);
  display: flex;
  gap: 14px;
  align-items: flex-start;
  background: transparent;
}
.issue-row.is-pinned { background: var(--accent-soft); }
.issue-row:last-child { border-bottom: 0; }

.issue-state-icon {
  margin-top: 2px;
  display: inline-flex;
}
.issue-main {
  flex: 1;
  min-width: 0;
}
.issue-title-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
}
.issue-title {
  font-size: 13.5px;
  color: var(--fg);
  font-weight: 500;
}

.issue-meta {
  display: flex;
  gap: 12px;
  margin-top: 6px;
  font-size: 11px;
  color: var(--fg-3);
  flex-wrap: wrap;
}
.meta-strong { color: var(--fg-2); }
.issue-milestone {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.reaction-bar {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.reaction-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 7px;
  border-radius: 999px;
  background: var(--surface-2);
  border: 0.5px solid var(--line);
  font-size: 11px;
  color: var(--fg-2);
}
.reaction-emoji { font-size: 11px; }
.reaction-quote {
  font-size: 11.5px;
  color: var(--fg-3);
  margin-left: 4px;
}

.issue-aside {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}
.issue-comments {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--fg-3);
  font-size: 11.5px;
}
.assignee-empty {
  width: 22px;
  height: 22px;
  border-radius: 999px;
  border: 1px dashed var(--line-3);
}

@media (max-width: 860px) {
  .issues-body { flex-direction: column; }
  .issues-filters {
    width: 100%;
    border-right: 0;
    border-bottom: 0.5px solid var(--line);
    max-height: 240px;
  }
  .issues-search { width: 100%; }
  .issues-head {
    flex-wrap: wrap;
    gap: 8px;
  }
}
</style>
