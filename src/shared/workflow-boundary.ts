import { ToolInputError } from "./errors.js";

const REMOVED_LOCAL_CHECKOUT = "/Users/liadgoren/Repositories/paperclip-upstream";
const FORBIDDEN_REPOSITORY_RE = /\bpaperclipai\/paperclip(?:\.git)?\b/i;
const EDITABLE_TARGET_RE =
  /\b(branch|checkout|clone|commit|edit|force-push|implement|merge|open\s+(?:a\s+)?pr|pr\s+against|push|rebase|work\s+against|write)\b/i;
const SOURCE_ONLY_RE = /\b(source|reference|read-only|package|skill|from)\b/i;
const MERGE_CLOSEOUT_RE = /\b(pr\s+)?merged\b|\bmerge(?:d| complete| closeout)\b/i;
const CLOSE_OR_DONE_RE = /\b(close|closed|closing|done|complete|completed)\b/i;
const GIT_EXPERT_CLEANUP_RE = /\bgit expert\b/i;
const CLEANUP_EVIDENCE_RE = /\b(cleanup|branch deleted|remote branch|branch state|post-merge)\b/i;
const TERMINAL_BLOCKER_RE =
  /\b(all|every)\s+(?:direct\s+)?(?:blockers?|children)\s+(?:are|is|reached|resolved|completed)\s+(?:terminal|done|cancelled|canceled|complete|completed)\b/i;

export type WorkflowBoundaryFields = Record<string, unknown>;

function collectText(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(collectText);
  if (value && typeof value === "object") {
    return Object.values(value as Record<string, unknown>).flatMap(collectText);
  }
  return [];
}

function hasForbiddenEditableRepositoryReference(text: string): boolean {
  if (!FORBIDDEN_REPOSITORY_RE.test(text)) return false;
  if (!EDITABLE_TARGET_RE.test(text)) return false;
  return !SOURCE_ONLY_RE.test(text);
}

function hasUnprovenMergeCloseout(text: string): boolean {
  if (!MERGE_CLOSEOUT_RE.test(text) || !CLOSE_OR_DONE_RE.test(text)) return false;
  return !(GIT_EXPERT_CLEANUP_RE.test(text) && CLEANUP_EVIDENCE_RE.test(text));
}

function hasStaleTerminalBlockerInstruction(fields: WorkflowBoundaryFields, text: string): boolean {
  if (!TERMINAL_BLOCKER_RE.test(text)) return false;
  if (fields["status"] === "blocked") return true;
  return /\bkeep(?:ing)?\s+(?:this\s+)?blocked\b|\bremain(?:s|ing)?\s+blocked\b|\bstill\s+blocked\b/i.test(text);
}

export function assertWorkflowBoundaryText(input: {
  toolName: string;
  fields: WorkflowBoundaryFields;
}): void {
  const text = collectText(input.fields).join("\n");
  if (!text.trim()) return;

  if (text.includes(REMOVED_LOCAL_CHECKOUT)) {
    throw new ToolInputError(
      input.toolName,
      `removed local checkout reference is not allowed: ${REMOVED_LOCAL_CHECKOUT}`,
    );
  }

  if (hasForbiddenEditableRepositoryReference(text)) {
    throw new ToolInputError(
      input.toolName,
      "editable work against paperclipai/paperclip or paperclipai/paperclip.git is not allowed",
    );
  }

  if (hasUnprovenMergeCloseout(text)) {
    throw new ToolInputError(
      input.toolName,
      "merge closeout requires Git Expert cleanup evidence before the issue is closed",
    );
  }

  if (hasStaleTerminalBlockerInstruction(input.fields, text)) {
    throw new ToolInputError(
      input.toolName,
      "terminal blockers must be reconciled instead of leaving the issue blocked",
    );
  }
}
