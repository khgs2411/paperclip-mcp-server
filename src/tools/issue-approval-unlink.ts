import { z } from "zod";
import type { ToolDefinition } from "./index.js";
import { isTopIdentifier, isUuid } from "../shared/identifier.js";

const inputSchema = z.object({
  issueIdOrIdentifier: z.string().refine((v) => isUuid(v) || isTopIdentifier(v), {
    message: "must be a UUID or PREFIX-N identifier",
  }),
  approvalId: z.string().describe("Approval UUID to unlink"),
});

export const issueApprovalUnlinkTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_issue_approval_unlink",
  description: "Unlinks an approval from an issue.",
  inputSchema,
  handler: async (input, { client }) => {
    return client.request(
      "DELETE",
      `/api/issues/${encodeURIComponent(input.issueIdOrIdentifier)}/approvals/${encodeURIComponent(input.approvalId)}`,
    );
  },
};
