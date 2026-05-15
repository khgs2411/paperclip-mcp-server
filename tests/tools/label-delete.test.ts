import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { labelDeleteTool } from "../../src/tools/label-delete.js";
import { PaperclipClient } from "../../src/client.js";

describe("label_delete", () => {
  beforeEach(() => mock.restore());

  it("DELETEs label and returns deleted: true", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const spy = spyOn(client, "request").mockResolvedValueOnce(undefined);
    const result = await labelDeleteTool.handler({ labelId: "L1", confirm: true }, { client });
    expect(spy).toHaveBeenCalledWith("DELETE", "/api/labels/L1?companyId=C1");
    expect(result).toEqual({ deleted: true, id: "L1" });
  });

  it("rejects when confirm is not true", async () => {
    await expect(
      labelDeleteTool.inputSchema.parseAsync({ labelId: "L1" }),
    ).rejects.toThrow();
  });
});
