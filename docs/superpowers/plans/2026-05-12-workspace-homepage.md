# Workspace Homepage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a workspace homepage at `/` that mounts host-declared slots filled by extension contributions, route the repo dashboard to `/r/<...groups>/<repo>`, route extension-owned pages under `/x/<prefix>/`, and replace today's manifest-array contribution model with a runtime SDK (manifest = identity, code = behavior).

**Architecture:** File-based Astro pages over the existing Rust host. New TS SDK (`@comtrya/extension-host`) wraps slot/route registration with allowlist enforcement against a manifest v2 schema. Host shell renders a fixed Mechanical Specimen design system with six operator-selectable color palettes persisted to localStorage. Bundled first-party extension `ext_workspace_home` fills all four `home.*` slots in v1.

**Tech Stack:** Astro (frontend, SSR), TypeScript (SDK + shell), Rust (host + GraphQL + manifest validation), Wasmtime (extension runtime), `bun test` for new TS tests, `cargo test --workspace` for Rust tests.

**Spec:** `docs/superpowers/specs/2026-05-12-workspace-homepage-design.md`

**Rendering convention:** DOM construction via a small `el()` helper (introduced in Task 15). Avoid `innerHTML` with interpolated values — every untrusted value sets `textContent` or becomes a child node. Static structure uses helper-built element trees, not template strings.

---

## File map

### New files

| Path | Responsibility |
| ---- | -------------- |
| `frontend/src/extension-host-sdk/index.ts` | Public SDK entry; re-exports `defineExtension` and types. |
| `frontend/src/extension-host-sdk/types.ts` | `SlotName` enum, `SlotContribution`, `RouteContribution`, `Disposable`, `ExtensionHost`, `ExtensionDefinition`. |
| `frontend/src/extension-host-sdk/define-extension.ts` | `defineExtension(def)` — identity passthrough that the host runtime consumes. |
| `frontend/src/extension-host-sdk/slot-registry.ts` | `SlotRegistry` class: contention resolution, disposable tracking. |
| `frontend/src/extension-host-sdk/host-facade.ts` | `createHostFacade(allowlist, registry, client, viewer, capabilities)` factory. |
| `frontend/src/extension-host-sdk/manifest.ts` | v2 manifest parsing + validation. |
| `frontend/src/extension-host-sdk/*.test.ts` | Unit tests (one file per source unit). |
| `frontend/src/shell/dom.ts` | `el()` and `text()` helpers — DOM construction without `innerHTML`. |
| `frontend/src/shell/chrome.ts` | Topbar, sidebar, viewer footer, theme switcher rendering. |
| `frontend/src/shell/theme.ts` | Theme switcher logic + localStorage persistence. |
| `frontend/src/shell/page-home.ts` | Homepage layout (renders home.* slot frames). |
| `frontend/src/shell/page-repo.ts` | Repo dashboard layout (renders repository.* slot frames). |
| `frontend/src/shell/page-ext.ts` | Extension page host — mounts a single route element inside chrome. |
| `frontend/src/shell/extension-loader.ts` | Reads manifests, fetches ESM entries, invokes setup(host). |
| `frontend/src/pages/r/[...path].astro` | Repo dashboard route; SSR-resolves `repoId` via `repositoryByPath`. |
| `frontend/src/pages/x/[prefix]/[...path].astro` | Extension page route. |
| `frontend/src/pages/instance.astro` | `/instance` v1 stub (redirects to `/#instance`). |
| `extensions/first-party/ext_workspace_home/manifest.json` | Backend manifest. |
| `extensions/first-party/ext_workspace_home/component.wat` | Minimal proof component. |
| `extensions/first-party/ext_workspace_home/ui/manifest.json` | v2 UI manifest. |
| `extensions/first-party/ext_workspace_home/assets/index.js` | Bundled ESM with four custom elements + `defineExtension`. |

### Modified files

| Path | Reason |
| ---- | ------ |
| `frontend/tsconfig.json` | Add `paths` alias for `@comtrya/extension-host`. |
| `frontend/package.json` | Add `test` script (`bun test`). |
| `frontend/src/contracts.ts` | Remove v1 schema; keep client + viewer types only. |
| `frontend/src/pages/index.astro` | Replace markup with `<main id="app">` boot mount + page-home script. |
| `frontend/src/main.ts` | Reduced to a no-op stub (replaced by `shell/page-home.ts`). |
| `frontend/src/styles.css` | Full rewrite to Mechanical Specimen + 6 palette themes. |
| `crates/core/src/extensions.rs` | Add `route_prefix: Option<String>` to install config + slug/reserved validation. |
| `crates/server/src/main.rs` | Reserved prefix list; manifest v2 acceptance; new GraphQL fields. |
| `extensions/first-party/ext_pull_requests/{manifest,ui/manifest}.json + assets/index.js` | Migrate to v2 + SDK. `routePrefix: "pulls"`. |
| `extensions/first-party/ext_code_browser/{manifest,ui/manifest}.json + assets/index.js` | Same. `routePrefix: "code"`. |
| `extensions/first-party/ext_checks/{manifest,ui/manifest}.json + assets/index.js` | Same. `routePrefix: "checks"`. |
| `SPEC_COVERAGE.md`, `TODO.md`, `start.sh`, `DEMO_RUNBOOK.md`, `PRODUCTION_TESTBED.md` | Reconcile new surfaces, smoke assertions, doc paths. |

---

## Phase A — SDK package

### Task 1: Add `bun test` script and path alias

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/tsconfig.json`

- [ ] **Step 1: Add test script**

Modify `frontend/package.json` `scripts` block to include `"test": "bun test src/extension-host-sdk src/shell"`. Final scripts:

```json
"scripts": {
  "dev": "astro dev --host 127.0.0.1",
  "typecheck": "bun ./node_modules/typescript/bin/tsc --noEmit",
  "build": "astro build",
  "preview": "astro preview",
  "test": "bun test src/extension-host-sdk src/shell"
}
```

- [ ] **Step 2: Add path alias**

Add to `frontend/tsconfig.json` `compilerOptions`:

```json
"baseUrl": ".",
"paths": {
  "@comtrya/extension-host": ["./src/extension-host-sdk/index.ts"]
}
```

- [ ] **Step 3: Verify typecheck still passes**

Run: `cd frontend && bun run typecheck`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add frontend/package.json frontend/tsconfig.json
git commit -m "frontend: add @comtrya/extension-host path alias and bun test script"
```

### Task 2: SDK types

**Files:**
- Create: `frontend/src/extension-host-sdk/types.ts`

- [ ] **Step 1: Write the types**

Create `frontend/src/extension-host-sdk/types.ts`:

```ts
import type { ComtryaClient } from "../contracts";

export type SlotName =
  | "home.your-work"
  | "home.repositories"
  | "home.activity"
  | "home.instance"
  | "repository.overview"
  | "repository.code"
  | "repository.checks";

export const KNOWN_SLOT_NAMES: ReadonlySet<SlotName> = new Set([
  "home.your-work",
  "home.repositories",
  "home.activity",
  "home.instance",
  "repository.overview",
  "repository.code",
  "repository.checks",
]);

export interface SlotContribution {
  element: string;
  requiredPermission: string;
  priority?: number;
}

export interface RouteContribution {
  element: string;
  requiredPermission: string;
}

export interface Disposable {
  dispose(): void;
}

export interface ViewerHandle {
  authenticated: boolean;
  permissions: string[];
}

export interface ExtensionHost {
  readonly client: ComtryaClient;
  readonly viewer: ViewerHandle;
  readonly capabilities: Record<string, boolean>;
  registerSlot(name: SlotName, contribution: SlotContribution): Disposable;
  registerRoute(path: string, contribution: RouteContribution): Disposable;
}

export interface ExtensionDefinition {
  id: string;
  setup: (host: ExtensionHost) => void | Promise<void>;
}

export interface ExtensionAllowlist {
  extensionId: string;
  routePrefix: string | null;
  permissions: ReadonlySet<string>;
  slots: ReadonlySet<SlotName>;
  routesAllowed: boolean;
}

export interface ResolvedSlot {
  extensionId: string;
  element: string;
  requiredPermission: string;
  priority: number;
}

export interface ResolvedRoute {
  extensionId: string;
  routePrefix: string;
  path: string;
  element: string;
  requiredPermission: string;
}
```

- [ ] **Step 2: Verify typecheck**

Run: `cd frontend && bun run typecheck`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/extension-host-sdk/types.ts
git commit -m "frontend: define SDK types for extension contributions"
```

### Task 3: `defineExtension` entry

**Files:**
- Create: `frontend/src/extension-host-sdk/define-extension.ts`
- Test: `frontend/src/extension-host-sdk/define-extension.test.ts`

- [ ] **Step 1: Write the failing test**

Create `frontend/src/extension-host-sdk/define-extension.test.ts`:

```ts
import { describe, expect, test } from "bun:test";
import { defineExtension } from "./define-extension";

describe("defineExtension", () => {
  test("returns the definition unchanged", () => {
    const setup = () => {};
    const def = defineExtension({ id: "ext_test", setup });
    expect(def.id).toBe("ext_test");
    expect(def.setup).toBe(setup);
  });

  test("rejects empty id at definition time", () => {
    expect(() => defineExtension({ id: "", setup: () => {} })).toThrow(
      "extension id must be a non-empty string"
    );
  });

  test("rejects setup that is not a function", () => {
    // @ts-expect-error testing runtime guard
    expect(() => defineExtension({ id: "ext_test", setup: null })).toThrow(
      "extension setup must be a function"
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && bun test src/extension-host-sdk/define-extension.test.ts`
Expected: FAIL with module-not-found error.

- [ ] **Step 3: Write implementation**

Create `frontend/src/extension-host-sdk/define-extension.ts`:

```ts
import type { ExtensionDefinition } from "./types";

export function defineExtension(def: ExtensionDefinition): ExtensionDefinition {
  if (typeof def.id !== "string" || def.id.length === 0) {
    throw new Error("extension id must be a non-empty string");
  }
  if (typeof def.setup !== "function") {
    throw new Error("extension setup must be a function");
  }
  return def;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && bun test src/extension-host-sdk/define-extension.test.ts`
Expected: 3 passing.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/extension-host-sdk/define-extension.ts frontend/src/extension-host-sdk/define-extension.test.ts
git commit -m "frontend: implement defineExtension SDK entry"
```

### Task 4: Slot registry with contention resolution

**Files:**
- Create: `frontend/src/extension-host-sdk/slot-registry.ts`
- Test: `frontend/src/extension-host-sdk/slot-registry.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `frontend/src/extension-host-sdk/slot-registry.test.ts`:

```ts
import { describe, expect, test, beforeEach } from "bun:test";
import { SlotRegistry } from "./slot-registry";

describe("SlotRegistry", () => {
  let registry: SlotRegistry;
  beforeEach(() => { registry = new SlotRegistry(); });

  test("single claim resolves to itself", () => {
    registry.add({ extensionId: "ext_a", element: "el-a", requiredPermission: "perm.a", priority: 1000 }, "home.your-work");
    expect(registry.winner("home.your-work")?.extensionId).toBe("ext_a");
    expect(registry.shadowed("home.your-work")).toEqual([]);
  });

  test("lower priority wins contention", () => {
    registry.add({ extensionId: "ext_a", element: "el-a", requiredPermission: "p", priority: 1000 }, "home.your-work");
    registry.add({ extensionId: "ext_b", element: "el-b", requiredPermission: "p", priority: 100 }, "home.your-work");
    expect(registry.winner("home.your-work")?.extensionId).toBe("ext_b");
    expect(registry.shadowed("home.your-work").map((s) => s.extensionId)).toEqual(["ext_a"]);
  });

  test("install order breaks priority ties", () => {
    registry.add({ extensionId: "ext_a", element: "el-a", requiredPermission: "p", priority: 100 }, "home.your-work");
    registry.add({ extensionId: "ext_b", element: "el-b", requiredPermission: "p", priority: 100 }, "home.your-work");
    expect(registry.winner("home.your-work")?.extensionId).toBe("ext_a");
  });

  test("removing the winner promotes the next claim", () => {
    const aDisp = registry.add({ extensionId: "ext_a", element: "el-a", requiredPermission: "p", priority: 100 }, "home.your-work");
    registry.add({ extensionId: "ext_b", element: "el-b", requiredPermission: "p", priority: 1000 }, "home.your-work");
    aDisp.dispose();
    expect(registry.winner("home.your-work")?.extensionId).toBe("ext_b");
    expect(registry.shadowed("home.your-work")).toEqual([]);
  });

  test("disposing twice is a no-op", () => {
    const disp = registry.add({ extensionId: "ext_a", element: "el-a", requiredPermission: "p", priority: 100 }, "home.your-work");
    disp.dispose();
    disp.dispose();
    expect(registry.winner("home.your-work")).toBeUndefined();
  });

  test("listSlots returns all slot names with at least one claim", () => {
    registry.add({ extensionId: "ext_a", element: "el-a", requiredPermission: "p", priority: 100 }, "home.your-work");
    registry.add({ extensionId: "ext_a", element: "el-a2", requiredPermission: "p", priority: 100 }, "home.activity");
    expect(new Set(registry.listSlots())).toEqual(new Set(["home.your-work", "home.activity"]));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && bun test src/extension-host-sdk/slot-registry.test.ts`
Expected: module-not-found.

- [ ] **Step 3: Implement SlotRegistry**

Create `frontend/src/extension-host-sdk/slot-registry.ts`:

```ts
import type { Disposable, ResolvedSlot, SlotName } from "./types";

interface Entry extends ResolvedSlot { insertionOrder: number; }

export class SlotRegistry {
  private entries = new Map<SlotName, Entry[]>();
  private nextOrder = 0;

  add(slot: ResolvedSlot, name: SlotName): Disposable {
    const entry: Entry = { ...slot, insertionOrder: this.nextOrder++ };
    const list = this.entries.get(name) ?? [];
    list.push(entry);
    list.sort((a, b) => (a.priority - b.priority) || (a.insertionOrder - b.insertionOrder));
    this.entries.set(name, list);
    let disposed = false;
    return {
      dispose: () => {
        if (disposed) return;
        disposed = true;
        const current = this.entries.get(name);
        if (!current) return;
        const filtered = current.filter((e) => e !== entry);
        if (filtered.length === 0) this.entries.delete(name);
        else this.entries.set(name, filtered);
      },
    };
  }

  winner(name: SlotName): ResolvedSlot | undefined {
    return this.entries.get(name)?.[0];
  }

  shadowed(name: SlotName): ResolvedSlot[] {
    const list = this.entries.get(name);
    if (!list || list.length <= 1) return [];
    return list.slice(1);
  }

  listSlots(): SlotName[] {
    return Array.from(this.entries.keys());
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && bun test src/extension-host-sdk/slot-registry.test.ts`
Expected: 6 passing.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/extension-host-sdk/slot-registry.ts frontend/src/extension-host-sdk/slot-registry.test.ts
git commit -m "frontend: implement slot registry with priority-based contention"
```

### Task 5: Host facade with allowlist enforcement

**Files:**
- Create: `frontend/src/extension-host-sdk/host-facade.ts`
- Test: `frontend/src/extension-host-sdk/host-facade.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `frontend/src/extension-host-sdk/host-facade.test.ts`:

```ts
import { describe, expect, test, beforeEach } from "bun:test";
import { createHostFacade } from "./host-facade";
import { SlotRegistry } from "./slot-registry";
import { KNOWN_SLOT_NAMES, type ExtensionAllowlist } from "./types";

const STUB_CLIENT = {} as never;
const STUB_VIEWER = { authenticated: true, permissions: ["workspace.read"] };
const STUB_CAPS = {};

function allowlist(over: Partial<ExtensionAllowlist> = {}): ExtensionAllowlist {
  return {
    extensionId: "ext_test",
    routePrefix: null,
    permissions: new Set(["workspace.read"]),
    slots: new Set(["home.your-work"]),
    routesAllowed: false,
    ...over,
  };
}

describe("createHostFacade", () => {
  let registry: SlotRegistry;
  beforeEach(() => { registry = new SlotRegistry(); });

  test("registerSlot succeeds for allowlisted slot", () => {
    const facade = createHostFacade(allowlist(), registry, [], STUB_CLIENT, STUB_VIEWER, STUB_CAPS);
    const disp = facade.registerSlot("home.your-work", { element: "x-el", requiredPermission: "workspace.read" });
    expect(typeof disp.dispose).toBe("function");
    expect(registry.winner("home.your-work")?.extensionId).toBe("ext_test");
  });

  test("registerSlot rejects slot not in allowlist", () => {
    const facade = createHostFacade(allowlist(), registry, [], STUB_CLIENT, STUB_VIEWER, STUB_CAPS);
    expect(() => facade.registerSlot("home.activity", { element: "x-el", requiredPermission: "p" }))
      .toThrow(/home.activity.*not in allowlist/);
  });

  test("registerSlot rejects slot not in known set", () => {
    const facade = createHostFacade(allowlist({ slots: new Set(["bogus" as never]) }), registry, [], STUB_CLIENT, STUB_VIEWER, STUB_CAPS);
    expect(() => facade.registerSlot("bogus" as never, { element: "x-el", requiredPermission: "p" }))
      .toThrow(/unknown slot name/);
  });

  test("registerSlot rejects permission not in allowlist", () => {
    const facade = createHostFacade(allowlist(), registry, [], STUB_CLIENT, STUB_VIEWER, STUB_CAPS);
    expect(() => facade.registerSlot("home.your-work", { element: "x-el", requiredPermission: "events.read" }))
      .toThrow(/events.read.*not declared/);
  });

  test("registerRoute rejects when routes not allowed", () => {
    const facade = createHostFacade(allowlist(), registry, [], STUB_CLIENT, STUB_VIEWER, STUB_CAPS);
    expect(() => facade.registerRoute("/", { element: "x-el", requiredPermission: "workspace.read" }))
      .toThrow(/routes are not enabled/);
  });

  test("registerRoute records route under prefix", () => {
    const routes: import("./types").ResolvedRoute[] = [];
    const facade = createHostFacade(
      allowlist({ routePrefix: "pulls", routesAllowed: true, permissions: new Set(["pull-requests.read"]) }),
      registry, routes, STUB_CLIENT, STUB_VIEWER, STUB_CAPS
    );
    facade.registerRoute("/:pullId", { element: "x-detail", requiredPermission: "pull-requests.read" });
    expect(routes).toEqual([{
      extensionId: "ext_test",
      routePrefix: "pulls",
      path: "/:pullId",
      element: "x-detail",
      requiredPermission: "pull-requests.read",
    }]);
  });

  test("registerRoute rejects path not starting with /", () => {
    const facade = createHostFacade(
      allowlist({ routePrefix: "pulls", routesAllowed: true }),
      registry, [], STUB_CLIENT, STUB_VIEWER, STUB_CAPS
    );
    expect(() => facade.registerRoute("nope", { element: "x", requiredPermission: "workspace.read" }))
      .toThrow(/route path must start with/);
  });

  test("exposes known slot names externally", () => {
    expect(KNOWN_SLOT_NAMES.has("home.your-work")).toBe(true);
    expect(KNOWN_SLOT_NAMES.has("bogus" as never)).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && bun test src/extension-host-sdk/host-facade.test.ts`
Expected: module-not-found.

- [ ] **Step 3: Implement createHostFacade**

Create `frontend/src/extension-host-sdk/host-facade.ts`:

```ts
import type { ComtryaClient } from "../contracts";
import type { SlotRegistry } from "./slot-registry";
import {
  KNOWN_SLOT_NAMES,
  type Disposable,
  type ExtensionAllowlist,
  type ExtensionHost,
  type ResolvedRoute,
  type RouteContribution,
  type SlotContribution,
  type SlotName,
  type ViewerHandle,
} from "./types";

export function createHostFacade(
  allowlist: ExtensionAllowlist,
  registry: SlotRegistry,
  routeSink: ResolvedRoute[],
  client: ComtryaClient,
  viewer: ViewerHandle,
  capabilities: Record<string, boolean>,
): ExtensionHost {
  return {
    client,
    viewer,
    capabilities,
    registerSlot(name, contribution) {
      if (!KNOWN_SLOT_NAMES.has(name)) {
        throw new Error(`unknown slot name "${name}" — host does not recognize this slot`);
      }
      if (!allowlist.slots.has(name)) {
        throw new Error(`slot "${name}" is not in allowlist for ${allowlist.extensionId}`);
      }
      if (!allowlist.permissions.has(contribution.requiredPermission)) {
        throw new Error(`permission "${contribution.requiredPermission}" is not declared by ${allowlist.extensionId}`);
      }
      return registry.add({
        extensionId: allowlist.extensionId,
        element: contribution.element,
        requiredPermission: contribution.requiredPermission,
        priority: contribution.priority ?? 1000,
      }, name);
    },
    registerRoute(path, contribution) {
      if (!allowlist.routesAllowed || !allowlist.routePrefix) {
        throw new Error(`routes are not enabled for ${allowlist.extensionId}`);
      }
      if (!path.startsWith("/")) {
        throw new Error(`route path must start with "/", got "${path}"`);
      }
      if (!allowlist.permissions.has(contribution.requiredPermission)) {
        throw new Error(`permission "${contribution.requiredPermission}" is not declared by ${allowlist.extensionId}`);
      }
      const route: ResolvedRoute = {
        extensionId: allowlist.extensionId,
        routePrefix: allowlist.routePrefix,
        path,
        element: contribution.element,
        requiredPermission: contribution.requiredPermission,
      };
      routeSink.push(route);
      let disposed = false;
      return {
        dispose: () => {
          if (disposed) return;
          disposed = true;
          const i = routeSink.indexOf(route);
          if (i >= 0) routeSink.splice(i, 1);
        },
      };
    },
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && bun test src/extension-host-sdk/host-facade.test.ts`
Expected: 8 passing.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/extension-host-sdk/host-facade.ts frontend/src/extension-host-sdk/host-facade.test.ts
git commit -m "frontend: implement extension host facade with allowlist enforcement"
```

### Task 6: SDK entry barrel

**Files:**
- Create: `frontend/src/extension-host-sdk/index.ts`

- [ ] **Step 1: Export public surface**

Create `frontend/src/extension-host-sdk/index.ts`:

```ts
export { defineExtension } from "./define-extension";
export type {
  Disposable,
  ExtensionDefinition,
  ExtensionHost,
  RouteContribution,
  SlotContribution,
  SlotName,
  ViewerHandle,
} from "./types";
```

- [ ] **Step 2: Verify alias resolves via a temp check file**

Create `frontend/src/extension-host-sdk/_alias-check.ts`:

```ts
import { defineExtension } from "@comtrya/extension-host";
import type { ExtensionHost } from "@comtrya/extension-host";
export const _example = defineExtension({
  id: "ext_alias_check",
  setup(_host: ExtensionHost) {},
});
```

Run: `cd frontend && bun run typecheck`
Expected: exit 0.

- [ ] **Step 3: Remove the temp file**

```bash
rm frontend/src/extension-host-sdk/_alias-check.ts
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/extension-host-sdk/index.ts
git commit -m "frontend: export SDK public surface for @comtrya/extension-host alias"
```

---

## Phase B — Manifest schema v2

### Task 7: v2 manifest parser + validator (TS)

**Files:**
- Create: `frontend/src/extension-host-sdk/manifest.ts`
- Test: `frontend/src/extension-host-sdk/manifest.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `frontend/src/extension-host-sdk/manifest.test.ts`:

```ts
import { describe, expect, test } from "bun:test";
import { parseManifest, type UiManifestV2 } from "./manifest";

const VALID: UiManifestV2 = {
  schemaVersion: "comtrya.ui-extension/v2",
  id: "ext_workspace_home",
  extension: "workspace-home",
  version: "0.1.0",
  publisher: "comtrya-dev",
  assets: { entry: "/_extensions/ext_workspace_home/assets/index.js", entryIntegrity: "sha256-abc", styles: [] },
  permissions: ["workspace.read"],
  contributes: { slots: ["home.your-work"], routes: false },
};

describe("parseManifest", () => {
  test("accepts a valid v2 manifest", () => {
    const r = parseManifest(VALID);
    expect(r.id).toBe("ext_workspace_home");
    expect(r.contributes.slots).toEqual(["home.your-work"]);
  });

  test("rejects v1 schema version", () => {
    expect(() => parseManifest({ ...VALID, schemaVersion: "comtrya.ui-extension/v1" as never }))
      .toThrow(/v1 manifest is deprecated/);
  });

  test("rejects unknown slot in contributes.slots", () => {
    expect(() => parseManifest({ ...VALID, contributes: { slots: ["bogus"], routes: false } }))
      .toThrow(/unknown slot.*bogus/);
  });

  test("rejects entry path not under /_extensions/", () => {
    expect(() => parseManifest({ ...VALID, assets: { ...VALID.assets, entry: "/foo.js" } }))
      .toThrow(/entry must be served by the Rust asset API/);
  });

  test("rejects missing entryIntegrity", () => {
    expect(() => parseManifest({ ...VALID, assets: { ...VALID.assets, entryIntegrity: "" } }))
      .toThrow(/entryIntegrity/);
  });

  test("requires at least one of slots or routes in contributes", () => {
    expect(() => parseManifest({ ...VALID, contributes: { slots: [], routes: false } }))
      .toThrow(/must declare at least one of slots or routes/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && bun test src/extension-host-sdk/manifest.test.ts`
Expected: module-not-found.

- [ ] **Step 3: Implement parseManifest**

Create `frontend/src/extension-host-sdk/manifest.ts`:

```ts
import { KNOWN_SLOT_NAMES, type SlotName } from "./types";

export interface UiManifestV2 {
  schemaVersion: "comtrya.ui-extension/v2";
  id: string;
  extension: string;
  version: string;
  publisher: string;
  assets: { entry: string; entryIntegrity: string; styles: string[] };
  permissions: string[];
  contributes: { slots: string[]; routes: boolean };
}

export function parseManifest(input: unknown): UiManifestV2 {
  if (!input || typeof input !== "object") throw new Error("manifest must be an object");
  const m = input as UiManifestV2;
  if (m.schemaVersion === "comtrya.ui-extension/v1") {
    throw new Error("v1 manifest is deprecated — migrate to comtrya.ui-extension/v2");
  }
  if (m.schemaVersion !== "comtrya.ui-extension/v2") {
    throw new Error(`unsupported manifest schemaVersion: ${m.schemaVersion}`);
  }
  if (!m.id) throw new Error("manifest must include a non-empty id");
  if (!m.assets?.entry?.startsWith("/_extensions/")) {
    throw new Error("entry must be served by the Rust asset API at /_extensions/");
  }
  if (!m.assets.entryIntegrity?.startsWith("sha256-")) {
    throw new Error("entryIntegrity must be a sha256-prefixed value");
  }
  if (!Array.isArray(m.permissions)) throw new Error("permissions must be an array of strings");
  if (!m.contributes || typeof m.contributes !== "object") throw new Error("contributes block is required");
  if (!Array.isArray(m.contributes.slots)) throw new Error("contributes.slots must be an array of slot names");
  if (typeof m.contributes.routes !== "boolean") throw new Error("contributes.routes must be a boolean");
  if (m.contributes.slots.length === 0 && !m.contributes.routes) {
    throw new Error("manifest must declare at least one of slots or routes in contributes");
  }
  for (const slot of m.contributes.slots) {
    if (!KNOWN_SLOT_NAMES.has(slot as SlotName)) {
      throw new Error(`unknown slot name "${slot}" in contributes.slots`);
    }
  }
  return m;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && bun test src/extension-host-sdk/manifest.test.ts`
Expected: 6 passing.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/extension-host-sdk/manifest.ts frontend/src/extension-host-sdk/manifest.test.ts
git commit -m "frontend: parse and validate UI manifest schema v2"
```

### Task 8: Add `route_prefix` to ExtensionInstallConfig (Rust)

**Files:**
- Modify: `crates/core/src/extensions.rs`

- [ ] **Step 1: Locate the struct**

Run: `grep -n "pub struct ExtensionInstallConfig\|impl ExtensionInstallConfig\|#\\[cfg(test)\\]" crates/core/src/extensions.rs`

Note the struct definition line and the test module line.

- [ ] **Step 2: Write the failing tests**

Add inside the existing `#[cfg(test)] mod tests` block in `crates/core/src/extensions.rs`:

```rust
#[test]
fn route_prefix_accepts_valid_slug() {
    let cfg = ExtensionInstallConfig {
        id: "ext_x".into(),
        source: ExtensionSource::Local { path: "/tmp/x".into() },
        route_prefix: Some("pulls".into()),
    };
    assert!(cfg.validate().is_ok());
}

#[test]
fn route_prefix_rejects_reserved_name() {
    let cfg = ExtensionInstallConfig {
        id: "ext_x".into(),
        source: ExtensionSource::Local { path: "/tmp/x".into() },
        route_prefix: Some("r".into()),
    };
    assert!(cfg.validate().is_err());
}

#[test]
fn route_prefix_rejects_invalid_chars() {
    let cfg = ExtensionInstallConfig {
        id: "ext_x".into(),
        source: ExtensionSource::Local { path: "/tmp/x".into() },
        route_prefix: Some("With/Slash".into()),
    };
    assert!(cfg.validate().is_err());
}

#[test]
fn route_prefix_rejects_starting_with_digit() {
    let cfg = ExtensionInstallConfig {
        id: "ext_x".into(),
        source: ExtensionSource::Local { path: "/tmp/x".into() },
        route_prefix: Some("9abc".into()),
    };
    assert!(cfg.validate().is_err());
}

#[test]
fn route_prefix_allows_none() {
    let cfg = ExtensionInstallConfig {
        id: "ext_x".into(),
        source: ExtensionSource::Local { path: "/tmp/x".into() },
        route_prefix: None,
    };
    assert!(cfg.validate().is_ok());
}
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `cargo test -p comtrya-core extensions::tests::route_prefix`
Expected: compile error or FAIL.

- [ ] **Step 4: Add the field and validation**

Modify `ExtensionInstallConfig` in `crates/core/src/extensions.rs`:

```rust
#[derive(Debug, Clone, PartialEq)]
pub struct ExtensionInstallConfig {
    pub id: String,
    pub source: ExtensionSource,
    pub route_prefix: Option<String>,
}

pub const RESERVED_ROUTE_PREFIXES: &[&str] = &[
    "r", "x", "_extensions", "api", "auth", "git",
    "graphql", "events", "readyz", "healthz", "instance",
];

fn validate_route_prefix(prefix: &str) -> Result<(), String> {
    let mut chars = prefix.chars();
    let first = chars.next().ok_or_else(|| "route_prefix must not be empty".to_string())?;
    if !first.is_ascii_lowercase() {
        return Err(format!("route_prefix must start with a-z, got '{first}'"));
    }
    for c in chars {
        if !(c.is_ascii_lowercase() || c.is_ascii_digit() || c == '-') {
            return Err(format!("route_prefix must match [a-z][a-z0-9-]*, found '{c}'"));
        }
    }
    if RESERVED_ROUTE_PREFIXES.contains(&prefix) {
        return Err(format!("route_prefix '{prefix}' is reserved by the host"));
    }
    Ok(())
}
```

Extend the existing `validate(&self)` impl to call `validate_route_prefix(prefix)?` when `route_prefix.is_some()`. Keep all existing id + source validation in place.

- [ ] **Step 5: Update existing construction sites**

Run: `grep -rn "ExtensionInstallConfig {" crates/`

For each site that lacks `route_prefix`, add `route_prefix: None,`. Sites to expect include `crates/core/src/config.rs:693, 709, 724`.

- [ ] **Step 6: Run all crate tests**

Run: `cargo test -p comtrya-core`
Expected: green; the 5 new tests pass.

Run: `cargo test --workspace`
Expected: green. Fix any remaining construction sites surfaced by compile errors with `route_prefix: None`.

- [ ] **Step 7: Commit**

```bash
git add crates/
git commit -m "core: add route_prefix to ExtensionInstallConfig with slug + reserved-name validation"
```

### Task 9: Accept manifest v2 in extension loader (Rust)

**Files:**
- Modify: `crates/server/src/main.rs`

- [ ] **Step 1: Find the manifest reading site**

Run: `grep -n "comtrya.ui-extension/v1\|schemaVersion" crates/server/src/main.rs`

Identify the function parsing UI manifests. Read 30 lines of surrounding context to understand its callers.

- [ ] **Step 2: Write the failing tests**

Add to `crates/server/src/main.rs` test module:

```rust
#[test]
fn manifest_v2_accepted_with_contributes_block() {
    let v2 = serde_json::json!({
        "schemaVersion": "comtrya.ui-extension/v2",
        "id": "ext_test",
        "extension": "test",
        "version": "0.1.0",
        "publisher": "comtrya-dev",
        "assets": {
            "entry": "/_extensions/ext_test/assets/index.js",
            "entryIntegrity": "sha256-abc",
            "styles": []
        },
        "permissions": ["pull-requests.read"],
        "contributes": { "slots": ["repository.overview"], "routes": true }
    });
    let result = validate_ui_manifest_from_value(&v2);
    assert!(result.is_ok(), "expected v2 manifest to validate: {result:?}");
}

#[test]
fn manifest_v1_rejected_after_migration_window() {
    let v1 = serde_json::json!({
        "schemaVersion": "comtrya.ui-extension/v1",
        "id": "ext_legacy",
        "extension": "legacy",
        "assets": { "entry": "/_extensions/ext_legacy/assets/index.js", "entryIntegrity": "sha256-xyz", "styles": [] },
        "routes": [],
        "slots": [{ "slot": "repository.code", "element": "x-el", "requiredPermission": "code.read" }]
    });
    let result = validate_ui_manifest_from_value(&v1);
    assert!(result.is_err(), "v1 manifest should be rejected; got {result:?}");
}

#[test]
fn manifest_v2_rejects_unknown_slot_name() {
    let v2 = serde_json::json!({
        "schemaVersion": "comtrya.ui-extension/v2",
        "id": "ext_test", "extension": "test", "version": "0.1.0", "publisher": "comtrya-dev",
        "assets": { "entry": "/_extensions/ext_test/assets/index.js", "entryIntegrity": "sha256-abc", "styles": [] },
        "permissions": [],
        "contributes": { "slots": ["bogus"], "routes": false }
    });
    let result = validate_ui_manifest_from_value(&v2);
    assert!(result.is_err());
    assert!(result.unwrap_err().contains("bogus"));
}
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `cargo test -p comtrya-server manifest_v`
Expected: compile error.

- [ ] **Step 4: Implement v2 manifest validation**

Replace the existing v1 manifest parser in `crates/server/src/main.rs` with v2:

```rust
const UI_MANIFEST_SCHEMA_V2: &str = "comtrya.ui-extension/v2";
const KNOWN_SLOT_NAMES: &[&str] = &[
    "home.your-work",
    "home.repositories",
    "home.activity",
    "home.instance",
    "repository.overview",
    "repository.code",
    "repository.checks",
];

#[derive(Debug, serde::Deserialize)]
pub struct UiManifestV2 {
    #[serde(rename = "schemaVersion")]
    pub schema_version: String,
    pub id: String,
    pub extension: String,
    pub version: String,
    pub publisher: String,
    pub assets: UiAssetsV2,
    pub permissions: Vec<String>,
    pub contributes: UiContributesV2,
}

#[derive(Debug, serde::Deserialize)]
pub struct UiAssetsV2 {
    pub entry: String,
    #[serde(rename = "entryIntegrity")]
    pub entry_integrity: String,
    pub styles: Vec<String>,
}

#[derive(Debug, serde::Deserialize)]
pub struct UiContributesV2 {
    pub slots: Vec<String>,
    pub routes: bool,
}

pub fn validate_ui_manifest_at(path: &std::path::Path) -> Result<UiManifestV2, String> {
    let bytes = std::fs::read(path).map_err(|e| format!("read {}: {e}", path.display()))?;
    let value: serde_json::Value = serde_json::from_slice(&bytes)
        .map_err(|e| format!("parse {}: {e}", path.display()))?;
    validate_ui_manifest_from_value(&value)
}

pub fn validate_ui_manifest_from_value(value: &serde_json::Value) -> Result<UiManifestV2, String> {
    let m: UiManifestV2 = serde_json::from_value(value.clone())
        .map_err(|e| format!("manifest shape: {e}"))?;
    if m.schema_version == "comtrya.ui-extension/v1" {
        return Err("v1 manifest is deprecated; migrate to comtrya.ui-extension/v2".into());
    }
    if m.schema_version != UI_MANIFEST_SCHEMA_V2 {
        return Err(format!("unsupported manifest schemaVersion: {}", m.schema_version));
    }
    if m.id.is_empty() { return Err("manifest id must be non-empty".into()); }
    if !m.assets.entry.starts_with("/_extensions/") {
        return Err("entry must be served from /_extensions/".into());
    }
    if !m.assets.entry_integrity.starts_with("sha256-") {
        return Err("entryIntegrity must be sha256-prefixed".into());
    }
    if m.contributes.slots.is_empty() && !m.contributes.routes {
        return Err("contributes must declare at least one slot or routes:true".into());
    }
    for slot in &m.contributes.slots {
        if !KNOWN_SLOT_NAMES.contains(&slot.as_str()) {
            return Err(format!("unknown slot name '{slot}'"));
        }
    }
    Ok(m)
}
```

Replace every call to the v1 parser with `validate_ui_manifest_at`. Remove the v1 manifest structs.

- [ ] **Step 5: Run tests**

Run: `cargo test -p comtrya-server manifest_v`
Expected: 3 passing.

Run: `cargo test --workspace`
Expected: green. The three existing first-party extension manifests will fail validation until Phase F migrates them; for now mark the affected loader test `#[ignore]` with a referencing comment, or stub the fixture path to the v2 manifest you'll create in Phase F.

- [ ] **Step 6: Commit**

```bash
git add crates/
git commit -m "server: validate UI manifest schema v2 with contributes allowlist"
```

### Task 10: Reserved-prefix + uniqueness check at install time

**Files:**
- Modify: `crates/server/src/main.rs`

- [ ] **Step 1: Write the failing test**

Add to the server test module:

```rust
#[test]
fn duplicate_route_prefixes_rejected_at_install() {
    let configs = vec![
        ExtensionInstallConfig {
            id: "ext_a".into(),
            source: ExtensionSource::Local { path: "/tmp/a".into() },
            route_prefix: Some("pulls".into()),
        },
        ExtensionInstallConfig {
            id: "ext_b".into(),
            source: ExtensionSource::Local { path: "/tmp/b".into() },
            route_prefix: Some("pulls".into()),
        },
    ];
    let result = validate_route_prefix_uniqueness(&configs);
    assert!(result.is_err());
    let msg = result.unwrap_err();
    assert!(msg.contains("pulls"), "error should name the duplicated prefix, got: {msg}");
}
```

- [ ] **Step 2: Run to verify it fails**

Run: `cargo test -p comtrya-server duplicate_route_prefixes`
Expected: FAIL.

- [ ] **Step 3: Implement uniqueness check**

Add to `crates/server/src/main.rs`:

```rust
pub fn validate_route_prefix_uniqueness(
    configs: &[ExtensionInstallConfig],
) -> Result<(), String> {
    let mut seen: std::collections::HashMap<&str, &str> = std::collections::HashMap::new();
    for cfg in configs {
        if let Some(prefix) = &cfg.route_prefix {
            if let Some(prev) = seen.insert(prefix.as_str(), cfg.id.as_str()) {
                return Err(format!(
                    "route_prefix '{prefix}' is claimed by both '{prev}' and '{}'",
                    cfg.id
                ));
            }
        }
    }
    Ok(())
}
```

Call `validate_route_prefix_uniqueness` from the extension boot path before any extension instantiates.

- [ ] **Step 4: Run tests**

Run: `cargo test -p comtrya-server duplicate_route_prefixes`
Expected: PASS.

Run: `cargo test --workspace`
Expected: green.

- [ ] **Step 5: Commit**

```bash
git add crates/server/src/main.rs
git commit -m "server: reject duplicate route_prefix claims at install time"
```

---

## Phase C — Astro pages and routing

### Task 11: `workspace.repositoryByPath` GraphQL field

**Files:**
- Modify: `crates/server/src/main.rs`

- [ ] **Step 1: Locate the workspace GraphQL root**

Run: `grep -n "fn workspace\|workspace_field\|RepositoryRecord" crates/server/src/main.rs | head`

- [ ] **Step 2: Write failing tests**

Add to the server test module:

```rust
#[test]
fn repository_by_path_resolves_demo_repo() {
    let resolved = resolve_repository_by_path(
        &demo_workspace_state(),
        &["comtrya".to_string()],
    );
    assert!(resolved.is_some());
    assert_eq!(resolved.as_ref().unwrap().name, "comtrya");
}

#[test]
fn repository_by_path_returns_none_for_unknown_path() {
    let resolved = resolve_repository_by_path(
        &demo_workspace_state(),
        &["nothing".to_string()],
    );
    assert!(resolved.is_none());
}
```

(Use the existing seed helper — confirm name with `grep`.)

- [ ] **Step 3: Run to verify it fails**

Run: `cargo test -p comtrya-server repository_by_path`
Expected: FAIL.

- [ ] **Step 4: Implement the resolver**

```rust
pub fn resolve_repository_by_path<'a>(
    state: &'a WorkspaceState,
    segments: &[String],
) -> Option<&'a RepositoryRecord> {
    if segments.is_empty() { return None; }
    let path = segments.join("/");
    state.repositories.iter().find(|r| {
        let full = if r.groups.is_empty() {
            r.name.clone()
        } else {
            format!("{}/{}", r.groups.join("/"), r.name)
        };
        full == path
    })
}
```

Wire it into the GraphQL workspace root:

```graphql
extend type Workspace {
  repositoryByPath(segments: [String!]!): Repository
}
```

Re-use the existing `Repository` projection.

- [ ] **Step 5: Run tests**

Run: `cargo test --workspace`
Expected: green.

- [ ] **Step 6: Commit**

```bash
git add crates/server/src/main.rs
git commit -m "server: add workspace.repositoryByPath GraphQL field for nested-group lookup"
```

### Task 12: `pages/r/[...path].astro` repo dashboard route

**Files:**
- Create: `frontend/src/pages/r/[...path].astro`

- [ ] **Step 1: Create the page**

Create `frontend/src/pages/r/[...path].astro`:

```astro
---
import "../../styles.css";

export const prerender = false;

const pathParam = Astro.params.path ?? "";
const segments = pathParam.split("/").filter((s) => s.length > 0);

const backend = process.env.COMTRYA_SERVER_URL ?? "http://127.0.0.1:8080";
const operatorCode = process.env.PUBLIC_COMTRYA_OPERATOR_CODE ?? "";

let repoId: string | null = null;
let resolvedName = "";
let resolvedGroups: string[] = [];

try {
  if (operatorCode) {
    const tokenResponse = await fetch(new URL("/auth/token-exchange", backend), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grantType: "urn:comtrya:grant:operator-code",
        subjectToken: operatorCode,
        subjectTokenType: "urn:comtrya:token-type:operator-code",
        requestedResource: "comtrya://workspace",
        requestedActions: ["graphql:read"],
      }),
    });
    const token = await tokenResponse.json();
    if (tokenResponse.ok && token.accessToken) {
      const graphqlResponse = await fetch(new URL("/graphql", backend), {
        method: "POST",
        headers: { Authorization: `Bearer ${token.accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          query: "query($segments: [String!]!) { workspace { repositoryByPath(segments: $segments) { id name groups } } }",
          variables: { segments },
        }),
      });
      const graphql = await graphqlResponse.json();
      const repo = graphql?.data?.workspace?.repositoryByPath;
      if (repo) {
        repoId = repo.id;
        resolvedName = repo.name;
        resolvedGroups = repo.groups ?? [];
      }
    }
  }
} catch {
  repoId = null;
}

if (!repoId) {
  return new Response(`Not found: /r/${pathParam}`, { status: 404 });
}

const title = (resolvedGroups.length ? resolvedGroups.join("/") + "/" : "") + resolvedName;
---
<!doctype html>
<html lang="en" data-theme="print">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{title} · Comtrya</title>
  </head>
  <body data-scope="repository" data-repo-id={repoId} data-repo-name={resolvedName} data-repo-groups={resolvedGroups.join("/")}>
    <main id="app" data-smoke="repo-dashboard"></main>
    <script src="../../shell/page-repo.ts"></script>
  </body>
</html>
```

- [ ] **Step 2: Verify dev server resolves the route**

Run: `cd frontend && bun run dev`

In another terminal:
```
curl -sI http://127.0.0.1:4321/r/comtrya | head -1
curl -sI http://127.0.0.1:4321/r/does-not-exist | head -1
```
Expected: `200` then `404`.

Stop the dev server.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/r/[...path].astro
git commit -m "frontend: add /r/<...>/<repo> repo dashboard route with SSR path resolution"
```

### Task 13: `pages/x/[prefix]/[...path].astro` extension page route

**Files:**
- Create: `frontend/src/pages/x/[prefix]/[...path].astro`
- Modify: `crates/server/src/main.rs` (extension installations projection)

- [ ] **Step 1: Add `routePrefix` to `extensionInstallations` GraphQL field**

Find the field with `grep -n "extensionInstallations\|fn extension_install" crates/server/src/main.rs | head`.

Add `routePrefix: Option<String>` to the projection, pulling from `ExtensionInstallConfig.route_prefix`. Update the GraphQL schema to include `routePrefix: String` (nullable). Update the GraphQL test that asserts the shape of `extensionInstallations` (search `extensionInstallations` in tests) to expect the new field.

- [ ] **Step 2: Create the extension page**

Create `frontend/src/pages/x/[prefix]/[...path].astro`:

```astro
---
import "../../../styles.css";

export const prerender = false;

const prefix = Astro.params.prefix ?? "";
const sub = Astro.params.path ?? "";
const subPath = "/" + sub;

const backend = process.env.COMTRYA_SERVER_URL ?? "http://127.0.0.1:8080";

let known = false;
try {
  const resp = await fetch(new URL("/graphql", backend), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: "{ extensionInstallations { id routePrefix } }" }),
  });
  const body = await resp.json();
  const installs = body?.data?.extensionInstallations ?? [];
  known = installs.some((e: { routePrefix?: string | null }) => e.routePrefix === prefix);
} catch {
  known = false;
}

if (!known) {
  return new Response(`No extension registered for /x/${prefix}/`, { status: 404 });
}
---
<!doctype html>
<html lang="en" data-theme="print">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{prefix} · Comtrya</title>
  </head>
  <body data-scope="extension" data-route-prefix={prefix} data-sub-path={subPath}>
    <main id="app" data-smoke="extension-page"></main>
    <script src="../../../shell/page-ext.ts"></script>
  </body>
</html>
```

- [ ] **Step 3: Verify compile**

Run: `cargo check --workspace`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/x crates/server/src/main.rs
git commit -m "frontend: add /x/<prefix>/<...> route; expose routePrefix via extensionInstallations GraphQL"
```

### Task 14: `pages/instance.astro` reserved stub

**Files:**
- Create: `frontend/src/pages/instance.astro`

- [ ] **Step 1: Create the redirect stub**

Create `frontend/src/pages/instance.astro`:

```astro
---
export const prerender = false;
return Astro.redirect("/#instance");
---
```

- [ ] **Step 2: Verify it redirects**

Run: `cd frontend && bun run dev`

```
curl -sI http://127.0.0.1:4321/instance | head -3
```
Expected: `HTTP/1.1 302` with `location: /#instance`.

Stop the dev server.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/instance.astro
git commit -m "frontend: reserve /instance route with redirect stub"
```

---

## Phase D — Host shell rewrite

### Task 15: DOM construction helper

**Files:**
- Create: `frontend/src/shell/dom.ts`
- Test: `frontend/src/shell/dom.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `frontend/src/shell/dom.test.ts`:

```ts
import { describe, expect, test } from "bun:test";
import { el, text } from "./dom";

describe("el helper", () => {
  test("creates element with class and text child", () => {
    const node = el("div", { className: "foo" }, text("hello"));
    expect(node.tagName).toBe("DIV");
    expect(node.className).toBe("foo");
    expect(node.textContent).toBe("hello");
  });

  test("nests elements", () => {
    const node = el("ul", {}, el("li", {}, text("a")), el("li", {}, text("b")));
    expect(node.children.length).toBe(2);
    expect(node.children[0]!.textContent).toBe("a");
  });

  test("sets data attributes via dataset", () => {
    const node = el("section", { dataset: { smoke: "x", slot: "home.your-work" } });
    expect(node.dataset.smoke).toBe("x");
    expect(node.dataset.slot).toBe("home.your-work");
  });

  test("ignores nullish children", () => {
    const node = el("p", {}, null, text("kept"), undefined);
    expect(node.children.length).toBe(0);
    expect(node.textContent).toBe("kept");
  });

  test("attaches click listeners", () => {
    let fired = 0;
    const node = el("button", { onClick: () => { fired++; } });
    node.click();
    expect(fired).toBe(1);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd frontend && bun test src/shell/dom.test.ts`
Expected: module-not-found.

- [ ] **Step 3: Implement the helper**

Create `frontend/src/shell/dom.ts`:

```ts
type Child = Node | string | null | undefined;

interface ElProps {
  className?: string;
  textContent?: string;
  dataset?: Record<string, string>;
  onClick?: (e: MouseEvent) => void;
  attrs?: Record<string, string>;
  type?: string;
}

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: ElProps = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (props.className) node.className = props.className;
  if (props.textContent !== undefined) node.textContent = props.textContent;
  if (props.dataset) {
    for (const [k, v] of Object.entries(props.dataset)) node.dataset[k] = v;
  }
  if (props.attrs) {
    for (const [k, v] of Object.entries(props.attrs)) node.setAttribute(k, v);
  }
  if (props.type && "type" in node) (node as HTMLInputElement).type = props.type;
  if (props.onClick) node.addEventListener("click", props.onClick);
  for (const child of children) {
    if (child == null) continue;
    node.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
  }
  return node;
}

export function text(value: string): Text {
  return document.createTextNode(value);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd frontend && bun test src/shell/dom.test.ts`
Expected: 5 passing.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/shell/dom.ts frontend/src/shell/dom.test.ts
git commit -m "frontend: el() DOM construction helper"
```

### Task 16: Styles — Mechanical Specimen + 6 themes

**Files:**
- Modify: `frontend/src/styles.css`

- [ ] **Step 1: Replace styles.css**

Open `docs/mockups/workspace-homepage/04-mechanical-specimen.html` and copy its full `<style>` block contents into `frontend/src/styles.css`. Keep:
- All `:root, [data-theme="..."]` blocks (6 themes)
- Topbar / sidebar / layout / nav rules
- Section / strap / row rules
- Repo list, activity, instance strip rules
- Theme switcher rules
- Status chips, check chips

Drop only the mockup-only `.ds-strap`, `.ds-name`, `.ds-footer` selectors.

- [ ] **Step 2: Smoke**

Run: `cd frontend && bun run dev`
```
curl -s http://127.0.0.1:4321/ | head -5
```
Expected: HTML response, no 500.

Stop the dev server.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/styles.css
git commit -m "frontend: replace styles.css with Mechanical Specimen + 6 palette themes"
```

### Task 17: Theme switcher module

**Files:**
- Create: `frontend/src/shell/theme.ts`
- Test: `frontend/src/shell/theme.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `frontend/src/shell/theme.test.ts`:

```ts
import { beforeEach, describe, expect, test } from "bun:test";
import { applyStoredTheme, persistTheme, THEME_STORAGE_KEY, KNOWN_THEMES } from "./theme";

describe("theme persistence", () => {
  beforeEach(() => {
    document.documentElement.removeAttribute("data-theme");
    localStorage.clear();
  });

  test("applyStoredTheme defaults to print when nothing stored", () => {
    applyStoredTheme();
    expect(document.documentElement.dataset.theme).toBe("print");
  });

  test("applyStoredTheme restores persisted theme", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "catppuccin");
    applyStoredTheme();
    expect(document.documentElement.dataset.theme).toBe("catppuccin");
  });

  test("applyStoredTheme falls back to print on unknown stored value", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "bogus");
    applyStoredTheme();
    expect(document.documentElement.dataset.theme).toBe("print");
  });

  test("persistTheme writes to localStorage and applies", () => {
    persistTheme("rose-pine");
    expect(document.documentElement.dataset.theme).toBe("rose-pine");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("rose-pine");
  });

  test("KNOWN_THEMES contains the six v1 themes", () => {
    expect(new Set(KNOWN_THEMES)).toEqual(new Set([
      "print", "catppuccin", "ayu", "rose-pine", "tokyo-night", "gruvbox",
    ]));
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd frontend && bun test src/shell/theme.test.ts`
Expected: module-not-found.

- [ ] **Step 3: Implement**

Create `frontend/src/shell/theme.ts`:

```ts
export const THEME_STORAGE_KEY = "comtrya.theme";

export const KNOWN_THEMES = [
  "print",
  "catppuccin",
  "ayu",
  "rose-pine",
  "tokyo-night",
  "gruvbox",
] as const;

export type ThemeName = (typeof KNOWN_THEMES)[number];

function isKnownTheme(candidate: string | null): candidate is ThemeName {
  return candidate !== null && (KNOWN_THEMES as readonly string[]).includes(candidate);
}

export function applyStoredTheme(): void {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  const theme: ThemeName = isKnownTheme(stored) ? stored : "print";
  document.documentElement.dataset.theme = theme;
}

export function persistTheme(theme: ThemeName): void {
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  document.documentElement.dataset.theme = theme;
}
```

- [ ] **Step 4: Run to verify passes**

Run: `cd frontend && bun test src/shell/theme.test.ts`
Expected: 5 passing.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/shell/theme.ts frontend/src/shell/theme.test.ts
git commit -m "frontend: theme persistence module with 6 known palettes"
```

### Task 18: Chrome rendering (topbar + sidebar + theme switcher)

**Files:**
- Create: `frontend/src/shell/chrome.ts`

- [ ] **Step 1: Implement chrome**

Create `frontend/src/shell/chrome.ts`:

```ts
import { el, text } from "./dom";
import { KNOWN_THEMES, persistTheme, type ThemeName } from "./theme";

export interface ChromeContext {
  workspaceName: string;
  repositoryCount: number;
  viewerName: string;
  viewerPermissions: string[];
  readyState: "ready" | "warn" | "err" | "unknown";
  serverURL: string;
  extensionsWithRoutes: Array<{ routePrefix: string; displayName: string }>;
  isOperator: boolean;
}

const PALETTES: Record<ThemeName, string[]> = {
  print:        ["#ffffff", "#f6f4ef", "#0a0a0a", "#f04a1e", "#008873", "#f2c100"],
  catppuccin:   ["#1e1e2e", "#181825", "#cdd6f4", "#cba6f7", "#a6e3a1", "#f9e2af"],
  ayu:          ["#1f2430", "#171c28", "#cccac2", "#ffcc66", "#bae67e", "#5ccfe6"],
  "rose-pine":  ["#191724", "#1f1d2e", "#e0def4", "#ebbcba", "#f6c177", "#eb6f92"],
  "tokyo-night":["#1a1b26", "#16161e", "#c0caf5", "#7aa2f7", "#9ece6a", "#bb9af7"],
  gruvbox:      ["#282828", "#1d2021", "#ebdbb2", "#fe8019", "#b8bb26", "#fabd2f"],
};

export function renderChrome(ctx: ChromeContext, mount: HTMLElement, content: HTMLElement): void {
  while (mount.firstChild) mount.removeChild(mount.firstChild);
  mount.appendChild(buildTopbar(ctx));
  mount.appendChild(el("div", { className: "layout" }, buildSidebar(ctx), content));
}

function buildTopbar(ctx: ChromeContext): HTMLElement {
  return el("header", { className: "topbar", attrs: { role: "banner" } },
    el("div", { className: "brand" },
      el("div", { className: "mark", textContent: "C" }),
      el("div", { className: "name" },
        el("span", { className: "word", textContent: "Comtrya" }),
        el("span", { className: "sub", textContent: "forge · single-tenant" }),
      ),
    ),
    el("label", { className: "cmdk" },
      el("span", { className: "label", textContent: "Cmd" }),
      el("input", { type: "search", attrs: { placeholder: "repository, pull, file, ref…" } }),
      el("kbd", { textContent: "⌘K" }),
    ),
    el("div", { className: "topbar-actions" },
      el("span", { className: `chip ${ctx.readyState === "ready" ? "ok" : ctx.readyState}`, textContent: ctx.readyState }),
      el("code", { attrs: { style: "color: var(--ink-faint);" }, textContent: ctx.serverURL }),
    ),
  );
}

function buildSidebar(ctx: ChromeContext): HTMLElement {
  const workspaceBlock = el("div", { className: "workspace" },
    el("h4", { textContent: "Workspace" }),
    el("strong", { textContent: ctx.workspaceName }),
    el("div", { className: "meta", textContent: `${ctx.repositoryCount} repositories · single-tenant` }),
  );

  const workspaceNav = el("div", {},
    el("h4", { textContent: "Workspace nav" }),
    buildNav([
      { href: "/", num: "01", label: "Home" },
      { href: "/#activity", num: "02", label: "Activity" },
      { href: "/#extensions", num: "03", label: "Extensions" },
      ...(ctx.isOperator ? [{ href: "/instance", num: "04", label: "Instance" }] : []),
    ]),
  );

  const extensionEntries = ctx.extensionsWithRoutes.map((e) => ({
    href: `/x/${e.routePrefix}/`,
    num: "/x",
    label: e.displayName,
  }));
  const extensionNav = el("div", {},
    el("h4", { textContent: "Extension routes" }),
    extensionEntries.length > 0
      ? buildNav(extensionEntries)
      : el("span", { className: "meta", textContent: "none installed" }),
  );

  const viewerBlock = el("div", { attrs: { style: "margin-top: auto;" } },
    el("h4", { textContent: "Viewer" }),
    el("div", { attrs: { style: "font-family: var(--display); font-weight: 700; font-size: 18px;" }, textContent: ctx.viewerName }),
    el("div", { attrs: { style: "font-family: var(--mono); font-size: 11px; color: var(--ink-faint);" }, textContent: ctx.viewerPermissions.join(" · ") }),
    buildThemeSwitcher(),
  );

  return el("aside", { className: "sidebar" }, workspaceBlock, workspaceNav, extensionNav, viewerBlock);
}

function buildNav(entries: Array<{ href: string; num: string; label: string }>): HTMLElement {
  const nav = el("nav", { className: "nav" });
  for (const entry of entries) {
    nav.appendChild(
      el("a", { attrs: { href: entry.href } },
        el("span", { className: "num", textContent: entry.num }),
        el("span", { textContent: entry.label }),
      ),
    );
  }
  return nav;
}

function buildThemeSwitcher(): HTMLElement {
  const mount = el("div", { className: "theme-switch-inline", attrs: { "aria-label": "Color scheme" } });
  for (const theme of KNOWN_THEMES) {
    const swatches = el("span", { className: "ts-swatches" });
    for (const color of PALETTES[theme]) {
      swatches.appendChild(el("span", { attrs: { style: `background: ${color};` } }));
    }
    const btn = el("button", {
      attrs: { type: "button", "data-theme": theme },
      className: document.documentElement.dataset.theme === theme ? "active" : "",
      onClick: () => {
        persistTheme(theme);
        const buttons = mount.querySelectorAll<HTMLButtonElement>("button");
        buttons.forEach((b) => b.classList.toggle("active", b === btn));
      },
    },
      swatches,
      el("span", { className: "ts-name", textContent: theme }),
    );
    mount.appendChild(btn);
  }
  return mount;
}
```

- [ ] **Step 2: Verify typecheck**

Run: `cd frontend && bun run typecheck`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/shell/chrome.ts
git commit -m "frontend: chrome rendering with topbar, sidebar, and inline theme switcher"
```

### Task 19: Extension loader

**Files:**
- Create: `frontend/src/shell/extension-loader.ts`

- [ ] **Step 1: Implement loader**

Create `frontend/src/shell/extension-loader.ts`:

```ts
import { parseManifest } from "../extension-host-sdk/manifest";
import { createHostFacade } from "../extension-host-sdk/host-facade";
import { SlotRegistry } from "../extension-host-sdk/slot-registry";
import {
  KNOWN_SLOT_NAMES,
  type ExtensionAllowlist,
  type ExtensionDefinition,
  type ResolvedRoute,
  type SlotName,
  type ViewerHandle,
} from "../extension-host-sdk/types";
import type { ComtryaClient } from "../contracts";

export interface ExtensionLoadResult {
  registry: SlotRegistry;
  routes: ResolvedRoute[];
  failures: ExtensionLoadFailure[];
}

export interface ExtensionLoadFailure {
  extensionId: string;
  kind: "manifest" | "esm" | "setup";
  message: string;
}

export interface InstalledExtensionDescriptor {
  id: string;
  manifestUrl: string;
  routePrefix: string | null;
}

export async function loadExtensions(
  descriptors: InstalledExtensionDescriptor[],
  client: ComtryaClient,
  viewer: ViewerHandle,
  capabilities: Record<string, boolean>,
): Promise<ExtensionLoadResult> {
  const registry = new SlotRegistry();
  const routes: ResolvedRoute[] = [];
  const failures: ExtensionLoadFailure[] = [];

  for (const desc of descriptors) {
    let manifest;
    try {
      const raw = await fetch(desc.manifestUrl, { credentials: "include" });
      if (!raw.ok) throw new Error(`HTTP ${raw.status}`);
      manifest = parseManifest(await raw.json());
    } catch (e) {
      failures.push({ extensionId: desc.id, kind: "manifest", message: describe(e) });
      continue;
    }

    const allowlist: ExtensionAllowlist = {
      extensionId: desc.id,
      routePrefix: desc.routePrefix,
      permissions: new Set(manifest.permissions),
      slots: new Set(
        manifest.contributes.slots.filter((s): s is SlotName => KNOWN_SLOT_NAMES.has(s as SlotName)),
      ),
      routesAllowed: manifest.contributes.routes && desc.routePrefix !== null,
    };

    let definition: ExtensionDefinition;
    try {
      const mod = await import(/* @vite-ignore */ manifest.assets.entry);
      definition = mod.default as ExtensionDefinition;
      if (!definition || typeof definition.setup !== "function") {
        throw new Error("default export must be defineExtension(...)");
      }
    } catch (e) {
      failures.push({ extensionId: desc.id, kind: "esm", message: describe(e) });
      continue;
    }

    try {
      const facade = createHostFacade(allowlist, registry, routes, client, viewer, capabilities);
      await definition.setup(facade);
    } catch (e) {
      failures.push({ extensionId: desc.id, kind: "setup", message: describe(e) });
    }
  }
  return { registry, routes, failures };
}

function describe(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
```

- [ ] **Step 2: Verify typecheck**

Run: `cd frontend && bun run typecheck`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/shell/extension-loader.ts
git commit -m "frontend: extension loader with manifest fetch, ESM import, and setup invocation"
```

### Task 20: Homepage page (`page-home.ts`)

**Files:**
- Create: `frontend/src/shell/page-home.ts`

- [ ] **Step 1: Implement page-home**

Create `frontend/src/shell/page-home.ts`:

```ts
import { HttpComtryaClient } from "../client";
import { el, text } from "./dom";
import { applyStoredTheme } from "./theme";
import { renderChrome, type ChromeContext } from "./chrome";
import { loadExtensions } from "./extension-loader";
import type { SlotName, ViewerHandle } from "../extension-host-sdk/types";

const HOME_SLOTS: SlotName[] = ["home.your-work", "home.repositories", "home.activity", "home.instance"];

async function boot() {
  applyStoredTheme();
  const app = document.querySelector<HTMLElement>("#app");
  if (!app) return;

  const serverURL = import.meta.env.PUBLIC_COMTRYA_SERVER_URL || window.location.origin;
  const client = new HttpComtryaClient(serverURL);

  const graphql = await client.query<{
    viewer: ViewerHandle;
    instance: { id: string; name: string; capabilities: { extensionRuntime: boolean } };
    workspace: { name: string; repositories: Array<{ id: string }> };
    extensionInstallations: Array<{ id: string; displayName: string; routePrefix: string | null }>;
  }>("{ viewer { authenticated permissions } instance { id name capabilities { extensionRuntime } } workspace { name repositories { id } } extensionInstallations { id displayName routePrefix } }");

  const ctx: ChromeContext = {
    workspaceName: graphql.workspace.name,
    repositoryCount: graphql.workspace.repositories.length,
    viewerName: "viewer",
    viewerPermissions: graphql.viewer.permissions ?? [],
    readyState: "ready",
    serverURL,
    extensionsWithRoutes: graphql.extensionInstallations
      .filter((e): e is typeof e & { routePrefix: string } => e.routePrefix !== null)
      .map((e) => ({ routePrefix: e.routePrefix, displayName: e.displayName })),
    isOperator: (graphql.viewer.permissions ?? []).includes("instance.admin"),
  };

  const content = buildHomeContent();
  renderChrome(ctx, app, content);

  const descriptors = graphql.extensionInstallations.map((e) => ({
    id: e.id,
    manifestUrl: `${serverURL}/_extensions/${e.id}/manifest.json`,
    routePrefix: e.routePrefix,
  }));
  const { registry, failures } = await loadExtensions(
    descriptors, client, graphql.viewer,
    { extensionRuntime: graphql.instance.capabilities.extensionRuntime },
  );

  for (const slot of HOME_SLOTS) {
    const mount = document.querySelector<HTMLElement>(`[data-extension-slot-mount="${slot}"]`);
    if (!mount) continue;
    const winner = registry.winner(slot);
    if (!winner) {
      mount.replaceChildren(buildPlaceholder(`No extension claims ${slot}`));
      continue;
    }
    if (!viewerHas(graphql.viewer, winner.requiredPermission)) {
      mount.remove();
      continue;
    }
    const node = document.createElement(winner.element) as HTMLElement & Record<string, unknown>;
    node.comtryaClient = client;
    node.viewer = graphql.viewer;
    node.extensionSlot = slot;
    mount.replaceChildren(node);
  }

  if (failures.length > 0) console.warn("extension load failures", failures);
}

function buildHomeContent(): HTMLElement {
  const main = el("main", { className: "main" });

  const pagehead = el("section", { className: "pagehead" },
    el("div", {},
      el("div", { className: "meta-left", textContent: "/ · workspace" }),
      el("h1", { textContent: "Home." }),
    ),
    el("div", {}),
    el("div", { className: "meta-right" }),
  );
  main.appendChild(pagehead);

  const spine = el("div", { className: "col-spine", dataset: { smoke: "home-spine" } },
    slotFrame("home.your-work"),
    slotFrame("home.repositories"),
    slotFrame("home.activity"),
  );
  const rail = el("aside", { className: "col-rail" }, slotFrame("home.instance"));
  main.appendChild(el("section", { className: "grid" }, spine, rail));

  return main;
}

function slotFrame(slot: SlotName): HTMLElement {
  return el("section", {
    className: "extension-slot-frame",
    dataset: { smoke: `home-slot-${slot}` },
  },
    el("div", { className: "extension-slot-mount", dataset: { extensionSlotMount: slot } },
      buildPlaceholder(`Loading ${slot}…`),
    ),
  );
}

function buildPlaceholder(message: string): HTMLElement {
  return el("article", { className: "extension-placeholder" }, text(message));
}

function viewerHas(viewer: ViewerHandle, perm: string): boolean {
  return viewer.permissions.includes("instance.admin") || viewer.permissions.includes(perm);
}

boot().catch((e) => console.error("homepage boot failed", e));
```

- [ ] **Step 2: Verify typecheck**

Run: `cd frontend && bun run typecheck`
Expected: exit 0.

- [ ] **Step 3: Smoke test the homepage**

Run: `cd frontend && bun run dev`

```
curl -s http://127.0.0.1:4321/ | grep -c 'data-smoke="home-slot-'
```
Expected: 4.

```
curl -s http://127.0.0.1:4321/ | grep -c 'data-smoke="home-spine"'
```
Expected: 1.

Stop the dev server.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/shell/page-home.ts
git commit -m "frontend: homepage layout boots chrome and mounts four home.* slot frames"
```

### Task 21: Repo dashboard page (`page-repo.ts`)

**Files:**
- Create: `frontend/src/shell/page-repo.ts`

- [ ] **Step 1: Implement page-repo**

Create `frontend/src/shell/page-repo.ts`:

```ts
import { HttpComtryaClient } from "../client";
import { el, text } from "./dom";
import { applyStoredTheme } from "./theme";
import { renderChrome, type ChromeContext } from "./chrome";
import { loadExtensions } from "./extension-loader";
import type { SlotName, ViewerHandle } from "../extension-host-sdk/types";

const REPO_SLOTS: SlotName[] = ["repository.overview", "repository.code", "repository.checks"];

async function boot() {
  applyStoredTheme();
  const app = document.querySelector<HTMLElement>("#app");
  if (!app) return;
  const body = document.body;
  const repoId = body.dataset.repoId ?? "";
  const repoName = body.dataset.repoName ?? "";
  const groups = (body.dataset.repoGroups ?? "").split("/").filter((s) => s.length > 0);

  const serverURL = import.meta.env.PUBLIC_COMTRYA_SERVER_URL || window.location.origin;
  const client = new HttpComtryaClient(serverURL);
  const graphql = await client.query<{
    viewer: ViewerHandle;
    instance: { capabilities: { extensionRuntime: boolean } };
    workspace: { name: string; repositories: Array<{ id: string }> };
    extensionInstallations: Array<{ id: string; displayName: string; routePrefix: string | null }>;
  }>("{ viewer { authenticated permissions } instance { capabilities { extensionRuntime } } workspace { name repositories { id } } extensionInstallations { id displayName routePrefix } }");

  const ctx: ChromeContext = {
    workspaceName: graphql.workspace.name,
    repositoryCount: graphql.workspace.repositories.length,
    viewerName: "viewer",
    viewerPermissions: graphql.viewer.permissions ?? [],
    readyState: "ready",
    serverURL,
    extensionsWithRoutes: graphql.extensionInstallations
      .filter((e): e is typeof e & { routePrefix: string } => e.routePrefix !== null)
      .map((e) => ({ routePrefix: e.routePrefix, displayName: e.displayName })),
    isOperator: (graphql.viewer.permissions ?? []).includes("instance.admin"),
  };

  const content = buildRepoContent(groups, repoName, repoId);
  renderChrome(ctx, app, content);

  const descriptors = graphql.extensionInstallations.map((e) => ({
    id: e.id,
    manifestUrl: `${serverURL}/_extensions/${e.id}/manifest.json`,
    routePrefix: e.routePrefix,
  }));
  const { registry } = await loadExtensions(
    descriptors, client, graphql.viewer,
    { extensionRuntime: graphql.instance.capabilities.extensionRuntime },
  );

  for (const slot of REPO_SLOTS) {
    const mount = document.querySelector<HTMLElement>(`[data-extension-slot-mount="${slot}"]`);
    if (!mount) continue;
    const winner = registry.winner(slot);
    if (!winner) {
      mount.replaceChildren(el("article", { className: "extension-placeholder" }, text(`No extension claims ${slot}`)));
      continue;
    }
    if (!viewerHas(graphql.viewer, winner.requiredPermission)) {
      mount.remove();
      continue;
    }
    const node = document.createElement(winner.element) as HTMLElement & Record<string, unknown>;
    node.comtryaClient = client;
    node.viewer = graphql.viewer;
    node.extensionSlot = slot;
    node.repositoryId = repoId;
    node.repositoryGroups = groups;
    node.repositoryName = repoName;
    mount.replaceChildren(node);
  }
}

function buildRepoContent(groups: string[], repoName: string, repoId: string): HTMLElement {
  const main = el("main", { className: "main" });
  const groupPath = groups.length > 0 ? groups.join("/") + "/" : "";

  main.appendChild(el("section", { className: "pagehead", dataset: { smoke: "repo-dashboard" } },
    el("div", {},
      el("div", { className: "meta-left", textContent: "/r/" + groupPath + repoName }),
      el("h1", { textContent: groupPath + repoName }),
    ),
    el("div", {}),
    el("div", { className: "meta-right" },
      el("span", { textContent: "repoId " + repoId }),
    ),
  ));

  const tabs = el("nav", { className: "repo-tabs", attrs: { "aria-label": "Repository tabs" } },
    el("a", { attrs: { href: "#overview" }, className: "active", textContent: "Overview" }),
    el("a", { attrs: { href: "#code" }, textContent: "Code" }),
    el("a", { attrs: { href: "#checks" }, textContent: "Checks" }),
  );
  main.appendChild(tabs);

  for (const slot of REPO_SLOTS) {
    main.appendChild(el("section", {
      className: "extension-slot-frame",
      attrs: { id: slot.split(".")[1] ?? slot },
      dataset: { smoke: `repo-slot-${slot}` },
    },
      el("div", { className: "extension-slot-mount", dataset: { extensionSlotMount: slot } },
        el("article", { className: "extension-placeholder" }, text(`Loading ${slot}…`)),
      ),
    ));
  }
  return main;
}

function viewerHas(viewer: ViewerHandle, perm: string): boolean {
  return viewer.permissions.includes("instance.admin") || viewer.permissions.includes(perm);
}

boot().catch((e) => console.error("repo dashboard boot failed", e));
```

- [ ] **Step 2: Verify typecheck**

Run: `cd frontend && bun run typecheck`
Expected: exit 0.

- [ ] **Step 3: Smoke test**

Run: `cd frontend && bun run dev`

```
curl -s http://127.0.0.1:4321/r/comtrya | grep -c 'data-smoke="repo-slot-'
```
Expected: 3.

Stop the dev server.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/shell/page-repo.ts
git commit -m "frontend: repo dashboard mounts three repository.* slot frames under group-path identity"
```

### Task 22: Extension page (`page-ext.ts`)

**Files:**
- Create: `frontend/src/shell/page-ext.ts`

- [ ] **Step 1: Implement page-ext**

Create `frontend/src/shell/page-ext.ts`:

```ts
import { HttpComtryaClient } from "../client";
import { el, text } from "./dom";
import { applyStoredTheme } from "./theme";
import { renderChrome, type ChromeContext } from "./chrome";
import { loadExtensions } from "./extension-loader";
import type { ResolvedRoute, ViewerHandle } from "../extension-host-sdk/types";

async function boot() {
  applyStoredTheme();
  const app = document.querySelector<HTMLElement>("#app");
  if (!app) return;
  const prefix = document.body.dataset.routePrefix ?? "";
  const subPath = document.body.dataset.subPath ?? "/";

  const serverURL = import.meta.env.PUBLIC_COMTRYA_SERVER_URL || window.location.origin;
  const client = new HttpComtryaClient(serverURL);
  const graphql = await client.query<{
    viewer: ViewerHandle;
    instance: { capabilities: { extensionRuntime: boolean } };
    workspace: { name: string; repositories: Array<{ id: string }> };
    extensionInstallations: Array<{ id: string; displayName: string; routePrefix: string | null }>;
  }>("{ viewer { authenticated permissions } instance { capabilities { extensionRuntime } } workspace { name repositories { id } } extensionInstallations { id displayName routePrefix } }");

  const ctx: ChromeContext = {
    workspaceName: graphql.workspace.name,
    repositoryCount: graphql.workspace.repositories.length,
    viewerName: "viewer",
    viewerPermissions: graphql.viewer.permissions ?? [],
    readyState: "ready",
    serverURL,
    extensionsWithRoutes: graphql.extensionInstallations
      .filter((e): e is typeof e & { routePrefix: string } => e.routePrefix !== null)
      .map((e) => ({ routePrefix: e.routePrefix, displayName: e.displayName })),
    isOperator: (graphql.viewer.permissions ?? []).includes("instance.admin"),
  };

  const content = el("main", { className: "main" },
    el("div", { className: "extension-slot-mount", dataset: { extensionRouteMount: "true" } }),
  );
  renderChrome(ctx, app, content);

  const descriptors = graphql.extensionInstallations.map((e) => ({
    id: e.id,
    manifestUrl: `${serverURL}/_extensions/${e.id}/manifest.json`,
    routePrefix: e.routePrefix,
  }));
  const { routes } = await loadExtensions(descriptors, client, graphql.viewer, {
    extensionRuntime: graphql.instance.capabilities.extensionRuntime,
  });

  const match = pickRoute(routes, prefix, subPath);
  const mount = document.querySelector<HTMLElement>("[data-extension-route-mount]");
  if (!mount) return;
  if (!match) {
    mount.replaceChildren(el("article", { className: "extension-placeholder" },
      text(`Route ${subPath} not registered under /x/${prefix}/`)));
    return;
  }
  if (!viewerHas(graphql.viewer, match.route.requiredPermission)) {
    mount.replaceChildren(el("article", { className: "extension-placeholder" },
      text(`Insufficient permissions for ${match.route.requiredPermission}`)));
    return;
  }
  const node = document.createElement(match.route.element) as HTMLElement & Record<string, unknown>;
  node.comtryaClient = client;
  node.viewer = graphql.viewer;
  node.routeParams = { scope: "extension", routePrefix: prefix, subPath, params: match.params };
  mount.replaceChildren(node);
}

function pickRoute(routes: ResolvedRoute[], prefix: string, subPath: string): { route: ResolvedRoute; params: Record<string, string> } | undefined {
  for (const route of routes) {
    if (route.routePrefix !== prefix) continue;
    const m = pathMatches(route.path, subPath);
    if (m.matched) return { route, params: m.params };
  }
  return undefined;
}

function pathMatches(pattern: string, actual: string): { matched: boolean; params: Record<string, string> } {
  if (pattern === "/" && (actual === "/" || actual === "")) return { matched: true, params: {} };
  const p = pattern.split("/").filter(Boolean);
  const a = actual.split("/").filter(Boolean);
  if (p.length !== a.length) return { matched: false, params: {} };
  const params: Record<string, string> = {};
  for (let i = 0; i < p.length; i++) {
    const pp = p[i]!;
    const aa = a[i]!;
    if (pp.startsWith(":")) params[pp.slice(1)] = aa;
    else if (pp !== aa) return { matched: false, params: {} };
  }
  return { matched: true, params };
}

function viewerHas(viewer: ViewerHandle, perm: string): boolean {
  return viewer.permissions.includes("instance.admin") || viewer.permissions.includes(perm);
}

boot().catch((e) => console.error("extension page boot failed", e));
```

- [ ] **Step 2: Verify typecheck**

Run: `cd frontend && bun run typecheck`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/shell/page-ext.ts
git commit -m "frontend: extension page host resolves route + mounts element with route params"
```

### Task 23: Reduce `main.ts` + retarget `pages/index.astro`

**Files:**
- Modify: `frontend/src/main.ts`
- Modify: `frontend/src/pages/index.astro`

- [ ] **Step 1: Reduce `main.ts` to a stub**

Replace `frontend/src/main.ts` with:

```ts
// main.ts is deprecated — entry points are now src/shell/page-{home,repo,ext}.ts
export {};
```

- [ ] **Step 2: Replace `pages/index.astro`**

Replace `frontend/src/pages/index.astro`:

```astro
---
import "../styles.css";
export const prerender = false;
---
<!doctype html>
<html lang="en" data-theme="print">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&family=IBM+Plex+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap"
    />
    <title>Comtrya — Workspace</title>
  </head>
  <body>
    <main id="app" data-smoke="home-shell"></main>
    <script src="../shell/page-home.ts"></script>
  </body>
</html>
```

- [ ] **Step 3: Smoke**

Run: `cd frontend && bun run dev`
```
curl -sI http://127.0.0.1:4321/ | head -1
```
Expected: `200`.

Stop the dev server.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/main.ts frontend/src/pages/index.astro
git commit -m "frontend: redirect homepage to page-home.ts boot script; deprecate main.ts"
```

---

## Phase E — Host GraphQL fields

### Task 24: `workspace.repositories` with groups + summary fields

**Files:**
- Modify: `crates/server/src/main.rs`

- [ ] **Step 1: Locate the existing field**

Run: `grep -n "fn repositories\|repositories_field\|RepositorySummary" crates/server/src/main.rs | head`

- [ ] **Step 2: Write a failing test**

Add to server test module:

```rust
#[test]
fn repository_summary_serializes_groups_and_state() {
    let result = serialize_repository_summary(&RepositoryRecord {
        id: "repo_x".into(),
        name: "comtrya".into(),
        groups: vec!["public".into(), "internal".into()],
        open_pull_requests: 12,
        check_summary: CheckSummary { passed: 142, total: 142 },
        last_commit_at: chrono::Utc::now(),
        ..Default::default()
    });
    assert_eq!(result.groups, vec!["public", "internal"]);
    assert_eq!(result.open_pull_requests, 12);
    assert_eq!(result.check_summary.passed, 142);
}
```

Adapt types if `RepositoryRecord` / `CheckSummary` differ — read the existing definition with `grep -n "struct RepositoryRecord\|struct CheckSummary" crates/server/src/main.rs`.

- [ ] **Step 3: Run to verify it fails**

Run: `cargo test -p comtrya-server repository_summary`
Expected: FAIL.

- [ ] **Step 4: Add fields to projection**

Expand the GraphQL `RepositorySummary` type to include:
- `groups: [String!]!`
- `openPullRequests: Int!`
- `checkSummary: CheckSummary!` with `{ passed: Int!, total: Int! }`
- `lastCommitAt: String!`

Implement `serialize_repository_summary` as the conversion helper from `RepositoryRecord` to the GraphQL type. Plug it into the existing `workspace.repositories` resolver.

- [ ] **Step 5: Run tests**

Run: `cargo test --workspace`
Expected: green.

- [ ] **Step 6: Commit**

```bash
git add crates/server/src/main.rs
git commit -m "server: expand workspace.repositories with groups[] and summary state"
```

### Task 25: Viewer aggregate fields

**Files:**
- Modify: `crates/server/src/main.rs`

- [ ] **Step 1: Write failing tests**

Add to server test module:

```rust
#[test]
fn viewer_review_queue_marks_aggregated_true() {
    let r = build_review_queue(&seed_viewer(), &seed_workspace_state(), 10);
    assert!(r.aggregated);
    assert!(r.items.len() <= 10);
}

#[test]
fn viewer_authored_pulls_filters_by_author() {
    let r = build_authored_pulls(&seed_viewer(), &seed_workspace_state());
    assert!(r.items.iter().all(|p| p.author == "david.flanagan"));
}

#[test]
fn viewer_failing_checks_filters_by_branch_author() {
    let r = build_failing_checks(&seed_viewer(), &seed_workspace_state());
    assert!(r.items.iter().all(|c| c.author == "david.flanagan"));
}
```

Adjust names to existing seed helpers (`seed_viewer`, `seed_workspace_state`) — confirm with `grep -n "fn seed_viewer\|fn seed_workspace" crates/server/src/main.rs`.

- [ ] **Step 2: Run to verify they fail**

Run: `cargo test -p comtrya-server viewer_`
Expected: FAIL.

- [ ] **Step 3: Implement resolvers**

GraphQL schema:

```graphql
extend type Viewer {
  reviewQueue(limit: Int = 10): AggregatedPullList!
  authoredPulls(limit: Int = 10): AggregatedPullList!
  failingChecks(limit: Int = 10): AggregatedCheckList!
}

type AggregatedPullList { aggregated: Boolean!  items: [PullRequestSummary!]! }
type AggregatedCheckList { aggregated: Boolean! items: [CheckRunSummary!]! }
```

Implement `build_review_queue`, `build_authored_pulls`, `build_failing_checks` reading from extension storage (existing helpers — find with `grep -n "fn pull_requests_for\|fn check_runs_for" crates/server/src/main.rs`). All three set `aggregated: true` for v1.

- [ ] **Step 4: Run tests**

Run: `cargo test --workspace`
Expected: green.

- [ ] **Step 5: Commit**

```bash
git add crates/server/src/main.rs
git commit -m "server: viewer.reviewQueue/authoredPulls/failingChecks with aggregated:true v1 flag"
```

### Task 26: `workspace.events` scope filter

**Files:**
- Modify: `crates/server/src/main.rs`

- [ ] **Step 1: Find existing events field**

Run: `grep -n "activityEvents\|workspace.events\|ActivityEvent" crates/server/src/main.rs | head`

- [ ] **Step 2: Write the failing test**

```rust
#[test]
fn workspace_events_filters_by_viewer_accessible_repos() {
    let visible: Vec<String> = vec!["repo_a".into()];
    let r = filter_events_for_viewer(&seed_events(), &visible);
    assert!(r.iter().all(|e| visible.contains(&e.repository_id)));
}
```

- [ ] **Step 3: Run to verify it fails**

Run: `cargo test -p comtrya-server workspace_events`
Expected: FAIL.

- [ ] **Step 4: Implement**

```rust
pub fn filter_events_for_viewer(
    events: &[ActivityEvent],
    visible_repo_ids: &[String],
) -> Vec<ActivityEvent> {
    events.iter()
        .filter(|e| visible_repo_ids.iter().any(|id| id == &e.repository_id))
        .cloned()
        .collect()
}
```

Wire it into the `workspace.events(limit, scope)` GraphQL field. Add the `scope: WORKSPACE | REPOSITORY` enum to the schema.

- [ ] **Step 5: Run tests**

Run: `cargo test --workspace`
Expected: green.

- [ ] **Step 6: Commit**

```bash
git add crates/server/src/main.rs
git commit -m "server: workspace.events filters by viewer-accessible repository ids"
```

---

## Phase F — First-party extension migration

Each extension migration follows the same recipe:
1. Add `routePrefix` to backend manifest.
2. Rewrite UI manifest to v2 `contributes` shape.
3. Rewrite ESM entry as `defineExtension({ setup })` using `host.registerSlot` + `host.registerRoute`.
4. Recompute `entryIntegrity` from the new bundle.
5. Run `cargo test --workspace` and start.sh smoke.
6. Commit.

### Task 27: Migrate `ext_pull_requests`

**Files:**
- Modify: `extensions/first-party/ext_pull_requests/manifest.json`
- Modify: `extensions/first-party/ext_pull_requests/ui/manifest.json`
- Rewrite: `extensions/first-party/ext_pull_requests/assets/index.js`

- [ ] **Step 1: Update backend manifest**

Set `extensions/first-party/ext_pull_requests/manifest.json`:

```json
{
  "schemaVersion": "comtrya.extension/v1",
  "id": "ext_pull_requests",
  "name": "pull-requests",
  "displayName": "Pull Requests",
  "version": "0.1.0",
  "publisher": "comtrya-dev",
  "wasmComponent": "component.wat",
  "witWorld": "comtrya:extension/extension",
  "routePrefix": "pulls",
  "ui": { "manifest": "ui/manifest.json" },
  "runtime": { "resolver": "resolve", "outputType": "comtrya.pull-requests/summary.v1" }
}
```

- [ ] **Step 2: Update UI manifest to v2**

Replace `extensions/first-party/ext_pull_requests/ui/manifest.json`:

```json
{
  "schemaVersion": "comtrya.ui-extension/v2",
  "id": "ext_pull_requests",
  "extension": "pull-requests",
  "version": "0.1.0",
  "publisher": "comtrya-dev",
  "assets": {
    "entry": "/_extensions/ext_pull_requests/assets/index.js",
    "entryIntegrity": "sha256-PLACEHOLDER",
    "styles": []
  },
  "permissions": ["pull-requests.read"],
  "contributes": {
    "slots": ["home.your-work", "repository.overview"],
    "routes": true
  }
}
```

- [ ] **Step 3: Rewrite ESM entry**

Replace `extensions/first-party/ext_pull_requests/assets/index.js`:

```js
import { defineExtension } from "@comtrya/extension-host";

class ComtryaPullsQueue extends HTMLElement {
  connectedCallback() {
    const root = document.createElement("div");
    root.className = "extension-payload";
    const title = document.createElement("strong");
    title.textContent = "Pulls queue";
    const desc = document.createElement("span");
    desc.textContent = "Mounted by ext_pull_requests via SDK";
    root.append(title, desc);
    this.replaceChildren(root);
  }
}
class ComtryaPullsDetail extends HTMLElement {
  connectedCallback() {
    const pullId = this.routeParams?.params?.pullId ?? "unknown";
    const root = document.createElement("div");
    root.className = "extension-payload";
    const title = document.createElement("strong");
    title.textContent = "Pull #" + pullId;
    root.append(title);
    this.replaceChildren(root);
  }
}
class ComtryaPullsYourWork extends HTMLElement {
  connectedCallback() {
    const root = document.createElement("div");
    root.className = "extension-payload";
    const title = document.createElement("strong");
    title.textContent = "Your work · pulls";
    root.append(title);
    this.replaceChildren(root);
  }
}
class ComtryaPullsOverview extends HTMLElement {
  connectedCallback() {
    const root = document.createElement("div");
    root.className = "extension-payload";
    const title = document.createElement("strong");
    title.textContent = "Repo · pulls overview";
    root.append(title);
    this.replaceChildren(root);
  }
}

customElements.define("comtrya-pulls-queue", ComtryaPullsQueue);
customElements.define("comtrya-pulls-detail", ComtryaPullsDetail);
customElements.define("comtrya-pulls-your-work", ComtryaPullsYourWork);
customElements.define("comtrya-pulls-overview", ComtryaPullsOverview);

export default defineExtension({
  id: "ext_pull_requests",
  setup(host) {
    host.registerSlot("home.your-work", {
      element: "comtrya-pulls-your-work",
      requiredPermission: "pull-requests.read",
      priority: 100,
    });
    host.registerSlot("repository.overview", {
      element: "comtrya-pulls-overview",
      requiredPermission: "pull-requests.read",
      priority: 100,
    });
    host.registerRoute("/", {
      element: "comtrya-pulls-queue",
      requiredPermission: "pull-requests.read",
    });
    host.registerRoute("/:pullId", {
      element: "comtrya-pulls-detail",
      requiredPermission: "pull-requests.read",
    });
  },
});
```

- [ ] **Step 4: Recompute integrity**

```bash
INTEGRITY="sha256-$(shasum -a 256 extensions/first-party/ext_pull_requests/assets/index.js | awk '{print $1}')"
```

Update `entryIntegrity` in `ui/manifest.json` to `$INTEGRITY` value.

- [ ] **Step 5: Run tests**

Run: `cargo test --workspace`
Expected: green.

- [ ] **Step 6: Commit**

```bash
git add extensions/first-party/ext_pull_requests/
git commit -m "ext_pull_requests: migrate to manifest v2 with routePrefix=pulls and SDK setup"
```

### Task 28: Migrate `ext_code_browser`

**Files:**
- Modify: `extensions/first-party/ext_code_browser/manifest.json`
- Modify: `extensions/first-party/ext_code_browser/ui/manifest.json`
- Rewrite: `extensions/first-party/ext_code_browser/assets/index.js`

- [ ] **Step 1: Update backend manifest**

Set `routePrefix: "code"` in `extensions/first-party/ext_code_browser/manifest.json` (same structure as Task 27 Step 1).

- [ ] **Step 2: Update UI manifest to v2**

```json
{
  "schemaVersion": "comtrya.ui-extension/v2",
  "id": "ext_code_browser",
  "extension": "code-browser",
  "version": "0.1.0",
  "publisher": "comtrya-dev",
  "assets": {
    "entry": "/_extensions/ext_code_browser/assets/index.js",
    "entryIntegrity": "sha256-PLACEHOLDER",
    "styles": []
  },
  "permissions": ["code.read"],
  "contributes": {
    "slots": ["repository.code"],
    "routes": true
  }
}
```

- [ ] **Step 3: Rewrite ESM entry**

```js
import { defineExtension } from "@comtrya/extension-host";

class ComtryaCodeBrowser extends HTMLElement {
  connectedCallback() {
    const root = document.createElement("div");
    root.className = "extension-payload";
    const title = document.createElement("strong");
    title.textContent = "Code browser";
    root.append(title);
    this.replaceChildren(root);
  }
}
class ComtryaCodeTree extends HTMLElement {
  connectedCallback() {
    const root = document.createElement("div");
    root.className = "extension-payload";
    const title = document.createElement("strong");
    title.textContent = "Code tree";
    root.append(title);
    this.replaceChildren(root);
  }
}

customElements.define("comtrya-code-browser", ComtryaCodeBrowser);
customElements.define("comtrya-code-tree", ComtryaCodeTree);

export default defineExtension({
  id: "ext_code_browser",
  setup(host) {
    host.registerSlot("repository.code", {
      element: "comtrya-code-browser",
      requiredPermission: "code.read",
      priority: 100,
    });
    host.registerRoute("/", {
      element: "comtrya-code-tree",
      requiredPermission: "code.read",
    });
  },
});
```

- [ ] **Step 4: Recompute integrity, run tests, commit**

```bash
INTEGRITY="sha256-$(shasum -a 256 extensions/first-party/ext_code_browser/assets/index.js | awk '{print $1}')"
# Update entryIntegrity in ui/manifest.json
cargo test --workspace
git add extensions/first-party/ext_code_browser/
git commit -m "ext_code_browser: migrate to manifest v2 with routePrefix=code and SDK setup"
```

### Task 29: Migrate `ext_checks`

**Files:**
- Modify: `extensions/first-party/ext_checks/manifest.json`
- Modify: `extensions/first-party/ext_checks/ui/manifest.json`
- Rewrite: `extensions/first-party/ext_checks/assets/index.js`

- [ ] **Step 1: Update backend manifest**

Set `routePrefix: "checks"`.

- [ ] **Step 2: Update UI manifest to v2**

```json
{
  "schemaVersion": "comtrya.ui-extension/v2",
  "id": "ext_checks",
  "extension": "checks",
  "version": "0.1.0",
  "publisher": "comtrya-dev",
  "assets": {
    "entry": "/_extensions/ext_checks/assets/index.js",
    "entryIntegrity": "sha256-PLACEHOLDER",
    "styles": []
  },
  "permissions": ["checks.read"],
  "contributes": {
    "slots": ["repository.checks"],
    "routes": true
  }
}
```

- [ ] **Step 3: Rewrite ESM entry**

```js
import { defineExtension } from "@comtrya/extension-host";

class ComtryaChecksBoard extends HTMLElement {
  connectedCallback() {
    const root = document.createElement("div");
    root.className = "extension-payload";
    const title = document.createElement("strong");
    title.textContent = "Checks board";
    root.append(title);
    this.replaceChildren(root);
  }
}
class ComtryaChecksDetail extends HTMLElement {
  connectedCallback() {
    const root = document.createElement("div");
    root.className = "extension-payload";
    const title = document.createElement("strong");
    title.textContent = "Check detail";
    root.append(title);
    this.replaceChildren(root);
  }
}

customElements.define("comtrya-checks-board", ComtryaChecksBoard);
customElements.define("comtrya-checks-detail", ComtryaChecksDetail);

export default defineExtension({
  id: "ext_checks",
  setup(host) {
    host.registerSlot("repository.checks", {
      element: "comtrya-checks-board",
      requiredPermission: "checks.read",
      priority: 100,
    });
    host.registerRoute("/", {
      element: "comtrya-checks-board",
      requiredPermission: "checks.read",
    });
  },
});
```

- [ ] **Step 4: Recompute integrity, run tests, commit**

```bash
INTEGRITY="sha256-$(shasum -a 256 extensions/first-party/ext_checks/assets/index.js | awk '{print $1}')"
# Update entryIntegrity in ui/manifest.json
cargo test --workspace
git add extensions/first-party/ext_checks/
git commit -m "ext_checks: migrate to manifest v2 with routePrefix=checks and SDK setup"
```

### Task 30: Create `ext_workspace_home`

**Files:**
- Create: `extensions/first-party/ext_workspace_home/manifest.json`
- Create: `extensions/first-party/ext_workspace_home/component.wat`
- Create: `extensions/first-party/ext_workspace_home/ui/manifest.json`
- Create: `extensions/first-party/ext_workspace_home/assets/index.js`

- [ ] **Step 1: Backend manifest**

`extensions/first-party/ext_workspace_home/manifest.json`:

```json
{
  "schemaVersion": "comtrya.extension/v1",
  "id": "ext_workspace_home",
  "name": "workspace-home",
  "displayName": "Workspace Home",
  "version": "0.1.0",
  "publisher": "comtrya-dev",
  "wasmComponent": "component.wat",
  "witWorld": "comtrya:extension/extension",
  "routePrefix": null,
  "ui": { "manifest": "ui/manifest.json" },
  "runtime": { "resolver": "resolve", "outputType": "comtrya.workspace-home/summary.v1" }
}
```

- [ ] **Step 2: Proof component**

```bash
cp extensions/first-party/ext_pull_requests/component.wat extensions/first-party/ext_workspace_home/component.wat
```

- [ ] **Step 3: UI manifest v2**

```json
{
  "schemaVersion": "comtrya.ui-extension/v2",
  "id": "ext_workspace_home",
  "extension": "workspace-home",
  "version": "0.1.0",
  "publisher": "comtrya-dev",
  "assets": {
    "entry": "/_extensions/ext_workspace_home/assets/index.js",
    "entryIntegrity": "sha256-PLACEHOLDER",
    "styles": []
  },
  "permissions": ["workspace.read", "events.read", "instance.admin"],
  "contributes": {
    "slots": ["home.your-work", "home.repositories", "home.activity", "home.instance"],
    "routes": false
  }
}
```

- [ ] **Step 4: ESM bundle**

Create `extensions/first-party/ext_workspace_home/assets/index.js`:

```js
import { defineExtension } from "@comtrya/extension-host";

function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  if (props.className) node.className = props.className;
  if (props.textContent !== undefined) node.textContent = props.textContent;
  if (props.dataset) for (const [k, v] of Object.entries(props.dataset)) node.dataset[k] = v;
  if (props.attrs) for (const [k, v] of Object.entries(props.attrs)) node.setAttribute(k, v);
  for (const child of children) {
    if (child == null) continue;
    node.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
  }
  return node;
}

function row(idn, title, sub, checkText, checkClass, time) {
  return el("div", { className: "row" },
    el("span", { className: "idn", textContent: idn }),
    el("div", {},
      el("div", { className: "title", textContent: title }),
      el("div", { className: "sub", textContent: sub }),
    ),
    el("span", { className: `check ${checkClass}`, textContent: checkText }),
    el("span", { className: "t", textContent: time }),
  );
}

class HomeYourWork extends HTMLElement {
  async connectedCallback() {
    const data = await this.comtryaClient.query(`{
      viewer {
        reviewQueue(limit: 5)   { aggregated items { id title author repositoryPath checksPassed checksTotal updatedAt } }
        authoredPulls(limit: 5) { aggregated items { id title state mergeability checksPassed checksTotal updatedAt repositoryPath } }
        failingChecks(limit: 5) { aggregated items { name repositoryPath branch updatedAt } }
      }
    }`);
    const reviewItems = data.viewer.reviewQueue.items.map((p) =>
      row("#" + p.id, p.title, "@" + p.author + " · " + p.repositoryPath,
          p.checksPassed + "/" + p.checksTotal,
          p.checksPassed === p.checksTotal ? "ok" : "warn", p.updatedAt));
    const pullItems = data.viewer.authoredPulls.items.map((p) =>
      row("#" + p.id, p.title, p.repositoryPath + " · " + p.state.toLowerCase(),
          p.checksPassed + "/" + p.checksTotal,
          p.mergeability === "READY" ? "ok" : "warn", p.updatedAt));
    const failingItems = data.viewer.failingChecks.items.map((c) =>
      row("!CK", c.name, c.repositoryPath + " · " + c.branch, "failing", "err", c.updatedAt));
    this.replaceChildren(
      el("section", { className: "section" },
        el("div", { className: "section-strap" },
          el("span", { className: "id", textContent: "01" }),
          el("h2", { textContent: "Review queue" }),
          el("span", { className: "meta", textContent: data.viewer.reviewQueue.items.length + " pulls" }),
        ),
        ...reviewItems,
      ),
      el("section", { className: "section" },
        el("div", { className: "section-strap" },
          el("span", { className: "id", textContent: "02" }),
          el("h2", { textContent: "Your pulls" }),
          el("span", { className: "meta", textContent: data.viewer.authoredPulls.items.length + " authored" }),
        ),
        ...pullItems,
      ),
      el("section", { className: "section" },
        el("div", { className: "section-strap" },
          el("span", { className: "id", textContent: "03" }),
          el("h2", { textContent: "Failing on your branches" }),
          el("span", { className: "meta", textContent: data.viewer.failingChecks.items.length + " checks" }),
        ),
        ...failingItems,
      ),
    );
  }
}

class HomeRepositories extends HTMLElement {
  async connectedCallback() {
    const data = await this.comtryaClient.query(`{
      workspace {
        repositories { id name groups openPullRequests checkSummary { passed total } lastCommitAt }
      }
    }`);
    const repos = data.workspace.repositories.map((r) => {
      const prefix = r.groups.length > 0 ? r.groups.join("/") + "/" : "";
      const checkClass = r.checkSummary.passed === r.checkSummary.total ? "ok" : "warn";
      const checkText = r.checkSummary.passed === r.checkSummary.total
        ? r.checkSummary.total + " ✓"
        : r.checkSummary.passed + "/" + r.checkSummary.total;
      return el("div", { className: "repo" },
        el("span", { className: "name" },
          el("span", { className: "prefix", textContent: prefix }),
          el("span", { className: "leaf", textContent: r.name }),
        ),
        el("span", { className: "stats" },
          el("span", { textContent: r.openPullRequests + " pr" }),
          el("span", { className: checkClass, textContent: checkText }),
          el("span", { textContent: r.lastCommitAt }),
        ),
      );
    });
    this.replaceChildren(
      el("div", { className: "rail-section" },
        el("div", { className: "rail-strap" },
          el("span", { className: "id", textContent: "04" }),
          el("h3", { textContent: "Repositories" }),
          el("span", { className: "count", textContent: repos.length + " total" }),
        ),
        ...repos,
      ),
    );
  }
}

class HomeActivity extends HTMLElement {
  async connectedCallback() {
    const data = await this.comtryaClient.query(`{
      workspace { events(limit: 20, scope: WORKSPACE) { id type summary actor repositoryPath time } }
    }`);
    const events = data.workspace.events.map((e) =>
      el("div", { className: "ev" },
        el("span", { className: "summary" },
          document.createTextNode(e.summary),
          el("span", { className: "src", textContent: e.repositoryPath ?? e.actor }),
        ),
        el("span", { className: "t", textContent: e.time }),
      ),
    );
    this.replaceChildren(
      el("div", { className: "rail-section activity" },
        el("div", { className: "rail-strap" },
          el("span", { className: "id", textContent: "05" }),
          el("h3", { textContent: "Activity" }),
          el("span", { className: "count", textContent: "live" }),
        ),
        ...events,
      ),
    );
  }
}

class HomeInstance extends HTMLElement {
  async connectedCallback() {
    const ready = await fetch("/readyz").then((r) => r.json());
    const allOk = (ready.unsupported ?? []).length === 0;
    this.replaceChildren(
      el("section", { className: "instance" },
        el("span", { className: "id", textContent: "06" }),
        el("div", { className: "stats" },
          el("span", { className: allOk ? "ok" : "err", textContent: allOk ? "● READY" : "● NOT READY" }),
          el("span", {}, el("strong", { textContent: String((ready.unsupported ?? []).length) }), document.createTextNode(" boundaries")),
        ),
        el("code", { className: "clone", textContent: "git clone " + location.origin + "/git/comtrya.git" }),
        el("a", { className: "link", attrs: { href: "/instance" }, textContent: "→ /instance" }),
      ),
    );
  }
}

customElements.define("comtrya-home-your-work", HomeYourWork);
customElements.define("comtrya-home-repositories", HomeRepositories);
customElements.define("comtrya-home-activity", HomeActivity);
customElements.define("comtrya-home-instance", HomeInstance);

export default defineExtension({
  id: "ext_workspace_home",
  setup(host) {
    host.registerSlot("home.your-work",    { element: "comtrya-home-your-work",    requiredPermission: "workspace.read", priority: 1000 });
    host.registerSlot("home.repositories", { element: "comtrya-home-repositories", requiredPermission: "workspace.read", priority: 1000 });
    host.registerSlot("home.activity",     { element: "comtrya-home-activity",     requiredPermission: "events.read",    priority: 1000 });
    host.registerSlot("home.instance",     { element: "comtrya-home-instance",     requiredPermission: "instance.admin", priority: 1000 });
  },
});
```

- [ ] **Step 5: Recompute integrity**

```bash
INTEGRITY="sha256-$(shasum -a 256 extensions/first-party/ext_workspace_home/assets/index.js | awk '{print $1}')"
```

Update `ui/manifest.json` `entryIntegrity` to `$INTEGRITY`.

- [ ] **Step 6: Run tests**

Run: `cargo test --workspace`
Expected: green.

- [ ] **Step 7: Boot end-to-end**

Run (separate terminal): `./start.sh --reset && ./start.sh`

Then:
```
curl -s http://127.0.0.1:4321/ | grep -c 'comtrya-home-'
```
Expected: ≥ 4.

Stop the server.

- [ ] **Step 8: Commit**

```bash
git add extensions/first-party/ext_workspace_home/
git commit -m "feat(ext): add ext_workspace_home owning four home.* slot widgets"
```

---

## Phase G — Verification & docs

### Task 31: Update `start.sh` smoke assertions

**Files:**
- Modify: `start.sh`

- [ ] **Step 1: Locate existing assertions**

Run: `grep -n "data-smoke\|fail()" start.sh`

Note the existing `fail` helper.

- [ ] **Step 2: Add new smoke assertions**

Append in the post-startup smoke section of `start.sh`:

```bash
echo "Smoke: workspace homepage renders four home.* slot mounts"
HOME=$(curl -sf "$FRONTEND_URL/" || true)
echo "$HOME" | grep -q 'data-smoke="home-slot-home.your-work"'    || fail "missing home.your-work slot"
echo "$HOME" | grep -q 'data-smoke="home-slot-home.repositories"' || fail "missing home.repositories slot"
echo "$HOME" | grep -q 'data-smoke="home-slot-home.activity"'     || fail "missing home.activity slot"
echo "$HOME" | grep -q 'data-smoke="home-slot-home.instance"'     || fail "missing home.instance slot"

echo "Smoke: /r/comtrya resolves to repo dashboard"
REPO=$(curl -sf "$FRONTEND_URL/r/comtrya" || true)
echo "$REPO" | grep -q 'data-smoke="repo-dashboard"'                  || fail "/r/comtrya dashboard missing"
echo "$REPO" | grep -q 'data-smoke="repo-slot-repository.overview"'   || fail "repo.overview slot missing"
echo "$REPO" | grep -q 'data-smoke="repo-slot-repository.code"'       || fail "repo.code slot missing"
echo "$REPO" | grep -q 'data-smoke="repo-slot-repository.checks"'     || fail "repo.checks slot missing"

echo "Smoke: unknown repo path returns 404"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL/r/no-such-repo")
[ "$STATUS" = "404" ] || fail "expected 404 for unknown repo, got $STATUS"

echo "Smoke: /x/pulls/ mounts pull-requests extension"
PULLS=$(curl -sf "$FRONTEND_URL/x/pulls/" || true)
echo "$PULLS" | grep -q 'data-smoke="extension-page"' || fail "/x/pulls/ extension page missing"

echo "Smoke: unknown extension prefix returns 404"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL/x/bogus/")
[ "$STATUS" = "404" ] || fail "expected 404 for unknown extension prefix, got $STATUS"
```

- [ ] **Step 3: Run start.sh**

```bash
./start.sh --reset && ./start.sh
```
Expected: all assertions pass; script exits clean.

- [ ] **Step 4: Commit**

```bash
git add start.sh
git commit -m "start.sh: assert new workspace homepage + /r/ + /x/ routes render"
```

### Task 32: Update `SPEC_COVERAGE.md`

**Files:**
- Modify: `SPEC_COVERAGE.md`

- [ ] **Step 1: Add coverage rows**

Append:

```markdown
## Workspace homepage (2026-05-12 design)

| Surface                    | Source                                  | Verified by |
| -------------------------- | --------------------------------------- | ----------- |
| `home.your-work` widget    | ext_workspace_home → viewer aggregates  | start.sh smoke + cargo test viewer_review_queue |
| `home.repositories` widget | ext_workspace_home → workspace.repositories with groups[] | start.sh smoke + cargo test repository_summary |
| `home.activity` widget     | ext_workspace_home → workspace.events (scope-filtered) | start.sh smoke + cargo test workspace_events |
| `home.instance` widget     | ext_workspace_home → /readyz            | start.sh smoke |
| `/r/<...>/<repo>` dashboard | host shell + repository.* slots         | start.sh smoke `repo-dashboard` |
| `/x/<prefix>/<...>` extension page | host shell + extension SDK route     | start.sh smoke `extension-page` |
| Manifest v2 schema         | crates/server validate_ui_manifest_from_value | cargo test manifest_v2 |
| route_prefix uniqueness    | crates/server validate_route_prefix_uniqueness | cargo test duplicate_route_prefixes |
| SDK slot contention        | frontend/extension-host-sdk/slot-registry.test.ts | bun test |
| SDK allowlist enforcement  | frontend/extension-host-sdk/host-facade.test.ts | bun test |
```

- [ ] **Step 2: Commit**

```bash
git add SPEC_COVERAGE.md
git commit -m "docs: SPEC_COVERAGE adds workspace homepage rows mapping surfaces to sources"
```

### Task 33: Update `TODO.md`, demo runbook, and production testbed

**Files:**
- Modify: `TODO.md`, `DEMO_RUNBOOK.md`, `PRODUCTION_TESTBED.md`

- [ ] **Step 1: Update `TODO.md`**

In `TODO.md`:
- Mark "Astro shell → real extension host" as complete (cross out or move to a Done section, following existing style).
- Mark "First-party ext_pull_requests end-to-end" as partially complete (UI + SDK done; OCI distribution wiring still pending).
- Add new follow-up items at the appropriate section:
  - Per-viewer slot-binding override config (v2)
  - Full `/instance` page with `instance.*` slot taxonomy
  - Command palette (⌘K) contribution kind via SDK
  - Federated GraphQL planner (V3_PLAN item 9) — flip `aggregated:true` to `false` once it lands

- [ ] **Step 2: Update `DEMO_RUNBOOK.md` and `PRODUCTION_TESTBED.md`**

Replace any `/comtrya/comtrya` URL with `/r/comtrya`. Add a short note near the top of each:

```markdown
> URL scheme (v3): repositories at `/r/<group>/<...>/<repo>` (single-tenant, infinitely nested groups). Extension-owned pages at `/x/<prefix>/<...>`.
```

- [ ] **Step 3: Final end-to-end run**

```bash
./start.sh --reset && ./start.sh
cargo test --workspace
cd frontend && bun test
```
Expected: all green.

- [ ] **Step 4: Commit**

```bash
git add TODO.md DEMO_RUNBOOK.md PRODUCTION_TESTBED.md
git commit -m "docs: TODO + runbooks reflect v3 workspace homepage + /r/ /x/ routes"
```

---

## Self-review

### Spec coverage

- §1 Routing — Tasks 11, 12, 13, 14, 22 (page-ext). ✓
- §2 Contribution model — Tasks 2–10. ✓
- §3 Visual direction — Tasks 16, 17, 18. State coverage threaded through page-home/page-repo/page-ext (Tasks 20, 21, 22) via per-state branches. ✓
- §4 Implementation increments A–G — mapped to Phases A–G. ✓
- §5 Verification — Tasks 31 (smoke) + per-task TDD coverage. ✓
- Non-goals — explicitly NOT scheduled (per-viewer config, federated planner, full `/instance`, OCI runtime wiring, CUE upgrade). ✓

### Placeholder scan

- No "TBD" / "implement later" / "appropriate error handling" patterns.
- `entryIntegrity: "sha256-PLACEHOLDER"` appears in three extension manifests (Tasks 27, 28, 29, 30). **Resolution:** each task has an explicit recompute step using `shasum -a 256` to replace the placeholder with the real value. The placeholder is intentional — it forces the integrity recomputation step to run.
- Custom-element renderers in `ext_workspace_home` (Task 30) are shown in full DOM-construction form. Repo migration tasks (27/28/29) show full element bodies too.

### Type consistency

- `SlotName` (Task 2) used identically in Tasks 5, 7, 19, 20, 21, 22.
- `ExtensionAllowlist` (Task 2) consumed by `createHostFacade` (Task 5) and `loadExtensions` (Task 19) with identical fields.
- `ResolvedSlot` / `ResolvedRoute` (Task 2) → `SlotRegistry.add` (Task 4) and `host-facade` route sink (Task 5) → `loadExtensions` (Task 19) — same fields throughout.
- `ChromeContext` (Task 18) consumed by Tasks 20, 21, 22 with identical shape.
- Rust `ExtensionInstallConfig.route_prefix` (Task 8) → `validate_route_prefix_uniqueness` (Task 10) → `extensionInstallations.routePrefix` GraphQL (Task 13) → frontend consumers (Tasks 13, 20, 21, 22).
- Manifest v2 TS `parseManifest` (Task 7) shape ≡ Rust `validate_ui_manifest_from_value` (Task 9) shape. Both expect: `schemaVersion`, `id`, `extension`, `version`, `publisher`, `assets.{entry, entryIntegrity, styles}`, `permissions[]`, `contributes.{slots[], routes:boolean}`.
- `KNOWN_SLOT_NAMES` (TS, Task 2) and Rust `KNOWN_SLOT_NAMES` const (Task 9) — both list the same 7 slot names.

No inconsistencies found.

---

## Plan complete and saved to `docs/superpowers/plans/2026-05-12-workspace-homepage.md`. Two execution options:

**1. Subagent-Driven (recommended)** — Fresh subagent per task, review between tasks, fast iteration. Best for a 33-task plan: each task is small enough to hand off cleanly, and the two-stage review catches drift between tasks.

**2. Inline Execution** — Execute tasks in this session using `executing-plans`, batch with checkpoints. Best if you want to stay in this thread and approve groups of tasks at a time.

Which approach?
