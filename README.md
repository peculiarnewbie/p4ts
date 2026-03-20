# p4-ts

Typed TypeScript helpers for working with the Perforce `p4` CLI.

## Scope

`p4-ts` is intended to be a read-only plus sync foundation for custom P4 tooling.

In scope:
- Inspect current P4 environment and workspace state
- List local or relevant workspaces
- Inspect pending changelists and opened files
- Preview reconcile and sync operations
- Perform `sync` to update the local workspace
- Read file metadata and depot/local path mappings

Out of scope:
- `submit`
- `shelve` or `unshelve`
- `edit`, `add`, `delete`, or other checkout/open-for-edit flows
- `revert`, `lock`, `unlock`, `move`, `integrate`, or `resolve`
- Changelist creation or mutation
- Client, stream, or other spec mutation
- Server administration or any workflow that mutates server-side state

## Packages

| Package | Description | Status |
|---------|-------------|--------|
| [`packages/core`](./packages/core) | Runtime library for running and parsing `p4` commands | Available |
| [`packages/test-stream`](./packages/test-stream) | Canonical fixture stream content for future end-to-end testing | Available |

## Development

```bash
bun install
bun run typecheck
bun run test
bun run build
```
