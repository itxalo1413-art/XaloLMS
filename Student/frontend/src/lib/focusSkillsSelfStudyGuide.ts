import type { FocusSkill } from "@/lib/focusSkills";

/** 1–2 dòng gợi ý ngắn theo kỹ năng đã chọn */
export function buildFocusSkillsSelfStudyHint(skills: FocusSkill[]): string[] {
  if (skills.length === 0) return [];

  const set = new Set(skills);
  const parts: string[] = [];
  if (set.has("Listening") || set.has("Reading")) parts.push("lớp luyện đề L-R-W");
  if (set.has("Writing")) parts.push("chấm Writing");
  if (set.has("Speaking")) parts.push("mock Speaking");

  return [
    `Sau khi xác nhận, sang tab Hỗ trợ tự học để ${parts.join(", ")} — khác trang chủ (chỉ xem BCB và mục tiêu).`,
  ];
}
