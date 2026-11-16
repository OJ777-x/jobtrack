import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOrgContext } from "@/lib/org-context";
import { createClient } from "@/lib/supabase/server";
import { getJobType, jobTypeLabel, stageLabel } from "@/lib/job-helpers";
import {
  changeStage,
  toggleTask,
  addNote,
  addPhoto,
  getPhotoUrl,
  flagProblem,
} from "@/app/manager/jobs/actions";

export default async function WorkerJobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireOrgContext(["worker"]);
  const config = ctx.template.config;
  const { labels } = config;
  const supabase = await createClient();

  const { data: job } = await supabase
    .from("jobs")
    .select("id, reference_number, job_type, description, stage, due_date, priority, customers(id, name)")
    .eq("org_id", ctx.organisation.id)
    .eq("owner_id", ctx.profile.id)
    .eq("id", id)
    .single();

  if (!job) notFound();

  const jobType = getJobType(config, job.job_type);
  const customer = job.customers as unknown as { id: string; name: string } | null;
  const currentIndex = jobType ? jobType.stages.findIndex((s) => s.key === job.stage) : -1;
  const nextStage = jobType && currentIndex >= 0 ? jobType.stages[currentIndex + 1] : undefined;

  const [{ data: tasks }, { data: notes }, { data: photos }] = await Promise.all([
    supabase.from("job_tasks").select("id, title, is_done, stage").eq("job_id", id).eq("stage", job.stage).order("created_at"),
    supabase
      .from("job_notes")
      .select("id, body, created_at, profiles(display_name)")
      .eq("job_id", id)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase.from("job_photos").select("id, file_name, kind, storage_path").eq("job_id", id).order("created_at", { ascending: false }),
  ]);

  const photosWithUrls = await Promise.all(
    (photos ?? []).map(async (p) => ({ ...p, url: await getPhotoUrl(p.storage_path) }))
  );

  const advanceStageAction = changeStage.bind(null, id);
  const toggleTaskFor = (taskId: string, isDone: boolean) => toggleTask.bind(null, id, taskId, isDone);
  const addNoteWithId = addNote.bind(null, id);
  const addPhotoWithId = addPhoto.bind(null, id);
  const flagProblemWithId = flagProblem.bind(null, id);

  return (
    <main className="mx-auto max-w-lg space-y-4 px-4 py-6">
      <Link href="/worker" className="text-sm text-blue-700 hover:underline">
        ← My {labels.jobs.toLowerCase()}
      </Link>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-slate-900">{job.reference_number}</h1>
          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
            {stageLabel(config, job.job_type, job.stage)}
          </span>
        </div>
        <p className="text-sm text-slate-500">
          {jobTypeLabel(config, job.job_type)} · {customer?.name ?? "—"}
        </p>
        {job.description && <p className="mt-2 text-sm text-slate-600">{job.description}</p>}
        {job.due_date && <p className="mt-1 text-xs text-slate-400">Due {job.due_date}</p>}
      </div>

      {nextStage && (
        <form action={advanceStageAction}>
          <input type="hidden" name="stage" value={nextStage.key} />
          <button
            type="submit"
            className="w-full rounded-xl bg-blue-600 px-4 py-4 text-base font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            Mark &ldquo;{stageLabel(config, job.job_type, job.stage)}&rdquo; done → move to &ldquo;{nextStage.label}&rdquo;
          </button>
        </form>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-900">Tasks</h2>
        {!tasks || tasks.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No tasks for this stage.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {tasks.map((t) => (
              <li key={t.id}>
                <form action={toggleTaskFor(t.id, !t.is_done)}>
                  <button
                    type="submit"
                    className={`flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left text-sm ${
                      t.is_done ? "border-slate-100 bg-slate-50 text-slate-400 line-through" : "border-slate-200 text-slate-800"
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border ${
                        t.is_done ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300"
                      }`}
                    >
                      {t.is_done ? "✓" : ""}
                    </span>
                    {t.title}
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-red-200 bg-red-50 p-4">
        <h2 className="text-sm font-semibold text-red-800">Flag a problem</h2>
        <p className="mb-2 text-xs text-red-700">
          This marks the {labels.job.toLowerCase()} urgent and notifies the {labels.manager.toLowerCase()}.
        </p>
        <form action={flagProblemWithId} className="flex gap-2">
          <input
            name="description"
            placeholder="What's wrong?"
            className="flex-1 rounded-md border border-red-300 px-3 py-2 text-sm"
          />
          <button type="submit" className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700">
            Flag
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-900">Photos</h2>
        <form action={addPhotoWithId} className="mt-2 flex items-center gap-2">
          <input type="file" name="file" accept="image/*" capture="environment" required className="flex-1 text-sm" />
          <button type="submit" className="rounded-md bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-700">
            Upload
          </button>
        </form>
        {photosWithUrls.length > 0 && (
          <div className="mt-3 grid grid-cols-3 gap-2">
            {photosWithUrls.map((p) =>
              p.url ? (
                <a key={p.id} href={p.url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg border border-slate-200">
                  {/* eslint-disable-next-line @next/next/no-img-element -- signed URL, not worth next/image setup for a demo */}
                  <img src={p.url} alt={p.file_name} className="h-20 w-full object-cover" />
                </a>
              ) : null
            )}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-900">Notes</h2>
        <form action={addNoteWithId} className="mt-2 space-y-2">
          <textarea
            name="body"
            rows={2}
            placeholder="Add a note..."
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <button type="submit" className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700">
            Add note
          </button>
        </form>
        <ul className="mt-3 space-y-2">
          {notes?.map((n) => (
            <li key={n.id} className="rounded-md border border-slate-100 p-2 text-sm">
              <p className="text-slate-700">{n.body}</p>
              <p className="mt-1 text-xs text-slate-400">
                {(n.profiles as unknown as { display_name: string } | null)?.display_name ?? "Unknown"} ·{" "}
                {new Date(n.created_at).toLocaleString("en-GB")}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <details className="rounded-xl border border-slate-200 bg-white p-4">
        <summary className="cursor-pointer text-sm font-medium text-slate-700">Jump to a different stage</summary>
        {jobType && (
          <form action={advanceStageAction} className="mt-3 flex gap-2">
            <select name="stage" defaultValue={job.stage} className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm">
              {jobType.stages.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
            <button type="submit" className="rounded-md bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-700">
              Go
            </button>
          </form>
        )}
      </details>
    </main>
  );
}
