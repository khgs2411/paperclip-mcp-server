import { describe, expect, it } from "bun:test";
import { handleCallTool } from "../../src/handler.js";
import { PaperclipClient } from "../../src/client.js";

const HEALTHY = async () => true;
const NOOP = () => {};

describe("handleCallTool authorization", () => {
  it("denies hidden coordinator tools on direct call", async () => {
    const result = await handleCallTool(
      "paperclip_issue_create_child",
      { issueId: "TOP-202", title: "Bad child" },
      new PaperclipClient({ apiBase: "http://x" }),
      HEALTHY,
      NOOP,
      {
        mode: "managed_agent",
        profile: "observer",
        agentId: "vesta",
        runId: "run-1",
        issueId: "TOP-202",
      },
    );

    expect(result.isError).toBe(true);
    const payload = JSON.parse(result.content[0]!.text);
    expect(payload).toEqual({
      allowed: false,
      code: "mcp_authorization_denied",
      tool: "paperclip_issue_create_child",
      agentId: "vesta",
      runId: "run-1",
      issueId: "TOP-202",
      requiredProfile: "coordinator",
      actualProfile: "observer",
      reason: "tool requires coordinator access",
    });
  });
});
