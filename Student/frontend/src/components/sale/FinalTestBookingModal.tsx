"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  fetchAcaFreeSlots,
  fetchAcaStudents,
  fetchAcaClasses,
  type AcaFreeSlot,
  type AcaStudent,
  type AcaClass,
} from "@/lib/acaManagementApi";
import {
  getMockTestTeacherOptions,
  MOCK_TEST_TEACHER_OPTIONS_EVENT,
  syncMockTestTeacherOptions,
} from "@/lib/mockTestTeacherNames";
import { getGraderMeetLink } from "@/lib/graderMeetLinks";
import {
  createFinalTestRecord,
  type FinalTestFormat,
  type FinalTestType,
} from "@/lib/finalTestArchive";
import type { FinalTestEligibility } from "@/lib/acaManagementApi";
import { listGuestDiagnosisLeads, type GuestDiagnosisLead } from "@/lib/guestDiagnosisLeads";

interface FinalTestBookingModalProps {
  initialStudentId?: string;
  eligibility?: FinalTestEligibility | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function FinalTestBookingModal({
  initialStudentId,
  eligibility,
  onClose,
  onSuccess,
}: FinalTestBookingModalProps) {
  const isStudentMode = Boolean(initialStudentId);
  const canRegister = eligibility?.eligible !== false;

  const [students, setStudents] = useState<AcaStudent[]>([]);
  const [classes, setClasses] = useState<AcaClass[]>([]);
  const [leads, setLeads] = useState<GuestDiagnosisLead[]>([]);
  const [freeSlots, setFreeSlots] = useState<AcaFreeSlot[]>([]);

  const [selectedStudentId, setSelectedStudentId] = useState<string>(initialStudentId || "");
  const [candidateName, setCandidateName] = useState("");
  const [candidatePhone, setCandidatePhone] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [targetBand, setTargetBand] = useState("6.5");
  const [teacherOptions, setTeacherOptions] = useState<string[]>(() => getMockTestTeacherOptions());

  const [testType, setTestType] = useState<FinalTestType>("full_4_skills");
  const [format, setFormat] = useState<FinalTestFormat>("online");
  const [examiner, setExaminer] = useState<string>(getMockTestTeacherOptions()[0] || "Grader");

  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, []);

  const [testDate, setTestDate] = useState<string>(todayStr);
  const [testTime, setTestTime] = useState<string>("19:00");

  const [meetLink, setMeetLink] = useState("");
  const [examLink, setExamLink] = useState("");
  const [submissionLink, setSubmissionLink] = useState("");
  const [note, setNote] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load students, classes, leads, and free slots
  useEffect(() => {
    void fetchAcaStudents().then((res) => {
      if (res && res.length > 0) setStudents(res);
    });
    void fetchAcaClasses().then((res) => {
      if (res && res.length > 0) setClasses(res);
    });
    void listGuestDiagnosisLeads().then((res) => {
      if (res && res.length > 0) setLeads(res);
    });
    void fetchAcaFreeSlots().then((res) => {
      if (res && res.length > 0) setFreeSlots(res);
    });
  }, []);

  useEffect(() => {
    void syncMockTestTeacherOptions().then((rows) => {
      setTeacherOptions(rows);
      setExaminer((current) => current || rows[0] || "Grader");
    });
    const onUpdate = () => {
      const rows = getMockTestTeacherOptions();
      setTeacherOptions(rows);
      setExaminer((current) => current || rows[0] || "Grader");
    };
    window.addEventListener(MOCK_TEST_TEACHER_OPTIONS_EVENT, onUpdate);
    return () => window.removeEventListener(MOCK_TEST_TEACHER_OPTIONS_EVENT, onUpdate);
  }, []);

  // Sync candidate info when student is chosen or in student mode
  useEffect(() => {
    if (!selectedStudentId) {
      if (isStudentMode) {
        setCandidateName("Dương Ngọc Khôi Nguyên");
        setCandidatePhone("0947 188 794");
        setCandidateEmail("nguyenduong939705@gmail.com");
      }
      return;
    }
    const foundSt = students.find((s) => s.id === selectedStudentId);
    if (foundSt) {
      setCandidateName(foundSt.name);
      setCandidatePhone(foundSt.phone || "");
      setCandidateEmail(foundSt.email || "");
      if (foundSt.classId) setSelectedClassId(foundSt.classId);
      const tgt = (foundSt as any).target || (foundSt.scores?.o ? String(foundSt.scores.o) : "6.5");
      if (tgt) setTargetBand(tgt);
    } else if (isStudentMode) {
      setCandidateName("Dương Ngọc Khôi Nguyên");
      setCandidatePhone("0947 188 794");
      setCandidateEmail("nguyenduong939705@gmail.com");
    }
  }, [selectedStudentId, students, isStudentMode]);

  // Update Meet link when Examiner changes
  useEffect(() => {
    const link = getGraderMeetLink(examiner);
    if (link) setMeetLink(link);
  }, [examiner]);

  // Available free slots for selected examiner & date
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
        (s.teacherName ?? "").trim().toLowerCase() === examiner.trim().toLowerCase() &&
        s.status !== "booked"
    );
  }, [freeSlots, testDate, examiner]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const name = candidateName.trim() || (isStudentMode ? "Dương Ngọc Khôi Nguyên" : "");
    const phone = candidatePhone.trim() || (isStudentMode ? "0947 188 794" : "");

    if (!name) {
      setError("Vui lòng nhập tên học viên / thí sinh.");
      return;
    }
    if (!testDate) {
      setError("Vui lòng chọn ngày thi.");
      return;
    }
    if (isStudentMode && !canRegister) {
      setError(
        eligibility?.reason ||
          "Chưa hoàn thành đủ 2 chặng (1 khóa học) để đăng ký Final Test.",
      );
      return;
    }

    setSubmitting(true);
    try {
      const cls = classes.find((c) => c.id === selectedClassId);
      const chosenClassName = cls ? cls.name || cls.classCode : "Momentum - 357 - C2";
      const chosenClassCode = cls ? cls.classCode : "M357C2";

      await createFinalTestRecord({
        candidateName: name,
        candidatePhone: phone,
        candidateEmail: candidateEmail || undefined,
        studentId: selectedStudentId || undefined,
        classCode: chosenClassCode,
        className: chosenClassName,
        targetBand: targetBand || "6.5",
        testType: isStudentMode ? "full_4_skills" : testType,
        format: isStudentMode ? "online" : format,
        examinerName: examiner || "Teacher",
        date: testDate,
        time: testTime || "19:00",
        meetLink: format === "online" ? meetLink : undefined,
        examLink: examLink || undefined,
        submissionLink: (testType === "writing" || testType === "full_4_skills") ? submissionLink : undefined,
        note,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || "Đăng ký Final Test thất bại. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ─────────────────────────────────────────────────────────────
     1. STUDENT MODE: COMPACT POPUP - ONLY PICK DATE (NO SCROLLING)
     ───────────────────────────────────────────────────────────── */
  if (isStudentMode) {
    const studentDisplayName = candidateName || "Dương Ngọc Khôi Nguyên";
    const currentClass = classes.find((c) => c.id === selectedClassId);
    const displayClassName = currentClass ? currentClass.name || currentClass.classCode : "Momentum - 357 - C2";

    return (
      <div className="fixed inset-0 z-[110] flex items-start justify-center pt-14 sm:pt-20 p-4 overflow-y-auto">
        <button
          type="button"
          aria-label="Đóng"
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-md transition-all"
        />
        <div className="relative w-full max-w-md rounded-3xl border border-zinc-200 bg-white shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 bg-zinc-50/70">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary font-black text-lg shadow-2xs">
                🎓
              </div>
              <div>
                <h3 className="text-sm font-black text-zinc-900 leading-tight">
                  Đăng Ký Ngày Thi Final Test
                </h3>
                <p className="text-[11px] text-zinc-500 font-medium mt-0.5">
                  Xác nhận ngày bạn dự thi bài kiểm tra cuối khóa
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
                {error}
              </div>
            )}

            {!canRegister && eligibility && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                {eligibility.reason ||
                  "Bạn cần hoàn thành đủ 2 chặng (1 khóa học) trước khi đăng ký Final Test."}
                <div className="mt-1 font-medium text-amber-700">
                  Tiến độ: {eligibility.totalSessionsElapsed}/{eligibility.requiredSessions} buổi
                </div>
              </div>
            )}

            {/* Candidate Summary Card */}
            <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50 p-3.5 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500 font-medium">Thí sinh:</span>
                <span className="font-bold text-zinc-900">{studentDisplayName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500 font-medium">Khóa học:</span>
                <span className="font-bold text-primary">{displayClassName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500 font-medium">Mục tiêu:</span>
                <span className="font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                  {targetBand || "6.5"} Band
                </span>
              </div>
            </div>

            {/* Only Date Selection */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-zinc-700 mb-1.5">
                Chọn ngày thi Final Test <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                min={todayStr}
                value={testDate}
                onChange={(e) => setTestDate(e.target.value)}
                className="w-full h-12 rounded-2xl border-2 border-primary/30 bg-white px-4 text-sm font-black text-zinc-900 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 shadow-xs transition-all cursor-pointer"
              />
            </div>

            {/* Optional Short Note */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-500 mb-1">
                Ghi chú thêm (tùy chọn)
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="VD: Cần thi ca tối sau 19h..."
                className="w-full h-10 rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 text-xs text-zinc-800 outline-none focus:border-primary focus:bg-white transition-all"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-600 hover:bg-zinc-50 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={submitting || !canRegister}
                className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-[#6a5acd] text-white text-xs font-black transition-all shadow-md active:scale-[0.98] disabled:opacity-50 text-center cursor-pointer disabled:cursor-not-allowed"
              >
                {submitting ? "Đang xử lý..." : "Xác Nhận Đăng Ký Ngày Thi"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  /* ─────────────────────────────────────────────────────────────
     2. STAFF / SALE MODE: COMPACT & NEAT (NO EXCESSIVE SCROLLING)
     ───────────────────────────────────────────────────────────── */
  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-14 sm:pt-20 p-4 overflow-y-auto">
      <button
        type="button"
        aria-label="Đóng"
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-md transition-all"
      />
      <div className="relative w-full max-w-xl rounded-2xl border border-zinc-200 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in slide-in-from-top-4 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-100 bg-zinc-50/80">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm shadow-xs">
              🎓
            </div>
            <div>
              <h2 className="text-sm font-black text-zinc-900">Tạo Ca Final Test</h2>
              <p className="text-[11px] text-zinc-500 font-medium">
                Xếp lịch kiểm tra cuối khóa & tạo hồ sơ BCB
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-3.5 text-xs">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
              {error}
            </div>
          )}

          {/* Student picker */}
          <div>
            <label className="block text-[11px] font-bold text-zinc-600 mb-1">
              Chọn từ danh sách học viên
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 outline-none focus:border-primary"
            >
              <option value="">-- Hoặc nhập thông tin thủ công --</option>
              {students.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name} ({st.phone || "No phone"}) — {st.l1 || "Chưa có lớp"}
                </option>
              ))}
            </select>
          </div>

          {/* Candidate Info Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                Tên thí sinh <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                placeholder="VD: Dương Ngọc Khôi Nguyên"
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 py-2 text-xs text-zinc-900 outline-none focus:border-primary focus:bg-white font-medium"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                Số điện thoại <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={candidatePhone}
                onChange={(e) => setCandidatePhone(e.target.value)}
                placeholder="VD: 0947 188 794"
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 py-2 text-xs text-zinc-900 outline-none focus:border-primary focus:bg-white font-medium"
              />
            </div>
          </div>

          {/* Class & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-zinc-700 mb-1">Lớp học</label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 outline-none focus:border-primary"
              >
                <option value="">-- Chưa gán lớp --</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.classCode} — {c.name || c.classCode}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                Ngày thi <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={testDate}
                onChange={(e) => setTestDate(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 outline-none focus:border-primary font-medium"
              />
            </div>
          </div>

          {/* Examiner & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                Giám khảo chấm thi <span className="text-rose-500">*</span>
              </label>
              <select
                value={examiner}
                onChange={(e) => setExaminer(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-bold text-zinc-900 outline-none focus:border-primary"
              >
                {teacherOptions.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                Giờ thi <span className="text-rose-500">*</span>
              </label>
              <input
                type="time"
                required
                value={testTime}
                onChange={(e) => setTestTime(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 outline-none focus:border-primary font-medium"
              />
            </div>
          </div>

          {/* Quick slot badges if any */}
          {availableSlotsForDate.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl bg-zinc-50 border border-zinc-200/80">
              <span className="text-[10px] font-bold text-zinc-500 mr-1">Ca rảnh có sẵn:</span>
              {availableSlotsForDate.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setTestTime(s.time)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all ${
                    testTime === s.time
                      ? "bg-primary text-white border-primary"
                      : "bg-white text-zinc-700 border-zinc-200 hover:border-zinc-400"
                  }`}
                >
                  {s.time}
                </button>
              ))}
            </div>
          )}

          {/* Note */}
          <div>
            <label className="block text-[11px] font-bold text-zinc-700 mb-1">Ghi chú thêm</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ghi chú về học viên, yêu cầu báo điểm gấp..."
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 py-2 text-xs text-zinc-900 outline-none focus:border-primary focus:bg-white"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-bold text-zinc-600 hover:bg-zinc-100 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-1.5 rounded-xl bg-primary hover:bg-[#6a5acd] px-5 py-2 text-xs font-black text-white transition-all shadow-sm disabled:opacity-50"
            >
              {submitting ? "Đang xử lý..." : "Xác Nhận Đăng Ký"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
