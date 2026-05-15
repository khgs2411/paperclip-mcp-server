import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { skillListTool } from "../../src/tools/skill-list.js";
import { PaperclipClient } from "../../src/client.js";

describe("skill_list", () => {
  beforeEach(() => mock.restore());

  it("rejects when companyId cannot be resolved", () => {
    const client = new PaperclipClient({ apiBase: "http://x" });
    const parsed = skillListTool.inputSchema.safeParse({ companyId: 123 });
    expect(parsed.success).toBe(false);
  });

  it("GETs /api/companies/:cid/skills and returns mapped array", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const spy = spyOn(client, "request").mockResolvedValueOnce([
      { id: "S1", name: "knox", description: "Knox skill" },
    ]);
    const result = await skillListTool.handler({}, { client });
    expect(spy).toHaveBeenCalledWith("GET", "/api/companies/C1/skills");
    expect(result).toEqual([{ id: "S1", name: "knox", description: "Knox skill" }]);
  });

  it("propagates errors from client.request", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    spyOn(client, "request").mockRejectedValueOnce(new Error("network error"));
    await expect(skillListTool.handler({}, { client })).rejects.toThrow("network error");
  });
});
