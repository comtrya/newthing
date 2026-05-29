// Package schema is the published Comtrya configuration vocabulary.
//
// It is an in-module package of `github.com/comtrya/comtrya`, imported
// as `github.com/comtrya/comtrya/schema`. Repos author their
// `comtrya.cue` against these definitions:
//
//     import "github.com/comtrya/comtrya/schema"
//     repository: schema.#Repository & {
//         labels: [schema.#PlainLabel & {name: "bug"}]
//     }
//
// The kernel is the source of truth for this package. The forge embeds
// it and, when evaluating a repo that does not ship the package
// in-module, vendors it into the eval workdir alongside a thin
// `package comtrya` bridge that exposes `#Project` for extension
// contribution and constrains the top-level config shape.
package schema

// ---------------------------------------------------------------------
// Canonical comtrya:// references.
//
// Every owner / author / assignee / actor / target inside the forge
// is identified by a typed reference whose `.ref` is a canonical
// `comtrya://` URN. CUE derives the URN from a `.slug`, so users
// declare ownership compactly (`schema.#OwnerRef & { slug: "rawkode" }`)
// and the kernel still gets a fully-qualified URN to link against.
//
// Extensions that need ownership / author / assignee fields should
// reference these types rather than re-rolling string fields. This
// is what makes "epics owned by rawkode" and "this doc was written
// by claude-code" speak the same vocabulary.
// ---------------------------------------------------------------------

// Every reference carries a `kind` (closed set — user / agent / bot
// / credential / team) and a `slug` (the compact identifier the user
// typed in CUE). The `ref` field is derived from the two via an
// interpolated URN template, so users write
// `{kind: "user", slug: "rawkode"}` and the kernel emits
// `{kind, slug, ref: "comtrya://user/rawkode"}`.
//
// A single closed type rather than a #UserRef | #AgentRef | ...
// disjunction — CUE can derive `ref` cleanly because there's only one
// template to apply.
#Ref: {
	kind: "user" | "agent" | "bot" | "credential" | "team"
	slug: =~"^[A-Za-z0-9][A-Za-z0-9._-]*$"
	ref:  "comtrya://\(kind)/\(slug)"
}

// `#PrincipalRef` is a #Ref whose kind is an acting identity (not a
// team). Use this in author / assignee / actor fields where a single
// principal is required.
#PrincipalRef: #Ref & {
	kind: "user" | "agent" | "bot" | "credential"
}

// `#OwnerRef` is a #Ref whose kind is anything that can own work —
// any principal, or a team standing in for many.
#OwnerRef: #Ref

// ---------------------------------------------------------------------
// #Project — the kernel's first-class unit of work inside a repo.
// By default a repo is one Project. Monorepos declare more by
// populating the `projects` map the forge constrains with this type.
// ---------------------------------------------------------------------

#Project: {
	// Project name, unique within the repo.
	name: string

	// Path inside the repo this Project owns. The repo root is "".
	// Per-Project doc / build / etc. paths declared by extension
	// schemas are resolved relative to this.
	root: string | *""

	// Free-form labels for grouping and filtering.
	labels?: [...string]

	// Owners of this Project. Typed refs so each entry carries both
	// a `.slug` (compact, what users type) and a derived `.ref`
	// (canonical URN, what the forge links against). Mix users,
	// teams, agents — whatever maps to a comtrya:// identity.
	owners?: [...#OwnerRef]

	// Other fields are added by extension-registered schemas
	// (`docs`, `builds`, `agents`, `pulls`, `issues`, ...).
	...
}

// ---------------------------------------------------------------------
// #Repository — kernel-level, per-repo settings. One repo, one block.
// Distinct from #Project: this is the *forge*'s view of the repo (who
// can see it, which ref is "default"), not the project structure
// within.
// ---------------------------------------------------------------------

#Repository: {
	// Forge-level visibility. Drives the shell's disclosure on index
	// pages and search, and (eventually) ACL defaults. Lowercase in
	// CUE; the server uppercases when projecting to the JSON API.
	visibility?: "public" | "internal" | "private" | *"private"

	// Canonical default branch. If unset, the forge falls back to the
	// git symbolic ref (HEAD), then to "main". jj-backed repos use
	// this to declare the default bookmark name.
	defaultBranch?: string

	// Version-control system backing the repo. "git" is the default;
	// "jj" declares a Jujutsu-native repo (and, for jj-on-git, lets the
	// forge prefer bookmarks over refs when both are present).
	vcs?: "git" | "jj" | *"git"

	// Short human description, surfaced on the repo home page.
	description?: string

	// A curated set of named refs the repo author wants prominent on
	// the repo home. Maps cleanly across vcs backends: git branches,
	// jj bookmarks, or release tags. The forge does not validate that
	// each name resolves on the backing repo — the list is a
	// declaration of intent, not a constraint.
	bookmarks?: [...#Bookmark]

	// The repo's label catalog. Plain labels (`#PlainLabel.name: "bug"`),
	// typed non-exclusive labels (`type: "kind", value: "defect"` →
	// displays as `kind::defect`, multiple may coexist), and typed
	// exclusive labels (at most one per type on a labelled thing). The
	// kernel owns the catalog so any first-party or extension surface —
	// issues, pulls, epics, repos, boards — speaks the same vocabulary.
	labels?: [...#Label]

	// Extensions this repo opts into, by extension id (e.g.
	// "ext_issues"). Strictly off by default: a repo that omits this
	// field — or sets it to `[]` — gets NO extension repository
	// features. The forge rejects a push whose `enabledExtensions`
	// names an id that is not an installed extension. Instance-context
	// extension features are unaffected; this gates only the
	// repository-context features of the named extensions.
	enabledExtensions: [...string] | *[]
}

#Bookmark: {
	// The ref name as it appears in the backing vcs (e.g. "main",
	// "v3", "release/2026.05"). For jj-on-git this matches the
	// bookmark name on the colocated repo.
	name: string

	// Optional short human label. Defaults to `name` at render time.
	label?: string

	// Optional one-line description of what the bookmark represents.
	description?: string
}

// Label catalog entries are one of three CUE types. The CUE type
// IS the discriminator — there is no `exclusive: bool` field,
// no `::` vs `!!` wire-syntax distinction. All scoped labels
// (whether mutually-exclusive or not) live under `type::value` on
// the wire; consumers read the kind from the catalog entry, not
// from the string.
//
//   • #PlainLabel    — `{ name: "bug" }`. Single token.
//   • #ScopedLabel   — `{ type: "kind", value: "ux" }`. Multiple
//                      values of the same type may coexist on a
//                      labelled thing.
//   • #ExclusiveLabel — `{ type: "priority", value: "p0" }`. A
//                      labelled thing carries AT MOST one value
//                      per type (the catalog enforces it).
//
// Optional `color` and `description` apply uniformly across all
// three.

#PlainLabel: {
	kind:         "plain"
	name:         string
	color?:       string
	description?: string
}

#ScopedLabel: {
	kind:         "scoped"
	type:         string
	value:        string
	color?:       string
	description?: string
}

#ExclusiveLabel: {
	kind:         "exclusive"
	type:         string
	value:        string
	color?:       string
	description?: string
}

#Label: #PlainLabel | #ScopedLabel | #ExclusiveLabel
