import { z } from "zod";
import type { ToolDefinition } from "./index.js";

const inputSchema = z.object({
  approvalId: z.string().describe("Approval UUID"),
});

export const approvalCommentsListTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_approval_comments_list",
  description: "Lists comments on an approval.",
  inputSchema,
  handler: async (input, { client }) => {
    return client.request(
      "GET",
      `/api/approvals/${encodeURIComponent(input.approvalId)}/comments`,
    );
  },
};
