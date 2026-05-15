# paperclip-mcp-server

A stdio MCP server that exposes a typed tool surface for interacting with a local Paperclip orchestration API. Fills the gaps in the `paperclipai` CLI.

## Install (via Claude Code MCP config)

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

`PAPERCLIP_API_BASE` defaults to `http://127.0.0.1:3100` if unset.
`PAPERCLIP_COMPANY_ID` is optional when the local Paperclip instance has only one company.

## Tools (v0.2)

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
| `paperclip_inbox_summary` | Single-read count of pending approvals and total in-review issues. (Pending interaction count is omitted — no company-level interactions endpoint exists; use `paperclip_issue_interactions_list` per issue.) |
| `paperclip_skill_sync` | Replace or merge an agent's desired skills. |
| `paperclip_project_create` | Create a project. |
| `paperclip_project_delete` | Delete a project. |
| `paperclip_board_channel_append` | Append a Yellow-tier line to `BOARD_CHANNEL.md`. |

### Interaction kind → action routing

`paperclip_issue_interaction_resolve` routes to the correct REST endpoint based on the `action` field. The caller does not need to know the HTTP verb.

| kind | allowed actions | REST endpoint |
|------|----------------|---------------|
| `confirmation` | `accept`, `reject` | `POST /api/issues/:id/interactions/:interactionId/{accept,reject}` |
| `question` | `respond`, `cancel` | `POST /api/issues/:id/interactions/:interactionId/{respond,cancel}` |

Kind→action compatibility is enforced by the REST API, not the client.

## Development

```bash
bun install
bun run dev          # run server in stdio mode
bun test             # unit tests
bun run typecheck
bun run build        # bundle to dist/
```

Integration tests (require a live local Paperclip):

```bash
PAPERCLIP_COMPANY_ID=<your-company-uuid> bun run test:integration
```

## Publish

```bash
# Set NPM_TOKEN in .env (see .env.example), then:
bun run prepublishOnly  # typecheck + unit tests + build
bun publish
```
