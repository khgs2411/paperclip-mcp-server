import { z } from "zod";
import type { ToolDefinition } from "./index.js";

const inputSchema = z.object({
  issueId: z.string().min(1).describe("Issue UUID or PREFIX-N identifier"),
});

export const issueReadMarkTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_issue_read_mark",
  description: "Mark an issue as read for the current user/agent.",
  inputSchema,
  handler: async (input, { client }) => {
    return client.request("POST", `/api/issues/${encodeURIComponent(input.issueId)}/read`, {});
  },
};

export const issueReadUnmarkTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_issue_read_unmark",
  description: "Mark an issue as unread (remove read mark).",
  inputSchema,
  handler: async (input, { client }) => {
    return client.request("DELETE", `/api/issues/${encodeURIComponent(input.issueId)}/read`);
  },
};
