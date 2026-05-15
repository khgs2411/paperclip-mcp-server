import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { goalListTool } from "../../src/tools/goal-list.js";
import { PaperclipClient } from "../../src/client.js";

describe("goal_list", () => {
  beforeEach(() => mock.restore());

  it("GETs /api/companies/:cid/goals and returns mapped array", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const spy = spyOn(client, "request").mockResolvedValueOnce([
      { id: "G1", title: "Ship v2", status: "in_progress" },
    ]);
    const result = await goalListTool.handler({}, { client });
    expect(spy).toHaveBeenCalledWith("GET", "/api/companies/C1/goals");
    expect(result).toEqual([{ id: "G1", title: "Ship v2", status: "in_progress" }]);
  });
});
