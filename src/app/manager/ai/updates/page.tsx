import { requireOrgContext } from "@/lib/org-context";
import { createClient } from "@/lib/supabase/server";
import { isAiConfigured } from "@/lib/ai/client";
import { generateDraft, editDraft, publishUpdate, discardDraft } from "./actions";

export default async function CustomerUpdatesPage() {
  const ctx = await requireOrgContext(["manager"]);
  const { labels } = ctx.template.config;
  const supabase = await createClient();

  const { data: customers } = await supabase
    .from("customers")
    .select("id, name")
    .eq("org_id", ctx.organisation.id)
    .order("name");

  const { data: updates } = await supabase
    .from("customer_updates")
    .select("id, body, status, published_at, created_at, customers(name)")
    .eq("org_id", ctx.organisation.id)
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-6 py-8">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Customer progress updates</h1>
        <p className="text-sm text-slate-500">
          Draft a plain-English update per customer, review it, then publish it to their portal.
          {!isAiConfigured() && " Running in demo mode (no Anthropic API key set) — drafts are assembled from the real data without calling the AI."}
        </p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">{labels.customers}</h2>
        <div className="flex flex-wrap gap-2">
          {customers?.map((c) => (
            <form key={c.id} action={generateDraft.bind(null, c.id)}>
              <button
                type="submit"
                className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-blue-400 hover:text-blue-700"
              >
                Draft update for {c.name}
              </button>
            </form>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        {!updates || updates.length === 0 ? (
          <p className="text-sm text-slate-500">No drafts yet — generate one above.</p>
        ) : (
          updates.map((u) => (
            <div key={u.id} className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-900">
                  {(u.customers as unknown as { name: string } | null)?.name ?? "—"}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    u.status === "published" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {u.status}
                </span>
              </div>

              {u.status === "draft" ? (
                <form action={editDraft.bind(null, u.id)} className="space-y-2">
                  <textarea
                    name="body"
                    defaultValue={u.body}
                    rows={6}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                  <div className="flex gap-2">
                    <button type="submit" className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700">
                      Save edits
                    </button>
                  </div>
                </form>
              ) : (
                <p className="whitespace-pre-wrap rounded-md bg-slate-50 p-3 text-sm text-slate-700">{u.body}</p>
              )}

              <div className="mt-3 flex items-center gap-3 text-xs">
                {u.status === "draft" ? (
                  <>
                    <form action={publishUpdate.bind(null, u.id)}>
                      <button type="submit" className="font-medium text-emerald-700 hover:underline">
                        Approve &amp; publish to portal
                      </button>
                    </form>
                    <form action={discardDraft.bind(null, u.id)}>
                      <button type="submit" className="font-medium text-red-600 hover:underline">
                        Discard
                      </button>
                    </form>
                  </>
                ) : (
                  <span className="text-slate-400">
                    Published {u.published_at ? new Date(u.published_at).toLocaleString("en-GB") : ""}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </section>
    </main>
  );
}
