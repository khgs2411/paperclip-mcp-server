import { z } from "zod";
import type { ToolDefinition } from "./index.js";

const inputSchema = z.object({
  issueId: z.string().min(1).describe("Issue UUID or PREFIX-N identifier"),
  after: z.string().optional().describe("Comment ID cursor — returns comments after this ID (ascending)"),
});

export const issueCommentsListTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_issue_comments_list",
  description: "List comments on an issue, optionally from a cursor for incremental fetching.",
  inputSchema,
  handler: async (input, { client }) => {
    const params = new URLSearchParams();
    if (input.after) {
      params.set("after", input.after);
      params.set("order", "asc");
    }
    const qs = params.toString();
    const path = `/api/issues/${encodeURIComponent(input.issueId)}/comments${qs ? `?${qs}` : ""}`;
    return client.request("GET", path);
  },
};
