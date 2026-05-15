import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { projectListTool } from "../../src/tools/project-list.js";
import { PaperclipClient } from "../../src/client.js";

describe("project_list", () => {
  beforeEach(() => mock.restore());

  it("GETs /api/companies/:cid/projects and returns mapped array", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const spy = spyOn(client, "request").mockResolvedValueOnce([
      { id: "P1", name: "Alpha", status: "active", urlKey: "alpha" },
    ]);
    const result = await projectListTool.handler({}, { client });
    expect(spy).toHaveBeenCalledWith("GET", "/api/companies/C1/projects");
    expect(result).toEqual([{ id: "P1", name: "Alpha", status: "active", urlKey: "alpha" }]);
  });
});
