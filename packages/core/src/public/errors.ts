import type { P4CommandResult } from "./types.js";

/**
 * Structured error categories for Perforce CLI failures.
 *
 * - `"connection"` – DNS resolution, TCP connect, or server unavailable
 * - `"authentication"` – login required, ticket expired, password invalid
 * - `"server_config"` – missing or invalid P4PORT / SSL config
 * - `"client"` – unknown or invalid workspace / client spec
 * - `"command"` – any other non-zero exit (the default bucket)
 */
export type P4ErrorCategory =
  | "connection"
  | "authentication"
  | "server_config"
  | "client"
  | "command";

// Order matters: patterns are evaluated top-down; first match wins.
const categoryPatterns: readonly { category: P4ErrorCategory; pattern: RegExp }[] = [
  // Connection / DNS / server unreachable
  { category: "connection", pattern: /connect to server failed/i },
  { category: "connection", pattern: /tcp connect to .+ failed/i },
  { category: "connection", pattern: /no such host/i },
  { category: "connection", pattern: /connection refused/i },
  { category: "connection", pattern: /network is unreachable/i },
  { category: "connection", pattern: /timed? ?out/i },

  // Server / port configuration
  { category: "server_config", pattern: /check \$?P4PORT/i },
  { category: "server_config", pattern: /P4PORT invalid/i },
  { category: "server_config", pattern: /ssl.*init.*fail/i },

  // Authentication / login
  { category: "authentication", pattern: /your session has expired/i },
  { category: "authentication", pattern: /password.*invalid/i },
  { category: "authentication", pattern: /perforce password.*\(P4PASSWD\)/i },
  { category: "authentication", pattern: /login.*required/i },
  { category: "authentication", pattern: /ticket.*expired/i },

  // Client / workspace
  { category: "client", pattern: /unknown.*client/i },
  { category: "client", pattern: /client '.*' unknown/i },
  { category: "client", pattern: /has not been set/i },
];

/**
 * Classify a Perforce command failure from its combined stderr + stdout text.
 * Returns `"command"` when no specific pattern matches.
 */
export function classifyP4Error(text: string): P4ErrorCategory {
  for (const { category, pattern } of categoryPatterns) {
    if (pattern.test(text)) {
      return category;
    }
  }
  return "command";
}

export class P4CommandError extends Error {
  readonly result: P4CommandResult;

  /**
   * Structured category of the failure – callers can `switch` on this
   * instead of parsing the error message string.
   */
  readonly category: P4ErrorCategory;

  constructor(message: string, result: P4CommandResult, category?: P4ErrorCategory) {
    super(message);
    this.name = "P4CommandError";
    this.result = result;
    this.category = category ?? classifyP4Error(message);
  }
}
