import { z } from "zod";
import type { ToolDefinition } from "./index.js";

const inputSchema = z.object({
  approvalId: z.string().describe("Approval UUID"),
  payload: z
    .object({
      title: z.string().optional(),
      summary: z.string().optional(),
      recommendedAction: z.string().optional(),
      risks: z.array(z.string()).optional(),
    })
    .optional()
    .describe("Updated decision payload for the resubmission"),
});

export const approvalResubmitTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_approval_resubmit",
  description: "Resubmits an approval that was sent back for revision.",
  inputSchema,
  handler: async (input, { client }) => {
    const body: Record<string, unknown> = {};
    if (input.payload !== undefined) body["payload"] = input.payload;
    return client.request(
      "POST",
      `/api/approvals/${encodeURIComponent(input.approvalId)}/resubmit`,
      body,
    );
  },
};
