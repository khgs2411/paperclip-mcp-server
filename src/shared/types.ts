// Re-exports and local DTOs shared across tool implementations.
// Add types here when they are used by 2+ tool files. Tool-local types stay in their tool file.
//
// When importing from @paperclipai/shared, comment the upstream source path so future
// maintainers can check for drift when Paperclip upgrades.

export type {
  PermissionKey, // @paperclipai/shared/dist/constants.d.ts → PERMISSION_KEYS
  AgentRole,     // @paperclipai/shared/dist/constants.d.ts → AGENT_ROLES
  IssueStatus,   // @paperclipai/shared/dist/constants.d.ts → ISSUE_STATUSES
  RoutineStatus, // @paperclipai/shared/dist/constants.d.ts → ROUTINE_STATUSES
} from "@paperclipai/shared";

// Cross-tool helper shape: the compact agent projection multiple tools return.
export interface AgentCompact {
  id: string;
  name: string;
  urlKey: string;
  role: string;
  title: string | null;
  reportsTo: string | null;
  capabilities: string | null;
  status: string;
}
