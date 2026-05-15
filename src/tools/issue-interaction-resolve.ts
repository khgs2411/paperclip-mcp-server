import { z } from "zod";
import type { ToolDefinition } from "./index.js";
import { ToolInputError } from "../shared/errors.js";

const inputSchema = z.object({
  issueId: z
    .string()
    .min(1)
    .describe("Issue UUID or TOP-N identifier that owns the interaction"),
  interactionId: z
    .string()
    .min(1)
    .describe("ID of the interaction to resolve"),
  action: z
    .enum(["accept", "reject", "respond", "cancel"])
    .describe(
      "Action to take. confirmation → accept|reject. question → respond|cancel.",
    ),
  response: z
    .string()
    .optional()
    .describe("Required when action=respond; the text response to the question"),
});

export const issueInteractionResolveTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_issue_interaction_resolve",
  description:
    "Resolve a pending issue interaction. Routes to the correct endpoint based on action. " +
    "Kind→action table: confirmation → accept|reject; question → respond|cancel.",
  inputSchema,
  handler: async (input, { client }) => {
    const { issueId, interactionId, action, response } = input;

    if (action === "respond" && !response) {
      throw new ToolInputError("response", "required when action=respond");
    }

    const body: Record<string, unknown> = action === "respond" && response
      ? { response }
      : {};

    const raw = await client.request(
      "POST",
      `/api/issues/${encodeURIComponent(issueId)}/interactions/${encodeURIComponent(interactionId)}/${action}`,
      body,
    ) as { id?: string; status?: string; resolvedAt?: string; kind?: string };

    return {
      id: raw.id,
      status: raw.status,
      ...(raw.resolvedAt !== undefined && { resolvedAt: raw.resolvedAt }),
      ...(raw.kind !== undefined && { kind: raw.kind }),
    };
  },
};
