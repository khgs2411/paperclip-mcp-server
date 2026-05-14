import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { agentSetPermissionsTool } from "../../src/tools/agent-set-permissions.js";
import { PaperclipClient } from "../../src/client.js";

describe("agent_set_permissions", () => {
  beforeEach(() => mock.restore());

  it("PATCHes /api/agents/:id/permissions with both booleans and returns the resolved state", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const spy = spyOn(client, "request")
      .mockResolvedValueOnce({
        id: "A1",
        permissions: { canCreateAgents: false },
        access: { canAssignTasks: false, grants: [] },
      })
      .mockResolvedValueOnce({
        id: "A1",
        role: "ceo",
        permissions: { canCreateAgents: true },
        access: {
          canAssignTasks: true,
          grants: [
            { permissionKey: "tasks:assign" },
            { permissionKey: "tasks:manage_active_checkouts" },
          ],
        },
      });
    const result = await agentSetPermissionsTool.handler(
      { agentId: "A1", canCreateAgents: true, canAssignTasks: true },
      { client },
    );
    expect(spy).toHaveBeenNthCalledWith(1, "GET", "/api/agents/A1?companyId=C1");
    expect(spy).toHaveBeenNthCalledWith(
      2,
      "PATCH",
      "/api/agents/A1/permissions?companyId=C1",
      { canCreateAgents: true, canAssignTasks: true },
    );
    expect(result).toEqual({
      id: "A1",
      role: "ceo",
      permissions: { canCreateAgents: true, canAssignTasks: true },
      grants: ["tasks:assign", "tasks:manage_active_checkouts"],
    });
  });

  it("fills missing booleans from the live agent state", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const spy = spyOn(client, "request")
      .mockResolvedValueOnce({
        id: "A1",
        permissions: { canCreateAgents: true },
        access: { canAssignTasks: false, grants: [] },
      })
      .mockResolvedValueOnce({
        id: "A1",
        role: "ceo",
        permissions: { canCreateAgents: true },
        access: { canAssignTasks: true, grants: [{ permissionKey: "tasks:assign" }] },
      });
    await agentSetPermissionsTool.handler(
      { agentId: "A1", canAssignTasks: true },
      { client },
    );
    expect(spy).toHaveBeenNthCalledWith(
      2,
      "PATCH",
      "/api/agents/A1/permissions?companyId=C1",
      { canCreateAgents: true, canAssignTasks: true },
    );
  });

  it("requires at least one boolean to be set", async () => {
    await expect(
      agentSetPermissionsTool.inputSchema.parseAsync({ agentId: "A1" }),
    ).rejects.toThrow();
  });
});
