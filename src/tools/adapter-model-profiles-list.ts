import { z } from "zod";
import type { ToolDefinition } from "./index.js";

const inputSchema = z.object({
  type: z.string().min(1).describe(
    "Adapter type (e.g. codex_local, claude_local, gemini_local, acpx_local, cursor, opencode_local)",
  ),
  companyId: z.string().optional().describe("Company UUID (falls back to PAPERCLIP_COMPANY_ID)"),
});

export const adapterModelProfilesListTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_adapter_model_profiles_list",
  description:
    "List adapter-supported model profiles and their default model/reasoning adapterConfig. " +
    "Read-only audit path for verifying role-profile model and reasoning support before rollout.",
  inputSchema,
  handler: async (input, { client }) => {
    const companyId = client.resolveCompanyId(input.companyId);
    return client.request(
      "GET",
      `/api/companies/${encodeURIComponent(companyId)}/adapters/${encodeURIComponent(input.type)}/model-profiles`,
    );
  },
};
