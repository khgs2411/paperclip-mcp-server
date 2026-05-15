import { describe, it, expect, beforeAll } from "bun:test";
import { PaperclipClient } from "../../src/client.js";
import { meWhoamiTool } from "../../src/tools/me-whoami.js";
import { inboxLiteTool } from "../../src/tools/inbox-lite.js";
import { approvalListTool } from "../../src/tools/approval-list.js";
import { approvalCreateTool } from "../../src/tools/approval-create.js";

const apiBase = process.env["PAPERCLIP_API_BASE"] ?? "http://127.0.0.1:3100";
const companyId = process.env["PAPERCLIP_COMPANY_ID"];
const agentApiKey = process.env["PAPERCLIP_AGENT_API_KEY"];
const runIntegration = process.env["RUN_INTEGRATION"] === "1";

describe.skipIf(!runIntegration || !companyId || !agentApiKey)(
  "integration: Group E — Inbox (requires RUN_INTEGRATION=1 and PAPERCLIP_AGENT_API_KEY)",
  () => {
    let client: PaperclipClient;

    beforeAll(async () => {
      client = new PaperclipClient({ apiBase, defaultCompanyId: companyId, agentApiKey });
      const healthy = await client.healthCheck();
      if (!healthy) throw new Error("Paperclip not reachable at " + apiBase);
    });

    it("me_whoami: returns agent identity with id field", async () => {
      const result = await meWhoamiTool.handler({}, { client });
      expect(typeof (result as { id: string }).id).toBe("string");
    });

    it("inbox_lite: returns a response (array or object)", async () => {
      const result = await inboxLiteTool.handler({}, { client });
      expect(result).not.toBeNull();
    });
  },
);

describe.skipIf(!runIntegration || !companyId)(
  "integration: Group F — Approvals (requires RUN_INTEGRATION=1)",
  () => {
    let client: PaperclipClient;
    let createdApprovalId: string;

    beforeAll(async () => {
      client = new PaperclipClient({
        apiBase,
        defaultCompanyId: companyId,
        agentApiKey,
      });
      const healthy = await client.healthCheck();
      if (!healthy) throw new Error("Paperclip not reachable at " + apiBase);

      // Get agent ID for the approval create test
      const agents = (await client.request(
        "GET",
        `/api/companies/${companyId}/agents`,
      )) as Array<{ id: string }>;
      if (agents.length === 0) throw new Error("No agents available");

      const created = (await approvalCreateTool.handler(
        {
          companyId,
          type: "request_board_approval",
          requestedByAgentId: agents[0]!.id,
          payload: {
            title: "Integration test approval",
            summary: "Created by integration test suite",
          },
        },
        { client },
      )) as { id: string };
      createdApprovalId = created.id;
    });

    it("approval_list: returns an array", async () => {
      const result = await approvalListTool.handler({}, { client });
      expect(Array.isArray(result)).toBe(true);
    });

    it("approval_create: created approval has an id", () => {
      expect(typeof createdApprovalId).toBe("string");
      expect(createdApprovalId.length).toBeGreaterThan(0);
    });
  },
);
