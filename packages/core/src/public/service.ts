import { Effect } from "effect";
import { P4Client } from "./client.js";
import type { P4ClientOptions, P4Service } from "./types.js";

export function createP4Service(options: P4ClientOptions = {}): P4Service {
  const client = new P4Client(options);

  return {
    getP4Environment: (refresh = false) =>
      Effect.promise(() => client.getEnvironment({ refresh })),
    listP4Workspaces: (refresh = false) =>
      Effect.promise(() => client.listWorkspaces({ refresh })),
    listPendingChangelists: (serviceOptions) =>
      Effect.promise(() => client.listPendingChangelists(serviceOptions)),
    getOpenedFiles: (serviceOptions) =>
      Effect.promise(() => client.getOpenedFiles(serviceOptions)),
    getChangelistFiles: (change, serviceOptions) =>
      Effect.promise(() => client.getChangelistFiles(change, serviceOptions)),
    previewReconcile: (serviceOptions) =>
      Effect.promise(() => client.previewReconcile(serviceOptions)),
    previewSync: (serviceOptions) =>
      Effect.promise(() => client.previewSync(serviceOptions))
  };
}

const defaultService = createP4Service();

export function getP4Environment(refresh = false) {
  return defaultService.getP4Environment(refresh);
}

export function listP4Workspaces(refresh = false) {
  return defaultService.listP4Workspaces(refresh);
}

export function listPendingChangelists(options?: Parameters<P4Service["listPendingChangelists"]>[0]) {
  return defaultService.listPendingChangelists(options);
}

export function getOpenedFiles(options?: Parameters<P4Service["getOpenedFiles"]>[0]) {
  return defaultService.getOpenedFiles(options);
}

export function getChangelistFiles(
  change: Parameters<P4Service["getChangelistFiles"]>[0],
  options?: Parameters<P4Service["getChangelistFiles"]>[1]
) {
  return defaultService.getChangelistFiles(change, options);
}

export function previewReconcile(options?: Parameters<P4Service["previewReconcile"]>[0]) {
  return defaultService.previewReconcile(options);
}

export function previewSync(options?: Parameters<P4Service["previewSync"]>[0]) {
  return defaultService.previewSync(options);
}
