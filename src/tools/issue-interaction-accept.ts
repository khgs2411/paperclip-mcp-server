import { z } from "zod";
import type { ToolDefinition } from "./index.js";

const inputSchema = z.object({
  issueId: z.string().min(1).describe("Issue UUID or PREFIX-N identifier"),
  interactionId: z.string().min(1).describe("Interaction UUID to accept"),
});

export const issueInteractionAcceptTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_issue_interaction_accept",
  description: "Accept a pending request_confirmation or suggest_tasks interaction.",
  inputSchema,
  handler: async (input, { client }) => {
    return client.request(
      "POST",
      `/api/issues/${encodeURIComponent(input.issueId)}/interactions/${encodeURIComponent(input.interactionId)}/accept`,
      {},
    );
  },
};
