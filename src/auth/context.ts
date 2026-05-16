import type { PaperclipClient } from "../client.js";
import type { AccessProfile, McpRuntimeContext } from "./access.js";

export type McpLaunchMode = "local_board" | "managed_agent";

interface BuildContextInput {
  mode: McpLaunchMode;
  client: PaperclipClient;
  agentApiKey: string | undefined;
}

interface ManagedContextReadback {
  agentId: string;
  runId: string;
  issueId: string;
  parentIssueId?: string;
  profile: AccessProfile;
  allowedTools?: string[];
}

export async function buildMcpRuntimeContext(
  input: BuildContextInput,
): Promise<McpRuntimeContext> {
  if (input.mode === "local_board") return { mode: "local_board" };

  if (!input.agentApiKey) {
    throw new Error("managed MCP mode requires PAPERCLIP_AGENT_API_KEY");
  }

  const readback = await input.client.request<ManagedContextReadback>(
    "GET",
    "/api/agents/me/mcp-context",
  );

  return {
    mode: "managed_agent",
    agentId: readback.agentId,
    runId: readback.runId,
    issueId: readback.issueId,
    parentIssueId: readback.parentIssueId,
    profile: readback.profile,
    allowedTools: readback.allowedTools,
  };
}
