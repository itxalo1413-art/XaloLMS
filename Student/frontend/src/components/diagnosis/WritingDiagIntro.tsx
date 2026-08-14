"use client";

import { formatBandScore } from "@/lib/formatBandScore";

export type WritingDiagIntroProps = {
  taskMode: "task1" | "task2";
  onTaskModeChange: (mode: "task1" | "task2") => void;
  task1Band: number;
  task2Band: number;
  summary: string;
  submissionLink?: string;
};

export function WritingDiagIntro({
  taskMode,
  onTaskModeChange,
  task1Band,
  task2Band,
  summary,
}: WritingDiagIntroProps) {
  const activeBand = taskMode === "task1" ? task1Band : task2Band;

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => onTaskModeChange("task1")}
          className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
            taskMode === "task1"
              ? "bg-primary text-white shadow-sm ring-1 ring-primary/30"
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
          }`}
        >
          Task 1 ({formatBandScore(task1Band)})
        </button>
        <button
          type="button"
          onClick={() => onTaskModeChange("task2")}
          className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
            taskMode === "task2"
              ? "bg-primary text-white shadow-sm ring-1 ring-primary/30"
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
          }`}
        >
          Task 2 ({formatBandScore(task2Band)})
        </button>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-zinc-100 bg-zinc-50/50 p-5">
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-black uppercase tracking-widest text-muted">
            Đặc trưng Writing Band {formatBandScore(activeBand)}
          </div>
          <p className="mt-2 max-w-2xl text-xs font-medium leading-relaxed text-foreground">
            {summary}
          </p>
        </div>
      </div>
    </div>
  );
}
