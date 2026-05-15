import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { PaperclipClient } from "../../src/client.js";
import { ToolInputError } from "../../src/shared/errors.js";
import { agentInstructionsSafeGetTool } from "../../src/tools/agent-instructions-safe-get.js";

describe("agent_instructions_safe_get", () => {
  beforeEach(() => mock.restore());

  it("returns metadata and hashes without dumping full file bodies by default", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const requestSpy = spyOn(client, "request").mockResolvedValueOnce({
      agentId: "A1",
      mode: "managed",
      entryFile: "AGENTS.md",
      files: [
        { path: "AGENTS.md", content: "secret body" },
        { path: "HEARTBEAT.md", content: "heartbeat body" },
      ],
      warnings: ["local override present"],
    });

    const result = await agentInstructionsSafeGetTool.handler({ agentId: "A1" }, { client });

    expect(requestSpy).toHaveBeenCalledWith(
      "GET",
      "/api/agents/A1/instructions-bundle?companyId=C1",
    );
    expect(JSON.stringify(result)).not.toContain("secret body");
    expect(result).toMatchObject({
      agentId: "A1",
      mode: "managed",
      entryFile: "AGENTS.md",
      warnings: ["local override present"],
      files: [
        { filePath: "AGENTS.md", sizeBytes: 11 },
        { filePath: "HEARTBEAT.md", sizeBytes: 14 },
      ],
    });
  });

  it("returns single-file content only when filePath is explicit", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    spyOn(client, "request").mockResolvedValueOnce({ path: "AGENTS.md", content: "# Agent" });

    const result = await agentInstructionsSafeGetTool.handler(
      { agentId: "A1", filePath: "AGENTS.md" },
      { client },
    );

    expect(result).toMatchObject({
      agentId: "A1",
      filePath: "AGENTS.md",
      sizeBytes: 7,
      content: "# Agent",
    });
  });

  it("rejects traversal file paths before calling the API", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const requestSpy = spyOn(client, "request").mockResolvedValueOnce({});

    await expect(
      agentInstructionsSafeGetTool.handler({ agentId: "A1", filePath: "../AGENTS.md" }, { client }),
    ).rejects.toBeInstanceOf(ToolInputError);
    expect(requestSpy).not.toHaveBeenCalled();
  });
});
