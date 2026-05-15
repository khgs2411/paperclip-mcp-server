import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { issueCheckoutTool } from "../../src/tools/issue-checkout.js";
import { issueReleaseTool } from "../../src/tools/issue-release.js";
import { issueActivityTool } from "../../src/tools/issue-activity.js";
import { issueReadMarkTool, issueReadUnmarkTool } from "../../src/tools/issue-read-mark.js";
import { issueInboxArchiveTool, issueInboxUnarchiveTool } from "../../src/tools/issue-inbox-archive.js";
import { PaperclipClient } from "../../src/client.js";

describe("issue workflow tools (checkout/release/activity/read/inbox)", () => {
  beforeEach(() => mock.restore());

  it("checkout: POSTs to .../checkout", async () => {
    const client = new PaperclipClient({ apiBase: "http://x" });
    const spy = spyOn(client, "request").mockResolvedValueOnce({ status: "checked_out" });
    await issueCheckoutTool.handler({ issueId: "TOP-1", agentId: "A1" }, { client });
    expect(spy).toHaveBeenCalledWith("POST", "/api/issues/TOP-1/checkout", { agentId: "A1" });
  });

  it("release: POSTs to .../release", async () => {
    const client = new PaperclipClient({ apiBase: "http://x" });
    const spy = spyOn(client, "request").mockResolvedValueOnce({});
    await issueReleaseTool.handler({ issueId: "TOP-1" }, { client });
    expect(spy).toHaveBeenCalledWith("POST", "/api/issues/TOP-1/release", {});
  });

  it("activity: GETs .../activity", async () => {
    const client = new PaperclipClient({ apiBase: "http://x" });
    const spy = spyOn(client, "request").mockResolvedValueOnce([]);
    await issueActivityTool.handler({ issueId: "TOP-1" }, { client });
    expect(spy).toHaveBeenCalledWith("GET", "/api/issues/TOP-1/activity");
  });

  it("read_mark: POSTs to .../read", async () => {
    const client = new PaperclipClient({ apiBase: "http://x" });
    const spy = spyOn(client, "request").mockResolvedValueOnce({});
    await issueReadMarkTool.handler({ issueId: "TOP-1" }, { client });
    expect(spy).toHaveBeenCalledWith("POST", "/api/issues/TOP-1/read", {});
  });

  it("read_unmark: DELETEs .../read", async () => {
    const client = new PaperclipClient({ apiBase: "http://x" });
    const spy = spyOn(client, "request").mockResolvedValueOnce({});
    await issueReadUnmarkTool.handler({ issueId: "TOP-1" }, { client });
    expect(spy).toHaveBeenCalledWith("DELETE", "/api/issues/TOP-1/read");
  });

  it("inbox_archive: POSTs to .../inbox-archive", async () => {
    const client = new PaperclipClient({ apiBase: "http://x" });
    const spy = spyOn(client, "request").mockResolvedValueOnce({});
    await issueInboxArchiveTool.handler({ issueId: "TOP-1" }, { client });
    expect(spy).toHaveBeenCalledWith("POST", "/api/issues/TOP-1/inbox-archive", {});
  });

  it("inbox_unarchive: DELETEs .../inbox-archive", async () => {
    const client = new PaperclipClient({ apiBase: "http://x" });
    const spy = spyOn(client, "request").mockResolvedValueOnce({});
    await issueInboxUnarchiveTool.handler({ issueId: "TOP-1" }, { client });
    expect(spy).toHaveBeenCalledWith("DELETE", "/api/issues/TOP-1/inbox-archive");
  });

  it("checkout: rejects missing agentId", async () => {
    await expect(
      issueCheckoutTool.inputSchema.parseAsync({ issueId: "TOP-1" }),
    ).rejects.toThrow();
  });
});
