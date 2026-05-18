<script setup lang="ts">
/**
 * AdminStorage — storage pools, snapshot timeline, off-site target.
 *
 * Static port of `ScreenAdminStorage`. All data hardcoded; this is
 * the page that will eventually surface real storage telemetry once
 * the admin backend is wired up.
 */

import AdminNav from "../components/AdminNav.vue";
import Icon from "../components/Icon.vue";
import Chip from "../components/Chip.vue";

interface PoolBreakdown {
  name: string;
  value: number;
  color: string;
}

interface Pool {
  name: string;
  path: string;
  used: number;
  cap: number;
  encrypted: boolean;
  breakdown: readonly PoolBreakdown[];
}

const pools: readonly Pool[] = [
  {
    name: "repos · nvme0",
    path: "/srv/forge/repos",
    used: 12.4,
    cap: 200,
    encrypted: true,
    breakdown: [
      { name: "rawkode/core", value: 4.8, color: "oklch(70% 0.16 25)" },
      { name: "rawkode/k8s-lab", value: 2.1, color: "oklch(78% 0.14 215)" },
      { name: "rawkode/dotfiles", value: 0.6, color: "oklch(72% 0.16 280)" },
      { name: "other (5 repos)", value: 4.9, color: "var(--fg-4)" },
    ],
  },
  {
    name: "lfs + artifacts · nvme1",
    path: "/srv/forge/blobs",
    used: 38.2,
    cap: 500,
    encrypted: true,
    breakdown: [
      { name: "release artifacts", value: 18.4, color: "var(--accent)" },
      { name: "CI build cache", value: 12.0, color: "oklch(78% 0.14 215)" },
      { name: "LFS objects", value: 6.8, color: "oklch(80% 0.13 130)" },
      { name: "docker registry", value: 1.0, color: "var(--fg-4)" },
    ],
  },
];

interface CalendarBar {
  height: number;
  failed: boolean;
  isToday: boolean;
  label: string | null;
}

// Precomputed snapshot calendar bars. Mirrors the source formula
// `0.55 + (sin(i * 0.6) + 1) * 0.18`; one slot (i=8) is the
// verify-only example used to demonstrate the failure colour.
const calendarBars: readonly CalendarBar[] = Array.from({ length: 30 }, (_, i) => {
  const v = 0.55 + (Math.sin(i * 0.6) + 1) * 0.18;
  const failed = i === 8;
  const isToday = i === 29;
  const showLabel = i === 0 || i === 7 || i === 14 || i === 21 || i === 29;
  const label = showLabel ? (isToday ? "today" : `−${29 - i}d`) : null;
  return { height: v * 100, failed, isToday, label };
});

interface Snapshot {
  when: string;
  kind: string;
  size: string;
  status: "ok" | "warn";
  color: string;
  note: string;
}

const snapshots: readonly Snapshot[] = [
  {
    when: "2026-05-18 · 12:00",
    kind: "auto · 6h",
    size: "1.8 GB",
    status: "ok",
    color: "var(--ok)",
    note: "verified",
  },
  {
    when: "2026-05-18 · 06:00",
    kind: "auto · 6h",
    size: "1.8 GB",
    status: "ok",
    color: "var(--ok)",
    note: "verified",
  },
  {
    when: "2026-05-18 · 00:00",
    kind: "daily · full",
    size: "32.1 GB",
    status: "ok",
    color: "var(--ok)",
    note: "verified",
  },
  {
    when: "2026-05-17 · 18:00",
    kind: "auto · 6h",
    size: "1.7 GB",
    status: "ok",
    color: "var(--ok)",
    note: "verified",
  },
  {
    when: "2026-05-17 · 12:00",
    kind: "auto · 6h",
    size: "1.9 GB",
    status: "warn",
    color: "var(--warn)",
    note: "verify pending",
  },
  {
    when: "2026-05-11 · 00:00",
    kind: "weekly · cold",
    size: "31.4 GB",
    status: "ok",
    color: "var(--ok)",
    note: "off-site · b2",
  },
];

function pct(p: Pool): string {
  return ((p.used / p.cap) * 100).toFixed(1);
}

function widthPct(value: number, cap: number): string {
  return `${(value / cap) * 100}%`;
}
</script>

<template>
  <div class="admin-screen">
    <AdminNav active="storage" />
    <div class="admin-content no-scrollbar">

      <div
        style="display: flex; align-items: flex-end; margin-bottom: 22px"
      >
        <div>
          <div class="eyebrow" style="margin-bottom: 6px">Storage & backups</div>
          <h1
            class="serif"
            style="font-size: 32px; margin: 0; font-weight: 400"
          >
            Your forge, your hardware
          </h1>
          <div
            style="
              margin-top: 8px;
              font-size: 13px;
              color: var(--fg-2);
              max-width: 640px;
            "
          >
            Repositories on local NVMe, large-object cache on a second pool,
            off-site snapshots to
            <span
              class="mono"
              style="color: var(--fg)"
            >b2://forge-snapshots</span> every 6 hours.
          </div>
        </div>
        <div style="flex: 1" />
        <div style="display: flex; gap: 8px">
          <button class="btn"><Icon name="retry" /><span>Run backup now</span></button>
          <button class="btn"><Icon name="eye" /><span>Verify integrity</span></button>
        </div>
      </div>

      <!-- Storage pools -->
      <div
        style="
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          margin-bottom: 16px;
        "
      >
        <div v-for="p in pools" :key="p.name" class="glass" style="padding: 16px">
          <div
            style="display: flex; align-items: baseline; gap: 8px; margin-bottom: 6px"
          >
            <span
              class="mono"
              style="font-size: 13px; font-weight: 500"
            >{{ p.name }}</span>
            <Chip v-if="p.encrypted" mono tone="ok">
              <Icon name="lock" /><span style="margin-left: 2px">luks2</span>
            </Chip>
          </div>
          <div
            class="mono"
            style="font-size: 11px; color: var(--fg-3); margin-bottom: 14px"
          >{{ p.path }}</div>

          <div
            style="display: flex; align-items: baseline; gap: 4px; margin-bottom: 8px"
          >
            <span
              class="mono"
              style="font-size: 24px; font-weight: 500"
            >{{ p.used.toFixed(1) }}</span>
            <span
              class="mono"
              style="font-size: 12px; color: var(--fg-3)"
            >/ {{ p.cap }} GB · {{ pct(p) }}%</span>
          </div>

          <!-- Stacked bar -->
          <div
            style="
              display: flex;
              height: 10px;
              border-radius: 999px;
              overflow: hidden;
              gap: 1px;
              background: var(--surface-2);
            "
          >
            <div
              v-for="b in p.breakdown"
              :key="b.name"
              :style="{
                background: b.color,
                width: widthPct(b.value, p.cap),
                height: '100%',
              }"
            />
          </div>
          <div
            style="
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 4px;
              margin-top: 12px;
            "
          >
            <div
              v-for="b in p.breakdown"
              :key="b.name"
              style="display: flex; align-items: center; gap: 6px; font-size: 11px"
            >
              <span
                :style="{
                  width: '8px',
                  height: '8px',
                  borderRadius: '999px',
                  background: b.color,
                  flexShrink: 0,
                }"
              />
              <span
                class="trunc"
                style="color: var(--fg-2); flex: 1"
              >{{ b.name }}</span>
              <span
                class="mono tnum"
                style="color: var(--fg-3)"
              >{{ b.value.toFixed(1) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Backups -->
      <div class="glass" style="margin-bottom: 16px">
        <div class="section-hd">
          <div class="section-hd-title">Snapshot timeline</div>
          <div class="section-hd-sub">encrypted · off-site · weekly verify</div>
          <div class="section-hd-right">
            <Chip mono tone="ok" dot>0 failures · 30d</Chip>
            <Chip mono>4.2 TB cumulative</Chip>
          </div>
        </div>
        <div style="padding: 16px 18px">

          <!-- Calendar-strip of snapshots -->
          <div
            style="
              display: flex;
              align-items: flex-end;
              gap: 2px;
              height: 80px;
              margin-bottom: 14px;
            "
          >
            <div
              v-for="(bar, i) in calendarBars"
              :key="i"
              style="
                flex: 1;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 2px;
              "
            >
              <div
                :style="{
                  width: '100%',
                  height: bar.height + '%',
                  background: bar.failed
                    ? 'var(--warn)'
                    : bar.isToday
                      ? 'var(--accent)'
                      : 'var(--surface-3)',
                  borderRadius: '2px',
                }"
              />
              <span
                v-if="bar.label"
                class="mono"
                style="font-size: 9px; color: var(--fg-4)"
              >{{ bar.label }}</span>
            </div>
          </div>

          <!-- Recent snapshots -->
          <div style="display: flex; flex-direction: column; gap: 1px">
            <div
              v-for="(snap, i) in snapshots"
              :key="i"
              :style="{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '8px 10px',
                borderRadius: '6px',
                background: i === 0 ? 'var(--accent-soft)' : 'transparent',
              }"
            >
              <span :style="{ color: snap.color, display: 'inline-flex' }">
                <Icon :name="snap.status === 'ok' ? 'check' : 'clock'" />
              </span>
              <span
                class="mono tnum"
                style="font-size: 11.5px; color: var(--fg); width: 170px"
              >{{ snap.when }}</span>
              <span
                style="font-size: 11.5px; color: var(--fg-3); flex: 1"
              >{{ snap.kind }}</span>
              <span
                class="mono tnum"
                style="font-size: 11px; color: var(--fg-2); width: 80px"
              >{{ snap.size }}</span>
              <Chip mono :tone="snap.status === 'ok' ? 'ok' : 'warn'">
                {{ snap.note }}
              </Chip>
            </div>
          </div>

          <div
            style="
              margin-top: 14px;
              display: flex;
              align-items: center;
              gap: 10px;
            "
          >
            <button class="btn btn-sm">Restore from snapshot…</button>
            <span style="font-size: 11px; color: var(--fg-3)">
              Retention: 24× 6h · 30× daily · 12× weekly · 12× monthly
            </span>
          </div>
        </div>
      </div>

      <!-- Off-site target -->
      <div
        class="glass"
        style="padding: 16px; display: flex; align-items: center; gap: 16px"
      >
        <span
          style="
            width: 40px;
            height: 40px;
            border-radius: 10px;
            background: var(--surface-2);
            color: var(--accent);
            display: flex;
            align-items: center;
            justify-content: center;
          "
          ><Icon name="globe"
        /></span>
        <div style="flex: 1">
          <div style="font-size: 13px; color: var(--fg); margin-bottom: 2px">
            Off-site target ·
            <span class="mono">b2://forge-snapshots</span>
          </div>
          <div style="font-size: 11px; color: var(--fg-3)">
            Backblaze B2 · eu-central · age-encrypted · last upload 12 min ago
          </div>
        </div>
        <div style="display: flex; gap: 22px">
          <div class="stat">
            <span class="stat-label">Stored</span>
            <span class="stat-value mono">427.8 GB</span>
          </div>
          <div class="stat">
            <span class="stat-label">Cost/mo</span>
            <span class="stat-value mono">$2.14</span>
          </div>
          <div class="stat">
            <span class="stat-label">Last verify</span>
            <span class="stat-value mono accent">OK · 3d</span>
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
