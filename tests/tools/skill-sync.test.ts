import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { skillSyncTool } from "../../src/tools/skill-sync.js";
import { PaperclipClient } from "../../src/client.js";

describe("skill_sync", () => {
  beforeEach(() => mock.restore());

  it("replace mode POSTs the input list and reads top-level desiredSkills from the SkillSnapshot response", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const spy = spyOn(client, "request").mockResolvedValueOnce({
      adapterType: "claude_local",
      supported: true,
      mode: "managed",
      desiredSkills: ["a", "b"],
      entries: [],
      warnings: [],
    });
    const result = await skillSyncTool.handler(
      { agentId: "A1", skills: ["a", "b"], mode: "replace" },
      { client },
    );
    expect(spy).toHaveBeenCalledWith(
      "POST",
      "/api/agents/A1/skills/sync?companyId=C1",
      { desiredSkills: ["a", "b"] },
    );
    expect(result).toEqual({ agentId: "A1", desiredSkills: ["a", "b"] });
  });

  it("merge mode fetches current from AgentDetail then POSTs the union; reads SkillSnapshot.desiredSkills from response", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const spy = spyOn(client, "request")
      .mockResolvedValueOnce({
        adapterConfig: { paperclipSkillSync: { desiredSkills: ["x", "y"] } },
      })
      .mockResolvedValueOnce({
        adapterType: "claude_local",
        supported: true,
        mode: "managed",
        desiredSkills: ["x", "y", "z"],
        entries: [],
        warnings: [],
      });
    const result = await skillSyncTool.handler(
      { agentId: "A1", skills: ["z"], mode: "merge" },
      { client },
    );
    expect(spy).toHaveBeenNthCalledWith(1, "GET", "/api/agents/A1?companyId=C1");
    expect(spy).toHaveBeenNthCalledWith(2, "POST", "/api/agents/A1/skills/sync?companyId=C1", {
      desiredSkills: ["x", "y", "z"],
    });
    expect(result).toEqual({ agentId: "A1", desiredSkills: ["x", "y", "z"] });
  });
});
