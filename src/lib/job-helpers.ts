import type { JobTypeDef, StageDef, TemplateConfig } from "./templates/types";

export function getJobType(config: TemplateConfig, jobTypeKey: string): JobTypeDef | undefined {
  return config.jobTypes.find((jt) => jt.key === jobTypeKey);
}

export function getStage(jobType: JobTypeDef, stageKey: string): StageDef | undefined {
  return jobType.stages.find((s) => s.key === stageKey);
}

export function stageLabel(config: TemplateConfig, jobTypeKey: string, stageKey: string): string {
  const jobType = getJobType(config, jobTypeKey);
  if (!jobType) return stageKey;
  return getStage(jobType, stageKey)?.label ?? stageKey;
}

export function jobTypeLabel(config: TemplateConfig, jobTypeKey: string): string {
  return getJobType(config, jobTypeKey)?.label ?? jobTypeKey;
}

export function firstStageKey(jobType: JobTypeDef): string {
  return jobType.stages[0]?.key ?? "";
}

export function isTerminalStage(jobType: JobTypeDef, stageKey: string): boolean {
  return jobType.stages[jobType.stages.length - 1]?.key === stageKey;
}

// e.g. "Northfield Engineering Services Ltd" -> "NES-0001"
export function generateJobReference(orgName: string, sequence: number): string {
  const initials = orgName
    .split(/\s+/)
    .filter((word) => /^[A-Za-z]/.test(word))
    .map((word) => word[0]!.toUpperCase())
    .slice(0, 3)
    .join("");
  const prefix = initials.length > 0 ? initials : "JOB";
  return `${prefix}-${String(sequence).padStart(4, "0")}`;
}
