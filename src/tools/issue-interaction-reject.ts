import { z } from "zod";
import type { ToolDefinition } from "./index.js";

const inputSchema = z.object({
  issueId: z.string().min(1).describe("Issue UUID or PREFIX-N identifier"),
  interactionId: z.string().min(1).describe("Interaction UUID to reject"),
});

export const issueInteractionRejectTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_issue_interaction_reject",
  description: "Reject a pending request_confirmation or suggest_tasks interaction.",
  inputSchema,
  handler: async (input, { client }) => {
    return client.request(
      "POST",
      `/api/issues/${encodeURIComponent(input.issueId)}/interactions/${encodeURIComponent(input.interactionId)}/reject`,
      {},
    );
  },
};
