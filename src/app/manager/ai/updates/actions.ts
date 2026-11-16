"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireOrgContext } from "@/lib/org-context";
import { createClient } from "@/lib/supabase/server";
import { draftCustomerUpdate } from "@/lib/ai/updates";
import { logAiAction } from "@/lib/ai/log";
import { getJobType, isTerminalStage } from "@/lib/job-helpers";

export async function generateDraft(customerId: string) {
  const ctx = await requireOrgContext(["manager"]);
  const supabase = await createClient();

  const { data: customer } = await supabase.from("customers").select("name").eq("id", customerId).single();
  if (!customer) return;

  const { data: jobs } = await supabase
    .from("jobs")
    .select("reference_number, job_type, stage, due_date")
    .eq("customer_id", customerId);

  const openJobs = (jobs ?? []).filter((j) => {
    const jt = getJobType(ctx.template.config, j.job_type);
    return jt && !isTerminalStage(jt, j.stage);
  });

  const { body, usedAi } = await draftCustomerUpdate(
    ctx.template.config,
    customer.name,
    openJobs.map((j) => ({
      referenceNumber: j.reference_number,
      jobType: j.job_type,
      stage: j.stage,
      dueDate: j.due_date,
    }))
  );

  await supabase.from("customer_updates").insert({
    org_id: ctx.organisation.id,
    customer_id: customerId,
    body,
    status: "draft",
    created_by: ctx.profile.id,
  });

  await logAiAction({
    orgId: ctx.organisation.id,
    actionType: "draft_customer_update",
    inputSummary: `Customer: ${customer.name}; ${openJobs.length} open job(s)`,
    outputSummary: usedAi ? `AI-drafted update (${body.length} chars)` : `Demo-mode draft (${body.length} chars)`,
    performedBy: ctx.profile.id,
    confirmed: false,
  });

  revalidatePath("/manager/ai/updates");
  redirect("/manager/ai/updates");
}

export async function editDraft(updateId: string, formData: FormData) {
  await requireOrgContext(["manager"]);
  const supabase = await createClient();
  const body = String(formData.get("body") || "");
  await supabase.from("customer_updates").update({ body }).eq("id", updateId).eq("status", "draft");
  revalidatePath("/manager/ai/updates");
}

export async function publishUpdate(updateId: string) {
  const ctx = await requireOrgContext(["manager"]);
  const supabase = await createClient();

  const { data: update } = await supabase
    .from("customer_updates")
    .select("body")
    .eq("id", updateId)
    .single();

  await supabase
    .from("customer_updates")
    .update({ status: "published", published_at: new Date().toISOString(), approved_by: ctx.profile.id })
    .eq("id", updateId);

  await logAiAction({
    orgId: ctx.organisation.id,
    actionType: "publish_customer_update",
    inputSummary: `Update ${updateId}`,
    outputSummary: `Manager approved and published: "${(update?.body ?? "").slice(0, 150)}"`,
    performedBy: ctx.profile.id,
    confirmed: true,
  });

  revalidatePath("/manager/ai/updates");
  revalidatePath("/portal");
}

export async function discardDraft(updateId: string) {
  await requireOrgContext(["manager"]);
  const supabase = await createClient();
  await supabase.from("customer_updates").delete().eq("id", updateId).eq("status", "draft");
  revalidatePath("/manager/ai/updates");
}
