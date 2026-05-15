import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { projectPatchTool } from "../../src/tools/project-patch.js";
import { PaperclipClient } from "../../src/client.js";

describe("project_patch", () => {
  beforeEach(() => mock.restore());

  it("PATCHes project and returns compact shape", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const spy = spyOn(client, "request").mockResolvedValueOnce({ id: "P1", name: "Beta", status: "active", urlKey: "beta" });
    const result = await projectPatchTool.handler({ projectId: "P1", name: "Beta" }, { client });
    expect(spy).toHaveBeenCalledWith("PATCH", "/api/projects/P1?companyId=C1", { name: "Beta" });
    expect(result).toEqual({ id: "P1", name: "Beta", status: "active", urlKey: "beta" });
  });

  it("rejects when no patch fields provided", async () => {
    await expect(
      projectPatchTool.inputSchema.parseAsync({ projectId: "P1" }),
    ).rejects.toThrow();
  });
});
