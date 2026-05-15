import { z } from "zod";
import type { ToolDefinition } from "./index.js";

const inputSchema = z.object({
  issueId: z.string().min(1).describe("Issue UUID or PREFIX-N identifier"),
  key: z.string().min(1).describe("Document key (e.g. 'plan', 'spec')"),
});

export const issueDocumentGetTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_issue_document_get",
  description: "Get a specific document from an issue by key.",
  inputSchema,
  handler: async (input, { client }) => {
    return client.request(
      "GET",
      `/api/issues/${encodeURIComponent(input.issueId)}/documents/${encodeURIComponent(input.key)}`,
    );
  },
};
