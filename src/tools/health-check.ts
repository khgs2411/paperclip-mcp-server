import { z } from "zod";
import type { ToolDefinition } from "./index.js";

const inputSchema = z.object({});

export const healthCheckTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_health_check",
  description:
    "Check whether the local Paperclip server is live and healthy. Hits GET /api/health without authentication. Returns HTTP status, a healthy boolean, and the raw response body when present.",
  inputSchema,
  handler: async (_input, { client }) => {
    const url = `${client.apiBase}/api/health`;
    let status: number;
    let body: unknown;
    try {
      const response = await fetch(url);
      status = response.status;
      try {
        body = await response.json();
      } catch {
        body = await response.text().catch(() => null);
      }
    } catch {
      return { status: 0, healthy: false, body: null };
    }
    return { status, healthy: status >= 200 && status < 300, body };
  },
};
