"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  fetchAcaFreeSlots,
  type AcaFreeSlot,
} from "@/lib/acaManagementApi";
import {
  getMockTestTeacherOptions,
  MOCK_TEST_TEACHER_OPTIONS_EVENT,
  syncMockTestTeacherOptions,
} from "@/lib/mockTestTeacherNames";
import { getGraderMeetLink } from "@/lib/graderMeetLinks";
import {
  createEntranceTestBooking,
  type EntranceTestFormat,
  type EntranceTestType,
} from "@/lib/entranceTestBookings";

interface EntranceBookingModalProps {
  initialGrader?: string;
  initialType?: EntranceTestType;
  /** Khi true: khóa loại bài theo initialType, ẩn tab Speaking/Writing trong form */
  lockType?: boolean;
  initialDate?: string; // YYYY-MM-DD
  initialTime?: string; // HH:mm
  initialSlotId?: string;
  initialFormat?: EntranceTestFormat;
  onClose: () => void;
  onSuccess: () => void;
}

export function EntranceBookingModal({
  initialGrader,
  initialType = "speaking",
  lockType = false,
  initialDate,
  initialTime,
  initialSlotId,
  initialFormat = "online",
  onClose,
  onSuccess,
}: EntranceBookingModalProps) {
  const [freeSlots, setFreeSlots] = useState<AcaFreeSlot[]>([]);

  const [candidateName, setCandidateName] = useState("");
  const [candidatePhone, setCandidatePhone] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");
  const [teacherOptions, setTeacherOptions] = useState<string[]>(() => getMockTestTeacherOptions());

  const [testType, setTestType] = useState<EntranceTestType>(initialType);
  const [format, setFormat] = useState<EntranceTestFormat>(initialFormat);
  const [grader, setGrader] = useState<string>(initialGrader || getMockTestTeacherOptions()[0] || "Grader");

  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, []);

  const [testDate, setTestDate] = useState<string>(initialDate || todayStr);
  const [testTime, setTestTime] = useState<string>(initialTime || "19:00");
  const [slotId, setSlotId] = useState<string | undefined>(initialSlotId);

  const [meetLink, setMeetLink] = useState("");
  const [examLink, setExamLink] = useState("");
  const [submissionLink, setSubmissionLink] = useState("");
  const [note, setNote] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchAcaFreeSlots().then((res) => {
      if (res && res.length > 0) setFreeSlots(res);
    });
  }, []);

  useEffect(() => {
    void syncMockTestTeacherOptions().then((rows) => {
      setTeacherOptions(rows);
      setGrader((current) => current || initialGrader || rows[0] || "Grader");
    });
    const onUpdate = () => {
      const rows = getMockTestTeacherOptions();
      setTeacherOptions(rows);
      setGrader((current) => current || initialGrader || rows[0] || "Grader");
    };
    window.addEventListener(MOCK_TEST_TEACHER_OPTIONS_EVENT, onUpdate);
    return () => window.removeEventListener(MOCK_TEST_TEACHER_OPTIONS_EVENT, onUpdate);
  }, [initialGrader]);

  // Update Meet link when Grader changes
  useEffect(() => {
    const link = getGraderMeetLink(grader);
    if (link) setMeetLink(link);
  }, [grader]);

  // Available free slots for selected grader & date
  const availableSlotsForDate = useMemo(() => {
    if (!testDate) return [];
    const dateObj = new Date(testDate);
    const d = dateObj.getDate();
    const m = dateObj.getMonth();
    const y = dateObj.getFullYear();

    return freeSlots.filter(
      (s) =>
        s.day === d &&
        s.month === m &&
        s.year === y &&
        (s.teacherName ?? "").trim().toLowerCase() === grader.trim().toLowerCase() &&
        s.status !== "booked"
    );
  }, [freeSlots, testDate, grader]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!candidateName.trim()) {
      setError("Vui lòng nhập tên ứng viên.");
      return;
    }
    if (!candidatePhone.trim()) {
      setError("Vui lòng nhập số điện thoại ứng viên.");
      return;
    }
    if (testType === "speaking") {
      if (!grader.trim()) {
        setError("Vui lòng chọn Grader chấm bài.");
        return;
      }
      if (!testDate) {
        setError("Vui lòng chọn ngày thi.");
        return;
      }
      if (!testTime) {
        setError("Vui lòng chọn giờ thi Speaking.");
        return;
      }
    }
    if (testType === "writing" && !submissionLink.trim()) {
      setError("Vui lòng dán link bài làm Writing (Google Docs).");
      return;
    }

    setSubmitting(true);
    try {
      const today = new Date();
      const dateStr =
        testType === "writing"
          ? `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
          : testDate;
      await createEntranceTestBooking({
        candidateName,
        candidatePhone,
        candidateEmail,
        type: testType,
        format: testType === "writing" ? "online" : format,
        // Writing: hệ thống tự phân Grader — không gửi tên grader Sale chọn
        graderName: testType === "writing" ? "" : grader,
        date: dateStr,
        time: testType === "writing" ? "00:00" : testTime || "19:00",
        meetLink: testType === "speaking" && format === "online" ? meetLink : undefined,
        examLink: testType === "speaking" ? examLink : undefined,
        submissionLink: testType === "writing" || testType === "both" ? submissionLink.trim() : undefined,
        note,
        slotId: testType === "speaking" ? slotId : undefined,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || "Đặt lịch thất bại. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Đóng"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-xs"
      />
      <div className="relative w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/70">
          <div className="flex items-center gap-3">
            <div
              className={`h-9 w-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                testType === "speaking"
                  ? "bg-primary/10 border border-primary/20 text-primary"
                  : "bg-sky-50 border border-sky-200 text-sky-700"
              }`}
            >
              {testType === "speaking" ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              )}
            </div>
            <div>
              <h2 className="text-base font-black text-zinc-900">
                {testType === "speaking" ? "Đặt Lịch Test Speaking Với Grader" : "Nộp bài Writing Entrance"}
              </h2>
              <p className="text-xs text-zinc-500 font-medium">
                {testType === "speaking"
                  ? "Xếp ca phỏng vấn 1-1 trực tiếp qua Google Meet hoặc tại trung tâm"
                  : "Dán link Google Docs bài làm — hệ thống tự phân chia Grader chấm (giống học viên)"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700 flex items-center gap-2">
              <svg className="h-4 w-4 shrink-0 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Candidate Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                Tên ứng viên <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                placeholder="VD: Nguyễn Văn A"
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/40 px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                Số điện thoại <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={candidatePhone}
                onChange={(e) => setCandidatePhone(e.target.value)}
                placeholder="VD: 0901 234 567"
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/40 px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all font-medium"
              />
            </div>
          </div>

          {/* Type Selector Tabs — chỉ hiện khi chưa khóa loại */}
          {!lockType && (
          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1.5">
              Loại bài Test Entrance <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-zinc-100 border border-zinc-200/80 text-xs font-bold">
              <button
                type="button"
                onClick={() => setTestType("speaking")}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg transition-all cursor-pointer ${
                  testType === "speaking"
                    ? "bg-primary text-white font-black shadow-sm"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                <span>Test Speaking 1-1</span>
              </button>
              <button
                type="button"
                onClick={() => setTestType("writing")}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg transition-all cursor-pointer ${
                  testType === "writing"
                    ? "bg-sky-600 text-white font-black shadow-sm"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                <span>Nộp Writing</span>
              </button>
            </div>
          </div>
          )}

          {/* SPEAKING FORM SECTION */}
          {testType === "speaking" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1.5">Hình thức thi Speaking</label>
                <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-zinc-100 border border-zinc-200/80 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setFormat("online")}
                    className={`py-2 rounded-lg transition-all cursor-pointer ${
                      format === "online"
                        ? "bg-[#6a5acd] text-white font-black shadow-sm"
                        : "text-zinc-600 hover:text-zinc-900"
                    }`}
                  >
                    Online qua Google Meet
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormat("offline")}
                    className={`py-2 rounded-lg transition-all cursor-pointer ${
                      format === "offline"
                        ? "bg-[#6a5acd] text-white font-black shadow-sm"
                        : "text-zinc-600 hover:text-zinc-900"
                    }`}
                  >
                    Offline trực tiếp tại trung tâm
                  </button>
                </div>
              </div>

              {/* Grader & Free Slot Section */}
              <div className="rounded-2xl border border-primary/20 bg-primary-soft/10 p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                      Giám khảo / Grader chấm <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={grader}
                      onChange={(e) => {
                        setGrader(e.target.value);
                        setSlotId(undefined);
                      }}
                      className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm font-bold text-zinc-900 outline-none focus:border-primary cursor-pointer shadow-xs"
                    >
                      {teacherOptions.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                      Ngày thi Speaking <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={testDate}
                      onChange={(e) => {
                        setTestDate(e.target.value);
                        setSlotId(undefined);
                      }}
                      className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 font-medium outline-none focus:border-primary cursor-pointer shadow-xs"
                    />
                  </div>
                </div>

                {/* Quick Available Slots Selector */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold text-zinc-700">
                      Ca rảnh của {grader} trong ngày {testDate}:
                    </span>
                    <span className="text-[10px] text-primary font-bold">
                      {availableSlotsForDate.length} ca rảnh sẵn có
                    </span>
                  </div>

                  {availableSlotsForDate.length > 0 ? (
                    <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto p-2 rounded-xl bg-white border border-zinc-200 shadow-xs">
                      {availableSlotsForDate.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => {
                            setTestTime(s.time);
                            setSlotId(s.id);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                            testTime === s.time
                              ? "bg-primary text-white border-primary font-black shadow-sm scale-105"
                              : "bg-zinc-50 text-zinc-700 border-zinc-200 hover:border-zinc-400"
                          }`}
                        >
                          {s.time} ({s.type?.includes("online") ? "Online" : "Offline"})
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-zinc-500 italic p-2.5 rounded-xl bg-white border border-zinc-200/80">
                      Chưa có ca rảnh nào được Grader khai báo cho ngày này. Bạn vẫn có thể tự chọn giờ bên dưới.
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                      Giờ thi Speaking <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="time"
                      required
                      value={testTime}
                      onChange={(e) => setTestTime(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 font-medium outline-none focus:border-primary shadow-xs"
                    />
                  </div>

                  {format === "online" && (
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                        Link Google Meet thi Online
                      </label>
                      <input
                        type="url"
                        value={meetLink}
                        onChange={(e) => setMeetLink(e.target.value)}
                        placeholder="https://meet.google.com/..."
                        className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-primary shadow-xs"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1.5">Link Đề Thi Speaking (nếu có)</label>
                <input
                  type="url"
                  value={examLink}
                  onChange={(e) => setExamLink(e.target.value)}
                  placeholder="https://xalo.edu.vn/de-speaking-01 hoặc Google Drive link"
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/40 px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-primary focus:bg-white transition-all"
                />
              </div>
            </div>
          )}

          {/* WRITING FORM SECTION — giống học viên: dán link + gửi, hệ thống tự phân Grader */}
          {testType === "writing" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 shadow-2xs space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <label className="text-[10px] font-black text-primary uppercase tracking-widest">
                      Link bài làm (Google Docs) <span className="text-rose-500">*</span>
                    </label>
                    <p className="text-[11px] text-zinc-500 font-medium mt-0.5">
                      Hệ thống tự phân chia Grader 1 / 2 / 3 — Sale không cần chọn người chấm.
                    </p>
                  </div>
                </div>
                <input
                  id="entrance-writing-link-input"
                  type="text"
                  value={submissionLink}
                  onChange={(e) => setSubmissionLink(e.target.value)}
                  placeholder="Dán link Google Docs vào đây..."
                  className="w-full h-11 rounded-xl border border-primary/20 bg-white px-4 text-xs font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>
            </div>
          )}

          {/* Notes for Both */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1.5">Ghi chú & Yêu cầu từ Sale</label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="VD: Khách cần gấp trước 18h, lưu ý chấm kỹ Task 2, hướng tới aim 6.5..."
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50/40 px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-primary focus:bg-white transition-all resize-none font-medium"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-200 px-5 py-2.5 text-xs font-bold text-zinc-600 hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`flex items-center gap-2 rounded-xl px-6 py-2.5 text-xs font-black text-white transition-all shadow-md cursor-pointer disabled:opacity-50 ${
                testType === "speaking"
                  ? "bg-primary hover:bg-[#6a5acd] hover:shadow-primary/25"
                  : "bg-sky-600 hover:bg-sky-700 hover:shadow-sky-600/25"
              }`}
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Đang lưu...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {testType === "speaking" ? "Xác nhận Đặt Lịch Speaking" : "Gửi bài Writing"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
