import { z } from "zod";
import type { ToolDefinition } from "./index.js";

const inputSchema = z.object({
  issueId: z.string().min(1).describe("Issue UUID or PREFIX-N identifier"),
  limit: z.number().int().positive().optional().describe("Max activity records to return"),
});

export const issueActivityTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_issue_activity",
  description: "Get the activity feed for an issue (status changes, assignments, etc.).",
  inputSchema,
  handler: async (input, { client }) => {
    const params = new URLSearchParams();
    if (input.limit) params.set("limit", String(input.limit));
    const qs = params.toString();
    const path = `/api/issues/${encodeURIComponent(input.issueId)}/activity${qs ? `?${qs}` : ""}`;
    return client.request("GET", path);
  },
};
