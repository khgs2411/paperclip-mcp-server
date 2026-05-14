import { ToolInputError } from "./errors.js";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TOP_RE = /^[A-Z]{2,5}-\d+$/;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

export function isTopIdentifier(value: string): boolean {
  return TOP_RE.test(value);
}

export function normalizeIssueRef(value: string): string {
  if (isUuid(value) || isTopIdentifier(value)) return value;
  throw new ToolInputError("issueIdOrIdentifier", "must be a UUID or PREFIX-N identifier");
}
