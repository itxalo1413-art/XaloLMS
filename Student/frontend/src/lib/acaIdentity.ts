import type { AuthUser } from "@/lib/auth";

const LEGACY_GRADER_EMAILS = new Set([
  "aca_1@gmail.com",
  "aca_2@gmail.com",
  "aca@xalo.internal",
]);

/** Grader = role GRADER, hoặc token cũ vẫn mang role ACA với email grader. */
export function isGraderUser(
  user?: Pick<AuthUser, "role" | "email"> | null,
): boolean {
  if (!user) return false;
  if (user.role === "GRADER") return true;
  const email = (user.email || "").trim().toLowerCase();
  return user.role === "ACA" && LEGACY_GRADER_EMAILS.has(email);
}

/** Học vụ trưởng = role ACA và không phải tài khoản grader. */
export function isAcaAcademicHead(
  user?: Pick<AuthUser, "role" | "email"> | null,
): boolean {
  if (!user) return false;
  return user.role === "ACA" && !isGraderUser(user);
}

export const GRADER_HOME = "/grader";

export const GRADER_PATHS = {
  home: "/grader",
  writing: "/grader/cham-writing",
  speaking: "/grader/test-speaking",
  freeSlots: "/grader/lich-ranh",
  profile: "/grader/profile",
} as const;

/** Map đường dẫn ACA cũ → portal Grader. */
export function mapAcaPathToGrader(pathname: string): string | null {
  if (pathname.startsWith("/aca/quan-ly/cham-writing")) return GRADER_PATHS.writing;
  if (pathname.startsWith("/aca/quan-ly/test-speaking")) return GRADER_PATHS.speaking;
  if (pathname.startsWith("/aca/quan-ly/lich-ranh")) return GRADER_PATHS.freeSlots;
  if (pathname.startsWith("/aca/profile")) return GRADER_PATHS.profile;
  if (pathname === "/aca" || pathname === "/aca/") return GRADER_PATHS.home;
  return null;
}
