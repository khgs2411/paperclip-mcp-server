export class PaperclipUnreachableError extends Error {
  readonly code = "paperclip_unreachable" as const;
  readonly recoveryCommand = "pkill -f paperclipai && npx paperclipai run";
  constructor(public readonly apiBase: string) {
    super(`Paperclip API at ${apiBase} is unreachable`);
  }
}

export class PaperclipApiError extends Error {
  readonly code = "paperclip_api_error" as const;
  constructor(
    public readonly statusCode: number,
    public readonly body: unknown,
    public readonly path: string,
  ) {
    super(`Paperclip API error ${statusCode} at ${path}`);
  }
}

export class ToolInputError extends Error {
  readonly code = "tool_input_error" as const;
  constructor(
    public readonly field: string,
    public readonly constraint: string,
  ) {
    super(`Invalid tool input: field "${field}" violated constraint "${constraint}"`);
  }
}

export type ToolError =
  | PaperclipUnreachableError
  | PaperclipApiError
  | ToolInputError;

export type ToolErrorPayload =
  | { code: "paperclip_unreachable"; apiBase: string; recoveryCommand: string }
  | { code: "paperclip_api_error"; statusCode: number; body: unknown; path: string }
  | { code: "tool_input_error"; field: string; constraint: string };

export function toToolErrorPayload(err: ToolError): ToolErrorPayload {
  if (err instanceof PaperclipUnreachableError) {
    return { code: err.code, apiBase: err.apiBase, recoveryCommand: err.recoveryCommand };
  }
  if (err instanceof PaperclipApiError) {
    return { code: err.code, statusCode: err.statusCode, body: err.body, path: err.path };
  }
  return { code: err.code, field: err.field, constraint: err.constraint };
}
