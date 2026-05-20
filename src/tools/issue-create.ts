import { z } from "zod";
import type { ToolDefinition } from "./index.js";
import { assertWorkflowBoundaryText } from "../shared/workflow-boundary.js";
import { assertGateLoopBudget } from "../shared/gate-loop-guard.js";

const inputSchema = z.object({
  companyId: z.string().optional().describe("Company UUID (falls back to PAPERCLIP_COMPANY_ID)"),
  title: z.string().min(1).describe("Issue title"),
  description: z.string().optional().describe("Issue description (markdown)"),
  status: z.enum(["backlog", "todo", "in_progress", "in_review", "done", "blocked", "cancelled"]).optional(),
  priority: z.enum(["critical", "high", "medium", "low"]).optional(),
  workMode: z.enum(["standard", "planning"]).optional().describe("Execution work mode (default: standard)"),
  assigneeAgentId: z.string().optional().describe("Assignee agent UUID"),
  projectId: z.string().optional().describe("Project UUID"),
  parentId: z.string().optional().describe("Parent issue UUID"),
  goalId: z.string().optional().describe("Goal UUID"),
  blockedByIssueIds: z.array(z.string()).optional().describe("Issue UUIDs that block this issue"),
});

export const issueCreateTool: ToolDefinition<typeof inputSchema> = {
  name: "paperclip_issue_create",
  description:
    "Create a new issue. This is the primary way agents file work items, bugs, or tasks on the board.",
  inputSchema,
  handler: async (input, { client }) => {
    const { companyId, ...body } = input;
    assertWorkflowBoundaryText({ toolName: "paperclip_issue_create", fields: body });
    await assertGateLoopBudget(client, { parentIssueId: body.parentId, title: body.title });
    const cid = client.resolveCompanyId(companyId);
    return client.request("POST", `/api/companies/${encodeURIComponent(cid)}/issues`, body);
  },
};
