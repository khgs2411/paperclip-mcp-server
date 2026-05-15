import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { agentInstructionsFilePutTool } from "../../src/tools/agent-instructions-file-put.js";
import { PaperclipClient } from "../../src/client.js";

describe("agent_instructions_file_put", () => {
  beforeEach(() => mock.restore());

  it("PUTs file content and returns written: true", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const spy = spyOn(client, "request").mockResolvedValueOnce({});
    const result = await agentInstructionsFilePutTool.handler({ agentId: "A1", filePath: "AGENTS.md", content: "# Updated" }, { client });
    expect(spy).toHaveBeenCalledWith("PUT", "/api/agents/A1/instructions-bundle/file?companyId=C1", { filePath: "AGENTS.md", content: "# Updated" });
    expect(result).toEqual({ filePath: "AGENTS.md", written: true });
  });
});
