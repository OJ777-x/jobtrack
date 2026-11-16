import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOrgContext } from "@/lib/org-context";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
import { getJobType, jobTypeLabel } from "@/lib/job-helpers";

export default async function PortalJobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireOrgContext(["customer"]);
  const config = ctx.template.config;
  const { labels } = config;
  const supabase = await createClient();

  const { data: job } = await supabase
    .from("jobs")
    .select("id, reference_number, job_type, description, stage, due_date")
    .eq("customer_id", ctx.profile.customerId ?? "")
    .eq("id", id)
    .single();

  if (!job) notFound();

  const jobType = getJobType(config, job.job_type);
  const currentIndex = jobType ? jobType.stages.findIndex((s) => s.key === job.stage) : -1;

  const { data: notes } = await supabase
    .from("job_notes")
    .select("id, body, created_at")
    .eq("job_id", id)
    .eq("visible_to_customer", true)
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader ctx={ctx} roleLabel={labels.customer} />
      <main className="mx-auto max-w-2xl space-y-6 px-6 py-8">
        <div>
          <Link href="/portal" className="text-sm text-blue-700 hover:underline">
            ← Your {labels.jobs.toLowerCase()}
          </Link>
          <h1 className="mt-1 text-lg font-semibold text-slate-900">{job.reference_number}</h1>
          <p className="text-sm text-slate-500">{jobTypeLabel(config, job.job_type)}</p>
          {job.description && <p className="mt-2 text-sm text-slate-600">{job.description}</p>}
          {job.due_date && <p className="mt-1 text-xs text-slate-400">Expected completion: {job.due_date}</p>}
        </div>

        {jobType && (
          <section className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="mb-4 text-sm font-semibold text-slate-900">Progress</h2>
            <ol className="space-y-3">
              {jobType.stages.map((s, i) => {
                const done = i < currentIndex;
                const current = i === currentIndex;
                return (
                  <li key={s.key} className="flex items-center gap-3">
                    <span
                      className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                        done
                          ? "bg-emerald-500 text-white"
                          : current
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {done ? "✓" : i + 1}
                    </span>
                    <span className={`text-sm ${current ? "font-semibold text-slate-900" : done ? "text-slate-500" : "text-slate-400"}`}>
                      {s.label}
                      {current ? " (current)" : ""}
                    </span>
                  </li>
                );
              })}
            </ol>
          </section>
        )}

        {notes && notes.length > 0 && (
          <section className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">Updates on this {labels.job.toLowerCase()}</h2>
            <ul className="space-y-3">
              {notes.map((n) => (
                <li key={n.id} className="rounded-md border border-slate-100 p-3 text-sm">
                  <p className="text-slate-700">{n.body}</p>
                  <p className="mt-1 text-xs text-slate-400">{new Date(n.created_at).toLocaleDateString("en-GB")}</p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
