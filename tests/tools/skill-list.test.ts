import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { skillListTool } from "../../src/tools/skill-list.js";
import { PaperclipClient } from "../../src/client.js";

describe("skill_list", () => {
  beforeEach(() => mock.restore());

  it("validates inputSchema — companyId is optional", () => {
    expect(skillListTool.inputSchema.safeParse({}).success).toBe(true);
    expect(skillListTool.inputSchema.safeParse({ companyId: "C1" }).success).toBe(true);
  });

  it("GETs /api/companies/:cid/skills and returns mapped array", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const spy = spyOn(client, "request").mockResolvedValueOnce([
      { id: "S1", name: "paperclip", description: "Paperclip skill" },
    ]);
    const result = await skillListTool.handler({}, { client });
    expect(spy).toHaveBeenCalledWith("GET", "/api/companies/C1/skills");
    expect(result).toEqual([{ id: "S1", name: "paperclip", description: "Paperclip skill" }]);
  });

  it("uses overridden companyId when provided", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const spy = spyOn(client, "request").mockResolvedValueOnce([]);
    await skillListTool.handler({ companyId: "C2" }, { client });
    expect(spy).toHaveBeenCalledWith("GET", "/api/companies/C2/skills");
  });
});
