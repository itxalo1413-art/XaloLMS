import { getCachedAuthUser } from "@/lib/auth";

export function getLoggedInTeacherName(): string {
  return getCachedAuthUser()?.name?.trim() || "";
}

export function teacherNameMatches(haystack: string | undefined, teacherName: string): boolean {
  const target = teacherName.trim().toLowerCase();
  if (!target) return false;
  const text = (haystack || "").toLowerCase();
  if (text.includes(target) || target.includes(text)) return true;
  const words = target.split(/\s+/).filter(Boolean);
  const lastTwo = words.length >= 2 ? words.slice(-2).join(" ") : target;
  return Boolean(lastTwo && text.includes(lastTwo));
}
