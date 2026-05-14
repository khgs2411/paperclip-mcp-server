import { describe, it, expect, beforeAll } from "bun:test";
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PaperclipClient } from "../../src/client.js";
import { agentPatchTool } from "../../src/tools/agent-patch.js";
import { skillSyncTool } from "../../src/tools/skill-sync.js";
import { boardChannelAppendTool } from "../../src/tools/board-channel-append.js";

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

  it("board_channel_append: writes to a temp file and produces today's dated section", async () => {
    const dir = mkdtempSync(join(tmpdir(), "bc-int-"));
    const file = join(dir, "BOARD_CHANNEL.md");
    writeFileSync(
      file,
      `# Board Channel\n\n## Log\n\n<!-- Atlas writes below this line. Newest day on top. -->\n`,
    );
    try {
      const result = await boardChannelAppendTool.handler(
        { entry: "smoke test entry", filePath: file },
        { client },
      );
      expect((result as { appended: boolean }).appended).toBe(true);
      const content = readFileSync(file, "utf8");
      const today = new Date().toISOString().slice(0, 10);
      expect(content).toContain(`## ${today}`);
      expect(content).toContain("smoke test entry");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
