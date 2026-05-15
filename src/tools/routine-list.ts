import { z } from "zod";
import type { ToolDefinition } from "./index.js";

const inputSchema = z.object({
  companyId: z
    .string()
    .optional()
    .describe("Company ID (defaults to PAPERCLIP_COMPANY_ID env var)"),
});

export const routineListTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_routine_list",
  description: "Lists all routines for a company. Returns id, name, agentId, status per routine.",
  inputSchema,
  handler: async (input, { client }) => {
    const companyId = client.resolveCompanyId(input.companyId);
    const raw = await client.request<unknown>(
      "GET",
      `/api/companies/${encodeURIComponent(companyId)}/routines`,
    );
    const arr: unknown[] = Array.isArray(raw)
      ? raw
      : Array.isArray((raw as Record<string, unknown>)["routines"])
        ? ((raw as Record<string, unknown>)["routines"] as unknown[])
        : [];
    return arr.map((r) => {
      const routine = r as Record<string, unknown>;
      return {
        id: routine["id"],
        name: routine["name"],
        agentId: routine["agentId"],
        status: routine["status"],
      };
    });
  },
};
