import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { sidebarBadgesTool } from "../../src/tools/sidebar-badges.js";
import { PaperclipClient } from "../../src/client.js";

describe("sidebar_badges", () => {
  beforeEach(() => mock.restore());

  it("GETs /api/companies/:cid/sidebar-badges and passes through the response", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const payload = { inbox: 3, approvals: 1 };
    const spy = spyOn(client, "request").mockResolvedValueOnce(payload);
    const result = await sidebarBadgesTool.handler({}, { client });
    expect(spy).toHaveBeenCalledWith("GET", "/api/companies/C1/sidebar-badges");
    expect(result).toEqual(payload);
  });
});
