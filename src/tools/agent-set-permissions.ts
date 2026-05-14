import { z } from "zod";
import type { ToolDefinition } from "./index.js";

const inputSchema = z
  .object({
    agentId: z.string().min(1),
    companyId: z.string().optional(),
    canCreateAgents: z.boolean().optional(),
    canAssignTasks: z.boolean().optional(),
  })
  .refine((v) => v.canCreateAgents !== undefined || v.canAssignTasks !== undefined, {
    message: "at least one of canCreateAgents or canAssignTasks must be provided",
    path: ["_permissions"],
  });

interface AgentReadShape {
  permissions?: { canCreateAgents?: boolean };
  access?: { canAssignTasks?: boolean };
}

interface AgentPermissionsResponse {
  id: string;
  role: string;
  permissions: { canCreateAgents: boolean };
  access: { canAssignTasks: boolean; grants: Array<{ permissionKey: string }> };
}

export const agentSetPermissionsTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_agent_set_permissions",
  description:
    "Set an agent's canCreateAgents and/or canAssignTasks. Pre-fetches current state so callers may supply only the field they want to change. Returns resolved permissions and effective grants.",
  inputSchema,
  handler: async (input, { client }) => {
    const companyId = client.resolveCompanyId(input.companyId);
    const agentPath = `/api/agents/${encodeURIComponent(input.agentId)}?companyId=${encodeURIComponent(companyId)}`;
    const current = (await client.request("GET", agentPath)) as AgentReadShape;

    const body = {
      canCreateAgents:
        input.canCreateAgents !== undefined
          ? input.canCreateAgents
          : (current.permissions?.canCreateAgents ?? false),
      canAssignTasks:
        input.canAssignTasks !== undefined
          ? input.canAssignTasks
          : (current.access?.canAssignTasks ?? false),
    };

    const raw = (await client.request(
      "PATCH",
      `/api/agents/${encodeURIComponent(input.agentId)}/permissions?companyId=${encodeURIComponent(companyId)}`,
      body,
    )) as AgentPermissionsResponse;

    return {
      id: raw.id,
      role: raw.role,
      permissions: {
        canCreateAgents: raw.permissions.canCreateAgents,
        canAssignTasks: raw.access.canAssignTasks,
      },
      grants: raw.access.grants.map((g) => g.permissionKey),
    };
  },
};
