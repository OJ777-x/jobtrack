import { requireOrgContext } from "@/lib/org-context";
import { createClient } from "@/lib/supabase/server";

export default async function ManagerDashboard() {
  const ctx = await requireOrgContext(["manager"]);
  const { labels, jobTypes } = ctx.template.config;

  const supabase = await createClient();
  const { count: customerCount } = await supabase
    .from("customers")
    .select("*", { count: "exact", head: true })
    .eq("org_id", ctx.organisation.id);
  const { count: openJobCount } = await supabase
    .from("jobs")
    .select("*", { count: "exact", head: true })
    .eq("org_id", ctx.organisation.id);
  const { count: openEnquiryCount } = await supabase
    .from("enquiries")
    .select("*", { count: "exact", head: true })
    .eq("org_id", ctx.organisation.id)
    .in("status", ["new", "quoted"]);

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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label={`Active ${labels.customers.toLowerCase()}`} value={customerCount ?? 0} />
        <StatCard label={`Open ${labels.jobs.toLowerCase()}`} value={openJobCount ?? 0} />
        <StatCard label={`Open ${labels.enquiries.toLowerCase()}`} value={openEnquiryCount ?? 0} />
      </div>

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

      <section className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
        The job board, scheduling calendar, parts-awaited tracking and late-job metrics arrive in
        Phase 3. Use the {labels.customers}, {labels.enquiries} and {labels.jobs} tabs above to try
        the full flow: add a customer, raise an enquiry, send a quote, and convert it into a{" "}
        {labels.job.toLowerCase()}.
      </section>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}
