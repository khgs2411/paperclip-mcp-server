import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { skillDeleteTool } from "../../src/tools/skill-delete.js";
import { PaperclipClient } from "../../src/client.js";

describe("skill_delete", () => {
  beforeEach(() => mock.restore());

  it("rejects when confirm is not true", () => {
    const parsed = skillDeleteTool.inputSchema.safeParse({ skillId: "S1" });
    expect(parsed.success).toBe(false);
  });

  it("DELETEs /api/companies/:cid/skills/:skillId and returns {deleted:true,id}", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const spy = spyOn(client, "request").mockResolvedValueOnce({ ok: true });
    const result = await skillDeleteTool.handler({ skillId: "S1", confirm: true }, { client });
    expect(spy).toHaveBeenCalledWith("DELETE", "/api/companies/C1/skills/S1");
    expect(result).toEqual({ deleted: true, id: "S1" });
  });

  it("propagates errors from client.request", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    spyOn(client, "request").mockRejectedValueOnce(new Error("forbidden"));
    await expect(
      skillDeleteTool.handler({ skillId: "S1", confirm: true }, { client }),
    ).rejects.toThrow("forbidden");
  });
});
