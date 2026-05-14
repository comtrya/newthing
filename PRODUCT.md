# Product

## Register

product

## Users

Comtrya is for people and teams running their own code forge: maintainers, operators, and engineers who need repository hosting, review workflows, checks, extension management, and configuration evidence in one self-hosted instance. Users are usually working inside an authenticated product surface, switching between repositories and reviewing the state of code, automation, and installed extensions.

## Product Purpose

Comtrya is a self-host-first GitHub replacement with a deliberately small core. The host owns authentication, repositories, Git transport, policy, events, GraphQL, and extension runtime boundaries. Product features such as pull requests, code browsing, checks, boards, docs, and wiki are installed as extensions. The interface should make a single-tenant instance feel capable of many repositories and many feature surfaces without hiding which data comes from Git, runtime storage, or extensions.

## Brand Personality

Precise, composed, and operational. The UI should feel like an expert tool for people who trust dense information, clear hierarchy, and reliable affordances. It can borrow the discipline of Linear and GitHub without becoming decorative or marketing-led.

## Anti-references

Avoid generic SaaS dashboards, oversized hero sections, fake metrics, low-density cards, playful illustrations, glass effects, decorative gradients, and anything that makes a self-hosted forge feel like a landing page. The product should not imply features are core when they are extension-owned.

## Where things live

There are two fundamentally different kinds of artefact a forge handles, and
the storage shape must match the lifecycle:

- **Durable design — repo-resident.** PRDs, specs, RFCs, ADRs, runbooks, and
  any other artefact that should be reviewable, branchable, history-tracked,
  and mergeable via pull requests, lives as **MDX files inside the repo**.
  Reviewing a spec change is the same flow as reviewing a code change. Specs
  flow through the same CI gates the code does. There is no out-of-band
  "wiki" that drifts from the code it documents.
- **Transient state — database-resident.** Epics, projects, issues, comments,
  reviews, checks, and anything else that opens, mutates frequently, and
  closes lives in extension storage. These records are first-class but not
  versioned the way design documents are. They link back to durable artefacts
  via resource URNs.

## Projects, repos, and the CUE config

**"Project" is a kernel-aware concept.** A Project is the kernel's unit of
work inside a repo. By default a repo is a single Project; a monorepo
declares many. The kernel ships a base CUE schema with a `#Project`
definition and discovers Projects by walking the merged config for
`projects: [name]: #Project & { ... }` declarations. If none are declared,
the kernel synthesises one implicit Project covering the whole repo.

Per-Project config shape is **defined by extensions, not the kernel**.
Extensions register CUE snippets via their manifest's
`contributes.cueSchemas`, and the kernel writes those snippets into the
materialised workdir before evaluation. Each extension owns the meaning
of its slice — `ext_pull_requests` defines `#Pulls` and adds `pulls?:
#Pulls` to `#Project`, `ext_issues` defines `#IssuesPolicy`, a future
`ext_docs` defines `#DocSurface`. The kernel never interprets these
fields; it only unifies and exposes them.

The repo declares its Projects in **`package comtrya` CUE files anywhere
in the tree** — typically one file per project in a monorepo. The kernel
walks the tree with `cuengine::evaluate_module(recursive: true,
package_name: "comtrya")` and exposes the result on
`repository.comtryaConfig`:

A monorepo with many sub-projects is the common case — each project
declares its own config relative to where its Cue file lives:

```
repo-root/
├── cue.mod/module.cue              -- declares the module
├── services/
│   ├── api/
│   │   ├── comtrya.cue             -- package comtrya, scoped to services/api
│   │   └── specs/api-spec.mdx      -- resolved from services/api/specs/
│   └── web/
│       ├── comtrya.cue             -- package comtrya, scoped to services/web
│       └── rfcs/web-rfc.mdx
└── platform/
    ├── comtrya.cue                 -- package comtrya, scoped to platform
    └── decisions/0001.mdx
```

The kernel uses the `cuengine` crate to walk the module with
`evaluate_module(repo_root, "comtrya", { recursive: true })`, which returns
an `instances: Map<relative_path, json_value>` — one entry per Cue
instance declaring `package comtrya`. Paths inside each instance are
resolved relative to that instance's containing directory, so a sub-project
declaring `docs.specs.path: "specs/"` means *its own* `specs/` directory.

Example sub-project Cue (lives at e.g. `services/api/comtrya.cue`):

```cue
package comtrya

projects: api: {
  root:   "."              // resolves to services/api/
  labels: ["service", "go"]
  owners: ["api-maintainers"]

  docs: {                  // shape defined by ext_docs
    specs: { path: "specs/", template: "spec.mdx", label: "API Specs" }
  }

  builds: {                // shape defined by ext_builds
    test: { command: "go test ./..." }
  }

  pulls: {                 // shape defined by ext_pull_requests
    autoMerge:      false
    requiredChecks: ["build", "test"]
  }

  issues: {                // shape defined by ext_issues
    defaultLabels: ["api"]
    closeOnMerge:  true
  }
}
```

The kernel exposes the evaluated config on `repository.comtryaConfig`:

```json
{
  "projects": [
    { "name": "api", "root": "services/api", "docs": {...}, "pulls": {...} }
  ],
  "instances": [
    { "path": "services/api", "value": {...} }
  ],
  "error": null
}
```

Each extension reads its own slice from `projects[].<field>`. The kernel
itself never parses `docs`, `builds`, `pulls`, `issues` — those keys exist
because an extension registered the schema. Remove the extension and the
field disappears from the config.

## Design Principles

- Make repository context the spine of the interface.
- Support polyrepo navigation even when the instance is single tenant.
- Treat extension surfaces as first-class product areas with visible load, resolver, and permission states.
- Keep evidence close to the workflow: refs, commits, checks, activity, clone details, and resolver output should be scannable without page hunting.
- Prefer dense, familiar controls over novelty.
- Durable artefacts live in the repo (MDX, reviewed via PRs); transient state lives in extension storage. Never blur the two.

## Accessibility & Inclusion

Target WCAG 2.2 AA for contrast, keyboard navigation, focus states, and responsive layout. Motion should be minimal and state-driven, and the UI must remain usable for reduced motion and color-blind users.
