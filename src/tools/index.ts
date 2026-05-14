import type { z } from "zod";
import type { PaperclipClient } from "../client.js";

export interface ToolDefinition<TInput extends z.ZodTypeAny = z.ZodTypeAny> {
  name: string;
  description: string;
  inputSchema: TInput;
  handler: (
    input: z.infer<TInput>,
    ctx: { client: PaperclipClient },
  ) => Promise<unknown>;
}

// Tools register themselves here. Each tool task appends one entry.
export const TOOLS: ToolDefinition[] = [];
