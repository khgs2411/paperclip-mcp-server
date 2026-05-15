import { z } from "zod";
import type { ToolDefinition } from "./index.js";

const inputSchema = z
  .object({
    agentId: z.string().min(1),
    companyId: z.string().optional(),
    agentsContent: z.string().optional(),
    heartbeatContent: z.string().optional(),
    soulContent: z.string().optional(),
    toolsContent: z.string().optional(),
  })
  .refine(
    (v) =>
      v.agentsContent !== undefined ||
      v.heartbeatContent !== undefined ||
      v.soulContent !== undefined ||
      v.toolsContent !== undefined,
    { message: "at least one content field must be provided", path: ["_patch"] },
  );

export const agentInstructionsPatchTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_agent_instructions_patch",
  description:
    "Patch one or more sections of an agent's instructions bundle. At least one content field must be provided.",
  inputSchema,
  handler: async (input, { client }) => {
    const companyId = client.resolveCompanyId(input.companyId);
    const { agentId, companyId: _ignored, ...body } = input;
    return client.request(
      "PATCH",
      `/api/agents/${encodeURIComponent(agentId)}/instructions-bundle?companyId=${encodeURIComponent(companyId)}`,
      body,
    );
  },
};
