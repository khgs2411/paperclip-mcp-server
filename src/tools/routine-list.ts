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
  description:
    "Lists all routines for a company. Returns id, name, status plus schedule and trigger metadata for each routine.",
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
      const triggers = Array.isArray(routine["triggers"]) ? routine["triggers"] : [];
      const trigger0 = triggers.length > 0 ? (triggers[0] as Record<string, unknown>) : undefined;
      return {
        id: routine["id"],
        name: routine["name"],
        agentId: routine["agentId"],
        assigneeAgentId: routine["assigneeAgentId"],
        status: routine["status"],
        lastTriggeredAt: routine["lastTriggeredAt"],
        lastEnqueuedAt: routine["lastEnqueuedAt"],
        nextRunAt: routine["nextRunAt"] ?? trigger0?.["nextRunAt"] ?? null,
        lastFiredAt: routine["lastFiredAt"] ?? trigger0?.["lastFiredAt"] ?? null,
        lastResult: routine["lastResult"] ?? trigger0?.["lastResult"] ?? null,
        triggers,
      };
    });
  },
};
