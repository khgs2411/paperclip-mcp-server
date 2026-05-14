import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { projectCreateTool } from "../../src/tools/project-create.js";
import { PaperclipClient } from "../../src/client.js";

describe("project_create", () => {
  beforeEach(() => mock.restore());

  it("POSTs /api/companies/:cid/projects with only the name", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const spy = spyOn(client, "request").mockResolvedValueOnce({
      id: "P1",
      name: "Test",
      status: "planned",
    });
    const result = await projectCreateTool.handler({ name: "Test" }, { client });
    expect(spy).toHaveBeenCalledWith("POST", "/api/companies/C1/projects", { name: "Test" });
    expect(result).toEqual({ id: "P1", name: "Test", status: "planned" });
  });
});
