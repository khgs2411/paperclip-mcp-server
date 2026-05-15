import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { projectPatchTool } from "../../src/tools/project-patch.js";
import { PaperclipClient } from "../../src/client.js";

describe("project_patch", () => {
  beforeEach(() => mock.restore());

  it("PATCHes /api/projects/:id?companyId=:cid with body and returns project", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const spy = spyOn(client, "request").mockResolvedValueOnce({
      id: "P1",
      name: "Beta",
      status: "active",
      urlKey: "beta",
    });
    const result = await projectPatchTool.handler({ projectId: "P1", name: "Beta" }, { client });
    expect(spy).toHaveBeenCalledWith("PATCH", "/api/projects/P1?companyId=C1", { name: "Beta" });
    expect(result).toEqual({ id: "P1", name: "Beta", status: "active", urlKey: "beta" });
  });

  it("rejects when neither name nor status is provided", async () => {
    const parsed = projectPatchTool.inputSchema.safeParse({ projectId: "P1" });
    expect(parsed.success).toBe(false);
  });
});
