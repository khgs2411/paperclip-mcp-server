# paperclip-mcp-server

A stdio MCP server that exposes a typed tool surface for interacting with a local Paperclip orchestration API. Fills the gaps in the `paperclipai` CLI.

## Install

### Bun (recommended)

```json
{
  "mcpServers": {
    "paperclip": {
      "command": "bunx",
      "args": ["paperclip-mcp-server@latest"],
      "env": {
        "PAPERCLIP_API_BASE": "http://127.0.0.1:3100",
        "PAPERCLIP_COMPANY_ID": "<your-company-uuid>"
      }
    }
  }
}
```

### Node (npx)

```json
{
  "mcpServers": {
    "paperclip": {
      "command": "npx",
      "args": ["-y", "paperclip-mcp-server@latest"],
      "env": {
        "PAPERCLIP_API_BASE": "http://127.0.0.1:3100",
        "PAPERCLIP_COMPANY_ID": "<your-company-uuid>"
      }
    }
  }
}
```

`PAPERCLIP_API_BASE` defaults to `http://127.0.0.1:3100` if unset.
`PAPERCLIP_COMPANY_ID` is optional when the local Paperclip instance has only one company.

### Agent API key (Group E tools)

Inbox tools (`paperclip_me_whoami`, `paperclip_inbox_*`) require an agent-scoped API key:

```json
"PAPERCLIP_AGENT_API_KEY": "<agent-jwt>"
```

## Tools (v0.3)

### Baseline

| Tool | Purpose |
|------|---------|
| `paperclip_agent_patch` | Update agent metadata (name, title, role, reportsTo, capabilities, icon). |
| `paperclip_agent_set_permissions` | Set `canCreateAgents` / `canAssignTasks` on an agent. |
| `paperclip_member_set_grants` | Replace or merge explicit permission grants on a member. |
| `paperclip_routine_patch` | Update a routine's metadata. |
| `paperclip_routine_run` | Trigger a manual routine run, optionally wait for completion. |
| `paperclip_issue_get_full` | Issue + comments + relations in one call. |
| `paperclip_issue_patch` | Update issue fields not fully covered by the CLI. |
| `paperclip_issue_interactions_list` | List pending interactions (confirmations, questions) for an issue. |
| `paperclip_issue_interaction_resolve` | Resolve a pending interaction (accept/reject/respond/cancel). |
| `paperclip_inbox_summary` | Count of pending interactions, approvals, and unassigned in-review issues. |
| `paperclip_skill_sync` | Replace or merge an agent's desired skills. _(deprecated — use `paperclip_agent_skill_sync`)_ |
| `paperclip_project_create` | Create a project. |
| `paperclip_project_delete` | Delete a project. |
| `paperclip_board_channel_append` | Append a Yellow-tier line to `BOARD_CHANNEL.md`. |

### Group E — Inbox (agent-scoped)

| Tool | Purpose |
|------|---------|
| `paperclip_me_whoami` | Resolve the calling agent's identity. |
| `paperclip_inbox_mine` | List full inbox items for the calling agent. |
| `paperclip_inbox_lite` | Compact inbox (identifiers + statuses only). |
| `paperclip_inbox_dismissals_list` | List dismissed inbox entries. |
| `paperclip_inbox_dismiss` | Dismiss an inbox entry. |

### Group F — Approvals

| Tool | Purpose |
|------|---------|
| `paperclip_approval_list` | List approvals for the company. |
| `paperclip_approval_get` | Get a single approval. |
| `paperclip_approval_create` | Create a new approval request. |
| `paperclip_approval_approve` | Approve a pending approval. |
| `paperclip_approval_reject` | Reject a pending approval. |
| `paperclip_approval_request_revision` | Request a revision on an approval. |
| `paperclip_approval_resubmit` | Resubmit an approval after revision. |
| `paperclip_approval_comments_list` | List comments on an approval. |
| `paperclip_approval_comment_add` | Add a comment to an approval. |
| `paperclip_approval_issues_list` | List issues linked to an approval. |
| `paperclip_issue_approval_link` | Link an issue to an approval. |
| `paperclip_issue_approval_unlink` | Unlink an issue from an approval. |

### Group G — Roster discovery

| Tool | Purpose |
|------|---------|
| `paperclip_agent_list` | List all agents in the company. |
| `paperclip_agent_get` | Get a single agent by ID. |
| `paperclip_agent_skills_list` | Get an agent's skill snapshot. |
| `paperclip_agent_skill_sync` | Replace or merge an agent's desired skills (v0.3 rename of `skill_sync`). |
| `paperclip_agent_hire` | Submit an agent hire request. |
| `paperclip_agent_wakeup` | Wake an agent, optionally scoped to an issue. |
| `paperclip_agent_pause` | Pause an agent. |
| `paperclip_agent_resume` | Resume a paused agent. |
| `paperclip_agent_instructions_get` | Get an agent's instructions bundle. |
| `paperclip_agent_instructions_patch` | Patch an agent's instructions bundle. |
| `paperclip_agent_instructions_file_get` | Get a single file from an agent's instructions bundle. |
| `paperclip_agent_instructions_file_put` | Write a file into an agent's instructions bundle. |
| `paperclip_agent_instructions_file_delete` | Delete a file from an agent's instructions bundle. |

### Group H — Projects, members, labels, goals

| Tool | Purpose |
|------|---------|
| `paperclip_project_list` | List all projects. |
| `paperclip_project_get` | Get a single project. |
| `paperclip_project_patch` | Update a project's name or status. |
| `paperclip_member_list` | List company members. |
| `paperclip_label_list` | List all labels. |
| `paperclip_label_create` | Create a label. |
| `paperclip_label_delete` | Delete a label (requires `confirm: true`). |
| `paperclip_goal_list` | List all goals. |
| `paperclip_goal_get` | Get a single goal. |
| `paperclip_goal_create` | Create a goal. |
| `paperclip_goal_patch` | Update a goal's title, description, or status. |
| `paperclip_goal_delete` | Delete a goal (requires `confirm: true`). |

### Group I — Board observability

| Tool | Purpose |
|------|---------|
| `paperclip_dashboard_get` | Get the company dashboard. |
| `paperclip_activity_company` | Get recent company activity (default limit 20). |
| `paperclip_sidebar_badges` | Get sidebar badge counts. |

### Group J — Routines

| Tool | Purpose |
|------|---------|
| `paperclip_routine_list` | List all routines. |
| `paperclip_routine_get` | Get a single routine. |
| `paperclip_routine_create` | Create a routine. |
| `paperclip_routine_runs_list` | List runs for a routine. |

## Interaction kind → action routing

`paperclip_issue_interaction_resolve` routes to the correct REST endpoint based on the `action` field.

| kind | allowed actions | REST endpoint |
|------|----------------|---------------|
| `confirmation` | `accept`, `reject` | `POST /api/issues/:id/interactions/:interactionId/{accept,reject}` |
| `question` | `respond`, `cancel` | `POST /api/issues/:id/interactions/:interactionId/{respond,cancel}` |

## Breaking changes (v0.3)

- `paperclip_skill_sync` is deprecated. Use `paperclip_agent_skill_sync` instead. The old tool is kept for backward compatibility.

## Development

```bash
bun install
bun run dev          # run server in stdio mode
bun test             # unit tests (193 tests)
bun run typecheck
bun run build        # bundle to dist/
```

Integration tests (require a live local Paperclip):

```bash
PAPERCLIP_COMPANY_ID=<your-company-uuid> bun run test:integration
```

## Publish

```bash
bun run prepublishOnly  # typecheck + unit tests + build
bun publish
```
