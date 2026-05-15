import { z } from "zod";
import type { ToolDefinition } from "./index.js";

const inputSchema = z.object({
  type: z.string().min(1).describe(
    "Adapter type (e.g. codex_local, claude_local, gemini_local, acpx_local, cursor, opencode_local)",
  ),
  companyId: z.string().optional().describe("Company UUID (falls back to PAPERCLIP_COMPANY_ID)"),
  refresh: z.boolean().optional().describe("Force a refresh of the cached model list"),
});

export const adapterModelsListTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_adapter_models_list",
  description:
    "List available models for a given adapter type. " +
    "Use this to discover which model IDs are available before configuring an agent. " +
    "Returns an array of {id, label} model records.",
  inputSchema,
  handler: async (input, { client }) => {
    const companyId = client.resolveCompanyId(input.companyId);
    const params = new URLSearchParams();
    if (input.refresh) params.set("refresh", "true");
    const qs = params.toString();
    const path =
      `/api/companies/${encodeURIComponent(companyId)}/adapters/${encodeURIComponent(input.type)}/models` +
      (qs ? `?${qs}` : "");
    return client.request("GET", path);
  },
};
