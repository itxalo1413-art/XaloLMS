"use client";

import * as React from "react";
import { type StudentProfile } from "@/lib/studentProfile";

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
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Đóng hồ sơ"
        onClick={onClose}
        className="absolute inset-0 bg-black/30"
      />
      <div className="relative w-full max-w-2xl rounded-2xl border border-primary/15 bg-white p-5 shadow-2xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <div className="text-lg font-black text-foreground">Hồ sơ học viên</div>
            <div className="text-xs font-medium text-muted mt-1">
              Dữ liệu đang lưu tạm ở localStorage, có thể nối API sau.
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
          <div className="md:col-span-2 flex items-center gap-4 rounded-xl border border-primary/10 bg-background/60 p-3">
            <div className="h-16 w-16 overflow-hidden rounded-2xl border border-primary/20 bg-white">
              {draft.avatarUrl ? (
                <img src={draft.avatarUrl} alt="Avatar preview" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-primary text-xl font-black">
                  {draft.name.slice(0, 1)}
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="text-[10px] font-black uppercase tracking-widest text-muted mb-1">
                Ảnh đại diện
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => void onUploadAvatar(e.target.files?.[0] ?? null)}
                disabled={uploadPending || saving}
                className="block w-full text-xs text-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white hover:file:bg-primary/90"
              />
              {uploadPending ? (
                <div className="mt-1 text-[10px] font-semibold text-muted">
                  Đang tải ảnh lên server...
                </div>
              ) : null}
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
