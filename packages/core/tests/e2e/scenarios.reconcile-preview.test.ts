import { afterEach, beforeAll, beforeEach, describe, expect, it } from "bun:test";
import { basename } from "node:path";
import { loadE2EConfig } from "./config.js";
import { loadFixture, validateFixtureMetadata } from "./fixture.js";
import { P4E2EHarness } from "./harness.js";

const state = loadE2EConfig();
const reconcileDescribe = describe.skipIf(!state.enabled);

reconcileDescribe("p4-ts e2e reconcile preview", () => {
  if (!state.enabled) {
    return;
  }

  const fixture = loadFixture(state.config);
  const harness = new P4E2EHarness(state.config, fixture);

  beforeAll(async () => {
    validateFixtureMetadata(state.config, fixture);
    await harness.validateProvisionedFixture();
  });

  beforeEach(async () => {
    await harness.cleanupWorkspace();
  });

  afterEach(async () => {
    await harness.cleanupWorkspace();
    await harness.assertCleanWorkspace();
  });

  it("detects added, edited, and deleted files from local mutations", async () => {
    harness.createReconcilePreviewScenario();

    const preview = await harness.client.previewReconcile({ fileSpec: "..." });

    expect(preview.edited.map((entry) => basename(entry.localFile ?? ""))).toContain("config.json");
    expect(preview.deleted.map((entry) => basename(entry.localFile ?? ""))).toContain("getting-started.md");
    expect(preview.added.map((entry) => basename(entry.localFile ?? ""))).toContain("new-feature.txt");
  });
});
