import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { boardChannelAppendTool } from "../../src/tools/board-channel-append.js";
import { PaperclipClient } from "../../src/client.js";

const SEED = `# Board Channel\n\n---\n\n## Log\n\n<!-- Atlas writes below this line. Newest day on top. -->\n\n## 2026-05-10\n- 09:00 [Yellow] earlier action — older entry.\n`;

let tmp: string;
let filePath: string;

beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), "bc-test-"));
  filePath = join(tmp, "BOARD_CHANNEL.md");
  writeFileSync(filePath, SEED);
});

afterEach(() => {
  rmSync(tmp, { recursive: true, force: true });
});

describe("board_channel_append", () => {
  it("prepends a new line to today's section, creating the section if missing", async () => {
    const client = new PaperclipClient({ apiBase: "http://x" });
    const result = await boardChannelAppendTool.handler(
      { entry: "Test action — reason.", refs: ["TOP-99"], filePath },
      { client },
    );
    expect((result as { appended: boolean }).appended).toBe(true);
    const content = readFileSync(filePath, "utf8");
    const todayMatch = content.match(/^## (\d{4}-\d{2}-\d{2})/m);
    expect(todayMatch?.[1]).toBe(new Date().toISOString().slice(0, 10));
    expect(content).toContain("[Yellow] Test action — reason.");
    expect(content).toContain("TOP-99");
    expect(content).toContain("## 2026-05-10");
    expect(content).toContain("older entry");
  });

  it("prepends within the existing today section if it already exists", async () => {
    const today = new Date().toISOString().slice(0, 10);
    const seedWithToday = `# Board Channel\n\n---\n\n## Log\n\n<!-- Atlas writes below this line. Newest day on top. -->\n\n## ${today}\n- 10:00 [Yellow] earlier today.\n\n## 2026-05-10\n- 09:00 [Yellow] very old.\n`;
    writeFileSync(filePath, seedWithToday);
    const client = new PaperclipClient({ apiBase: "http://x" });
    await boardChannelAppendTool.handler(
      { entry: "Newer same-day.", filePath },
      { client },
    );
    const content = readFileSync(filePath, "utf8");
    const lines = content.split("\n");
    const todayHeaderIdx = lines.findIndex((l) => l === `## ${today}`);
    expect(lines[todayHeaderIdx + 1]).toMatch(/^- \d{2}:\d{2} \[Yellow\] Newer same-day\./);
    expect(content).toContain("earlier today");
  });
});
