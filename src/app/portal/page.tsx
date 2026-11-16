import Link from "next/link";
import { requireOrgContext } from "@/lib/org-context";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
import { jobTypeLabel, stageLabel } from "@/lib/job-helpers";

export default async function CustomerPortal() {
  const ctx = await requireOrgContext(["customer"]);
  const { labels, config } = { labels: ctx.template.config.labels, config: ctx.template.config };

  const supabase = await createClient();
  const { data: customer } = ctx.profile.customerId
    ? await supabase.from("customers").select("name, email, phone").eq("id", ctx.profile.customerId).single()
    : { data: null };

  const [{ data: jobs }, { data: updates }] = await Promise.all([
    supabase
      .from("jobs")
      .select("id, reference_number, job_type, stage, due_date")
      .eq("customer_id", ctx.profile.customerId ?? "")
      .order("created_at", { ascending: false }),
    supabase
      .from("customer_updates")
      .select("id, body, published_at")
      .eq("customer_id", ctx.profile.customerId ?? "")
      .eq("status", "published")
      .order("published_at", { ascending: false }),
  ]);

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader ctx={ctx} roleLabel={labels.customer} />
      <main className="mx-auto max-w-2xl space-y-6 px-6 py-8">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">{customer?.name ?? ctx.profile.displayName}</h1>
          <p className="text-sm text-slate-500">Your {labels.jobs.toLowerCase()} with {ctx.organisation.name}</p>
        </div>

        {updates && updates.length > 0 && (
          <section className="space-y-3">
            {updates.map((u) => (
              <div key={u.id} className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
                <p className="whitespace-pre-wrap">{u.body}</p>
                <p className="mt-2 text-xs text-blue-600">
                  {u.published_at ? new Date(u.published_at).toLocaleDateString("en-GB") : ""}
                </p>
              </div>
            ))}
          </section>
        )}

        <section className="space-y-3">
          {!jobs || jobs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
              No {labels.jobs.toLowerCase()} on file yet.
            </div>
          ) : (
            jobs.map((j) => (
              <Link
                key={j.id}
                href={`/portal/jobs/${j.id}`}
                className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-blue-300"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">{j.reference_number}</span>
                  <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                    {stageLabel(config, j.job_type, j.stage)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-500">{jobTypeLabel(config, j.job_type)}</p>
                {j.due_date && <p className="mt-1 text-xs text-slate-400">Expected completion: {j.due_date}</p>}
              </Link>
            ))
          )}
        </section>
      </main>
    </div>
  );
}
