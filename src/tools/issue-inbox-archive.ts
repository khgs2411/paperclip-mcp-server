import { z } from "zod";
import type { ToolDefinition } from "./index.js";

const inputSchema = z.object({
  issueId: z.string().min(1).describe("Issue UUID or PREFIX-N identifier"),
});

export const issueInboxArchiveTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_issue_inbox_archive",
  description: "Archive an issue from the inbox.",
  inputSchema,
  handler: async (input, { client }) => {
    return client.request(
      "POST",
      `/api/issues/${encodeURIComponent(input.issueId)}/inbox-archive`,
      {},
    );
  },
};

export const issueInboxUnarchiveTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_issue_inbox_unarchive",
  description: "Unarchive an issue from the inbox.",
  inputSchema,
  handler: async (input, { client }) => {
    return client.request(
      "DELETE",
      `/api/issues/${encodeURIComponent(input.issueId)}/inbox-archive`,
    );
  },
};
