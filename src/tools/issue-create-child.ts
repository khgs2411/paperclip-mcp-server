import { z } from "zod";
import type { ToolDefinition } from "./index.js";
import { assertWorkflowBoundaryText } from "../shared/workflow-boundary.js";
import { assertGateLoopBudget } from "../shared/gate-loop-guard.js";

const inputSchema = z.object({
  issueId: z.string().min(1).describe("Parent issue UUID or PREFIX-N identifier"),
  title: z.string().min(1).describe("Child issue title"),
  description: z.string().optional().describe("Child issue description (markdown)"),
  status: z.enum(["backlog", "todo", "in_progress", "in_review", "done", "blocked", "cancelled"]).optional(),
  priority: z.enum(["critical", "high", "medium", "low"]).optional(),
  assigneeAgentId: z.string().optional().describe("Assignee agent UUID"),
});

export const issueCreateChildTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_issue_create_child",
  description:
    "Create a child issue under a parent. The child inherits the parent's project and goal. " +
    "Use this for delegation patterns where a parent issue spawns sub-tasks.",
  inputSchema,
  handler: async (input, { client }) => {
    const { issueId, ...body } = input;
    assertWorkflowBoundaryText({ toolName: "paperclip_issue_create_child", fields: body });
    await assertGateLoopBudget(client, { parentIssueId: issueId, title: body.title });
    return client.request(
      "POST",
      `/api/issues/${encodeURIComponent(issueId)}/children`,
      body,
    );
  },
};
