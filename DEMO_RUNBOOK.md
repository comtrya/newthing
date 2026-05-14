# Comtrya demo operator runbook

> **URL scheme (v3):** repositories at `/r/<group>/<...>/<repo>`.
> Extension-owned pages live at `/x/<prefix>/<...>`. The workspace homepage is
> `/`.

This runbook is for the local production-testbed demo.

## Clean reset

Use a reset when you want to reseed the demo repository and extension storage:

```sh
cp .envrc.example .envrc
./start.sh --reset
```

For shared demos, set a non-default operator code and enable the external-demo
gate before starting:

```sh
export COMTRYA_OPERATOR_CODE="<non-default-demo-code>"
export COMTRYA_EXTERNAL_DEMO=1
./start.sh --reset
```

`--reset` only deletes guarded generated paths under `COMTRYA_DATA_DIR`.

## Start

Interactive run:

```sh
./start.sh
```

One-shot smoke run:

```sh
./start.sh --reset --oneshot
```

Useful local overrides:

```sh
COMTRYA_DATA_DIR=/private/tmp/comtrya-production-testbed \
COMTRYA_LISTEN=127.0.0.1:8080 \
COMTRYA_FRONTEND_LISTEN=127.0.0.1:4321 \
./start.sh --reset
```

## URLs

- Workspace homepage: `http://127.0.0.1:4321/`
- Seeded repository: `http://127.0.0.1:4321/r/comtrya/comtrya`
- Extension-owned pages: `http://127.0.0.1:4321/x/<prefix>/<...>`
- Rust server: `http://127.0.0.1:8080/`
- Readiness through the frontend: `http://127.0.0.1:4321/readyz`
- Direct server readiness: `http://127.0.0.1:8080/readyz`

When using custom listen addresses, read the URLs from `start.sh` output.

## Credentials

`.envrc.example` seeds:

```sh
COMTRYA_OPERATOR_CODE=comtrya-local-operator-code
```

That code is acceptable for local smoke only. With
`COMTRYA_EXTERNAL_DEMO=1`, startup rejects it and requires a non-default
`COMTRYA_OPERATOR_CODE`.

## Smoke output

A passing `./start.sh --reset --oneshot` should print evidence for:

- static v3 cutover checks: no first-party `.wat` stubs, no legacy string
  matcher, valid platform WIT versions, and real `dist/<id>.wasm` artifacts
- Vue shell, health, and readiness checks returning `200`
- unsupported legacy v1, OIDC callback, and receive-pack checks returning
  explicit `UNSUPPORTED` errors
- operator-code token exchange success
- GraphQL Git/storage/extension assertions
- seeded repository path, branch list, and installed extension list
- event stream, session reuse, and expired-session fail-closed checks
- extension manifest and asset checks for all first-party extensions
- Git no-token, wrong-token, and wrong-scope failures
- `git ls-remote`, `git clone`, and branch-specific fetch success
- browser smoke against the live Vue shell
- GraphQL `issues.close` emitting `ext_issues` WASM events
- pull-request merge reactor closing linked issues through cross-extension WASM

## Data locations

Default data root:

```sh
/private/tmp/comtrya-production-testbed
```

Important generated paths:

- `metadata/demo-state.json`: copied seed input.
- `metadata/events.jsonl`: runtime event log.
- `metadata/audit.jsonl`: runtime audit log.
- `repositories/<owner>/<repo>.git`: seeded bare Git repositories.
- `metadata/demo-repository-workdir`: temporary seed worktree.
- `extensions/storage/schema.json`: extension storage schema.
- `extensions/storage/documents.jsonl`: extension storage documents.
- `extensions/storage/events.jsonl`: extension storage events.
- `server.log` and `frontend.log`: logs captured by `start.sh`.

## Inspect seeded Git

Set `DATA_DIR` to the value printed by `start.sh` if you override it.

```sh
DATA_DIR=/private/tmp/comtrya-production-testbed
git --git-dir "$DATA_DIR/repositories/comtrya/comtrya.git" show-ref
git --git-dir "$DATA_DIR/repositories/comtrya/comtrya.git" rev-parse HEAD
git --git-dir "$DATA_DIR/repositories/comtrya/comtrya.git" log --oneline --decorate --all
```

Clone through the Vue origin with a scoped credential by using the token
exchange flow from `start.sh`, or rerun `./start.sh --reset --oneshot` and rely
on its clone/fetch smoke assertions.

## Inspect extension storage

```sh
DATA_DIR=/private/tmp/comtrya-production-testbed
sed -n '1,220p' "$DATA_DIR/extensions/storage/schema.json"
sed -n '1,20p' "$DATA_DIR/extensions/storage/documents.jsonl"
sed -n '1,20p' "$DATA_DIR/extensions/storage/events.jsonl"
```

Each document line includes the owner extension, collection, id, resource,
indexed fields, version, update timestamp, and data payload.

## Known unsupported surfaces

- Receive-pack/push is disabled.
- Full OIDC browser callback validation is disabled in the testbed.
- Legacy Comtrya v1 HTTP APIs are intentionally unsupported.
- The `demo` GraphQL aggregate remains as a compatibility convenience, assembled
  from Git, runtime storage, and extension data.
