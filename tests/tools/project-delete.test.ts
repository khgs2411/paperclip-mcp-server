import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { projectDeleteTool } from "../../src/tools/project-delete.js";
import { PaperclipClient } from "../../src/client.js";

describe("project_delete", () => {
  beforeEach(() => mock.restore());

  it("DELETEs /api/projects/:id and returns {deleted:true,id}", async () => {
    const client = new PaperclipClient({ apiBase: "http://x" });
    const spy = spyOn(client, "request").mockResolvedValueOnce({ ok: true });
    const result = await projectDeleteTool.handler({ projectId: "P1" }, { client });
    expect(spy).toHaveBeenCalledWith("DELETE", "/api/projects/P1");
    expect(result).toEqual({ deleted: true, id: "P1" });
  });
});
