import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOrgContext } from "@/lib/org-context";
import { createClient } from "@/lib/supabase/server";
import { getJobType, jobTypeLabel } from "@/lib/job-helpers";
import { createQuote, updateQuoteStatus, convertEnquiryToJob } from "../actions";

export default async function EnquiryDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const ctx = await requireOrgContext(["manager"]);
  const { labels, config } = { labels: ctx.template.config.labels, config: ctx.template.config };
  const supabase = await createClient();

  const { data: enquiry } = await supabase
    .from("enquiries")
    .select("id, job_type, description, status, customer_id, customers(name)")
    .eq("org_id", ctx.organisation.id)
    .eq("id", id)
    .single();

  if (!enquiry) notFound();

  const { data: quotes } = await supabase
    .from("quotes")
    .select("id, amount, status, customer_po_number, sent_at, responded_at")
    .eq("enquiry_id", id)
    .order("created_at", { ascending: false });

  const { data: staff } = await supabase
    .from("profiles")
    .select("id, display_name, role")
    .eq("org_id", ctx.organisation.id)
    .in("role", ["manager", "worker"]);

  const jobType = getJobType(config, enquiry.job_type);
  const approvedQuote = quotes?.find((q) => q.status === "approved");
  const customerName = (enquiry.customers as unknown as { name: string } | null)?.name ?? "—";

  const createQuoteWithId = createQuote.bind(null, id);
  const convertWithId = convertEnquiryToJob.bind(null, id);

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-6 py-8">
      <div>
        <Link href="/manager/enquiries" className="text-sm text-blue-700 hover:underline">
          ← {labels.enquiries}
        </Link>
        <h1 className="mt-1 text-xl font-semibold text-slate-900">
          {jobTypeLabel(config, enquiry.job_type)} — {customerName}
        </h1>
        <p className="text-sm text-slate-500">Status: {enquiry.status}</p>
        {enquiry.description && <p className="mt-2 text-sm text-slate-600">{enquiry.description}</p>}
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-slate-900">{labels.quote}s</h2>

        {quotes && quotes.length > 0 ? (
          <ul className="mt-3 space-y-3">
            {quotes.map((q) => (
              <li key={q.id} className="rounded-lg border border-slate-100 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-800">
                    {q.amount != null ? `£${Number(q.amount).toFixed(2)}` : "No amount set"}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                    {q.status}
                  </span>
                </div>
                {q.customer_po_number && (
                  <p className="mt-1 text-xs text-slate-500">PO number: {q.customer_po_number}</p>
                )}
                {q.status === "draft" && (
                  <form action={updateQuoteStatus.bind(null, id, q.id, "sent")} className="mt-2">
                    <button className="text-xs font-medium text-blue-700 hover:underline" type="submit">
                      Mark as sent to {labels.customer.toLowerCase()}
                    </button>
                  </form>
                )}
                {q.status === "sent" && (
                  <div className="mt-2 flex gap-3">
                    <form action={updateQuoteStatus.bind(null, id, q.id, "approved")}>
                      <button className="text-xs font-medium text-emerald-700 hover:underline" type="submit">
                        Mark approved
                      </button>
                    </form>
                    <form action={updateQuoteStatus.bind(null, id, q.id, "rejected")}>
                      <button className="text-xs font-medium text-red-700 hover:underline" type="submit">
                        Mark rejected
                      </button>
                    </form>
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-slate-500">No {labels.quote.toLowerCase()} yet.</p>
        )}

        {enquiry.status !== "converted" && (
          <form action={createQuoteWithId} className="mt-4 space-y-2 border-t border-slate-100 pt-4">
            <p className="text-xs font-medium text-slate-600">Raise a new {labels.quote.toLowerCase()}</p>
            <div className="grid grid-cols-2 gap-2">
              <input
                name="amount"
                type="number"
                step="0.01"
                placeholder="Amount (£)"
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
              />
              <input
                name="customer_po_number"
                placeholder="Customer PO number"
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
              />
            </div>
            <button className="text-xs font-medium text-blue-700 hover:underline" type="submit">
              + Add {labels.quote.toLowerCase()}
            </button>
          </form>
        )}
      </section>

      {approvedQuote && enquiry.status !== "converted" && jobType && (
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-slate-900">
            Convert to {labels.job.toLowerCase()}
          </h2>
          <p className="mb-4 text-xs text-slate-500">
            This {labels.quote.toLowerCase()} was approved — fill in the details below to create
            the {labels.job.toLowerCase()}.
          </p>
          <form action={convertWithId} className="space-y-4">
            <input type="hidden" name="quote_id" value={approvedQuote.id} />

            {jobType.customFields.map((field) => (
              <div key={field.key}>
                <label className="block text-xs font-medium text-slate-600">
                  {field.label}
                  {field.required ? " *" : ""}
                </label>
                {field.type === "select" ? (
                  <select
                    name={`custom_${field.key}`}
                    required={field.required}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="">—</option>
                    {field.options?.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : field.type === "boolean" ? (
                  <input type="checkbox" name={`custom_${field.key}`} className="mt-1" />
                ) : (
                  <input
                    name={`custom_${field.key}`}
                    type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
                    required={field.required}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                )}
              </div>
            ))}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600">Due date</label>
                <input
                  name="due_date"
                  type="date"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600">Priority</label>
                <select
                  name="priority"
                  defaultValue="normal"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600">Value (£)</label>
                <input
                  name="value"
                  type="number"
                  step="0.01"
                  defaultValue={approvedQuote.amount ?? ""}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600">
                  Assign to {labels.worker.toLowerCase()}/{labels.manager.toLowerCase()}
                </label>
                <select name="owner_id" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
                  <option value="">Unassigned</option>
                  {staff?.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.display_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Create {labels.job.toLowerCase()}
            </button>
          </form>
        </section>
      )}
    </main>
  );
}
