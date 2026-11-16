import { getJobType, isTerminalStage, stageLabel } from "@/lib/job-helpers";
import { isOlderThanDays, todayKey } from "@/lib/time";
import type { TemplateConfig } from "@/lib/templates/types";

const STUCK_THRESHOLD_DAYS = 5;

export type RiskFlag = {
  jobId: string;
  referenceNumber: string;
  customerName: string;
  reasons: string[];
  suggestedAction: string;
};

export type RiskJobInput = {
  id: string;
  referenceNumber: string;
  jobType: string;
  stage: string;
  dueDate: string | null;
  customerName: string;
  ownerName: string | null;
  lastStageChangeAt: string | null;
  partsAwaited: { description: string; expectedDate: string | null; received: boolean }[];
};

// Deterministic, data-only risk detection — every reason is a plain
// statement of fact already in the database, never an AI guess. This is
// the "plain-English reason and suggested action" the brief asks for.
export function computeRiskFlags(config: TemplateConfig, jobs: RiskJobInput[]): RiskFlag[] {
  const today = todayKey();
  const flags: RiskFlag[] = [];

  for (const job of jobs) {
    const jobType = getJobType(config, job.jobType);
    if (!jobType || isTerminalStage(jobType, job.stage)) continue;

    const reasons: string[] = [];
    const actions: string[] = [];
    const currentStageLabel = stageLabel(config, job.jobType, job.stage);

    if (job.lastStageChangeAt && isOlderThanDays(job.lastStageChangeAt, STUCK_THRESHOLD_DAYS)) {
      const days = Math.floor((Date.parse(today) - Date.parse(job.lastStageChangeAt.slice(0, 10))) / 86400000);
      reasons.push(`Stuck in "${currentStageLabel}" for ${days} days`);
      actions.push(job.ownerName ? `Check in with ${job.ownerName} on progress` : `Assign an owner and check progress`);
    }

    const overdueParts = job.partsAwaited.filter((p) => !p.received && p.expectedDate && p.expectedDate < today);
    if (overdueParts.length > 0) {
      reasons.push(
        `${overdueParts.length === 1 ? "A part is" : `${overdueParts.length} parts are`} overdue: ${overdueParts.map((p) => p.description).join(", ")}`
      );
      actions.push("Chase the supplier for an updated delivery date");
    }

    if (job.dueDate) {
      if (job.dueDate < today) {
        reasons.push(`Due date (${job.dueDate}) has already passed`);
        actions.push("Contact the customer with a revised date");
      } else if (job.dueDate <= addDaysKey(today, 2)) {
        reasons.push(`Due in 2 days or less (${job.dueDate}), still at "${currentStageLabel}"`);
        actions.push("Confirm this will be ready on time");
      }
    }

    if (reasons.length > 0) {
      flags.push({
        jobId: job.id,
        referenceNumber: job.referenceNumber,
        customerName: job.customerName,
        reasons,
        suggestedAction: actions[0] ?? "Review this job",
      });
    }
  }

  return flags;
}

function addDaysKey(dateKey: string, days: number): string {
  const d = new Date(dateKey);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
