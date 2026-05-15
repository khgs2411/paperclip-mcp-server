import { z } from "zod";
import type { ToolDefinition } from "./index.js";

const inputSchema = z.object({
  companyId: z.string().optional(),
});

interface MemberRaw {
  id: string;
  principalType: string;
  principalId: string;
  role?: string;
}

interface MembersResponse {
  members: MemberRaw[];
}

export const memberListTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_member_list",
  description: "List all members of the company.",
  inputSchema,
  handler: async (input, { client }) => {
    const companyId = client.resolveCompanyId(input.companyId);
    const raw = (await client.request(
      "GET",
      `/api/companies/${encodeURIComponent(companyId)}/members`,
    )) as MembersResponse;
    return raw.members.map((m) => ({
      id: m.id,
      principalType: m.principalType,
      principalId: m.principalId,
      role: m.role,
    }));
  },
};
