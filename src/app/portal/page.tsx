import { requireOrgContext } from "@/lib/org-context";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";

export default async function CustomerPortal() {
  const ctx = await requireOrgContext(["customer"]);
  const { labels } = ctx.template.config;

  const supabase = await createClient();
  const { data: customer } = ctx.profile.customerId
    ? await supabase.from("customers").select("name, email, phone").eq("id", ctx.profile.customerId).single()
    : { data: null };

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader ctx={ctx} roleLabel={labels.customer} />
      <main className="mx-auto max-w-2xl space-y-4 px-6 py-8">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">
            {customer?.name ?? ctx.profile.displayName}
          </h1>
          <p className="text-sm text-slate-500">
            Your {labels.job.toLowerCase()}s with {ctx.organisation.name} will show here — built
            in Phase 5 (customer portal).
          </p>
        </div>

        <section className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
          You&apos;ll only ever see your own {labels.jobs.toLowerCase()} here — this account is
          restricted at the database level to {customer?.name ?? "your"} records.
        </section>
      </main>
    </div>
  );
}
