import { z } from "zod";
import type { ToolDefinition } from "./index.js";

const inputSchema = z.object({
  companyId: z.string().optional(),
});

export const sidebarBadgesTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_sidebar_badges",
  description: "Get sidebar badge counts (unread, pending interactions, etc.).",
  inputSchema,
  handler: async (input, { client }) => {
    const companyId = client.resolveCompanyId(input.companyId);
    return client.request("GET", `/api/companies/${encodeURIComponent(companyId)}/sidebar-badges`);
  },
};
