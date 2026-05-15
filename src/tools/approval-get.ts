import { z } from "zod";
import type { ToolDefinition } from "./index.js";

const inputSchema = z.object({
  approvalId: z.string().describe("Approval UUID"),
});

export const approvalGetTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_approval_get",
  description: "Gets a single approval by ID.",
  inputSchema,
  handler: async (input, { client }) => {
    return client.request("GET", `/api/approvals/${encodeURIComponent(input.approvalId)}`);
  },
};
