import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { activityCompanyTool } from "../../src/tools/activity-company.js";
import { PaperclipClient } from "../../src/client.js";

describe("activity_company", () => {
  beforeEach(() => mock.restore());

  it("GETs /api/companies/:cid/activity with provided limit", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const payload = [{ id: "A1", type: "issue_created", createdAt: "2026-05-16T10:00:00.000Z" }];
    const spy = spyOn(client, "request").mockResolvedValueOnce(payload);
    const result = await activityCompanyTool.handler({ limit: 50 }, { client });
    expect(spy).toHaveBeenCalledWith("GET", "/api/companies/C1/activity?limit=50");
    expect(result).toEqual({
      events: payload,
      meta: {
        requestedLimit: 50,
        returnedCount: 1,
        capped: false,
        mayHaveMore: false,
        requestedWindow: {
          since: null,
          before: null,
          offset: 0,
        },
        observedWindow: {
          oldestTimestamp: "2026-05-16T10:00:00.000Z",
          newestTimestamp: "2026-05-16T10:00:00.000Z",
        },
        completeness: "complete_within_returned_query",
      },
    });
  });

  it("defaults limit to 20 when not provided", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const spy = spyOn(client, "request").mockResolvedValueOnce([]);
    await activityCompanyTool.handler({}, { client });
    expect(spy).toHaveBeenCalledWith("GET", "/api/companies/C1/activity?limit=20");
  });

  it("passes bounded window and pagination parameters through to the API", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    const spy = spyOn(client, "request").mockResolvedValueOnce([]);
    await activityCompanyTool.handler(
      {
        limit: 500,
        since: "2026-05-15T00:00:00.000Z",
        before: "2026-05-16T00:00:00.000Z",
        offset: 500,
        agentId: "A1",
        entityType: "issue",
        entityId: "I1",
      },
      { client },
    );
    expect(spy).toHaveBeenCalledWith(
      "GET",
      "/api/companies/C1/activity?limit=500&since=2026-05-15T00%3A00%3A00.000Z&before=2026-05-16T00%3A00%3A00.000Z&offset=500&agentId=A1&entityType=issue&entityId=I1",
    );
  });

  it("marks full-limit responses as capped samples", async () => {
    const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
    spyOn(client, "request").mockResolvedValueOnce([
      { id: "A1", createdAt: "2026-05-16T11:00:00.000Z" },
      { id: "A2", createdAt: "2026-05-16T10:00:00.000Z" },
    ]);
    const result = await activityCompanyTool.handler({ limit: 2 }, { client });
    expect(result).toEqual({
      events: [
        { id: "A1", createdAt: "2026-05-16T11:00:00.000Z" },
        { id: "A2", createdAt: "2026-05-16T10:00:00.000Z" },
      ],
      meta: {
        requestedLimit: 2,
        returnedCount: 2,
        capped: true,
        mayHaveMore: true,
        requestedWindow: {
          since: null,
          before: null,
          offset: 0,
        },
        observedWindow: {
          oldestTimestamp: "2026-05-16T10:00:00.000Z",
          newestTimestamp: "2026-05-16T11:00:00.000Z",
        },
        completeness: "capped_sample",
      },
    });
  });
});
