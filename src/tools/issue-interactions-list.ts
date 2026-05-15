import { z } from "zod";
import type { ToolDefinition } from "./index.js";

const inputSchema = z.object({
  issueId: z
    .string()
    .min(1)
    .describe("Issue UUID or TOP-N identifier to list interactions for"),
  status: z
    .string()
    .optional()
    .default("pending")
    .describe("Filter by interaction status (default: pending)"),
});

interface RawInteraction {
  id: string;
  issueIdentifier?: string;
  kind?: string;
  status?: string;
  prompt?: string;
  options?: unknown[];
  createdAt?: string;
  createdByAgentId?: string;
}

export const issueInteractionsListTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_issue_interactions_list",
  description:
    "List interactions (confirmations, questions) for a specific issue. Returns compact interaction records with prompt truncated to 200 chars.",
  inputSchema,
  handler: async (input, { client }) => {
    const qs = `status=${encodeURIComponent(input.status ?? "pending")}`;
    const raw = (await client.request(
      "GET",
      `/api/issues/${encodeURIComponent(input.issueId)}/interactions?${qs}`,
    )) as RawInteraction[];

    return raw.map((item) => ({
      id: item.id,
      issueIdentifier: item.issueIdentifier,
      kind: item.kind,
      status: item.status,
      prompt: item.prompt?.slice(0, 200) ?? null,
      createdAt: item.createdAt,
      createdByAgentId: item.createdByAgentId,
      ...(item.options !== undefined && { options: item.options }),
    }));
  },
};
