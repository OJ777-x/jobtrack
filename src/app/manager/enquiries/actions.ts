"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireOrgContext } from "@/lib/org-context";
import { createClient } from "@/lib/supabase/server";
import { getJobType, firstStageKey, generateJobReference } from "@/lib/job-helpers";

export async function createEnquiry(formData: FormData) {
  const ctx = await requireOrgContext(["manager"]);
  const supabase = await createClient();

  const customerId = String(formData.get("customer_id") || "");
  const jobType = String(formData.get("job_type") || "");
  const description = String(formData.get("description") || "").trim() || null;

  if (!customerId || !jobType) {
    redirect(`/manager/enquiries/new?error=${encodeURIComponent("Customer and job type are required")}`);
  }

  const { data: enquiry, error } = await supabase
    .from("enquiries")
    .insert({ org_id: ctx.organisation.id, customer_id: customerId, job_type: jobType, description })
    .select("id")
    .single();

  if (error) {
    redirect(`/manager/enquiries/new?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/manager/enquiries");
  redirect(`/manager/enquiries/${enquiry.id}`);
}

export async function createQuote(enquiryId: string, formData: FormData) {
  await requireOrgContext(["manager"]);
  const supabase = await createClient();

  const { data: enquiry } = await supabase.from("enquiries").select("org_id").eq("id", enquiryId).single();
  if (!enquiry) return;

  const amountRaw = String(formData.get("amount") || "").trim();
  const amount = amountRaw ? Number(amountRaw) : null;
  const customerPoNumber = String(formData.get("customer_po_number") || "").trim() || null;

  await supabase.from("quotes").insert({
    org_id: enquiry.org_id,
    enquiry_id: enquiryId,
    amount,
    customer_po_number: customerPoNumber,
    status: "draft",
  });

  await supabase.from("enquiries").update({ status: "quoted" }).eq("id", enquiryId);

  revalidatePath(`/manager/enquiries/${enquiryId}`);
}

export async function updateQuoteStatus(
  enquiryId: string,
  quoteId: string,
  status: "sent" | "approved" | "rejected"
) {
  await requireOrgContext(["manager"]);
  const supabase = await createClient();

  const patch: Record<string, unknown> = { status };
  if (status === "sent") patch.sent_at = new Date().toISOString();
  if (status === "approved" || status === "rejected") patch.responded_at = new Date().toISOString();

  await supabase.from("quotes").update(patch).eq("id", quoteId);

  if (status === "approved") {
    await supabase.from("enquiries").update({ status: "approved" }).eq("id", enquiryId);
  }
  if (status === "rejected") {
    await supabase.from("enquiries").update({ status: "rejected" }).eq("id", enquiryId);
  }

  revalidatePath(`/manager/enquiries/${enquiryId}`);
}

export async function convertEnquiryToJob(enquiryId: string, formData: FormData) {
  const ctx = await requireOrgContext(["manager"]);
  const supabase = await createClient();

  const { data: enquiry } = await supabase
    .from("enquiries")
    .select("id, org_id, customer_id, job_type")
    .eq("id", enquiryId)
    .single();
  if (!enquiry) return;

  const quoteId = String(formData.get("quote_id") || "") || null;
  const jobType = getJobType(ctx.template.config, enquiry.job_type);
  if (!jobType) return;

  const stage = firstStageKey(jobType);

  const customFields: Record<string, string | number | boolean> = {};
  for (const field of jobType.customFields) {
    const raw = formData.get(`custom_${field.key}`);
    if (raw === null) continue;
    if (field.type === "boolean") {
      customFields[field.key] = raw === "on" || raw === "true";
    } else if (field.type === "number") {
      const n = Number(raw);
      if (!Number.isNaN(n) && String(raw).trim() !== "") customFields[field.key] = n;
    } else if (String(raw).trim() !== "") {
      customFields[field.key] = String(raw);
    }
  }

  const { count } = await supabase
    .from("jobs")
    .select("*", { count: "exact", head: true })
    .eq("org_id", ctx.organisation.id);
  const referenceNumber = generateJobReference(ctx.organisation.name, (count ?? 0) + 1);

  const dueDate = String(formData.get("due_date") || "") || null;
  const priority = String(formData.get("priority") || "normal");
  const valueRaw = String(formData.get("value") || "").trim();
  const value = valueRaw ? Number(valueRaw) : null;
  const ownerId = String(formData.get("owner_id") || "") || null;

  const { data: job, error } = await supabase
    .from("jobs")
    .insert({
      org_id: enquiry.org_id,
      customer_id: enquiry.customer_id,
      quote_id: quoteId,
      reference_number: referenceNumber,
      job_type: enquiry.job_type,
      description: null,
      stage,
      owner_id: ownerId,
      due_date: dueDate,
      priority,
      value,
      custom_fields: customFields,
    })
    .select("id")
    .single();

  if (error || !job) {
    redirect(`/manager/enquiries/${enquiryId}?error=${encodeURIComponent(error?.message ?? "Could not create job")}`);
  }

  await supabase.from("job_stage_history").insert({
    job_id: job.id,
    from_stage: null,
    to_stage: stage,
    changed_by: ctx.profile.id,
    note: `${ctx.template.config.labels.job} created from ${ctx.template.config.labels.enquiry.toLowerCase()}`,
  });

  const defaultTasks = jobType.defaultTasks[stage] ?? [];
  if (defaultTasks.length > 0) {
    await supabase.from("job_tasks").insert(
      defaultTasks.map((title) => ({ job_id: job.id, stage, title }))
    );
  }

  await supabase.from("enquiries").update({ status: "converted" }).eq("id", enquiryId);

  revalidatePath("/manager/jobs");
  redirect(`/manager/jobs/${job.id}`);
}
