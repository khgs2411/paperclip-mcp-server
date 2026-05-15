import { z } from "zod";
import type { ToolDefinition } from "./index.js";

const inputSchema = z.object({
  issueId: z.string().min(1).describe("Issue UUID or PREFIX-N identifier"),
  kind: z
    .enum(["request_confirmation", "ask_user_questions", "suggest_tasks"])
    .describe("Interaction kind"),
  prompt: z.string().min(1).describe("The question, confirmation request, or task suggestion body"),
  continuationPolicy: z
    .enum(["wake_assignee", "none"])
    .optional()
    .describe("What happens after a response. wake_assignee resumes the issue assignee."),
  idempotencyKey: z.string().optional().describe("Dedup key to prevent duplicate interactions"),
});

export const issueInteractionCreateTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_issue_interaction_create",
  description:
    "Create an interaction on an issue (confirmation, question, or task suggestion). " +
    "Use to ask Liad/Knox a question or request board confirmation without filing a new issue.",
  inputSchema,
  handler: async (input, { client }) => {
    const { issueId, ...body } = input;
    return client.request(
      "POST",
      `/api/issues/${encodeURIComponent(issueId)}/interactions`,
      body,
    );
  },
};
