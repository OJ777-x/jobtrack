import Link from "next/link";
import { requireOrgContext } from "@/lib/org-context";
import { createClient } from "@/lib/supabase/server";
import { getJobType, isTerminalStage, stageLabel } from "@/lib/job-helpers";
import { daysFromNowKey, isOlderThanDays, todayKey as getTodayKey } from "@/lib/time";

const STUCK_THRESHOLD_DAYS = 5;

export default async function ManagerDashboard() {
  const ctx = await requireOrgContext(["manager"]);
  const config = ctx.template.config;
  const { labels, jobTypes } = config;
  const supabase = await createClient();

  const { count: customerCount } = await supabase
    .from("customers")
    .select("*", { count: "exact", head: true })
    .eq("org_id", ctx.organisation.id);
  const { count: openEnquiryCount } = await supabase
    .from("enquiries")
    .select("*", { count: "exact", head: true })
    .eq("org_id", ctx.organisation.id)
    .in("status", ["new", "quoted"]);

  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, job_type, stage, due_date, value")
    .eq("org_id", ctx.organisation.id);

  const jobIds = (jobs ?? []).map((j) => j.id);
  const { data: history } = jobIds.length
    ? await supabase
        .from("job_stage_history")
        .select("job_id, to_stage, changed_at")
        .in("job_id", jobIds)
        .order("changed_at", { ascending: false })
    : { data: [] };

  const lastStageChangeByJob = new Map<string, string>();
  for (const h of history ?? []) {
    if (!lastStageChangeByJob.has(h.job_id)) lastStageChangeByJob.set(h.job_id, h.changed_at);
  }

  const todayKey = getTodayKey();
  const weekAheadKey = daysFromNowKey(7);

  let dueThisWeek = 0;
  let lateJobs = 0;
  let stuckJobs = 0;
  let openJobCount = 0;
  let valueOfOpenWork = 0;
  let completedCount = 0;
  let completedOnTimeCount = 0;
  const wipByType = new Map<string, Map<string, number>>();

  for (const job of jobs ?? []) {
    const jobType = getJobType(config, job.job_type);
    if (!jobType) continue;
    const terminal = isTerminalStage(jobType, job.stage);

    if (!terminal) {
      openJobCount++;
      valueOfOpenWork += Number(job.value ?? 0);

      if (job.due_date) {
        if (job.due_date < todayKey) lateJobs++;
        else if (job.due_date <= weekAheadKey) dueThisWeek++;
      }

      const lastChange = lastStageChangeByJob.get(job.id);
      if (lastChange && isOlderThanDays(lastChange, STUCK_THRESHOLD_DAYS)) {
        stuckJobs++;
      }

      const byStage = wipByType.get(jobType.label) ?? new Map<string, number>();
      byStage.set(job.stage, (byStage.get(job.stage) ?? 0) + 1);
      wipByType.set(jobType.label, byStage);
    } else {
      completedCount++;
      const completedAt = lastStageChangeByJob.get(job.id);
      if (!job.due_date || (completedAt && completedAt.slice(0, 10) <= job.due_date)) {
        completedOnTimeCount++;
      }
    }
  }

  const onTimeRate = completedCount > 0 ? Math.round((completedOnTimeCount / completedCount) * 100) : null;

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-6 py-8">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">
          Welcome back, {ctx.profile.displayName}
        </h1>
        <p className="text-sm text-slate-500">
          {labels.manager} dashboard — {ctx.organisation.name}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label={`Open ${labels.jobs.toLowerCase()}`} value={openJobCount} />
        <StatCard label="Due this week" value={dueThisWeek} />
        <StatCard label="Late" value={lateJobs} tone={lateJobs > 0 ? "warn" : undefined} />
        <StatCard label={`Stuck > ${STUCK_THRESHOLD_DAYS}d`} value={stuckJobs} tone={stuckJobs > 0 ? "warn" : undefined} />
        <StatCard label="Value of open work" value={`£${valueOfOpenWork.toLocaleString("en-GB", { maximumFractionDigits: 0 })}`} />
        <StatCard label="On-time completion" value={onTimeRate != null ? `${onTimeRate}%` : "—"} />
        <StatCard label={`Active ${labels.customers.toLowerCase()}`} value={customerCount ?? 0} />
        <StatCard label={`Open ${labels.enquiries.toLowerCase()}`} value={openEnquiryCount ?? 0} />
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-slate-900">Work in progress by stage</h2>
        {wipByType.size === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No open {labels.jobs.toLowerCase()} right now.</p>
        ) : (
          <div className="mt-3 space-y-4">
            {Array.from(wipByType.entries()).map(([typeLabel, byStage]) => (
              <div key={typeLabel}>
                <p className="text-xs font-medium text-slate-600">{typeLabel}</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {Array.from(byStage.entries()).map(([stageKey, n]) => {
                    const jt = jobTypes.find((j) => j.label === typeLabel);
                    return (
                      <span key={stageKey} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">
                        {jt ? stageLabel(config, jt.key, stageKey) : stageKey}: <strong>{n}</strong>
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-slate-900">
          {labels.job} types for this template
        </h2>
        <p className="mb-4 text-xs text-slate-500">
          This whole list comes from the active industry template — nothing here is hard-coded.
        </p>
        <div className="space-y-4">
          {jobTypes.map((jt) => (
            <div key={jt.key} className="rounded-lg border border-slate-100 p-4">
              <p className="text-sm font-medium text-slate-800">{jt.label}</p>
              <p className="mt-1 text-xs text-slate-500">
                Stages: {jt.stages.map((s) => s.label).join(" → ")}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-wrap gap-3 rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
        <Link href="/manager/jobs/board" className="text-blue-700 hover:underline">
          {labels.job} board
        </Link>
        ·
        <Link href="/manager/calendar" className="text-blue-700 hover:underline">
          Schedule
        </Link>
        ·
        <Link href="/manager/customers" className="text-blue-700 hover:underline">
          {labels.customers}
        </Link>
        ·
        <Link href="/manager/enquiries" className="text-blue-700 hover:underline">
          {labels.enquiries}
        </Link>
      </section>
    </main>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone?: "warn";
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${tone === "warn" ? "text-amber-600" : "text-slate-900"}`}>{value}</p>
    </div>
  );
}
