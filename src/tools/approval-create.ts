import { z } from "zod";
import type { ToolDefinition } from "./index.js";

const inputSchema = z.object({
  companyId: z
    .string()
    .optional()
    .describe("Company ID (defaults to PAPERCLIP_COMPANY_ID env var)"),
  type: z
    .string()
    .describe("Approval type, e.g. 'request_board_approval'"),
  requestedByAgentId: z.string().describe("Agent ID making the request"),
  issueIds: z.array(z.string()).optional().describe("Issue IDs to link to this approval"),
  payload: z
    .object({
      title: z.string(),
      summary: z.string(),
      recommendedAction: z.string().optional(),
      risks: z.array(z.string()).optional(),
    })
    .describe("Human-readable decision payload"),
});

export const approvalCreateTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_approval_create",
  description: "Creates a new approval request (e.g. request_board_approval).",
  inputSchema,
  handler: async (input, { client }) => {
    const companyId = client.resolveCompanyId(input.companyId);
    const { companyId: _cid, ...body } = input;
    return client.request(
      "POST",
      `/api/companies/${encodeURIComponent(companyId)}/approvals`,
      body,
    );
  },
};
