import { describe, expect, it } from "bun:test";
import { visibleToolsForContext } from "../../src/auth/access.js";

describe("profile-scoped tools/list behavior", () => {
  const tools = [
    "paperclip_issue_list",
    "paperclip_issue_comment_add",
    "paperclip_issue_create_child",
    "paperclip_agent_wakeup",
    "paperclip_adapter_model_profiles_list",
    "paperclip_agent_effective_runtime_config_get",
    "paperclip_agent_skill_sync",
  ];

  it("hides coordinator/admin tools from observer catalog", () => {
    const visible = visibleToolsForContext(
      {
        mode: "managed_agent",
        profile: "observer",
        agentId: "vesta",
        runId: "run-1",
        issueId: "TOP-202",
      },
      tools,
    );

    expect(visible).toEqual([
      "paperclip_issue_list",
      "paperclip_issue_comment_add",
    ]);
  });

  it("shows model/reasoning readbacks only to admin-read profiles", () => {
    const visible = visibleToolsForContext(
      {
        mode: "managed_agent",
        profile: "admin_read",
        agentId: "vulcan",
        runId: "run-1",
        issueId: "TOP-276",
      },
      tools,
    );

    expect(visible).toContain("paperclip_adapter_model_profiles_list");
    expect(visible).toContain("paperclip_agent_effective_runtime_config_get");
    expect(visible).not.toContain("paperclip_agent_skill_sync");
  });

  it("keeps full catalog in explicit local board mode", () => {
    expect(visibleToolsForContext({ mode: "local_board" }, tools)).toEqual(tools);
  });
});
