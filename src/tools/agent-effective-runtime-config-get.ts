import { z } from "zod";
import type { ToolDefinition } from "./index.js";

const inputSchema = z.object({
  agentId: z.string().min(1).describe("Agent UUID or supported agent reference"),
  companyId: z.string().optional().describe("Company UUID (falls back to PAPERCLIP_COMPANY_ID)"),
});

export const agentEffectiveRuntimeConfigGetTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_agent_effective_runtime_config_get",
  description:
    "Read an audit-grade, redacted view of an agent's explicit adapter config, runtime model-profile config, " +
    "adapter defaults, and resolved effective model/reasoning values. Read-only; does not change live config.",
  inputSchema,
  handler: async (input, { client }) => {
    const companyId = client.resolveCompanyId(input.companyId);
    return client.request(
      "GET",
      `/api/agents/${encodeURIComponent(input.agentId)}/effective-runtime-config?companyId=${encodeURIComponent(companyId)}`,
    );
  },
};
