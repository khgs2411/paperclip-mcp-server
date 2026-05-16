import { describe, expect, it } from "bun:test";
import { assertWorkflowBoundaryText } from "../../src/shared/workflow-boundary.js";
import { ToolInputError } from "../../src/shared/errors.js";

describe("workflow boundary guard", () => {
  it("rejects removed paperclip-upstream checkout references", () => {
    expect(() =>
      assertWorkflowBoundaryText({
        toolName: "paperclip_issue_create",
        fields: {
          description:
            "Use /Users/liadgoren/Repositories/paperclip-upstream as the editable checkout.",
        },
      }),
    ).toThrow(ToolInputError);
  });

  it("rejects editable work against paperclipai/paperclip remotes", () => {
    expect(() =>
      assertWorkflowBoundaryText({
        toolName: "paperclip_issue_create",
        fields: {
          description:
            "Create branch fix/top-237 and open PR against paperclipai/paperclip.git.",
        },
      }),
    ).toThrow(/paperclipai\/paperclip/);
  });

  it("allows source-only references to paperclipai/paperclip", () => {
    expect(() =>
      assertWorkflowBoundaryText({
        toolName: "paperclip_issue_comment_add",
        fields: {
          body:
            "The paperclip skill is from paperclipai/paperclip/paperclip; use it as source reference only.",
        },
      }),
    ).not.toThrow();
  });

  it("allows explicitly approved Liad-owned remotes", () => {
    expect(() =>
      assertWorkflowBoundaryText({
        toolName: "paperclip_issue_create",
        fields: {
          description:
            "Open the approved PR against khgs2411/paperclip and keep khgs2411/company-mcp-server as the MCP-server remote.",
        },
      }),
    ).not.toThrow();
  });

  it("rejects merge closeout without Git Expert cleanup evidence", () => {
    expect(() =>
      assertWorkflowBoundaryText({
        toolName: "paperclip_issue_patch",
        fields: {
          status: "done",
          comment: "PR merged; closing the implementation issue now.",
        },
      }),
    ).toThrow(/Git Expert cleanup/);
  });

  it("allows merge closeout when Git Expert cleanup evidence is present", () => {
    expect(() =>
      assertWorkflowBoundaryText({
        toolName: "paperclip_issue_patch",
        fields: {
          status: "done",
          comment:
            "PR merged. Git Expert cleanup evidence: remote branch deleted and issue branch state closed.",
        },
      }),
    ).not.toThrow();
  });

  it("rejects blocked status text that says all blockers are terminal", () => {
    expect(() =>
      assertWorkflowBoundaryText({
        toolName: "paperclip_issue_patch",
        fields: {
          status: "blocked",
          comment:
            "Remaining blocked although all blockers are terminal: TOP-216 done and TOP-229 cancelled.",
        },
      }),
    ).toThrow(/terminal blockers/);
  });
});
