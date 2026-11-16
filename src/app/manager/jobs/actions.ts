"use server";

import { revalidatePath } from "next/cache";
import { requireOrgContext } from "@/lib/org-context";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getJobType } from "@/lib/job-helpers";

export async function updateJobDetails(jobId: string, formData: FormData) {
  await requireOrgContext(["manager"]);
  const supabase = await createClient();

  const dueDate = String(formData.get("due_date") || "") || null;
  const priority = String(formData.get("priority") || "normal");
  const valueRaw = String(formData.get("value") || "").trim();
  const value = valueRaw ? Number(valueRaw) : null;
  const ownerId = String(formData.get("owner_id") || "") || null;
  const description = String(formData.get("description") || "").trim() || null;

  await supabase
    .from("jobs")
    .update({ due_date: dueDate, priority, value, owner_id: ownerId, description, updated_at: new Date().toISOString() })
    .eq("id", jobId);

  revalidatePath(`/manager/jobs/${jobId}`);
}

export async function updateCustomFields(jobId: string, formData: FormData) {
  const ctx = await requireOrgContext(["manager"]);
  const supabase = await createClient();

  const { data: job } = await supabase.from("jobs").select("job_type").eq("id", jobId).single();
  if (!job) return;

  const jobType = getJobType(ctx.template.config, job.job_type);
  if (!jobType) return;

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

  await supabase
    .from("jobs")
    .update({ custom_fields: customFields, updated_at: new Date().toISOString() })
    .eq("id", jobId);

  revalidatePath(`/manager/jobs/${jobId}`);
}

async function moveJobToStageInternal(jobId: string, newStage: string, note: string | null) {
  const ctx = await requireOrgContext(["manager", "worker"]);
  const supabase = await createClient();

  const { data: job } = await supabase.from("jobs").select("job_type, stage").eq("id", jobId).single();
  if (!job || job.stage === newStage) return;

  const jobType = getJobType(ctx.template.config, job.job_type);
  if (!jobType) return;

  await supabase
    .from("jobs")
    .update({ stage: newStage, updated_at: new Date().toISOString() })
    .eq("id", jobId);

  await supabase.from("job_stage_history").insert({
    job_id: jobId,
    from_stage: job.stage,
    to_stage: newStage,
    changed_by: ctx.profile.id,
    note,
  });

  const { count: existingTaskCount } = await supabase
    .from("job_tasks")
    .select("*", { count: "exact", head: true })
    .eq("job_id", jobId)
    .eq("stage", newStage);

  if (!existingTaskCount) {
    const defaultTasks = jobType.defaultTasks[newStage] ?? [];
    if (defaultTasks.length > 0) {
      await supabase.from("job_tasks").insert(
        defaultTasks.map((title) => ({ job_id: jobId, stage: newStage, title }))
      );
    }
  }

  revalidatePath(`/manager/jobs/${jobId}`);
  revalidatePath(`/manager/jobs`);
  revalidatePath(`/manager/jobs/board`);
  revalidatePath(`/worker/jobs/${jobId}`);
}

export async function changeStage(jobId: string, formData: FormData) {
  const newStage = String(formData.get("stage") || "");
  const note = String(formData.get("note") || "").trim() || null;
  if (!newStage) return;
  await moveJobToStageInternal(jobId, newStage, note);
}

// Used by the drag-and-drop job board (a Client Component calling this
// directly, rather than through a <form>).
export async function moveJobToStage(jobId: string, newStage: string) {
  await moveJobToStageInternal(jobId, newStage, null);
}

export async function addPart(jobId: string, formData: FormData) {
  await requireOrgContext(["manager", "worker"]);
  const supabase = await createClient();

  const description = String(formData.get("description") || "").trim();
  if (!description) return;
  const expectedDate = String(formData.get("expected_date") || "") || null;

  await supabase.from("parts_awaited").insert({ job_id: jobId, description, expected_date: expectedDate });

  revalidatePath(`/manager/jobs/${jobId}`);
  revalidatePath(`/worker/jobs/${jobId}`);
}

export async function markPartReceived(jobId: string, partId: string, received: boolean) {
  await requireOrgContext(["manager", "worker"]);
  const supabase = await createClient();

  await supabase.from("parts_awaited").update({ received }).eq("id", partId);

  revalidatePath(`/manager/jobs/${jobId}`);
  revalidatePath(`/worker/jobs/${jobId}`);
}

export async function toggleTask(jobId: string, taskId: string, isDone: boolean) {
  const ctx = await requireOrgContext(["manager", "worker"]);
  const supabase = await createClient();

  await supabase
    .from("job_tasks")
    .update({
      is_done: isDone,
      done_by: isDone ? ctx.profile.id : null,
      done_at: isDone ? new Date().toISOString() : null,
    })
    .eq("id", taskId);

  revalidatePath(`/manager/jobs/${jobId}`);
  revalidatePath(`/worker/jobs/${jobId}`);
}

export async function addNote(jobId: string, formData: FormData) {
  const ctx = await requireOrgContext(["manager", "worker"]);
  const supabase = await createClient();

  const body = String(formData.get("body") || "").trim();
  if (!body) return;
  const visibleToCustomer = formData.get("visible_to_customer") === "on";

  await supabase.from("job_notes").insert({
    job_id: jobId,
    author_id: ctx.profile.id,
    body,
    visible_to_customer: visibleToCustomer,
  });

  revalidatePath(`/manager/jobs/${jobId}`);
  revalidatePath(`/worker/jobs/${jobId}`);
}

export async function addPhoto(jobId: string, formData: FormData) {
  const ctx = await requireOrgContext(["manager", "worker"]);
  const supabase = await createClient();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return;

  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const path = `${jobId}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage.from("job-photos").upload(path, file, {
    contentType: file.type || "application/octet-stream",
  });

  if (uploadError) {
    revalidatePath(`/manager/jobs/${jobId}`);
    return;
  }

  const kind = file.type.startsWith("image/") ? "photo" : "document";

  await supabase.from("job_photos").insert({
    job_id: jobId,
    uploaded_by: ctx.profile.id,
    storage_path: path,
    file_name: file.name,
    kind,
  });

  revalidatePath(`/manager/jobs/${jobId}`);
  revalidatePath(`/worker/jobs/${jobId}`);
}

// Server-only: generates a short-lived signed URL for a private job photo.
// Uses the admin client because the viewer's own RLS-backed session client
// can't be reused here (this runs during render, outside a request context
// with the right cookies) — it's safe because the caller already proved
// (via RLS on job_photos) that they're allowed to see this row.
export async function getPhotoUrl(storagePath: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data, error } = await admin.storage.from("job-photos").createSignedUrl(storagePath, 60 * 10);
  if (error) return null;
  return data.signedUrl;
}

// A quick one-tap way for a worker to surface a problem: bumps priority to
// urgent and drops a flagged note, so it shows up on the manager's dashboard
// and timeline immediately without a separate "problems" table.
export async function flagProblem(jobId: string, formData: FormData) {
  const ctx = await requireOrgContext(["manager", "worker"]);
  const supabase = await createClient();

  const description = String(formData.get("description") || "").trim();
  if (!description) return;

  await supabase
    .from("jobs")
    .update({ priority: "urgent", updated_at: new Date().toISOString() })
    .eq("id", jobId);

  await supabase.from("job_notes").insert({
    job_id: jobId,
    author_id: ctx.profile.id,
    body: `⚠️ Problem flagged: ${description}`,
    visible_to_customer: false,
  });

  revalidatePath(`/manager/jobs/${jobId}`);
  revalidatePath(`/worker/jobs/${jobId}`);
}
