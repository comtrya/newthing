# Comtrya operator runbook

Operational procedures for production-class deployments of
`comtrya-server`. Pairs with:

- [`docs/CONTAINER.md`](CONTAINER.md) — image build/run mechanics.
- [`../PRODUCTION_TESTBED.md`](../PRODUCTION_TESTBED.md) — what the
  testbed runtime is and what it deliberately leaves un-implemented.
- [`../DEMO_RUNBOOK.md`](../DEMO_RUNBOOK.md) — local-demo operator
  commands (reset, smoke, inspect).
- [`../ARCHITECTURE.md`](../ARCHITECTURE.md) — runtime map.
- [`PANIC_AUDIT.md`](PANIC_AUDIT.md) — the panic-free-HTTP-paths
  promise and how to extend it.

This document covers the six topics #14 P3-2 enumerated: deploy,
rollback, common failures, restore from backup, key rotation,
capacity signals.

## Surface inventory

### Environment variables

| Var | Required | Effect |
|---|---|---|
| `COMTRYA_CONFIG` | No (recommended in prod) | Path to the CUE config file. Optional — the server starts with built-in defaults if unset. Set explicitly in production so the operator owns the config surface. |
| `COMTRYA_DATA_DIR` | No (defaults `./data`) | Root of persistent state (events.jsonl, audit.jsonl, repositories/, extensions/, secrets/). Override in production to point at the mounted data volume. |
| `COMTRYA_EXTENSION_DIR` | No (defaults `extensions/first-party`) | Root containing first-party extension manifests + `.wasm` artifacts. Override only if you ship extensions in a non-default location. |
| `COMTRYA_LISTEN` | No (defaults `127.0.0.1:8080`) | Bind address. The shipped Dockerfile overrides to `0.0.0.0:8080`. |
| `COMTRYA_LOG_FORMAT` | No | `json` for production log-aggregator ingest; anything else (or unset) is compact human-readable. |
| `RUST_LOG` | No | tracing-subscriber filter. Recommend `info` in production. |
| `COMTRYA_OPERATOR_CODE` | Yes (prod) | Operator-only auth fallback. `/readyz` reports `operatorCodeConfigured: false` until set in `Production` env — pod stays out of rotation until configured. |
| `COMTRYA_TLS_TERMINATED` | Yes (prod) | Set to `true` behind a TLS terminator. `/readyz` reports `productionTlsTerminated: false` until set in `Production` env. |
| `COMTRYA_SESSION_TTL_SECONDS` | No | Session expiry. Defaults are conservative; tune per deployment. |
| `COMTRYA_EXTERNAL_DEMO` | No | Shared-demo gate. When set, default `COMTRYA_OPERATOR_CODE` values are rejected at boot. |

### Persistent data layout under `$COMTRYA_DATA_DIR`

| Path | Contents | Operator concern |
|---|---|---|
| `metadata/events.jsonl` | Append-only domain events (extension lifecycle, issue/pull lifecycle, etc.). | Grows unbounded — rotation is a deferred sub-item (#11 P2-3). Tail for business-level signals. |
| `metadata/audit.jsonl` | Append-only audit trail (auth, session issuance). | Same rotation caveat. Inspect after security incidents. |
| `metadata/demo-state.json` | Demo-only state snapshot (excluded from production volumes). | N/A in production. |
| `repositories/` | Bare Git repositories. | Backup target. Per-repo subdirs. |
| `extensions/` | Per-extension runtime storage (Sled). | Backup target. Each extension owns a sub-namespace. |
| `secrets/` | Reserved for future secret material. | Currently empty; do not delete the dir. |

### Health endpoints

- `GET /healthz` — process-alive probe. Returns `{"status":"ok"}`
  unconditionally if the binary is responding. Cheap; safe for
  every-second probes.
- `GET /readyz` — deep readiness. Returns JSON of the form:
  ```json
  {
    "ready": true,
    "mode": "production-testbed",
    "checks": {
      "configValid": true,
      "dataDirWritable": true,
      "eventLogWritable": true,
      "auditLogWritable": true,
      "demoBareRepository": true,
      "demoRepositoryRefs": true,
      "extensionStorageSchema": true,
      "extensionStorageDocuments": true,
      "productionTlsTerminated": true,
      "operatorCodeConfigured": true
    },
    "unsupported": ["..."]
  }
  ```
  `ready: false` when ANY check is false. The two production gates
  (`productionTlsTerminated`, `operatorCodeConfigured`) are the
  most common cause of a fresh deployment reporting `ready: false`
  — both default to true in non-Production environments.
- Probe `/readyz` once at 5–10s intervals; use `/healthz` for
  high-frequency liveness.

## Deploy

### First-time setup

1. Build or pull the image: see [`CONTAINER.md`](CONTAINER.md).
2. Prepare the host-mounted data volume:
   ```bash
   mkdir -p ./data
   sudo chown 10001:10001 ./data
   ```
   The image runs as UID 10001. Kubernetes operators: set
   `securityContext.fsGroup: 10001` on the pod spec.
3. Prepare the CUE config file. Start from `config/production-testbed.cue`
   in the repo and replace placeholder OIDC client secrets,
   redirect URLs, and repository storage backends with real values.
4. Set the required env vars (see surface inventory above). In
   `Production` mode, `COMTRYA_TLS_TERMINATED=true` and
   `COMTRYA_OPERATOR_CODE` are required for `/readyz` to report
   `ready: true`.
5. Validate boot before exposing traffic:
   ```bash
   docker run --rm \
       -v "$(pwd)/data:/app/data" \
       -v "$(pwd)/config/production-testbed.cue:/app/config.cue:ro" \
       -e COMTRYA_CONFIG=/app/config.cue \
       comtrya-server --check
   ```
   The config file MUST be bind-mounted into the container —
   the env var only names the path; it doesn't provide content.
   Exits 0 only if `Runtime::start` succeeds and `/readyz`
   reports `ready: true`. Use this as a CI gate before promoting
   an image to production.
6. Start the server, wire the load balancer to `/readyz`, and
   wait for the readiness probe to succeed before adding the
   pod to the service pool.

### Subsequent rolling deploys

1. Push the new image tag.
2. Update the deployment manifest's image reference.
3. Orchestrator (k8s, ECS, Nomad) does the rolling rotation:
   new pod comes up → `/readyz` reports ready → load balancer
   shifts traffic → old pod drains.
4. **Connection drain caveat**: graceful in-process shutdown is
   NOT yet wired (PR #32 is still open). SIGTERM to the
   container today aborts in-flight HTTP requests
   ungracefully. Drain via the load balancer first
   (stop sending NEW traffic to the pod, wait the LB's drain
   timeout, then send SIGTERM). Kubernetes:
   `terminationGracePeriodSeconds` does not currently help
   because the server doesn't wait for in-flight requests.

## Rollback

The kernel currently has no schema migrations (in-memory
`BTreeMap` data state, JSONL append-only logs). Forward and
backward image rollbacks against the same data dir are safe
today.

When schema migrations land (#12 P2-1, not yet implemented):
this section will need a "data-dir compatibility matrix" subsection
naming which image versions can read which data-dir formats.

Rollback procedure today:

1. Update the deployment image reference back to the previous
   known-good tag.
2. Orchestrator rolls out as for any deploy.
3. The same data dir works against the older binary.

If the rollback is in response to an audit-log or event-log
incident, see "Common failures → Audit-log corruption" below
before redirecting traffic to the rolled-back image.

## Common failures

### Extension load failure

Failed extension load aborts `Runtime::start` entirely. The
container exits non-zero immediately. There is no partial-load
state file to inspect.

Diagnostic — compact (default) format:

```
ERROR comtrya_server: comtrya-server refused to start error=<text>
```

In `COMTRYA_LOG_FORMAT=json` mode the `error` text is a
separate top-level key (sibling of `message`, `level`,
`target`), not appended to the message:

```json
{
  "timestamp": "...",
  "level": "ERROR",
  "fields": {"message": "comtrya-server refused to start", "error": "<text>"},
  "target": "comtrya_server"
}
```

The error text names the extension and the failure cause
(WASM parse error, manifest schema violation, missing dist
artifact, etc.). Recovery:

1. Read the startup log line.
2. Rebuild or replace the WASM artifact at
   `$COMTRYA_EXTENSION_DIR/<extension-id>/dist/<extension-id>.wasm`.
3. Restart the container.

### Audit-log (or event-log) corruption

Both `metadata/audit.jsonl` and `metadata/events.jsonl` are
append-only JSON-per-line files. Per-line `fsync` is NOT
enabled today; a kernel crash can leave the tail-most line
truncated.

Detection:

```bash
tail -n5 $COMTRYA_DATA_DIR/metadata/audit.jsonl | jq .
```

If the last line is invalid JSON, the tail is corrupt.

Recovery (offline — stop the server first):

1. Snapshot the file before touching it:
   `cp metadata/audit.jsonl metadata/audit.jsonl.bak`.
2. Truncate the bad tail line:
   ```bash
   head -n $(($(wc -l < metadata/audit.jsonl) - 1)) \
       metadata/audit.jsonl > metadata/audit.jsonl.new
   mv metadata/audit.jsonl.new metadata/audit.jsonl
   ```
3. Verify the new tail parses: `tail -n1 ... | jq .`.
4. Restart the server.

The truncated record's corresponding domain action (auth event,
session issuance) is lost. Cross-reference with the load
balancer or upstream identity provider's logs for the original
event window.

When graceful shutdown lands (#9 P1-3, PR #32) and per-write
fsync is added (planned in #11 P2-3), this corruption window
narrows substantially.

### DB lock

There is no real database backend yet. Session, credential, and
rate-limit state lives in `Mutex<HashMap>` per
`crates/server/src/main.rs`. There is no DB lock to
clear. This section will become relevant once #12 P2-1 (real
migration runner against SQLite/Postgres) lands.

### Repository storage corruption

Bare git repos live under `repositories/<workspace>/<repo>.git`.
Standard git recovery (`git fsck`, `git gc --aggressive`)
applies — these are ordinary bare repos.

## Restore from backup

The `comtrya backup` and `comtrya restore` CLI commands exist
(see `crates/cli/src/main.rs`) but currently operate on
`demo_backup_store()` — an in-memory demo store, NOT the live
data dir. Real persistent backup is a deferred sub-PR.

For now, treat `$COMTRYA_DATA_DIR` itself as the backup unit:

1. Stop the server (`docker stop <container>`).
2. Snapshot the data dir:
   ```bash
   tar -czf "backup-$(date -u +%Y%m%dT%H%M%SZ).tar.gz" \
       -C $(dirname $COMTRYA_DATA_DIR) \
       $(basename $COMTRYA_DATA_DIR)
   ```
3. Ship the tarball to durable storage (S3, etc).
4. Restart the server.

Restore is the inverse:

1. Stop the server.
2. Untar over an empty data dir.
3. `chown -R 10001:10001 $COMTRYA_DATA_DIR`.
4. Start the server. Watch `/readyz` for `ready: true`.

For zero-downtime backup, use filesystem-level snapshots (LVM,
ZFS, EBS) rather than `tar` — the JSONL append-only files are
otherwise vulnerable to "torn read" during the tar.

## Key rotation

### OIDC client secret

The OIDC issuer block in `$COMTRYA_CONFIG` declares
`clientSecret`. Rotation:

1. Generate a new secret in the issuer dashboard
   (Google, atproto, etc).
2. Update `clientSecret` in the CUE config.
3. Restart the server (config is read at startup only).
4. Old in-flight OIDC callbacks against the previous secret
   will fail with `invalid_client`. Affected users
   re-authenticate.

For zero-downtime rotation: most issuers allow concurrent
client secrets. Issue the new secret, update the config, and
revoke the old secret after a drain window.

### Operator code

`COMTRYA_OPERATOR_CODE` is an environment-only secret. Rotation
is a container restart with the new value. Audit-log entries
written under the old code are preserved (audit-log records are
identity-of-the-action, not the secret).

### Session secrets

Sessions are opaque random tokens issued at OIDC callback time.
There is no shared session-signing secret to rotate. Session
rotation = wait for `COMTRYA_SESSION_TTL_SECONDS` to expire +
force re-auth via OIDC.

## Capacity signals

### Process-level

- `RUST_LOG=info COMTRYA_LOG_FORMAT=json` — structured JSON
  server logs to stderr. Pipe to your aggregator (Loki,
  Datadog, CloudWatch). Each line carries a timestamp, level,
  module path, message, and any structured fields the
  tracing event author attached.
- Note: PR #28 wired the tracing-subscriber but did NOT add
  per-request `#[instrument]` spans. The structured fields
  `principal`, `extension`, `op` are in the **domain event
  log** (`metadata/events.jsonl`), not in tracing spans.
  Per-request spans are a follow-up sub-PR.
- `metadata/events.jsonl` — tail for domain-event volume,
  per-extension actor counts, error event types. Each line is
  a JSON object with `time`, `type`, `data` (per-event-type
  shape), and a stable per-event `id`.
- `metadata/audit.jsonl` — tail for auth volume, session
  issuance rate, rate-limit kicks.

### HTTP-level

- `/healthz` — liveness probe. Cheap. Probe at 1–5s intervals
  from the load balancer.
- `/readyz` — readiness probe. Deep. Probe at 5–10s intervals.
  Tracks per-subsystem booleans; a `false` in any check pulls
  the pod out of rotation.

### Resource pressure

- **File descriptors**: concurrent `git archive | tar -x`
  materialisations are bounded at 8 (PR #39, `cue_config.rs`'s
  `MATERIALISE_SEMAPHORE`). Reserves 64 FDs at peak. Outside
  that, FD use is per-connection (axum + tokio standard) and
  per-extension Sled storage handles. Default 1024-FD soft
  limit comfortable up to ~700 concurrent connections.
- **Memory**: Wasmtime sandbox memory caps are configured
  per PR #24. Per-extension caps live in the extension
  manifest. Aggregate is bounded by the number of loaded
  extensions × per-extension cap.
- **CPU**: extensions are CPU-bounded by Wasmtime fuel caps
  (PR #24). Long-running extension calls are forcibly
  preempted.

## What's not yet operationally complete

The runbook above describes procedures against the v3 code
state as of this commit. Several near-term sub-PRs will
materially change procedures once merged:

| Sub-item | PR | Procedure impact |
|---|---|---|
| Graceful shutdown | #32 (open) | SIGTERM will drain in-flight requests instead of aborting. The connection-drain caveat in "Deploy → Subsequent rolling deploys" goes away. |
| Durable session storage | #4 P1-4 (blocked) | Sessions survive restart; rolling deploys stop forcing re-auth. |
| Real backup wiring | follow-up (no PR) | `comtrya backup` operates on the live data dir instead of `demo_backup_store()`. |
| Migration runner | #12 P2-1 (blocked) | Rollback section needs a data-dir compatibility matrix. |
| SimpleAuthz on WIT path | #40 (open) | Anonymous principals denied at the WIT `has_permission` boundary too (today blocked only at GraphQL/REST). |
| Per-request tracing spans | follow-up (no PR) | Server log lines gain `principal`/`extension`/`op` structured fields. |

When any of these merge, this runbook needs an update; track
that as part of each sub-PR's acceptance.
