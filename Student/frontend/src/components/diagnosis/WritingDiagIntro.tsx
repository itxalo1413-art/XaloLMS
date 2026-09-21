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
  submissionLink,
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
          <p className="mt-2 w-full text-xs font-medium leading-relaxed text-foreground">
            {summary || "Chưa có nhận xét chi tiết từ giám khảo."}
          </p>

          {submissionLink && submissionLink.trim().startsWith("http") && (
            <div className="mt-3 pt-3 border-t border-zinc-200/60 flex items-center justify-between">
              <span className="text-[11px] font-bold text-zinc-500">Bài làm của thí sinh:</span>
              <a
                href={submissionLink.trim()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
              >
                <span>Mở Google Docs bài viết</span>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
