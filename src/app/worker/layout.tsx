import { requireOrgContext } from "@/lib/org-context";
import { AppHeader } from "@/components/AppHeader";

export default async function WorkerLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireOrgContext(["worker"]);
  const { labels } = ctx.template.config;

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader ctx={ctx} roleLabel={labels.worker} />
      {children}
    </div>
  );
}
