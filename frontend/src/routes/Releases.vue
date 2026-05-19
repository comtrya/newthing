<script setup lang="ts">
import Chip from "../components/Chip.vue";
import Icon from "../components/Icon.vue";

interface HighlightItem {
  kind: string;
  text: string;
  color: string;
}

interface AssetItem {
  name: string;
  size: string;
  highlighted?: boolean;
}

interface ReleaseNodeData {
  v: string;
  title: string;
  date: string;
  commits: number;
  contribs: number;
  kind: "hotfix" | "preview" | "minor" | "patch";
  summary: string;
}

const highlights: HighlightItem[] = [
  { kind: "feat", text: "DAG execution with worker pool sized to logical cores", color: "var(--ok)" },
  { kind: "feat", text: "Apple Silicon brew prefix detection (#240)", color: "var(--ok)" },
  { kind: "fix", text: "yum lock held until manifest fsync", color: "var(--accent)" },
  { kind: "perf", text: "Batched brew updates — 38s → 9s on cold cache", color: "oklch(80% 0.14 80)" },
  { kind: "breaking", text: "Action schema bump: list → packages (autofix in CLI)", color: "var(--err)" },
];

const assets: AssetItem[] = [
  { name: "comtrya-x86_64-linux-gnu.tar.zst", size: "8.4 MB", highlighted: true },
  { name: "comtrya-aarch64-linux-gnu.tar.zst", size: "7.9 MB" },
  { name: "comtrya-x86_64-apple-darwin.tar.zst", size: "8.1 MB" },
  { name: "comtrya-aarch64-apple-darwin.tar.zst", size: "7.7 MB" },
  { name: "comtrya-x86_64-windows.zip", size: "8.6 MB" },
  { name: "SHA256SUMS.txt.minisig", size: "2.3 KB" },
];

const pastReleases: ReleaseNodeData[] = [
  {
    v: "v0.8.3",
    title: "Hotfix · yum lock contention",
    date: "Apr 28, 2026",
    commits: 8,
    contribs: 2,
    kind: "hotfix",
    summary:
      "Holds the yum process lock until manifest fsync completes. Affects systems with very fast NVMe.",
  },
  {
    v: "v0.8.0",
    title: "Windows preview · privilege escalation contract",
    date: "Mar 12, 2026",
    commits: 89,
    contribs: 4,
    kind: "preview",
    summary:
      "First public Windows preview. Adds the Privilege trait — actions declare needed elevation explicitly.",
  },
  {
    v: "v0.7.0",
    title: "Idempotency v2 — checksum-aware",
    date: "Jan 24, 2026",
    commits: 114,
    contribs: 5,
    kind: "minor",
    summary:
      "Idempotency checks now compare checksums in addition to mtimes, fixing the 'pulled but identical' false-dirty issue.",
  },
  {
    v: "v0.6.4",
    title: "Stable",
    date: "Nov 02, 2025",
    commits: 14,
    contribs: 2,
    kind: "patch",
    summary: "Bug fix release. Bumps tokio to 1.45.",
  },
];

const toneByKind: Record<ReleaseNodeData["kind"], { c: string; label: string }> = {
  hotfix: { c: "var(--err)", label: "hotfix" },
  preview: { c: "var(--info)", label: "preview" },
  minor: { c: "var(--accent)", label: "minor" },
  patch: { c: "var(--fg-3)", label: "patch" },
};
</script>

<template>
  <div class="releases-page">
    <header class="hairline-b releases-head">
      <div>
        <div class="eyebrow">rawkode / core · 14 releases</div>
        <h1 class="serif releases-title">Releases</h1>
      </div>
      <div class="spacer" />
      <div class="releases-actions">
        <button class="btn"><Icon name="tag" /><span>Tags</span><span class="sep">·</span><span class="mono">14</span></button>
        <button class="btn"><Icon name="dot3" /></button>
        <button class="btn btn-primary"><Icon name="plus" /><span>Cut release</span></button>
      </div>
    </header>

    <div class="releases-body no-scrollbar">
      <article class="glass featured">
        <div class="featured-hero">
          <div class="featured-headline">
            <span class="serif version">v0.9.0</span>
            <span class="serif tagline">Parallel runs &amp; macOS 14</span>
            <span class="spacer" />
            <Chip tone="accent" :dot="true">latest</Chip>
            <Chip :mono="true" tone="ok">signed</Chip>
          </div>
          <div class="featured-meta">
            <span>by <span class="meta-strong">@rawkode</span></span>
            <span>tagged <span class="mono">d3a91f4</span></span>
            <span>3 days ago</span>
            <span class="dot">·</span>
            <span><span class="mono meta-strong">147 commits</span> since v0.8.0</span>
            <span class="dot">·</span>
            <span><span class="mono meta-strong">6 contributors</span></span>
          </div>
        </div>

        <div class="featured-grid">
          <section>
            <h3 class="serif featured-section-title">What's new</h3>
            <p class="featured-prose">
              Manifests now execute as a <span class="text-fg">DAG</span>, not a flat list — independent
              actions run concurrently with per-host worker bounds. Big quality-of-life: the
              <span class="mono text-fg">brew</span> action is finally a first-class citizen on Apple
              Silicon, with proper prefix-aware idempotency checks.
            </p>

            <h4 class="featured-eyebrow">Highlights</h4>
            <ul class="highlights">
              <li v-for="h in highlights" :key="h.text" class="highlight-row">
                <span
                  class="mono highlight-tag"
                  :style="{ background: `${h.color}26`, color: h.color }"
                >{{ h.kind }}</span>
                <span>{{ h.text }}</span>
              </li>
            </ul>
          </section>

          <aside>
            <h4 class="eyebrow assets-eyebrow">Assets · 6 platforms</h4>
            <div class="assets">
              <div
                v-for="a in assets"
                :key="a.name"
                class="asset-row"
                :class="{ 'is-highlighted': a.highlighted }"
              >
                <span class="asset-icon"><Icon name="file" /></span>
                <span class="mono trunc asset-name">{{ a.name }}</span>
                <span class="mono tnum asset-size">{{ a.size }}</span>
                <span class="asset-dl">↓</span>
              </div>
            </div>

            <h4 class="eyebrow verify-eyebrow">Verification</h4>
            <div class="verify-box">
              <span class="cmt">{{ '# cosign verify-blob \\' }}</span><br />
              <span class="cmt">{{ '#   --signature ./bundle.minisig \\' }}</span><br />
              <span class="cmt">{{ '#   --certificate-identity rawkode@…' }}</span><br />
              <span class="ok-text">✓ Verified</span>
            </div>
          </aside>
        </div>
      </article>

      <div class="timeline-head">
        <span class="eyebrow">Previous releases</span>
        <span class="spacer" />
        <Chip :mono="true">14 total</Chip>
      </div>

      <div class="timeline">
        <div class="timeline-spine" />
        <article
          v-for="r in pastReleases"
          :key="r.v"
          class="release-node"
        >
          <span
            class="release-node-marker"
            :style="{ borderColor: toneByKind[r.kind].c }"
          />
          <header class="release-node-head">
            <span class="mono release-version" :style="{ color: toneByKind[r.kind].c }">{{ r.v }}</span>
            <span class="serif release-title">{{ r.title }}</span>
            <span class="spacer" />
            <Chip :mono="true">{{ toneByKind[r.kind].label }}</Chip>
            <span class="release-date">{{ r.date }}</span>
          </header>
          <p class="release-summary">{{ r.summary }}</p>
          <div class="release-meta">
            <span class="mono">{{ r.commits }} commits</span>
            <span class="dot">·</span>
            <span class="mono">{{ r.contribs }} contributors</span>
            <span class="dot">·</span>
            <a class="diff-link">Diff against previous</a>
          </div>
        </article>
      </div>
    </div>
  </div>
</template>

<style scoped>
.releases-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.releases-head {
  padding: 18px 28px;
  display: flex;
  align-items: center;
}
.releases-title {
  font-size: 28px;
  line-height: 1.05;
  margin: 0;
  font-weight: 400;
}
.spacer { flex: 1; }
.releases-actions { display: flex; gap: 8px; }
.sep { color: var(--fg-3); margin: 0 4px; }

.releases-body {
  flex: 1;
  overflow-y: auto;
  padding: 22px 28px;
}

.featured {
  padding: 0;
  margin-bottom: 28px;
  overflow: hidden;
}
.featured-hero {
  position: relative;
  padding: 26px 28px 22px;
  background: linear-gradient(135deg, var(--accent-soft), transparent 70%);
  border-bottom: 0.5px solid var(--line);
}
.featured-headline {
  display: flex;
  align-items: baseline;
  gap: 14px;
  flex-wrap: wrap;
}
.version {
  font-size: 56px;
  font-weight: 400;
  line-height: 1;
  letter-spacing: -0.02em;
  color: var(--accent);
}
.tagline {
  font-size: 22px;
  font-weight: 400;
  color: var(--fg-2);
  font-style: italic;
}
.featured-meta {
  display: flex;
  gap: 18px;
  margin-top: 14px;
  font-size: 11px;
  color: var(--fg-3);
  flex-wrap: wrap;
}
.meta-strong { color: var(--fg-2); }
.dot { color: var(--fg-3); }

.featured-grid {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  padding: 24px 28px;
  gap: 36px;
}
.featured-section-title {
  font-size: 20px;
  margin: 0 0 10px;
  font-weight: 400;
}
.featured-prose {
  font-size: 12.5px;
  color: var(--fg-2);
  line-height: 1.7;
  margin: 0;
  text-wrap: pretty;
}
.text-fg { color: var(--fg); }
.featured-eyebrow {
  font-size: 12px;
  font-weight: 600;
  margin: 18px 0 8px;
  color: var(--fg);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.highlights {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.highlight-row {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  font-size: 12.5px;
  color: var(--fg-2);
}
.highlight-tag {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 4px;
  flex-shrink: 0;
  margin-top: 1px;
}

.assets-eyebrow { margin-bottom: 10px; }
.assets { display: flex; flex-direction: column; gap: 4px; }
.asset-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 8px;
  background: transparent;
  border: 0.5px solid transparent;
}
.asset-row.is-highlighted {
  background: var(--surface-2);
  border-color: var(--line);
}
.asset-icon { color: var(--fg-3); display: inline-flex; }
.asset-name {
  font-size: 11.5px;
  color: var(--fg-2);
  flex: 1;
}
.asset-size { font-size: 10.5px; color: var(--fg-4); }
.asset-dl { color: var(--fg-3); }

.verify-eyebrow { margin: 20px 0 10px; }
.verify-box {
  background: var(--bg-2);
  border: 0.5px solid var(--line);
  border-radius: 8px;
  padding: 10px 12px;
  font-family: var(--font-mono);
  font-size: 10.5px;
  color: var(--fg-2);
  line-height: 1.6;
  letter-spacing: 0;
}
.cmt { color: var(--fg-4); }
.ok-text { color: var(--ok); }

.timeline-head {
  display: flex;
  align-items: baseline;
  margin-bottom: 12px;
}
.timeline {
  position: relative;
  padding-left: 32px;
}
.timeline-spine {
  position: absolute;
  left: 11px;
  top: 4px;
  bottom: 4px;
  width: 1px;
  background: var(--line-2);
}
.release-node {
  position: relative;
  padding-bottom: 24px;
}
.release-node-marker {
  position: absolute;
  left: -27px;
  top: 4px;
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: var(--bg);
  border-width: 1.5px;
  border-style: solid;
}
.release-node-head {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 6px;
  flex-wrap: wrap;
}
.release-version {
  font-size: 18px;
  font-weight: 500;
}
.release-title {
  font-size: 15px;
  color: var(--fg);
}
.release-date { font-size: 11px; color: var(--fg-3); }
.release-summary {
  font-size: 12px;
  color: var(--fg-2);
  line-height: 1.55;
  max-width: 720px;
  margin: 0 0 6px;
}
.release-meta {
  display: flex;
  gap: 16px;
  font-size: 11px;
  color: var(--fg-3);
}
.diff-link {
  color: var(--accent);
  cursor: pointer;
}

@media (max-width: 860px) {
  .featured-grid { grid-template-columns: 1fr; gap: 24px; }
  .version { font-size: 44px; }
  .tagline { font-size: 18px; }
  .releases-head { padding: 14px 18px; }
  .releases-body { padding: 16px 18px; }
}
</style>
