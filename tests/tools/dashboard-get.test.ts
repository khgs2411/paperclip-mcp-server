import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { dashboardGetTool } from "../../src/tools/dashboard-get.js";
import { PaperclipClient } from "../../src/client.js";

describe("dashboard_get", () => {
  beforeEach(() => mock.restore());

  it("GETs company dashboard and returns pass-through", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const dashboard = { totalIssues: 10, inProgress: 3 };
    const spy = spyOn(client, "request").mockResolvedValueOnce(dashboard);
    const result = await dashboardGetTool.handler({}, { client });
    expect(spy).toHaveBeenCalledWith("GET", "/api/companies/C1/dashboard");
    expect(result).toEqual(dashboard);
  });
});
