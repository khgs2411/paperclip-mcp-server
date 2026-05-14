import { z } from "zod";
import { readFileSync, writeFileSync, renameSync } from "node:fs";
import { dirname, basename, join } from "node:path";
import type { ToolDefinition } from "./index.js";

const DEFAULT_PATH = "/Users/liadgoren/Repositories/paperclip/BOARD_CHANNEL.md";

const inputSchema = z.object({
  entry: z.string().min(1),
  refs: z.array(z.string()).optional(),
  filePath: z.string().optional(),
});

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

function nowHHMM(): string {
  const d = new Date();
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

function buildLine(entry: string, refs: string[] | undefined): string {
  const refsSuffix = refs && refs.length > 0 ? ` Refs: ${refs.join(", ")}.` : "";
  return `- ${nowHHMM()} [Yellow] ${entry}${refsSuffix}`;
}

function prependLineForToday(content: string, line: string, today: string): string {
  const dateHeader = `## ${today}`;
  const lines = content.split("\n");
  const idx = lines.findIndex((l) => l === dateHeader);
  if (idx >= 0) {
    lines.splice(idx + 1, 0, line);
    return lines.join("\n");
  }
  // No today section: insert new section above the first existing dated section.
  const firstDateIdx = lines.findIndex((l) => /^## \d{4}-\d{2}-\d{2}$/.test(l));
  const newSection = [dateHeader, line, ""];
  if (firstDateIdx >= 0) {
    lines.splice(firstDateIdx, 0, ...newSection);
  } else {
    const markerIdx = lines.findIndex((l) => l.includes("Atlas writes below this line"));
    if (markerIdx >= 0) {
      lines.splice(markerIdx + 1, 0, "", ...newSection);
    } else {
      lines.push("", ...newSection);
    }
  }
  return lines.join("\n");
}

function atomicWrite(filePath: string, content: string): void {
  const dir = dirname(filePath);
  const tmp = join(dir, `.${basename(filePath)}.tmp-${process.pid}-${Date.now()}`);
  writeFileSync(tmp, content, "utf8");
  renameSync(tmp, filePath);
}

export const boardChannelAppendTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_board_channel_append",
  description:
    "Append a Yellow-tier entry to BOARD_CHANNEL.md. Creates today's dated section if missing, prepends within it if present. Atomic write (temp + rename).",
  inputSchema,
  handler: async (input, _ctx) => {
    const resolvedPath = input.filePath ?? DEFAULT_PATH;
    const content = readFileSync(resolvedPath, "utf8");
    const line = buildLine(input.entry, input.refs);
    const next = prependLineForToday(content, line, todayDateString());
    atomicWrite(resolvedPath, next);
    return { appended: true, line: line.replace(/^- /, ""), path: resolvedPath };
  },
};
