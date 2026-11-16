import { requireOrgContext } from "@/lib/org-context";
import { isAiConfigured } from "@/lib/ai/client";
import { AskClient } from "@/components/AskClient";

export default async function AskPage() {
  const ctx = await requireOrgContext(["manager"]);
  const { labels } = ctx.template.config;

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-6 py-8">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Ask a question</h1>
        <p className="text-sm text-slate-500">
          Plain-English questions about your {labels.jobs.toLowerCase()} — answered only from your real data.
          {!isAiConfigured() && " Running in demo mode: try the suggested questions below; free-form questions need an Anthropic API key."}
        </p>
      </div>
      <AskClient />
    </main>
  );
}
