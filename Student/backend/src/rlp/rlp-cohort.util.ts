/** Chuẩn hóa ngày → slug cohort (ddmmyyyy). */
export function slugCohortDate(dateStr?: string | null): string {
  const raw = String(dateStr || '').trim();
  if (!raw || raw === '-') return '';
  const vi = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (vi) {
    const dd = vi[1].padStart(2, '0');
    const mm = vi[2].padStart(2, '0');
    return `${dd}${mm}${vi[3]}`;
  }
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[3]}${iso[2]}${iso[1]}`;
  return raw.replace(/[^\dA-Za-z]/g, '').slice(0, 16);
}

/**
 * Cohort = đợt khai giảng khóa (openDate).
 * Chuyển chặng chỉ đổi phaseStartDate → cohort giữ nguyên.
 * Khai giảng mới (đổi openDate) → cohort mới → RLP reset.
 */
export function resolveClassCohortKey(cls: {
  rlpCohortKey?: string | null;
  openDate?: string | null;
  phaseStartDate?: string | null;
}): string {
  const pinned = String(cls.rlpCohortKey || '').trim();
  if (pinned) return pinned;
  return (
    slugCohortDate(cls.openDate) ||
    slugCohortDate(cls.phaseStartDate) ||
    'default'
  );
}

export function buildRlpStoreKey(classId: string, cohortKey: string): string {
  const id = String(classId || '').trim();
  const cohort = String(cohortKey || 'default').trim() || 'default';
  return `rlp_store_${id}__${cohort}`;
}

/** Store cũ trước khi tách cohort. */
export function legacyRlpStoreKey(classId: string): string {
  return `rlp_store_${String(classId || '').trim()}`;
}

export function normalizeOpenDate(value?: string | null): string {
  return String(value || '')
    .trim()
    .replace(/-/g, '/')
    .toLowerCase();
}
