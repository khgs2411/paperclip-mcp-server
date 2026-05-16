import { describe, expect, it, spyOn } from "bun:test";
import { buildMcpRuntimeContext } from "../../src/auth/context.js";
import { PaperclipClient } from "../../src/client.js";

describe("MCP runtime context", () => {
  it("uses explicit local board mode for local sessions", async () => {
    const client = new PaperclipClient({ apiBase: "http://x" });
    const ctx = await buildMcpRuntimeContext({
      mode: "local_board",
      client,
      agentApiKey: undefined,
    });
    expect(ctx).toEqual({ mode: "local_board" });
  });

  it("fails closed for managed mode without an agent token", async () => {
    const client = new PaperclipClient({ apiBase: "http://x" });
    await expect(
      buildMcpRuntimeContext({
        mode: "managed_agent",
        client,
        agentApiKey: undefined,
      }),
    ).rejects.toThrow("managed MCP mode requires PAPERCLIP_AGENT_API_KEY");
  });

  it("builds managed context from API-issued token readback", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", agentApiKey: "token" });
    spyOn(client, "request").mockResolvedValueOnce({
      agentId: "atlas",
      runId: "run-1",
      issueId: "TOP-201",
      profile: "coordinator",
      allowedTools: ["paperclip_issue_create_child"],
    });

    const ctx = await buildMcpRuntimeContext({
      mode: "managed_agent",
      client,
      agentApiKey: "token",
    });

    expect(ctx).toEqual({
      mode: "managed_agent",
      agentId: "atlas",
      runId: "run-1",
      issueId: "TOP-201",
      profile: "coordinator",
      allowedTools: ["paperclip_issue_create_child"],
    });
  });
});
