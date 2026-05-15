import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { agentSkillSyncTool } from "../../src/tools/agent-skill-sync.js";
import { PaperclipClient } from "../../src/client.js";

describe("agent_skill_sync", () => {
  beforeEach(() => mock.restore());

  it("merges skills by default and POSTs to skills/sync", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const spy = spyOn(client, "request")
      .mockResolvedValueOnce({
        adapterConfig: { paperclipSkillSync: { desiredSkills: ["existing-skill"] } },
      })
      .mockResolvedValueOnce({ desiredSkills: ["existing-skill", "new-skill"] });

    const result = await agentSkillSyncTool.handler(
      { agentId: "A1", skills: ["new-skill"], mode: "merge" },
      { client },
    );

    expect(spy).toHaveBeenNthCalledWith(1, "GET", "/api/agents/A1?companyId=C1");
    expect(spy).toHaveBeenNthCalledWith(2, "POST", "/api/agents/A1/skills/sync?companyId=C1", {
      desiredSkills: ["existing-skill", "new-skill"],
    });
    expect(result).toEqual({ agentId: "A1", desiredSkills: ["existing-skill", "new-skill"] });
  });

  it("replaces skills when mode is replace", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const spy = spyOn(client, "request").mockResolvedValueOnce({ desiredSkills: ["skill-a"] });

    await agentSkillSyncTool.handler(
      { agentId: "A1", skills: ["skill-a"], mode: "replace" },
      { client },
    );

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith("POST", "/api/agents/A1/skills/sync?companyId=C1", {
      desiredSkills: ["skill-a"],
    });
  });
});
