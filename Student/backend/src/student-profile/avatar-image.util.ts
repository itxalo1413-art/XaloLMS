/** Ảnh đại diện: chỉ các định dạng ảnh thường gặp trên web. */
const ALLOWED = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
]);

export function isAllowedAvatarImageMime(mime: string | undefined): boolean {
  if (!mime) return false;
  const base = mime.toLowerCase().split(';')[0].trim();
  return ALLOWED.has(base);
}
