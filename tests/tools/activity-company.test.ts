import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { activityCompanyTool } from "../../src/tools/activity-company.js";
import { PaperclipClient } from "../../src/client.js";

describe("activity_company", () => {
  beforeEach(() => mock.restore());

  it("GETs activity with default limit 20", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const spy = spyOn(client, "request").mockResolvedValueOnce([]);
    await activityCompanyTool.handler({}, { client });
    expect(spy).toHaveBeenCalledWith("GET", "/api/companies/C1/activity?limit=20");
  });

  it("passes custom limit when provided", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const spy = spyOn(client, "request").mockResolvedValueOnce([]);
    await activityCompanyTool.handler({ limit: 50 }, { client });
    expect(spy).toHaveBeenCalledWith("GET", "/api/companies/C1/activity?limit=50");
  });
});
