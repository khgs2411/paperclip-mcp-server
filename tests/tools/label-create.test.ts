import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { labelCreateTool } from "../../src/tools/label-create.js";
import { PaperclipClient } from "../../src/client.js";

describe("label_create", () => {
  beforeEach(() => mock.restore());

  it("POSTs to labels and returns created label", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const spy = spyOn(client, "request").mockResolvedValueOnce({ id: "L1", name: "bug", color: "#f00" });
    const result = await labelCreateTool.handler({ name: "bug", color: "#f00" }, { client });
    expect(spy).toHaveBeenCalledWith("POST", "/api/companies/C1/labels", { name: "bug", color: "#f00" });
    expect(result).toEqual({ id: "L1", name: "bug", color: "#f00" });
  });
});
