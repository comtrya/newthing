# Production Testbed

The production testbed runtime is a safe, runnable single-node target for exercising Forgepoint's production posture while the full v1 implementation is still being built.

It is intentionally fail-closed: unsupported SPEC surfaces do not return fake success. Readiness reports those unsupported surfaces explicitly.

## Run

```sh
mkdir -p /private/tmp/forgepoint-production-testbed
FORGEPOINT_CONFIG=config/production-testbed.cue \
FORGEPOINT_DATA_DIR=/private/tmp/forgepoint-production-testbed \
FORGEPOINT_TLS_TERMINATED=true \
FORGEPOINT_OPERATOR_TOKEN="$(openssl rand -hex 32)" \
cargo run -p forgepoint-server -- --check
```

Start the server:

```sh
FORGEPOINT_CONFIG=config/production-testbed.cue \
FORGEPOINT_DATA_DIR=/private/tmp/forgepoint-production-testbed \
FORGEPOINT_TLS_TERMINATED=true \
FORGEPOINT_OPERATOR_TOKEN="<same-token>" \
FORGEPOINT_LISTEN=127.0.0.1:8080 \
cargo run -p forgepoint-server
```

The server is designed to sit behind a TLS-terminating reverse proxy. In `environment: "production"`, startup fails unless `FORGEPOINT_TLS_TERMINATED=true`, `FORGEPOINT_OPERATOR_TOKEN` is set to at least 32 characters, `FORGEPOINT_DATA_DIR` is absolute, allowed origins are HTTPS, and local repository storage paths are absolute.

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
- browser CORS checks are enforced
- operator-token based testbed token exchange issues five-minute scoped credentials
- SSE and extension asset session tokens are single-use
- unsupported Git pack execution fails closed after authentication

It does **not** mean full Forgepoint v1 production completeness. `/readyz` reports these unsupported areas until they are replaced with real implementations:

- full OIDC browser callback validation
- native `gix` smart-HTTP pack execution
- Wasmtime component execution
