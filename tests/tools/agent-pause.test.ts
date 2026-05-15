import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { agentPauseTool } from "../../src/tools/agent-pause.js";
import { PaperclipClient } from "../../src/client.js";

describe("agent_pause", () => {
  beforeEach(() => mock.restore());

  it("POSTs to agent pause endpoint and returns paused shape", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const requestSpy = spyOn(client, "request").mockResolvedValueOnce({});

    const result = await agentPauseTool.handler({ agentId: "A1" }, { client });

    expect(requestSpy).toHaveBeenCalledWith("POST", "/api/agents/A1/pause?companyId=C1");
    expect(result).toEqual({ agentId: "A1", paused: true });
  });

  it("uses overridden companyId when provided", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const spy = spyOn(client, "request").mockResolvedValueOnce({});
    await agentPauseTool.handler({ agentId: "A1", companyId: "C2" }, { client });
    expect(spy).toHaveBeenCalledWith("POST", "/api/agents/A1/pause?companyId=C2");
  });
});
