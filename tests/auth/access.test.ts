import { describe, expect, it } from "bun:test";
import { authorizeTool, visibleToolsForContext } from "../../src/auth/access.js";

const tools = [
  "paperclip_issue_list",
  "paperclip_issue_comment_add",
  "paperclip_issue_patch",
  "paperclip_issue_create_child",
  "paperclip_agent_wakeup",
  "paperclip_agent_skills_list",
  "paperclip_agent_skill_sync",
  "paperclip_project_delete",
];

describe("role-scoped MCP access decisions", () => {
  it("hides coordination and admin tools from observer profiles", () => {
    const visible = visibleToolsForContext(
      {
        mode: "managed_agent",
        profile: "observer",
        agentId: "vesta",
        runId: "run-1",
        issueId: "TOP-202",
        parentIssueId: "TOP-201",
      },
      tools,
    );

    expect(visible).toContain("paperclip_issue_list");
    expect(visible).toContain("paperclip_issue_comment_add");
    expect(visible).toContain("paperclip_agent_skills_list");
    expect(visible).not.toContain("paperclip_issue_create_child");
    expect(visible).not.toContain("paperclip_agent_wakeup");
    expect(visible).not.toContain("paperclip_agent_skill_sync");
    expect(visible).not.toContain("paperclip_project_delete");
  });

  it("allows read-only agent skill inspection while denying skill mutation", () => {
    const ctx = {
      mode: "managed_agent" as const,
      profile: "observer" as const,
      agentId: "atlas",
      runId: "run-skills",
      issueId: "TOP-487",
    };

    expect(authorizeTool(ctx, "paperclip_agent_skills_list", { agentId: "tooling" }).allowed).toBe(true);
    expect(authorizeTool(ctx, "paperclip_agent_skill_sync", { agentId: "tooling", skills: [] })).toEqual({
      allowed: false,
      code: "mcp_authorization_denied",
      tool: "paperclip_agent_skill_sync",
      agentId: "atlas",
      runId: "run-skills",
      issueId: "TOP-487",
      requiredProfile: "admin_write",
      actualProfile: "observer",
      reason: "tool requires admin_write access",
    });
  });

  it("allows coordinators to create child issues under owned route", () => {
    const decision = authorizeTool(
      {
        mode: "managed_agent",
        profile: "coordinator",
        agentId: "atlas",
        runId: "run-2",
        issueId: "TOP-201",
      },
      "paperclip_issue_create_child",
      { issueId: "TOP-201" },
    );

    expect(decision.allowed).toBe(true);
  });

  it("denies observer child issue creation with structured details", () => {
    const decision = authorizeTool(
      {
        mode: "managed_agent",
        profile: "observer",
        agentId: "vesta",
        runId: "run-3",
        issueId: "TOP-202",
        parentIssueId: "TOP-201",
      },
      "paperclip_issue_create_child",
      { issueId: "TOP-202" },
    );

    expect(decision).toEqual({
      allowed: false,
      code: "mcp_authorization_denied",
      tool: "paperclip_issue_create_child",
      agentId: "vesta",
      runId: "run-3",
      issueId: "TOP-202",
      requiredProfile: "coordinator",
      actualProfile: "observer",
      reason: "tool requires coordinator access",
    });
  });

  it("denies assigned issue patches that mutate routing fields", () => {
    const decision = authorizeTool(
      {
        mode: "managed_agent",
        profile: "worker",
        agentId: "worker-1",
        runId: "run-4",
        issueId: "TOP-300",
      },
      "paperclip_issue_patch",
      { issueIdOrIdentifier: "TOP-300", priority: "high" },
    );

    expect(decision).toEqual({
      allowed: false,
      code: "mcp_authorization_denied",
      tool: "paperclip_issue_patch",
      agentId: "worker-1",
      runId: "run-4",
      issueId: "TOP-300",
      requiredProfile: "coordinator",
      actualProfile: "worker",
      reason: "assigned issue patch is limited to status-only updates",
    });
  });

  it("allows qa agents to patch status and verdict comment on assigned review issue", () => {
    const decision = authorizeTool(
      {
        mode: "managed_agent",
        profile: "qa",
        agentId: "qa-1",
        runId: "run-qa",
        issueId: "TOP-500",
      },
      "paperclip_issue_patch",
      { issueIdOrIdentifier: "TOP-500", status: "done", comment: "QA verdict: accepted." },
    );

    expect(decision.allowed).toBe(true);
  });

  it("keeps qa agents out of coordinator mutation tools", () => {
    const decision = authorizeTool(
      {
        mode: "managed_agent",
        profile: "qa",
        agentId: "qa-1",
        runId: "run-qa",
        issueId: "TOP-500",
      },
      "paperclip_issue_create_child",
      { issueId: "TOP-500" },
    );

    expect(decision).toEqual({
      allowed: false,
      code: "mcp_authorization_denied",
      tool: "paperclip_issue_create_child",
      agentId: "qa-1",
      runId: "run-qa",
      issueId: "TOP-500",
      requiredProfile: "coordinator",
      actualProfile: "qa",
      reason: "tool requires coordinator access",
    });
  });

  it("denies admin-read profiles from coordinator mutation tools", () => {
    const decision = authorizeTool(
      {
        mode: "managed_agent",
        profile: "admin_read",
        agentId: "vulcan",
        runId: "run-5",
        issueId: "TOP-400",
      },
      "paperclip_agent_wakeup",
      { agentId: "atlas" },
    );

    expect(decision).toEqual({
      allowed: false,
      code: "mcp_authorization_denied",
      tool: "paperclip_agent_wakeup",
      agentId: "vulcan",
      runId: "run-5",
      issueId: "TOP-400",
      requiredProfile: "coordinator",
      actualProfile: "admin_read",
      reason: "tool requires coordinator access",
    });
  });

  it("denies observer comments on unrelated issues", () => {
    const decision = authorizeTool(
      {
        mode: "managed_agent",
        profile: "observer",
        agentId: "vesta",
        runId: "run-6",
        issueId: "TOP-202",
        parentIssueId: "TOP-201",
      },
      "paperclip_issue_comment_add",
      { issueId: "TOP-999", body: "wrong issue" },
    );

    expect(decision).toEqual({
      allowed: false,
      code: "mcp_authorization_denied",
      tool: "paperclip_issue_comment_add",
      agentId: "vesta",
      runId: "run-6",
      issueId: "TOP-202",
      requiredProfile: "assigned_issue",
      actualProfile: "observer",
      reason: "tool is scoped to assigned issue, parent issue, or explicit child issue",
    });
  });

  it("keeps local board mode backward compatible", () => {
    const visible = visibleToolsForContext({ mode: "local_board" }, tools);
    expect(visible).toEqual(tools);
  });
});
