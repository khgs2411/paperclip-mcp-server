import { z } from "zod";
import type { ToolDefinition } from "./index.js";

const inputSchema = z.object({
  companyId: z.string().optional(),
  name: z.string().min(1),
  status: z.string().optional(),
});

export const projectCreateTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_project_create",
  description:
    "Create a new project under the company. v0.1 omits workspaceConfig — projects are created with managed-mode defaults.",
  inputSchema,
  handler: async (input, { client }) => {
    const companyId = client.resolveCompanyId(input.companyId);
    const body: Record<string, unknown> = { name: input.name };
    if (input.status !== undefined) body["status"] = input.status;
    const raw = (await client.request(
      "POST",
      `/api/companies/${encodeURIComponent(companyId)}/projects`,
      body,
    )) as { id: string; name: string; status: string };
    return { id: raw.id, name: raw.name, status: raw.status };
  },
};
