import Link from "next/link";
import { requireOrgContext } from "@/lib/org-context";
import { createClient } from "@/lib/supabase/server";
import { jobTypeLabel } from "@/lib/job-helpers";

const STATUS_STYLES: Record<string, string> = {
  new: "bg-slate-100 text-slate-700",
  quoted: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-700",
  converted: "bg-blue-100 text-blue-700",
};

export default async function EnquiriesPage() {
  const ctx = await requireOrgContext(["manager"]);
  const { labels, config } = { labels: ctx.template.config.labels, config: ctx.template.config };
  const supabase = await createClient();

  const { data: enquiries } = await supabase
    .from("enquiries")
    .select("id, job_type, status, created_at, customers(name)")
    .eq("org_id", ctx.organisation.id)
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">{labels.enquiries}</h1>
        <Link
          href="/manager/enquiries/new"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          New {labels.enquiry.toLowerCase()}
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {!enquiries || enquiries.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">
            No {labels.enquiries.toLowerCase()} yet.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-medium uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">{labels.customer}</th>
                <th className="px-4 py-2">{labels.job} type</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {enquiries.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/manager/enquiries/${e.id}`} className="font-medium text-blue-700 hover:underline">
                      {(e.customers as unknown as { name: string } | null)?.name ?? "—"}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{jobTypeLabel(config, e.job_type)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[e.status] ?? ""}`}>
                      {e.status}
                    </span>
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
