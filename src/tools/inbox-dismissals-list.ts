import { z } from "zod";
import type { ToolDefinition } from "./index.js";
import { requireAgentApiKey } from "../shared/agent-auth.js";

const inputSchema = z.object({
  companyId: z
    .string()
    .optional()
    .describe("Company ID (defaults to PAPERCLIP_COMPANY_ID env var)"),
});

export const inboxDismissalsListTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_inbox_dismissals_list",
  description:
    "Lists inbox dismissals for the company. Requires PAPERCLIP_AGENT_API_KEY environment variable.",
  inputSchema,
  handler: async (input, { client }) => {
    requireAgentApiKey();
    const companyId = client.resolveCompanyId(input.companyId);
    return client.request("GET", `/api/companies/${encodeURIComponent(companyId)}/inbox-dismissals`);
  },
};
