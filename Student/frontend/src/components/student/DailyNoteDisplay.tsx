import {
  DAILY_NOTE_SURFACE,
  formatDailyNoteDate,
  type StudentDailyNote,
} from "@/lib/studentDailyNote";

type Props = {
  note: StudentDailyNote;
  className?: string;
  dateLabel?: string;
};

export function DailyNoteDisplay({ note, className = "", dateLabel }: Props) {
  const displayDate = dateLabel ?? formatDailyNoteDate();

  return (
    <div
      className={[
        "relative min-h-[220px] overflow-hidden px-8 py-10 md:min-h-[260px] md:px-10 md:py-12",
        className,
      ].join(" ")}
      style={{ backgroundColor: DAILY_NOTE_SURFACE }}
    >
      <div className="relative z-10 flex h-full min-h-[180px] flex-col justify-between text-foreground">
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            <h2 className="text-3xl font-black leading-none tracking-tight text-primary md:text-4xl">
              {note.word}
            </h2>
            <p className="mt-4 max-w-md text-sm font-medium lowercase leading-relaxed text-muted md:text-base">
              {note.meaning}
            </p>
          </div>
          <div className="shrink-0 pt-1 text-[11px] font-black uppercase tracking-[0.2em] text-primary/80">
            {displayDate}
          </div>
        </div>
        <div className="self-end text-lg font-black tracking-widest text-primary/50">//</div>
      </div>
    </div>
  );
}
