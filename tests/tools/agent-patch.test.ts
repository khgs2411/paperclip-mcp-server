import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { agentPatchTool } from "../../src/tools/agent-patch.js";
import { PaperclipClient } from "../../src/client.js";

describe("agent_patch", () => {
  beforeEach(() => mock.restore());

  it("PATCHes the agent endpoint with companyId query and returns compact shape", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const requestSpy = spyOn(client, "request").mockResolvedValueOnce({
      id: "A1",
      name: "Atlas",
      urlKey: "atlas",
      role: "ceo",
      title: "Chief Executive",
      reportsTo: null,
      capabilities: "test",
      status: "idle",
      extraIgnoredField: "x",
    });

    const result = await agentPatchTool.handler(
      { agentId: "A1", name: "Atlas", title: "Chief Executive" },
      { client },
    );

    expect(requestSpy).toHaveBeenCalledWith(
      "PATCH",
      "/api/agents/A1?companyId=C1",
      { name: "Atlas", title: "Chief Executive" },
    );
    expect(result).toEqual({
      id: "A1",
      name: "Atlas",
      urlKey: "atlas",
      role: "ceo",
      title: "Chief Executive",
      reportsTo: null,
      capabilities: "test",
      status: "idle",
    });
  });

  it("rejects when no patch fields are provided", async () => {
    await expect(
      agentPatchTool.inputSchema.parseAsync({ agentId: "A1" }),
    ).rejects.toThrow();
  });

  it("passes overridden companyId when provided", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const spy = spyOn(client, "request").mockResolvedValueOnce({
      id: "A1",
      name: "N",
      urlKey: "n",
      role: "general",
      title: null,
      reportsTo: null,
      capabilities: null,
      status: "idle",
    });
    await agentPatchTool.handler(
      { agentId: "A1", companyId: "C2", name: "N" },
      { client },
    );
    expect(spy).toHaveBeenCalledWith(
      "PATCH",
      "/api/agents/A1?companyId=C2",
      { name: "N" },
    );
  });
});
