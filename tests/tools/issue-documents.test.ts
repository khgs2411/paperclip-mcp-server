import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { issueDocumentsListTool } from "../../src/tools/issue-documents-list.js";
import { issueDocumentGetTool } from "../../src/tools/issue-document-get.js";
import { issueDocumentPutTool } from "../../src/tools/issue-document-put.js";
import { issueDocumentDeleteTool } from "../../src/tools/issue-document-delete.js";
import { PaperclipClient } from "../../src/client.js";

describe("issue document tools", () => {
  beforeEach(() => mock.restore());

  it("documents_list: GETs /api/issues/:id/documents", async () => {
    const client = new PaperclipClient({ apiBase: "http://x" });
    const spy = spyOn(client, "request").mockResolvedValueOnce([]);
    await issueDocumentsListTool.handler({ issueId: "TOP-1" }, { client });
    expect(spy).toHaveBeenCalledWith("GET", "/api/issues/TOP-1/documents");
  });

  it("document_get: GETs /api/issues/:id/documents/:key", async () => {
    const client = new PaperclipClient({ apiBase: "http://x" });
    const spy = spyOn(client, "request").mockResolvedValueOnce({ key: "plan", body: "# Plan" });
    const result = await issueDocumentGetTool.handler({ issueId: "TOP-1", key: "plan" }, { client });
    expect(spy).toHaveBeenCalledWith("GET", "/api/issues/TOP-1/documents/plan");
    expect((result as { key: string }).key).toBe("plan");
  });

  it("document_put: PUTs to /api/issues/:id/documents/:key", async () => {
    const client = new PaperclipClient({ apiBase: "http://x" });
    const spy = spyOn(client, "request").mockResolvedValueOnce({ revisionId: "R2" });
    const parsed = await issueDocumentPutTool.inputSchema.parseAsync({
      issueId: "TOP-1",
      key: "plan",
      title: "Plan",
      body: "# Plan\n\nstuff",
      baseRevisionId: null,
    });
    await issueDocumentPutTool.handler(parsed, { client });
    expect(spy).toHaveBeenCalledWith(
      "PUT",
      "/api/issues/TOP-1/documents/plan",
      { title: "Plan", body: "# Plan\n\nstuff", format: "markdown", baseRevisionId: null },
    );
  });

  it("document_delete: DELETEs when confirm=true", async () => {
    const client = new PaperclipClient({ apiBase: "http://x" });
    const spy = spyOn(client, "request").mockResolvedValueOnce({ deleted: true });
    await issueDocumentDeleteTool.handler({ issueId: "TOP-1", key: "plan", confirm: true }, { client });
    expect(spy).toHaveBeenCalledWith("DELETE", "/api/issues/TOP-1/documents/plan");
  });

  it("document_delete: rejects when confirm missing", async () => {
    await expect(
      issueDocumentDeleteTool.inputSchema.parseAsync({ issueId: "TOP-1", key: "plan" }),
    ).rejects.toThrow();
  });

  it("document_put: rejects empty title", async () => {
    await expect(
      issueDocumentPutTool.inputSchema.parseAsync({ issueId: "TOP-1", key: "plan", title: "", body: "x" }),
    ).rejects.toThrow();
  });
});
