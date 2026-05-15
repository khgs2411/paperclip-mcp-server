import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { routineCreateTool } from "../../src/tools/routine-create.js";
import { PaperclipClient } from "../../src/client.js";

describe("routine_create", () => {
  beforeEach(() => mock.restore());

  it("POSTs to routines and returns id, name, agentId", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const spy = spyOn(client, "request").mockResolvedValueOnce({ id: "R1", name: "Daily", agentId: "A1", status: "active" });
    const result = await routineCreateTool.handler({ name: "Daily", agentId: "A1" }, { client });
    expect(spy).toHaveBeenCalledWith("POST", "/api/companies/C1/routines", { name: "Daily", agentId: "A1" });
    expect(result).toEqual({ id: "R1", name: "Daily", agentId: "A1" });
  });
});
