import { TOOLS } from "./tools/index.js";
import { PaperclipClient } from "./client.js";
import {
  PaperclipApiError,
  PaperclipUnreachableError,
  ToolInputError,
  toToolErrorPayload,
} from "./shared/errors.js";

type TextContent = { type: "text"; text: string };
type CallToolResult = { isError?: true; content: TextContent[] };

export async function handleCallTool(
  toolName: string,
  args: unknown,
  client: PaperclipClient,
  isHealthy: boolean,
): Promise<CallToolResult> {
  if (!isHealthy) {
    return {
      isError: true,
      content: [
        {
          type: "text",
          text: JSON.stringify(
            toToolErrorPayload(new PaperclipUnreachableError(client.apiBase)),
          ),
        },
      ],
    };
  }

  const tool = TOOLS.find((t) => t.name === toolName);
  if (!tool) {
    return {
      isError: true,
      content: [
        {
          type: "text",
          text: JSON.stringify({
            code: "tool_input_error",
            field: "name",
            constraint: `unknown tool '${toolName}'`,
            message: "tool not found",
          }),
        },
      ],
    };
  }

  let parsed: unknown;
  try {
    parsed = tool.inputSchema.parse(args ?? {});
  } catch (err) {
    const issue = (
      err as { issues?: Array<{ path: Array<string | number>; message: string }> }
    ).issues?.[0];
    const payload = toToolErrorPayload(
      new ToolInputError(issue?.path.join(".") ?? "input", issue?.message ?? "invalid"),
    );
    return { isError: true, content: [{ type: "text", text: JSON.stringify(payload) }] };
  }

  try {
    const result = await tool.handler(parsed, { client });
    return { content: [{ type: "text", text: JSON.stringify(result) }] };
  } catch (err) {
    if (
      err instanceof PaperclipApiError ||
      err instanceof PaperclipUnreachableError ||
      err instanceof ToolInputError
    ) {
      return {
        isError: true,
        content: [{ type: "text", text: JSON.stringify(toToolErrorPayload(err)) }],
      };
    }
    return {
      isError: true,
      content: [
        {
          type: "text",
          text: JSON.stringify({ code: "internal_error", message: (err as Error).message }),
        },
      ],
    };
  }
}
