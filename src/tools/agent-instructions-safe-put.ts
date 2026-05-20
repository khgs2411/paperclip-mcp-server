import { createHash } from "node:crypto";
import { z } from "zod";
import { PaperclipApiError, ToolInputError } from "../shared/errors.js";
import type { ToolDefinition } from "./index.js";

const inputSchema = z.object({
  agentId: z.string().min(1).describe("Agent id or url key whose managed instruction file should be updated."),
  companyId: z.string().optional().describe("Company id override. Defaults to PAPERCLIP_COMPANY_ID."),
  filePath: z.string().min(1).describe("Relative managed-instruction bundle file path to write."),
  content: z.string().describe("Full replacement content for the managed-instruction file."),
  changeSummary: z.string().min(1).describe("Human-readable summary of why this instruction change is needed."),
  provenanceIssueId: z.string().min(1).describe("Issue id or identifier authorizing this instruction change."),
  runId: z
    .string()
    .min(1)
    .optional()
    .describe("Paperclip run id for audit headers. Defaults to PAPERCLIP_RUN_ID."),
});

const LIVE_CONFIG_PATH_PATTERN =
  /(^|\/)(agent|adapter|runtime|model|models|reasoning|role|roles|permissions|grants|config|settings)\.(json|jsonc|yaml|yml|toml)$/i;

function assertSafeWriteInput(input: z.infer<typeof inputSchema>): string {
  if (
    input.filePath.startsWith("/") ||
    input.filePath.includes("\\") ||
    input.filePath.split("/").some((segment) => segment === "" || segment === "." || segment === "..")
  ) {
    throw new ToolInputError("filePath", "must be a relative bundle path without traversal");
  }
  if (LIVE_CONFIG_PATH_PATTERN.test(input.filePath)) {
    throw new ToolInputError(
      "filePath",
      "managed-instruction writes cannot change live role/model/reasoning configuration",
    );
  }
  if (input.changeSummary.trim().length === 0) {
    throw new ToolInputError("changeSummary", "must be non-empty after trimming");
  }
  if (input.provenanceIssueId.trim().length === 0) {
    throw new ToolInputError("provenanceIssueId", "must identify the authorizing issue");
  }
  const runId = input.runId ?? process.env["PAPERCLIP_RUN_ID"];
  if (!runId || runId.trim().length === 0) {
    throw new ToolInputError("runId", "required when PAPERCLIP_RUN_ID env is not set");
  }
  return runId;
}

function hashContent(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function isOpaqueSafePutRunIdFailure(err: unknown): boolean {
  const body = err instanceof PaperclipApiError ? asObject(err.body) : {};
  return err instanceof PaperclipApiError && err.statusCode === 500 && body["error"] === "Internal server error";
}

export const agentInstructionsSafePutTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_agent_instructions_safe_put",
  description:
    "Guarded managed-instruction file write. Requires provenance, change summary, and run audit metadata, and rejects traversal or live configuration paths.",
  inputSchema,
  handler: async (input, { client }) => {
    const runId = assertSafeWriteInput(input);
    const companyId = client.resolveCompanyId(input.companyId);
    let response: Record<string, unknown>;
    try {
      response = asObject(
        await client.request(
          "PUT",
          `/api/agents/${encodeURIComponent(input.agentId)}/instructions-bundle/file?companyId=${encodeURIComponent(companyId)}`,
          {
            path: input.filePath,
            content: input.content,
            changeSummary: input.changeSummary.trim(),
            provenanceIssueId: input.provenanceIssueId.trim(),
            runId,
          },
          { "X-Paperclip-Run-Id": runId },
        ),
      );
    } catch (err) {
      if (isOpaqueSafePutRunIdFailure(err)) {
        throw new ToolInputError(
          "runId",
          "Paperclip safe_put returned an opaque 500; runId must reference an existing Paperclip run. For interactive edits, use PAPERCLIP_RUN_ID from a managed heartbeat or file_put until the Paperclip API supports a synthetic run id.",
        );
      }
      throw err;
    }

    return {
      agentId: input.agentId,
      filePath: response["filePath"] ?? response["path"] ?? input.filePath,
      sizeBytes: Buffer.byteLength(input.content),
      sha256: hashContent(input.content),
      changeSummary: input.changeSummary.trim(),
      provenanceIssueId: input.provenanceIssueId.trim(),
      runId,
      apiResponse: response,
    };
  },
};
