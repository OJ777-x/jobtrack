import Link from "next/link";
import { requireOrgContext } from "@/lib/org-context";
import { createClient } from "@/lib/supabase/server";
import { isTerminalStage, getJobType, jobTypeLabel, stageLabel } from "@/lib/job-helpers";

const PRIORITY_STYLES: Record<string, string> = {
  low: "border-slate-200",
  normal: "border-slate-200",
  high: "border-amber-300",
  urgent: "border-red-400",
};

export default async function WorkerDashboard() {
  const ctx = await requireOrgContext(["worker"]);
  const { labels, config } = { labels: ctx.template.config.labels, config: ctx.template.config };
  const supabase = await createClient();

  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, reference_number, job_type, stage, due_date, priority, customers(name)")
    .eq("org_id", ctx.organisation.id)
    .eq("owner_id", ctx.profile.id)
    .order("due_date", { ascending: true, nullsFirst: false });

  const openJobs = (jobs ?? []).filter((j) => {
    const jt = getJobType(config, j.job_type);
    return jt && !isTerminalStage(jt, j.stage);
  });

  return (
    <main className="mx-auto max-w-lg space-y-4 px-4 py-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">
          Hi {ctx.profile.displayName}
        </h1>
        <p className="text-sm text-slate-500">
          Your {labels.jobs.toLowerCase()} — {openJobs.length} open
        </p>
      </div>

      {openJobs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
          No {labels.jobs.toLowerCase()} assigned to you right now.
        </div>
      ) : (
        <div className="space-y-3">
          {openJobs.map((j) => (
            <Link
              key={j.id}
              href={`/worker/jobs/${j.id}`}
              className={`block rounded-xl border-2 bg-white p-4 shadow-sm ${PRIORITY_STYLES[j.priority] ?? "border-slate-200"}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900">{j.reference_number}</span>
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                  {stageLabel(config, j.job_type, j.stage)}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-600">
                {(j.customers as unknown as { name: string } | null)?.name ?? "—"}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {jobTypeLabel(config, j.job_type)}
                {j.due_date ? ` · Due ${j.due_date}` : ""}
                {j.priority === "urgent" ? " · URGENT" : ""}
              </p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
