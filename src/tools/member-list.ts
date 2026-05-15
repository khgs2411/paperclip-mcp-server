import { z } from "zod";
import type { ToolDefinition } from "./index.js";

const inputSchema = z.object({
  companyId: z.string().optional(),
});

export const memberListTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_member_list",
  description: "List all members in the company.",
  inputSchema,
  handler: async (input, { client }) => {
    const companyId = client.resolveCompanyId(input.companyId);
    const raw = (await client.request(
      "GET",
      `/api/companies/${encodeURIComponent(companyId)}/members`,
    )) as { members: Array<Record<string, unknown>> };
    return (raw.members ?? []).map((m) => ({
      id: m["id"],
      principalType: m["principalType"],
      principalId: m["principalId"],
      role: m["role"],
    }));
  },
};
