import { askClaude, isAiConfigured } from "./client";
import { stageLabel, jobTypeLabel } from "@/lib/job-helpers";
import type { TemplateConfig } from "@/lib/templates/types";

export type UpdateJobFact = {
  referenceNumber: string;
  jobType: string;
  stage: string;
  dueDate: string | null;
};

// Builds a draft customer-facing update. Demo mode assembles a plain,
// factual message from the template's own wording; with an API key, Claude
// rewrites the same facts in the template's tone — never adding new ones.
export async function draftCustomerUpdate(
  config: TemplateConfig,
  customerName: string,
  jobs: UpdateJobFact[]
): Promise<{ body: string; usedAi: boolean }> {
  const { labels, aiTone } = config;

  const facts = jobs.map((j) => {
    const parts = [
      `${j.referenceNumber} (${jobTypeLabel(config, j.jobType)}): currently "${stageLabel(config, j.jobType, j.stage)}"`,
    ];
    if (j.dueDate) parts.push(`expected completion ${j.dueDate}`);
    return parts.join(", ");
  });

  if (jobs.length === 0) {
    return { body: `Hi ${customerName},\n\nYou have no open ${labels.jobs.toLowerCase()} with us at the moment.\n\n${aiTone.signOff}`, usedAi: false };
  }

  if (!isAiConfigured()) {
    const lines = facts.map((f) => `- ${f}`).join("\n");
    const body = `Hi ${customerName},\n\nHere's where things stand with your ${labels.jobs.toLowerCase()}:\n\n${lines}\n\n${aiTone.signOff}`;
    return { body, usedAi: false };
  }

  const system = `You draft short customer status update emails for a ${labels.job.toLowerCase()}-tracking system. Style: ${aiTone.style}
Rules:
- Use ONLY the facts given below. Never invent dates, prices, or promises.
- If something isn't in the facts, don't mention it.
- Keep it short (under 120 words), plain text, no markdown.
- End with exactly this sign-off: "${aiTone.signOff}"`;

  const prompt = `Customer: ${customerName}\n\nFacts about their ${labels.jobs.toLowerCase()}:\n${facts.map((f) => `- ${f}`).join("\n")}\n\nWrite the update now.`;

  try {
    const body = await askClaude({ system, prompt, maxTokens: 400 });
    return { body, usedAi: true };
  } catch {
    const lines = facts.map((f) => `- ${f}`).join("\n");
    const body = `Hi ${customerName},\n\nHere's where things stand with your ${labels.jobs.toLowerCase()}:\n\n${lines}\n\n${aiTone.signOff}`;
    return { body, usedAi: false };
  }
}
