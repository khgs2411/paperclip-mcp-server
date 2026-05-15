import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { sidebarBadgesTool } from "../../src/tools/sidebar-badges.js";
import { PaperclipClient } from "../../src/client.js";

describe("sidebar_badges", () => {
  beforeEach(() => mock.restore());

  it("GETs sidebar badges and returns pass-through", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const badges = { inbox: 3, approvals: 1 };
    const spy = spyOn(client, "request").mockResolvedValueOnce(badges);
    const result = await sidebarBadgesTool.handler({}, { client });
    expect(spy).toHaveBeenCalledWith("GET", "/api/companies/C1/sidebar-badges");
    expect(result).toEqual(badges);
  });
});
