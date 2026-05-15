import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { agentInstructionsGetTool } from "../../src/tools/agent-instructions-get.js";
import { PaperclipClient } from "../../src/client.js";

describe("agent_instructions_get", () => {
  beforeEach(() => mock.restore());

  it("GETs the instructions-bundle endpoint and passes through raw response", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const bundle = { agentsContent: "# Agent", heartbeatContent: "# HB", files: [] };
    const requestSpy = spyOn(client, "request").mockResolvedValueOnce(bundle);

    const result = await agentInstructionsGetTool.handler({ agentId: "A1" }, { client });

    expect(requestSpy).toHaveBeenCalledWith(
      "GET",
      "/api/agents/A1/instructions-bundle?companyId=C1",
    );
    expect(result).toEqual(bundle);
  });

  it("uses overridden companyId when provided", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const spy = spyOn(client, "request").mockResolvedValueOnce({});
    await agentInstructionsGetTool.handler({ agentId: "A1", companyId: "C2" }, { client });
    expect(spy).toHaveBeenCalledWith("GET", "/api/agents/A1/instructions-bundle?companyId=C2");
  });
});
