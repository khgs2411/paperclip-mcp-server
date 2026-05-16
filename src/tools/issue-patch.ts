import { z } from "zod";
import type { ToolDefinition } from "./index.js";
import { isTopIdentifier, isUuid } from "../shared/identifier.js";
import { assertWorkflowBoundaryText } from "../shared/workflow-boundary.js";

const inputSchema = z
  .object({
    issueIdOrIdentifier: z.string().refine((v) => isUuid(v) || isTopIdentifier(v), {
      message: "must be a UUID or PREFIX-N identifier",
    }),
    title: z.string().optional(),
    description: z.string().optional(),
    status: z.string().optional(),
    comment: z.string().optional().describe("Optional final/status comment to append with the status update."),
    priority: z.enum(["critical", "high", "medium", "low"]).optional(),
    assigneeAgentId: z.string().nullable().optional().describe("Agent UUID to assign, or null to clear the agent assignee."),
    assigneeUserId: z.string().nullable().optional().describe("User UUID to assign, or null to clear the user assignee. Pass null alongside assigneeAgentId to transfer from a user to an agent in one call."),
    projectId: z.string().nullable().optional(),
    blockedByIssueIds: z.array(z.string()).optional().describe("Issue UUIDs that block this issue. Pass [] to clear stale blockers."),
  })
  .refine(
    (v) =>
      v.title !== undefined ||
      v.description !== undefined ||
      v.status !== undefined ||
      v.comment !== undefined ||
      v.priority !== undefined ||
      v.assigneeAgentId !== undefined ||
      v.assigneeUserId !== undefined ||
      v.projectId !== undefined ||
      v.blockedByIssueIds !== undefined,
    { message: "at least one patchable field must be provided", path: ["_patch"] },
  );

export const issuePatchTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_issue_patch",
  description:
    "Update an issue's title, description, status, priority, assignee (agent or user), or projectId. To transfer from a user assignee to an agent, pass assigneeUserId: null and assigneeAgentId together. Accepts UUID or TOP-N style identifier.",
  inputSchema,
  handler: async (input, { client }) => {
    const { issueIdOrIdentifier, ...patch } = input;
    assertWorkflowBoundaryText({ toolName: "paperclip_issue_patch", fields: patch });
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
      assigneeUserId: raw["assigneeUserId"],
    };
  },
};
