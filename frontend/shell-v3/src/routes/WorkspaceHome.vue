<script setup lang="ts">
const workspace = {
  name: "Comtrya",
  repositories: 1,
};

const routeTargets = [
  { label: "Workspace", path: "/", status: "active" },
  { label: "Repository", path: "/r/comtrya/comtrya", status: "routed" },
  { label: "Extension", path: "/x/issues/", status: "routed" },
];

const activity = [
  { ref: "PR-24", title: "WASM dispatch table merged", state: "merged" },
  { ref: "ISS-18", title: "Vue shell route parity", state: "open" },
  { ref: "CHK-07", title: "Production testbed smoke", state: "passing" },
];
</script>

<template>
  <section class="page-header">
    <div class="title-group">
      <span class="overline">Workspace</span>
      <h1>{{ workspace.name }}</h1>
    </div>
    <div class="summary-grid" aria-label="Workspace summary">
      <div>
        <span>Repositories</span>
        <strong>{{ workspace.repositories }}</strong>
      </div>
      <div>
        <span>Extensions</span>
        <strong>4</strong>
      </div>
      <div>
        <span>Live stream</span>
        <strong>Idle</strong>
      </div>
    </div>
  </section>

  <section class="work-grid">
    <div class="panel route-panel">
      <div class="panel-heading">
        <h2>Route Surface</h2>
        <span class="chip info">SPA</span>
      </div>
      <div class="route-list">
        <RouterLink v-for="route in routeTargets" :key="route.path" :to="route.path">
          <span>{{ route.label }}</span>
          <code>{{ route.path }}</code>
          <span class="state">{{ route.status }}</span>
        </RouterLink>
      </div>
    </div>

    <div class="panel activity-panel">
      <div class="panel-heading">
        <h2>Activity</h2>
        <span class="chip ok">WASM</span>
      </div>
      <div class="activity-list">
        <article v-for="item in activity" :key="item.ref">
          <span class="ref">{{ item.ref }}</span>
          <strong>{{ item.title }}</strong>
          <span class="state">{{ item.state }}</span>
        </article>
      </div>
    </div>
  </section>
</template>
