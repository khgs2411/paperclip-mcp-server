import { z } from "zod";
import type { ToolDefinition } from "./index.js";

const inputSchema = z.object({
  companyId: z.string().optional().describe("Company ID override; defaults to PAPERCLIP_COMPANY_ID."),
});

interface SkillRaw {
  id: string;
  name: string;
  description?: string;
}

export const skillListTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_skill_list",
  description:
    "List all skills installed at the company level. These are company-wide skills available for agents to use, distinct from per-agent skill snapshots (use paperclip_agent_skills_list for those).",
  inputSchema,
  handler: async (input, { client }) => {
    const companyId = client.resolveCompanyId(input.companyId);
    const raw = (await client.request(
      "GET",
      `/api/companies/${encodeURIComponent(companyId)}/skills`,
    )) as SkillRaw[];
    return raw.map((s) => ({ id: s.id, name: s.name, description: s.description }));
  },
};
