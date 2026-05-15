import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { activityCompanyTool } from "../../src/tools/activity-company.js";
import { PaperclipClient } from "../../src/client.js";

describe("activity_company", () => {
  beforeEach(() => mock.restore());

  it("GETs /api/companies/:cid/activity with provided limit", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const payload = [{ id: "A1", type: "issue_created" }];
    const spy = spyOn(client, "request").mockResolvedValueOnce(payload);
    const result = await activityCompanyTool.handler({ limit: 50 }, { client });
    expect(spy).toHaveBeenCalledWith("GET", "/api/companies/C1/activity?limit=50");
    expect(result).toEqual(payload);
  });

  it("defaults limit to 20 when not provided", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const spy = spyOn(client, "request").mockResolvedValueOnce([]);
    await activityCompanyTool.handler({}, { client });
    expect(spy).toHaveBeenCalledWith("GET", "/api/companies/C1/activity?limit=20");
  });
});
