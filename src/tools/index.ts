import type { z } from "zod";
import type { PaperclipClient } from "../client.js";
import { agentPatchTool } from "./agent-patch.js";
import { agentSetPermissionsTool } from "./agent-set-permissions.js";
import { routinePatchTool } from "./routine-patch.js";
import { routineRunTool } from "./routine-run.js";
import { issuePatchTool } from "./issue-patch.js";
import { issueGetFullTool } from "./issue-get-full.js";
import { issueInteractionsListTool } from "./issue-interactions-list.js";
import { issueInteractionResolveTool } from "./issue-interaction-resolve.js";
import { inboxSummaryTool } from "./inbox-summary.js";
import { skillSyncTool } from "./skill-sync.js";
import { projectCreateTool } from "./project-create.js";
import { projectDeleteTool } from "./project-delete.js";
import { memberSetGrantsTool } from "./member-set-grants.js";
import { boardChannelAppendTool } from "./board-channel-append.js";

export interface ToolDefinition<TInput extends z.ZodTypeAny = z.ZodTypeAny> {
  name: string;
  description: string;
  inputSchema: TInput;
  handler: (
    input: z.infer<TInput>,
    ctx: { client: PaperclipClient },
  ) => Promise<unknown>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const TOOLS: ToolDefinition<any>[] = [
  agentPatchTool,
  agentSetPermissionsTool,
  routinePatchTool,
  routineRunTool,
  issuePatchTool,
  issueGetFullTool,
  issueInteractionsListTool,
  issueInteractionResolveTool,
  inboxSummaryTool,
  skillSyncTool,
  projectCreateTool,
  projectDeleteTool,
  memberSetGrantsTool,
  boardChannelAppendTool,
];
