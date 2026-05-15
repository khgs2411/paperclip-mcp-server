import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { labelListTool } from "../../src/tools/label-list.js";
import { PaperclipClient } from "../../src/client.js";

describe("label_list", () => {
  beforeEach(() => mock.restore());

  it("GETs /api/companies/:cid/labels and returns mapped array", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const spy = spyOn(client, "request").mockResolvedValueOnce([
      { id: "L1", name: "Bug", color: "#ff0000" },
    ]);
    const result = await labelListTool.handler({}, { client });
    expect(spy).toHaveBeenCalledWith("GET", "/api/companies/C1/labels");
    expect(result).toEqual([{ id: "L1", name: "Bug", color: "#ff0000" }]);
  });
});
