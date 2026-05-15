import { z } from "zod";
import type { ToolDefinition } from "./index.js";

const inputSchema = z.object({
  issueId: z.string().min(1).describe("Issue UUID or PREFIX-N identifier"),
  interactionId: z.string().min(1).describe("Interaction UUID"),
  response: z.string().min(1).describe("Response text to the question"),
});

export const issueInteractionRespondTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_issue_interaction_respond",
  description: "Respond to a pending ask_user_questions interaction.",
  inputSchema,
  handler: async (input, { client }) => {
    return client.request(
      "POST",
      `/api/issues/${encodeURIComponent(input.issueId)}/interactions/${encodeURIComponent(input.interactionId)}/respond`,
      { response: input.response },
    );
  },
};
