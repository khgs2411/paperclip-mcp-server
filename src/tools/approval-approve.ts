import { z } from "zod";
import type { ToolDefinition } from "./index.js";
import { ToolInputError } from "../shared/errors.js";

const inputSchema = z.object({
  approvalId: z.string().describe("Approval UUID"),
  confirm: z
    .literal(true)
    .describe("Must be true to confirm the approval action (Red-tier safety gate)"),
  comment: z.string().optional().describe("Optional comment to attach"),
});

export const approvalApproveTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_approval_approve",
  description:
    "Approves a pending approval. Requires confirm: true as a Red-tier safety gate to prevent accidental approval.",
  inputSchema,
  handler: async (input, { client }) => {
    if (!input.confirm) {
      throw new ToolInputError("confirm", "must be true to execute an approval action");
    }
    const body: Record<string, unknown> = {};
    if (input.comment !== undefined) body["comment"] = input.comment;
    return client.request(
      "POST",
      `/api/approvals/${encodeURIComponent(input.approvalId)}/approve`,
      body,
    );
  },
};
