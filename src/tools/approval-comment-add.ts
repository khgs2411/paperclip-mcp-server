import { z } from "zod";
import type { ToolDefinition } from "./index.js";

const inputSchema = z.object({
  approvalId: z.string().describe("Approval UUID"),
  body: z.string().describe("Comment body (markdown)"),
});

export const approvalCommentAddTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_approval_comment_add",
  description: "Adds a comment to an approval.",
  inputSchema,
  handler: async (input, { client }) => {
    return client.request(
      "POST",
      `/api/approvals/${encodeURIComponent(input.approvalId)}/comments`,
      { body: input.body },
    );
  },
};
