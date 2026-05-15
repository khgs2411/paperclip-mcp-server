import { z } from "zod";
import type { ToolDefinition } from "./index.js";

const inputSchema = z.object({
  companyId: z.string().optional().describe("Company UUID (falls back to PAPERCLIP_COMPANY_ID)"),
  q: z.string().min(1).describe("Full-text search query across issue titles, identifiers, descriptions, and comments"),
  limit: z.number().int().positive().optional().describe("Max results"),
});

export const issueSearchTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_issue_search",
  description:
    "Full-text search across issues. Results are ranked by relevance: title matches first, then identifier, description, comments.",
  inputSchema,
  handler: async (input, { client }) => {
    const cid = client.resolveCompanyId(input.companyId);
    const params = new URLSearchParams({ q: input.q });
    if (input.limit) params.set("limit", String(input.limit));
    const path = `/api/companies/${encodeURIComponent(cid)}/issues?${params.toString()}`;
    return client.request("GET", path);
  },
};
