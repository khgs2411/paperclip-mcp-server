import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { agentListTool } from "../../src/tools/agent-list.js";
import { PaperclipClient } from "../../src/client.js";

describe("agent_list", () => {
  beforeEach(() => mock.restore());

  it("GETs company agents and returns compact array", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const spy = spyOn(client, "request").mockResolvedValueOnce([
      { id: "A1", name: "Atlas", urlKey: "atlas", role: "ceo", status: "idle", extra: "ignored" },
    ]);
    const result = await agentListTool.handler({ }, { client });
    expect(spy).toHaveBeenCalledWith("GET", "/api/companies/C1/agents");
    expect(result).toEqual([{ id: "A1", name: "Atlas", urlKey: "atlas", role: "ceo", status: "idle" }]);
  });
});
