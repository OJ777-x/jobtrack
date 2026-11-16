"use client";

import { useState, useTransition } from "react";
import { analyzePasted, applyPasteIn } from "@/app/manager/ai/paste-in/actions";
import type { PasteInCandidate, PasteInProposal } from "@/lib/ai/paste-in";
import { getJobType } from "@/lib/job-helpers";
import type { TemplateConfig } from "@/lib/templates/types";

export function PasteInClient({
  config,
  candidates,
}: {
  config: TemplateConfig;
  candidates: PasteInCandidate[];
}) {
  const [text, setText] = useState("");
  const [proposal, setProposal] = useState<PasteInProposal | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [noteBody, setNoteBody] = useState("");
  const [stageKey, setStageKey] = useState<string>("");
  const [applied, setApplied] = useState(false);
  const [isPending, startTransition] = useTransition();

  const selectedCandidate = candidates.find((c) => c.id === selectedJobId);
  const selectedJobType = selectedCandidate ? getJobType(config, selectedCandidate.jobType) : undefined;

  function handleAnalyze() {
    if (!text.trim()) return;
    setApplied(false);
    startTransition(async () => {
      const result = await analyzePasted(text);
      setProposal(result);
      setSelectedJobId(result.matchedJobId ?? "");
      setNoteBody(result.proposedNote);
      setStageKey(result.proposedStageKey ?? "");
    });
  }

  function handleApply() {
    if (!selectedJobId || !noteBody.trim()) return;
    startTransition(async () => {
      await applyPasteIn(selectedJobId, noteBody, stageKey || null);
      setApplied(true);
    });
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <label className="block text-xs font-medium text-slate-600">Paste an email or rough notes</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          placeholder="e.g. Hi, following up on NES-0002 - the customer says the part hasn't arrived yet and they're worried about the deadline..."
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          onClick={handleAnalyze}
          disabled={isPending || !text.trim()}
          className="mt-3 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isPending && !proposal ? "Analysing…" : "Analyse"}
        </button>
        <p className="mt-2 text-xs text-slate-400">
          Treated as data, not instructions — nothing is saved until you review and confirm below.
        </p>
      </section>

      {proposal && (
        <section className="rounded-xl border border-blue-200 bg-blue-50 p-6">
          <h2 className="text-sm font-semibold text-slate-900">Proposed update</h2>
          <p className="mt-1 text-xs text-slate-600">{proposal.matchedReason}</p>

          <div className="mt-4 space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-600">Job</label>
              <select
                value={selectedJobId}
                onChange={(e) => {
                  setSelectedJobId(e.target.value);
                  setStageKey("");
                }}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">— choose a job —</option>
                {candidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.referenceNumber} — {c.customerName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600">Note to add</label>
              <textarea
                value={noteBody}
                onChange={(e) => setNoteBody(e.target.value)}
                rows={4}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            {selectedJobType && (
              <div>
                <label className="block text-xs font-medium text-slate-600">
                  Change stage? {proposal.proposedStageLabel && `(mentions "${proposal.proposedStageLabel}")`}
                </label>
                <select
                  value={stageKey}
                  onChange={(e) => setStageKey(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="">No change</option>
                  {selectedJobType.stages.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={handleApply}
              disabled={isPending || !selectedJobId || !noteBody.trim()}
              className="w-full rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              Confirm &amp; apply
            </button>

            {applied && <p className="text-sm font-medium text-emerald-700">Applied — note added{stageKey ? " and stage updated" : ""}.</p>}
          </div>
        </section>
      )}
    </div>
  );
}
