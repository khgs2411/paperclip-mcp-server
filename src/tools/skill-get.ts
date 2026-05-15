import { z } from "zod";
import type { ToolDefinition } from "./index.js";

const inputSchema = z.object({
  skillId: z.string().min(1),
  companyId: z.string().optional(),
});

interface SkillRaw {
  id: string;
  name: string;
  description?: string;
}

export const skillGetTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_skill_get",
  description:
    "Get a single company-level skill by id from the catalog. Distinct from paperclip_agent_skills_list, which returns the skill assignment snapshot for a specific agent.",
  inputSchema,
  handler: async (input, { client }) => {
    const companyId = client.resolveCompanyId(input.companyId);
    const raw = (await client.request(
      "GET",
      `/api/companies/${encodeURIComponent(companyId)}/skills/${encodeURIComponent(input.skillId)}`,
    )) as SkillRaw;
    return { id: raw.id, name: raw.name, description: raw.description };
  },
};
