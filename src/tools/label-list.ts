import { z } from "zod";
import type { ToolDefinition } from "./index.js";

const inputSchema = z.object({
  companyId: z.string().optional(),
});

interface LabelRaw {
  id: string;
  name: string;
  color?: string;
}

export const labelListTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_label_list",
  description: "List all labels for the company.",
  inputSchema,
  handler: async (input, { client }) => {
    const companyId = client.resolveCompanyId(input.companyId);
    const raw = (await client.request(
      "GET",
      `/api/companies/${encodeURIComponent(companyId)}/labels`,
    )) as LabelRaw[];
    return raw.map((l) => ({ id: l.id, name: l.name, color: l.color }));
  },
};
