# Comtrya v3 plan

The active migration plan lives in `GOAL.md`. This file is a compact status map
for readers who land here from older v3 planning links.

## Completed cutover

- The Rust host uses generated dispatch for extension-owned WIT operations.
- First-party extensions ship real Component Model artifacts built from
  `cargo-component` crates.
- Host imports cover storage, relations, comments, events, identity, time, ids,
  cross-extension calls, and log.
- Reactors are runtime-registered from extension manifests and WIT exports.
- The frontend is a Vite Vue SPA and loads browser extension assets through the
  SDK registries.
- Git clone/fetch uses the pure-Rust Smart HTTP implementation.
- The old frontend stack, WAT stubs, resolver proof path, substring operation
  matcher, and dead storage bootstrap code have been removed.

## Remaining product work

- Implement Git receive-pack/push or keep the production testbed explicitly
  read-only.
- Expand OCI installation from contract/runtime support into the production
  extension install path.
- Replace the testbed-only operator-code flow with full production OIDC browser
  callback validation.

## Verification

Use the final smoke path:

```sh
./start.sh --reset --oneshot
```

That command builds the server and frontend, checks the v3 structural cutover,
starts the stack, exercises Git/Auth/GraphQL/events/extensions/browser UI, and
proves issue close plus pull-request merge reactor flows through WASM.
