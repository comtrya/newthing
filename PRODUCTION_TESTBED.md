# Production testbed

> **URL scheme (v3):** repositories at `/r/<group>/<...>/<repo>`.
> Extension-owned pages live at `/x/<prefix>/<...>`. The workspace homepage is
> `/`.

The production-testbed runtime is a safe, runnable single-node target for
exercising Comtrya's production posture while the full v1 implementation is
still being built.

It fails closed: unsupported SPEC surfaces do not return fake success.
Readiness reports those unsupported surfaces explicitly.

See `ARCHITECTURE.md` for the runtime map and `DEMO_RUNBOOK.md` for operator
commands and inspection steps.

## Run

Normal interactive path:

```sh
cp .envrc.example .envrc
./start.sh
```

One-shot smoke path:

```sh
./start.sh --reset --oneshot
```

The script builds the Rust server and Vite/Vue frontend, validates
production-testbed startup gates, starts both processes, probes the frontend
health/readiness/Auth/GraphQL/events/extensions/Git boundaries, runs browser
smoke against the Vue shell, and keeps the stack running for manual testing
unless `--oneshot` is used.

Oneshot runs default to `COMTRYA_SESSION_TTL_SECONDS=2` so the smoke path can
prove expired browser session tokens fail closed without waiting five minutes.
Interactive runs keep the five-minute session TTL unless you set the variable
yourself.

Set `COMTRYA_EXTERNAL_DEMO=1` for shared demos; production startup then rejects
the local `.envrc.example` operator code and requires a non-default
`COMTRYA_OPERATOR_CODE`.

`./start.sh` seeds demo input into
`$COMTRYA_DATA_DIR/metadata/demo-state.json` from
`fixtures/demo/conference.json`. Server startup imports that seed input into
versioned extension storage under `$COMTRYA_DATA_DIR/extensions/storage`, using
WASM-backed creation paths for extension-owned records where the v3 runtime owns
that behavior.

Use `./start.sh --reset` or `COMTRYA_RESET_DEMO_DATA=1` to intentionally delete
and reseed generated demo repository and extension storage paths under
`$COMTRYA_DATA_DIR`; set `COMTRYA_RESET_DEMO_DATA=0` if you want to keep edits
in that data directory between runs. Explicit environment values passed to
`./start.sh` win over values loaded from `.envrc`.

Server check without the frontend:

```sh
mkdir -p /private/tmp/comtrya-production-testbed
COMTRYA_CONFIG=config/production-testbed.cue \
COMTRYA_DATA_DIR=/private/tmp/comtrya-production-testbed \
COMTRYA_TLS_TERMINATED=true \
COMTRYA_OPERATOR_CODE="comtrya-local-operator-code" \
cargo run -p comtrya-server -- --check
```

The server is designed to sit behind a TLS-terminating reverse proxy. In
`environment: "production"`, startup fails unless `COMTRYA_TLS_TERMINATED=true`,
`COMTRYA_OPERATOR_CODE` is set to at least 12 characters,
`COMTRYA_DATA_DIR` is absolute, allowed origins are HTTPS, and local repository
storage paths are absolute.

## Endpoints

- `GET /healthz`
- `GET /readyz`
- `GET|POST /graphql`
- `POST /auth/token-exchange`
- `POST /events/session`
- `GET /events`
- `GET /graphql/stream`
- `POST /_extensions/session`
- `GET /_extensions/<id>/manifest.json`
- `GET /_extensions/<id>/assets/<path>`
- `/git/...` authentication and scope checks

## Current production-testbed boundary

Ready means the runtime is safe to run as a production-style testbed:

- configuration loaded from CUE
- production startup gates enforced
- data directories initialized
- event and audit logs are durable JSONL files
- local bare Git repositories are seeded or opened under
  `$COMTRYA_DATA_DIR/repositories`
- seeded Git refs and `HEAD` validate at startup
- browser CORS checks are enforced
- operator-code token exchange issues scoped credentials
- SSE and extension asset session tokens are single-use and expire fail-closed
- the Vue frontend fronts the Rust API without injecting credentials
- the repository UI renders live Git/storage/extension data through shell and
  extension slots
- first-party extensions load real Component Model artifacts from
  `dist/<id>.wasm`
- GraphQL product operations route through generated dispatch into WASM
- pull-request merge reactions close linked issues through cross-extension WASM
- extension-owned state is persisted in versioned storage
- Git upload-pack clone/fetch works through the Vue origin with a scoped
  Comtrya credential
- smoke validation compares GraphQL diff patches with cloned-repository Git
  diff output
- smoke validation drives the live Vue page in headless Chrome/Chromium
- unsupported runtime surfaces are listed from one registry in `/readyz` and
  return `UNSUPPORTED` JSON errors
- Git receive-pack write surfaces fail closed after authentication

It does **not** mean full Comtrya v1 production completeness. `/readyz` reports
these unsupported areas until they are replaced with real implementations:

- full OIDC browser callback validation
- git receive-pack writes in the production-testbed demo
- legacy Comtrya v1 API routes in the v2/v3 production-testbed runtime
