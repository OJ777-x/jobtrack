"use server";

import { revalidatePath } from "next/cache";
import { requireOrgContext } from "@/lib/org-context";
import { createClient } from "@/lib/supabase/server";
import { computeRiskFlags, type RiskJobInput } from "@/lib/ai/risk";
import { logAiAction } from "@/lib/ai/log";

export async function loadRiskJobs(): Promise<{ jobs: RiskJobInput[]; orgId: string }> {
  const ctx = await requireOrgContext(["manager"]);
  const supabase = await createClient();

  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, reference_number, job_type, stage, due_date, customers(name), profiles(display_name)")
    .eq("org_id", ctx.organisation.id);

  const jobIds = (jobs ?? []).map((j) => j.id);

  const [{ data: history }, { data: parts }] = await Promise.all([
    jobIds.length
      ? supabase.from("job_stage_history").select("job_id, changed_at").in("job_id", jobIds).order("changed_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    jobIds.length
      ? supabase.from("parts_awaited").select("job_id, description, expected_date, received").in("job_id", jobIds)
      : Promise.resolve({ data: [] }),
  ]);

  const lastChangeByJob = new Map<string, string>();
  for (const h of history ?? []) {
    if (!lastChangeByJob.has(h.job_id)) lastChangeByJob.set(h.job_id, h.changed_at);
  }

  const partsByJob = new Map<string, RiskJobInput["partsAwaited"]>();
  for (const p of parts ?? []) {
    const list = partsByJob.get(p.job_id) ?? [];
    list.push({ description: p.description, expectedDate: p.expected_date, received: p.received });
    partsByJob.set(p.job_id, list);
  }

  const riskJobs: RiskJobInput[] = (jobs ?? []).map((j) => ({
    id: j.id,
    referenceNumber: j.reference_number,
    jobType: j.job_type,
    stage: j.stage,
    dueDate: j.due_date,
    customerName: (j.customers as unknown as { name: string } | null)?.name ?? "—",
    ownerName: (j.profiles as unknown as { display_name: string } | null)?.display_name ?? null,
    lastStageChangeAt: lastChangeByJob.get(j.id) ?? null,
    partsAwaited: partsByJob.get(j.id) ?? [],
  }));

  return { jobs: riskJobs, orgId: ctx.organisation.id };
}

export async function runAndLogRiskScan() {
  const ctx = await requireOrgContext(["manager"]);
  const { jobs } = await loadRiskJobs();
  const flags = computeRiskFlags(ctx.template.config, jobs);

  await logAiAction({
    orgId: ctx.organisation.id,
    actionType: "risk_scan",
    inputSummary: `Scanned ${jobs.length} open/active job(s)`,
    outputSummary:
      flags.length === 0
        ? "No jobs flagged as at risk"
        : `${flags.length} job(s) flagged: ${flags.map((f) => f.referenceNumber).join(", ")}`,
    performedBy: ctx.profile.id,
    confirmed: true,
  });

  revalidatePath("/manager/ai/risk-flags");
}
