# Managed Instruction Patch Persistence Implementation Plan

**Status:** Ready for Vesta implementation-plan audit.

**Approved Design:** `docs/superpowers/specs/2026-05-20-managed-instruction-patch-persistence-design.md`, approved through [TOP-638](/TOP/issues/TOP-638) with verdict `Ready for Development` per [TOP-639](/TOP/issues/TOP-639).

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `paperclip_agent_instructions_patch` persist supplied managed-instruction section content through verified file writes, or fail loudly before reporting success.

**Architecture:** Keep the fix local to the MCP wrapper tool that owns the misleading success behavior. Replace the current raw bundle PATCH forwarding path with deterministic section-to-file writes through the already-working file endpoint, immediately read each file back, compare content, and return metadata computed from verified readback. Preserve the public MCP input fields and keep `paperclip_agent_instructions_file_put` unchanged.

**Tech Stack:** TypeScript ESM, Bun test runner, Zod, existing `PaperclipClient`, local Paperclip REST API endpoints under `/api/agents/:id/instructions-bundle/file`.

---

## Source Evidence

- [src/tools/agent-instructions-patch.ts](/Users/liadgoren/Repositories/paperclip/mcp/src/tools/agent-instructions-patch.ts): currently accepts `agentsContent`, `heartbeatContent`, `soulContent`, and `toolsContent`, forwards them to `PATCH /instructions-bundle`, and returns the raw response without persistence verification.
- [tests/tools/agent-instructions-patch.test.ts](/Users/liadgoren/Repositories/paperclip/mcp/tests/tools/agent-instructions-patch.test.ts): currently covers raw PATCH passthrough and the no-content validation only.
- [src/tools/agent-instructions-file-put.ts](/Users/liadgoren/Repositories/paperclip/mcp/src/tools/agent-instructions-file-put.ts): writes `{ path, content }` to `/instructions-bundle/file` and must remain behaviorally unchanged.
- [src/tools/agent-instructions-safe-get.ts](/Users/liadgoren/Repositories/paperclip/mcp/src/tools/agent-instructions-safe-get.ts): shows the expected readback shapes and local hashing style for managed-instruction files.
- Paperclip server route evidence from `@paperclipai/server/dist/routes/agents.js`: `PATCH /agents/:id/instructions-bundle` calls `instructions.updateBundle`, while `PUT /agents/:id/instructions-bundle/file` calls `instructions.writeFile` and returns the written file.
- Paperclip server schema evidence from `@paperclipai/shared`: `updateAgentInstructionsBundleSchema` contains `mode`, `rootPath`, `entryFile`, and `clearLegacyPromptTemplate`; it does not contain the MCP wrapper content fields. `upsertAgentInstructionsFileSchema` contains `path`, `content`, and `clearLegacyPromptTemplate`.
- Code-style wiki guidance: keep the plan surgical, avoid wrapper-only abstractions, test the boundary workflow, and make error handling visible at the owning boundary.

## Assumptions

- Assumption: section-to-file mapping -- `agentsContent`, `heartbeatContent`, `soulContent`, and `toolsContent` map to `AGENTS.md`, `HEARTBEAT.md`, `SOUL.md`, and `TOOLS.md`; chosen because the approved design, safe-get behavior, and issue reproduction all use these exact names. Revisit if the server exposes custom section path metadata.
- Assumption: local wrapper fix first -- the MCP wrapper should route section content to the file endpoint instead of changing the Paperclip server in this issue; chosen because the approved design is scoped to `paperclip_agent_instructions_patch` and the file endpoint already persists content. Revisit if Vesta requires server-side section-content PATCH support.
- Assumption: mismatch error can use `ToolInputError` -- this keeps handler output as structured JSON instead of falling into `internal_error`; chosen because the current MCP error taxonomy has only API, unreachable, and input/tool constraint errors. Revisit if a dedicated persistence error type is added before implementation.
- Assumption: no live Atlas reproduction -- verification must use mocked `PaperclipClient.request` unit tests and must not mutate Atlas or role-bearing managed instructions. Revisit only if a safe fixture agent is explicitly provided.

## File Structure

- Modify `src/tools/agent-instructions-patch.ts`: add local section mapping, hash/readback helpers, file PUT plus file GET verification, and verified response metadata.
- Modify `tests/tools/agent-instructions-patch.test.ts`: replace raw PATCH passthrough coverage with persistence workflow tests, mismatch failure tests, single-section compatibility, and existing no-content validation.
- Do not modify `src/tools/agent-instructions-file-put.ts`.
- Do not modify `tests/tools/agent-instructions-file-put.test.ts` except to run it as regression coverage.
- No README change is required for this narrow fix; the existing README still describes this as a lower-level/admin patch tool.

Do not mutate live agent instructions during implementation. Do not stage broad changes with `git add .`.

---

### Task 1: Replace Raw PATCH Test With Verified File Workflow Tests

**Files:**
- Modify: `tests/tools/agent-instructions-patch.test.ts`
- Regression test only: `tests/tools/agent-instructions-file-put.test.ts`

- [ ] **Step 1: Replace the raw PATCH passthrough test with helper imports**

Update the top of `tests/tools/agent-instructions-patch.test.ts`:

```ts
import { createHash } from "node:crypto";
import { describe, it, expect, spyOn, beforeEach, mock } from "bun:test";
import { agentInstructionsPatchTool } from "../../src/tools/agent-instructions-patch.js";
import { PaperclipClient } from "../../src/client.js";

function sha256(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}
```

- [ ] **Step 2: Write the multi-section persistence workflow test**

Replace the current raw PATCH test with this test:

```ts
it("writes supplied sections through file endpoint, reads back, and returns verified metadata", async () => {
  const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
  const requestSpy = spyOn(client, "request")
    .mockResolvedValueOnce({ path: "AGENTS.md", size: 9 })
    .mockResolvedValueOnce({ path: "AGENTS.md", content: "# Agents\n" })
    .mockResolvedValueOnce({ path: "HEARTBEAT.md", size: 12 })
    .mockResolvedValueOnce({ path: "HEARTBEAT.md", content: "# Heartbeat\n" })
    .mockResolvedValueOnce({ path: "SOUL.md", size: 7 })
    .mockResolvedValueOnce({ path: "SOUL.md", content: "# Soul\n" })
    .mockResolvedValueOnce({ path: "TOOLS.md", size: 8 })
    .mockResolvedValueOnce({ path: "TOOLS.md", content: "# Tools\n" });

  const result = await agentInstructionsPatchTool.handler(
    {
      agentId: "A1",
      agentsContent: "# Agents\n",
      heartbeatContent: "# Heartbeat\n",
      soulContent: "# Soul\n",
      toolsContent: "# Tools\n",
    },
    { client },
  );

  expect(requestSpy).toHaveBeenNthCalledWith(
    1,
    "PUT",
    "/api/agents/A1/instructions-bundle/file?companyId=C1",
    { path: "AGENTS.md", content: "# Agents\n" },
  );
  expect(requestSpy).toHaveBeenNthCalledWith(
    2,
    "GET",
    "/api/agents/A1/instructions-bundle/file?companyId=C1&path=AGENTS.md",
  );
  expect(requestSpy).toHaveBeenNthCalledWith(
    3,
    "PUT",
    "/api/agents/A1/instructions-bundle/file?companyId=C1",
    { path: "HEARTBEAT.md", content: "# Heartbeat\n" },
  );
  expect(requestSpy).toHaveBeenNthCalledWith(
    4,
    "GET",
    "/api/agents/A1/instructions-bundle/file?companyId=C1&path=HEARTBEAT.md",
  );
  expect(requestSpy).toHaveBeenNthCalledWith(
    5,
    "PUT",
    "/api/agents/A1/instructions-bundle/file?companyId=C1",
    { path: "SOUL.md", content: "# Soul\n" },
  );
  expect(requestSpy).toHaveBeenNthCalledWith(
    6,
    "GET",
    "/api/agents/A1/instructions-bundle/file?companyId=C1&path=SOUL.md",
  );
  expect(requestSpy).toHaveBeenNthCalledWith(
    7,
    "PUT",
    "/api/agents/A1/instructions-bundle/file?companyId=C1",
    { path: "TOOLS.md", content: "# Tools\n" },
  );
  expect(requestSpy).toHaveBeenNthCalledWith(
    8,
    "GET",
    "/api/agents/A1/instructions-bundle/file?companyId=C1&path=TOOLS.md",
  );

  expect(result).toEqual({
    agentId: "A1",
    updatedFiles: [
      {
        field: "agentsContent",
        filePath: "AGENTS.md",
        sizeBytes: Buffer.byteLength("# Agents\n"),
        sha256: sha256("# Agents\n"),
      },
      {
        field: "heartbeatContent",
        filePath: "HEARTBEAT.md",
        sizeBytes: Buffer.byteLength("# Heartbeat\n"),
        sha256: sha256("# Heartbeat\n"),
      },
      {
        field: "soulContent",
        filePath: "SOUL.md",
        sizeBytes: Buffer.byteLength("# Soul\n"),
        sha256: sha256("# Soul\n"),
      },
      {
        field: "toolsContent",
        filePath: "TOOLS.md",
        sizeBytes: Buffer.byteLength("# Tools\n"),
        sha256: sha256("# Tools\n"),
      },
    ],
    agentsContent: "# Agents\n",
    heartbeatContent: "# Heartbeat\n",
    soulContent: "# Soul\n",
    toolsContent: "# Tools\n",
  });
});
```

- [ ] **Step 3: Write the readback mismatch failure test**

Add this test after the multi-section test:

```ts
it("rejects when readback content does not match the supplied section", async () => {
  const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
  const requestSpy = spyOn(client, "request")
    .mockResolvedValueOnce({ path: "HEARTBEAT.md", size: 3 })
    .mockResolvedValueOnce({ path: "HEARTBEAT.md", content: "old" });

  await expect(
    agentInstructionsPatchTool.handler(
      { agentId: "A1", heartbeatContent: "new" },
      { client },
    ),
  ).rejects.toThrow(
    "instructions patch did not persist HEARTBEAT.md; readback content did not match supplied heartbeatContent",
  );

  expect(requestSpy).toHaveBeenCalledTimes(2);
});
```

- [ ] **Step 4: Write the missing-content readback failure test**

Add this test:

```ts
it("rejects when readback does not include string content", async () => {
  const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
  spyOn(client, "request")
    .mockResolvedValueOnce({ path: "TOOLS.md", size: 9 })
    .mockResolvedValueOnce({ path: "TOOLS.md" });

  await expect(
    agentInstructionsPatchTool.handler(
      { agentId: "A1", toolsContent: "# Tools\n" },
      { client },
    ),
  ).rejects.toThrow(
    "instructions patch did not persist TOOLS.md; readback content did not match supplied toolsContent",
  );
});
```

- [ ] **Step 5: Write the single-section compatibility test**

Add this test:

```ts
it("supports a single supplied section and companyId override", async () => {
  const client = new PaperclipClient({ apiBase: "http://x", defaultCompanyId: "C1" });
  const requestSpy = spyOn(client, "request")
    .mockResolvedValueOnce({ path: "SOUL.md", size: 7 })
    .mockResolvedValueOnce({ path: "SOUL.md", content: "# Soul\n" });

  const result = await agentInstructionsPatchTool.handler(
    { agentId: "A1", companyId: "C2", soulContent: "# Soul\n" },
    { client },
  );

  expect(requestSpy).toHaveBeenNthCalledWith(
    1,
    "PUT",
    "/api/agents/A1/instructions-bundle/file?companyId=C2",
    { path: "SOUL.md", content: "# Soul\n" },
  );
  expect(requestSpy).toHaveBeenNthCalledWith(
    2,
    "GET",
    "/api/agents/A1/instructions-bundle/file?companyId=C2&path=SOUL.md",
  );
  expect(result).toEqual({
    agentId: "A1",
    updatedFiles: [
      {
        field: "soulContent",
        filePath: "SOUL.md",
        sizeBytes: Buffer.byteLength("# Soul\n"),
        sha256: sha256("# Soul\n"),
      },
    ],
    soulContent: "# Soul\n",
  });
});
```

- [ ] **Step 6: Preserve the no-content validation test**

Keep this existing test at the end of the file:

```ts
it("rejects when no content fields are provided", async () => {
  await expect(
    agentInstructionsPatchTool.inputSchema.parseAsync({ agentId: "A1" }),
  ).rejects.toThrow();
});
```

- [ ] **Step 7: Run the new patch tests and verify they fail**

Run:

```bash
rtk bun test tests/tools/agent-instructions-patch.test.ts
```

Expected: fail because the tool still calls `PATCH /instructions-bundle`, does not call file PUT/GET, does not return `updatedFiles`, and does not throw on readback mismatch.

---

### Task 2: Implement Verified Section-To-File Persistence

**Files:**
- Modify: `src/tools/agent-instructions-patch.ts`

- [ ] **Step 1: Add local helpers and imports**

Replace the top of `src/tools/agent-instructions-patch.ts` with:

```ts
import { createHash } from "node:crypto";
import { z } from "zod";
import { ToolInputError } from "../shared/errors.js";
import type { ToolDefinition } from "./index.js";
```

After the input schema, add:

```ts
type PatchField =
  | "agentsContent"
  | "heartbeatContent"
  | "soulContent"
  | "toolsContent";

const SECTION_FILES: Array<{ field: PatchField; filePath: string }> = [
  { field: "agentsContent", filePath: "AGENTS.md" },
  { field: "heartbeatContent", filePath: "HEARTBEAT.md" },
  { field: "soulContent", filePath: "SOUL.md" },
  { field: "toolsContent", filePath: "TOOLS.md" },
];

function hashContent(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function contentFromReadback(raw: Record<string, unknown>): string | undefined {
  const content = raw["content"] ?? raw["body"] ?? raw["text"];
  return typeof content === "string" ? content : undefined;
}

function fileEndpoint(agentId: string, companyId: string): string {
  return `/api/agents/${encodeURIComponent(agentId)}/instructions-bundle/file?companyId=${encodeURIComponent(companyId)}`;
}
```

- [ ] **Step 2: Replace the handler body**

Replace the current `handler` implementation with:

```ts
handler: async (input, { client }) => {
  const companyId = client.resolveCompanyId(input.companyId);
  const updates = SECTION_FILES.flatMap(({ field, filePath }) => {
    const content = input[field];
    return content === undefined ? [] : [{ field, filePath, content }];
  });
  const endpoint = fileEndpoint(input.agentId, companyId);
  const verified: Array<{
    field: PatchField;
    filePath: string;
    content: string;
    sizeBytes: number;
    sha256: string;
  }> = [];

  for (const update of updates) {
    await client.request("PUT", endpoint, {
      path: update.filePath,
      content: update.content,
    });

    const readback = asObject(
      await client.request(
        "GET",
        `${endpoint}&path=${encodeURIComponent(update.filePath)}`,
      ),
    );
    const readbackContent = contentFromReadback(readback);
    if (readbackContent !== update.content) {
      throw new ToolInputError(
        update.field,
        `instructions patch did not persist ${update.filePath}; readback content did not match supplied ${update.field}`,
      );
    }

    verified.push({
      field: update.field,
      filePath: update.filePath,
      content: readbackContent,
      sizeBytes: Buffer.byteLength(readbackContent),
      sha256: hashContent(readbackContent),
    });
  }

  return {
    agentId: input.agentId,
    updatedFiles: verified.map(({ field, filePath, sizeBytes, sha256 }) => ({
      field,
      filePath,
      sizeBytes,
      sha256,
    })),
    ...Object.fromEntries(verified.map(({ field, content }) => [field, content])),
  };
},
```

- [ ] **Step 3: Confirm the implementation stayed local**

Run:

```bash
rtk git diff -- src/tools/agent-instructions-patch.ts tests/tools/agent-instructions-patch.test.ts src/tools/agent-instructions-file-put.ts tests/tools/agent-instructions-file-put.test.ts
```

Expected: only `src/tools/agent-instructions-patch.ts` and `tests/tools/agent-instructions-patch.test.ts` changed. No diff should appear for `src/tools/agent-instructions-file-put.ts` or `tests/tools/agent-instructions-file-put.test.ts`.

- [ ] **Step 4: Run the patch tests**

Run:

```bash
rtk bun test tests/tools/agent-instructions-patch.test.ts
```

Expected: all tests in `agent-instructions-patch.test.ts` pass.

---

### Task 3: Preserve File PUT Behavior And Type Safety

**Files:**
- Regression test only: `tests/tools/agent-instructions-file-put.test.ts`
- Verification only: `src/tools/agent-instructions-file-put.ts`

- [ ] **Step 1: Run patch and file-put regression tests together**

Run:

```bash
rtk bun test tests/tools/agent-instructions-patch.test.ts tests/tools/agent-instructions-file-put.test.ts
```

Expected: both test files pass. `agent_instructions_file_put` should still assert that the public `filePath` MCP argument is sent to the API as body `{ path: input.filePath, content }`.

- [ ] **Step 2: Run typecheck**

Run:

```bash
rtk bun run typecheck
```

Expected: TypeScript completes with no errors.

- [ ] **Step 3: Run the shared tool-suite guard if the targeted checks pass**

Run:

```bash
rtk bun test tests/client.test.ts tests/shared tests/tools
```

Expected: full client/shared/tool suite passes. If this fails outside managed-instruction tests, inspect the failure and only fix it if the patch caused it.

---

### Task 4: Final Review And Handoff

**Files:**
- Review only: `src/tools/agent-instructions-patch.ts`
- Review only: `tests/tools/agent-instructions-patch.test.ts`

- [ ] **Step 1: Verify no live instruction mutation was introduced**

Run:

```bash
rtk rg -n "Atlas|safe_put|paperclip_agent_instructions_safe_put|agent_instructions_safe_put|instructions-bundle/file" tests src/tools/agent-instructions-patch.ts
```

Expected: only local unit-test strings and the patch tool file endpoint calls appear. There should be no live agent IDs, no Atlas-specific content, and no integration write against a real agent.

- [ ] **Step 2: Review the final diff**

Run:

```bash
rtk git diff -- src/tools/agent-instructions-patch.ts tests/tools/agent-instructions-patch.test.ts
```

Expected:

- `paperclip_agent_instructions_patch` no longer calls `PATCH /instructions-bundle`.
- Each supplied content field maps to exactly one managed instruction file.
- Each file write is followed by file readback.
- Readback mismatch throws before success.
- Return metadata is computed from readback content.
- Compatibility content fields are returned from verified readback.

- [ ] **Step 3: Prepare the implementation handoff note**

Use this content in the issue or PR handoff:

```markdown
Implemented the managed-instruction patch persistence fix.

- `paperclip_agent_instructions_patch` now writes supplied section fields through `/instructions-bundle/file`, reads each file back, and returns verified post-write metadata.
- Readback mismatches throw an actionable structured tool error instead of reporting success.
- `paperclip_agent_instructions_file_put` was left unchanged and covered by regression tests.

Verification:
- `rtk bun test tests/tools/agent-instructions-patch.test.ts tests/tools/agent-instructions-file-put.test.ts`
- `rtk bun run typecheck`
- `rtk bun test tests/client.test.ts tests/shared tests/tools`
```

Do not claim the full tool suite passed unless the exact command completed successfully in the implementation run.

## Acceptance Criteria

- `paperclip_agent_instructions_patch` no longer reports success for section content that is absent or different in file readback.
- `agentsContent`, `heartbeatContent`, `soulContent`, and `toolsContent` persist through the file endpoint as `AGENTS.md`, `HEARTBEAT.md`, `SOUL.md`, and `TOOLS.md`.
- Returned `updatedFiles` metadata contains `field`, `filePath`, `sizeBytes`, and `sha256`, all derived from readback content.
- Compatibility section content fields in the response come from verified readback content.
- `paperclip_agent_instructions_file_put` implementation and tests remain unchanged.
- Unit tests cover multi-section writes, deterministic file mapping/order, readback metadata, readback mismatch failure, missing-content readback failure, single-section company override, and no-content validation.

## Rollback

Rollback is limited to `src/tools/agent-instructions-patch.ts` and `tests/tools/agent-instructions-patch.test.ts`. Use rollback only if the verified file endpoint path breaks existing callers in a way that cannot be corrected inside the wrapper. Revert only the implementation patch for those two files and do not touch unrelated workspace changes.

## Known Risks

- Sequential writes are not transactional. If a later file PUT fails after earlier writes succeeded, the tool will fail loudly but may leave earlier files changed. This is the existing server capability boundary; a transactional server API would be a separate design.
- `ToolInputError` is an imperfect category for persistence mismatch, but it preserves structured MCP error output with the current error taxonomy. A dedicated persistence error can be designed later if this becomes common.
- If future Paperclip agents support custom section filenames, the explicit section mapping will need to become server-provided metadata. Keeping it local and small makes that later change straightforward.

## Plan Self-Review

- Spec coverage: all design acceptance criteria map to Tasks 1-3.
- Placeholder scan: no placeholder markers or open-ended implementation instructions remain.
- Scope check: plan is limited to one MCP tool and its boundary tests.
- Type consistency: field names, response keys, endpoint paths, and test expectations match the proposed implementation.
- Safety check: verification uses mocked client tests only and does not mutate live Atlas instructions.
