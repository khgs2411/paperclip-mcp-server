import { z } from "zod";
import type { ToolDefinition } from "./index.js";

const inputSchema = z.object({
  issueId: z.string().min(1).describe("Issue UUID or PREFIX-N identifier to release"),
});

export const issueReleaseTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_issue_release",
  description: "Release an issue checkout, relinquishing exclusive ownership.",
  inputSchema,
  handler: async (input, { client }) => {
    return client.request(
      "POST",
      `/api/issues/${encodeURIComponent(input.issueId)}/release`,
      {},
    );
  },
};
