import type { LocalWorkspaceCandidate } from "./types.js";

export function parseP4KeyValueOutput(output: string): Record<string, string> {
  const result: Record<string, string> = {};

  for (const rawLine of output.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    const match = /^([^:]+):\s*(.+)$/.exec(line);
    if (!match) continue;

    const key = match[1]!;
    const value = match[2]!;
    result[key.trim()] = value.trim();
  }

  return result;
}

export function parseP4JsonLines<T = Record<string, unknown>>(output: string): T[] {
  return output
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line) as T);
}

export function normalizeNullableString(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function normalizeNullableNumber(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

export function normalizeP4Change(value: unknown): number | "default" | null {
  const normalized = normalizeNullableString(value);
  if (!normalized) return null;
  if (normalized === "default") return "default";

  const parsed = normalizeNullableNumber(normalized);
  if (parsed === null) return null;

  return Math.trunc(parsed);
}

export function isLocalWorkspace(
  workspace: LocalWorkspaceCandidate,
  hostName: string,
  pathExists: (path: string) => boolean
): boolean {
  return workspace.host === hostName || pathExists(workspace.root);
}

export function unixSecondsToIsoString(value: string | null | undefined): string | null {
  if (!value) return null;

  const seconds = Number(value);
  if (!Number.isFinite(seconds)) return null;

  return new Date(seconds * 1000).toISOString();
}
