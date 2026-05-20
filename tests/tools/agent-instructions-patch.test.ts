import { createHash } from "node:crypto";
import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { agentInstructionsPatchTool } from "../../src/tools/agent-instructions-patch.js";
import { PaperclipClient } from "../../src/client.js";

function sha256(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

describe("agent_instructions_patch", () => {
  beforeEach(() => mock.restore());

  it("writes supplied sections through file endpoint, reads back, and returns verified metadata", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const requestSpy = spyOn(client, "request")
      .mockResolvedValueOnce({ path: "AGENTS.md", size: 9 })
      .mockResolvedValueOnce({ path: "AGENTS.md", content: "# Agents\n" })
      .mockResolvedValueOnce({ path: "HEARTBEAT.md", size: 12 })
      .mockResolvedValueOnce({ path: "HEARTBEAT.md", content: "# Heartbeat\n" })
      .mockResolvedValueOnce({ path: "SOUL.md", size: 7 })
      .mockResolvedValueOnce({ path: "SOUL.md", content: "# Soul\n" })
      .mockResolvedValueOnce({ path: "TOOLS.md", size: 8 })
      .mockResolvedValueOnce({ path: "TOOLS.md", content: "# Tools\n" });

    const result = await agentInstructionsPatchTool.handler(
      {
        agentId: "A1",
        agentsContent: "# Agents\n",
        heartbeatContent: "# Heartbeat\n",
        soulContent: "# Soul\n",
        toolsContent: "# Tools\n",
      },
      { client },
    );

    expect(requestSpy).toHaveBeenNthCalledWith(
      1,
      "PUT",
      "/api/agents/A1/instructions-bundle/file?companyId=C1",
      { path: "AGENTS.md", content: "# Agents\n" },
    );
    expect(requestSpy).toHaveBeenNthCalledWith(
      2,
      "GET",
      "/api/agents/A1/instructions-bundle/file?companyId=C1&path=AGENTS.md",
    );
    expect(requestSpy).toHaveBeenNthCalledWith(
      3,
      "PUT",
      "/api/agents/A1/instructions-bundle/file?companyId=C1",
      { path: "HEARTBEAT.md", content: "# Heartbeat\n" },
    );
    expect(requestSpy).toHaveBeenNthCalledWith(
      4,
      "GET",
      "/api/agents/A1/instructions-bundle/file?companyId=C1&path=HEARTBEAT.md",
    );
    expect(requestSpy).toHaveBeenNthCalledWith(
      5,
      "PUT",
      "/api/agents/A1/instructions-bundle/file?companyId=C1",
      { path: "SOUL.md", content: "# Soul\n" },
    );
    expect(requestSpy).toHaveBeenNthCalledWith(
      6,
      "GET",
      "/api/agents/A1/instructions-bundle/file?companyId=C1&path=SOUL.md",
    );
    expect(requestSpy).toHaveBeenNthCalledWith(
      7,
      "PUT",
      "/api/agents/A1/instructions-bundle/file?companyId=C1",
      { path: "TOOLS.md", content: "# Tools\n" },
    );
    expect(requestSpy).toHaveBeenNthCalledWith(
      8,
      "GET",
      "/api/agents/A1/instructions-bundle/file?companyId=C1&path=TOOLS.md",
    );

    expect(result).toEqual({
      agentId: "A1",
      updatedFiles: [
        {
          field: "agentsContent",
          filePath: "AGENTS.md",
          sizeBytes: Buffer.byteLength("# Agents\n"),
          sha256: sha256("# Agents\n"),
        },
        {
          field: "heartbeatContent",
          filePath: "HEARTBEAT.md",
          sizeBytes: Buffer.byteLength("# Heartbeat\n"),
          sha256: sha256("# Heartbeat\n"),
        },
        {
          field: "soulContent",
          filePath: "SOUL.md",
          sizeBytes: Buffer.byteLength("# Soul\n"),
          sha256: sha256("# Soul\n"),
        },
        {
          field: "toolsContent",
          filePath: "TOOLS.md",
          sizeBytes: Buffer.byteLength("# Tools\n"),
          sha256: sha256("# Tools\n"),
        },
      ],
      agentsContent: "# Agents\n",
      heartbeatContent: "# Heartbeat\n",
      soulContent: "# Soul\n",
      toolsContent: "# Tools\n",
    });
  });

  it("rejects when readback content does not match the supplied section", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const requestSpy = spyOn(client, "request")
      .mockResolvedValueOnce({ path: "HEARTBEAT.md", size: 3 })
      .mockResolvedValueOnce({ path: "HEARTBEAT.md", content: "old" });

    await expect(
      agentInstructionsPatchTool.handler({ agentId: "A1", heartbeatContent: "new" }, { client }),
    ).rejects.toThrow(
      "instructions patch did not persist HEARTBEAT.md; readback content did not match supplied heartbeatContent",
    );

    expect(requestSpy).toHaveBeenCalledTimes(2);
  });

  it("rejects when readback does not include string content", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    spyOn(client, "request")
      .mockResolvedValueOnce({ path: "TOOLS.md", size: 9 })
      .mockResolvedValueOnce({ path: "TOOLS.md" });

    await expect(
      agentInstructionsPatchTool.handler(
        { agentId: "A1", toolsContent: "# Tools\n" },
        { client },
      ),
    ).rejects.toThrow(
      "instructions patch did not persist TOOLS.md; readback content did not match supplied toolsContent",
    );
  });

  it("supports a single supplied section and companyId override", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const requestSpy = spyOn(client, "request")
      .mockResolvedValueOnce({ path: "SOUL.md", size: 7 })
      .mockResolvedValueOnce({ path: "SOUL.md", content: "# Soul\n" });

    const result = await agentInstructionsPatchTool.handler(
      { agentId: "A1", companyId: "C2", soulContent: "# Soul\n" },
      { client },
    );

    expect(requestSpy).toHaveBeenNthCalledWith(
      1,
      "PUT",
      "/api/agents/A1/instructions-bundle/file?companyId=C2",
      { path: "SOUL.md", content: "# Soul\n" },
    );
    expect(requestSpy).toHaveBeenNthCalledWith(
      2,
      "GET",
      "/api/agents/A1/instructions-bundle/file?companyId=C2&path=SOUL.md",
    );
    expect(result).toEqual({
      agentId: "A1",
      updatedFiles: [
        {
          field: "soulContent",
          filePath: "SOUL.md",
          sizeBytes: Buffer.byteLength("# Soul\n"),
          sha256: sha256("# Soul\n"),
        },
      ],
      soulContent: "# Soul\n",
    });
  });

  it("rejects when no content fields are provided", async () => {
    await expect(
      agentInstructionsPatchTool.inputSchema.parseAsync({ agentId: "A1" }),
    ).rejects.toThrow();
  });
});
