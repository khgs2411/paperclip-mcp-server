import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { goalCreateTool } from "../../src/tools/goal-create.js";
import { PaperclipClient } from "../../src/client.js";

describe("goal_create", () => {
  beforeEach(() => mock.restore());

  it("POSTs to goals and returns created goal", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const spy = spyOn(client, "request").mockResolvedValueOnce({ id: "G1", title: "Launch v1", status: "active" });
    const result = await goalCreateTool.handler({ title: "Launch v1" }, { client });
    expect(spy).toHaveBeenCalledWith("POST", "/api/companies/C1/goals", { title: "Launch v1" });
    expect(result).toEqual({ id: "G1", title: "Launch v1", status: "active" });
  });
});
