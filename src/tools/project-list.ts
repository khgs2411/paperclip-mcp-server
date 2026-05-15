import { z } from "zod";
import type { ToolDefinition } from "./index.js";

const inputSchema = z.object({
  companyId: z.string().optional(),
});

interface ProjectRaw {
  id: string;
  name: string;
  status: string;
  urlKey?: string;
}

export const projectListTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_project_list",
  description: "List all projects for the company.",
  inputSchema,
  handler: async (input, { client }) => {
    const companyId = client.resolveCompanyId(input.companyId);
    const raw = (await client.request(
      "GET",
      `/api/companies/${encodeURIComponent(companyId)}/projects`,
    )) as ProjectRaw[];
    return raw.map((p) => ({ id: p.id, name: p.name, status: p.status, urlKey: p.urlKey }));
  },
};
