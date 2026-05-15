import { z } from "zod";
import type { ToolDefinition } from "./index.js";

const inputSchema = z.object({
  companyId: z.string().optional(),
});

interface SkillRaw {
  id: string;
  name: string;
  description?: string;
}

export const skillListTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_skill_list",
  description:
    "List all company-level skills in the catalog. Distinct from paperclip_agent_skills_list, which returns the skill assignment snapshot for a specific agent.",
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
