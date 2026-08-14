type Props = {
  bandLabel: string;
  summary: string;
  submissionLink?: string;
  linkLabel?: string;
};

export function SkillDiagIntro({ bandLabel, summary }: Props) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-zinc-100 bg-zinc-50/50 p-5">
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-black uppercase tracking-widest text-muted">{bandLabel}</div>
        <p className="mt-2 max-w-2xl text-xs font-medium leading-relaxed text-foreground">{summary}</p>
      </div>
    </div>
  );
}
