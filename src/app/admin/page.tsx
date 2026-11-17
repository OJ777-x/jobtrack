import { redirect } from "next/navigation";
import { isAdminAuthed } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { allTemplates } from "@/lib/templates";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/lib/demo-accounts";
import { switchTemplate, adminLogout } from "./actions";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ switched?: string }>;
}) {
  if (!(await isAdminAuthed())) redirect("/admin/login");
  const { switched } = await searchParams;

  const admin = createAdminClient();
  const { data: org } = await admin
    .from("organisations")
    .select("name, active_template_id")
    .limit(1)
    .maybeSingle();

  const { data: activeTemplate } = org?.active_template_id
    ? await admin.from("industry_templates").select("key, name").eq("id", org.active_template_id).maybeSingle()
    : { data: null };

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Demo admin</h1>
            <p className="text-sm text-slate-500">Switch the whole demo between industry templates.</p>
          </div>
          <div className="flex items-center gap-4">
            <a href="/admin/demo-script" className="text-sm text-blue-700 hover:underline">
              Demo script
            </a>
            <form action={adminLogout}>
              <button type="submit" className="text-sm text-slate-500 hover:underline">
                Log out
              </button>
            </form>
          </div>
        </div>

        {switched && (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            Switched. Anyone currently signed in to the demo has been logged out — the one-click logins on the
            sign-in page work immediately with the new template.
          </div>
        )}

        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <p className="text-sm text-slate-600">
            Currently showing: <span className="font-semibold text-slate-900">{org?.name ?? "—"}</span> on the{" "}
            <span className="font-semibold text-slate-900">{activeTemplate?.name ?? "—"}</span> template.
          </p>
        </div>

        <div className="space-y-3">
          {allTemplates.map((t) => {
            const isActive = t.key === activeTemplate?.key;
            return (
              <div key={t.key} className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{t.name}</p>
                    <p className="text-xs text-slate-500">Demo company: {t.config.demoData.orgName}</p>
                  </div>
                  <form action={switchTemplate.bind(null, t.key)}>
                    <button
                      type="submit"
                      className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                        isActive
                          ? "border border-slate-300 text-slate-500 hover:bg-slate-50"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      {isActive ? "Reset this demo" : "Switch to this template"}
                    </button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
          <p className="font-medium text-slate-700">One-click demo logins (same for every template):</p>
          <ul className="mt-2 space-y-1">
            <li>Manager: {DEMO_ACCOUNTS.manager}</li>
            <li>Worker: {DEMO_ACCOUNTS.worker}</li>
            <li>Customer: {DEMO_ACCOUNTS.customer}</li>
            <li>Password: {DEMO_PASSWORD}</li>
          </ul>
          <p className="mt-3">
            Go to <a href="/login" className="text-blue-700 hover:underline">the sign-in page</a> and use the
            quick-login buttons — no need to type these in.
          </p>
        </div>
      </div>
    </div>
  );
}
