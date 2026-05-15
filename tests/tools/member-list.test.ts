import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { memberListTool } from "../../src/tools/member-list.js";
import { PaperclipClient } from "../../src/client.js";

describe("member_list", () => {
  beforeEach(() => mock.restore());

  it("GETs /api/companies/:cid/members and returns mapped members array", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const spy = spyOn(client, "request").mockResolvedValueOnce({
      members: [
        { id: "M1", principalType: "user", principalId: "U1", role: "admin" },
      ],
    });
    const result = await memberListTool.handler({}, { client });
    expect(spy).toHaveBeenCalledWith("GET", "/api/companies/C1/members");
    expect(result).toEqual([
      { id: "M1", principalType: "user", principalId: "U1", role: "admin" },
    ]);
  });
});
