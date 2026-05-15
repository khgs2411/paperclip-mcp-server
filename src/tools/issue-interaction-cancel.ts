import { z } from "zod";
import type { ToolDefinition } from "./index.js";

const inputSchema = z.object({
  issueId: z.string().min(1).describe("Issue UUID or PREFIX-N identifier"),
  interactionId: z.string().min(1).describe("Interaction UUID to cancel"),
});

export const issueInteractionCancelTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_issue_interaction_cancel",
  description: "Cancel a pending interaction. Use when the question or confirmation is no longer relevant.",
  inputSchema,
  handler: async (input, { client }) => {
    return client.request(
      "POST",
      `/api/issues/${encodeURIComponent(input.issueId)}/interactions/${encodeURIComponent(input.interactionId)}/cancel`,
      {},
    );
  },
};
