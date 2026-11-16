"use client";

import { useState, useTransition } from "react";
import { askOrgQuestion } from "@/app/manager/ai/ask/actions";

const EXAMPLES = ["Which jobs are late?", "What's waiting on parts?", "What's due this week?"];

export function AskClient() {
  const [question, setQuestion] = useState("");
  const [history, setHistory] = useState<{ question: string; answer: string }[]>([]);
  const [isPending, startTransition] = useTransition();

  function ask(q: string) {
    if (!q.trim()) return;
    startTransition(async () => {
      const answer = await askOrgQuestion(q);
      setHistory((h) => [{ question: q, answer }, ...h]);
      setQuestion("");
    });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex gap-2">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && ask(question)}
            placeholder="Ask a question about your jobs..."
            className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            onClick={() => ask(question)}
            disabled={isPending || !question.trim()}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isPending ? "Asking…" : "Ask"}
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => ask(ex)}
              className="rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-500 hover:border-blue-300 hover:text-blue-700"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {history.map((h, i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-medium text-slate-800">{h.question}</p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{h.answer}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
