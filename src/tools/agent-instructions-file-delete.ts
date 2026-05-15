import { z } from "zod";
import type { ToolDefinition } from "./index.js";

const inputSchema = z.object({
  agentId: z.string().min(1),
  companyId: z.string().optional(),
  filePath: z.string().min(1),
});

export const agentInstructionsFileDeleteTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_agent_instructions_file_delete",
  description: "Delete a file from an agent's instructions bundle.",
  inputSchema,
  handler: async (input, { client }) => {
    const companyId = client.resolveCompanyId(input.companyId);
    await client.request(
      "DELETE",
      `/api/agents/${encodeURIComponent(input.agentId)}/instructions-bundle/file?companyId=${encodeURIComponent(companyId)}&path=${encodeURIComponent(input.filePath)}`,
    );
    return { filePath: input.filePath, deleted: true };
  },
};
