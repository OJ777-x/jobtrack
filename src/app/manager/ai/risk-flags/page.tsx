import Link from "next/link";
import { requireOrgContext } from "@/lib/org-context";
import { computeRiskFlags } from "@/lib/ai/risk";
import { loadRiskJobs, runAndLogRiskScan } from "./actions";

export default async function RiskFlagsPage() {
  const ctx = await requireOrgContext(["manager"]);
  const { labels } = ctx.template.config;

  const { jobs } = await loadRiskJobs();
  const flags = computeRiskFlags(ctx.template.config, jobs);

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Risk flags</h1>
          <p className="text-sm text-slate-500">
            {labels.jobs} likely to be late — stuck in a stage, parts overdue, or due date close.
          </p>
        </div>
        <form action={runAndLogRiskScan}>
          <button type="submit" className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700">
            Run &amp; log scan
          </button>
        </form>
      </div>

      {flags.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
          Nothing flagged — no {labels.jobs.toLowerCase()} look at risk right now.
        </div>
      ) : (
        <div className="space-y-3">
          {flags.map((f) => (
            <div key={f.jobId} className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-center justify-between">
                <Link href={`/manager/jobs/${f.jobId}`} className="font-semibold text-slate-900 hover:underline">
                  {f.referenceNumber}
                </Link>
                <span className="text-xs text-slate-500">{f.customerName}</span>
              </div>
              <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
                {f.reasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
              <p className="mt-2 text-sm font-medium text-amber-800">Suggested: {f.suggestedAction}</p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
