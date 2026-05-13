<script setup lang="ts">
const workspace = {
  name: "Comtrya",
  repositories: 1,
  serverURL: "http://127.0.0.1:8080",
};

const navItems = [
  { href: "/", number: "01", label: "Home" },
  { href: "/r/comtrya/comtrya", number: "02", label: "Repository" },
  { href: "/x/issues/", number: "03", label: "Issues" },
  { href: "/x/pulls/", number: "04", label: "Pull requests" },
];

const routeTargets = [
  { label: "Workspace", path: "/", status: "active" },
  { label: "Repository", path: "/r/comtrya/comtrya", status: "queued" },
  { label: "Extension", path: "/x/issues/", status: "queued" },
];

const activity = [
  { ref: "PR-24", title: "WASM dispatch table merged", state: "merged" },
  { ref: "ISS-18", title: "Vue shell route parity", state: "open" },
  { ref: "CHK-07", title: "Production testbed smoke", state: "passing" },
];
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
      <label class="cmdk">
        <span class="label">Cmd</span>
        <input type="search" placeholder="repository, pull, file, ref..." />
        <kbd>CMD K</kbd>
      </label>
      <div class="topbar-actions">
        <span class="chip ok">ready</span>
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
            <a v-for="item in navItems" :key="item.href" :href="item.href">
              <span class="num">{{ item.number }}</span>
              <span>{{ item.label }}</span>
            </a>
          </nav>
        </div>
      </aside>

      <main class="page">
        <section class="page-header">
          <div class="title-group">
            <span class="overline">Workspace</span>
            <h1>Comtrya</h1>
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
              <a v-for="route in routeTargets" :key="route.path" :href="route.path">
                <span>{{ route.label }}</span>
                <code>{{ route.path }}</code>
                <span class="state">{{ route.status }}</span>
              </a>
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
      </main>
    </div>
  </div>
</template>
