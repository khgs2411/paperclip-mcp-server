import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { goalPatchTool } from "../../src/tools/goal-patch.js";
import { PaperclipClient } from "../../src/client.js";

describe("goal_patch", () => {
  beforeEach(() => mock.restore());

  it("PATCHes /api/goals/:id?companyId=:cid with body and returns goal", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const spy = spyOn(client, "request").mockResolvedValueOnce({
      id: "G1",
      title: "Ship v3",
      status: "in_progress",
    });
    const result = await goalPatchTool.handler({ goalId: "G1", title: "Ship v3" }, { client });
    expect(spy).toHaveBeenCalledWith("PATCH", "/api/goals/G1?companyId=C1", { title: "Ship v3" });
    expect(result).toEqual({ id: "G1", title: "Ship v3", status: "in_progress" });
  });

  it("rejects when no fields are provided", () => {
    const parsed = goalPatchTool.inputSchema.safeParse({ goalId: "G1" });
    expect(parsed.success).toBe(false);
  });
});
