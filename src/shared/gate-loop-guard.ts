import type { PaperclipClient } from "../client.js";
import { ToolInputError } from "./errors.js";

type ActivityEvent = {
  details?: {
    currentReferencedIssues?: ReferencedIssue[];
    addedReferencedIssues?: ReferencedIssue[];
  };
};

type ReferencedIssue = {
  identifier?: string;
  title?: string;
};

const GATE_TITLE = /\b(design|spec|audit|review|plan|re-audit|rework|revise|revision)\b/i;
const DEFAULT_MAX_GATE_REFERENCES = 2;
const DEFAULT_MAX_SAME_GATE_REFERENCES = 2;

export async function assertGateLoopBudget(
  client: PaperclipClient,
  input: { parentIssueId?: string; title: string },
): Promise<void> {
  if (!input.parentIssueId || !GATE_TITLE.test(input.title)) return;

  const activity = await client.request<ActivityEvent[]>(
    "GET",
    `/api/issues/${encodeURIComponent(input.parentIssueId)}/activity?limit=50`,
  );
  const references = latestReferencedIssues(activity);
  const gateReferences = references.filter((issue) => isGateTitle(issue.title ?? ""));
  const sameGateReferences = gateReferences.filter((issue) =>
    gateKind(issue.title ?? "") === gateKind(input.title)
  );

  if (
    gateReferences.length >= DEFAULT_MAX_GATE_REFERENCES ||
    sameGateReferences.length >= DEFAULT_MAX_SAME_GATE_REFERENCES
  ) {
    throw new ToolInputError(
      "title",
      `gate-loop budget exceeded for ${input.parentIssueId}; reuse the existing gate issue or escalate instead of creating another gate child`,
    );
  }
}

function latestReferencedIssues(activity: ActivityEvent[]): ReferencedIssue[] {
  for (const event of activity) {
    const current = event.details?.currentReferencedIssues;
    if (Array.isArray(current)) return current;
  }
  return activity.flatMap((event) => event.details?.addedReferencedIssues ?? []);
}

function isGateTitle(title: string): boolean {
  return GATE_TITLE.test(title);
}

function gateKind(title: string): string {
  const normalized = title.toLowerCase();
  if (/\bdesign|spec\b/.test(normalized)) return "design";
  if (/\baudit|review|re-audit\b/.test(normalized)) return "review";
  if (/\bplan\b/.test(normalized)) return "plan";
  if (/\brework|revise|revision\b/.test(normalized)) return "revision";
  return "gate";
}
