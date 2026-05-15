import { z } from "zod";
import type { ToolDefinition } from "./index.js";

const inputSchema = z.object({
  skillId: z.string().min(1).describe("ID of the company-level skill to delete."),
  companyId: z.string().optional().describe("Company ID override; defaults to PAPERCLIP_COMPANY_ID."),
  confirm: z.literal(true).describe("Must be true to confirm the destructive delete operation."),
});

export const skillDeleteTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_skill_delete",
  description:
    "Delete a company-level skill by ID. Requires confirm: true. This removes the skill from the company skill catalog; agents that had this skill assigned will lose access to it.",
  inputSchema,
  handler: async (input, { client }) => {
    const companyId = client.resolveCompanyId(input.companyId);
    await client.request(
      "DELETE",
      `/api/companies/${encodeURIComponent(companyId)}/skills/${encodeURIComponent(input.skillId)}`,
    );
    return { deleted: true, id: input.skillId };
  },
};
