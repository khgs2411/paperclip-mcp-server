import { z } from "zod";
import type { ToolDefinition } from "./index.js";
import { requireAgentApiKey } from "../shared/agent-auth.js";

const inputSchema = z.object({
  companyId: z
    .string()
    .optional()
    .describe("Company ID (defaults to PAPERCLIP_COMPANY_ID env var)"),
  interactionId: z.string().describe("ID of the interaction to dismiss"),
});

export const inboxDismissTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_inbox_dismiss",
  description:
    "Dismisses an inbox interaction. Requires PAPERCLIP_AGENT_API_KEY environment variable.",
  inputSchema,
  handler: async (input, { client }) => {
    requireAgentApiKey();
    const companyId = client.resolveCompanyId(input.companyId);
    return client.request(
      "POST",
      `/api/companies/${encodeURIComponent(companyId)}/inbox-dismissals`,
      { interactionId: input.interactionId },
    );
  },
};
