import { describe, it, expect, spyOn, beforeEach, afterEach, mock } from "bun:test";
import { PaperclipClient } from "../../src/client.js";
import { PaperclipApiError, ToolInputError } from "../../src/shared/errors.js";
import { agentInstructionsSafePutTool } from "../../src/tools/agent-instructions-safe-put.js";

describe("agent_instructions_safe_put", () => {
  const originalRunId = process.env["PAPERCLIP_RUN_ID"];

  beforeEach(() => {
    mock.restore();
    delete process.env["PAPERCLIP_RUN_ID"];
  });

  afterEach(() => {
    if (originalRunId === undefined) delete process.env["PAPERCLIP_RUN_ID"];
    else process.env["PAPERCLIP_RUN_ID"] = originalRunId;
  });

  it("requires provenance and change summary and sends run audit metadata", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const requestSpy = spyOn(client, "request").mockResolvedValueOnce({ revision: 3 });

    const result = await agentInstructionsSafePutTool.handler(
      {
        agentId: "A1",
        filePath: "AGENTS.md",
        content: "# New content",
        changeSummary: "Clarify managed identity",
        provenanceIssueId: "TOP-171",
        runId: "run-1",
      },
      { client },
    );

    expect(requestSpy).toHaveBeenCalledWith(
      "PUT",
      "/api/agents/A1/instructions-bundle/file?companyId=C1",
      {
        path: "AGENTS.md",
        content: "# New content",
        changeSummary: "Clarify managed identity",
        provenanceIssueId: "TOP-171",
        runId: "run-1",
      },
      { "X-Paperclip-Run-Id": "run-1" },
    );
    expect(result).toMatchObject({
      agentId: "A1",
      filePath: "AGENTS.md",
      sizeBytes: 13,
      changeSummary: "Clarify managed identity",
      provenanceIssueId: "TOP-171",
      runId: "run-1",
      apiResponse: { revision: 3 },
    });
  });

  it("uses PAPERCLIP_RUN_ID when runId is omitted", async () => {
    process.env["PAPERCLIP_RUN_ID"] = "env-run";
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const requestSpy = spyOn(client, "request").mockResolvedValueOnce({});

    await agentInstructionsSafePutTool.handler(
      {
        agentId: "A1",
        filePath: "AGENTS.md",
        content: "x",
        changeSummary: "Update",
        provenanceIssueId: "TOP-171",
      },
      { client },
    );

    expect(requestSpy.mock.calls[0]?.[3]).toEqual({ "X-Paperclip-Run-Id": "env-run" });
  });

  it("sends nested filePath as API body path instead of a query parameter", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const requestSpy = spyOn(client, "request").mockResolvedValueOnce({ path: "roles/tooling/AGENTS.md" });

    const result = await agentInstructionsSafePutTool.handler(
      {
        agentId: "A1",
        filePath: "roles/tooling/AGENTS.md",
        content: "# Tooling",
        changeSummary: "Clarify tooling heartbeat",
        provenanceIssueId: "TOP-508",
        runId: "run-508",
      },
      { client },
    );

    expect(requestSpy).toHaveBeenCalledWith(
      "PUT",
      "/api/agents/A1/instructions-bundle/file?companyId=C1",
      {
        path: "roles/tooling/AGENTS.md",
        content: "# Tooling",
        changeSummary: "Clarify tooling heartbeat",
        provenanceIssueId: "TOP-508",
        runId: "run-508",
      },
      { "X-Paperclip-Run-Id": "run-508" },
    );
    expect(result).toMatchObject({
      filePath: "roles/tooling/AGENTS.md",
      provenanceIssueId: "TOP-508",
      runId: "run-508",
    });
  });

  it("rejects unsafe paths and live configuration paths before calling the API", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const requestSpy = spyOn(client, "request").mockResolvedValueOnce({});

    await expect(
      agentInstructionsSafePutTool.handler(
        {
          agentId: "A1",
          filePath: "../AGENTS.md",
          content: "x",
          changeSummary: "Update",
          provenanceIssueId: "TOP-171",
          runId: "run-1",
        },
        { client },
      ),
    ).rejects.toBeInstanceOf(ToolInputError);

    await expect(
      agentInstructionsSafePutTool.handler(
        {
          agentId: "A1",
          filePath: "runtime/model.json",
          content: "{}",
          changeSummary: "Update",
          provenanceIssueId: "TOP-171",
          runId: "run-1",
        },
        { client },
      ),
    ).rejects.toBeInstanceOf(ToolInputError);

    expect(requestSpy).not.toHaveBeenCalled();
  });

  it("rejects empty change summary, missing provenance, and missing run id", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });

    await expect(
      agentInstructionsSafePutTool.handler(
        {
          agentId: "A1",
          filePath: "AGENTS.md",
          content: "x",
          changeSummary: " ",
          provenanceIssueId: "TOP-171",
          runId: "run-1",
        },
        { client },
      ),
    ).rejects.toBeInstanceOf(ToolInputError);

    await expect(
      agentInstructionsSafePutTool.handler(
        {
          agentId: "A1",
          filePath: "AGENTS.md",
          content: "x",
          changeSummary: "Update",
          provenanceIssueId: " ",
          runId: "run-1",
        },
        { client },
      ),
    ).rejects.toBeInstanceOf(ToolInputError);

    await expect(
      agentInstructionsSafePutTool.handler(
        {
          agentId: "A1",
          filePath: "AGENTS.md",
          content: "x",
          changeSummary: "Update",
          provenanceIssueId: "TOP-171",
        },
        { client },
      ),
    ).rejects.toBeInstanceOf(ToolInputError);
  });

  it("surfaces the opaque upstream safe_put 500 as an actionable runId error", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    spyOn(client, "request").mockRejectedValueOnce(
      new PaperclipApiError(500, { error: "Internal server error" }, "/api/agents/A1/instructions-bundle/file"),
    );

    await expect(
      agentInstructionsSafePutTool.handler(
        {
          agentId: "A1",
          filePath: "SOUL.md",
          content: "x",
          changeSummary: "Update",
          provenanceIssueId: "TOP-709",
          runId: "a96c64e3-e5d4-46e2-8398-7f27d2070514",
        },
        { client },
      ),
    ).rejects.toMatchObject({
      field: "runId",
      constraint: expect.stringContaining("must reference an existing Paperclip run"),
    });
  });

  it("preserves non-opaque API failures from safe_put", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const apiError = new PaperclipApiError(403, { error: "forbidden" }, "/api/agents/A1/instructions-bundle/file");
    spyOn(client, "request").mockRejectedValueOnce(apiError);

    await expect(
      agentInstructionsSafePutTool.handler(
        {
          agentId: "A1",
          filePath: "SOUL.md",
          content: "x",
          changeSummary: "Update",
          provenanceIssueId: "TOP-709",
          runId: "run-1",
        },
        { client },
      ),
    ).rejects.toBe(apiError);
  });
});
