import Link from "next/link";
import type { FocusSkill } from "@/lib/focusSkills";
import { buildFocusSkillsSelfStudyHint } from "@/lib/focusSkillsSelfStudyGuide";

type Props = {
  focusSkills: FocusSkill[];
};

export function FocusSkillsSelfStudyHint({ focusSkills }: Props) {
  const lines = buildFocusSkillsSelfStudyHint(focusSkills);
  if (lines.length === 0) return null;

  return (
    <div className="rounded-2xl border border-primary/20 bg-primary-soft/20 px-4 py-3">
      {lines.map((line) => (
        <p key={line} className="text-[11px] font-medium leading-relaxed text-muted">
          {line}{" "}
          <Link
            href="/ho-tro-tu-hoc"
            className="font-bold text-primary underline-offset-2 hover:underline"
          >
            Mở tab →
          </Link>
        </p>
      ))}
    </div>
  );
}
