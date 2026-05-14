import { z } from "zod";
import type { ToolDefinition } from "./index.js";
import { isTopIdentifier, isUuid } from "../shared/identifier.js";

const inputSchema = z.object({
  issueIdOrIdentifier: z.string().refine((v) => isUuid(v) || isTopIdentifier(v), {
    message: "must be a UUID or PREFIX-N identifier",
  }),
  companyId: z.string().optional(),
});

export const issueGetFullTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_issue_get_full",
  description:
    "Get an issue plus its commonly-needed associations (comments, parentId, ancestors, blockedBy, blocks, relatedWork, checkoutRunId) in one call. Children/sub-issues are NOT included in v0.1.",
  inputSchema,
  handler: async (input, { client }) => {
    const ref = encodeURIComponent(input.issueIdOrIdentifier);
    const issue = (await client.request("GET", `/api/issues/${ref}`)) as Record<string, unknown>;
    const comments = (await client.request("GET", `/api/issues/${ref}/comments`)) as unknown[];
    return {
      id: issue["id"],
      identifier: issue["identifier"],
      title: issue["title"],
      status: issue["status"],
      priority: issue["priority"],
      assigneeAgentId: issue["assigneeAgentId"],
      projectId: issue["projectId"],
      description: issue["description"],
      parentId: issue["parentId"],
      ancestors: issue["ancestors"],
      blockedBy: issue["blockedBy"],
      blocks: issue["blocks"],
      relatedWork: issue["relatedWork"],
      checkoutRunId: issue["checkoutRunId"],
      comments,
      createdAt: issue["createdAt"],
      updatedAt: issue["updatedAt"],
    };
  },
};
