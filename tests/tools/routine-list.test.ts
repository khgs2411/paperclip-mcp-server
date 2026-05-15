import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { routineListTool } from "../../src/tools/routine-list.js";
import { PaperclipClient } from "../../src/client.js";

describe("routine_list", () => {
  beforeEach(() => mock.restore());

  it("GETs routines array and returns compact items", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const spy = spyOn(client, "request").mockResolvedValueOnce([
      { id: "R1", name: "Daily", agentId: "A1", status: "active", extra: "x" },
    ]);
    const result = await routineListTool.handler({}, { client });
    expect(spy).toHaveBeenCalledWith("GET", "/api/companies/C1/routines");
    expect(result).toEqual([{ id: "R1", name: "Daily", agentId: "A1", status: "active" }]);
  });

  it("handles { routines: [...] } response shape", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    spyOn(client, "request").mockResolvedValueOnce({ routines: [{ id: "R2", name: "Weekly", agentId: "A2", status: "active" }] });
    const result = await routineListTool.handler({}, { client }) as Array<{ id: string }>;
    expect(result[0]?.id).toBe("R2");
  });
});
