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
// Group A — Issues lifecycle (CRUD)
import { issueListTool } from "./issue-list.js";
import { issueCountTool } from "./issue-count.js";
import { issueSearchTool } from "./issue-search.js";
import { issueCreateTool } from "./issue-create.js";
import { issueCreateChildTool } from "./issue-create-child.js";
import { issueDeleteTool } from "./issue-delete.js";
// Group B — Issue comments
import { issueCommentsListTool } from "./issue-comments-list.js";
import { issueCommentAddTool } from "./issue-comment-add.js";
import { issueCommentDeleteTool } from "./issue-comment-delete.js";
// Group C — Issue interactions (per-interaction lifecycle)
import { issueInteractionCreateTool } from "./issue-interaction-create.js";
import { issueInteractionRespondTool } from "./issue-interaction-respond.js";
import { issueInteractionAcceptTool } from "./issue-interaction-accept.js";
import { issueInteractionRejectTool } from "./issue-interaction-reject.js";
import { issueInteractionCancelTool } from "./issue-interaction-cancel.js";
// Group D — Issue workflow (checkout, activity, documents, inbox markers)
import { issueCheckoutTool } from "./issue-checkout.js";
import { issueReleaseTool } from "./issue-release.js";
import { issueActivityTool } from "./issue-activity.js";
import { issueDocumentsListTool } from "./issue-documents-list.js";
import { issueDocumentGetTool } from "./issue-document-get.js";
import { issueDocumentPutTool } from "./issue-document-put.js";
import { issueDocumentDeleteTool } from "./issue-document-delete.js";
import { issueReadMarkTool, issueReadUnmarkTool } from "./issue-read-mark.js";
import { issueInboxArchiveTool, issueInboxUnarchiveTool } from "./issue-inbox-archive.js";
import { skillSyncTool } from "./skill-sync.js";
import { projectCreateTool } from "./project-create.js";
import { projectDeleteTool } from "./project-delete.js";
import { memberSetGrantsTool } from "./member-set-grants.js";
// Group E — Inbox (agent-scoped, requires PAPERCLIP_AGENT_API_KEY)
import { meWhoamiTool } from "./me-whoami.js";
import { inboxMineTool } from "./inbox-mine.js";
import { inboxLiteTool } from "./inbox-lite.js";
import { inboxDismissalsListTool } from "./inbox-dismissals-list.js";
import { inboxDismissTool } from "./inbox-dismiss.js";
// Group F — Approvals (Red-tier lifecycle)
import { approvalListTool } from "./approval-list.js";
import { approvalGetTool } from "./approval-get.js";
import { approvalCreateTool } from "./approval-create.js";
import { approvalApproveTool } from "./approval-approve.js";
import { approvalRejectTool } from "./approval-reject.js";
import { approvalRequestRevisionTool } from "./approval-request-revision.js";
import { approvalResubmitTool } from "./approval-resubmit.js";
import { approvalCommentsListTool } from "./approval-comments-list.js";
import { approvalCommentAddTool } from "./approval-comment-add.js";
import { approvalIssuesListTool } from "./approval-issues-list.js";
import { issueApprovalLinkTool } from "./issue-approval-link.js";
import { issueApprovalUnlinkTool } from "./issue-approval-unlink.js";
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
import { agentInstructionsSafeGetTool } from "./agent-instructions-safe-get.js";
import { agentInstructionsSafePutTool } from "./agent-instructions-safe-put.js";
// Group H — Projects, members, labels, goals, skills, adapters
import { adapterModelsListTool } from "./adapter-models-list.js";
import { adapterModelProfilesListTool } from "./adapter-model-profiles-list.js";
import { agentEffectiveRuntimeConfigGetTool } from "./agent-effective-runtime-config-get.js";
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
import { skillListTool } from "./skill-list.js";
import { skillGetTool } from "./skill-get.js";
import { skillDeleteTool } from "./skill-delete.js";
// Group I — Board observability
import { dashboardGetTool } from "./dashboard-get.js";
import { activityCompanyTool } from "./activity-company.js";
import { sidebarBadgesTool } from "./sidebar-badges.js";
import { healthCheckTool } from "./health-check.js";
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
  // Group A — Issues lifecycle (CRUD)
  issueListTool,
  issueCountTool,
  issueSearchTool,
  issueCreateTool,
  issueCreateChildTool,
  issueDeleteTool,
  // Group B — Issue comments
  issueCommentsListTool,
  issueCommentAddTool,
  issueCommentDeleteTool,
  // Group C — Issue interactions
  issueInteractionCreateTool,
  issueInteractionRespondTool,
  issueInteractionAcceptTool,
  issueInteractionRejectTool,
  issueInteractionCancelTool,
  // Group D — Issue workflow
  issueCheckoutTool,
  issueReleaseTool,
  issueActivityTool,
  issueDocumentsListTool,
  issueDocumentGetTool,
  issueDocumentPutTool,
  issueDocumentDeleteTool,
  issueReadMarkTool,
  issueReadUnmarkTool,
  issueInboxArchiveTool,
  issueInboxUnarchiveTool,
  // Group E — Inbox (agent-scoped)
  meWhoamiTool,
  inboxMineTool,
  inboxLiteTool,
  inboxDismissalsListTool,
  inboxDismissTool,
  // Group F — Approvals
  approvalListTool,
  approvalGetTool,
  approvalCreateTool,
  approvalApproveTool,
  approvalRejectTool,
  approvalRequestRevisionTool,
  approvalResubmitTool,
  approvalCommentsListTool,
  approvalCommentAddTool,
  approvalIssuesListTool,
  issueApprovalLinkTool,
  issueApprovalUnlinkTool,
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
  agentInstructionsSafeGetTool,
  agentInstructionsSafePutTool,
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
  skillListTool,
  skillGetTool,
  skillDeleteTool,
  adapterModelsListTool,
  adapterModelProfilesListTool,
  agentEffectiveRuntimeConfigGetTool,
  // Group I — Board observability
  dashboardGetTool,
  activityCompanyTool,
  sidebarBadgesTool,
  healthCheckTool,
  // Group J — Routines
  routineListTool,
  routineGetTool,
  routineCreateTool,
  routineRunsListTool,
];
