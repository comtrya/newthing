<script setup lang="ts">
/**
 * AdminOverview — Forge admin landing page.
 *
 * Static mockup port of `ScreenAdminOverview` from the design handoff.
 * Data is hardcoded; real values arrive once the admin telemetry
 * backend lands.
 */

import { computed } from "vue";
import AdminNav from "../components/AdminNav.vue";
import Icon from "../components/Icon.vue";
import Chip from "../components/Chip.vue";
import type { IconKey } from "../components/icons";

interface Service {
  name: string;
  version: string;
  port: string;
  memory: string;
}

const services: readonly Service[] = [
  { name: "forge-web", version: "v2.14.3", port: "443/tcp", memory: "32 MB" },
  { name: "forge-api", version: "v2.14.3", port: "8080/tcp", memory: "108 MB" },
  { name: "forge-git", version: "v2.14.3", port: "22/tcp", memory: "84 MB" },
  { name: "forge-runner", version: "v2.14.3", port: "—", memory: "212 MB" },
  { name: "postgres-16", version: "16.4", port: "5432/tcp", memory: "428 MB" },
  {
    name: "minio",
    version: "RELEASE.2026-04-12",
    port: "9000/tcp",
    memory: "96 MB",
  },
];

interface RecentEvent {
  when: string;
  icon: IconKey;
  title: string;
  meta: string;
}

const recentEvents: readonly RecentEvent[] = [
  {
    when: "just now",
    icon: "ai",
    title: "Co-pilot reindexed embeddings",
    meta: "342k files · 1m 04s",
  },
  {
    when: "12m",
    icon: "rocket",
    title: "Auto-deploy of comtrya/core to ghcr",
    meta: "v0.9.0 · 8.4 MB",
  },
  {
    when: "1h",
    icon: "lock",
    title: "API token created",
    meta: "ci-cd-runner-prod",
  },
  {
    when: "3h",
    icon: "spark",
    title: "Daily backup completed",
    meta: "snapshot 2026-05-18",
  },
  {
    when: "yesterday",
    icon: "retry",
    title: "Forge upgraded to v2.14.3",
    meta: "47s downtime",
  },
];

interface Gauge {
  label: string;
  value: number;
  cap: string;
  warn: boolean;
}

const gauges: readonly Gauge[] = [
  { label: "CPU", value: 18, cap: "8 cores · 16t", warn: false },
  { label: "Memory", value: 47, cap: "14.9 / 32 GB", warn: false },
  { label: "Disk", value: 6.2, cap: "12.4 / 200 GB", warn: false },
];

// Precomputed bar heights for the 48-bar traffic chart. Same
// `0.4 + 0.6 * |sin(i/4) * cos(i/7)|` formula from the source.
const trafficBars = Array.from({ length: 48 }, (_, i) => {
  const v = 0.4 + 0.6 * Math.abs(Math.sin(i / 4) * Math.cos(i / 7));
  return v * 100;
});

const headerStyle = computed(
  () =>
    ({
      display: "flex",
      alignItems: "flex-end",
      marginBottom: "22px",
    }) as const,
);

const machineGridStyle = {
  display: "grid",
  gridTemplateColumns: "1.1fr 1fr 1fr 1fr",
  padding: "18px 22px",
  background: "linear-gradient(135deg, var(--accent-soft), transparent 60%)",
} as const;
</script>

<template>
  <div class="admin-screen">
    <AdminNav active="overview" />
    <div class="admin-content no-scrollbar">

      <!-- Header -->
      <div :style="headerStyle">
        <div>
          <div class="eyebrow" style="margin-bottom: 6px">
            forge.rawkode.dev · single tenant
          </div>
          <h1
            class="serif"
            style="font-size: 32px; margin: 0; font-weight: 400; letter-spacing: -0.01em"
          >
            Forge overview
          </h1>
          <div style="margin-top: 8px; font-size: 13px; color: var(--fg-2)">
            Everything green. Running
            <span class="mono" style="color: var(--fg)">v2.14.3</span>,
            <span class="mono" style="color: var(--accent)"> v2.14.4 </span>available.
          </div>
        </div>
        <div style="flex: 1" />
        <div style="display: flex; gap: 8px">
          <button class="btn"><Icon name="terminal" /><span>SSH</span></button>
          <button class="btn"><Icon name="retry" /><span>Restart services</span></button>
          <button class="btn btn-primary">
            <Icon name="rocket" /><span>Upgrade to v2.14.4</span>
          </button>
        </div>
      </div>

      <!-- Machine card -->
      <div
        class="glass"
        style="padding: 0; margin-bottom: 18px; overflow: hidden"
      >
        <div :style="machineGridStyle">
          <div>
            <div class="eyebrow" style="margin-bottom: 6px">Host</div>
            <div class="mono" style="font-size: 16px; color: var(--fg)">
              fsn1-bare-08
            </div>
            <div style="font-size: 11px; color: var(--fg-3); margin-top: 4px">
              Hetzner FSN1 · Falkenstein, DE
            </div>
            <div style="display: flex; gap: 6px; margin-top: 10px">
              <Chip dot tone="ok">healthy</Chip>
              <Chip mono>98d uptime</Chip>
            </div>
          </div>

          <div v-for="g in gauges" :key="g.label">
            <div class="eyebrow" style="margin-bottom: 6px">{{ g.label }}</div>
            <div
              style="display: flex; align-items: baseline; gap: 4px; margin-bottom: 6px"
            >
              <span
                class="mono tnum"
                style="font-size: 22px; font-weight: 500"
              >{{ g.value }}</span>
              <span
                class="mono"
                style="font-size: 11px; color: var(--fg-3)"
              >%</span>
            </div>
            <div class="bar">
              <span
                :style="{
                  width: g.value + '%',
                  background: g.warn ? 'var(--warn)' : 'var(--accent)',
                }"
              />
            </div>
            <div style="font-size: 10.5px; color: var(--fg-3); margin-top: 6px">
              {{ g.cap }}
            </div>
          </div>
        </div>

        <!-- Services -->
        <div class="hairline-t" style="padding: 14px 22px">
          <div
            style="display: flex; align-items: baseline; margin-bottom: 10px"
          >
            <span class="eyebrow">Services · 6 healthy</span>
            <span style="flex: 1" />
            <span
              class="mono"
              style="font-size: 10.5px; color: var(--fg-3)"
            >last checked 3s ago</span>
          </div>
          <div
            style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px"
          >
            <div
              v-for="s in services"
              :key="s.name"
              style="
                padding: 10px 12px;
                border-radius: 8px;
                background: var(--surface);
                border: 0.5px solid var(--line);
              "
            >
              <div
                style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px"
              >
                <span style="color: var(--ok); display: inline-flex"
                  ><Icon name="check"
                /></span>
                <span
                  class="mono"
                  style="font-size: 12px; font-weight: 500"
                >{{ s.name }}</span>
                <span style="flex: 1" />
                <Chip mono>{{ s.version }}</Chip>
              </div>
              <div
                style="
                  display: flex;
                  gap: 12px;
                  font-size: 10.5px;
                  color: var(--fg-3);
                  padding-left: 20px;
                "
              >
                <span
                  >port
                  <span
                    class="mono"
                    style="color: var(--fg-2)"
                  >{{ s.port }}</span></span
                >
                <span>·</span>
                <span
                  >mem
                  <span
                    class="mono"
                    style="color: var(--fg-2)"
                  >{{ s.memory }}</span></span
                >
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Two columns: traffic + recent admin events -->
      <div
        style="display: grid; grid-template-columns: 1.4fr 1fr; gap: 16px"
      >
        <div class="glass" style="padding: 18px">
          <div style="display: flex; align-items: baseline">
            <div>
              <div class="eyebrow" style="margin-bottom: 4px">
                Traffic · last 24h
              </div>
              <div class="mono" style="font-size: 22px; font-weight: 500">
                184.2k
              </div>
              <div style="font-size: 11px; color: var(--fg-3)">
                requests · p99 32ms · 0 5xx
              </div>
            </div>
            <div style="flex: 1" />
            <div
              style="display: flex; gap: 18px; font-size: 11px; color: var(--fg-3)"
            >
              <div class="stat">
                <span class="stat-label">API</span>
                <span class="stat-value mono">142.1k</span>
              </div>
              <div class="stat">
                <span class="stat-label">Git</span>
                <span class="stat-value mono">38.4k</span>
              </div>
              <div class="stat">
                <span class="stat-label">Web</span>
                <span class="stat-value mono">3.7k</span>
              </div>
            </div>
          </div>
          <!-- Traffic chart -->
          <div
            style="
              height: 110px;
              margin-top: 16px;
              display: flex;
              align-items: flex-end;
              gap: 2px;
            "
          >
            <div
              v-for="(h, i) in trafficBars"
              :key="i"
              :style="{
                flex: 1,
                height: h + '%',
                background: i === 47 ? 'var(--accent)' : 'var(--surface-3)',
                borderRadius: '2px',
              }"
            />
          </div>
          <div
            class="mono"
            style="
              display: flex;
              justify-content: space-between;
              margin-top: 6px;
              font-size: 10px;
              color: var(--fg-4);
            "
          >
            <span>−24h</span><span>−18h</span><span>−12h</span><span>−6h</span
            ><span>now</span>
          </div>
        </div>

        <div class="glass" style="padding: 0">
          <div class="section-hd">
            <div class="section-hd-title">Recent admin events</div>
          </div>
          <div style="padding: 6px">
            <div
              v-for="(e, i) in recentEvents"
              :key="i"
              style="
                padding: 10px 12px;
                display: flex;
                gap: 10px;
                align-items: flex-start;
                border-radius: 8px;
              "
            >
              <span
                style="color: var(--fg-3); margin-top: 1px; display: inline-flex"
                ><Icon :name="e.icon"
              /></span>
              <div style="flex: 1; min-width: 0">
                <div style="font-size: 12px; color: var(--fg)">
                  {{ e.title }}
                </div>
                <div
                  class="mono"
                  style="font-size: 10.5px; color: var(--fg-3); margin-top: 2px"
                >
                  {{ e.meta }}
                </div>
              </div>
              <span
                class="mono tnum"
                style="font-size: 10.5px; color: var(--fg-4)"
              >{{ e.when }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-screen {
  display: flex;
  height: 100%;
  overflow: hidden;
}
.admin-content {
  flex: 1;
  padding: 22px 28px;
  overflow-y: auto;
}
.section-hd {
  display: flex;
  align-items: baseline;
  padding: 12px 16px;
  border-bottom: 0.5px solid var(--line);
}
.section-hd-title {
  font-size: 12px;
  font-weight: 500;
  color: var(--fg);
}
.section-hd-sub {
  font-size: 11px;
  color: var(--fg-3);
  margin-left: 8px;
}
.section-hd-right {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: flex-start;
}
.stat-label {
  font-size: 9px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--fg-4);
  font-family: var(--font-mono);
}
.stat-value {
  font-size: 13px;
  color: var(--fg);
}
.stat-value.accent {
  color: var(--accent);
}
</style>
