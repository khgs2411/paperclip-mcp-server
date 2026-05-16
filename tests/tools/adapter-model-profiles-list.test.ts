import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { adapterModelProfilesListTool } from "../../src/tools/adapter-model-profiles-list.js";
import { PaperclipClient } from "../../src/client.js";

const PROFILES = [
  { key: "default", label: "Default", adapterConfig: { model: "gpt-5.5", reasoning: "low" } },
  { key: "high", label: "High", adapterConfig: { model: "gpt-5.5", reasoning: "high" } },
];

describe("adapter_model_profiles_list", () => {
  beforeEach(() => mock.restore());

  it("GETs /api/companies/:cid/adapters/:type/model-profiles", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "CID" });
    const spy = spyOn(client, "request").mockResolvedValueOnce(PROFILES);

    const result = await adapterModelProfilesListTool.handler({ type: "codex_local" }, { client });

    expect(spy).toHaveBeenCalledWith(
      "GET",
      "/api/companies/CID/adapters/codex_local/model-profiles",
    );
    expect(result).toEqual(PROFILES);
  });

  it("preserves explicit company scoping", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "DEFAULT" });
    const spy = spyOn(client, "request").mockResolvedValueOnce([]);

    await adapterModelProfilesListTool.handler(
      { type: "claude_local", companyId: "EXPLICIT" },
      { client },
    );

    expect(spy).toHaveBeenCalledWith(
      "GET",
      "/api/companies/EXPLICIT/adapters/claude_local/model-profiles",
    );
  });

  it("rejects missing type via schema", async () => {
    await expect(adapterModelProfilesListTool.inputSchema.parseAsync({})).rejects.toThrow();
  });
});
