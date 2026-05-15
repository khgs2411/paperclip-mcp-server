import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { agentInstructionsFileDeleteTool } from "../../src/tools/agent-instructions-file-delete.js";
import { PaperclipClient } from "../../src/client.js";

describe("agent_instructions_file_delete", () => {
  beforeEach(() => mock.restore());

  it("DELETEs file and returns deleted: true", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const spy = spyOn(client, "request").mockResolvedValueOnce(undefined);
    const result = await agentInstructionsFileDeleteTool.handler({ agentId: "A1", filePath: "SOUL.md" }, { client });
    expect(spy).toHaveBeenCalledWith("DELETE", "/api/agents/A1/instructions-bundle/file?companyId=C1&filePath=SOUL.md");
    expect(result).toEqual({ filePath: "SOUL.md", deleted: true });
  });
});
