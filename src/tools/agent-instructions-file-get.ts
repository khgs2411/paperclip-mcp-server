import { z } from "zod";
import type { ToolDefinition } from "./index.js";

const inputSchema = z.object({
  agentId: z.string().min(1),
  companyId: z.string().optional(),
  filePath: z.string().min(1),
});

export const agentInstructionsFileGetTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_agent_instructions_file_get",
  description: "Fetch a single file from an agent's instructions bundle by path.",
  inputSchema,
  handler: async (input, { client }) => {
    const companyId = client.resolveCompanyId(input.companyId);
    const raw = (await client.request(
      "GET",
      `/api/agents/${encodeURIComponent(input.agentId)}/instructions-bundle/file?companyId=${encodeURIComponent(companyId)}&filePath=${encodeURIComponent(input.filePath)}`,
    )) as Record<string, unknown>;

    return {
      filePath: raw["filePath"] ?? input.filePath,
      content: raw["content"] as string,
    };
  },
};
