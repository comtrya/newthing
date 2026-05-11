# Production Testbed

The production testbed runtime is a safe, runnable single-node target for exercising Comtrya's production posture while the full v1 implementation is still being built.

It is intentionally fail-closed: unsupported SPEC surfaces do not return fake success. Readiness reports those unsupported surfaces explicitly.

See `ARCHITECTURE.md` for the current runtime map and `DEMO_RUNBOOK.md` for
operator commands and inspection steps.

## Run

For the normal end-to-end smoke path:

```sh
cp .envrc.example .envrc
./start.sh
```

`.envrc` supplies the seeded production-testbed operator code. The script builds
the Rust server and Astro frontend, validates production-testbed startup gates,
starts both processes, probes the frontend health/readiness/Auth/GraphQL/events/
extensions/Git boundaries, and then keeps the stack running for manual browser
testing. Use
`COMTRYA_ONESHOT=1 ./start.sh` when you want the same smoke test to stop the
server and exit after the probes pass. Oneshot runs default to
`COMTRYA_SESSION_TTL_SECONDS=2` so the smoke path can prove expired browser
session tokens fail closed without waiting five minutes; normal interactive runs
keep the five-minute session TTL unless you set the variable yourself.
Set `COMTRYA_EXTERNAL_DEMO=1` for shared demos; production startup then
rejects the local `.envrc.example` operator code and requires a non-default
`COMTRYA_OPERATOR_CODE`.

`./start.sh` seeds demo input into
`$COMTRYA_DATA_DIR/metadata/demo-state.json` from
`fixtures/demo/conference.json`; server startup imports that input into the
versioned extension storage tables under `$COMTRYA_DATA_DIR/extensions/storage`.
Use `./start.sh --reset` or `COMTRYA_RESET_DEMO_DATA=1` to intentionally
delete and reseed generated demo repository and extension storage paths under
`$COMTRYA_DATA_DIR`; set `COMTRYA_RESET_DEMO_DATA=0` if you want to keep
edits in that data directory between runs. Explicit environment values passed to
`./start.sh` win over values loaded from `.envrc`. The smoke output prints the
seeded repository path, live branch list, and installed extension list after
GraphQL is available.

```sh
mkdir -p /private/tmp/comtrya-production-testbed
COMTRYA_CONFIG=config/production-testbed.cue \
COMTRYA_DATA_DIR=/private/tmp/comtrya-production-testbed \
COMTRYA_TLS_TERMINATED=true \
COMTRYA_OPERATOR_CODE="comtrya-local-operator-code" \
cargo run -p comtrya-server -- --check
```

Start the full stack:

```sh
./start.sh
```

The server is designed to sit behind a TLS-terminating reverse proxy. In `environment: "production"`, startup fails unless `COMTRYA_TLS_TERMINATED=true`, `COMTRYA_OPERATOR_CODE` is set to at least 12 characters, `COMTRYA_DATA_DIR` is absolute, allowed origins are HTTPS, and local repository storage paths are absolute.

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

## Current Production-Testbed Boundary

Ready means the runtime is safe to run as a production-style test bed:

- configuration loaded from `config.cue`
- production startup gates enforced
- data directories initialized
- event and audit logs are durable JSONL files
- a real local bare Git repository is seeded or opened under `$COMTRYA_DATA_DIR/repositories`
- the seeded bare Git repository HEAD and expected demo branch refs validate at startup
- browser CORS checks are enforced
- operator-code based testbed token exchange issues five-minute scoped credentials
- SSE and extension asset session tokens are single-use and expire fail-closed
- the Astro frontend fronts the Rust API without injecting credentials
- the repository UI renders live Git refs, branches, commits, and Git/storage-derived metric counts; the SSR shell exposes the same head OID that GraphQL and Git clone/fetch return; code browsing, pull requests, and checks are mounted through extension-composed surfaces
- first-party pull request, code browser, and checks extensions are loaded from disk, compiled/instantiated as Component Model components through Wasmtime, and exposed through `/_extensions/...` with typed resolver output summaries
- the frontend mounts extension host elements from runtime extension installations and UI manifest slot declarations
- extension-owned pull request/check/activity state is persisted in the versioned `$COMTRYA_DATA_DIR/extensions/storage` schema and document tables
- Git upload-pack clone/fetch works through the Astro origin with a scoped Comtrya credential
- smoke validation compares the GraphQL diff patch with real cloned-repository Git diff output
- smoke validation drives the live Astro page in headless Chrome/Chromium and checks the real frontend host path mounts non-empty code-browser, pull-request, and checks output
- unsupported runtime surfaces are listed from one registry in `/readyz` and return `UNSUPPORTED` JSON errors
- Git receive-pack write surfaces fail closed after authentication

It does **not** mean full Comtrya v1 production completeness. `/readyz` reports these unsupported areas until they are replaced with real implementations:

- full OIDC browser callback validation
- git receive-pack writes in the production-testbed demo
- legacy Comtrya v1 API routes in the v2 production-testbed runtime
