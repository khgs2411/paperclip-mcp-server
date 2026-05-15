import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { skillGetTool } from "../../src/tools/skill-get.js";
import { PaperclipClient } from "../../src/client.js";

describe("skill_get", () => {
  beforeEach(() => mock.restore());

  it("rejects when skillId is empty", () => {
    const parsed = skillGetTool.inputSchema.safeParse({ skillId: "" });
    expect(parsed.success).toBe(false);
  });

  it("GETs /api/companies/:cid/skills/:skillId and returns skill", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const spy = spyOn(client, "request").mockResolvedValueOnce({
      id: "S1",
      name: "knox",
      description: "Knox skill",
    });
    const result = await skillGetTool.handler({ skillId: "S1" }, { client });
    expect(spy).toHaveBeenCalledWith("GET", "/api/companies/C1/skills/S1");
    expect(result).toEqual({ id: "S1", name: "knox", description: "Knox skill" });
  });

  it("propagates errors from client.request", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    spyOn(client, "request").mockRejectedValueOnce(new Error("not found"));
    await expect(skillGetTool.handler({ skillId: "S1" }, { client })).rejects.toThrow("not found");
  });
});
