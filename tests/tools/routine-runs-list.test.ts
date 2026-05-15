import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { routineRunsListTool } from "../../src/tools/routine-runs-list.js";
import { PaperclipClient } from "../../src/client.js";

describe("routine_runs_list", () => {
  beforeEach(() => mock.restore());

  it("GETs routine runs and returns pass-through", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const runs = [{ id: "RUN1", status: "done" }];
    const spy = spyOn(client, "request").mockResolvedValueOnce(runs);
    const result = await routineRunsListTool.handler({ routineId: "R1" }, { client });
    expect(spy).toHaveBeenCalledWith("GET", "/api/routines/R1/runs?companyId=C1");
    expect(result).toEqual(runs);
  });
});
