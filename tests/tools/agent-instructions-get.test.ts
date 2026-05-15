import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { agentInstructionsGetTool } from "../../src/tools/agent-instructions-get.js";
import { PaperclipClient } from "../../src/client.js";

describe("agent_instructions_get", () => {
  beforeEach(() => mock.restore());

  it("GETs instructions bundle and returns pass-through", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const bundle = { agentsContent: "# Agents", heartbeatContent: "# HB" };
    const spy = spyOn(client, "request").mockResolvedValueOnce(bundle);
    const result = await agentInstructionsGetTool.handler({ agentId: "A1" }, { client });
    expect(spy).toHaveBeenCalledWith("GET", "/api/agents/A1/instructions-bundle?companyId=C1");
    expect(result).toEqual(bundle);
  });
});
