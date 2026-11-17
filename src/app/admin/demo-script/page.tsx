import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminAuthed } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { TemplateConfig } from "@/lib/templates/types";

export default async function DemoScriptPage() {
  if (!(await isAdminAuthed())) redirect("/admin/login");

  const admin = createAdminClient();
  const { data: org } = await admin.from("organisations").select("name, active_template_id").limit(1).maybeSingle();

  const { data: template } = org?.active_template_id
    ? await admin.from("industry_templates").select("name, config").eq("id", org.active_template_id).maybeSingle()
    : { data: null };

  const config = template?.config as TemplateConfig | undefined;

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <Link href="/admin" className="text-sm text-blue-700 hover:underline">
            ← Demo admin
          </Link>
          <h1 className="mt-1 text-xl font-semibold text-slate-900">
            Demo script — {template?.name ?? "—"} ({org?.name ?? "—"})
          </h1>
          <p className="text-sm text-slate-500">
            The steps to click through to show a prospect the wow moments in under 10 minutes. This page is
            only reachable from the admin area — it won&apos;t appear anywhere in the demo itself.
          </p>
        </div>

        {!config?.demoScript || config.demoScript.length === 0 ? (
          <p className="text-sm text-slate-500">No demo script for this template.</p>
        ) : (
          <ol className="space-y-4">
            {config.demoScript.map((step, i) => (
              <li key={i} className="rounded-xl border border-slate-200 bg-white p-5">
                <p className="text-sm font-semibold text-slate-900">{step.title}</p>
                <p className="mt-1 text-sm text-slate-600">{step.detail}</p>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
