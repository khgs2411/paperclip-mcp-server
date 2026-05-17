import { z } from "zod";
import type { ToolDefinition } from "./index.js";

const inputSchema = z.object({
  issueId: z.string().min(1).describe("Issue UUID or PREFIX-N identifier to release"),
});

export const issueReleaseTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_issue_release",
  description:
    "Release an issue checkout and relinquish ownership. This does not cancel an active agent run; use paperclip_issue_patch with interrupt: true or status: cancelled for run control.",
  inputSchema,
  handler: async (input, { client }) => {
    return client.request(
      "POST",
      `/api/issues/${encodeURIComponent(input.issueId)}/release`,
      {},
    );
  },
};
