import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { routineListTool } from "../../src/tools/routine-list.js";
import { PaperclipClient } from "../../src/client.js";

describe("routine_list", () => {
  beforeEach(() => mock.restore());

  it("GETs /api/companies/:cid/routines and maps schedule metadata", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const spy = spyOn(client, "request").mockResolvedValueOnce([
      {
        id: "R1",
        name: "Daily sync",
        agentId: "A1",
        assigneeAgentId: "A1",
        status: "active",
        lastTriggeredAt: "2026-05-16T10:00:00.000Z",
        lastEnqueuedAt: null,
        nextRunAt: "2026-05-17T10:00:00.000Z",
        lastFiredAt: "2026-05-16T10:00:00.000Z",
        lastResult: "success",
        triggers: [
          {
            cronExpression: "0 10 * * *",
            timezone: "UTC",
            nextRunAt: "2026-05-17T10:00:00.000Z",
          },
        ],
      },
    ]);
    const result = await routineListTool.handler({}, { client });
    expect(spy).toHaveBeenCalledWith("GET", "/api/companies/C1/routines");
    expect(result).toEqual([
      {
        id: "R1",
        name: "Daily sync",
        agentId: "A1",
        assigneeAgentId: "A1",
        status: "active",
        lastTriggeredAt: "2026-05-16T10:00:00.000Z",
        lastEnqueuedAt: null,
        nextRunAt: "2026-05-17T10:00:00.000Z",
        lastFiredAt: "2026-05-16T10:00:00.000Z",
        lastResult: "success",
        triggers: [
          {
            cronExpression: "0 10 * * *",
            timezone: "UTC",
            nextRunAt: "2026-05-17T10:00:00.000Z",
          },
        ],
      },
    ]);
  });

  it("handles wrapped { routines: [] } response shape", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    spyOn(client, "request").mockResolvedValueOnce({
      routines: [
        {
          id: "R2",
          name: "Weekly",
          agentId: "A2",
          status: "paused",
          triggers: [{ cronExpression: "0 0 * * 0", nextRunAt: "2026-05-18T00:00:00.000Z", lastFiredAt: "2026-05-17T00:00:00.000Z", lastResult: "skipped" }],
        },
      ],
    });
    const result = await routineListTool.handler({}, { client });
    expect(result).toEqual([
      {
        id: "R2",
        name: "Weekly",
        agentId: "A2",
        assigneeAgentId: undefined,
        status: "paused",
        lastTriggeredAt: undefined,
        lastEnqueuedAt: undefined,
        nextRunAt: "2026-05-18T00:00:00.000Z",
        lastFiredAt: "2026-05-17T00:00:00.000Z",
        lastResult: "skipped",
        triggers: [
          {
            cronExpression: "0 0 * * 0",
            nextRunAt: "2026-05-18T00:00:00.000Z",
            lastFiredAt: "2026-05-17T00:00:00.000Z",
            lastResult: "skipped",
          },
        ],
      },
    ]);
  });
});
