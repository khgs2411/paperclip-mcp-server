import { z } from "zod";
import type { ToolDefinition } from "./index.js";

const inputSchema = z.object({
  companyId: z.string().optional(),
});

export const labelListTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_label_list",
  description: "List all labels for the company.",
  inputSchema,
  handler: async (input, { client }) => {
    const companyId = client.resolveCompanyId(input.companyId);
    const raw = (await client.request(
      "GET",
      `/api/companies/${encodeURIComponent(companyId)}/labels`,
    )) as Array<Record<string, unknown>>;
    return raw.map((l) => ({ id: l["id"], name: l["name"], color: l["color"] }));
  },
};
