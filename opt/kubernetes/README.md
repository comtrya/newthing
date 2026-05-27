# Kubernetes deployment (Kustomize)

Manifests to run `comtrya-server` on Kubernetes.

```
opt/kubernetes/
  base/                     # namespace, SA, config, secret, PVC, deployment, service
  overlays/
    production/             # base + TLS Ingress + real config-repo URL
```

## Quick start

```sh
# Build + push the server image (root Dockerfile) and pin it:
#   docker build -t registry.example.com/comtrya-server:<tag> .
#   docker push registry.example.com/comtrya-server:<tag>

# Render to review:
kubectl kustomize opt/kubernetes/overlays/production

# Apply:
kubectl apply -k opt/kubernetes/overlays/production
```

Before applying, set the placeholders:

- **Image** — `images:` in `overlays/production/kustomization.yaml` (pin a digest).
- **Config repo** — `COMTRYA_CONFIG_REPO_URL` / `_REF` (overlay patch or
  `base/configmap.yaml`). This is **required**: the server clones it on startup
  and crash-loops if it can't (pure GitOps — OIDC, admins, repositories, labels,
  and extensions all come from this CUE repo).
- **Secrets** — `base/secret.yaml` is a template with placeholders. Replace the
  values, or delete the file from `base/kustomization.yaml` and supply a Secret
  named `comtrya-server-secrets` via your secret manager (External Secrets,
  Sealed Secrets, SOPS, Vault). Keys: `COMTRYA_OPERATOR_CODE` (break-glass admin,
  ≥12 chars in production) and, for a private config repo,
  `COMTRYA_CONFIG_REPO_TOKEN` (or `COMTRYA_CONFIG_REPO_SSH_KEY` +
  `COMTRYA_CONFIG_REPO_SSH_PASSPHRASE`).
- **Ingress** — host, `ingressClassName`, and TLS secret in
  `overlays/production/ingress.yaml`.

## Design notes

- **Single replica, ReadWriteOnce, Recreate.** State is SQLite plus bare git
  repositories and extension storage on one PVC (`/app/data`); the server is not
  horizontally scalable. Don't raise `replicas`.
- **TLS terminates at the Ingress.** The pod runs with
  `COMTRYA_TLS_TERMINATED=true` and serves plain HTTP on 8080.
- **Hardened pod**: non-root (uid 10001), `fsGroup` 10001, read-only root
  filesystem with a writable `emptyDir` at `/tmp` (CUE worktree materialisation)
  and the PVC at `/app/data`; all capabilities dropped; `RuntimeDefault` seccomp.
- **Probes**: startup + liveness on `/healthz`, readiness on `/readyz`.
- **Egress**: the pod must reach the config repo host and the OIDC issuer(s)
  declared in the CUE config (add a NetworkPolicy if your cluster default-denies).
- **Frontend**: the SPA is built and served separately (no frontend image yet).
  The production Ingress routes everything to the server, which covers the API,
  git, auth, and extension surfaces; extend it to serve the SPA once it has a
  Service. See `docs/CONTAINER.md` / `docs/RUNBOOK.md`.
