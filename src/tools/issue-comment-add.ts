import { z } from "zod";
import type { ToolDefinition } from "./index.js";
import { assertWorkflowBoundaryText } from "../shared/workflow-boundary.js";

const inputSchema = z.object({
  issueId: z.string().min(1).describe("Issue UUID or PREFIX-N identifier"),
  body: z.string().min(1).describe("Comment body (markdown supported)"),
});

export const issueCommentAddTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_issue_comment_add",
  description:
    "Add a comment to an issue. Primary agent-to-agent and agent-to-board communication path.",
  inputSchema,
  handler: async (input, { client }) => {
    assertWorkflowBoundaryText({ toolName: "paperclip_issue_comment_add", fields: { body: input.body } });
    return client.request(
      "POST",
      `/api/issues/${encodeURIComponent(input.issueId)}/comments`,
      { body: input.body },
    );
  },
};
