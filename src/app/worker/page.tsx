import { requireOrgContext } from "@/lib/org-context";
import { AppHeader } from "@/components/AppHeader";

export default async function WorkerDashboard() {
  const ctx = await requireOrgContext(["worker"]);
  const { labels } = ctx.template.config;

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader ctx={ctx} roleLabel={labels.worker} />
      <main className="mx-auto max-w-lg space-y-4 px-4 py-6">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">
            Hi {ctx.profile.displayName}
          </h1>
          <p className="text-sm text-slate-500">
            Your {labels.job.toLowerCase()}s will appear here — built in Phase 4 (worker mobile view).
          </p>
        </div>

        <section className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
          This is the mobile-first screen {labels.workers.toLowerCase()} will use on the shop
          floor or on site: their assigned {labels.jobs.toLowerCase()}, tasks to tick off, and a
          way to add notes and photos.
        </section>
      </main>
    </div>
  );
}
