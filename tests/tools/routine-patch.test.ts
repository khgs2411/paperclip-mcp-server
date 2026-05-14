import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { routinePatchTool } from "../../src/tools/routine-patch.js";
import { PaperclipClient } from "../../src/client.js";

describe("routine_patch", () => {
  beforeEach(() => mock.restore());

  it("PATCHes /api/routines/:id with only the provided fields", async () => {
    const client = new PaperclipClient({ apiBase: "http://x" });
    const spy = spyOn(client, "request").mockResolvedValueOnce({
      id: "R1",
      title: "New",
      description: "desc",
      assigneeAgentId: "A1",
      status: "active",
      latestRevisionNumber: 5,
      extra: "ignored",
    });
    const result = await routinePatchTool.handler(
      { routineId: "R1", title: "New", description: "desc" },
      { client },
    );
    expect(spy).toHaveBeenCalledWith("PATCH", "/api/routines/R1", {
      title: "New",
      description: "desc",
    });
    expect(result).toEqual({
      id: "R1",
      title: "New",
      description: "desc",
      assigneeAgentId: "A1",
      status: "active",
      latestRevisionNumber: 5,
    });
  });

  it("rejects when no patchable fields are provided", async () => {
    await expect(
      routinePatchTool.inputSchema.parseAsync({ routineId: "R1" }),
    ).rejects.toThrow();
  });
});
