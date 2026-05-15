import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { agentInstructionsPatchTool } from "../../src/tools/agent-instructions-patch.js";
import { PaperclipClient } from "../../src/client.js";

describe("agent_instructions_patch", () => {
  beforeEach(() => mock.restore());

  it("PATCHes instructions-bundle with provided fields", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const spy = spyOn(client, "request").mockResolvedValueOnce({ agentsContent: "updated" });
    await agentInstructionsPatchTool.handler({ agentId: "A1", agentsContent: "updated" }, { client });
    expect(spy).toHaveBeenCalledWith("PATCH", "/api/agents/A1/instructions-bundle?companyId=C1", { agentsContent: "updated" });
  });

  it("rejects when no content field provided", async () => {
    await expect(
      agentInstructionsPatchTool.inputSchema.parseAsync({ agentId: "A1" }),
    ).rejects.toThrow();
  });
});
