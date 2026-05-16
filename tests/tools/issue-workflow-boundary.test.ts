import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { PaperclipClient } from "../../src/client.js";
import { ToolInputError } from "../../src/shared/errors.js";
import { issueCommentAddTool } from "../../src/tools/issue-comment-add.js";
import { issueCreateTool } from "../../src/tools/issue-create.js";
import { issueCreateChildTool } from "../../src/tools/issue-create-child.js";
import { issueDocumentPutTool } from "../../src/tools/issue-document-put.js";
import { issueInteractionCreateTool } from "../../src/tools/issue-interaction-create.js";
import { issuePatchTool } from "../../src/tools/issue-patch.js";

describe("issue workflow boundary enforcement", () => {
  beforeEach(() => mock.restore());

  it("issue_create rejects forbidden editable source-boundary text before API call", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "CID" });
    const spy = spyOn(client, "request").mockResolvedValueOnce({ id: "I1" });

    await expect(
      issueCreateTool.handler(
        {
          title: "Bad routing",
          description: "Checkout /Users/liadgoren/Repositories/paperclip-upstream and edit there.",
        },
        { client },
      ),
    ).rejects.toBeInstanceOf(ToolInputError);
    expect(spy).not.toHaveBeenCalled();
  });

  it("issue_create_child rejects editable work against paperclipai/paperclip", async () => {
    const client = new PaperclipClient({ apiBase: "http://x" });
    const spy = spyOn(client, "request").mockResolvedValueOnce({ id: "I1" });

    await expect(
      issueCreateChildTool.handler(
        {
          issueId: "TOP-1",
          title: "Bad git target",
          description: "Push branch and open PR against paperclipai/paperclip.git.",
        },
        { client },
      ),
    ).rejects.toBeInstanceOf(ToolInputError);
    expect(spy).not.toHaveBeenCalled();
  });

  it("issue_patch accepts blockedByIssueIds so stale blockers can be reconciled", async () => {
    const client = new PaperclipClient({ apiBase: "http://x" });
    const spy = spyOn(client, "request").mockResolvedValueOnce({
      id: "I1",
      identifier: "TOP-216",
      status: "todo",
      priority: "high",
      title: "Parent",
      assigneeAgentId: "A1",
      assigneeUserId: null,
    });

    await issuePatchTool.handler(
      {
        issueIdOrIdentifier: "TOP-216",
        status: "todo",
        blockedByIssueIds: [],
        comment: "Reconciled stale parent blockers after all blockers reached terminal states.",
      },
      { client },
    );

    expect(spy).toHaveBeenCalledWith("PATCH", "/api/issues/TOP-216", {
      status: "todo",
      blockedByIssueIds: [],
      comment: "Reconciled stale parent blockers after all blockers reached terminal states.",
    });
  });

  it("issue_comment_add rejects merge closeout without Git Expert cleanup evidence", async () => {
    const client = new PaperclipClient({ apiBase: "http://x" });
    const spy = spyOn(client, "request").mockResolvedValueOnce({ id: "C1" });

    await expect(
      issueCommentAddTool.handler(
        { issueId: "TOP-1", body: "PR merged; closing as done." },
        { client },
      ),
    ).rejects.toBeInstanceOf(ToolInputError);
    expect(spy).not.toHaveBeenCalled();
  });

  it("issue_document_put rejects forbidden checkout references", async () => {
    const client = new PaperclipClient({ apiBase: "http://x" });
    const spy = spyOn(client, "request").mockResolvedValueOnce({ revisionId: "R1" });

    await expect(
      issueDocumentPutTool.handler(
        {
          issueId: "TOP-1",
          key: "plan",
          title: "Plan",
          body: "Editable workspace: /Users/liadgoren/Repositories/paperclip-upstream",
        },
        { client },
      ),
    ).rejects.toBeInstanceOf(ToolInputError);
    expect(spy).not.toHaveBeenCalled();
  });

  it("issue_interaction_create rejects stale terminal blocker proposals", async () => {
    const client = new PaperclipClient({ apiBase: "http://x" });
    const spy = spyOn(client, "request").mockResolvedValueOnce({ id: "INT-1" });

    await expect(
      issueInteractionCreateTool.handler(
        {
          issueId: "TOP-1",
          kind: "request_confirmation",
          prompt: "Keep this blocked; all blockers are terminal and children completed.",
        },
        { client },
      ),
    ).rejects.toBeInstanceOf(ToolInputError);
    expect(spy).not.toHaveBeenCalled();
  });
});
