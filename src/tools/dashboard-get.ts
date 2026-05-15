import { z } from "zod";
import type { ToolDefinition } from "./index.js";

const inputSchema = z.object({
  companyId: z.string().optional(),
});

export const dashboardGetTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_dashboard_get",
  description: "Get the company dashboard with summary metrics.",
  inputSchema,
  handler: async (input, { client }) => {
    const companyId = client.resolveCompanyId(input.companyId);
    return client.request("GET", `/api/companies/${encodeURIComponent(companyId)}/dashboard`);
  },
};
