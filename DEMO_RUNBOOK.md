# Comtrya Demo Operator Runbook

This runbook is for the local production-testbed demo.

## Clean Reset

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

- Frontend: `http://127.0.0.1:4321/`
- Rust server: `http://127.0.0.1:8080/`
- Server readiness through the frontend: `http://127.0.0.1:4321/readyz`
- Direct server readiness: `http://127.0.0.1:8080/readyz`

When using custom listen addresses, read the URLs from `start.sh` output.

## Expected Credentials

`.envrc.example` seeds:

```sh
COMTRYA_OPERATOR_CODE=comtrya-local-operator-code
```

That code is acceptable for local smoke only. With
`COMTRYA_EXTERNAL_DEMO=1`, startup rejects it and requires a non-default
`COMTRYA_OPERATOR_CODE`.

## Smoke Output

A passing `./start.sh --reset --oneshot` should print:

- frontend shell and readyz checks returning `200`
- unsupported legacy v1 and OIDC callback checks returning explicit
  `UNSUPPORTED` errors
- operator-code token exchange success
- GraphQL Git/storage/resolver assertions
- seeded repository path, branch list, and installed extension list
- event stream, session reuse, and expired-session fail-closed checks
- extension manifest and asset checks for all first-party extensions
- Git no-token, wrong-token, and wrong-scope failures
- `git ls-remote`, `git clone`, and branch-specific fetch success
- receive-pack returning the explicit `UNSUPPORTED` error

## Data Locations

Default data root:

```sh
/private/tmp/comtrya-production-testbed
```

Important generated paths:

- `metadata/demo-state.json`: copied seed input.
- `metadata/events.jsonl`: runtime event log.
- `metadata/audit.jsonl`: runtime audit log.
- `repositories/comtrya/comtrya.git`: seeded bare Git repository.
- `metadata/demo-repository-workdir`: temporary seed worktree.
- `extensions/storage/schema.json`: extension storage schema.
- `extensions/storage/documents.jsonl`: extension storage documents.
- `extensions/storage/events.jsonl`: extension storage events.
- `server.log` and `frontend.log`: logs captured by `start.sh`.

## Inspect Seeded Git

Set `DATA_DIR` to the value printed by `start.sh` if you override it.

```sh
DATA_DIR=/private/tmp/comtrya-production-testbed
git --git-dir "$DATA_DIR/repositories/comtrya/comtrya.git" show-ref
git --git-dir "$DATA_DIR/repositories/comtrya/comtrya.git" rev-parse HEAD
git --git-dir "$DATA_DIR/repositories/comtrya/comtrya.git" log --oneline --decorate --all
```

Clone through the Astro origin with a scoped credential by using the token
exchange flow from `start.sh`, or rerun `./start.sh --reset --oneshot` and rely
on its clone/fetch smoke assertions.

## Inspect Extension Storage

```sh
DATA_DIR=/private/tmp/comtrya-production-testbed
sed -n '1,220p' "$DATA_DIR/extensions/storage/schema.json"
sed -n '1,20p' "$DATA_DIR/extensions/storage/documents.jsonl"
sed -n '1,20p' "$DATA_DIR/extensions/storage/events.jsonl"
```

Each document line includes the owner extension, collection, id, resource,
indexed fields, version, update timestamp, and data payload.

## Known Not Real Yet

- The Wasmtime resolver ABI is still a minimal proof ABI.
- The host still provides repository layout/context, while code browser, pull
  request, and checks product surfaces are composed through extension slots.
- PR/check business behavior is not yet resolver-owned against real Git refs.
- Receive-pack/push is disabled.
- Full browser interaction coverage still needs a Playwright or Browser-plugin
  path, but `start.sh` now runs the live Astro page in headless Chrome/Chromium
  and checks that the real frontend host path mounts non-empty first-party
  code-browser, pull-request, and checks surfaces.
