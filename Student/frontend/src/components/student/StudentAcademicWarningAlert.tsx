"use client";

import React, { useEffect, useState } from "react";
import { getStudentIdentity } from "@/lib/studentIdentity";
import {
  getStudentAcademicWarning,
  dismissStudentWarning,
  ACADEMIC_WARNING_UPDATE_EVENT,
  type AcademicWarningRecord,
} from "@/lib/academicWarningStore";

export function StudentAcademicWarningAlert() {
  const [warning, setWarning] = useState<AcademicWarningRecord | null>(null);
  const [isOpen, setIsOpen] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

  const student = getStudentIdentity();

  const loadWarning = React.useCallback(async () => {
    try {
      const w = await getStudentAcademicWarning(student.id, student.name);
      if (w && w.notificationSentToStudent && !w.studentNotificationDismissed) {
        setWarning(w);
        setIsOpen(true);
        setIsMinimized(false);
      } else {
        setWarning(null);
        setIsOpen(false);
      }
    } catch (err) {
      console.error("Failed to load academic warning for student", err);
    }
  }, [student.id, student.name]);

  useEffect(() => {
    void loadWarning();
    const onUpdate = () => void loadWarning();
    window.addEventListener(ACADEMIC_WARNING_UPDATE_EVENT, onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener(ACADEMIC_WARNING_UPDATE_EVENT, onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, [loadWarning]);

  if (!warning) return null;

  const hasAbsentExceeded = warning.warningTypes.includes("absent_exceeded");
  const hasAbsentNotice = warning.warningTypes.includes("absent_notice");
  const hasHomeworkWarning = warning.warningTypes.includes("homework_insufficient");
  const customMessage = warning.notificationMessage?.trim();

  const handleDismiss = () => {
    setIsMinimized(true);
    void dismissStudentWarning(warning.id);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[120] flex flex-col items-end pointer-events-auto">
      {isOpen && !isMinimized && (
        <div className="mb-3 w-[360px] max-w-[calc(100vw-32px)] rounded-3xl border border-rose-200/90 bg-white p-4 shadow-2xl animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-rose-500 to-amber-500 text-white font-black text-xs shadow-sm">
                  XLE
                </div>
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-black text-zinc-900 leading-none">
                    Học Vụ XLE
                  </h4>
                </div>
                <div className="text-[10px] text-zinc-400 font-medium mt-0.5">
                  Tin nhắn cảnh báo học vụ • Vừa xong
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDismiss}
              className="rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors"
              title="Thu nhỏ tin nhắn"
            >
              ✕
            </button>
          </div>

          <div className="mt-3 space-y-2.5 text-xs text-zinc-700 leading-relaxed">
            <div className="rounded-2xl rounded-tl-sm bg-zinc-100/80 p-3 text-zinc-800">
              Chào <strong>{warning.studentName}</strong>, hệ thống ghi nhận tiến độ
              học tập của bạn tại lớp <strong>{warning.className}</strong> có một số
              lưu ý cần cải thiện:
            </div>

            {customMessage ? (
              <div className="rounded-2xl rounded-tl-sm bg-rose-50/90 border border-rose-200 p-3 text-rose-950 whitespace-pre-wrap">
                {customMessage}
              </div>
            ) : (
              <div className="rounded-2xl rounded-tl-sm bg-rose-50/90 border border-rose-200 p-3 space-y-2 text-rose-950">
                {(hasAbsentExceeded || hasAbsentNotice) && (
                  <div className="flex items-start gap-2">
                    <span className="text-rose-600 font-black text-sm leading-none mt-0.5">
                      •
                    </span>
                    <div>
                      <span className="font-bold text-rose-700">Chuyên cần:</span>{" "}
                      Bạn đã vắng <strong>{warning.absentCount} buổi</strong>
                      {hasAbsentNotice && !hasAbsentExceeded
                        ? " — đây là nhắc nhở sớm (buổi vắng thứ 3). Từ buổi thứ 4 học vụ sẽ theo dõi và liên hệ bạn."
                        : " (từ buổi vắng thứ 4 trở đi học vụ theo dõi trên bảng cảnh báo)."}
                    </div>
                  </div>
                )}

                {hasHomeworkWarning && (
                  <div className="flex items-start gap-2">
                    <span className="text-amber-600 font-black text-sm leading-none mt-0.5">
                      •
                    </span>
                    <div>
                      <span className="font-bold text-amber-800">
                        Bài tập về nhà:
                      </span>{" "}
                      Bạn còn{" "}
                      <strong>
                        {Math.max(
                          0,
                          warning.homeworkTotal - warning.homeworkSubmitted,
                        )}{" "}
                        deadline
                      </strong>{" "}
                      đã tới hạn nhưng chưa hoàn thành (ngưỡng từ 4 deadline chưa nộp).
                      Đã nộp {warning.homeworkSubmitted}/{warning.homeworkTotal} bài
                      có deadline ≤ hôm nay.
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="rounded-2xl rounded-tl-sm bg-zinc-100/80 p-3 text-zinc-700 text-[11px]">
              Bạn lưu ý theo dõi bài học và học bù để đảm bảo chuẩn đầu ra nhé. Học
              viện luôn sẵn sàng đồng hành và hỗ trợ bạn!
            </div>
          </div>

          <div className="mt-3.5 pt-2 border-t border-zinc-100 flex items-center justify-end">
            <button
              type="button"
              onClick={handleDismiss}
              className="w-full py-2 rounded-xl bg-primary hover:bg-[#6a5acd] text-white text-xs font-black transition-all shadow-sm active:scale-95 text-center cursor-pointer"
            >
              Đã đọc tin nhắn ✓
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          setIsMinimized(!isMinimized);
          if (isMinimized) setIsOpen(true);
        }}
        className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-primary to-[#6a5acd] text-white shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer ring-4 ring-white"
        aria-label="Mở tin nhắn cảnh báo"
      >
        <svg
          className="h-7 w-7 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
          />
        </svg>
        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-[10px] font-black text-white ring-2 ring-white shadow-sm animate-bounce">
          1
        </span>
      </button>
    </div>
  );
}
