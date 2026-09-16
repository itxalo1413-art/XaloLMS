import type { FocusSkill } from "@/lib/focusSkills";

export function buildFocusSkillsSelfStudyHint(skills: FocusSkill[]): string[] {
  if (skills.length === 0) return [];

  const set = new Set(skills);
  const parts: string[] = [];
  if (set.has("Listening") || set.has("Reading")) parts.push("lớp luyện đề L-R-W");
  if (set.has("Writing")) parts.push("chấm Writing");
  if (set.has("Speaking")) parts.push("mock Speaking");

  return [
    `Sau khi xác nhận, sang tab Hỗ trợ tự học.`,
  ];
}
