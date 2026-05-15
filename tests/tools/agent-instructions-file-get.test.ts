import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { agentInstructionsFileGetTool } from "../../src/tools/agent-instructions-file-get.js";
import { PaperclipClient } from "../../src/client.js";

describe("agent_instructions_file_get", () => {
  beforeEach(() => mock.restore());

  it("GETs the file endpoint with filePath query param and returns compact shape", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const requestSpy = spyOn(client, "request").mockResolvedValueOnce({
      filePath: "AGENTS.md",
      content: "# Hello",
    });

    const result = await agentInstructionsFileGetTool.handler(
      { agentId: "A1", filePath: "AGENTS.md" },
      { client },
    );

    expect(requestSpy).toHaveBeenCalledWith(
      "GET",
      "/api/agents/A1/instructions-bundle/file?companyId=C1&filePath=AGENTS.md",
    );
    expect(result).toEqual({ filePath: "AGENTS.md", content: "# Hello" });
  });

  it("URL-encodes filePath with spaces", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const spy = spyOn(client, "request").mockResolvedValueOnce({ filePath: "my file.md", content: "" });
    await agentInstructionsFileGetTool.handler({ agentId: "A1", filePath: "my file.md" }, { client });
    expect(spy).toHaveBeenCalledWith(
      "GET",
      "/api/agents/A1/instructions-bundle/file?companyId=C1&filePath=my%20file.md",
    );
  });
});
