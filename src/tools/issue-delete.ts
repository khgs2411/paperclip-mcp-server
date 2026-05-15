import { z } from "zod";
import type { ToolDefinition } from "./index.js";
import { ToolInputError } from "../shared/errors.js";

const inputSchema = z.object({
  issueId: z.string().min(1).describe("Issue UUID or PREFIX-N identifier to delete"),
  confirm: z.literal(true).describe("Must be true to confirm deletion"),
});

export const issueDeleteTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_issue_delete",
  description:
    "Permanently delete an issue. Requires confirm: true. This action is irreversible.",
  inputSchema,
  handler: async (input, { client }) => {
    if (!input.confirm) {
      throw new ToolInputError("confirm", "must be true to confirm deletion");
    }
    return client.request("DELETE", `/api/issues/${encodeURIComponent(input.issueId)}`);
  },
};
