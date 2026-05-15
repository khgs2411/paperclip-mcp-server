import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { memberListTool } from "../../src/tools/member-list.js";
import { PaperclipClient } from "../../src/client.js";

describe("member_list", () => {
  beforeEach(() => mock.restore());

  it("GETs company members and returns compact array", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const spy = spyOn(client, "request").mockResolvedValueOnce({
      members: [{ id: "M1", principalType: "agent", principalId: "A1", role: "member", extra: "x" }],
    });
    const result = await memberListTool.handler({}, { client });
    expect(spy).toHaveBeenCalledWith("GET", "/api/companies/C1/members");
    expect(result).toEqual([{ id: "M1", principalType: "agent", principalId: "A1", role: "member" }]);
  });
});
