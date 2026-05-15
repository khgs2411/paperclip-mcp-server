import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { goalCreateTool } from "../../src/tools/goal-create.js";
import { PaperclipClient } from "../../src/client.js";

describe("goal_create", () => {
  beforeEach(() => mock.restore());

  it("POSTs /api/companies/:cid/goals and returns goal", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const spy = spyOn(client, "request").mockResolvedValueOnce({
      id: "G1",
      title: "Ship v2",
      status: "planned",
    });
    const result = await goalCreateTool.handler({ title: "Ship v2" }, { client });
    expect(spy).toHaveBeenCalledWith("POST", "/api/companies/C1/goals", { title: "Ship v2" });
    expect(result).toEqual({ id: "G1", title: "Ship v2", status: "planned" });
  });
});
