export type P4JsonValue =
  | string
  | number
  | boolean
  | null
  | P4JsonValue[]
  | { [key: string]: P4JsonValue };

export interface P4CommandResult {
  command: string;
  args: string[];
  stdout: string;
  stderr: string;
  exitCode: number;
}

export interface P4CommandOptions {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  input?: string;
  allowNonZeroExit?: boolean;
}

export type P4CommandExecutor = (
  command: string,
  args: string[],
  options: P4CommandOptions
) => Promise<P4CommandResult>;

export interface P4ClientOptions {
  executable?: string;
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  hostName?: string;
  pathExists?: (path: string) => boolean;
  executor?: P4CommandExecutor;
}

export interface P4EnvironmentSummary {
  hostName: string;
  p4Port: string | null;
  p4User: string | null;
  p4Client: string | null;
}

export interface P4JsonWorkspace {
  client: string;
  Stream?: string;
  Root: string;
  Host?: string;
  Owner: string;
  Access?: string;
  Update?: string;
}

export interface LocalWorkspaceCandidate {
  root: string;
  host: string | null;
}

export interface P4WorkspaceSummary {
  client: string;
  stream: string | null;
  root: string;
  host: string | null;
  owner: string;
  accessedAt: string | null;
  accessedAtIso: string | null;
  isCurrentClient: boolean;
}

export interface RunTaggedJsonOptions extends P4CommandOptions {
  prefixTaggedJsonFlags?: boolean;
}

export interface ListWorkspacesOptions {
  user?: string;
  hostName?: string;
  includeNonLocal?: boolean;
  refresh?: boolean;
}

export interface ListPendingChangelistsOptions {
  user?: string;
  client?: string | null;
  includeDefault?: boolean;
  status?: "pending";
  refresh?: boolean;
}

export interface P4PendingChangelistSummary {
  change: number | "default";
  client: string | null;
  user: string | null;
  status: "pending";
  description: string | null;
  createdAt: string | null;
  createdAtIso: string | null;
  isDefault: boolean;
}

export interface GetOpenedFilesOptions {
  user?: string;
  client?: string | null;
  change?: number | "default";
  fileSpec?: string | string[];
  refresh?: boolean;
}

export interface P4OpenedFileSummary {
  depotFile: string | null;
  clientFile: string | null;
  localFile: string | null;
  action: string;
  type: string | null;
  changelist: number | "default";
  changelistDescription: string | null;
  user: string | null;
  client: string | null;
  revision: number | null;
  isDefaultChangelist: boolean;
}

export interface PreviewReconcileOptions {
  fileSpec?: string | string[];
  changelist?: number | "default";
  useModTime?: boolean;
  includeWritable?: boolean;
  refresh?: boolean;
}

export interface P4ReconcileCandidate {
  depotFile: string | null;
  clientFile: string | null;
  localFile: string | null;
  action: "add" | "edit" | "delete";
  type: string | null;
  changelist: number | "default" | null;
}

export interface P4ReconcilePreviewResult {
  added: P4ReconcileCandidate[];
  edited: P4ReconcileCandidate[];
  deleted: P4ReconcileCandidate[];
}

export interface PreviewSyncOptions {
  fileSpec?: string | string[];
  force?: boolean;
  keepWorkspaceFiles?: boolean;
  maxFiles?: number | null;
  refresh?: boolean;
}

export interface P4SyncPreviewItem {
  depotFile: string | null;
  clientFile: string | null;
  localFile: string | null;
  revision: number | null;
  action: string | null;
  fileSize: number | null;
}

export interface P4SyncPreviewResult {
  items: P4SyncPreviewItem[];
  totalCount: number;
}

export interface P4ListWorkspaceResult {
  environment: P4EnvironmentSummary;
  workspaces: P4WorkspaceSummary[];
}

export interface P4Service {
  getP4Environment: (refresh?: boolean) => import("effect").Effect.Effect<P4EnvironmentSummary, Error>;
  listP4Workspaces: (refresh?: boolean) => import("effect").Effect.Effect<P4WorkspaceSummary[], Error>;
  listPendingChangelists: (
    options?: ListPendingChangelistsOptions
  ) => import("effect").Effect.Effect<P4PendingChangelistSummary[], Error>;
  getOpenedFiles: (
    options?: GetOpenedFilesOptions
  ) => import("effect").Effect.Effect<P4OpenedFileSummary[], Error>;
  getChangelistFiles: (
    change: number | "default",
    options?: Omit<GetOpenedFilesOptions, "change">
  ) => import("effect").Effect.Effect<P4OpenedFileSummary[], Error>;
  previewReconcile: (
    options?: PreviewReconcileOptions
  ) => import("effect").Effect.Effect<P4ReconcilePreviewResult, Error>;
  previewSync: (
    options?: PreviewSyncOptions
  ) => import("effect").Effect.Effect<P4SyncPreviewResult, Error>;
}
