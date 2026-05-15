import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { agentSkillsListTool } from "../../src/tools/agent-skills-list.js";
import { PaperclipClient } from "../../src/client.js";

describe("agent_skills_list", () => {
  beforeEach(() => mock.restore());

  it("GETs agent skills snapshot and returns pass-through", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const snapshot = { adapterType: "claude_local", supported: true, desiredSkills: ["a"], entries: [], warnings: [] };
    const spy = spyOn(client, "request").mockResolvedValueOnce(snapshot);
    const result = await agentSkillsListTool.handler({ agentId: "A1" }, { client });
    expect(spy).toHaveBeenCalledWith("GET", "/api/agents/A1/skills?companyId=C1");
    expect(result).toEqual(snapshot);
  });
});
