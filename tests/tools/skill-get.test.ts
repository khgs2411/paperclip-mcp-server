import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { skillGetTool } from "../../src/tools/skill-get.js";
import { PaperclipClient } from "../../src/client.js";

describe("skill_get", () => {
  beforeEach(() => mock.restore());

  it("validates inputSchema — skillId is required", () => {
    expect(skillGetTool.inputSchema.safeParse({}).success).toBe(false);
    expect(skillGetTool.inputSchema.safeParse({ skillId: "" }).success).toBe(false);
    expect(skillGetTool.inputSchema.safeParse({ skillId: "S1" }).success).toBe(true);
  });

  it("GETs /api/companies/:cid/skills/:skillId and returns mapped object", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const spy = spyOn(client, "request").mockResolvedValueOnce({
      id: "S1",
      name: "paperclip",
      description: "Paperclip skill",
    });
    const result = await skillGetTool.handler({ skillId: "S1" }, { client });
    expect(spy).toHaveBeenCalledWith("GET", "/api/companies/C1/skills/S1");
    expect(result).toEqual({ id: "S1", name: "paperclip", description: "Paperclip skill" });
  });

  it("uses overridden companyId when provided", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const spy = spyOn(client, "request").mockResolvedValueOnce({ id: "S1", name: "x" });
    await skillGetTool.handler({ skillId: "S1", companyId: "C2" }, { client });
    expect(spy).toHaveBeenCalledWith("GET", "/api/companies/C2/skills/S1");
  });
});
