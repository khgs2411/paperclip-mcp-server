import { z } from "zod";
import type { ToolDefinition } from "./index.js";

const inputSchema = z.object({
  routineId: z.string().min(1),
  companyId: z.string().optional(),
});

export const routineGetTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_routine_get",
  description: "Get a single routine by ID.",
  inputSchema,
  handler: async (input, { client }) => {
    const companyId = client.resolveCompanyId(input.companyId);
    return client.request(
      "GET",
      `/api/routines/${encodeURIComponent(input.routineId)}?companyId=${encodeURIComponent(companyId)}`,
    );
  },
};
