import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOrgContext } from "@/lib/org-context";
import { createClient } from "@/lib/supabase/server";
import { jobTypeLabel, stageLabel } from "@/lib/job-helpers";
import { addContact, addSite } from "../actions";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await requireOrgContext(["manager"]);
  const { labels, config } = { labels: ctx.template.config.labels, config: ctx.template.config };
  const supabase = await createClient();

  const { data: customer } = await supabase
    .from("customers")
    .select("id, name, email, phone, notes")
    .eq("org_id", ctx.organisation.id)
    .eq("id", id)
    .single();

  if (!customer) notFound();

  const [{ data: sites }, { data: contacts }, { data: jobs }, { data: enquiries }] = await Promise.all([
    supabase.from("sites").select("id, address_line1, address_line2, city, postcode").eq("customer_id", id),
    supabase.from("contacts").select("id, name, email, phone, role_title").eq("customer_id", id),
    supabase.from("jobs").select("id, reference_number, job_type, stage").eq("customer_id", id).order("created_at", { ascending: false }),
    supabase.from("enquiries").select("id, job_type, status, created_at").eq("customer_id", id).order("created_at", { ascending: false }),
  ]);

  const addContactWithId = addContact.bind(null, id);
  const addSiteWithId = addSite.bind(null, id);

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-6 py-8">
      <div>
        <Link href="/manager/customers" className="text-sm text-blue-700 hover:underline">
          ← {labels.customers}
        </Link>
        <h1 className="mt-1 text-xl font-semibold text-slate-900">{customer.name}</h1>
        <p className="text-sm text-slate-500">
          {customer.email ?? "No email"} · {customer.phone ?? "No phone"}
        </p>
        {customer.notes && <p className="mt-2 text-sm text-slate-600">{customer.notes}</p>}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">{labels.site} addresses</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            {sites && sites.length > 0 ? (
              sites.map((s) => (
                <li key={s.id} className="rounded-md border border-slate-100 p-2">
                  {s.address_line1}
                  {s.address_line2 ? `, ${s.address_line2}` : ""}
                  {s.city ? `, ${s.city}` : ""}
                  {s.postcode ? `, ${s.postcode}` : ""}
                </li>
              ))
            ) : (
              <li className="text-slate-400">No sites yet.</li>
            )}
          </ul>
          <form action={addSiteWithId} className="mt-4 space-y-2 border-t border-slate-100 pt-4">
            <input
              name="address_line1"
              placeholder="Address line 1"
              className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
            />
            <div className="grid grid-cols-2 gap-2">
              <input name="city" placeholder="Town/City" className="rounded-md border border-slate-300 px-3 py-1.5 text-sm" />
              <input name="postcode" placeholder="Postcode" className="rounded-md border border-slate-300 px-3 py-1.5 text-sm" />
            </div>
            <button className="text-xs font-medium text-blue-700 hover:underline" type="submit">
              + Add site
            </button>
          </form>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">Contacts</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            {contacts && contacts.length > 0 ? (
              contacts.map((c) => (
                <li key={c.id} className="rounded-md border border-slate-100 p-2">
                  <span className="font-medium text-slate-800">{c.name}</span>
                  {c.role_title ? ` — ${c.role_title}` : ""}
                  {c.email ? ` · ${c.email}` : ""}
                  {c.phone ? ` · ${c.phone}` : ""}
                </li>
              ))
            ) : (
              <li className="text-slate-400">No contacts yet.</li>
            )}
          </ul>
          <form action={addContactWithId} className="mt-4 space-y-2 border-t border-slate-100 pt-4">
            <input name="name" placeholder="Contact name" className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm" />
            <div className="grid grid-cols-2 gap-2">
              <input name="role_title" placeholder="Role" className="rounded-md border border-slate-300 px-3 py-1.5 text-sm" />
              <input name="phone" placeholder="Phone" className="rounded-md border border-slate-300 px-3 py-1.5 text-sm" />
            </div>
            <input name="email" placeholder="Email" className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm" />
            <button className="text-xs font-medium text-blue-700 hover:underline" type="submit">
              + Add contact
            </button>
          </form>
        </section>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">{labels.jobs}</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {jobs && jobs.length > 0 ? (
            jobs.map((j) => (
              <li key={j.id}>
                <Link href={`/manager/jobs/${j.id}`} className="text-blue-700 hover:underline">
                  {j.reference_number}
                </Link>{" "}
                <span className="text-slate-500">
                  — {jobTypeLabel(config, j.job_type)} · {stageLabel(config, j.job_type, j.stage)}
                </span>
              </li>
            ))
          ) : (
            <li className="text-slate-400">No {labels.jobs.toLowerCase()} yet.</li>
          )}
        </ul>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">{labels.enquiries}</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {enquiries && enquiries.length > 0 ? (
            enquiries.map((e) => (
              <li key={e.id}>
                <Link href={`/manager/enquiries/${e.id}`} className="text-blue-700 hover:underline">
                  {jobTypeLabel(config, e.job_type)}
                </Link>{" "}
                <span className="text-slate-500">— {e.status}</span>
              </li>
            ))
          ) : (
            <li className="text-slate-400">No {labels.enquiries.toLowerCase()} yet.</li>
          )}
        </ul>
      </section>
    </main>
  );
}
