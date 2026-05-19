# syntax=docker/dockerfile:1.6
#
# comtrya-server container — multi-stage build.
#
# Stage 1 (builder): Rust toolchain on a Go-1.25 base. cuengine's
#   FFI build script requires Go >= 1.25; using golang:1.25-bookworm
#   as the base lets a single image satisfy both deps. Rust is
#   installed via rustup at the pinned RUST_VERSION.
# Stage 2 (runtime): debian:bookworm-slim with the minimum runtime
#   deps the binary genuinely uses: ca-certificates (OIDC HTTPS
#   discovery), git + tar (the kernel shells out to
#   `git archive | tar -x` for CUE workdir materialisation), curl
#   (HEALTHCHECK probe).
#
# Go-version note: CI's actions/setup-go uses `go-version: stable`
# (Go 1.26.x). This image pins golang:1.25-bookworm. Both satisfy
# cuengine's `go 1.25.0` floor; the split is acceptable for v1 but
# bump in lockstep when a Go-feature dependency arrives.

# wasmtime 43.0.2 transitive deps (wasmtime-internal-*) require
# rustc >= 1.91. Edition 2024's floor is 1.85; the wasmtime floor
# is the real constraint here.
ARG RUST_VERSION=1.91
ARG GO_VERSION=1.25-bookworm
ARG DEBIAN_VERSION=bookworm-slim

# --- builder ---------------------------------------------------
FROM golang:${GO_VERSION} AS builder

ARG RUST_VERSION
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       build-essential pkg-config curl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \
       | sh -s -- -y --default-toolchain ${RUST_VERSION} --profile minimal
ENV PATH="/root/.cargo/bin:${PATH}"

WORKDIR /build

# crates/server/src/main.rs uses include_str!("../../../fixtures/demo/conference.json")
# at compile time. Without `COPY fixtures`, the build fails with
# `No such file or directory` inside the macro expansion.
COPY Cargo.toml Cargo.lock ./
COPY crates ./crates
COPY extensions ./extensions
COPY migrations ./migrations
COPY docs ./docs
COPY fixtures ./fixtures

RUN cargo build --release --bin comtrya-server

# --- runtime ---------------------------------------------------
FROM debian:${DEBIAN_VERSION} AS runtime

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       ca-certificates git tar curl \
    && rm -rf /var/lib/apt/lists/*

# Non-root user with a stable UID so host bind-mounts can be
# pre-chowned reproducibly. See docs/CONTAINER.md for operator
# guidance on mounted volume permissions.
RUN useradd --system --uid 10001 --create-home --home-dir /app comtrya \
    && mkdir -p /app/data /app/extensions \
    && chown -R comtrya:comtrya /app

COPY --from=builder /build/target/release/comtrya-server /usr/local/bin/comtrya-server
COPY --from=builder --chown=comtrya:comtrya /build/extensions/first-party /app/extensions/first-party

USER comtrya
WORKDIR /app

ENV COMTRYA_DATA_DIR=/app/data \
    COMTRYA_EXTENSION_DIR=/app/extensions/first-party \
    COMTRYA_LISTEN=0.0.0.0:8080

EXPOSE 8080

# HEALTHCHECK probes the running server's HTTP endpoint rather than
# spawning a second `comtrya-server --check` process. `--check` does
# a full Runtime::start (cold-init Wasmtime + ~15 git subprocesses
# for the demo-repo seed), which is too heavy for an every-30s
# probe. `start-period=30s` leaves room for cold-start before
# Docker counts failures.
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD ["curl", "-sf", "http://localhost:8080/healthz"]

# ENTRYPOINT + empty CMD so `docker run <image>` runs the server
# bare, while `docker run <image> --check` (or any flag) appends to
# the entrypoint. With `CMD ["comtrya-server"]` alone, the second
# form would replace CMD entirely and Docker would try to exec
# `--check` as the binary.
ENTRYPOINT ["comtrya-server"]
CMD []
