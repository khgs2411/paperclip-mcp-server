import { z } from "zod";
import type { ToolDefinition } from "./index.js";

const inputSchema = z
  .object({
    agentId: z.string().min(1),
    companyId: z.string().optional(),
    name: z.string().optional(),
    title: z.string().nullable().optional(),
    role: z.string().optional(),
    reportsTo: z.string().nullable().optional(),
    capabilities: z.string().nullable().optional(),
    icon: z.string().optional(),
  })
  .refine(
    (v) =>
      v.name !== undefined ||
      v.title !== undefined ||
      v.role !== undefined ||
      v.reportsTo !== undefined ||
      v.capabilities !== undefined ||
      v.icon !== undefined,
    { message: "at least one patchable field must be provided", path: ["_patch"] },
  );

export const agentPatchTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_agent_patch",
  description:
    "Update an agent's mutable fields (name, title, role, reportsTo, capabilities, icon). urlKey is auto-derived from name and is not directly settable. Returns the resolved agent state.",
  inputSchema,
  handler: async (input, { client }) => {
    const companyId = client.resolveCompanyId(input.companyId);
    const { agentId, companyId: _ignored, ...patch } = input;
    const raw = (await client.request(
      "PATCH",
      `/api/agents/${encodeURIComponent(agentId)}?companyId=${encodeURIComponent(companyId)}`,
      patch,
    )) as Record<string, unknown>;

    return {
      id: raw["id"],
      name: raw["name"],
      urlKey: raw["urlKey"],
      role: raw["role"],
      title: raw["title"] ?? null,
      reportsTo: raw["reportsTo"] ?? null,
      capabilities: raw["capabilities"] ?? null,
      status: raw["status"],
    };
  },
};
