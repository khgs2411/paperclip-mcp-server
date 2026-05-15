import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { agentSkillSyncTool } from "../../src/tools/agent-skill-sync.js";
import { PaperclipClient } from "../../src/client.js";

describe("agent_skill_sync", () => {
  beforeEach(() => mock.restore());

  it("replace mode POSTs the input list directly", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const spy = spyOn(client, "request").mockResolvedValueOnce({ desiredSkills: ["a", "b"] });
    const result = await agentSkillSyncTool.handler({ agentId: "A1", skills: ["a", "b"], mode: "replace" }, { client });
    expect(spy).toHaveBeenCalledWith("POST", "/api/agents/A1/skills/sync?companyId=C1", { desiredSkills: ["a", "b"] });
    expect(result).toEqual({ agentId: "A1", desiredSkills: ["a", "b"] });
  });

  it("merge mode fetches current then POSTs the union", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    spyOn(client, "request")
      .mockResolvedValueOnce({ adapterConfig: { paperclipSkillSync: { desiredSkills: ["x"] } } })
      .mockResolvedValueOnce({ desiredSkills: ["x", "z"] });
    const result = await agentSkillSyncTool.handler({ agentId: "A1", skills: ["z"], mode: "merge" }, { client });
    expect(result).toEqual({ agentId: "A1", desiredSkills: ["x", "z"] });
  });
});
