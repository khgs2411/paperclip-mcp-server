import { z } from "zod";
import type { ToolDefinition } from "./index.js";
import { ToolInputError } from "../shared/errors.js";

const inputSchema = z.object({
  issueId: z.string().min(1).describe("Issue UUID or PREFIX-N identifier"),
  key: z.string().min(1).describe("Document key to delete"),
  confirm: z.literal(true).describe("Must be true to confirm deletion"),
});

export const issueDocumentDeleteTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_issue_document_delete",
  description: "Delete a document from an issue. Requires confirm: true. Irreversible.",
  inputSchema,
  handler: async (input, { client }) => {
    if (!input.confirm) {
      throw new ToolInputError("confirm", "must be true to confirm deletion");
    }
    return client.request(
      "DELETE",
      `/api/issues/${encodeURIComponent(input.issueId)}/documents/${encodeURIComponent(input.key)}`,
    );
  },
};
