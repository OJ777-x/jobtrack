import Link from "next/link";
import { requireOrgContext } from "@/lib/org-context";
import { createClient } from "@/lib/supabase/server";
import { JobBoardClient } from "@/components/JobBoardClient";

export default async function JobBoardPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const ctx = await requireOrgContext(["manager"]);
  const { labels, jobTypes } = ctx.template.config;
  const { type } = await searchParams;
  const activeType = jobTypes.find((jt) => jt.key === type) ?? jobTypes[0];

  const supabase = await createClient();
  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, reference_number, stage, priority, due_date, customers(name)")
    .eq("org_id", ctx.organisation.id)
    .eq("job_type", activeType.key);

  const boardJobs = (jobs ?? []).map((j) => ({
    id: j.id,
    referenceNumber: j.reference_number,
    customerName: (j.customers as unknown as { name: string } | null)?.name ?? "—",
    stage: j.stage,
    priority: j.priority,
    dueDate: j.due_date,
  }));

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">{labels.job} board</h1>
        <Link href="/manager/jobs" className="text-sm text-blue-700 hover:underline">
          Switch to list view
        </Link>
      </div>

      <div className="flex gap-2">
        {jobTypes.map((jt) => (
          <Link
            key={jt.key}
            href={`/manager/jobs/board?type=${jt.key}`}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              jt.key === activeType.key ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {jt.label}
          </Link>
        ))}
      </div>

      <p className="text-xs text-slate-400">Drag a card to a new column to move it through the stages.</p>

      <JobBoardClient stages={activeType.stages} jobs={boardJobs} />
    </main>
  );
}
