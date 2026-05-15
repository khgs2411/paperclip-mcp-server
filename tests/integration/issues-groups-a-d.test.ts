import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { PaperclipClient } from "../../src/client.js";
import { issueListTool } from "../../src/tools/issue-list.js";
import { issueCountTool } from "../../src/tools/issue-count.js";
import { issueSearchTool } from "../../src/tools/issue-search.js";
import { issueCreateTool } from "../../src/tools/issue-create.js";
import { issueCreateChildTool } from "../../src/tools/issue-create-child.js";
import { issueCommentAddTool } from "../../src/tools/issue-comment-add.js";
import { issueCommentsListTool } from "../../src/tools/issue-comments-list.js";
import { issueInteractionCreateTool } from "../../src/tools/issue-interaction-create.js";
import { issueInteractionCancelTool } from "../../src/tools/issue-interaction-cancel.js";
import { issueInteractionsListTool } from "../../src/tools/issue-interactions-list.js";
import { issueCheckoutTool } from "../../src/tools/issue-checkout.js";
import { issueReleaseTool } from "../../src/tools/issue-release.js";
import { issueDocumentPutTool } from "../../src/tools/issue-document-put.js";
import { issueDocumentGetTool } from "../../src/tools/issue-document-get.js";
import { issueDocumentsListTool } from "../../src/tools/issue-documents-list.js";
import { issueDeleteTool } from "../../src/tools/issue-delete.js";

const apiBase = process.env["PAPERCLIP_API_BASE"] ?? "http://127.0.0.1:3100";
const companyId = process.env["PAPERCLIP_COMPANY_ID"];
const agentId = process.env["PAPERCLIP_AGENT_ID"];
const RUN_INTEGRATION = process.env["RUN_INTEGRATION"] === "1";

describe.skipIf(!companyId || !RUN_INTEGRATION)("integration: issues groups A-D (requires live Paperclip)", () => {
  let client: PaperclipClient;
  let testIssueId: string;

  beforeAll(async () => {
    client = new PaperclipClient({ apiBase, defaultCompanyId: companyId });
    const healthy = await client.healthCheck();
    if (!healthy) throw new Error("Paperclip not reachable at " + apiBase);
  });

  afterAll(async () => {
    if (testIssueId) {
      await issueDeleteTool.handler({ issueId: testIssueId, confirm: true }, { client }).catch(() => {});
    }
  });

  // Group A

  it("A: issue_list returns an array", async () => {
    const result = await issueListTool.handler({}, { client });
    expect(Array.isArray(result)).toBe(true);
  });

  it("A: issue_count returns a count", async () => {
    const result = await issueCountTool.handler({}, { client });
    expect(typeof (result as { count: number }).count === "number" || typeof result === "number").toBe(true);
  });

  it("A: issue_create creates a test issue", async () => {
    const result = await issueCreateTool.handler({
      title: "[integration-test] TOP-98 smoke",
      description: "Automated integration test issue — safe to delete.",
      priority: "low",
    }, { client });
    const issue = result as { id: string; identifier: string };
    expect(issue.id).toBeTruthy();
    testIssueId = issue.id;
  });

  it("A: issue_search returns results for the test issue title", async () => {
    const result = await issueSearchTool.handler({ q: "TOP-98 smoke" }, { client });
    expect(Array.isArray(result)).toBe(true);
  });

  it("A: issue_create_child creates a child", async () => {
    if (!testIssueId) return;
    const result = await issueCreateChildTool.handler(
      { issueId: testIssueId, title: "[integration-test] child smoke" },
      { client },
    );
    const child = result as { id: string; parentId: string };
    expect(child.id).toBeTruthy();
    // Clean up child
    await issueDeleteTool.handler({ issueId: child.id, confirm: true }, { client }).catch(() => {});
  });

  // Group B

  it("B: issue_comment_add adds a comment", async () => {
    if (!testIssueId) return;
    const result = await issueCommentAddTool.handler(
      { issueId: testIssueId, body: "Integration test comment from TOP-98 smoke." },
      { client },
    );
    expect((result as { id: string }).id).toBeTruthy();
  });

  it("B: issue_comments_list returns comments", async () => {
    if (!testIssueId) return;
    const result = await issueCommentsListTool.handler({ issueId: testIssueId }, { client });
    expect(Array.isArray(result)).toBe(true);
    expect((result as unknown[]).length).toBeGreaterThanOrEqual(1);
  });

  // Group C

  it("C: issue_interaction_create then cancel round-trip", async () => {
    if (!testIssueId) return;
    const created = await issueInteractionCreateTool.handler(
      { issueId: testIssueId, kind: "request_confirmation", prompt: "Smoke test — please cancel." },
      { client },
    );
    const interaction = created as { id: string };
    expect(interaction.id).toBeTruthy();
    await issueInteractionCancelTool.handler(
      { issueId: testIssueId, interactionId: interaction.id },
      { client },
    );
    const list = await issueInteractionsListTool.handler({ issueId: testIssueId, status: "cancelled" }, { client });
    expect(Array.isArray(list)).toBe(true);
  });

  // Group D

  it("D: issue_checkout and release round-trip", async () => {
    if (!testIssueId || !agentId) return;
    await issueCheckoutTool.handler({ issueId: testIssueId, agentId }, { client });
    await issueReleaseTool.handler({ issueId: testIssueId }, { client });
  });

  it("D: issue_document_put then get round-trip", async () => {
    if (!testIssueId) return;
    await issueDocumentPutTool.handler(
      { issueId: testIssueId, key: "plan", title: "Smoke Plan", body: "# Smoke\n\ntest plan.", baseRevisionId: null },
      { client },
    );
    const docs = await issueDocumentsListTool.handler({ issueId: testIssueId }, { client });
    expect(Array.isArray(docs)).toBe(true);
    const doc = await issueDocumentGetTool.handler({ issueId: testIssueId, key: "plan" }, { client });
    expect((doc as { key: string }).key).toBe("plan");
  });
});
