import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { agentWakeupTool } from "../../src/tools/agent-wakeup.js";
import { PaperclipClient } from "../../src/client.js";

describe("agent_wakeup", () => {
  beforeEach(() => mock.restore());

  it("POSTs wakeup and returns triggered: true", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const spy = spyOn(client, "request").mockResolvedValueOnce({});
    const result = await agentWakeupTool.handler({ agentId: "A1" }, { client });
    expect(spy).toHaveBeenCalledWith("POST", "/api/agents/A1/wakeup?companyId=C1", {});
    expect(result).toEqual({ agentId: "A1", triggered: true });
  });

  it("includes issueId in body when provided", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const spy = spyOn(client, "request").mockResolvedValueOnce({});
    await agentWakeupTool.handler({ agentId: "A1", issueId: "I1" }, { client });
    expect(spy).toHaveBeenCalledWith("POST", "/api/agents/A1/wakeup?companyId=C1", { issueId: "I1" });
  });
});
