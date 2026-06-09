"use client";

import * as React from "react";
import { AVATAR_IMAGE_ACCEPT, isAllowedAvatarImageFile } from "@/lib/avatarImage";
import { type StudentProfile } from "@/lib/studentProfile";

const SAMPLE_AVATARS = [
  "/profile/Screenshot 2026-05-15 at 14.48.19.png",
  "/profile/Screenshot 2026-05-15 at 14.48.25.png",
  "/profile/Screenshot 2026-05-15 at 14.48.32.png",
  "/profile/Screenshot 2026-05-15 at 14.48.38.png",
  "/profile/Screenshot 2026-05-15 at 14.48.45.png",
  "/profile/Screenshot 2026-05-15 at 14.48.51.png",
] as const;

function isImageAvatarUrl(url: string) {
  if (!url) return false;
  if (url.startsWith("data:image/")) return true;
  if (url.startsWith("data:")) return false;
  return /\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(url);
}

type ProfileModalProps = {
  open: boolean;
  draft: StudentProfile;
  onChangeDraft: (key: keyof StudentProfile, value: string) => void;
  onUploadAvatar: (file: File | null) => Promise<void>;
  onClose: () => void;
  onSave: () => void;
  saving?: boolean;
  uploadPending?: boolean;
  statusMessage?: string | null;
};

export function ProfileModal({
  open,
  draft,
  onChangeDraft,
  onUploadAvatar,
  onClose,
  onSave,
  saving = false,
  uploadPending = false,
  statusMessage = null,
}: ProfileModalProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [attachedFileName, setAttachedFileName] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) setAttachedFileName(null);
  }, [open]);

  const onPickFile = (file: File | null) => {
    if (!file) return;
    if (!isAllowedAvatarImageFile(file)) {
      window.alert("Chỉ chấp nhận ảnh: JPG, PNG, GIF, WebP, SVG.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setAttachedFileName(file.name);
    void onUploadAvatar(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onPickSample = (url: string) => {
    setAttachedFileName(null);
    onChangeDraft("avatarUrl", url);
  };

  const previewFileName =
    attachedFileName ??
    (draft.avatarUrl && !isImageAvatarUrl(draft.avatarUrl) ? "File đã đính kèm" : null);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Đóng hồ sơ"
        onClick={onClose}
        className="absolute inset-0 bg-black/30"
      />
      <div className="relative w-full max-w-2xl rounded-2xl border border-primary/15 bg-card p-5 shadow-2xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <div className="text-lg font-black text-foreground">Hồ sơ học viên</div>
            <div className="mt-1 text-xs font-medium text-muted">
              Hồ sơ được lưu trên server theo tài khoản đăng nhập.
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-zinc-500 hover:bg-zinc-100"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2 space-y-4 rounded-xl border border-primary/10 bg-background/60 p-4">
            <div className="flex items-start gap-4">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-primary/20 bg-white">
                {draft.avatarUrl && isImageAvatarUrl(draft.avatarUrl) ? (
                  <img src={draft.avatarUrl} alt="Avatar preview" className="h-full w-full object-cover" />
                ) : draft.avatarUrl || previewFileName ? (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-primary/5 p-2 text-center">
                    <svg className="h-7 w-7 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                      <path d="M14 3v6h6" />
                    </svg>
                    <span className="line-clamp-2 text-[9px] font-bold leading-tight text-foreground">
                      {previewFileName ?? "File đã chọn"}
                    </span>
                  </div>
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xl font-black text-primary">
                    {draft.name.slice(0, 1)}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-black uppercase tracking-widest text-muted">
                  Ảnh đại diện
                </div>
                <p className="mt-1 text-xs font-medium text-muted">
                  Chọn ảnh mẫu bên dưới hoặc tải ảnh từ máy (JPG, PNG, GIF, WebP, SVG).
                </p>
                {previewFileName ? (
                  <p className="mt-2 truncate text-xs font-bold text-foreground">
                    Đã chọn: {previewFileName}
                  </p>
                ) : null}
                {uploadPending ? (
                  <p className="mt-2 text-[10px] font-semibold text-muted">Đang tải file lên server...</p>
                ) : null}
              </div>
            </div>

            <div>
              <div className="mb-2 text-[10px] font-black uppercase tracking-widest text-muted">
                Ảnh đại diện mẫu
              </div>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {SAMPLE_AVATARS.map((url, idx) => (
                  <button
                    key={url}
                    type="button"
                    disabled={uploadPending || saving}
                    onClick={() => onPickSample(url)}
                    className={`aspect-square overflow-hidden rounded-xl border-2 transition-all hover:scale-105 disabled:opacity-50 ${
                      draft.avatarUrl === url
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-zinc-100 hover:border-primary/40"
                    }`}
                  >
                    <img src={url} alt={`Mẫu ${idx + 1}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-zinc-100 pt-4">
              <input
                ref={fileInputRef}
                type="file"
                accept={AVATAR_IMAGE_ACCEPT}
                className="hidden"
                disabled={uploadPending || saving}
                onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
              />
              <button
                type="button"
                disabled={uploadPending || saving}
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-primary/30 bg-primary/5 px-4 py-3 text-xs font-bold text-primary transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                {uploadPending ? "Đang tải..." : "Tải ảnh từ máy"}
              </button>
              <p className="mt-2 text-[10px] font-medium text-muted">
                JPG, PNG, GIF, WebP hoặc SVG — tối đa theo giới hạn của trình duyệt.
              </p>
            </div>
          </div>

          <label className="block">
            <div className="mb-1 text-[10px] font-black uppercase tracking-widest text-muted">Họ tên</div>
            <input
              value={draft.name}
              onChange={(e) => onChangeDraft("name", e.target.value)}
              className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-primary/40"
            />
          </label>
          <label className="block">
            <div className="mb-1 text-[10px] font-black uppercase tracking-widest text-muted">Email</div>
            <input
              value={draft.email}
              onChange={(e) => onChangeDraft("email", e.target.value)}
              className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-primary/40"
            />
          </label>
          <label className="block">
            <div className="mb-1 text-[10px] font-black uppercase tracking-widest text-muted">Số điện thoại</div>
            <input
              value={draft.phone}
              onChange={(e) => onChangeDraft("phone", e.target.value)}
              className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-primary/40"
            />
          </label>
          <label className="block">
            <div className="mb-1 text-[10px] font-black uppercase tracking-widest text-muted">Ngày sinh</div>
            <input
              value={draft.dob}
              onChange={(e) => onChangeDraft("dob", e.target.value)}
              className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-primary/40"
            />
          </label>
          <label className="block md:col-span-2">
            <div className="mb-1 text-[10px] font-black uppercase tracking-widest text-muted">Cung hoàng đạo</div>
            <input
              value={draft.zodiac}
              onChange={(e) => onChangeDraft("zodiac", e.target.value)}
              className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-primary/40"
            />
          </label>
        </div>
        {statusMessage ? (
          <div className="mt-4 rounded-lg border border-primary/15 bg-primary/5 px-3 py-2 text-xs font-medium text-muted">
            {statusMessage}
          </div>
        ) : null}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving || uploadPending}
            className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving || uploadPending}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90"
          >
            {saving ? "Đang lưu..." : "Lưu hồ sơ"}
          </button>
        </div>
      </div>
    </div>
  );
}
