import { z } from "zod";
import type { ToolDefinition } from "./index.js";

const inputSchema = z.object({
  skillId: z.string().min(1),
  companyId: z.string().optional(),
  confirm: z.literal(true),
});

export const skillDeleteTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_skill_delete",
  description: "Delete a company-level skill from the catalog by id. Requires confirm: true.",
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
