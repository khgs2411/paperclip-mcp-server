import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { agentGetTool } from "../../src/tools/agent-get.js";
import { PaperclipClient } from "../../src/client.js";

describe("agent_get", () => {
  beforeEach(() => mock.restore());

  it("GETs agent by ID with companyId query and returns compact shape", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const spy = spyOn(client, "request").mockResolvedValueOnce({
      id: "A1", name: "Atlas", urlKey: "atlas", role: "ceo", title: "CEO", reportsTo: null, capabilities: null, status: "idle",
    });
    const result = await agentGetTool.handler({ agentId: "A1" }, { client });
    expect(spy).toHaveBeenCalledWith("GET", "/api/agents/A1?companyId=C1");
    expect(result).toEqual({ id: "A1", name: "Atlas", urlKey: "atlas", role: "ceo", title: "CEO", reportsTo: null, capabilities: null, status: "idle" });
  });
});
