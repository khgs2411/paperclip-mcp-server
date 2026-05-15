import { z } from "zod";
import type { ToolDefinition } from "./index.js";

const inputSchema = z
  .object({
    projectId: z.string().min(1),
    companyId: z.string().optional(),
    name: z.string().optional(),
    status: z.string().optional(),
  })
  .refine((v) => v.name !== undefined || v.status !== undefined, {
    message: "at least one of name or status must be provided",
    path: ["_patch"],
  });

export const projectPatchTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_project_patch",
  description: "Update a project's name or status.",
  inputSchema,
  handler: async (input, { client }) => {
    const companyId = client.resolveCompanyId(input.companyId);
    const { projectId, companyId: _ignored, ...body } = input;
    const raw = (await client.request(
      "PATCH",
      `/api/projects/${encodeURIComponent(projectId)}?companyId=${encodeURIComponent(companyId)}`,
      body,
    )) as Record<string, unknown>;
    return { id: raw["id"], name: raw["name"], status: raw["status"], urlKey: raw["urlKey"] };
  },
};
