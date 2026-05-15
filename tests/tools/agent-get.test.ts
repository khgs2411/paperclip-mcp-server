import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { agentGetTool } from "../../src/tools/agent-get.js";
import { PaperclipClient } from "../../src/client.js";

describe("agent_get", () => {
  beforeEach(() => mock.restore());

  it("GETs the agent endpoint with companyId query and returns compact shape", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const requestSpy = spyOn(client, "request").mockResolvedValueOnce({
      id: "A1",
      name: "Atlas",
      urlKey: "atlas",
      role: "ceo",
      title: "Chief Executive",
      reportsTo: null,
      capabilities: "planning",
      status: "idle",
      extraField: "ignored",
    });

    const result = await agentGetTool.handler({ agentId: "A1" }, { client });

    expect(requestSpy).toHaveBeenCalledWith("GET", "/api/agents/A1?companyId=C1");
    expect(result).toEqual({
      id: "A1",
      name: "Atlas",
      urlKey: "atlas",
      role: "ceo",
      title: "Chief Executive",
      reportsTo: null,
      capabilities: "planning",
      status: "idle",
    });
  });

  it("uses overridden companyId when provided", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const spy = spyOn(client, "request").mockResolvedValueOnce({
      id: "A1",
      name: "Atlas",
      urlKey: "atlas",
      role: "ceo",
      status: "idle",
    });
    await agentGetTool.handler({ agentId: "A1", companyId: "C2" }, { client });
    expect(spy).toHaveBeenCalledWith("GET", "/api/agents/A1?companyId=C2");
  });
});
