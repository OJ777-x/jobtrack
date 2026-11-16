import Link from "next/link";
import { requireOrgContext } from "@/lib/org-context";
import { createClient } from "@/lib/supabase/server";
import { isAiConfigured } from "@/lib/ai/client";

const FEATURES = [
  { href: "/manager/ai/updates", title: "Customer progress updates", description: "Draft a plain-English update per customer. You review and approve before anything is published." },
  { href: "/manager/ai/risk-flags", title: "Risk flags", description: "See which jobs are likely to run late, and why." },
  { href: "/manager/ai/paste-in", title: "Paste-in updates", description: "Paste an email or rough notes — review a proposed note/stage change before anything saves." },
  { href: "/manager/ai/ask", title: "Ask a question", description: "Plain-English questions about your jobs, answered from your real data." },
];

export default async function AiHubPage() {
  const ctx = await requireOrgContext(["manager"]);
  const supabase = await createClient();

  const { data: log } = await supabase
    .from("ai_action_log")
    .select("id, action_type, input_summary, output_summary, confirmed, created_at, profiles(display_name)")
    .eq("org_id", ctx.organisation.id)
    .order("created_at", { ascending: false })
    .limit(15);

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-6 py-8">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">AI features</h1>
        <p className="text-sm text-slate-500">
          The AI never changes data or sends anything without a human confirming first, and every action is
          logged below.{" "}
          {isAiConfigured() ? "Connected to the Anthropic API." : "Running in demo mode — no Anthropic API key set, so these use real data with canned/rule-based text instead of calling the AI."}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {FEATURES.map((f) => (
          <Link key={f.href} href={f.href} className="rounded-xl border border-slate-200 bg-white p-5 hover:border-blue-300">
            <h2 className="text-sm font-semibold text-slate-900">{f.title}</h2>
            <p className="mt-1 text-xs text-slate-500">{f.description}</p>
          </Link>
        ))}
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">AI action log</h2>
        {!log || log.length === 0 ? (
          <p className="text-sm text-slate-500">No AI actions yet.</p>
        ) : (
          <ul className="space-y-2 text-xs">
            {log.map((l) => (
              <li key={l.id} className="rounded-md border border-slate-100 p-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-700">{l.action_type}</span>
                  <span className={l.confirmed ? "text-emerald-600" : "text-amber-600"}>
                    {l.confirmed ? "confirmed" : "drafted (not yet confirmed)"}
                  </span>
                </div>
                <p className="mt-1 text-slate-500">{l.output_summary}</p>
                <p className="mt-1 text-slate-400">
                  {(l.profiles as unknown as { display_name: string } | null)?.display_name ?? "—"} ·{" "}
                  {new Date(l.created_at).toLocaleString("en-GB")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
