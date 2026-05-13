<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { openPalette, subscribeLiveEvents } from "@comtrya/sdk-core";
import CommandPalette from "./components/CommandPalette.vue";

const workspace = {
  name: "Comtrya",
  repositories: 1,
  serverURL: "http://127.0.0.1:8080",
};

const navItems = [
  { to: "/", number: "01", label: "Home" },
  { to: "/r/comtrya/comtrya", number: "02", label: "Repository" },
  { to: "/x/issues/", number: "03", label: "Issues" },
  { to: "/x/pulls/", number: "04", label: "Pull requests" },
];

const liveState = ref<"connecting" | "live" | "idle" | "error">("connecting");
const liveEvents = ref(0);
let unsubscribeLiveEvents: (() => void) | undefined;

onMounted(() => {
  unsubscribeLiveEvents = subscribeLiveEvents({
    onEvent: () => {
      liveEvents.value += 1;
      liveState.value = "live";
    },
    onError: () => {
      liveState.value = "error";
    },
  });
  window.setTimeout(() => {
    if (liveState.value === "connecting") liveState.value = "idle";
  }, 1500);
});

onUnmounted(() => unsubscribeLiveEvents?.());
</script>

<template>
  <div class="shell shell-v3">
    <header class="topbar" role="banner">
      <div class="brand">
        <div class="mark">C</div>
        <div class="name">
          <span class="word">Comtrya</span>
          <span class="sub">workspace</span>
        </div>
      </div>
      <button class="cmdk" type="button" @click="openPalette">
        <span class="label">Cmd</span>
        <span class="cmdk-text">repository, pull, file, ref...</span>
        <kbd>CMD K</kbd>
      </button>
      <div class="topbar-actions">
        <span class="chip ok">{{ liveState }}</span>
        <span class="chip bare">{{ liveEvents }} events</span>
        <code>{{ workspace.serverURL }}</code>
      </div>
    </header>

    <div class="layout">
      <aside class="sidebar">
        <div class="workspace">
          <h4>Workspace</h4>
          <strong>{{ workspace.name }}</strong>
          <div class="meta">{{ workspace.repositories }} repository / single-tenant</div>
        </div>

        <div>
          <h4>Shell routes</h4>
          <nav class="nav" aria-label="Shell routes">
            <RouterLink v-for="item in navItems" :key="item.to" :to="item.to">
              <span class="num">{{ item.number }}</span>
              <span>{{ item.label }}</span>
            </RouterLink>
          </nav>
        </div>
      </aside>

      <main class="page">
        <RouterView />
      </main>
    </div>
    <CommandPalette />
  </div>
</template>
