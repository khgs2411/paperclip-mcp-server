import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { agentHireTool } from "../../src/tools/agent-hire.js";
import { PaperclipClient } from "../../src/client.js";

describe("agent_hire", () => {
  beforeEach(() => mock.restore());

  it("POSTs to company agent-hires and returns compact shape", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const requestSpy = spyOn(client, "request").mockResolvedValueOnce({
      id: "hire-1",
      name: "Vesta",
      status: "pending",
      extraField: "ignored",
    });

    const result = await agentHireTool.handler(
      { name: "Vesta", role: "ops", instructions: "Handle infra" },
      { client },
    );

    expect(requestSpy).toHaveBeenCalledWith(
      "POST",
      "/api/companies/C1/agent-hires",
      { name: "Vesta", role: "ops", instructions: "Handle infra" },
    );
    expect(result).toEqual({ id: "hire-1", name: "Vesta", status: "pending" });
  });

  it("uses overridden companyId when provided", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const spy = spyOn(client, "request").mockResolvedValueOnce({ id: "h1", name: "X", status: "pending" });
    await agentHireTool.handler({ name: "X", role: "dev", companyId: "C2" }, { client });
    expect(spy).toHaveBeenCalledWith("POST", "/api/companies/C2/agent-hires", { name: "X", role: "dev" });
  });
});
