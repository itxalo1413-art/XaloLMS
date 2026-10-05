import type { JwtPayload } from '../auth/auth.types';

/** Tên Grader chuẩn (đồng bộ Writing / Speaking). */
export const ACA_GRADERS = [
  'Huỳnh Gia Phú',
  'Lê Thị Diệu Linh',
  'Nguyễn Văn Đăng Duy',
  'Huỳnh Minh Phương',
  'Nguyễn Thị Hoàng Sa',
] as const;

export type CanonicalGraderName = (typeof ACA_GRADERS)[number];

const GRADER_NAME_ALIASES: Record<string, CanonicalGraderName> = {
  'grader 1': 'Huỳnh Gia Phú',
  'bộ phận grader 1': 'Huỳnh Gia Phú',
  'gia phú': 'Huỳnh Gia Phú',
  'huỳnh gia phú': 'Huỳnh Gia Phú',
  'grader 2': 'Lê Thị Diệu Linh',
  'bộ phận grader 2': 'Lê Thị Diệu Linh',
  'diệu linh': 'Lê Thị Diệu Linh',
  'lê thị diệu linh': 'Lê Thị Diệu Linh',
  'grader 3': 'Nguyễn Văn Đăng Duy',
  'bộ phận grader 3': 'Nguyễn Văn Đăng Duy',
  'grader hệ thống': 'Nguyễn Văn Đăng Duy',
  'đăng duy': 'Nguyễn Văn Đăng Duy',
  'nguyễn văn đăng duy': 'Nguyễn Văn Đăng Duy',
  'minh phương': 'Huỳnh Minh Phương',
  'huỳnh minh phương': 'Huỳnh Minh Phương',
  'hoàng sa': 'Nguyễn Thị Hoàng Sa',
  'nguyễn thị hoàng sa': 'Nguyễn Thị Hoàng Sa',
};

const LEGACY_GRADER_EMAILS = new Set([
  'aca_1@gmail.com',
  'aca_2@gmail.com',
  'aca@xalo.internal',
  'grader.phuong@xalo.internal',
  'grader.sa@xalo.internal',
]);

export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function normalizeGraderName(
  raw?: string | null,
): CanonicalGraderName | '' {
  const clean = String(raw || '').trim();
  if (!clean) return '';
  if ((ACA_GRADERS as readonly string[]).includes(clean)) {
    return clean as CanonicalGraderName;
  }
  const key = clean.toLowerCase();
  if (GRADER_NAME_ALIASES[key]) return GRADER_NAME_ALIASES[key];
  for (const [alias, canonical] of Object.entries(GRADER_NAME_ALIASES)) {
    if (key.includes(alias) || alias.includes(key)) return canonical;
  }
  for (const g of ACA_GRADERS) {
    if (key === g.toLowerCase() || key.includes(g.toLowerCase())) return g;
  }
  return '';
}

/** Role GRADER hoặc token ACA cũ gắn email grader. */
export function isGraderActor(actor?: JwtPayload | null): boolean {
  if (!actor) return false;
  const role = String(actor.role || '').toUpperCase();
  if (role === 'GRADER') return true;
  const email = String(actor.email || '').trim().toLowerCase();
  return role === 'ACA' && LEGACY_GRADER_EMAILS.has(email);
}

export function resolveGraderIdentity(actor?: JwtPayload | null): string {
  if (!actor) return '';
  const email = String(actor.email || '').trim().toLowerCase();
  const name = String(actor.name || '').trim();
  if (email === 'aca_1@gmail.com') return 'Huỳnh Gia Phú';
  if (email === 'aca_2@gmail.com') return 'Lê Thị Diệu Linh';
  if (email === 'aca@xalo.internal') return 'Nguyễn Văn Đăng Duy';
  if (email === 'grader.phuong@xalo.internal') return 'Huỳnh Minh Phương';
  if (email === 'grader.sa@xalo.internal') return 'Nguyễn Thị Hoàng Sa';
  return normalizeGraderName(name) || name;
}

/** Các biến thể tên để match examTeacher / graderName / examinerName. */
export function graderNameVariants(identity: string): string[] {
  const canonical = normalizeGraderName(identity) || identity.trim();
  if (!canonical) return [];
  const set = new Set<string>([canonical]);
  const canonKey = canonical.toLowerCase();
  for (const [alias, target] of Object.entries(GRADER_NAME_ALIASES)) {
    if (target.toLowerCase() === canonKey) {
      set.add(alias);
      // Title-case nhẹ cho alias ngắn (vd. "gia phú" → giữ nguyên + bản trim)
      set.add(alias.replace(/\b\w/g, (c) => c.toUpperCase()));
    }
  }
  return [...set].filter(Boolean);
}

/**
 * Mongo filter: field ∈ variants (case-insensitive exact).
 * Nhiều field → OR giữa các field.
 */
export function graderFieldsMatchFilter(
  fields: string[],
  identity: string,
): Record<string, unknown> | null {
  const variants = graderNameVariants(identity);
  if (!variants.length || !fields.length) return null;
  const ors: Record<string, unknown>[] = [];
  for (const field of fields) {
    for (const v of variants) {
      ors.push({
        [field]: { $regex: `^${escapeRegex(v)}$`, $options: 'i' },
      });
    }
  }
  return ors.length ? { $or: ors } : null;
}

export function isAssignedToGrader(
  assignedRaw: string | undefined | null,
  graderIdentity: string,
): boolean {
  const mine =
    normalizeGraderName(graderIdentity) || graderIdentity.trim();
  if (!mine) return false;
  const assigned =
    normalizeGraderName(assignedRaw) || String(assignedRaw || '').trim();
  if (!assigned) return false;
  return assigned.toLowerCase() === mine.toLowerCase();
}
