import { z } from "zod";
import type { ToolDefinition } from "./index.js";

const inputSchema = z.object({
  agentId: z.string().min(1),
  companyId: z.string().optional(),
  skills: z.array(z.string()),
  mode: z.enum(["replace", "merge"]).default("merge"),
});

export const skillSyncTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_skill_sync",
  description:
    "Set or merge an agent's desiredSkills list. mode='replace' overwrites; mode='merge' (default) unions with existing skills fetched from /api/agents/:id.",
  inputSchema,
  handler: async (input, { client }) => {
    const companyId = client.resolveCompanyId(input.companyId);
    let desiredSkills = input.skills;

    if (input.mode === "merge") {
      const detail = (await client.request(
        "GET",
        `/api/agents/${encodeURIComponent(input.agentId)}?companyId=${encodeURIComponent(companyId)}`,
      )) as { adapterConfig?: { paperclipSkillSync?: { desiredSkills?: string[] } } };
      const current = detail.adapterConfig?.paperclipSkillSync?.desiredSkills ?? [];
      desiredSkills = Array.from(new Set([...current, ...input.skills]));
    }

    // Response is SkillSnapshot: { adapterType, supported, mode, desiredSkills, entries, warnings }
    const snapshot = (await client.request(
      "POST",
      `/api/agents/${encodeURIComponent(input.agentId)}/skills/sync?companyId=${encodeURIComponent(companyId)}`,
      { desiredSkills },
    )) as { desiredSkills?: string[] };

    return {
      agentId: input.agentId,
      desiredSkills: snapshot.desiredSkills ?? desiredSkills,
    };
  },
};
