import { requireOrgContext } from "@/lib/org-context";
import { createClient } from "@/lib/supabase/server";
import { getJobType, isTerminalStage } from "@/lib/job-helpers";
import { PasteInClient } from "@/components/PasteInClient";

export default async function PasteInPage() {
  const ctx = await requireOrgContext(["manager"]);
  const { labels } = ctx.template.config;
  const supabase = await createClient();

  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, reference_number, job_type, stage, customers(name)")
    .eq("org_id", ctx.organisation.id);

  const candidates = (jobs ?? [])
    .filter((j) => {
      const jt = getJobType(ctx.template.config, j.job_type);
      return jt && !isTerminalStage(jt, j.stage);
    })
    .map((j) => ({
      id: j.id,
      referenceNumber: j.reference_number,
      jobType: j.job_type,
      customerName: (j.customers as unknown as { name: string } | null)?.name ?? "—",
    }));

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-6 py-8">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Paste-in updates</h1>
        <p className="text-sm text-slate-500">
          Paste an email or rough notes — it works out which {labels.job.toLowerCase()} it relates to and
          proposes a note (and a stage change, only if it&apos;s unambiguous). Nothing saves until you confirm.
        </p>
      </div>

      <PasteInClient config={ctx.template.config} candidates={candidates} />
    </main>
  );
}
