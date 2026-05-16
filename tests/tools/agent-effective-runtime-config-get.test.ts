import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { agentEffectiveRuntimeConfigGetTool } from "../../src/tools/agent-effective-runtime-config-get.js";
import { PaperclipClient } from "../../src/client.js";

describe("agent_effective_runtime_config_get", () => {
  beforeEach(() => mock.restore());

  it("GETs /api/agents/:id/effective-runtime-config with resolved companyId", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "CID" });
    const payload = {
      id: "agent-1",
      adapterType: "codex_local",
      effectivePrimary: { model: "gpt-5.5", reasoning: "low" },
    };
    const spy = spyOn(client, "request").mockResolvedValueOnce(payload);

    const result = await agentEffectiveRuntimeConfigGetTool.handler(
      { agentId: "agent-1" },
      { client },
    );

    expect(spy).toHaveBeenCalledWith(
      "GET",
      "/api/agents/agent-1/effective-runtime-config?companyId=CID",
    );
    expect(result).toEqual(payload);
  });

  it("preserves explicit company scoping", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "DEFAULT" });
    const spy = spyOn(client, "request").mockResolvedValueOnce({});

    await agentEffectiveRuntimeConfigGetTool.handler(
      { agentId: "agent-1", companyId: "EXPLICIT" },
      { client },
    );

    expect(spy).toHaveBeenCalledWith(
      "GET",
      "/api/agents/agent-1/effective-runtime-config?companyId=EXPLICIT",
    );
  });

  it("rejects missing agentId via schema", async () => {
    await expect(agentEffectiveRuntimeConfigGetTool.inputSchema.parseAsync({})).rejects.toThrow();
  });
});
