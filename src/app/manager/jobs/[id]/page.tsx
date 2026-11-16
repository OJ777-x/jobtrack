import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOrgContext } from "@/lib/org-context";
import { createClient } from "@/lib/supabase/server";
import { getJobType, jobTypeLabel, stageLabel } from "@/lib/job-helpers";
import {
  updateJobDetails,
  updateCustomFields,
  changeStage,
  toggleTask,
  addNote,
  addPhoto,
  getPhotoUrl,
  addPart,
  markPartReceived,
} from "../actions";

type TimelineEvent = {
  at: string;
  kind: "stage" | "note" | "task" | "photo";
  text: string;
  by: string | null;
};

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireOrgContext(["manager"]);
  const config = ctx.template.config;
  const { labels } = config;
  const supabase = await createClient();

  const { data: job } = await supabase
    .from("jobs")
    .select(
      "id, reference_number, job_type, description, stage, due_date, priority, value, custom_fields, owner_id, customers(id, name)"
    )
    .eq("org_id", ctx.organisation.id)
    .eq("id", id)
    .single();

  if (!job) notFound();

  const jobType = getJobType(config, job.job_type);
  const customer = job.customers as unknown as { id: string; name: string } | null;

  const [{ data: staff }, { data: tasks }, { data: notes }, { data: photos }, { data: stageHistory }, { data: parts }] =
    await Promise.all([
      supabase.from("profiles").select("id, display_name").eq("org_id", ctx.organisation.id).in("role", ["manager", "worker"]),
      supabase.from("job_tasks").select("id, title, is_done, stage").eq("job_id", id).order("created_at"),
      supabase
        .from("job_notes")
        .select("id, body, visible_to_customer, created_at, profiles(display_name)")
        .eq("job_id", id)
        .order("created_at", { ascending: false }),
      supabase.from("job_photos").select("id, file_name, kind, storage_path, created_at").eq("job_id", id).order("created_at", { ascending: false }),
      supabase
        .from("job_stage_history")
        .select("id, from_stage, to_stage, note, changed_at, profiles(display_name)")
        .eq("job_id", id)
        .order("changed_at", { ascending: false }),
      supabase.from("parts_awaited").select("id, description, expected_date, received").eq("job_id", id).order("created_at"),
    ]);

  const currentStageTasks = tasks?.filter((t) => t.stage === job.stage) ?? [];

  const photosWithUrls = await Promise.all(
    (photos ?? []).map(async (p) => ({ ...p, url: await getPhotoUrl(p.storage_path) }))
  );

  const timeline: TimelineEvent[] = [
    ...(stageHistory ?? []).map((h) => ({
      at: h.changed_at,
      kind: "stage" as const,
      text: h.from_stage
        ? `Stage changed from "${stageLabel(config, job.job_type, h.from_stage)}" to "${stageLabel(config, job.job_type, h.to_stage)}"${h.note ? ` — ${h.note}` : ""}`
        : `${labels.job} created at stage "${stageLabel(config, job.job_type, h.to_stage)}"`,
      by: (h.profiles as unknown as { display_name: string } | null)?.display_name ?? null,
    })),
    ...(notes ?? []).map((n) => ({
      at: n.created_at,
      kind: "note" as const,
      text: `Note: ${n.body}`,
      by: (n.profiles as unknown as { display_name: string } | null)?.display_name ?? null,
    })),
  ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  const updateJobDetailsWithId = updateJobDetails.bind(null, id);
  const updateCustomFieldsWithId = updateCustomFields.bind(null, id);
  const changeStageWithId = changeStage.bind(null, id);
  const addNoteWithId = addNote.bind(null, id);
  const addPhotoWithId = addPhoto.bind(null, id);
  const addPartWithId = addPart.bind(null, id);

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-6 py-8">
      <div>
        <Link href="/manager/jobs" className="text-sm text-blue-700 hover:underline">
          ← {labels.jobs}
        </Link>
        <div className="mt-1 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-slate-900">{job.reference_number}</h1>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
            {stageLabel(config, job.job_type, job.stage)}
          </span>
        </div>
        <p className="text-sm text-slate-500">
          {jobTypeLabel(config, job.job_type)} ·{" "}
          {customer ? (
            <Link href={`/manager/customers/${customer.id}`} className="text-blue-700 hover:underline">
              {customer.name}
            </Link>
          ) : (
            "—"
          )}
        </p>
      </div>

      {/* Stage control */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-slate-900">Move to a new stage</h2>
        {jobType && (
          <form action={changeStageWithId} className="mt-3 flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600">New stage</label>
              <select
                name="stage"
                defaultValue={job.stage}
                className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
              >
                {jobType.stages.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-600">Note (optional)</label>
              <input
                name="note"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <button
              type="submit"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Update stage
            </button>
          </form>
        )}
      </section>

      {/* Details */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-slate-900">Details</h2>
        <form action={updateJobDetailsWithId} className="mt-3 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600">Description</label>
            <textarea
              name="description"
              rows={2}
              defaultValue={job.description ?? ""}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <label className="block text-xs font-medium text-slate-600">Due date</label>
              <input
                name="due_date"
                type="date"
                defaultValue={job.due_date ?? ""}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600">Priority</label>
              <select
                name="priority"
                defaultValue={job.priority}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600">Value (£)</label>
              <input
                name="value"
                type="number"
                step="0.01"
                defaultValue={job.value ?? ""}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600">Owner</label>
              <select
                name="owner_id"
                defaultValue={job.owner_id ?? ""}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">Unassigned</option>
                {staff?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.display_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button
            type="submit"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Save details
          </button>
        </form>
      </section>

      {/* Custom fields */}
      {jobType && jobType.customFields.length > 0 && (
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-slate-900">
            {jobTypeLabel(config, job.job_type)} details
          </h2>
          <p className="mb-3 text-xs text-slate-500">
            These fields come from the {jobTypeLabel(config, job.job_type)} job type in the active template.
          </p>
          <form action={updateCustomFieldsWithId} className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              {jobType.customFields.map((field) => {
                const value = (job.custom_fields as Record<string, unknown>)?.[field.key];
                return (
                  <div key={field.key}>
                    <label className="block text-xs font-medium text-slate-600">{field.label}</label>
                    {field.type === "select" ? (
                      <select
                        name={`custom_${field.key}`}
                        defaultValue={typeof value === "string" ? value : ""}
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                      >
                        <option value="">—</option>
                        {field.options?.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : field.type === "boolean" ? (
                      <input
                        type="checkbox"
                        name={`custom_${field.key}`}
                        defaultChecked={Boolean(value)}
                        className="mt-2"
                      />
                    ) : (
                      <input
                        name={`custom_${field.key}`}
                        type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
                        defaultValue={typeof value === "string" || typeof value === "number" ? value : ""}
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                      />
                    )}
                  </div>
                );
              })}
            </div>
            <button
              type="submit"
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
            >
              Save details
            </button>
          </form>
        </section>
      )}

      {/* Tasks */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-slate-900">
          Tasks for &ldquo;{stageLabel(config, job.job_type, job.stage)}&rdquo;
        </h2>
        {currentStageTasks.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No tasks for this stage.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {currentStageTasks.map((t) => (
              <li key={t.id} className="flex items-center justify-between rounded-md border border-slate-100 px-3 py-2 text-sm">
                <span className={t.is_done ? "text-slate-400 line-through" : "text-slate-700"}>{t.title}</span>
                <form action={toggleTask.bind(null, id, t.id, !t.is_done)}>
                  <button
                    type="submit"
                    className={`text-xs font-medium ${t.is_done ? "text-slate-500" : "text-blue-700"} hover:underline`}
                  >
                    {t.is_done ? "Undo" : "Mark done"}
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Parts awaited */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-slate-900">Parts/materials awaited</h2>
        {!parts || parts.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Nothing on order for this {labels.job.toLowerCase()}.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {parts.map((p) => (
              <li key={p.id} className="flex items-center justify-between rounded-md border border-slate-100 px-3 py-2 text-sm">
                <span className={p.received ? "text-slate-400 line-through" : "text-slate-700"}>
                  {p.description}
                  {p.expected_date ? ` — expected ${p.expected_date}` : ""}
                </span>
                <form action={markPartReceived.bind(null, id, p.id, !p.received)}>
                  <button
                    type="submit"
                    className={`text-xs font-medium ${p.received ? "text-slate-500" : "text-blue-700"} hover:underline`}
                  >
                    {p.received ? "Undo" : "Mark received"}
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
        <form action={addPartWithId} className="mt-4 flex items-end gap-2 border-t border-slate-100 pt-4">
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-600">Description</label>
            <input name="description" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600">Expected date</label>
            <input name="expected_date" type="date" className="mt-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm" />
          </div>
          <button type="submit" className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700">
            Add
          </button>
        </form>
      </section>

      {/* Notes */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-slate-900">Notes</h2>
        <form action={addNoteWithId} className="mt-3 space-y-2">
          <textarea
            name="body"
            rows={2}
            placeholder="Add a note..."
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs text-slate-600">
              <input type="checkbox" name="visible_to_customer" />
              Visible to {labels.customer.toLowerCase()} in their portal
            </label>
            <button type="submit" className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700">
              Add note
            </button>
          </div>
        </form>
        <ul className="mt-4 space-y-3">
          {notes?.map((n) => (
            <li key={n.id} className="rounded-md border border-slate-100 p-3 text-sm">
              <p className="text-slate-700">{n.body}</p>
              <p className="mt-1 text-xs text-slate-400">
                {(n.profiles as unknown as { display_name: string } | null)?.display_name ?? "Unknown"} ·{" "}
                {new Date(n.created_at).toLocaleString("en-GB")}
                {n.visible_to_customer ? " · visible to customer" : ""}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* Photos & documents */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-slate-900">Photos &amp; documents</h2>
        <form action={addPhotoWithId} className="mt-3 flex items-center gap-3">
          <input type="file" name="file" required className="text-sm" />
          <button type="submit" className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700">
            Upload
          </button>
        </form>
        {photosWithUrls.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No photos or documents yet.</p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {photosWithUrls.map((p) =>
              p.url ? (
                p.kind === "photo" ? (
                  <a key={p.id} href={p.url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg border border-slate-200">
                    {/* eslint-disable-next-line @next/next/no-img-element -- signed URL changes per request, not worth next/image's remote-pattern setup for a demo */}
                    <img src={p.url} alt={p.file_name} className="h-28 w-full object-cover" />
                  </a>
                ) : (
                  <a
                    key={p.id}
                    href={p.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-28 items-center justify-center rounded-lg border border-slate-200 p-2 text-center text-xs text-blue-700 hover:underline"
                  >
                    {p.file_name}
                  </a>
                )
              ) : (
                <div key={p.id} className="flex h-28 items-center justify-center rounded-lg border border-dashed border-slate-300 p-2 text-center text-xs text-slate-400">
                  {p.file_name}
                  <br />
                  (storage not set up yet)
                </div>
              )
            )}
          </div>
        )}
      </section>

      {/* Timeline */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-slate-900">Timeline</h2>
        <ul className="mt-3 space-y-3">
          {timeline.map((e, i) => (
            <li key={i} className="border-l-2 border-slate-200 pl-3 text-sm">
              <p className="text-slate-700">{e.text}</p>
              <p className="text-xs text-slate-400">
                {e.by ?? "System"} · {new Date(e.at).toLocaleString("en-GB")}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
