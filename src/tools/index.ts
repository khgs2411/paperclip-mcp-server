import type { z } from "zod";
import type { PaperclipClient } from "../client.js";
import { agentPatchTool } from "./agent-patch.js";
import { agentSetPermissionsTool } from "./agent-set-permissions.js";
import { routinePatchTool } from "./routine-patch.js";
import { routineRunTool } from "./routine-run.js";
import { issuePatchTool } from "./issue-patch.js";
import { issueGetFullTool } from "./issue-get-full.js";
import { issueInteractionsListTool } from "./issue-interactions-list.js";
import { issueInteractionResolveTool } from "./issue-interaction-resolve.js";
import { inboxSummaryTool } from "./inbox-summary.js";
import { skillSyncTool } from "./skill-sync.js";
import { projectCreateTool } from "./project-create.js";
import { projectDeleteTool } from "./project-delete.js";
import { memberSetGrantsTool } from "./member-set-grants.js";
import { boardChannelAppendTool } from "./board-channel-append.js";
// Group G — Roster discovery
import { agentListTool } from "./agent-list.js";
import { agentGetTool } from "./agent-get.js";
import { agentSkillsListTool } from "./agent-skills-list.js";
import { agentSkillSyncTool } from "./agent-skill-sync.js";
import { agentHireTool } from "./agent-hire.js";
import { agentWakeupTool } from "./agent-wakeup.js";
import { agentPauseTool } from "./agent-pause.js";
import { agentResumeTool } from "./agent-resume.js";
import { agentInstructionsGetTool } from "./agent-instructions-get.js";
import { agentInstructionsPatchTool } from "./agent-instructions-patch.js";
import { agentInstructionsFileGetTool } from "./agent-instructions-file-get.js";
import { agentInstructionsFilePutTool } from "./agent-instructions-file-put.js";
import { agentInstructionsFileDeleteTool } from "./agent-instructions-file-delete.js";
// Group H — Projects, members, labels, goals
import { projectListTool } from "./project-list.js";
import { projectGetTool } from "./project-get.js";
import { projectPatchTool } from "./project-patch.js";
import { memberListTool } from "./member-list.js";
import { labelListTool } from "./label-list.js";
import { labelCreateTool } from "./label-create.js";
import { labelDeleteTool } from "./label-delete.js";
import { goalListTool } from "./goal-list.js";
import { goalGetTool } from "./goal-get.js";
import { goalCreateTool } from "./goal-create.js";
import { goalPatchTool } from "./goal-patch.js";
import { goalDeleteTool } from "./goal-delete.js";
// Group I — Board observability
import { dashboardGetTool } from "./dashboard-get.js";
import { activityCompanyTool } from "./activity-company.js";
import { sidebarBadgesTool } from "./sidebar-badges.js";
// Group J — Routines
import { routineListTool } from "./routine-list.js";
import { routineGetTool } from "./routine-get.js";
import { routineCreateTool } from "./routine-create.js";
import { routineRunsListTool } from "./routine-runs-list.js";

export interface ToolDefinition<TInput extends z.ZodTypeAny = z.ZodTypeAny> {
  name: string;
  description: string;
  inputSchema: TInput;
  handler: (
    input: z.infer<TInput>,
    ctx: { client: PaperclipClient },
  ) => Promise<unknown>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const TOOLS: ToolDefinition<any>[] = [
  agentPatchTool,
  agentSetPermissionsTool,
  routinePatchTool,
  routineRunTool,
  issuePatchTool,
  issueGetFullTool,
  issueInteractionsListTool,
  issueInteractionResolveTool,
  inboxSummaryTool,
  skillSyncTool,
  projectCreateTool,
  projectDeleteTool,
  memberSetGrantsTool,
  boardChannelAppendTool,
  // Group G — Roster discovery
  agentListTool,
  agentGetTool,
  agentSkillsListTool,
  agentSkillSyncTool,
  agentHireTool,
  agentWakeupTool,
  agentPauseTool,
  agentResumeTool,
  agentInstructionsGetTool,
  agentInstructionsPatchTool,
  agentInstructionsFileGetTool,
  agentInstructionsFilePutTool,
  agentInstructionsFileDeleteTool,
  // Group H — Projects, members, labels, goals
  projectListTool,
  projectGetTool,
  projectPatchTool,
  memberListTool,
  labelListTool,
  labelCreateTool,
  labelDeleteTool,
  goalListTool,
  goalGetTool,
  goalCreateTool,
  goalPatchTool,
  goalDeleteTool,
  // Group I — Board observability
  dashboardGetTool,
  activityCompanyTool,
  sidebarBadgesTool,
  // Group J — Routines
  routineListTool,
  routineGetTool,
  routineCreateTool,
  routineRunsListTool,
];
