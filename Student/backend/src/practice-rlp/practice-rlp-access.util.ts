import { ForbiddenException } from '@nestjs/common';

/** GV chỉ Minh Tâm được sửa Practice RLP; ACA full. */
export function assertCanEditPracticeRlp(user?: {
  role?: string;
  name?: string;
  email?: string;
}): void {
  const role = String(user?.role || '').toUpperCase();
  if (role === 'ACA') return;
  if (role === 'GV') {
    const name = String(user?.name || '').toLowerCase();
    const email = String(user?.email || '').toLowerCase();
    const isMinhTam =
      name.includes('minh tâm') ||
      name.includes('minh tam') ||
      email.includes('minhtam');
    if (isMinhTam) return;
  }
  throw new ForbiddenException(
    'Chỉ Học vụ hoặc GV Minh Tâm mới được chỉnh RLP lớp luyện đề.',
  );
}
