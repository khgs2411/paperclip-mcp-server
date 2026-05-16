import { z } from "zod";
import type { ToolDefinition } from "./index.js";
import { PaperclipApiError } from "../shared/errors.js";

const inputSchema = z.object({
  agentId: z.string().min(1).describe("Agent UUID or supported agent reference"),
  companyId: z.string().optional().describe("Company UUID (falls back to PAPERCLIP_COMPANY_ID)"),
});

type RecordValue = Record<string, unknown>;

function asRecord(value: unknown): RecordValue {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as RecordValue;
}

function readConfigString(config: RecordValue, key: string): string | null {
  const value = config[key];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function summarizeModelReasoning(config: RecordValue) {
  return {
    model: readConfigString(config, "model"),
    reasoning: readConfigString(config, "reasoning") ??
      readConfigString(config, "modelReasoningEffort") ??
      readConfigString(config, "effort"),
  };
}

function buildRuntimeModelProfileReadbacks(input: {
  runtimeConfig: RecordValue;
  adapterModelProfiles: Array<RecordValue>;
  baseAdapterConfig: RecordValue;
}) {
  const runtimeModelProfiles = asRecord(input.runtimeConfig.modelProfiles);
  const profileKeys = Array.from(new Set([
    ...input.adapterModelProfiles
      .map((profile) => readConfigString(profile, "key"))
      .filter((key): key is string => Boolean(key)),
    ...Object.keys(runtimeModelProfiles),
  ])).sort();

  return profileKeys.map((profileKey) => {
    const adapterProfile =
      input.adapterModelProfiles.find((profile) => profile.key === profileKey) ?? null;
    const adapterDefaultConfig = asRecord(adapterProfile?.adapterConfig);
    const runtimeProfile = asRecord(runtimeModelProfiles[profileKey]);
    const explicitRuntimeAdapterConfig = asRecord(runtimeProfile.adapterConfig);
    const enabled = runtimeProfile.enabled !== false;
    const adapterProfileSupported = Boolean(adapterProfile);
    const effectiveAdapterConfig = enabled && adapterProfileSupported
      ? {
        ...input.baseAdapterConfig,
        ...adapterDefaultConfig,
        ...explicitRuntimeAdapterConfig,
      }
      : input.baseAdapterConfig;

    return {
      profileKey,
      enabled,
      applied: enabled && adapterProfileSupported ? profileKey : null,
      fallbackReason: adapterProfileSupported
        ? enabled ? null : "agent_runtime_profile_disabled"
        : "adapter_profile_not_supported",
      configuredOnAgent: Object.keys(runtimeProfile).length > 0,
      adapterProfileSupported,
      configSource: enabled && adapterProfileSupported
        ? Object.keys(runtimeProfile).length > 0 ? "agent_runtime" : "adapter_default"
        : null,
      explicitRuntimeAdapterConfig,
      adapterDefaultConfig,
      effectiveAdapterConfig,
      effective: summarizeModelReasoning(effectiveAdapterConfig),
    };
  });
}

function buildFallbackReadback(configuration: unknown, adapterModelProfiles: unknown) {
  const agent = asRecord(configuration);
  const explicitAgentAdapterConfig = asRecord(agent.adapterConfig);
  const explicitAgentRuntimeConfig = asRecord(agent.runtimeConfig);
  const profiles = Array.isArray(adapterModelProfiles)
    ? adapterModelProfiles.map((profile) => asRecord(profile))
    : [];

  return {
    id: agent.id,
    companyId: agent.companyId,
    name: agent.name,
    adapterType: agent.adapterType,
    explicitAgentAdapterConfig,
    explicitAgentRuntimeConfig,
    adapterDefaults: {
      modelProfiles: profiles.map((profile) => ({
        key: profile.key,
        label: profile.label ?? null,
        adapterConfig: asRecord(profile.adapterConfig),
        effective: summarizeModelReasoning(asRecord(profile.adapterConfig)),
      })),
    },
    effectivePrimary: {
      adapterConfig: explicitAgentAdapterConfig,
      ...summarizeModelReasoning(explicitAgentAdapterConfig),
    },
    modelProfiles: buildRuntimeModelProfileReadbacks({
      runtimeConfig: explicitAgentRuntimeConfig,
      adapterModelProfiles: profiles,
      baseAdapterConfig: explicitAgentAdapterConfig,
    }),
    provenance: {
      source: "agent_configuration_readback",
      note:
        "Read-only redacted configuration readback. Runtime issue overrides and secret resolution are not applied.",
      fallback: "mcp_computed_from_configuration_endpoint",
    },
  };
}

export const agentEffectiveRuntimeConfigGetTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_agent_effective_runtime_config_get",
  description:
    "Read an audit-grade, redacted view of an agent's explicit adapter config, runtime model-profile config, " +
    "adapter defaults, and resolved effective model/reasoning values. Read-only; does not change live config.",
  inputSchema,
  handler: async (input, { client }) => {
    const companyId = client.resolveCompanyId(input.companyId);
    const agentPath = `/api/agents/${encodeURIComponent(input.agentId)}`;
    try {
      return await client.request(
        "GET",
        `${agentPath}/effective-runtime-config?companyId=${encodeURIComponent(companyId)}`,
      );
    } catch (err) {
      if (!(err instanceof PaperclipApiError) || err.statusCode !== 404) throw err;
    }

    const configuration = await client.request<RecordValue>(
      "GET",
      `${agentPath}/configuration?companyId=${encodeURIComponent(companyId)}`,
    );
    const adapterType = readConfigString(configuration, "adapterType");
    if (!adapterType) return buildFallbackReadback(configuration, []);

    const adapterModelProfiles = await client.request<unknown>(
      "GET",
      `/api/companies/${encodeURIComponent(companyId)}/adapters/${encodeURIComponent(adapterType)}/model-profiles`,
    );
    return buildFallbackReadback(configuration, adapterModelProfiles);
  },
};
