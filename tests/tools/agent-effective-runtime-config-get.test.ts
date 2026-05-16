import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { agentEffectiveRuntimeConfigGetTool } from "../../src/tools/agent-effective-runtime-config-get.js";
import { PaperclipClient } from "../../src/client.js";
import { PaperclipApiError } from "../../src/shared/errors.js";

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

  it("falls back to configuration and adapter profiles when the native effective route is missing", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "CID" });
    const configuration = {
      id: "agent-1",
      companyId: "CID",
      name: "Atlas",
      adapterType: "topsyde_codex_local",
      adapterConfig: { model: "gpt-5.5", modelReasoningEffort: "high" },
      runtimeConfig: {
        modelProfiles: {
          worker: {
            adapterConfig: { modelReasoningEffort: "low" },
          },
        },
      },
    };
    const profiles = [
      {
        key: "worker",
        label: "Worker",
        adapterConfig: { model: "gpt-5.5", modelReasoningEffort: "medium" },
      },
    ];
    const spy = spyOn(client, "request")
      .mockRejectedValueOnce(
        new PaperclipApiError(404, { error: "API route not found" }, "/missing"),
      )
      .mockResolvedValueOnce(configuration)
      .mockResolvedValueOnce(profiles);

    const result = await agentEffectiveRuntimeConfigGetTool.handler(
      { agentId: "agent-1" },
      { client },
    );

    expect(spy).toHaveBeenNthCalledWith(
      2,
      "GET",
      "/api/agents/agent-1/configuration?companyId=CID",
    );
    expect(spy).toHaveBeenNthCalledWith(
      3,
      "GET",
      "/api/companies/CID/adapters/topsyde_codex_local/model-profiles",
    );
    expect(result).toMatchObject({
      id: "agent-1",
      adapterType: "topsyde_codex_local",
      provenance: { source: "agent_configuration_readback" },
      effectivePrimary: {
        model: "gpt-5.5",
        reasoning: "high",
      },
      modelProfiles: [
        {
          profileKey: "worker",
          effective: {
            model: "gpt-5.5",
            reasoning: "low",
          },
        },
      ],
    });
  });

  it("rejects missing agentId via schema", async () => {
    await expect(agentEffectiveRuntimeConfigGetTool.inputSchema.parseAsync({})).rejects.toThrow();
  });
});
