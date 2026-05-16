import { z } from "zod";
import type { ToolDefinition } from "./index.js";
import { assertWorkflowBoundaryText } from "../shared/workflow-boundary.js";

const inputSchema = z.object({
  issueId: z.string().min(1).describe("Issue UUID or PREFIX-N identifier"),
  key: z.string().min(1).describe("Document key (e.g. 'plan', 'spec')"),
  title: z.string().min(1).describe("Document title"),
  body: z.string().describe("Document body (markdown)"),
  format: z.enum(["markdown", "text"]).optional().default("markdown"),
  baseRevisionId: z.string().nullable().optional().describe("Revision ID for optimistic concurrency. null for first write."),
});

export const issueDocumentPutTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_issue_document_put",
  description:
    "Create or update a document on an issue. Use key='plan' for implementation plans. " +
    "Fetch the current document first and pass its baseRevisionId to avoid overwrite conflicts.",
  inputSchema,
  handler: async (input, { client }) => {
    const { issueId, key, format = "markdown", ...rest } = input;
    assertWorkflowBoundaryText({ toolName: "paperclip_issue_document_put", fields: rest });
    return client.request(
      "PUT",
      `/api/issues/${encodeURIComponent(issueId)}/documents/${encodeURIComponent(key)}`,
      { ...rest, format },
    );
  },
};
