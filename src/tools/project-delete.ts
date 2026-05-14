import { z } from "zod";
import type { ToolDefinition } from "./index.js";

const inputSchema = z.object({
  projectId: z.string().min(1),
});

export const projectDeleteTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_project_delete",
  description: "Delete a project by id.",
  inputSchema,
  handler: async (input, { client }) => {
    await client.request("DELETE", `/api/projects/${encodeURIComponent(input.projectId)}`);
    return { deleted: true, id: input.projectId };
  },
};
