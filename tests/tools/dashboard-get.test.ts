import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { dashboardGetTool } from "../../src/tools/dashboard-get.js";
import { PaperclipClient } from "../../src/client.js";

describe("dashboard_get", () => {
  beforeEach(() => mock.restore());

  it("GETs /api/companies/:cid/dashboard and passes through the response", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const payload = { widgets: [], updatedAt: "2026-05-15" };
    const spy = spyOn(client, "request").mockResolvedValueOnce(payload);
    const result = await dashboardGetTool.handler({}, { client });
    expect(spy).toHaveBeenCalledWith("GET", "/api/companies/C1/dashboard");
    expect(result).toEqual(payload);
  });
});
