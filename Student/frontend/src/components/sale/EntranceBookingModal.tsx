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
import { listGuestDiagnosisLeads, type GuestDiagnosisLead } from "@/lib/guestDiagnosisLeads";

interface EntranceBookingModalProps {
  initialLead?: GuestDiagnosisLead | null;
  initialGrader?: string;
  initialDate?: string; // YYYY-MM-DD
  initialTime?: string; // HH:mm
  initialSlotId?: string;
  initialFormat?: EntranceTestFormat;
  onClose: () => void;
  onSuccess: () => void;
}

export function EntranceBookingModal({
  initialLead,
  initialGrader,
  initialDate,
  initialTime,
  initialSlotId,
  initialFormat = "online",
  onClose,
  onSuccess,
}: EntranceBookingModalProps) {
  const [leads, setLeads] = useState<GuestDiagnosisLead[]>([]);
  const [freeSlots, setFreeSlots] = useState<AcaFreeSlot[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string>(initialLead?.id || "");

  const [candidateName, setCandidateName] = useState(initialLead?.name || "");
  const [candidatePhone, setCandidatePhone] = useState(initialLead?.phone || "");
  const [candidateEmail, setCandidateEmail] = useState("");
  const [teacherOptions, setTeacherOptions] = useState<string[]>(() => getMockTestTeacherOptions());

  const [testType, setTestType] = useState<EntranceTestType>("speaking");
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

  // Load leads and free slots
  useEffect(() => {
    void listGuestDiagnosisLeads().then(setLeads);
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

  // Sync candidate info when lead is selected
  useEffect(() => {
    if (!selectedLeadId) return;
    const found = leads.find((l) => l.id === selectedLeadId);
    if (found) {
      setCandidateName(found.name);
      setCandidatePhone(found.phone);
      if (found.aim) {
        setNote((prev) => (prev ? prev : `Mục tiêu khách: ${found.aim}`));
      }
    }
  }, [selectedLeadId, leads]);

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
    if (!grader.trim()) {
      setError("Vui lòng chọn Grader chấm bài.");
      return;
    }
    if (!testDate) {
      setError("Vui lòng chọn ngày thi.");
      return;
    }
    if (!testTime) {
      setError("Vui lòng chọn giờ thi.");
      return;
    }

    setSubmitting(true);
    try {
      await createEntranceTestBooking({
        candidateName,
        candidatePhone,
        candidateEmail,
        leadId: selectedLeadId || undefined,
        type: testType,
        format,
        graderName: grader,
        date: testDate,
        time: testTime,
        meetLink: format === "online" ? meetLink : undefined,
        examLink,
        submissionLink: testType === "writing" || testType === "both" ? submissionLink : undefined,
        note,
        slotId,
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
            <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-black text-zinc-900">Đặt Lịch Grader Chấm Entrance Test</h2>
              <p className="text-xs text-zinc-500 font-medium">
                Xếp lịch chấm bài Speaking & Writing đầu vào cho khách chẩn đoán
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
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

          {/* Quick Select from Leads */}
          <div className="rounded-xl border border-primary/20 bg-primary-soft/15 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-800">Chọn nhanh từ danh sách Lead BCB</label>
              <span className="text-[10px] text-zinc-500 font-medium">Hoặc nhập trực tiếp bên dưới</span>
            </div>
            <select
              value={selectedLeadId}
              onChange={(e) => setSelectedLeadId(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs text-zinc-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all cursor-pointer font-medium"
            >
              <option value="">-- Nhập thông tin ứng viên mới --</option>
              {leads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} ({l.phone}) {l.aim ? `— Mục tiêu: ${l.aim}` : ""}
                </option>
              ))}
            </select>
          </div>

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

          {/* Type & Format Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                Loại bài Test Entrance <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-zinc-100 border border-zinc-200/80 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setTestType("speaking")}
                  className={`py-2 rounded-lg transition-all ${
                    testType === "speaking"
                      ? "bg-primary text-white font-black shadow-sm"
                      : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  Speaking
                </button>
                <button
                  type="button"
                  onClick={() => setTestType("writing")}
                  className={`py-2 rounded-lg transition-all ${
                    testType === "writing"
                      ? "bg-primary text-white font-black shadow-sm"
                      : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  Writing
                </button>

              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1.5">Hình thức thi</label>
              <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-zinc-100 border border-zinc-200/80 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setFormat("online")}
                  className={`py-2 rounded-lg transition-all ${
                    format === "online"
                      ? "bg-[#6a5acd] text-white font-black shadow-sm"
                      : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  Online (Meet)
                </button>
                <button
                  type="button"
                  onClick={() => setFormat("offline")}
                  className={`py-2 rounded-lg transition-all ${
                    format === "offline"
                      ? "bg-[#6a5acd] text-white font-black shadow-sm"
                      : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  Offline (Tại TT)
                </button>
              </div>
            </div>
          </div>

          {/* Grader & Free Slot Section */}
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                  Nhân viên Grader chấm <span className="text-rose-500">*</span>
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
                  Ngày thi / Hạn chấm <span className="text-rose-500">*</span>
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
                <span className="text-[11px] font-bold text-zinc-600">
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
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                        testTime === s.time
                          ? "bg-primary text-white border-primary font-black shadow-sm scale-105"
                          : "bg-zinc-50 text-zinc-700 border-zinc-200 hover:border-zinc-400"
                      }`}
                    >
                      {s.time} {s.type?.includes("online") ? "🌐 ON" : "🏫 OFF"}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-zinc-500 italic p-2 rounded-xl bg-white border border-zinc-200/80">
                  Chưa có ca rảnh nào được Grader khai báo cho ngày này. Bạn vẫn có thể tự chọn giờ bên dưới.
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                  Giờ thi / Giờ bắt đầu <span className="text-rose-500">*</span>
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

          {/* Links and Notes */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1.5">Link Đề Thi (nếu có)</label>
              <input
                type="url"
                value={examLink}
                onChange={(e) => setExamLink(e.target.value)}
                placeholder="VD: https://xalo.edu.vn/de-thi-speaking-01 hoặc Google Drive link"
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/40 px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-primary focus:bg-white transition-all"
              />
            </div>

            {(testType === "writing" || testType === "both") && (
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                  Link bài nộp Writing của ứng viên (Google Docs / Drive)
                </label>
                <input
                  type="url"
                  value={submissionLink}
                  onChange={(e) => setSubmissionLink(e.target.value)}
                  placeholder="https://docs.google.com/document/d/..."
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/40 px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-primary focus:bg-white transition-all"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1.5">Ghi chú từ Sale</label>
              <textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="VD: Khách cần kết quả trước 17h ngày mai, lưu ý phát âm Part 2..."
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/40 px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-primary focus:bg-white transition-all resize-none"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-200 px-5 py-2.5 text-xs font-bold text-zinc-600 hover:bg-zinc-100 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-xl bg-primary hover:bg-[#6a5acd] px-6 py-2.5 text-xs font-black text-white transition-all shadow-md hover:shadow-primary/25 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Đang lưu lịch...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Xác nhận Đặt Lịch
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
