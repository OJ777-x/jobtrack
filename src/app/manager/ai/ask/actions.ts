"use server";

import { requireOrgContext } from "@/lib/org-context";
import { createClient } from "@/lib/supabase/server";
import { answerQuestion } from "@/lib/ai/ask";
import { logAiAction } from "@/lib/ai/log";

export async function askOrgQuestion(question: string): Promise<string> {
  const ctx = await requireOrgContext(["manager"]);
  const supabase = await createClient();

  const { data: jobs } = await supabase
    .from("jobs")
    .select("reference_number, job_type, stage, due_date, customers(name), profiles(display_name), parts_awaited(description, expected_date, received)")
    .eq("org_id", ctx.organisation.id);

  const jobFacts = (jobs ?? []).map((j) => ({
    referenceNumber: j.reference_number,
    customerName: (j.customers as unknown as { name: string } | null)?.name ?? "—",
    jobType: j.job_type,
    stage: j.stage,
    dueDate: j.due_date,
    ownerName: (j.profiles as unknown as { display_name: string } | null)?.display_name ?? null,
    partsAwaited: (j.parts_awaited as unknown as { description: string; expected_date: string | null; received: boolean }[]) ?? [],
  })).map((j) => ({
    ...j,
    partsAwaited: j.partsAwaited.map((p) => ({ description: p.description, expectedDate: p.expected_date, received: p.received })),
  }));

  const answer = await answerQuestion(ctx.template.config, question, jobFacts);

  await logAiAction({
    orgId: ctx.organisation.id,
    actionType: "ask_question",
    inputSummary: question,
    outputSummary: answer.slice(0, 300),
    performedBy: ctx.profile.id,
    confirmed: true,
  });

  return answer;
}
