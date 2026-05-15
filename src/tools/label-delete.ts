import { z } from "zod";
import type { ToolDefinition } from "./index.js";

const inputSchema = z.object({
  labelId: z.string().min(1),
  companyId: z.string().optional(),
  confirm: z.literal(true),
});

export const labelDeleteTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_label_delete",
  description: "Delete a label by id. Requires confirm: true.",
  inputSchema,
  handler: async (input, { client }) => {
    const companyId = client.resolveCompanyId(input.companyId);
    await client.request(
      "DELETE",
      `/api/labels/${encodeURIComponent(input.labelId)}?companyId=${encodeURIComponent(companyId)}`,
    );
    return { deleted: true, id: input.labelId };
  },
};
