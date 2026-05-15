import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { agentInstructionsPatchTool } from "../../src/tools/agent-instructions-patch.js";
import { PaperclipClient } from "../../src/client.js";

describe("agent_instructions_patch", () => {
  beforeEach(() => mock.restore());

  it("PATCHes the instructions-bundle endpoint and passes through raw response", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const responseBundle = { agentsContent: "# Updated" };
    const requestSpy = spyOn(client, "request").mockResolvedValueOnce(responseBundle);

    const result = await agentInstructionsPatchTool.handler(
      { agentId: "A1", agentsContent: "# Updated" },
      { client },
    );

    expect(requestSpy).toHaveBeenCalledWith(
      "PATCH",
      "/api/agents/A1/instructions-bundle?companyId=C1",
      { agentsContent: "# Updated" },
    );
    expect(result).toEqual(responseBundle);
  });

  it("rejects when no content fields are provided", async () => {
    await expect(
      agentInstructionsPatchTool.inputSchema.parseAsync({ agentId: "A1" }),
    ).rejects.toThrow();
  });
});
