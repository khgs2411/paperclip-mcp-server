import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { agentListTool } from "../../src/tools/agent-list.js";
import { PaperclipClient } from "../../src/client.js";

describe("agent_list", () => {
  beforeEach(() => mock.restore());

  it("GETs the company agents endpoint and returns compact shapes", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const requestSpy = spyOn(client, "request").mockResolvedValueOnce([
      { id: "A1", name: "Atlas", urlKey: "atlas", role: "ceo", status: "idle", extraField: "x" },
      { id: "A2", name: "Vesta", urlKey: "vesta", role: "ops", status: "running" },
    ]);

    const result = await agentListTool.handler({}, { client });

    expect(requestSpy).toHaveBeenCalledWith("GET", "/api/companies/C1/agents");
    expect(result).toEqual([
      { id: "A1", name: "Atlas", urlKey: "atlas", role: "ceo", status: "idle" },
      { id: "A2", name: "Vesta", urlKey: "vesta", role: "ops", status: "running" },
    ]);
  });

  it("uses overridden companyId when provided", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const spy = spyOn(client, "request").mockResolvedValueOnce([]);
    await agentListTool.handler({ companyId: "C2" }, { client });
    expect(spy).toHaveBeenCalledWith("GET", "/api/companies/C2/agents");
  });
});
