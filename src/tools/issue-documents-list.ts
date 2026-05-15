import { z } from "zod";
import type { ToolDefinition } from "./index.js";

const inputSchema = z.object({
  issueId: z.string().min(1).describe("Issue UUID or PREFIX-N identifier"),
});

export const issueDocumentsListTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_issue_documents_list",
  description: "List all documents attached to an issue (e.g. plan, spec, notes).",
  inputSchema,
  handler: async (input, { client }) => {
    return client.request("GET", `/api/issues/${encodeURIComponent(input.issueId)}/documents`);
  },
};
