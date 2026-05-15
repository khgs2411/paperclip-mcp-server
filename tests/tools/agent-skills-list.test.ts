import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { agentSkillsListTool } from "../../src/tools/agent-skills-list.js";
import { PaperclipClient } from "../../src/client.js";

describe("agent_skills_list", () => {
  beforeEach(() => mock.restore());

  it("GETs the agent skills endpoint and passes through raw response", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const snapshot = { adapterType: "claude", supported: true, desiredSkills: ["skill-a"], entries: [] };
    const requestSpy = spyOn(client, "request").mockResolvedValueOnce(snapshot);

    const result = await agentSkillsListTool.handler({ agentId: "A1" }, { client });

    expect(requestSpy).toHaveBeenCalledWith("GET", "/api/agents/A1/skills?companyId=C1");
    expect(result).toEqual(snapshot);
  });

  it("uses overridden companyId when provided", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const spy = spyOn(client, "request").mockResolvedValueOnce({});
    await agentSkillsListTool.handler({ agentId: "A1", companyId: "C2" }, { client });
    expect(spy).toHaveBeenCalledWith("GET", "/api/agents/A1/skills?companyId=C2");
  });
});
