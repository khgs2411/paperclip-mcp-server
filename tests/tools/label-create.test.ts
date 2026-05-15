import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { labelCreateTool } from "../../src/tools/label-create.js";
import { PaperclipClient } from "../../src/client.js";

describe("label_create", () => {
  beforeEach(() => mock.restore());

  it("POSTs /api/companies/:cid/labels with name and color", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const spy = spyOn(client, "request").mockResolvedValueOnce({
      id: "L1",
      name: "Bug",
      color: "#ff0000",
    });
    const result = await labelCreateTool.handler({ name: "Bug", color: "#ff0000" }, { client });
    expect(spy).toHaveBeenCalledWith("POST", "/api/companies/C1/labels", {
      name: "Bug",
      color: "#ff0000",
    });
    expect(result).toEqual({ id: "L1", name: "Bug", color: "#ff0000" });
  });

  it("POSTs without color when not provided", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const spy = spyOn(client, "request").mockResolvedValueOnce({
      id: "L2",
      name: "Feature",
      color: undefined,
    });
    const result = await labelCreateTool.handler({ name: "Feature" }, { client });
    expect(spy).toHaveBeenCalledWith("POST", "/api/companies/C1/labels", { name: "Feature" });
    expect(result).toEqual({ id: "L2", name: "Feature", color: undefined });
  });
});
