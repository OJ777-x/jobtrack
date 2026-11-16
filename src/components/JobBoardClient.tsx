"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { moveJobToStage } from "@/app/manager/jobs/actions";

export type BoardJob = {
  id: string;
  referenceNumber: string;
  customerName: string;
  stage: string;
  priority: string;
  dueDate: string | null;
};

export type BoardStage = {
  key: string;
  label: string;
};

const PRIORITY_DOT: Record<string, string> = {
  low: "bg-slate-300",
  normal: "bg-slate-400",
  high: "bg-amber-500",
  urgent: "bg-red-500",
};

export function JobBoardClient({ stages, jobs }: { stages: BoardStage[]; jobs: BoardJob[] }) {
  const [localJobs, setLocalJobs] = useState(jobs);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function handleDrop(stageKey: string) {
    if (!draggingId) return;
    const jobId = draggingId;
    setDraggingId(null);

    setLocalJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, stage: stageKey } : j)));
    startTransition(() => {
      moveJobToStage(jobId, stageKey);
    });
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {stages.map((stage) => {
        const stageJobs = localJobs.filter((j) => j.stage === stage.key);
        return (
          <div
            key={stage.key}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(stage.key)}
            className="flex w-64 flex-shrink-0 flex-col rounded-lg bg-slate-100"
          >
            <div className="flex items-center justify-between px-3 py-2">
              <h3 className="text-xs font-semibold uppercase text-slate-600">{stage.label}</h3>
              <span className="text-xs text-slate-400">{stageJobs.length}</span>
            </div>
            <div className="flex min-h-[80px] flex-1 flex-col gap-2 px-2 pb-2">
              {stageJobs.map((job) => (
                <div
                  key={job.id}
                  draggable
                  data-dragging={draggingId === job.id}
                  onDragStart={() => setDraggingId(job.id)}
                  onDragEnd={() => setDraggingId(null)}
                  className={`cursor-grab rounded-md border border-slate-200 bg-white p-3 text-sm shadow-sm active:cursor-grabbing ${
                    draggingId === job.id ? "opacity-40" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Link href={`/manager/jobs/${job.id}`} className="font-medium text-blue-700 hover:underline">
                      {job.referenceNumber}
                    </Link>
                    <span className={`h-2 w-2 rounded-full ${PRIORITY_DOT[job.priority] ?? "bg-slate-300"}`} title={job.priority} />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{job.customerName}</p>
                  {job.dueDate && <p className="mt-1 text-xs text-slate-400">Due {job.dueDate}</p>}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
