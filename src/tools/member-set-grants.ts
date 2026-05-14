import { z } from "zod";
import type { ToolDefinition } from "./index.js";

const grantInputSchema = z.object({
  permissionKey: z.string(),
  scope: z.record(z.unknown()).nullable().optional(),
});

const inputSchema = z.object({
  memberId: z.string().min(1),
  principalType: z.enum(["agent", "user"]),
  principalId: z.string().min(1),
  companyId: z.string().min(1),
  grants: z.array(grantInputSchema),
  merge: z.boolean().default(false),
});

type GrantRecord = { permissionKey: string; scope?: Record<string, unknown> | null };

interface AgentDetail {
  access?: { grants?: GrantRecord[] };
}

interface MembersResponse {
  members: Array<{
    id: string;
    grants?: GrantRecord[];
  }>;
}

interface MemberRecord {
  id: string;
  principalType: string;
  principalId: string;
  grants?: GrantRecord[];
}

export const memberSetGrantsTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_member_set_grants",
  description:
    "Replace or merge a member's explicit grant set. merge=true unions with existing grants fetched per principalType: agents via /api/agents/:id, users via /api/companies/:cid/members. merge=false replaces wholesale.",
  inputSchema,
  handler: async (input, { client }) => {
    let grantsToSend = input.grants;
    if (input.merge) {
      let current: Array<{ permissionKey: string; scope?: unknown }> = [];
      if (input.principalType === "agent") {
        const detail = (await client.request(
          "GET",
          `/api/agents/${encodeURIComponent(input.principalId)}?companyId=${encodeURIComponent(input.companyId)}`,
        )) as AgentDetail;
        current = detail.access?.grants ?? [];
      } else {
        const list = (await client.request(
          "GET",
          `/api/companies/${encodeURIComponent(input.companyId)}/members`,
        )) as MembersResponse;
        const found = list.members.find((m) => m.id === input.memberId);
        current = found?.grants ?? [];
      }
      const byKey = new Map<string, { permissionKey: string; scope?: Record<string, unknown> | null }>();
      for (const g of current) {
        byKey.set(g.permissionKey, { permissionKey: g.permissionKey, scope: g.scope ?? null } as GrantRecord);
      }
      for (const g of input.grants) {
        byKey.set(g.permissionKey, { permissionKey: g.permissionKey, scope: g.scope ?? null } as GrantRecord);
      }
      grantsToSend = Array.from(byKey.values());
    }

    const raw = (await client.request(
      "PATCH",
      `/api/companies/${encodeURIComponent(input.companyId)}/members/${encodeURIComponent(input.memberId)}/permissions`,
      { grants: grantsToSend },
    )) as MemberRecord;

    return {
      memberId: raw.id,
      principalType: raw.principalType,
      principalId: raw.principalId,
      grants: raw.grants ?? [],
    };
  },
};
