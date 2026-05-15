import { z } from "zod";
import type { ToolDefinition } from "./index.js";

const inputSchema = z.object({
  companyId: z.string().optional(),
});

export const projectListTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_project_list",
  description: "List all projects in the company.",
  inputSchema,
  handler: async (input, { client }) => {
    const companyId = client.resolveCompanyId(input.companyId);
    const raw = (await client.request(
      "GET",
      `/api/companies/${encodeURIComponent(companyId)}/projects`,
    )) as Array<Record<string, unknown>>;
    return raw.map((p) => ({ id: p["id"], name: p["name"], status: p["status"], urlKey: p["urlKey"] }));
  },
};
