# Containers

Comtrya ships two production images:

- `ghcr.io/comtrya/comtrya-server` — the Rust API/auth/git/extension server.
- `ghcr.io/comtrya/comtrya-frontend` — the Vite/Vue SPA served by nginx.

## Build

```bash
docker build -t comtrya-server:dev -f Dockerfile .
docker build -t comtrya-frontend:dev -f frontend/Dockerfile frontend
```

First build is ~5–10 minutes on a cold cache (full Rust workspace +
cuengine's Go FFI). Subsequent builds with no source change are
sub-30s.

CI publishes both images to GHCR on pushes to `main`, tagging each image
with the commit SHA and `latest`. Version tags (`v*`) publish matching
tagged images.

## Run with mounted data volume

Host-mounted volumes MUST be writable by **UID 10001** — the image
runs as a non-root user. Prepare the host directory once:

```bash
mkdir -p ./data
sudo chown 10001:10001 ./data
docker run --rm -p 8080:8080 -v "$(pwd)/data:/app/data" comtrya-server:dev
```

Kubernetes operators: set `securityContext.fsGroup: 10001` on the
pod spec so the kubelet adjusts ownership of mounted persistent
volumes at startup. `runAsUser: 10001` is also reasonable for
extra defense in depth.

## Smoke

`--check` runs `Runtime::start` + `readiness()` and exits — it
validates the full boot path without ever binding the listener.
Use it for one-shot deployment validation:

```bash
docker run --rm comtrya-server:dev --check
# exit 0 = ready, exit 1 = readiness failed
```

## Healthcheck

The image's Docker `HEALTHCHECK` curls `/healthz` every 30 seconds.
The probe is intentionally light — it doesn't spin up a second
runtime. The `--check` CLI mode is heavier (cold-init Wasmtime,
seed git repo) and is intended for boot-time validation, not as a
recurring probe.

The frontend image exposes port `8080` and serves `/healthz` as a light
static readiness endpoint. The Kubernetes base deploys it as
`comtrya-frontend`. Route API paths (`/graphql`, `/api`, `/auth`,
`/_extensions`, `/git`, `/events`, `/healthz`, `/readyz`) to
`comtrya-server`, and route SPA paths to `comtrya-frontend`.

## Environment

| Variable | Default | Purpose |
|----------|---------|---------|
| `COMTRYA_DATA_DIR` | `/app/data` | Persistent state (sessions, events, audit, repos). |
| `COMTRYA_EXTENSION_DIR` | `/app/extensions/first-party` | Where the kernel looks for extension manifests + `.wasm`. |
| `COMTRYA_MIGRATIONS_DIR` | `/app/migrations` | Directory containing the `sqlite/` schema migrations. |
| `COMTRYA_LISTEN` | `0.0.0.0:8080` | Server bind address. Override with caution. |
| `COMTRYA_CONFIG_REPO_URL` | unset | CUE config repo URL (pure GitOps). Unset runs an unconfigured dev default. |
| `COMTRYA_CONFIG_REPO_REF` | remote default | Branch/ref of the config repo to track. |
| `COMTRYA_CONFIG_REPO_PATH` | repo root | Optional relative subdirectory inside the config repo to evaluate. Absolute paths and `..` are rejected. |
| `RUST_LOG` | unset (defaults `info` once #28 lands) | Tracing-subscriber filter. |
| `COMTRYA_LOG_FORMAT` | unset (compact, once #28 lands) | `json` switches to JSON-Lines output. |

Generate a starter remote GitOps config directory with:

```bash
comtrya generate config --dir ./config
```

## Server image facts

- Base: `debian:bookworm-slim` runtime, `golang:1.25-bookworm` builder.
- Runtime apt deps: `ca-certificates`, `git`, `tar`, `curl`.
- Non-root: UID 10001, home `/app`.
- Exposed port: `8080`.
- Healthcheck: `curl -sf http://localhost:8080/healthz` every 30s,
  30s start-period.
