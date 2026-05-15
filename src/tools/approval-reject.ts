import { z } from "zod";
import type { ToolDefinition } from "./index.js";

const inputSchema = z.object({
  approvalId: z.string().describe("Approval UUID"),
  reason: z.string().optional().describe("Reason for rejection"),
});

export const approvalRejectTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_approval_reject",
  description: "Rejects a pending approval.",
  inputSchema,
  handler: async (input, { client }) => {
    const body: Record<string, unknown> = {};
    if (input.reason !== undefined) body["reason"] = input.reason;
    return client.request(
      "POST",
      `/api/approvals/${encodeURIComponent(input.approvalId)}/reject`,
      body,
    );
  },
};
