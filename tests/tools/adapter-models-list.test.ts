import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { adapterModelsListTool } from "../../src/tools/adapter-models-list.js";
import { PaperclipClient } from "../../src/client.js";
import { PaperclipApiError } from "../../src/shared/errors.js";

const MODELS = [
  { id: "gpt-5.5", label: "gpt-5.5" },
  { id: "gpt-5", label: "gpt-5" },
];

describe("adapter_models_list", () => {
  beforeEach(() => mock.restore());

  it("GETs /api/companies/:cid/adapters/:type/models with no extras", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "CID" });
    const spy = spyOn(client, "request").mockResolvedValueOnce(MODELS);
    const result = await adapterModelsListTool.handler({ type: "codex_local" }, { client });
    expect(spy).toHaveBeenCalledWith("GET", "/api/companies/CID/adapters/codex_local/models");
    expect(result).toEqual(MODELS);
  });

  it("uses explicit companyId over default", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "DEFAULT" });
    const spy = spyOn(client, "request").mockResolvedValueOnce([]);
    await adapterModelsListTool.handler({ type: "claude_local", companyId: "EXPLICIT" }, { client });
    expect(spy).toHaveBeenCalledWith("GET", "/api/companies/EXPLICIT/adapters/claude_local/models");
  });

  it("appends refresh=true when refresh flag is set", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "CID" });
    const spy = spyOn(client, "request").mockResolvedValueOnce(MODELS);
    await adapterModelsListTool.handler({ type: "codex_local", refresh: true }, { client });
    const [, path] = spy.mock.calls[0]!;
    expect(path).toContain("refresh=true");
  });

  it("does not append refresh param when refresh is false", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "CID" });
    const spy = spyOn(client, "request").mockResolvedValueOnce([]);
    await adapterModelsListTool.handler({ type: "codex_local", refresh: false }, { client });
    const [, path] = spy.mock.calls[0]!;
    expect(path).not.toContain("refresh");
  });

  it("throws ToolInputError when no companyId and no env default", async () => {
    const client = new PaperclipClient({ apiBase: "http://x" });
    await expect(
      adapterModelsListTool.handler({ type: "codex_local" }, { client }),
    ).rejects.toThrow("companyId");
  });

  it("propagates API errors from the server", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "CID" });
    spyOn(client, "request").mockRejectedValueOnce(
      new PaperclipApiError(400, { error: "Unknown adapter type: bad" }, "/api/companies/CID/adapters/bad/models"),
    );
    await expect(
      adapterModelsListTool.handler({ type: "bad" }, { client }),
    ).rejects.toBeInstanceOf(PaperclipApiError);
  });

  it("rejects missing type via schema", async () => {
    await expect(adapterModelsListTool.inputSchema.parseAsync({})).rejects.toThrow();
  });

  it("rejects empty string type via schema", async () => {
    await expect(adapterModelsListTool.inputSchema.parseAsync({ type: "" })).rejects.toThrow();
  });
});
