import { askClaude, isAiConfigured } from "./client";
import { getJobType, isTerminalStage, stageLabel, jobTypeLabel } from "@/lib/job-helpers";
import { todayKey } from "@/lib/time";
import type { TemplateConfig } from "@/lib/templates/types";

export type AskJobFact = {
  referenceNumber: string;
  customerName: string;
  jobType: string;
  stage: string;
  dueDate: string | null;
  ownerName: string | null;
  partsAwaited: { description: string; expectedDate: string | null; received: boolean }[];
};

// Plain-English Q&A over the org's own open jobs. Read-only — it never
// changes data, so there's nothing for a human to confirm, but the question
// and answer are still logged.
export async function answerQuestion(
  config: TemplateConfig,
  question: string,
  jobs: AskJobFact[]
): Promise<string> {
  const openJobs = jobs.filter((j) => {
    const jt = getJobType(config, j.jobType);
    return jt && !isTerminalStage(jt, j.stage);
  });

  if (isAiConfigured()) {
    const dataDump = openJobs
      .map((j) => {
        const parts = [
          `${j.referenceNumber} | customer: ${j.customerName} | type: ${jobTypeLabel(config, j.jobType)} | stage: ${stageLabel(config, j.jobType, j.stage)}`,
        ];
        if (j.dueDate) parts.push(`due: ${j.dueDate}`);
        if (j.ownerName) parts.push(`owner: ${j.ownerName}`);
        const awaited = j.partsAwaited.filter((p) => !p.received);
        if (awaited.length > 0) parts.push(`awaiting: ${awaited.map((p) => p.description).join(", ")}`);
        return parts.join(" | ");
      })
      .join("\n");

    const system = `You answer plain-English questions about a ${config.labels.job.toLowerCase()}-tracking system, using ONLY the data below. Today's date: ${todayKey()}.
Rules:
- Never invent a job reference, date, customer, or figure that isn't in the data.
- If the data doesn't answer the question, say so plainly instead of guessing.
- Reference actual job reference numbers when relevant.
- Keep the answer short and plain text, no markdown.`;

    const prompt = `Open ${config.labels.jobs.toLowerCase()} data:\n${dataDump || "(none)"}\n\nQuestion: ${question}`;

    try {
      return await askClaude({ system, prompt, maxTokens: 400 });
    } catch {
      // fall through to the demo-mode heuristic below
    }
  }

  return heuristicAnswer(config, question, openJobs);
}

function heuristicAnswer(config: TemplateConfig, question: string, jobs: AskJobFact[]): string {
  const q = question.toLowerCase();
  const today = todayKey();
  const { labels } = config;

  if (q.includes("late") || q.includes("overdue")) {
    const late = jobs.filter((j) => j.dueDate && j.dueDate < today);
    if (late.length === 0) return `No ${labels.jobs.toLowerCase()} are currently late.`;
    return `${late.length} ${late.length === 1 ? "job is" : "jobs are"} late: ${late.map((j) => `${j.referenceNumber} (${j.customerName}, due ${j.dueDate})`).join("; ")}.`;
  }

  if (q.includes("part") || q.includes("waiting") || q.includes("awaiting")) {
    const withParts = jobs.filter((j) => j.partsAwaited.some((p) => !p.received));
    if (withParts.length === 0) return `No ${labels.jobs.toLowerCase()} are waiting on parts right now.`;
    return withParts
      .map((j) => `${j.referenceNumber} (${j.customerName}): ${j.partsAwaited.filter((p) => !p.received).map((p) => p.description).join(", ")}`)
      .join("; ");
  }

  if (q.includes("due") || q.includes("week")) {
    const weekAhead = new Date(Date.parse(today) + 7 * 86400000).toISOString().slice(0, 10);
    const dueSoon = jobs.filter((j) => j.dueDate && j.dueDate >= today && j.dueDate <= weekAhead);
    if (dueSoon.length === 0) return `Nothing is due in the next 7 days.`;
    return `${dueSoon.length} due in the next 7 days: ${dueSoon.map((j) => `${j.referenceNumber} (${j.dueDate})`).join("; ")}.`;
  }

  return `I can answer questions about late ${labels.jobs.toLowerCase()}, what's waiting on parts, or what's due soon — try rephrasing, or add an Anthropic API key for open-ended questions.`;
}
