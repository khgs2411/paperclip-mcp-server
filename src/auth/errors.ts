import type { DeniedDecision } from "./access.js";

export class McpAuthorizationError extends Error {
  readonly payload: DeniedDecision;

  constructor(payload: DeniedDecision) {
    super(payload.reason);
    this.payload = payload;
  }
}
