# Container

Comtrya ships as a single-binary `comtrya-server`. The
`Dockerfile` at the repo root builds a Debian-slim runtime image.

## Build

```bash
docker build -t comtrya-server:dev .
```

First build is ~5–10 minutes on a cold cache (full Rust workspace +
cuengine's Go FFI). Subsequent builds with no source change are
sub-30s.

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

## Environment

| Variable | Default | Purpose |
|----------|---------|---------|
| `COMTRYA_DATA_DIR` | `/app/data` | Persistent state (sessions, events, audit, repos). |
| `COMTRYA_EXTENSION_DIR` | `/app/extensions/first-party` | Where the kernel looks for extension manifests + `.wasm`. |
| `COMTRYA_LISTEN` | `0.0.0.0:8080` | Server bind address. Override with caution. |
| `COMTRYA_CONFIG` | unset | Optional path to a CUE config that overrides defaults. |
| `RUST_LOG` | unset (defaults `info` once #28 lands) | Tracing-subscriber filter. |
| `COMTRYA_LOG_FORMAT` | unset (compact, once #28 lands) | `json` switches to JSON-Lines output. |

## Image facts

- Base: `debian:bookworm-slim` runtime, `golang:1.25-bookworm` builder.
- Runtime apt deps: `ca-certificates`, `git`, `tar`, `curl`.
- Non-root: UID 10001, home `/app`.
- Exposed port: `8080`.
- Healthcheck: `curl -sf http://localhost:8080/healthz` every 30s,
  30s start-period.

## Out of scope (follow-ups)

- **CI build on push to `main`** — separate sub-PR.
- **Multi-arch (`linux/arm64`)** — single-arch (`linux/amd64`) only
  for v1; multi-arch builds need `buildx` + a registry target.
- **Registry push** — operator-specific; no default registry pinned.
