<script setup lang="ts">
/**
 * AdminAccess — owner, collaborators, and access tokens.
 *
 * Static port of `ScreenAdminAccess`. Data hardcoded; replaced once
 * the access backend (users, tokens, scopes) is wired up.
 */

import AdminNav from "../components/AdminNav.vue";
import Icon from "../components/Icon.vue";
import Chip from "../components/Chip.vue";
import Avi from "../components/Avi.vue";

interface Collaborator {
  name: string;
  handle: string;
  hue: number;
  role: "maintainer" | "reviewer" | "triage" | "read";
  scope: string;
  last: string;
  state: "active" | "invited";
}

const collaborators: readonly Collaborator[] = [
  {
    name: "Nia Iyer",
    handle: "@nia",
    hue: 320,
    role: "maintainer",
    scope: "rawkode/core",
    last: "2h",
    state: "active",
  },
  {
    name: "Jules Saito",
    handle: "@jules",
    hue: 140,
    role: "reviewer",
    scope: "all repos",
    last: "5h",
    state: "active",
  },
  {
    name: "Kepa Otaño",
    handle: "@kepa",
    hue: 60,
    role: "triage",
    scope: "issues only",
    last: "1d",
    state: "active",
  },
  {
    name: "Søren Holm",
    handle: "@soren",
    hue: 30,
    role: "read",
    scope: "rawkode/k8s-lab",
    last: "9d",
    state: "invited",
  },
];

interface Token {
  name: string;
  repo: string;
  scope: readonly string[];
  created: string;
  expires: string;
  state: "active" | "rolling" | "expired";
}

const tokens: readonly Token[] = [
  {
    name: "ci-cd-runner-prod",
    repo: "all repos",
    scope: ["pipelines:read", "registry:write"],
    created: "12m ago",
    expires: "Aug 18 · 90d",
    state: "active",
  },
  {
    name: "matrix-bot",
    repo: "rawkode/core",
    scope: ["issues:write"],
    created: "2d ago",
    expires: "never",
    state: "active",
  },
  {
    name: "release-cosign",
    repo: "rawkode/core",
    scope: ["releases:write"],
    created: "3d ago",
    expires: "2 days · rolling",
    state: "rolling",
  },
  {
    name: "homelab-pull",
    repo: "rawkode/dotfiles",
    scope: ["contents:read"],
    created: "5w ago",
    expires: "ok",
    state: "active",
  },
  {
    name: "old-laptop",
    repo: "rawkode/dotfiles",
    scope: ["contents:read"],
    created: "11mo",
    expires: "expired",
    state: "expired",
  },
];

function aviName(handle: string): string {
  return handle.slice(1, 3).toUpperCase();
}
</script>

<template>
  <div class="admin-screen">
    <AdminNav active="users" />
    <div class="admin-content no-scrollbar">

      <div
        style="display: flex; align-items: flex-end; margin-bottom: 22px"
      >
        <div>
          <div class="eyebrow" style="margin-bottom: 6px">
            Access · single tenant
          </div>
          <h1
            class="serif"
            style="font-size: 32px; margin: 0; font-weight: 400"
          >
            Who can touch this forge
          </h1>
          <div
            style="
              margin-top: 8px;
              font-size: 13px;
              color: var(--fg-2);
              max-width: 640px;
            "
          >
            One owner. A few trusted collaborators with scoped roles. Everything
            else is a token — short-lived, narrowly-scoped, auditable.
          </div>
        </div>
        <div style="flex: 1" />
        <div style="display: flex; gap: 8px">
          <button class="btn">
            <Icon name="plus" /><span>Invite collaborator</span>
          </button>
          <button class="btn btn-primary">
            <Icon name="plus" /><span>New token</span>
          </button>
        </div>
      </div>

      <!-- Owner card -->
      <div
        class="glass"
        style="
          padding: 18px;
          margin-bottom: 14px;
          position: relative;
          overflow: hidden;
        "
      >
        <div
          style="
            position: absolute;
            inset: 0;
            background: radial-gradient(70% 80% at 100% 0%, var(--accent-soft), transparent 60%);
            pointer-events: none;
          "
        />
        <div
          style="
            position: relative;
            display: flex;
            align-items: center;
            gap: 16px;
          "
        >
          <span
            class="avi"
            style="
              width: 48px;
              height: 48px;
              font-size: 16px;
              background: linear-gradient(135deg, var(--accent), oklch(78% 0.14 320));
              color: #0a0b0e;
            "
            >DM</span
          >
          <div style="flex: 1">
            <div style="display: flex; align-items: baseline; gap: 8px">
              <span style="font-size: 16px; font-weight: 600">David McKay</span>
              <span
                class="mono"
                style="font-size: 12px; color: var(--fg-3)"
              >@rawkode</span>
              <Chip tone="accent" dot>owner</Chip>
            </div>
            <div
              style="
                display: flex;
                gap: 18px;
                margin-top: 6px;
                font-size: 11.5px;
                color: var(--fg-3);
              "
            >
              <span
                >2FA:
                <span style="color: var(--ok)">passkey + TOTP</span></span
              >
              <span
                >SSH keys:
                <span class="mono" style="color: var(--fg-2)">4</span></span
              >
              <span
                >GPG keys:
                <span class="mono" style="color: var(--fg-2)">2</span></span
              >
              <span
                >last seen
                <span class="mono" style="color: var(--fg-2)">now</span></span
              >
            </div>
          </div>
          <button class="btn btn-sm">
            <Icon name="settings" /><span>Manage</span>
          </button>
        </div>
      </div>

      <!-- Collaborators -->
      <div class="glass" style="margin-bottom: 18px">
        <div class="section-hd">
          <div class="section-hd-title">Collaborators</div>
          <div class="section-hd-sub">3 active · scoped, no admin rights</div>
          <div class="section-hd-right">
            <button class="btn btn-sm"><Icon name="plus" /><span>Invite</span></button>
          </div>
        </div>
        <div
          v-for="(p, i) in collaborators"
          :key="p.handle"
          :style="{
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            borderBottom:
              i < collaborators.length - 1
                ? '0.5px solid var(--line)'
                : 'none',
          }"
        >
          <Avi :name="aviName(p.handle)" :hue="p.hue" :size="28" />
          <div style="flex: 1">
            <div style="display: flex; align-items: baseline; gap: 8px">
              <span style="font-size: 13px; font-weight: 500">{{ p.name }}</span>
              <span
                class="mono"
                style="font-size: 11px; color: var(--fg-3)"
              >{{ p.handle }}</span>
              <Chip v-if="p.state === 'invited'" mono tone="warn">invited</Chip>
            </div>
            <div
              style="font-size: 11px; color: var(--fg-3); margin-top: 2px"
            >
              scope: <span style="color: var(--fg-2)">{{ p.scope }}</span>
            </div>
          </div>
          <Chip
            mono
            :tone="p.role === 'maintainer' ? 'accent' : undefined"
          >{{ p.role }}</Chip>
          <span
            class="mono"
            style="
              font-size: 11px;
              color: var(--fg-3);
              width: 50px;
              text-align: right;
            "
          >{{ p.last }}</span>
          <button
            class="btn btn-sm btn-ghost"
            style="padding: 0; width: 26px; justify-content: center"
          >
            <Icon name="dot3" />
          </button>
        </div>
      </div>

      <!-- Access tokens -->
      <div class="glass">
        <div class="section-hd">
          <div class="section-hd-title">Access tokens</div>
          <div class="section-hd-sub">5 active · scoped by repo and action</div>
          <div class="section-hd-right">
            <Chip mono>4 deploy</Chip>
            <Chip mono>1 personal</Chip>
          </div>
        </div>

        <div
          v-for="(t, i) in tokens"
          :key="t.name"
          :style="{
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            borderBottom:
              i < tokens.length - 1 ? '0.5px solid var(--line)' : 'none',
            opacity: t.state === 'expired' ? 0.5 : 1,
          }"
        >
          <span
            style="
              width: 28px;
              height: 28px;
              border-radius: 7px;
              background: var(--surface-2);
              color: var(--fg-3);
              display: flex;
              align-items: center;
              justify-content: center;
              flex-shrink: 0;
            "
            ><Icon name="lock"
          /></span>
          <div style="flex: 1; min-width: 0">
            <div style="display: flex; align-items: baseline; gap: 8px">
              <span
                class="mono"
                style="font-size: 12.5px; color: var(--fg); font-weight: 500"
              >{{ t.name }}</span>
              <span
                style="font-size: 11px; color: var(--fg-3)"
              >{{ t.repo }}</span>
            </div>
            <div
              style="display: flex; gap: 4px; margin-top: 6px; flex-wrap: wrap"
            >
              <Chip v-for="s in t.scope" :key="s" mono>{{ s }}</Chip>
            </div>
          </div>
          <div style="text-align: right; flex-shrink: 0">
            <div
              class="mono"
              style="font-size: 11px; color: var(--fg-2)"
            >{{ t.expires }}</div>
            <div
              style="font-size: 10px; color: var(--fg-4); margin-top: 2px"
            >{{ t.created }}</div>
          </div>
          <Chip v-if="t.state === 'rolling'" tone="info" dot>rolling</Chip>
          <Chip v-else-if="t.state === 'expired'" mono tone="err">expired</Chip>
          <Chip v-else tone="ok" dot>active</Chip>
          <button
            class="btn btn-sm btn-ghost"
            style="padding: 0; width: 26px; justify-content: center"
          >
            <Icon name="dot3" />
          </button>
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
</style>
