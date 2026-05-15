import { z } from "zod";
import type { ToolDefinition } from "./index.js";

const inputSchema = z.object({
  approvalId: z.string().describe("Approval UUID"),
});

export const approvalIssuesListTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_approval_issues_list",
  description: "Lists issues linked to an approval.",
  inputSchema,
  handler: async (input, { client }) => {
    return client.request(
      "GET",
      `/api/approvals/${encodeURIComponent(input.approvalId)}/issues`,
    );
  },
};
