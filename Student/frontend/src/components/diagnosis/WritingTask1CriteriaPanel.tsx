import { formatBandScore } from "@/lib/formatBandScore";
import {
  getWritingTask1CriterionDescriptor,
  WRITING_TASK1_CRITERIA,
  type WritingTask1CriterionScores,
} from "@/lib/writingTask1BandDescriptors";

type Props = {
  scores: WritingTask1CriterionScores;
};

export function WritingTask1CriteriaPanel({ scores }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {WRITING_TASK1_CRITERIA.map((criterion) => {
        const band = scores[criterion.key];
        const lines = getWritingTask1CriterionDescriptor(band, criterion.key);

        return (
          <div
            key={criterion.key}
            className="rounded-2xl border border-primary/10 bg-card p-5 shadow-soft"
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-black text-primary tabular-nums">
                {formatBandScore(band)}
              </div>
              <div className="min-w-0">
                <h5 className="text-sm font-bold text-foreground">{criterion.name}</h5>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                  Band {formatBandScore(band)} · {criterion.label}
                </p>
              </div>
            </div>
            <p className="mb-3 text-[11px] font-medium leading-relaxed text-muted">
              {criterion.description}
            </p>

            {lines.length === 0 ? (
              <p className="text-xs font-medium text-muted">Chưa có mô tả cho band này.</p>
            ) : (
              <ul className="space-y-2">
                {lines.map((line) => (
                  <li
                    key={line}
                    className="flex gap-2 text-xs font-medium leading-relaxed text-foreground"
                  >
                    <span
                      className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary/60"
                      aria-hidden
                    />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
