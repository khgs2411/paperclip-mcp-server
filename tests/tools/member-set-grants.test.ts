import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { memberSetGrantsTool } from "../../src/tools/member-set-grants.js";
import { PaperclipClient } from "../../src/client.js";

describe("member_set_grants", () => {
  beforeEach(() => mock.restore());

  it("replace mode PATCHes with provided grants for an agent", async () => {
    const client = new PaperclipClient({ apiBase: "http://x" });
    const spy = spyOn(client, "request").mockResolvedValueOnce({
      id: "M1",
      principalType: "agent",
      principalId: "A1",
      grants: [{ permissionKey: "tasks:assign", scope: null }],
    });
    const result = await memberSetGrantsTool.handler(
      {
        memberId: "M1",
        principalType: "agent",
        principalId: "A1",
        companyId: "C1",
        grants: [{ permissionKey: "tasks:assign" }],
        merge: false,
      },
      { client },
    );
    expect(spy).toHaveBeenCalledWith(
      "PATCH",
      "/api/companies/C1/members/M1/permissions",
      { grants: [{ permissionKey: "tasks:assign" }] },
    );
    expect(result).toEqual({
      memberId: "M1",
      principalType: "agent",
      principalId: "A1",
      grants: [{ permissionKey: "tasks:assign", scope: null }],
    });
  });

  it("merge mode for agent fetches AgentDetail.access.grants and PATCHes the union", async () => {
    const client = new PaperclipClient({ apiBase: "http://x" });
    spyOn(client, "request")
      .mockResolvedValueOnce({
        id: "A1",
        access: { grants: [{ permissionKey: "tasks:assign", scope: null }] },
      })
      .mockResolvedValueOnce({
        id: "M1",
        principalType: "agent",
        principalId: "A1",
        grants: [
          { permissionKey: "tasks:assign", scope: null },
          { permissionKey: "tasks:manage_active_checkouts", scope: null },
        ],
      });
    const result = await memberSetGrantsTool.handler(
      {
        memberId: "M1",
        principalType: "agent",
        principalId: "A1",
        companyId: "C1",
        grants: [{ permissionKey: "tasks:manage_active_checkouts" }],
        merge: true,
      },
      { client },
    );
    expect((result as { grants: unknown[] }).grants).toHaveLength(2);
  });

  it("merge mode for user fetches CompanyMembersResponse.members and PATCHes the union", async () => {
    const client = new PaperclipClient({ apiBase: "http://x" });
    spyOn(client, "request")
      .mockResolvedValueOnce({
        members: [
          {
            id: "M1",
            principalType: "user",
            principalId: "U1",
            grants: [{ permissionKey: "tasks:assign", scope: null }],
          },
        ],
      })
      .mockResolvedValueOnce({
        id: "M1",
        principalType: "user",
        principalId: "U1",
        grants: [
          { permissionKey: "tasks:assign", scope: null },
          { permissionKey: "joins:approve", scope: null },
        ],
      });
    const result = await memberSetGrantsTool.handler(
      {
        memberId: "M1",
        principalType: "user",
        principalId: "U1",
        companyId: "C1",
        grants: [{ permissionKey: "joins:approve" }],
        merge: true,
      },
      { client },
    );
    expect((result as { grants: unknown[] }).grants).toHaveLength(2);
  });
});
