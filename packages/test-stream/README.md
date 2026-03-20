# @p4-ts/test-stream

Canonical fixture content for seeding a real Perforce stream during `p4-ts` end-to-end testing.

## Purpose

This package is not a runtime dependency. It exists so `p4-ts` can test against a known stream shape and a stable set of files without embedding fixture data directly into the test code.

## What It Contains

- `stream-manifest.json`: the intended stream identity and workspace assumptions
- `scenario-manifest.json`: named e2e scenarios the future harness can apply or verify
- `seed/`: the canonical depot file tree to populate into the test stream

## Intended E2E Flow

1. Provision or target a dedicated Perforce test server and stream.
2. Seed the stream with the files in `seed/`.
3. Create one or more workspaces against that stream.
4. Run `p4-ts` e2e tests against the seeded workspace state.
5. Apply scenario-specific local changes described in `scenario-manifest.json`.

## Non-goals

- This package does not create or mutate Perforce streams by itself.
- This package does not submit or open files for edit.
- This package only defines the fixture content and scenario metadata for an external e2e harness to use.
