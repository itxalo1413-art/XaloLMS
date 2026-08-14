import { PRACTICE_CLASS_WEEKLY_REREGISTER_WARNING } from "@/lib/practiceClass";

export function PracticeClassWeeklyWarning({ announcement }: { announcement?: string }) {
  const message = announcement?.trim() || PRACTICE_CLASS_WEEKLY_REREGISTER_WARNING;

  return (
    <div
      className="mt-5 flex gap-3 rounded-2xl border border-warning/35 bg-warning/10 p-4"
      role="alert"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-warning/15 text-warning">
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
          <path d="M12 9v4M12 17h.01" />
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
      </div>
      <div className="min-w-0">
        <div className="text-[10px] font-black uppercase tracking-widest text-warning">
          Lưu ý & Thông báo từ Học vụ
        </div>
        <p className="mt-1 text-sm font-semibold leading-relaxed text-foreground whitespace-pre-wrap">
          {message}
        </p>
      </div>
    </div>
  );
}
