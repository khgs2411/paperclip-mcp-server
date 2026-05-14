import type { z } from "zod";
import type { PaperclipClient } from "../client.js";
import { agentPatchTool } from "./agent-patch.js";
import { agentSetPermissionsTool } from "./agent-set-permissions.js";
import { routinePatchTool } from "./routine-patch.js";

export interface ToolDefinition<TInput extends z.ZodTypeAny = z.ZodTypeAny> {
  name: string;
  description: string;
  inputSchema: TInput;
  handler: (
    input: z.infer<TInput>,
    ctx: { client: PaperclipClient },
  ) => Promise<unknown>;
}

export const TOOLS: ToolDefinition[] = [agentPatchTool, agentSetPermissionsTool, routinePatchTool];
