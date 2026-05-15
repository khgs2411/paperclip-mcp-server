import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { routineRunsListTool } from "../../src/tools/routine-runs-list.js";
import { PaperclipClient } from "../../src/client.js";

describe("routine_runs_list", () => {
  beforeEach(() => mock.restore());

  it("GETs /api/routines/:id/runs?companyId=:cid and passes through the response", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const payload = [{ id: "RUN1", status: "completed" }];
    const spy = spyOn(client, "request").mockResolvedValueOnce(payload);
    const result = await routineRunsListTool.handler({ routineId: "R1" }, { client });
    expect(spy).toHaveBeenCalledWith("GET", "/api/routines/R1/runs?companyId=C1");
    expect(result).toEqual(payload);
  });

  it("appends limit param when provided", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const spy = spyOn(client, "request").mockResolvedValueOnce([]);
    await routineRunsListTool.handler({ routineId: "R1", limit: 10 }, { client });
    expect(spy).toHaveBeenCalledWith("GET", "/api/routines/R1/runs?companyId=C1&limit=10");
  });
});
