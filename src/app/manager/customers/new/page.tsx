import { requireOrgContext } from "@/lib/org-context";
import { createCustomer } from "../actions";

export default async function NewCustomerPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const ctx = await requireOrgContext(["manager"]);
  const { labels } = ctx.template.config;
  const { error } = await searchParams;

  return (
    <main className="mx-auto max-w-lg space-y-6 px-6 py-8">
      <h1 className="text-xl font-semibold text-slate-900">
        Add {labels.customer.toLowerCase()}
      </h1>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <form action={createCustomer} className="space-y-5 rounded-xl border border-slate-200 bg-white p-6">
        <Field label={`${labels.customer} name`} name="name" required />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Email" name="email" type="email" />
          <Field label="Phone" name="phone" />
        </div>
        <Field label="Notes" name="notes" textarea />

        <div className="border-t border-slate-100 pt-4">
          <p className="mb-3 text-sm font-medium text-slate-700">
            {labels.site} address <span className="font-normal text-slate-400">(optional)</span>
          </p>
          <div className="space-y-3">
            <Field label="Address line 1" name="address_line1" />
            <Field label="Address line 2" name="address_line2" />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Town/City" name="city" />
              <Field label="Postcode" name="postcode" />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Save {labels.customer.toLowerCase()}
        </button>
      </form>
    </main>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = false,
  textarea = false,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  textarea?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600">{label}</label>
      {textarea ? (
        <textarea
          name={name}
          rows={3}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      ) : (
        <input
          name={name}
          type={type}
          required={required}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      )}
    </div>
  );
}
