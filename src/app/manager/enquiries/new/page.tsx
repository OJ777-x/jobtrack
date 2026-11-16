import { requireOrgContext } from "@/lib/org-context";
import { createClient } from "@/lib/supabase/server";
import { createEnquiry } from "../actions";

export default async function NewEnquiryPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const ctx = await requireOrgContext(["manager"]);
  const { labels, jobTypes } = ctx.template.config;
  const { error } = await searchParams;
  const supabase = await createClient();

  const { data: customers } = await supabase
    .from("customers")
    .select("id, name")
    .eq("org_id", ctx.organisation.id)
    .order("name");

  return (
    <main className="mx-auto max-w-lg space-y-6 px-6 py-8">
      <h1 className="text-xl font-semibold text-slate-900">New {labels.enquiry.toLowerCase()}</h1>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {!customers || customers.length === 0 ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          You need at least one {labels.customer.toLowerCase()} first — add one, then come back here.
        </p>
      ) : (
        <form action={createEnquiry} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
          <div>
            <label className="block text-xs font-medium text-slate-600">{labels.customer}</label>
            <select name="customer_id" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600">{labels.job} type</label>
            <select name="job_type" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
              {jobTypes.map((jt) => (
                <option key={jt.key} value={jt.key}>
                  {jt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600">Description</label>
            <textarea
              name="description"
              rows={3}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Save {labels.enquiry.toLowerCase()}
          </button>
        </form>
      )}
    </main>
  );
}
