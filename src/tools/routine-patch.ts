import { z } from "zod";
import type { ToolDefinition } from "./index.js";

const inputSchema = z
  .object({
    routineId: z.string().min(1),
    title: z.string().optional(),
    description: z.string().optional(),
    assigneeAgentId: z.string().nullable().optional(),
    priority: z.enum(["critical", "high", "medium", "low"]).optional(),
    status: z.string().optional(),
    projectId: z.string().nullable().optional(),
  })
  .refine(
    (v) =>
      v.title !== undefined ||
      v.description !== undefined ||
      v.assigneeAgentId !== undefined ||
      v.priority !== undefined ||
      v.status !== undefined ||
      v.projectId !== undefined,
    { message: "at least one patchable field must be provided", path: ["_patch"] },
  );

export const routinePatchTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_routine_patch",
  description:
    "Update a routine's metadata (title, description, assignee, priority, status, projectId). Returns the new revision number along with the resolved fields.",
  inputSchema,
  handler: async (input, { client }) => {
    const { routineId, ...patch } = input;
    const raw = (await client.request(
      "PATCH",
      `/api/routines/${encodeURIComponent(routineId)}`,
      patch,
    )) as Record<string, unknown>;
    return {
      id: raw["id"],
      title: raw["title"],
      description: raw["description"],
      assigneeAgentId: raw["assigneeAgentId"],
      status: raw["status"],
      latestRevisionNumber: raw["latestRevisionNumber"],
    };
  },
};
