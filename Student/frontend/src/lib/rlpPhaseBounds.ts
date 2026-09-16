import type { RlpSession } from "@/lib/courseSchedule";

export type RlpPhaseBounds = {
  phase1Max: number;
  showPhase2: boolean;
};

function parseViDate(raw?: string): Date | null {
  if (!raw?.trim()) return null;
  const m = raw.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
}

/** 1 chặng = 18 buổi; 2 chặng = 36 buổi. */
const STAGE_SESSIONS = 18;

/**
 * Ranh giới chặng RLP trên UI học viên:
 * - 1 chặng = 18 buổi; 2 chặng = 36 buổi
 * - Foundation (1 chặng) → toàn bộ buổi ở chặng 1
 * - Foundation/Core động → tách theo ngày bắt đầu chặng 2 trên metadata nếu có
 */
export function resolveRlpPhaseBounds(
  sessions: RlpSession[],
  meta?: {
    course?: string;
    phases?: { date?: string; name?: string }[];
  },
): RlpPhaseBounds {
  const total = sessions.length;
  if (total <= 0) return { phase1Max: STAGE_SESSIONS, showPhase2: true };

  const course = (meta?.course || "").toUpperCase();
  const phaseNames = (meta?.phases || []).map((p) => (p.name || "").toUpperCase());
  const isFoundation =
    course.includes("FOU") ||
    course.includes("FOUND") ||
    phaseNames.some((n) => n.includes("FOUNDATION")) ||
    (meta?.phases?.length === 1 && phaseNames[0]?.includes("FOUNDATION"));

  if (isFoundation) {
    return { phase1Max: total, showPhase2: false };
  }

  const phase2Date = parseViDate(meta?.phases?.[1]?.date);
  if (phase2Date) {
    const idx = sessions.findIndex((s) => {
      const d = parseViDate(s.date);
      return d !== null && d.getTime() >= phase2Date.getTime();
    });
    if (idx > 0) {
      return { phase1Max: idx, showPhase2: true };
    }
  }

  // Đủ / ít hơn 1 chặng → chỉ hiện chặng 1
  if (total <= STAGE_SESSIONS) {
    return { phase1Max: total, showPhase2: false };
  }

  // 2 chặng trở lên → chặng 1 = 18 buổi đầu
  return { phase1Max: STAGE_SESSIONS, showPhase2: true };
}
