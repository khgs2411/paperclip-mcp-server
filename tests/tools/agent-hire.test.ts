import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { agentHireTool } from "../../src/tools/agent-hire.js";
import { PaperclipClient } from "../../src/client.js";

describe("agent_hire", () => {
  beforeEach(() => mock.restore());

  it("POSTs to agent-hires and returns compact shape", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const spy = spyOn(client, "request").mockResolvedValueOnce({ id: "H1", name: "NewBot", status: "pending" });
    const result = await agentHireTool.handler({ name: "NewBot", role: "developer" }, { client });
    expect(spy).toHaveBeenCalledWith("POST", "/api/companies/C1/agent-hires", { name: "NewBot", role: "developer" });
    expect(result).toEqual({ id: "H1", name: "NewBot", status: "pending" });
  });
});
