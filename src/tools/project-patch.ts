import { z } from "zod";
import type { ToolDefinition } from "./index.js";

const inputSchema = z
  .object({
    projectId: z.string().min(1),
    companyId: z.string().optional(),
    name: z.string().optional(),
    status: z.string().optional(),
  })
  .refine((d) => d.name !== undefined || d.status !== undefined, {
    message: "At least one of name or status must be provided",
  });

interface ProjectRaw {
  id: string;
  name: string;
  status: string;
  urlKey?: string;
}

export const projectPatchTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_project_patch",
  description: "Update a project's name or status.",
  inputSchema,
  handler: async (input, { client }) => {
    const companyId = client.resolveCompanyId(input.companyId);
    const body: Record<string, unknown> = {};
    if (input.name !== undefined) body["name"] = input.name;
    if (input.status !== undefined) body["status"] = input.status;
    const raw = (await client.request(
      "PATCH",
      `/api/projects/${encodeURIComponent(input.projectId)}?companyId=${encodeURIComponent(companyId)}`,
      body,
    )) as ProjectRaw;
    return { id: raw.id, name: raw.name, status: raw.status, urlKey: raw.urlKey };
  },
};
