import { existsSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import type { E2EConfig } from "./config.js";

export interface StreamManifest {
  stream: {
    name: string;
    type: string;
    owner: string;
    description: string;
  };
  workspace: {
    suggestedClientPrefix: string;
    rootFolderName: string;
  };
  seedRoot: string;
}

export interface ScenarioDefinition {
  description: string;
  expectations: string[];
  localChanges?: string[];
}

export type ScenarioManifest = Record<string, ScenarioDefinition>;

export interface FixtureSentinel {
  relativePath: string;
  workspacePath: string;
  seedPath: string;
  expectedContent: string;
}

export interface E2EFixture {
  streamManifest: StreamManifest;
  scenarioManifest: ScenarioManifest;
  seedRoot: string;
  sentinels: FixtureSentinel[];
}

const SENTINEL_PATHS = [
  "src/app/config.json",
  "src/app/index.txt",
  "src/assets/list.txt",
  "docs/guide/getting-started.md"
] as const;

function readJsonFile<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

export function loadFixture(config: E2EConfig): E2EFixture {
  const streamManifestPath = resolve(config.testStreamPackageRoot, "stream-manifest.json");
  const scenarioManifestPath = resolve(config.testStreamPackageRoot, "scenario-manifest.json");
  const streamManifest = readJsonFile<StreamManifest>(streamManifestPath);
  const scenarioManifest = readJsonFile<ScenarioManifest>(scenarioManifestPath);
  const seedRoot = resolve(config.testStreamPackageRoot, streamManifest.seedRoot);

  const sentinels = SENTINEL_PATHS.map((relativePath) => {
    const seedPath = join(seedRoot, relativePath);
    return {
      relativePath,
      workspacePath: join(config.workspaceRoot, relativePath),
      seedPath,
      expectedContent: readFileSync(seedPath, "utf8")
    };
  });

  return {
    streamManifest,
    scenarioManifest,
    seedRoot,
    sentinels
  };
}

export function validateFixtureMetadata(config: E2EConfig, fixture: E2EFixture) {
  const errors: string[] = [];

  if (config.stream !== fixture.streamManifest.stream.name) {
    errors.push(
      `Configured stream "${config.stream}" does not match fixture stream "${fixture.streamManifest.stream.name}".`
    );
  }

  if (config.workspaceRootName !== fixture.streamManifest.workspace.rootFolderName) {
    errors.push(
      `Workspace root folder "${config.workspaceRootName}" does not match expected "${fixture.streamManifest.workspace.rootFolderName}".`
    );
  }

  if (!existsSync(config.workspaceRoot)) {
    errors.push(`Workspace root does not exist: ${config.workspaceRoot}`);
  }

  for (const sentinel of fixture.sentinels) {
    if (!existsSync(sentinel.seedPath)) {
      errors.push(`Missing seed file in fixture package: ${sentinel.seedPath}`);
    }
  }

  if (errors.length > 0) {
    throw new Error(
      [
        "The configured e2e target does not match the expected test-stream fixture.",
        ...errors
      ].join("\n")
    );
  }
}

export function assertProvisionedSentinels(fixture: E2EFixture) {
  const mismatches: string[] = [];

  for (const sentinel of fixture.sentinels) {
    if (!existsSync(sentinel.workspacePath)) {
      mismatches.push(`Missing workspace file: ${sentinel.relativePath}`);
      continue;
    }

    const actualContent = readFileSync(sentinel.workspacePath, "utf8");
    if (actualContent !== sentinel.expectedContent) {
      mismatches.push(`Workspace file does not match seeded content: ${sentinel.relativePath}`);
    }
  }

  if (mismatches.length > 0) {
    throw new Error(
      [
        "The workspace does not match the seeded @p4-ts/test-stream content.",
        ...mismatches
      ].join("\n")
    );
  }
}

export function relativeFixturePath(root: string, target: string): string {
  return relative(root, target).replace(/\\/g, "/");
}
