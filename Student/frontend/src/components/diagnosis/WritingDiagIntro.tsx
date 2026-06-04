"use client";

import { formatBandScore } from "@/lib/formatBandScore";

export type WritingDiagIntroProps = {
  taskMode: "task1" | "task2";
  onTaskModeChange: (mode: "task1" | "task2") => void;
  task1Band: number;
  task2Band: number;
  summary: string;
  submissionLink: string;
};

export function WritingDiagIntro({
  taskMode,
  onTaskModeChange,
  task1Band,
  task2Band,
  summary,
  submissionLink,
}: WritingDiagIntroProps) {
  const activeBand = taskMode === "task1" ? task1Band : task2Band;
  const hasLink = submissionLink.trim().length > 0;

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

      <div className="flex flex-col gap-4 rounded-2xl border border-zinc-100 bg-zinc-50/50 p-5 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-black uppercase tracking-widest text-muted">
            Đặc trưng Writing Band {formatBandScore(activeBand)}
          </div>
          <p className="mt-2 max-w-2xl text-xs font-medium leading-relaxed text-foreground">
            {summary}
          </p>
        </div>

        {hasLink ? (
          <a
            href={submissionLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-primary/15 bg-white px-4 py-2.5 text-xs font-bold text-primary shadow-sm transition-colors hover:bg-primary-soft/40"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              aria-hidden
            >
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
            </svg>
            Xem bài Writing {taskMode === "task1" ? "Task 1" : "Task 2"}
          </a>
        ) : (
          <span className="text-xs font-semibold text-muted">Chưa có link bài làm</span>
        )}
      </div>
    </div>
  );
}
