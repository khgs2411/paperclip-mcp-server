import { describe, it, expect, beforeAll } from "bun:test";
import { PaperclipClient } from "../../src/client.js";
import { agentPatchTool } from "../../src/tools/agent-patch.js";
import { skillSyncTool } from "../../src/tools/skill-sync.js";

const apiBase = process.env["PAPERCLIP_API_BASE"] ?? "http://127.0.0.1:3100";
const companyId = process.env["PAPERCLIP_COMPANY_ID"];

describe.skipIf(!companyId)("integration smoke (requires live Paperclip)", () => {
  let client: PaperclipClient;
  let firstAgentId: string;

  beforeAll(async () => {
    client = new PaperclipClient({ apiBase, defaultCompanyId: companyId });
    const healthy = await client.healthCheck();
    if (!healthy) throw new Error("Paperclip not reachable at " + apiBase);
    const agents = (await client.request(
      "GET",
      `/api/companies/${companyId}/agents`,
    )) as Array<{ id: string }>;
    if (agents.length === 0) throw new Error("No agents in the live instance to exercise");
    firstAgentId = agents[0]!.id;
  });

  it("agent_patch: no-op capability round-trip", async () => {
    const detail = (await client.request(
      "GET",
      `/api/agents/${firstAgentId}?companyId=${companyId}`,
    )) as { capabilities: string | null };
    const result = await agentPatchTool.handler(
      { agentId: firstAgentId, capabilities: detail.capabilities ?? "" },
      { client },
    );
    expect((result as { id: string }).id).toBe(firstAgentId);
  });

  it("skill_sync: replace-with-current-skills is a safe no-op and parses SkillSnapshot correctly", async () => {
    const detail = (await client.request(
      "GET",
      `/api/agents/${firstAgentId}?companyId=${companyId}`,
    )) as { adapterConfig?: { paperclipSkillSync?: { desiredSkills?: string[] } } };
    const current = detail.adapterConfig?.paperclipSkillSync?.desiredSkills ?? [];
    const result = await skillSyncTool.handler(
      { agentId: firstAgentId, skills: current, mode: "replace" },
      { client },
    );
    expect((result as { agentId: string }).agentId).toBe(firstAgentId);
    expect(Array.isArray((result as { desiredSkills: unknown }).desiredSkills)).toBe(true);
  });

});
