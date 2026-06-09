"use client";

import { createPortal } from "react-dom";
import { useEffect, useState, type ReactNode } from "react";
import type { InstructorPublicProfile } from "@/lib/courseInstructorProfile";

type Props = {
  open: boolean;
  profile: InstructorPublicProfile | null;
  onClose: () => void;
};

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="border-b border-primary/5 py-3 last:border-0 last:pb-0">
      <div className="text-[10px] font-black uppercase tracking-widest text-muted">{label}</div>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

export function InstructorProfileDialog({ open, profile, onClose }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!mounted || !open || !profile) return null;

  const initials =
    profile.name
      .split(" ")
      .filter(Boolean)
      .slice(-2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "GV";

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="instructor-profile-title"
    >
      <button
        type="button"
        aria-label="Đóng"
        onClick={onClose}
        className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
      />

      <div
        className="relative z-10 flex max-h-[min(85vh,640px)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-primary/10 bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-primary/10 bg-background/40 px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-black text-primary">
              {initials}
            </div>
            <div className="min-w-0">
              <h2 id="instructor-profile-title" className="truncate text-base font-black text-foreground">
                {profile.name}
              </h2>
              <p className="text-xs font-bold text-primary">{profile.title}</p>
              <p className="text-[11px] font-semibold text-muted">IELTS {profile.ieltsBand}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="shrink-0 rounded-lg p-1.5 text-muted transition-colors hover:bg-zinc-100 hover:text-foreground"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-1">
          <Row label="Liên hệ">
            <p className="text-sm font-semibold text-foreground">{profile.email}</p>
            <p className="mt-0.5 text-sm font-semibold text-foreground">{profile.phone}</p>
          </Row>

          <Row label="Kỹ năng phụ trách">
            <div className="flex flex-wrap gap-1.5">
              {profile.specialties.map((s) => (
                <span
                  key={s}
                  className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary"
                >
                  {s}
                </span>
              ))}
            </div>
          </Row>

          <Row label="Kinh nghiệm">
            <p className="text-sm font-medium leading-relaxed text-foreground">{profile.experience}</p>
          </Row>

          {profile.certifications.length > 0 ? (
            <Row label="Chứng chỉ">
              <p className="text-sm font-medium leading-relaxed text-foreground">
                {profile.certifications.join(" · ")}
              </p>
            </Row>
          ) : null}

          <Row label="Giới thiệu">
            <p className="text-sm font-medium leading-relaxed text-foreground">{profile.bio}</p>
          </Row>
        </div>

        <div className="border-t border-primary/10 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="h-10 w-full rounded-xl bg-primary text-[10px] font-black uppercase tracking-widest text-white hover:bg-primary/90"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
