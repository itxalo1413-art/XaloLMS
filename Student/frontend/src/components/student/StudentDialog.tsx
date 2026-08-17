"use client";

import * as React from "react";
import { createPortal } from "react-dom";

export type StudentDialogTone = "info" | "success" | "warning";
export type StudentDialogSize = "md" | "lg" | "xl" | "2xl";

type StudentDialogProps = {
  open: boolean;
  title: string;
  children?: React.ReactNode;
  message?: string;
  tone?: StudentDialogTone;
  variant?: "alert" | "confirm";
  position?: "top" | "center";
  size?: StudentDialogSize;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onClose: () => void;
};

const TONE_STYLES: Record<
  StudentDialogTone,
  { ring: string; iconBg: string; icon: React.ReactNode }
> = {
  info: {
    ring: "border-primary/20",
    iconBg: "bg-primary/10 text-primary",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4M12 8h.01" />
      </svg>
    ),
  },
  success: {
    ring: "border-success/25",
    iconBg: "bg-success/10 text-success",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
        <path d="M20 6L9 17l-5-5" />
      </svg>
    ),
  },
  warning: {
    ring: "border-secondary/25",
    iconBg: "bg-secondary/10 text-secondary",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
        <path d="M12 9v4M12 17h.01" />
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      </svg>
    ),
  },
};

const SIZE_CLASSES: Record<StudentDialogSize, string> = {
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
};

export function StudentDialog({
  open,
  title,
  message,
  children,
  tone = "info",
  variant = "alert",
  position = "center",
  size = "2xl",
  confirmLabel = "Xác nhận",
  cancelLabel = "Huỷ",
  onConfirm,
  onClose,
}: StudentDialogProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !mounted) return null;

  const styles = TONE_STYLES[tone];
  const isConfirm = variant === "confirm";
  const isTop = position === "top";
  const sizeClass = SIZE_CLASSES[size] || "max-w-2xl";

  const dialogNode = (
    <div
      className={`fixed inset-0 z-[100] flex justify-center p-4 overflow-y-auto ${
        isTop ? "items-start py-12 sm:py-16 md:py-20" : "items-center"
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="student-dialog-title"
    >
      <button
        type="button"
        aria-label="Đóng"
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-[3px]"
      />
      <div
        className={`relative w-full ${sizeClass} rounded-2xl border bg-card p-6 sm:p-7 shadow-2xl ${styles.ring}`}
      >
        <div className="flex gap-4">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${styles.iconBg}`}
          >
            {styles.icon}
          </div>
          <div className="min-w-0 flex-1">
            <h2
              id="student-dialog-title"
              className="text-base font-black text-foreground"
            >
              {title}
            </h2>
            {message ? (
              <p className="mt-2 text-sm font-medium leading-relaxed text-muted whitespace-pre-line">
                {message}
              </p>
            ) : null}
            {children ? <div className="mt-3.5">{children}</div> : null}
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {isConfirm ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="h-10 rounded-xl border border-primary/15 bg-white px-4 text-[10px] font-black uppercase tracking-widest text-muted transition-colors hover:bg-background"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="h-10 rounded-xl bg-primary px-4 text-[10px] font-black uppercase tracking-widest text-white shadow-sm transition-all hover:bg-primary/90"
              >
                {confirmLabel}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-xl bg-primary px-5 text-[10px] font-black uppercase tracking-widest text-white shadow-sm transition-all hover:bg-primary/90 sm:ml-auto"
            >
              Đã hiểu
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(dialogNode, document.body);
}
