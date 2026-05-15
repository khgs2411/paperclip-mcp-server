import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { projectGetTool } from "../../src/tools/project-get.js";
import { PaperclipClient } from "../../src/client.js";

describe("project_get", () => {
  beforeEach(() => mock.restore());

  it("GETs a single project by ID", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const spy = spyOn(client, "request").mockResolvedValueOnce({ id: "P1", name: "Alpha", status: "active", urlKey: "alpha" });
    const result = await projectGetTool.handler({ projectId: "P1" }, { client });
    expect(spy).toHaveBeenCalledWith("GET", "/api/projects/P1?companyId=C1");
    expect(result).toEqual({ id: "P1", name: "Alpha", status: "active", urlKey: "alpha" });
  });
});
