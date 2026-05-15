import { z } from "zod";
import type { ToolDefinition } from "./index.js";

const inputSchema = z.object({
  companyId: z.string().optional(),
  name: z.string().min(1),
  color: z.string().optional(),
});

interface LabelRaw {
  id: string;
  name: string;
  color?: string;
}

export const labelCreateTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_label_create",
  description: "Create a new label for the company.",
  inputSchema,
  handler: async (input, { client }) => {
    const companyId = client.resolveCompanyId(input.companyId);
    const body: Record<string, unknown> = { name: input.name };
    if (input.color !== undefined) body["color"] = input.color;
    const raw = (await client.request(
      "POST",
      `/api/companies/${encodeURIComponent(companyId)}/labels`,
      body,
    )) as LabelRaw;
    return { id: raw.id, name: raw.name, color: raw.color };
  },
};
