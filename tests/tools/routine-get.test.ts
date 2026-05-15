import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { routineGetTool } from "../../src/tools/routine-get.js";
import { PaperclipClient } from "../../src/client.js";

describe("routine_get", () => {
  beforeEach(() => mock.restore());

  it("GETs /api/routines/:id?companyId=:cid and passes through the response", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const payload = { id: "R1", name: "Daily sync", agentId: "A1", status: "active" };
    const spy = spyOn(client, "request").mockResolvedValueOnce(payload);
    const result = await routineGetTool.handler({ routineId: "R1" }, { client });
    expect(spy).toHaveBeenCalledWith("GET", "/api/routines/R1?companyId=C1");
    expect(result).toEqual(payload);
  });
});
