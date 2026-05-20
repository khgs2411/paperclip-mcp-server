import { createHash } from "node:crypto";
import { z } from "zod";
import { ToolInputError } from "../shared/errors.js";
import type { ToolDefinition } from "./index.js";

const sectionFiles = [
  { field: "agentsContent", filePath: "AGENTS.md" },
  { field: "heartbeatContent", filePath: "HEARTBEAT.md" },
  { field: "soulContent", filePath: "SOUL.md" },
  { field: "toolsContent", filePath: "TOOLS.md" },
] as const;

const inputSchema = z
  .object({
    agentId: z.string().min(1),
    companyId: z.string().optional(),
    agentsContent: z.string().optional(),
    heartbeatContent: z.string().optional(),
    soulContent: z.string().optional(),
    toolsContent: z.string().optional(),
  })
  .refine(
    (v) =>
      v.agentsContent !== undefined ||
      v.heartbeatContent !== undefined ||
      v.soulContent !== undefined ||
      v.toolsContent !== undefined,
    { message: "at least one content field must be provided", path: ["_patch"] },
  );

type SectionFile = (typeof sectionFiles)[number];

function hashContent(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

function readbackContent(raw: unknown): string | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const content = (raw as Record<string, unknown>)["content"];
  return typeof content === "string" ? content : undefined;
}

function persistenceError(section: SectionFile): ToolInputError {
  return new ToolInputError(
    section.field,
    `instructions patch did not persist ${section.filePath}; readback content did not match supplied ${section.field}`,
  );
}

export const agentInstructionsPatchTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_agent_instructions_patch",
  description:
    "Patch one or more sections of an agent's instructions bundle. At least one content field must be provided.",
  inputSchema,
  handler: async (input, { client }) => {
    const companyId = client.resolveCompanyId(input.companyId);
    const agentId = encodeURIComponent(input.agentId);
    const companyQuery = encodeURIComponent(companyId);
    const updatedFiles: Array<{
      field: SectionFile["field"];
      filePath: string;
      sizeBytes: number;
      sha256: string;
    }> = [];
    const verifiedContent: Partial<Record<SectionFile["field"], string>> = {};

    for (const section of sectionFiles) {
      const content = input[section.field];
      if (content === undefined) continue;

      await client.request(
        "PUT",
        `/api/agents/${agentId}/instructions-bundle/file?companyId=${companyQuery}`,
        { path: section.filePath, content },
      );

      const readback = await client.request(
        "GET",
        `/api/agents/${agentId}/instructions-bundle/file?companyId=${companyQuery}&path=${encodeURIComponent(section.filePath)}`,
      );
      const persistedContent = readbackContent(readback);
      if (persistedContent !== content) {
        throw persistenceError(section);
      }

      updatedFiles.push({
        field: section.field,
        filePath: section.filePath,
        sizeBytes: Buffer.byteLength(persistedContent),
        sha256: hashContent(persistedContent),
      });
      verifiedContent[section.field] = persistedContent;
    }

    return {
      agentId: input.agentId,
      updatedFiles,
      ...verifiedContent,
    };
  },
};
