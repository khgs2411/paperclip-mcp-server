import { z } from "zod";
import type { ToolDefinition } from "./index.js";

const inputSchema = z.object({
  approvalId: z.string().describe("Approval UUID"),
  feedback: z.string().optional().describe("Feedback on what needs to change"),
});

export const approvalRequestRevisionTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_approval_request_revision",
  description: "Requests a revision on a pending approval, returning it to the requester.",
  inputSchema,
  handler: async (input, { client }) => {
    const body: Record<string, unknown> = {};
    if (input.feedback !== undefined) body["feedback"] = input.feedback;
    return client.request(
      "POST",
      `/api/approvals/${encodeURIComponent(input.approvalId)}/request-revision`,
      body,
    );
  },
};
