"use client";

import React, { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

export type ConfirmVariant = "danger" | "warning" | "primary";

export interface ConfirmDialogOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
}

interface DialogState extends ConfirmDialogOptions {
  isOpen: boolean;
  resolve: (value: boolean) => void;
}

const CONFIRM_EVENT = "xalo-global-confirm-dialog";

export function confirmDialog(options: ConfirmDialogOptions | string): Promise<boolean> {
  const opts: ConfirmDialogOptions =
    typeof options === "string" ? { message: options } : options;

  return new Promise<boolean>((resolve) => {
    if (typeof window === "undefined") {
      resolve(true);
      return;
    }
    const event = new CustomEvent(CONFIRM_EVENT, {
      detail: { ...opts, resolve },
    });
    window.dispatchEvent(event);
  });
}

export function GlobalConfirmDialog() {
  const [state, setState] = useState<DialogState | null>(null);

  useEffect(() => {
    const handleEvent = (e: Event) => {
      const customEvent = e as CustomEvent<DialogState>;
      setState({
        ...customEvent.detail,
        isOpen: true,
      });
    };

    window.addEventListener(CONFIRM_EVENT, handleEvent);
    return () => window.removeEventListener(CONFIRM_EVENT, handleEvent);
  }, []);

  const handleClose = useCallback((result: boolean) => {
    if (state?.resolve) {
      state.resolve(result);
    }
    setState(null);
  }, [state]);

  // Handle ESC key
  useEffect(() => {
    if (!state?.isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose(false);
      } else if (e.key === "Enter") {
        handleClose(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state, handleClose]);

  if (!state || !state.isOpen) return null;

  const variant = state.variant || "danger";
  const title = state.title || (variant === "danger" ? "Xác nhận xóa" : "Xác nhận thao tác");
  const confirmText = state.confirmText || (variant === "danger" ? "Đồng ý xóa" : "Xác nhận");
  const cancelText = state.cancelText || "Hủy bỏ";

  const isDanger = variant === "danger";
  const isWarning = variant === "warning";

  const content = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150 select-none">
      <div
        className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white p-6 shadow-2xl border border-zinc-100 animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start gap-4">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
              isDanger
                ? "bg-rose-100 text-rose-600"
                : isWarning
                ? "bg-amber-100 text-amber-600"
                : "bg-primary/10 text-primary"
            }`}
          >
            {isDanger ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            ) : isWarning ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>

          <div className="flex-1 min-w-0 pt-0.5">
            <h3 className="text-base font-black text-zinc-900 leading-snug">
              {title}
            </h3>
            <p className="mt-2 text-xs font-medium text-zinc-600 leading-relaxed break-words whitespace-pre-line">
              {state.message}
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-zinc-100">
          <button
            type="button"
            onClick={() => handleClose(false)}
            className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors cursor-pointer shadow-2xs"
          >
            {cancelText}
          </button>
          <button
            type="button"
            autoFocus
            onClick={() => handleClose(true)}
            className={`rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-sm transition-all cursor-pointer ${
              isDanger
                ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20"
                : isWarning
                ? "bg-amber-600 hover:bg-amber-700 shadow-amber-600/20"
                : "bg-primary hover:bg-primary/90 shadow-primary/20"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(content, document.body);
}
