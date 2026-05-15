import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { agentInstructionsFileDeleteTool } from "../../src/tools/agent-instructions-file-delete.js";
import { PaperclipClient } from "../../src/client.js";

describe("agent_instructions_file_delete", () => {
  beforeEach(() => mock.restore());

  it("DELETEs the file endpoint with filePath query param and returns deleted shape", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const requestSpy = spyOn(client, "request").mockResolvedValueOnce({});

    const result = await agentInstructionsFileDeleteTool.handler(
      { agentId: "A1", filePath: "AGENTS.md" },
      { client },
    );

    expect(requestSpy).toHaveBeenCalledWith(
      "DELETE",
      "/api/agents/A1/instructions-bundle/file?companyId=C1&filePath=AGENTS.md",
    );
    expect(result).toEqual({ filePath: "AGENTS.md", deleted: true });
  });

  it("URL-encodes filePath with spaces", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const spy = spyOn(client, "request").mockResolvedValueOnce({});
    await agentInstructionsFileDeleteTool.handler(
      { agentId: "A1", filePath: "my file.md" },
      { client },
    );
    expect(spy).toHaveBeenCalledWith(
      "DELETE",
      "/api/agents/A1/instructions-bundle/file?companyId=C1&filePath=my%20file.md",
    );
  });
});
