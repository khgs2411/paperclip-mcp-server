import { createHash } from "node:crypto";
import { z } from "zod";
import { ToolInputError } from "../shared/errors.js";
import type { ToolDefinition } from "./index.js";

const inputSchema = z.object({
  agentId: z.string().min(1).describe("Agent id or url key whose managed instructions should be inspected."),
  companyId: z.string().optional().describe("Company id override. Defaults to PAPERCLIP_COMPANY_ID."),
  filePath: z
    .string()
    .min(1)
    .optional()
    .describe("Optional single bundle file path to read back. Omit to return metadata only."),
});

function assertSafeFilePath(filePath: string): void {
  if (
    filePath.startsWith("/") ||
    filePath.includes("\\") ||
    filePath.split("/").some((segment) => segment === "" || segment === "." || segment === "..")
  ) {
    throw new ToolInputError("filePath", "must be a relative bundle path without traversal");
  }
}

function hashContent(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function contentFromEntry(entry: unknown): string | undefined {
  if (typeof entry === "string") return entry;
  const obj = asObject(entry);
  const content = obj["content"] ?? obj["body"] ?? obj["text"];
  return typeof content === "string" ? content : undefined;
}

function pathFromEntry(entry: unknown, fallback?: string): string | undefined {
  const obj = asObject(entry);
  const path = obj["filePath"] ?? obj["path"] ?? obj["name"] ?? fallback;
  return typeof path === "string" ? path : undefined;
}

export interface InstructionFileSummary {
  filePath: string;
  sizeBytes: number | null;
  sha256: string | null;
}

export function summarizeInstructionFiles(raw: Record<string, unknown>): InstructionFileSummary[] {
  const files = raw["files"];
  const summaries: InstructionFileSummary[] = [];

  if (Array.isArray(files)) {
    for (const entry of files) {
      const filePath = pathFromEntry(entry);
      if (!filePath) continue;
      const content = contentFromEntry(entry);
      summaries.push({
        filePath,
        sizeBytes: typeof content === "string" ? Buffer.byteLength(content) : null,
        sha256: typeof content === "string" ? hashContent(content) : null,
      });
    }
  } else if (files && typeof files === "object") {
    for (const [filePath, entry] of Object.entries(files)) {
      const content = contentFromEntry(entry);
      summaries.push({
        filePath,
        sizeBytes: typeof content === "string" ? Buffer.byteLength(content) : null,
        sha256: typeof content === "string" ? hashContent(content) : null,
      });
    }
  }

  for (const [key, value] of Object.entries(raw)) {
    if (!key.endsWith("Content") || typeof value !== "string") continue;
    summaries.push({
      filePath: `${key.slice(0, -"Content".length).toUpperCase()}.md`,
      sizeBytes: Buffer.byteLength(value),
      sha256: hashContent(value),
    });
  }

  return summaries.sort((a, b) => a.filePath.localeCompare(b.filePath));
}

function metadataFromRaw(raw: Record<string, unknown>, agentId: string): Record<string, unknown> {
  const mode = raw["mode"] ?? raw["instructionsMode"] ?? raw["sourceMode"] ?? null;
  const entryFile = raw["entryFile"] ?? raw["entryFilePath"] ?? raw["entrypoint"] ?? null;
  const warnings = Array.isArray(raw["warnings"]) ? raw["warnings"] : [];
  return {
    agentId: raw["agentId"] ?? agentId,
    mode,
    entryFile,
    files: summarizeInstructionFiles(raw),
    warnings,
  };
}

export const agentInstructionsSafeGetTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_agent_instructions_safe_get",
  description:
    "Safely inspect managed instructions. By default returns metadata, file paths, sizes, hashes, and warnings; file content is returned only for an explicit filePath.",
  inputSchema,
  handler: async (input, { client }) => {
    const companyId = client.resolveCompanyId(input.companyId);

    if (input.filePath) {
      assertSafeFilePath(input.filePath);
      const raw = asObject(
        await client.request(
          "GET",
          `/api/agents/${encodeURIComponent(input.agentId)}/instructions-bundle/file?companyId=${encodeURIComponent(companyId)}&path=${encodeURIComponent(input.filePath)}`,
        ),
      );
      const content = contentFromEntry(raw) ?? "";
      return {
        agentId: input.agentId,
        filePath: pathFromEntry(raw, input.filePath) ?? input.filePath,
        sizeBytes: Buffer.byteLength(content),
        sha256: hashContent(content),
        content,
      };
    }

    const raw = asObject(
      await client.request(
        "GET",
        `/api/agents/${encodeURIComponent(input.agentId)}/instructions-bundle?companyId=${encodeURIComponent(companyId)}`,
      ),
    );
    return metadataFromRaw(raw, input.agentId);
  },
};
