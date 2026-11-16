import Link from "next/link";
import { requireOrgContext } from "@/lib/org-context";
import { createClient } from "@/lib/supabase/server";
import { jobTypeLabel, stageLabel } from "@/lib/job-helpers";

const PRIORITY_STYLES: Record<string, string> = {
  low: "bg-slate-100 text-slate-600",
  normal: "bg-slate-100 text-slate-700",
  high: "bg-amber-100 text-amber-800",
  urgent: "bg-red-100 text-red-700",
};

export default async function JobsPage() {
  const ctx = await requireOrgContext(["manager"]);
  const { labels, config } = { labels: ctx.template.config.labels, config: ctx.template.config };
  const supabase = await createClient();

  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, reference_number, job_type, stage, due_date, priority, customers(name), profiles(display_name)")
    .eq("org_id", ctx.organisation.id)
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">{labels.jobs}</h1>
        <p className="text-xs text-slate-400">
          New {labels.jobs.toLowerCase()} are created by converting an approved {labels.quote.toLowerCase()} on the {labels.enquiries} page.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {!jobs || jobs.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">
            No {labels.jobs.toLowerCase()} yet. Create an {labels.enquiry.toLowerCase()}, approve a{" "}
            {labels.quote.toLowerCase()}, then convert it here.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-medium uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Reference</th>
                <th className="px-4 py-2">{labels.customer}</th>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2">Stage</th>
                <th className="px-4 py-2">Due</th>
                <th className="px-4 py-2">Priority</th>
                <th className="px-4 py-2">Owner</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {jobs.map((j) => (
                <tr key={j.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/manager/jobs/${j.id}`} className="font-medium text-blue-700 hover:underline">
                      {j.reference_number}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {(j.customers as unknown as { name: string } | null)?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{jobTypeLabel(config, j.job_type)}</td>
                  <td className="px-4 py-3 text-slate-600">{stageLabel(config, j.job_type, j.stage)}</td>
                  <td className="px-4 py-3 text-slate-600">{j.due_date ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_STYLES[j.priority] ?? ""}`}>
                      {j.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {(j.profiles as unknown as { display_name: string } | null)?.display_name ?? "Unassigned"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
