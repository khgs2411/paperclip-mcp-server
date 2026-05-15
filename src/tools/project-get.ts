import { z } from "zod";
import type { ToolDefinition } from "./index.js";

const inputSchema = z.object({
  projectId: z.string().min(1),
  companyId: z.string().optional(),
});

interface ProjectRaw {
  id: string;
  name: string;
  status: string;
  urlKey?: string;
}

export const projectGetTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_project_get",
  description: "Get a project by id.",
  inputSchema,
  handler: async (input, { client }) => {
    const companyId = client.resolveCompanyId(input.companyId);
    const raw = (await client.request(
      "GET",
      `/api/projects/${encodeURIComponent(input.projectId)}?companyId=${encodeURIComponent(companyId)}`,
    )) as ProjectRaw;
    return { id: raw.id, name: raw.name, status: raw.status, urlKey: raw.urlKey };
  },
};
