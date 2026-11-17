import { requireOrgContext } from "@/lib/org-context";
import { updateOrgSettings } from "./actions";

export default async function SettingsPage() {
  const ctx = await requireOrgContext(["manager"]);

  return (
    <main className="mx-auto max-w-lg space-y-6 px-6 py-8">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500">Company name, logo and colours for {ctx.organisation.name}.</p>
      </div>

      <form action={updateOrgSettings} className="space-y-5 rounded-xl border border-slate-200 bg-white p-6">
        <div>
          <label className="block text-xs font-medium text-slate-600">Company name</label>
          <input
            name="name"
            defaultValue={ctx.organisation.name}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600">Primary colour</label>
            <input
              name="primary_color"
              type="color"
              defaultValue={ctx.organisation.primaryColor}
              className="mt-1 h-10 w-full rounded-md border border-slate-300"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600">Secondary colour</label>
            <input
              name="secondary_color"
              type="color"
              defaultValue={ctx.organisation.secondaryColor}
              className="mt-1 h-10 w-full rounded-md border border-slate-300"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600">Logo</label>
          {ctx.organisation.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- small admin-only settings preview, not worth next/image setup
            <img src={ctx.organisation.logoUrl} alt="Current logo" className="mt-2 h-12 rounded border border-slate-200 bg-white p-1" />
          )}
          <input name="logo" type="file" accept="image/*" className="mt-2 w-full text-sm" />
          <p className="mt-1 text-xs text-slate-400">Needs the org-logos storage bucket set up (see README) to actually save.</p>
        </div>

        <button
          type="submit"
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Save settings
        </button>
      </form>
    </main>
  );
}
