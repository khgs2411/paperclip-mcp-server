# Managed Instruction Patch Persistence Design

## Source Issue

- Design issue: [TOP-637](/TOP/issues/TOP-637)
- Parent fix issue: [TOP-636](/TOP/issues/TOP-636)
- Project checkout: `/Users/liadgoren/Repositories/paperclip/mcp`
- Artifact type: design spec

## Problem

`paperclip_agent_instructions_patch` can return success for a multi-section managed-instruction update while the supplied content is not persisted. The observed failure came from a patch for Atlas that supplied `agentsContent`, `heartbeatContent`, `soulContent`, and `toolsContent`; immediate `safe_get` readback for `AGENTS.md`, `HEARTBEAT.md`, `SOUL.md`, and `TOOLS.md` still showed the old content and hashes. Writing those same files through `paperclip_agent_instructions_file_put` did persist, and readback then showed new content, sizes, and hashes.

The fix must make `paperclip_agent_instructions_patch` either persist every supplied section and report post-write state, or fail loudly with an actionable unsupported-path error. It must not report success for a no-op content update.

## Repository Evidence

- `README.md` documents `paperclip_agent_instructions_patch` as a lower-level/admin bundle patch tool and `paperclip_agent_instructions_file_put` as the raw file write path.
- `src/tools/agent-instructions-patch.ts` accepts the four section fields and forwards them directly to `PATCH /api/agents/:agentId/instructions-bundle?companyId=...`, then passes through the raw response without validating persistence.
- `src/tools/agent-instructions-file-put.ts` writes via `PUT /api/agents/:agentId/instructions-bundle/file?companyId=...` with body `{ path, content }` and returns `{ filePath, written: true }`.
- `src/tools/agent-instructions-safe-put.ts` uses the same file endpoint with provenance, run metadata, and computed response metadata, which confirms the file endpoint is the established persistence path for managed-instruction file content.
- `tests/tools/agent-instructions-patch.test.ts` currently verifies only request forwarding and raw response passthrough; it has no readback or no-op detection coverage.
- `tests/tools/agent-instructions-file-put.test.ts` verifies the `filePath` to API `path` mapping that fixed the file tools in commit `6441edf`.

## Design Goals

1. Preserve the existing public MCP input shape for `paperclip_agent_instructions_patch`.
2. Preserve `paperclip_agent_instructions_file_put` behavior unchanged.
3. Treat supplied patch fields as an all-supplied-fields persistence operation: every provided content field must be reflected in post-write readback.
4. Make response metadata reflect the post-write state of the updated files, not a stale bundle PATCH response.
5. Fail before reporting success when the underlying bundle PATCH endpoint does not support the requested section update mode.
6. Keep the implementation narrow, concrete, and easy to verify with unit tests.

## Non-Goals

- Do not change live Atlas instructions during implementation or verification.
- Do not redesign the managed-instruction API or safe-put provenance policy.
- Do not remove or rename the lower-level/admin tools.
- Do not add a new generic repository or abstraction layer around all instruction tools.

## Clarifying Decisions From Evidence

The brainstorming workflow asks for human clarification and approval, but Daedalus cannot interview Liad mid-run. I resolved those prompts from issue context, repository evidence, and the `code-style` wiki.

- Assumption: section-to-file mapping -- `agentsContent`, `heartbeatContent`, `soulContent`, and `toolsContent` correspond to `AGENTS.md`, `HEARTBEAT.md`, `SOUL.md`, and `TOOLS.md`; chosen because `safe_get` derives the same filenames from `*Content` fields and the parent issue names those exact readback files. Revisit if the Paperclip API supports custom section-to-file mapping per bundle.
- Assumption: all-or-error semantics -- a multi-section patch should not partially succeed; chosen because the issue says supplied multi-section content fields must persist or fail loudly. Revisit if the product intentionally accepts partial section updates with explicit per-file status.
- Assumption: no live integration reproduction in this fix -- unit tests and a safe fixture/harness are sufficient before implementation; chosen because the issue explicitly forbids mutating live Atlas instructions and this MCP wrapper can be tested by mocking `PaperclipClient.request`. Revisit if Vesta requires a live safe-agent integration check.

## Options Considered

### Recommended: Make Patch Use File Writes Plus Readback Verification

Translate each supplied section field to its managed file path, call the existing file endpoint for each supplied field, read back each updated file or bundle metadata afterward, and return metadata derived from post-write content.

Tradeoffs:

- Strongest fit for the observed failure because the file endpoint is the known working persistence path.
- Keeps the wrapper honest even if the bundle PATCH endpoint continues returning stale success.
- Slightly changes the internal implementation of a lower-level PATCH tool, but preserves its MCP input contract and matches the required semantics.

### Alternative: Keep Bundle PATCH And Verify Afterward

Continue calling `PATCH /instructions-bundle`, then read back the files and throw if supplied content did not persist.

Tradeoffs:

- Minimal internal behavior change.
- Still depends on an endpoint already observed to return success without persistence.
- Likely produces a loud error rather than a working multi-section patch, which may satisfy the failure contract but not the preferred persistence contract.

### Alternative: Deprecate Patch For Managed Bundles

Reject `paperclip_agent_instructions_patch` for managed bundles and direct callers to `paperclip_agent_instructions_file_put` or `safe_put`.

Tradeoffs:

- Safest if section patching is intentionally unsupported.
- Breaks current callers expecting multi-section patch convenience.
- Requires reliable bundle-mode detection before write attempts.

## Proposed Architecture

Implement the recommended option unless source investigation during implementation proves the file endpoint cannot represent every supplied section.

`agentInstructionsPatchTool.handler` should own this workflow directly or through one small local helper in `src/tools/agent-instructions-patch.ts`. The helper should exist only if it makes the field mapping and post-write response shape clearer; it should not become a generic instruction repository.

Flow:

1. Resolve `companyId` with `client.resolveCompanyId`.
2. Convert supplied content fields to an ordered list of file updates:
   - `agentsContent` -> `AGENTS.md`
   - `heartbeatContent` -> `HEARTBEAT.md`
   - `soulContent` -> `SOUL.md`
   - `toolsContent` -> `TOOLS.md`
3. For each supplied field, call the known working file endpoint:
   - method: `PUT`
   - path: `/api/agents/${agentId}/instructions-bundle/file?companyId=${companyId}`
   - body: `{ path: filePath, content }`
4. Read back each updated file with:
   - method: `GET`
   - path: `/api/agents/${agentId}/instructions-bundle/file?companyId=${companyId}&path=${filePath}`
5. Compare readback content against the requested content. If any mismatch occurs, throw a `PaperclipApiError` or `ToolInputError`-style actionable error that names the file path and says the patch did not persist.
6. Return a compact post-write response that includes each updated file's `filePath`, `sizeBytes`, and `sha256`, plus compatibility fields for the supplied section content if the current raw bundle response shape is still needed by callers.

The response should not reuse a pre-write or bundle-PATCH response as proof of persistence. The source of truth after a write is readback.

## Error Handling

- Zod validation should continue rejecting calls with no content fields.
- If a file PUT fails, allow `PaperclipClient.request` to surface the API error; do not convert it into success metadata.
- If readback content is missing or different from requested content, throw an actionable error such as: `instructions patch did not persist HEARTBEAT.md; readback content did not match supplied heartbeatContent`.
- If implementation investigation proves section patching is unsupported for the target bundle mode, fail before writes when possible with an explicit unsupported-path error naming `paperclip_agent_instructions_patch` and the recommended file tool fallback.

## Response Shape

The exact response can stay compact, but it must communicate post-write state. Recommended shape:

```ts
{
  agentId: string;
  updatedFiles: Array<{
    field: "agentsContent" | "heartbeatContent" | "soulContent" | "toolsContent";
    filePath: string;
    sizeBytes: number;
    sha256: string;
  }>;
}
```

Compatibility option: also include `agentsContent`, `heartbeatContent`, `soulContent`, and `toolsContent` for supplied fields if tests or callers rely on the old raw bundle section shape. These fields must come from verified readback content, not from the request body or stale PATCH response.

## Test Plan

Add focused unit coverage in `tests/tools/agent-instructions-patch.test.ts`.

Required tests:

1. Multi-section patch writes all supplied fields through the file endpoint in deterministic order and maps each field to the expected file path.
2. Multi-section patch reads back every written file and returns size/hash metadata derived from post-write content.
3. Readback mismatch rejects with an actionable error and does not report success.
4. Single-section patch still works, so callers are not forced into all-four-field updates.
5. Existing "rejects when no content fields are provided" coverage remains.

Preserve existing file tool tests:

- `tests/tools/agent-instructions-file-put.test.ts` should remain behaviorally unchanged.
- No implementation should alter the `{ path: input.filePath, content }` body shape for `paperclip_agent_instructions_file_put`.

Optional integration coverage:

- If a safe test agent or fixture agent is available, run a multi-section patch against that agent, then verify `safe_get` readback hashes changed for all updated files. Do not run this against Atlas or any live role-bearing agent.

## Acceptance Criteria

- `paperclip_agent_instructions_patch` no longer reports success when supplied section content is absent from readback.
- Supplied `agentsContent`, `heartbeatContent`, `soulContent`, and `toolsContent` persist to `AGENTS.md`, `HEARTBEAT.md`, `SOUL.md`, and `TOOLS.md`, or the tool throws a clear unsupported-path/persistence error.
- Returned metadata is derived from post-write readback.
- `paperclip_agent_instructions_file_put` tests and behavior remain unchanged.
- Regression tests cover multi-section persistence, readback verification, mismatch failure, and single-section compatibility.

## Risks

- If callers depend on the raw bundle PATCH response shape, returning only compact metadata could be a compatibility risk. Mitigate by including verified compatibility content fields when cheap.
- Sequential file writes can leave partial state if one later write fails. Because the current API does not expose a transactional multi-file write in this wrapper, the implementation should fail loudly and report the failing file; Vesta may decide whether this is acceptable or whether the server API needs a transaction first.
- If the Paperclip API has hidden bundle modes with different section paths, the hard-coded mapping could be incomplete. The implementation should keep the mapping local and explicit so future modes are easy to add.

## Verification Commands For Merlin

```bash
bun test tests/tools/agent-instructions-patch.test.ts tests/tools/agent-instructions-file-put.test.ts
bun run typecheck
```

If implementation touches shared client behavior, broaden to:

```bash
bun test tests/client.test.ts tests/shared tests/tools
```

## Design Self-Review

- No placeholders remain.
- Scope is limited to the patch wrapper, its tests, and documentation only if the response semantics need documenting.
- The design preserves the working file PUT path.
- The design documents all assumptions made instead of waiting for human clarification.
- The implementation boundary follows the code-style guidance: concrete ownership in the tool module, no wrapper-only abstraction, and tests at the behavior boundary.
