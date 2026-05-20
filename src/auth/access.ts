export type AccessProfile =
  | "observer"
  | "worker"
  | "coordinator"
  | "qa"
  | "admin_read"
  | "admin_write";

export type McpRuntimeContext =
  | { mode: "local_board" }
  | {
      mode: "managed_agent";
      profile: AccessProfile;
      agentId: string;
      runId: string;
      issueId: string;
      parentIssueId?: string;
      allowedTools?: string[];
    };

export interface DeniedDecision {
  allowed: false;
  code: "mcp_authorization_denied";
  tool: string;
  agentId: string;
  runId: string;
  issueId: string;
  requiredProfile: string;
  actualProfile: string;
  reason: string;
}

export type AccessDecision = { allowed: true } | DeniedDecision;

type ToolScope =
  | "company_read"
  | "assigned_or_related_issue"
  | "status_patch"
  | "owned_parent"
  | "admin_read"
  | "admin_write";

interface ToolRule {
  profiles: AccessProfile[];
  scope: ToolScope;
  requiredProfile: string;
}

const READ_PROFILES: AccessProfile[] = [
  "observer",
  "worker",
  "coordinator",
  "qa",
  "admin_read",
];

const TOOL_RULES: Record<string, ToolRule> = {
  paperclip_health_check: readRule(),
  paperclip_me_whoami: readRule(),
  paperclip_inbox_mine: readRule(),
  paperclip_inbox_lite: readRule(),
  paperclip_inbox_summary: readRule(),
  paperclip_inbox_dismissals_list: readRule(),
  paperclip_issue_list: readRule(),
  paperclip_issue_count: readRule(),
  paperclip_issue_search: readRule(),
  paperclip_issue_get_full: relatedIssueRule(),
  paperclip_issue_comments_list: relatedIssueRule(),
  paperclip_issue_documents_list: relatedIssueRule(),
  paperclip_issue_document_get: relatedIssueRule(),
  paperclip_issue_interactions_list: relatedIssueRule(),
  paperclip_issue_activity: relatedIssueRule(),
  paperclip_agent_list: readRule(),
  paperclip_agent_get: readRule(),
  paperclip_agent_skills_list: readRule(),
  paperclip_project_list: readRule(),
  paperclip_project_get: readRule(),
  paperclip_member_list: readRule(),
  paperclip_label_list: readRule(),
  paperclip_goal_list: readRule(),
  paperclip_goal_get: readRule(),
  paperclip_skill_list: readRule(),
  paperclip_skill_get: readRule(),
  paperclip_dashboard_get: readRule(),
  paperclip_sidebar_badges: readRule(),
  paperclip_routine_list: readRule(),
  paperclip_routine_get: readRule(),
  paperclip_routine_runs_list: readRule(),
  paperclip_activity_company: {
    profiles: ["coordinator", "admin_read"],
    scope: "company_read",
    requiredProfile: "coordinator",
  },
  paperclip_activity_summary: {
    profiles: ["coordinator", "admin_read"],
    scope: "company_read",
    requiredProfile: "coordinator",
  },
  paperclip_adapter_models_list: {
    profiles: ["admin_read", "admin_write"],
    scope: "admin_read",
    requiredProfile: "admin_read",
  },
  paperclip_adapter_model_profiles_list: {
    profiles: ["admin_read", "admin_write"],
    scope: "admin_read",
    requiredProfile: "admin_read",
  },
  paperclip_agent_effective_runtime_config_get: {
    profiles: ["admin_read", "admin_write"],
    scope: "admin_read",
    requiredProfile: "admin_read",
  },
  paperclip_issue_comment_add: relatedIssueRule(),
  paperclip_issue_patch: {
    profiles: ["worker", "coordinator", "qa"],
    scope: "status_patch",
    requiredProfile: "worker",
  },
  paperclip_issue_checkout: {
    profiles: ["worker", "coordinator"],
    scope: "assigned_or_related_issue",
    requiredProfile: "worker",
  },
  paperclip_issue_read_mark: {
    profiles: ["worker", "coordinator", "qa"],
    scope: "assigned_or_related_issue",
    requiredProfile: "worker",
  },
  paperclip_issue_read_unmark: {
    profiles: ["worker", "coordinator", "qa"],
    scope: "assigned_or_related_issue",
    requiredProfile: "worker",
  },
  paperclip_issue_create_child: coordinatorRule(),
  paperclip_issue_interaction_create: coordinatorRule(),
  paperclip_issue_interaction_respond: coordinatorRule(),
  paperclip_issue_interaction_accept: coordinatorRule(),
  paperclip_issue_interaction_reject: coordinatorRule(),
  paperclip_issue_interaction_cancel: coordinatorRule(),
  paperclip_agent_wakeup: coordinatorRule(),
  paperclip_approval_create: coordinatorRule(),
  paperclip_approval_comment_add: coordinatorRule(),
  paperclip_issue_approval_link: coordinatorRule(),
  paperclip_issue_approval_unlink: coordinatorRule(),
  paperclip_agent_patch: adminWriteRule(),
  paperclip_agent_set_permissions: adminWriteRule(),
  paperclip_agent_skill_sync: adminWriteRule(),
  paperclip_agent_hire: adminWriteRule(),
  paperclip_agent_pause: adminWriteRule(),
  paperclip_agent_resume: adminWriteRule(),
  paperclip_agent_instructions_patch: adminWriteRule(),
  paperclip_agent_instructions_file_put: adminWriteRule(),
  paperclip_agent_instructions_file_delete: adminWriteRule(),
  paperclip_agent_instructions_safe_put: adminWriteRule(),
  paperclip_member_set_grants: adminWriteRule(),
  paperclip_skill_sync: adminWriteRule(),
  paperclip_skill_delete: adminWriteRule(),
  paperclip_project_create: adminWriteRule(),
  paperclip_project_patch: adminWriteRule(),
  paperclip_project_delete: adminWriteRule(),
  paperclip_goal_create: adminWriteRule(),
  paperclip_goal_patch: adminWriteRule(),
  paperclip_goal_delete: adminWriteRule(),
  paperclip_label_create: adminWriteRule(),
  paperclip_label_delete: adminWriteRule(),
  paperclip_issue_create: adminWriteRule(),
  paperclip_issue_delete: adminWriteRule(),
  paperclip_issue_comment_delete: adminWriteRule(),
  paperclip_issue_document_put: adminWriteRule(),
  paperclip_issue_document_delete: adminWriteRule(),
  paperclip_issue_release: adminWriteRule(),
  paperclip_issue_inbox_archive: adminWriteRule(),
  paperclip_issue_inbox_unarchive: adminWriteRule(),
  paperclip_inbox_dismiss: adminWriteRule(),
  paperclip_approval_approve: adminWriteRule(),
  paperclip_approval_reject: adminWriteRule(),
  paperclip_approval_request_revision: adminWriteRule(),
  paperclip_approval_resubmit: adminWriteRule(),
  paperclip_routine_create: adminWriteRule(),
  paperclip_routine_patch: adminWriteRule(),
  paperclip_routine_run: adminWriteRule(),
};

export function visibleToolsForContext(ctx: McpRuntimeContext, toolNames: string[]): string[] {
  if (ctx.mode === "local_board") return toolNames;
  return toolNames.filter((tool) => authorizeTool(ctx, tool, {}).allowed);
}

export function authorizeTool(
  ctx: McpRuntimeContext,
  tool: string,
  args: unknown,
): AccessDecision {
  if (ctx.mode === "local_board") return { allowed: true };

  if (ctx.allowedTools && !ctx.allowedTools.includes(tool)) {
    return denied(ctx, tool, "explicit_grant", "tool is not included in this run-scoped grant");
  }

  const rule = TOOL_RULES[tool] ?? adminWriteRule();
  if (!rule.profiles.includes(ctx.profile)) {
    return denied(ctx, tool, rule.requiredProfile, `tool requires ${rule.requiredProfile} access`);
  }

  return authorizeScope(ctx, tool, args, rule);
}

function readRule(): ToolRule {
  return { profiles: READ_PROFILES, scope: "company_read", requiredProfile: "observer" };
}

function relatedIssueRule(): ToolRule {
  return {
    profiles: ["observer", "worker", "coordinator", "qa"],
    scope: "assigned_or_related_issue",
    requiredProfile: "observer",
  };
}

function coordinatorRule(): ToolRule {
  return {
    profiles: ["coordinator"],
    scope: "owned_parent",
    requiredProfile: "coordinator",
  };
}

function adminWriteRule(): ToolRule {
  return {
    profiles: ["admin_write"],
    scope: "admin_write",
    requiredProfile: "admin_write",
  };
}

function denied(
  ctx: Extract<McpRuntimeContext, { mode: "managed_agent" }>,
  tool: string,
  requiredProfile: string,
  reason: string,
): DeniedDecision {
  return {
    allowed: false,
    code: "mcp_authorization_denied",
    tool,
    agentId: ctx.agentId,
    runId: ctx.runId,
    issueId: ctx.issueId,
    requiredProfile,
    actualProfile: ctx.profile,
    reason,
  };
}

function authorizeScope(
  ctx: Extract<McpRuntimeContext, { mode: "managed_agent" }>,
  tool: string,
  args: unknown,
  rule: ToolRule,
): AccessDecision {
  if (rule.scope === "company_read" || rule.scope === "admin_read" || rule.scope === "admin_write") {
    return { allowed: true };
  }

  if (rule.scope === "status_patch") {
    return isAssignedStatusPatch(ctx, args)
      ? { allowed: true }
      : denied(ctx, tool, "coordinator", "assigned issue patch is limited to status-only updates");
  }

  if (rule.scope === "owned_parent") {
    return isIssueArg(args, ctx.issueId)
      ? { allowed: true }
      : denied(ctx, tool, "owned_parent", "tool is scoped to the owned parent issue");
  }

  if (rule.scope === "assigned_or_related_issue") {
    return isRelatedIssueArg(ctx, args)
      ? { allowed: true }
      : denied(
          ctx,
          tool,
          "assigned_issue",
          "tool is scoped to assigned issue, parent issue, or explicit child issue",
        );
  }

  return denied(ctx, tool, rule.requiredProfile, "tool scope is not authorized");
}

function isAssignedStatusPatch(
  ctx: Extract<McpRuntimeContext, { mode: "managed_agent" }>,
  args: unknown,
): boolean {
  const patch = args as Record<string, unknown> | undefined;
  const issueId = patch?.["issueId"] ?? patch?.["issueIdOrIdentifier"];
  if (issueId && issueId !== ctx.issueId) return false;

  const allowedKeys = new Set(["issueId", "issueIdOrIdentifier", "status", "comment"]);
  return Object.keys(patch ?? {}).every((key) => allowedKeys.has(key));
}

function isRelatedIssueArg(
  ctx: Extract<McpRuntimeContext, { mode: "managed_agent" }>,
  args: unknown,
): boolean {
  const issueId = getIssueArg(args);
  if (!issueId) return true;
  return issueId === ctx.issueId || issueId === ctx.parentIssueId;
}

function isIssueArg(args: unknown, expectedIssueId: string): boolean {
  const issueId = getIssueArg(args);
  return !issueId || issueId === expectedIssueId;
}

function getIssueArg(args: unknown): unknown {
  const input = args as Record<string, unknown> | undefined;
  return input?.["issueId"] ?? input?.["issueIdOrIdentifier"] ?? input?.["parentId"];
}
