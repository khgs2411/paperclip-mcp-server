import { ToolInputError } from "./errors.js";

export function requireAgentApiKey(): void {
  if (!process.env["PAPERCLIP_AGENT_API_KEY"]) {
    throw new ToolInputError(
      "PAPERCLIP_AGENT_API_KEY",
      "required for agent-scoped tools; set the PAPERCLIP_AGENT_API_KEY environment variable",
    );
  }
}
