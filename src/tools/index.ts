import type { z } from "zod";
import type { PaperclipClient } from "../client.js";
import { agentPatchTool } from "./agent-patch.js";
import { agentSetPermissionsTool } from "./agent-set-permissions.js";
import { routinePatchTool } from "./routine-patch.js";
import { routineRunTool } from "./routine-run.js";
import { issuePatchTool } from "./issue-patch.js";
import { issueGetFullTool } from "./issue-get-full.js";
import { skillSyncTool } from "./skill-sync.js";
import { projectCreateTool } from "./project-create.js";
import { projectDeleteTool } from "./project-delete.js";

export interface ToolDefinition<TInput extends z.ZodTypeAny = z.ZodTypeAny> {
  name: string;
  description: string;
  inputSchema: TInput;
  handler: (
    input: z.infer<TInput>,
    ctx: { client: PaperclipClient },
  ) => Promise<unknown>;
}

export const TOOLS: ToolDefinition[] = [
  agentPatchTool,
  agentSetPermissionsTool,
  routinePatchTool,
  routineRunTool,
  issuePatchTool,
  issueGetFullTool,
  skillSyncTool,
  projectCreateTool,
  projectDeleteTool,
];
