import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { skillDeleteTool } from "../../src/tools/skill-delete.js";
import { PaperclipClient } from "../../src/client.js";

describe("skill_delete", () => {
  beforeEach(() => mock.restore());

  it("validates inputSchema — skillId required, confirm must be true", () => {
    expect(skillDeleteTool.inputSchema.safeParse({}).success).toBe(false);
    expect(skillDeleteTool.inputSchema.safeParse({ skillId: "S1" }).success).toBe(false);
    expect(skillDeleteTool.inputSchema.safeParse({ skillId: "S1", confirm: true }).success).toBe(true);
  });

  it("rejects when confirm is not true", () => {
    const parsed = skillDeleteTool.inputSchema.safeParse({ skillId: "S1", confirm: false });
    expect(parsed.success).toBe(false);
  });

  it("DELETEs /api/companies/:cid/skills/:skillId and returns {deleted:true,id}", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const spy = spyOn(client, "request").mockResolvedValueOnce({ ok: true });
    const result = await skillDeleteTool.handler({ skillId: "S1", confirm: true }, { client });
    expect(spy).toHaveBeenCalledWith("DELETE", "/api/companies/C1/skills/S1");
    expect(result).toEqual({ deleted: true, id: "S1" });
  });

  it("handler throws ToolInputError if called without confirm via bypass", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    // @ts-expect-error — simulating bypass
    await expect(skillDeleteTool.handler({ skillId: "S1" }, { client })).rejects.toThrow("confirm");
  });

  it("uses overridden companyId when provided", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const spy = spyOn(client, "request").mockResolvedValueOnce({});
    await skillDeleteTool.handler({ skillId: "S1", confirm: true, companyId: "C2" }, { client });
    expect(spy).toHaveBeenCalledWith("DELETE", "/api/companies/C2/skills/S1");
  });
});
