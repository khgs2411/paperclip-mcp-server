import { z } from "zod";
import type { ToolDefinition } from "./index.js";

const inputSchema = z.object({
  skillId: z.string().min(1).describe("ID of the company-level skill to retrieve."),
  companyId: z.string().optional().describe("Company ID override; defaults to PAPERCLIP_COMPANY_ID."),
});

interface SkillRaw {
  id: string;
  name: string;
  description?: string;
}

export const skillGetTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_skill_get",
  description:
    "Get a company-level skill by ID. Returns the skill's metadata. Use paperclip_agent_skills_list to inspect which skills are assigned to a specific agent.",
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
