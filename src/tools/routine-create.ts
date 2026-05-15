import { z } from "zod";
import type { ToolDefinition } from "./index.js";

const inputSchema = z.object({
  companyId: z.string().optional(),
  name: z.string().min(1),
  agentId: z.string().min(1),
  description: z.string().optional(),
  triggers: z.array(z.record(z.unknown())).optional(),
  concurrencyPolicy: z.string().optional(),
  catchUpPolicy: z.string().optional(),
});

export const routineCreateTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_routine_create",
  description: "Create a new routine for the company.",
  inputSchema,
  handler: async (input, { client }) => {
    const companyId = client.resolveCompanyId(input.companyId);
    const { companyId: _ignored, ...body } = input;
    const raw = (await client.request(
      "POST",
      `/api/companies/${encodeURIComponent(companyId)}/routines`,
      body,
    )) as Record<string, unknown>;
    return { id: raw["id"], name: raw["name"], agentId: raw["agentId"] };
  },
};
