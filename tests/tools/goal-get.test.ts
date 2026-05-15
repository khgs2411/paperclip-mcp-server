import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { goalGetTool } from "../../src/tools/goal-get.js";
import { PaperclipClient } from "../../src/client.js";

describe("goal_get", () => {
  beforeEach(() => mock.restore());

  it("GETs a single goal by ID", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const spy = spyOn(client, "request").mockResolvedValueOnce({ id: "G1", title: "Launch v1", status: "active", description: "desc" });
    const result = await goalGetTool.handler({ goalId: "G1" }, { client });
    expect(spy).toHaveBeenCalledWith("GET", "/api/goals/G1?companyId=C1");
    expect(result).toEqual({ id: "G1", title: "Launch v1", status: "active", description: "desc" });
  });
});
