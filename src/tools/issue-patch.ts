import { z } from "zod";
import type { ToolDefinition } from "./index.js";
import { isTopIdentifier, isUuid } from "../shared/identifier.js";

const inputSchema = z
  .object({
    issueIdOrIdentifier: z.string().refine((v) => isUuid(v) || isTopIdentifier(v), {
      message: "must be a UUID or PREFIX-N identifier",
    }),
    title: z.string().optional(),
    description: z.string().optional(),
    status: z.string().optional(),
    priority: z.enum(["critical", "high", "medium", "low"]).optional(),
    assigneeAgentId: z.string().nullable().optional(),
    projectId: z.string().nullable().optional(),
  })
  .refine(
    (v) =>
      v.title !== undefined ||
      v.description !== undefined ||
      v.status !== undefined ||
      v.priority !== undefined ||
      v.assigneeAgentId !== undefined ||
      v.projectId !== undefined,
    { message: "at least one patchable field must be provided", path: ["_patch"] },
  );

export const issuePatchTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_issue_patch",
  description:
    "Update an issue's title, description, status, priority, assignee, or projectId. Accepts UUID or TOP-N style identifier.",
  inputSchema,
  handler: async (input, { client }) => {
    const { issueIdOrIdentifier, ...patch } = input;
    const raw = (await client.request(
      "PATCH",
      `/api/issues/${encodeURIComponent(issueIdOrIdentifier)}`,
      patch,
    )) as Record<string, unknown>;
    return {
      id: raw["id"],
      identifier: raw["identifier"],
      status: raw["status"],
      priority: raw["priority"],
      title: raw["title"],
      assigneeAgentId: raw["assigneeAgentId"],
    };
  },
};
