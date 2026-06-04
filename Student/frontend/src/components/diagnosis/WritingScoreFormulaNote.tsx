import { formatBandScore } from "@/lib/formatBandScore";
import { WRITING_TASK1_CRITERIA } from "@/lib/writingTask1BandDescriptors";
import { WRITING_TASK2_CRITERIA } from "@/lib/writingTask2BandDescriptors";

type Props = {
  task1Band: number;
  task2Band: number;
  writingOverall: number;
};

function CriteriaList({
  title,
  items,
}: {
  title: string;
  items: { label: string; description: string }[];
}) {
  return (
    <div>
      <p className="font-bold text-foreground">{title}</p>
      <ul className="mt-1.5 list-inside list-disc space-y-1">
        {items.map((c) => (
          <li key={c.label}>
            <span className="font-semibold text-foreground">{c.label}:</span> {c.description}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function WritingScoreFormulaNote({
  task1Band,
  task2Band,
  writingOverall,
}: Props) {
  return (
    <div className="rounded-2xl border border-dashed border-primary/20 bg-background/80 p-4 text-xs leading-relaxed text-muted">
      <p className="font-black uppercase tracking-widest text-foreground">
        Cách tính điểm Writing
      </p>
      <p className="mt-2">
        Mỗi task được chấm <strong className="text-foreground">4 tiêu chí</strong> (thang 0–9,
        mỗi tiêu chí 25%). Điểm task = trung bình cộng 4 tiêu chí, làm tròn bước{" "}
        <strong className="text-foreground">0.5</strong>.
      </p>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <CriteriaList
          title="Writing Task 1"
          items={WRITING_TASK1_CRITERIA.map((c) => ({
            label: c.label,
            description: c.description,
          }))}
        />
        <CriteriaList
          title="Writing Task 2"
          items={WRITING_TASK2_CRITERIA.map((c) => ({
            label: c.label,
            description: c.description,
          }))}
        />
      </div>

      <p className="mt-3 font-medium text-foreground">
        Điểm Writing overall = (Task 1 + Task 2 × 2) ÷ 3
      </p>
      <p className="mt-1 tabular-nums">
        ({formatBandScore(task1Band)} + {formatBandScore(task2Band)} × 2) ÷ 3 ={" "}
        <strong className="text-primary">{formatBandScore(writingOverall)}</strong>
      </p>
    </div>
  );
}
