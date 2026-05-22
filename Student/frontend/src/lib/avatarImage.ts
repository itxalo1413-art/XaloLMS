/** Ảnh đại diện: JPEG, PNG, GIF, WebP, SVG (khớp backend). */
export const AVATAR_IMAGE_ACCEPT =
  "image/jpeg,image/png,image/gif,image/webp,image/svg+xml,.jpg,.jpeg,.png,.gif,.webp,.svg";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
]);

export function isAllowedAvatarImageFile(file: File): boolean {
  const t = file.type?.toLowerCase();
  if (t && ALLOWED_TYPES.has(t)) return true;
  if (t) return false;
  return /\.(jpe?g|png|gif|webp|svg)$/i.test(file.name);
}
