# p4-ts

Typed TypeScript helpers for the Perforce `p4` CLI.

- Run `p4` with a testable client abstraction
- Parse classic tagged output and newline-delimited JSON
- Query current Perforce environment with sensible fallbacks
- List and filter workspaces that are relevant to the local machine
- Provide read-only plus preview-sync helpers for custom P4 tooling
- Optional [Effect](https://effect.website)-based service API

## Scope

This package is intended for read-only P4 workflows plus `sync`.

In scope:
- Inspect current environment and workspace state
- List relevant workspaces for the current machine
- Inspect pending changelists and opened files
- Preview reconcile and sync operations
- Read file metadata and depot/local path mappings

Out of scope:
- `submit`
- `shelve` or `unshelve`
- `edit`, `add`, `delete`, or other checkout/open-for-edit commands
- `revert`, `lock`, `unlock`, `move`, `integrate`, or `resolve`
- Changelist creation or mutation
- Client or stream spec mutation
- Server administration or other server-mutating workflows

Planned next:
- Actual `sync()` support within the same non-mutating-server boundary

## Install

```bash
npm install p4-ts
```

## Quick Start

```ts
import { P4Client } from "p4-ts";

const p4 = new P4Client();

const environment = await p4.getEnvironment();
const workspaces = await p4.listWorkspaces();
const pending = await p4.listPendingChangelists();
const opened = await p4.getOpenedFiles({ change: "default" });
const reconcilePreview = await p4.previewReconcile({
  fileSpec: "C:/work/project/..."
});
const syncPreview = await p4.previewSync({
  fileSpec: "//Project/main/..."
});
```

## API

### `new P4Client(options?)`

Creates a reusable wrapper around the `p4` executable.

```ts
const p4 = new P4Client({
  executable: "p4",
  cwd: "C:/work/project",
});
```

### `run(args, options?)`

Run a raw `p4` command.

```ts
const result = await p4.run(["info"]);
console.log(result.stdout);
```

### `runTaggedJson(args, options?)`

Run a command with `-Mj -z tag` and parse newline-delimited JSON output.

```ts
const clients = await p4.runTaggedJson(["clients", "-u", "builduser"]);
```

### `getEnvironment(options?)`

Resolve common environment values from `p4 info` plus process env fallbacks.

```ts
const env = await p4.getEnvironment();
// { hostName, p4Port, p4User, p4Client }
```

### `listWorkspaces(options?)`

List user workspaces and, by default, keep only workspaces that appear local to the current machine.

```ts
const workspaces = await p4.listWorkspaces();
```

### `listPendingChangelists(options?)`

List pending changelists for a user or client without mutating server-side state.

```ts
const pending = await p4.listPendingChangelists();
```

### `getOpenedFiles(options?)`

List opened files as a flat typed array. Callers can group by changelist in the UI.

```ts
const opened = await p4.getOpenedFiles({ change: "default" });
```

### `getChangelistFiles(change, options?)`

Shortcut for querying the files in a specific changelist.

```ts
const files = await p4.getChangelistFiles(12345);
```

### `previewReconcile(options?)`

Preview reconcile results using `p4 reconcile -n`.

```ts
const preview = await p4.previewReconcile({
  fileSpec: "C:/work/project/..."
});
```

### `previewSync(options?)`

Preview sync results using `p4 sync -n`.

```ts
const preview = await p4.previewSync({
  fileSpec: "//Project/main/..."
});
```

## Effect Service API

For [Effect](https://effect.website)-based codebases, `createP4Service` returns the same operations as `P4Client` wrapped in `Effect`:

```ts
import { Effect } from "effect";
import { createP4Service } from "p4-ts";

const p4 = createP4Service();

const environment = await Effect.runPromise(p4.getP4Environment());
const workspaces = await Effect.runPromise(p4.listP4Workspaces());
const opened = await Effect.runPromise(p4.getOpenedFiles({ change: "default" }));
const reconcilePreview = await Effect.runPromise(p4.previewReconcile());
```

## Development

```bash
bun install
bun run typecheck
bun run test
bun run test:e2e
bun run build
```

## End-to-End Tests

The e2e suite targets a pre-provisioned Perforce fixture workspace seeded from `@p4-ts/test-stream`.

- The suite is manual opt-in and skipped unless `P4_TS_E2E=1`.
- The harness validates the configured fixture target; it does not provision streams, clients, or submit seed content.
- Scenario setup may use local `p4 edit/add/delete`, numbered changelists, `sync`, and `revert`, with cleanup returning the workspace to baseline.

Required env vars:

```bash
P4_TS_E2E=1
P4_TS_E2E_WORKSPACE_ROOT=/absolute/path/to/workspace
P4_TS_E2E_CLIENT=p4ts_e2e_main
P4_TS_E2E_STREAM=//p4ts/main
```

Optional env vars:

```bash
P4_TS_E2E_USER=p4ts-e2e
P4_TS_E2E_HOST=build-host
P4_TS_E2E_P4PORT=ssl:perforce.example.com:1666
P4_TS_E2E_P4CONFIG=.p4config
P4_TS_E2E_ALLOW_OPENED_SCENARIOS=1
P4_TS_E2E_ALLOW_SYNC_PREVIEW=1
```

External prerequisite checklist:

1. Create a dedicated stream matching `packages/test-stream/stream-manifest.json`.
2. Create a dedicated client/workspace for that stream.
3. Seed and submit the contents of `packages/test-stream/seed` outside the test harness.
4. Optionally prepare a behind-head workspace state for sync-preview coverage.
