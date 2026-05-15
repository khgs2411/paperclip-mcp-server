import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { goalDeleteTool } from "../../src/tools/goal-delete.js";
import { PaperclipClient } from "../../src/client.js";

describe("goal_delete", () => {
  beforeEach(() => mock.restore());

  it("DELETEs goal and returns deleted: true", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const spy = spyOn(client, "request").mockResolvedValueOnce(undefined);
    const result = await goalDeleteTool.handler({ goalId: "G1", confirm: true }, { client });
    expect(spy).toHaveBeenCalledWith("DELETE", "/api/goals/G1?companyId=C1");
    expect(result).toEqual({ deleted: true, id: "G1" });
  });

  it("rejects when confirm is not provided", async () => {
    await expect(
      goalDeleteTool.inputSchema.parseAsync({ goalId: "G1" }),
    ).rejects.toThrow();
  });
});
