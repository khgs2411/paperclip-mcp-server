import { z } from "zod";
import type { ToolDefinition } from "./index.js";

const inputSchema = z.object({
  agentId: z.string().min(1),
  companyId: z.string().optional(),
  filePath: z.string().min(1),
  content: z.string(),
});

export const agentInstructionsFilePutTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_agent_instructions_file_put",
  description: "Write a file into an agent's instructions bundle.",
  inputSchema,
  handler: async (input, { client }) => {
    const companyId = client.resolveCompanyId(input.companyId);
    await client.request(
      "PUT",
      `/api/agents/${encodeURIComponent(input.agentId)}/instructions-bundle/file?companyId=${encodeURIComponent(companyId)}`,
      { path: input.filePath, content: input.content },
    );
    return { filePath: input.filePath, written: true };
  },
};
