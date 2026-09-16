"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  createFinalTestRecord,
  listMyFinalTestRecords,
  cancelFinalTestRecord,
  type FinalTestRecord,
} from "@/lib/finalTestArchive";
import { confirmDialog } from "@/components/shared/ConfirmDialog";

interface FinalLrwBookingModalProps {
  open: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
  studentPhone?: string;
  studentEmail?: string;
  targetBand?: string;
  onSuccess?: () => void;
}

const DAY_NAMES = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const MONTH_NAMES = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
  "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
];

function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function FinalLrwBookingModal({
  open,
  onClose,
  studentId,
  studentName,
  studentPhone,
  studentEmail,
  targetBand = "",
  onSuccess,
}: FinalLrwBookingModalProps) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [calMonth, setCalMonth] = useState(() => ({
    month: today.getMonth(),
    year: today.getFullYear(),
  }));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const format = "online";
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [myFinalTests, setMyFinalTests] = useState<FinalTestRecord[]>([]);

  const loadFinalTests = async () => {
    try {
      const records = await listMyFinalTestRecords({ id: studentId, name: studentName });
      setMyFinalTests(records || []);
    } catch {
      setMyFinalTests([]);
    }
  };

  useEffect(() => {
    if (open) {
      void loadFinalTests();
      setSelectedDate(null);
      setError(null);
    }
  }, [open, studentId, studentName]);

  const activeLrwBooking = useMemo(() => {
    return myFinalTests.find(
      (r) =>
        (r.testType === "lr" || r.testType === "writing" || r.testType === "full_4_skills") &&
        r.status !== "graded" &&
        r.status !== "cancelled",
    );
  }, [myFinalTests]);

  const handleCancelExisting = async () => {
    if (!activeLrwBooking) return;
    const ok = await confirmDialog({
      title: "Hủy ca thi Listening / Reading / Writing",
      message: "Bạn có chắc chắn muốn hủy ca thi Final Listening / Reading / Writing hiện tại để chọn ngày mới không?",
      confirmText: "Đồng ý hủy",
      cancelText: "Giữ lịch thi",
      variant: "warning",
    });
    if (!ok) return;
    setCancelling(true);
    setError(null);
    try {
      await cancelFinalTestRecord(activeLrwBooking.id);
      await loadFinalTests();
      setSelectedDate(null);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || "Không thể hủy ca thi. Vui lòng thử lại.");
    } finally {
      setCancelling(false);
    }
  };

  if (!open) return null;

  function buildCalendarDays(month: number, year: number): (Date | null)[] {
    const first = new Date(year, month, 1);
    const startDow = (first.getDay() + 6) % 7; // Mon=0
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (Date | null)[] = Array(startDow).fill(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }

  const handleSubmit = async () => {
    setError(null);
    if (!selectedDate) {
      setError("Vui lòng chọn ngày thi trên lịch.");
      return;
    }
    setSubmitting(true);
    try {
      const dateStr = toIsoDate(selectedDate);
      const shared = {
        candidateName: studentName,
        candidatePhone: studentPhone || "",
        candidateEmail: studentEmail || "",
        studentId,
        format,
        examinerName: "ACA / Hội đồng khảo thí",
        date: dateStr,
        examDate: dateStr,
        time: "09:00",
        targetBand,
      } as const;

      await createFinalTestRecord({
        ...shared,
        testType: "lr",
        note: "Final Test Listening · Reading · Writing",
      });

      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Đăng ký thất bại. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  function renderMiniCalendar(month: number, year: number) {
    const cells = buildCalendarDays(month, year);
    return (
      <div>
        <div className="text-xs font-black text-center text-zinc-700 mb-2">
          {MONTH_NAMES[month]} {year}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((d) => (
            <div key={d} className="text-[9px] font-bold text-zinc-400 text-center py-1 select-none">
              {d}
            </div>
          ))}
          {cells.map((date, i) => {
            if (!date) return <div key={i} className="h-8" />;
            const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
            const isPast = date < today;
            const isSelected =
              selectedDate !== null && date.toDateString() === selectedDate.toDateString();
            const isToday = date.toDateString() === today.toDateString();
            return (
              <button
                key={key}
                type="button"
                disabled={isPast}
                onClick={() => setSelectedDate(date)}
                className={`relative flex h-8 w-full flex-col items-center justify-center rounded-lg text-[11px] font-bold select-none transition-colors duration-150 ${
                  isPast
                    ? "text-zinc-300 cursor-not-allowed bg-transparent"
                    : "hover:bg-sky-50 cursor-pointer"
                } ${
                  isSelected
                    ? "bg-sky-600 text-white shadow-sm font-black hover:bg-sky-600"
                    : isToday
                      ? "ring-1 ring-sky-400/50 text-sky-700 bg-sky-50/50"
                      : "text-zinc-700"
                }`}
              >
                <span>{date.getDate()}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const modalNode = (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Đóng"
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
      />
      <div className="relative z-10 w-full max-w-lg rounded-3xl border border-zinc-200 bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 bg-sky-50/60 shrink-0">
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-sky-700">
              Final Test · 3 kỹ năng
            </div>
            <h3 className="text-sm font-black text-zinc-900 mt-0.5">
              Đăng ký Listening · Reading · Writing
            </h3>
            <p className="text-[11px] text-zinc-500 font-medium mt-0.5">
              Chọn ngày trên lịch — không gồm Speaking 1-1
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-white text-zinc-400 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="px-5 py-4 space-y-4 overflow-y-auto">
          {error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
              {error}
            </div>
          ) : null}

          {activeLrwBooking ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50/90 to-amber-100/40 p-4">
                <div className="flex items-center gap-2 text-amber-900">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-white font-black text-[11px]">
                    !
                  </span>
                  <h3 className="text-xs font-black uppercase tracking-wide">
                    Bạn đã có lịch đăng ký Final Test L·R·W
                  </h3>
                </div>
                <p className="mt-2 text-[11px] font-medium text-amber-950 leading-relaxed">
                  Mỗi học viên chỉ được đăng ký tối đa <strong>1 ca Final Test L·R·W</strong>. Nếu bạn muốn đổi ngày thi khác, vui lòng <strong>hủy ca thi hiện tại</strong> trước.
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                    Trạng thái ca thi
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 border border-sky-200 px-3 py-0.5 text-xs font-black text-sky-800">
                    <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-pulse" />
                    Đã xếp lịch thi
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl bg-zinc-50 p-3 border border-zinc-100">
                    <span className="text-[10px] font-bold text-zinc-400 block uppercase">Ngày thi</span>
                    <span className="font-black text-zinc-900 mt-0.5 block text-sm">
                      {activeLrwBooking.date || `${activeLrwBooking.day}/${activeLrwBooking.month + 1}/${activeLrwBooking.year}`}
                    </span>
                  </div>
                  <div className="rounded-xl bg-zinc-50 p-3 border border-zinc-100">
                    <span className="text-[10px] font-bold text-zinc-400 block uppercase">Bài thi</span>
                    <span className="font-black text-sky-800 mt-0.5 block text-sm">
                      Listening · Reading · Writing
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleCancelExisting}
                  disabled={cancelling}
                  className="w-full rounded-xl bg-rose-600 py-3 text-xs font-black uppercase tracking-wider text-white hover:bg-rose-700 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {cancelling ? "Đang hủy ca thi..." : "Hủy ca thi này để chọn ngày khác"}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50 p-3.5 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 font-medium">Thí sinh:</span>
                  <span className="font-bold text-zinc-900">{studentName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 font-medium">Bài thi:</span>
                  <span className="font-bold text-sky-800">Listening · Reading · Writing</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 font-medium">Hình thức:</span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-sky-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-sky-800">
                    Online
                  </span>
                </div>
              </div>

              {/* Calendar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-black uppercase tracking-wider text-zinc-700">
                    Chọn ngày thi
                  </label>
                  {selectedDate ? (
                    <span className="text-[11px] font-bold text-sky-700">
                      {DAY_NAMES[selectedDate.getDay()]}{" "}
                      {selectedDate.getDate()}/{selectedDate.getMonth() + 1}/{selectedDate.getFullYear()}
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium text-zinc-400">Chưa chọn</span>
                  )}
                </div>

                <div className="flex items-center justify-between mb-2">
                  <button
                    type="button"
                    onClick={() => {
                      const prev = new Date(calMonth.year, calMonth.month - 1, 1);
                      setCalMonth({ month: prev.getMonth(), year: prev.getFullYear() });
                    }}
                    className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-zinc-100 text-zinc-500 cursor-pointer"
                  >
                    ‹
                  </button>
                  <span className="text-xs font-black text-zinc-600">
                    {MONTH_NAMES[calMonth.month]} {calMonth.year}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const next = new Date(calMonth.year, calMonth.month + 1, 1);
                      setCalMonth({ month: next.getMonth(), year: next.getFullYear() });
                    }}
                    className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-zinc-100 text-zinc-500 cursor-pointer"
                  >
                    ›
                  </button>
                </div>

                <div className="rounded-2xl border border-zinc-100 bg-white p-3">
                  {renderMiniCalendar(calMonth.month, calMonth.year)}
                </div>

                <div className="mt-3 pt-3 border-t border-zinc-100">
                  {(() => {
                    const next = new Date(calMonth.year, calMonth.month + 1, 1);
                    return (
                      <div className="rounded-2xl border border-zinc-100 bg-zinc-50/50 p-3">
                        {renderMiniCalendar(next.getMonth(), next.getFullYear())}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="border-t border-zinc-100 px-5 py-4 flex gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting || cancelling}
            className="flex-1 h-11 rounded-xl border border-zinc-200 text-sm font-bold text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 cursor-pointer"
          >
            Đóng
          </button>
          {!activeLrwBooking && (
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={submitting || !selectedDate}
              className="flex-1 h-11 rounded-xl bg-sky-600 text-sm font-black text-white hover:bg-sky-500 disabled:opacity-50 shadow-sm cursor-pointer"
            >
              {submitting ? "Đang đăng ký..." : "Xác nhận đăng ký"}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return typeof window !== "undefined" ? createPortal(modalNode, document.body) : null;
}
