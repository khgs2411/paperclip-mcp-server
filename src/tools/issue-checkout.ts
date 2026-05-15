import { z } from "zod";
import type { ToolDefinition } from "./index.js";

const inputSchema = z.object({
  issueId: z.string().min(1).describe("Issue UUID or PREFIX-N identifier to check out"),
  agentId: z.string().min(1).describe("Agent UUID claiming the checkout"),
  expectedStatuses: z
    .array(z.string())
    .optional()
    .describe("Optimistic concurrency check — fails if current status not in this list"),
});

export const issueCheckoutTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_issue_checkout",
  description:
    "Check out an issue — claims exclusive ownership for the agent. " +
    "Returns 409 if already owned by a different agent.",
  inputSchema,
  handler: async (input, { client }) => {
    const { issueId, ...body } = input;
    return client.request(
      "POST",
      `/api/issues/${encodeURIComponent(issueId)}/checkout`,
      body,
    );
  },
};
