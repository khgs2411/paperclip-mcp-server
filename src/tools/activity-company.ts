import { z } from "zod";
import type { ToolDefinition } from "./index.js";
import { ToolInputError } from "../shared/errors.js";

type ActivityEvent = {
  id?: string;
  createdAt?: string | Date | null;
  [key: string]: unknown;
};

const inputSchema = z.object({
  companyId: z
    .string()
    .optional()
    .describe("Company ID (defaults to PAPERCLIP_COMPANY_ID env var)"),
  limit: z
    .number()
    .int()
    .positive()
    .max(500)
    .optional()
    .describe("Maximum activity rows to return. Defaults to 20, max 500."),
  since: z
    .string()
    .datetime({ offset: true })
    .optional()
    .describe("Inclusive lower createdAt bound for the requested activity window."),
  before: z
    .string()
    .datetime({ offset: true })
    .optional()
    .describe("Exclusive upper createdAt bound. Currently rejected because the Paperclip activity API ignores it."),
  offset: z
    .number()
    .int()
    .nonnegative()
    .optional()
    .describe("Unsupported except for 0: the Paperclip activity API currently ignores offsets."),
  agentId: z.string().optional().describe("Filter activity rows by agent ID."),
  entityType: z.string().optional().describe("Filter activity rows by entity type."),
  entityId: z.string().optional().describe("Filter activity rows by entity ID."),
});

export const activityCompanyTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_activity_company",
  description:
    "Returns company-level activity feed with bounded-window request parameters and audit metadata. Defaults to limit=20, max 500.",
  inputSchema,
  handler: async (input, { client }) => {
    if (input.before !== undefined) {
      throw new ToolInputError(
        "before",
        "before is not supported because the Paperclip activity API currently ignores it",
      );
    }

    if (input.offset !== undefined && input.offset > 0) {
      throw new ToolInputError(
        "offset",
        "non-zero offset is not supported because the Paperclip activity API currently ignores it",
      );
    }

    const companyId = client.resolveCompanyId(input.companyId);
    const limit = input.limit ?? 20;
    const params = new URLSearchParams({ limit: String(limit) });
    if (input.since) params.set("since", input.since);
    if (input.offset !== undefined) params.set("offset", String(input.offset));
    if (input.agentId) params.set("agentId", input.agentId);
    if (input.entityType) params.set("entityType", input.entityType);
    if (input.entityId) params.set("entityId", input.entityId);

    const events = await client.request<ActivityEvent[]>(
      "GET",
      `/api/companies/${encodeURIComponent(companyId)}/activity?${params.toString()}`,
    );

    const timestamps = events
      .map((event) => event.createdAt)
      .filter((createdAt): createdAt is string | Date => Boolean(createdAt))
      .map((createdAt) => new Date(createdAt))
      .filter((createdAt) => !Number.isNaN(createdAt.getTime()));
    const sortedTimestamps = timestamps.sort((left, right) => left.getTime() - right.getTime());
    const oldestTimestamp = sortedTimestamps[0]?.toISOString() ?? null;
    const newestTimestamp = sortedTimestamps[sortedTimestamps.length - 1]?.toISOString() ?? null;
    const capped = events.length >= limit;

    return {
      events,
      meta: {
        requestedLimit: limit,
        returnedCount: events.length,
        capped,
        mayHaveMore: capped,
        requestedWindow: {
          since: input.since ?? null,
          before: input.before ?? null,
          offset: input.offset ?? 0,
        },
        observedWindow: {
          oldestTimestamp,
          newestTimestamp,
        },
        completeness:
          capped
            ? "capped_sample"
            : "complete_within_returned_query",
      },
    };
  },
};
