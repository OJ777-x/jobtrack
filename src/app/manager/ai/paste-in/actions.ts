"use server";

import { revalidatePath } from "next/cache";
import { requireOrgContext } from "@/lib/org-context";
import { createClient } from "@/lib/supabase/server";
import { analyzePastedText, type PasteInProposal } from "@/lib/ai/paste-in";
import { logAiAction } from "@/lib/ai/log";
import { getJobType, isTerminalStage } from "@/lib/job-helpers";
import { changeStage } from "@/app/manager/jobs/actions";

export async function analyzePasted(pastedText: string): Promise<PasteInProposal> {
  const ctx = await requireOrgContext(["manager"]);
  const supabase = await createClient();

  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, reference_number, job_type, stage, customers(name)")
    .eq("org_id", ctx.organisation.id);

  const openCandidates = (jobs ?? [])
    .filter((j) => {
      const jt = getJobType(ctx.template.config, j.job_type);
      return jt && !isTerminalStage(jt, j.stage);
    })
    .map((j) => ({
      id: j.id,
      referenceNumber: j.reference_number,
      jobType: j.job_type,
      customerName: (j.customers as unknown as { name: string } | null)?.name ?? "—",
    }));

  const proposal = await analyzePastedText(ctx.template.config, pastedText, openCandidates);

  await logAiAction({
    orgId: ctx.organisation.id,
    actionType: "paste_in_analysis",
    inputSummary: pastedText.slice(0, 200),
    outputSummary: proposal.matchedJobId ? `Matched job ${proposal.matchedJobId}; ${proposal.matchedReason}` : "No job matched",
    performedBy: ctx.profile.id,
    confirmed: false,
  });

  return proposal;
}

export async function applyPasteIn(jobId: string, noteBody: string, stageKey: string | null) {
  const ctx = await requireOrgContext(["manager"]);
  const supabase = await createClient();

  await supabase.from("job_notes").insert({
    job_id: jobId,
    author_id: ctx.profile.id,
    body: noteBody,
    visible_to_customer: false,
  });

  if (stageKey) {
    const fd = new FormData();
    fd.set("stage", stageKey);
    await changeStage(jobId, fd);
  }

  await logAiAction({
    orgId: ctx.organisation.id,
    actionType: "paste_in_apply",
    inputSummary: `Job ${jobId}`,
    outputSummary: `Added note${stageKey ? ` and changed stage to "${stageKey}"` : ""} after manager confirmation`,
    performedBy: ctx.profile.id,
    confirmed: true,
  });

  revalidatePath(`/manager/jobs/${jobId}`);
}
