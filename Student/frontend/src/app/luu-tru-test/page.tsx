"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { StudentLayout } from "@/app/StudentLayout";
import { StudentSchedulePanel } from "@/components/student/StudentSchedulePanel";
import { StudentDialog } from "@/components/student/StudentDialog";
import { CollapsiblePanel } from "@/components/student/ui";
import { useStudentSchedule } from "@/hooks/useStudentSchedule";
import { formatBandScore } from "@/lib/formatBandScore";
import { getGraderMeetLink } from "@/lib/graderMeetLinks";
import { getStudentIdentity } from "@/lib/studentIdentity";
import { MOCK_TEST_TEACHER_OPTIONS } from "@/lib/mockTestTeacherNames";
import {
  cancelFinalTestRecord,
  createFinalTestRecord,
  FINAL_TEST_STATUS_LABELS,
  FINAL_TEST_TYPE_LABELS,
  FINAL_TEST_UPDATE_EVENT,
  listMyFinalTestRecords,
  type FinalTestRecord,
} from "@/lib/finalTestArchive";
import {
  fetchFinalTestEligibilityApi,
  type FinalTestEligibility,
} from "@/lib/acaManagementApi";
import { FinalTestBcbDrawer } from "@/components/sale/FinalTestBcbDrawer";
import { FinalSpeakingBookingModal } from "@/components/student/FinalSpeakingBookingModal";
import { useStudentDiagnosis } from "@/hooks/useStudentDiagnosis";
import {
  listEntranceTestBookings,
  ENTRANCE_STATUS_LABELS,
  ENTRANCE_TYPE_LABELS,
  type EntranceTestBooking,
} from "@/lib/entranceTestBookings";

export default function StudentLuuTruTestPage() {
  const student = getStudentIdentity();
  const schedule = useStudentSchedule();
  const { diagnosis } = useStudentDiagnosis(student.id);

  const [records, setRecords] = useState<FinalTestRecord[]>([]);
  const [entranceBookings, setEntranceBookings] = useState<EntranceTestBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [eligibility, setEligibility] = useState<FinalTestEligibility | null>(null);

  // Panels open/collapse state ( giống tab Mock Test Speaking )
  const [panelEntranceOpen, setPanelEntranceOpen] = useState(true);
  const [panelSpeakingOpen, setPanelSpeakingOpen] = useState(true);
  const [panelWritingOpen, setPanelWritingOpen] = useState(true);
  const [panelFullOpen, setPanelFullOpen] = useState(true);

  // Modals & Drawers
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [activeBcbRecord, setActiveBcbRecord] = useState<FinalTestRecord | null>(null);
  const [writingLink, setWritingLink] = useState("");
  const [dialog, setDialog] = useState<{ tone: "success" | "warning"; title: string; message: string } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [forStudent, eligibilityResult, allEntrance] = await Promise.all([
        listMyFinalTestRecords({
          id: student.id,
          name: student.name,
        }),
        fetchFinalTestEligibilityApi().catch(() => null),
        listEntranceTestBookings().catch(() => []),
      ]);
      setRecords(forStudent);
      setEligibility(eligibilityResult);

      const stNameLower = student.name.toLowerCase();
      const myEntrance = allEntrance.filter(
        (b) =>
          b.candidateName.toLowerCase().includes(stNameLower) ||
          b.candidatePhone === (student as any).phone
      );
      setEntranceBookings(myEntrance.length > 0 ? myEntrance : allEntrance.slice(0, 1));
    } catch (err) {
      console.error("Failed to load tests", err);
    } finally {
      setLoading(false);
    }
  }, [student.id, student.name]);

  const canRegisterFinalTest = eligibility?.eligible !== false;

  const openBookingModal = useCallback(() => {
    if (!canRegisterFinalTest) {
      setDialog({
        tone: "warning",
        title: "Chưa đủ điều kiện",
        message:
          eligibility?.reason ||
          "Bạn cần hoàn thành đủ 2 chặng (1 khóa học) trước khi đăng ký Final Test.",
      });
      return;
    }
    setIsBookingOpen(true);
  }, [canRegisterFinalTest, eligibility?.reason]);

  useEffect(() => {
    void loadData();
    window.addEventListener(FINAL_TEST_UPDATE_EVENT, loadData);
    window.addEventListener("storage", loadData);
    return () => {
      window.removeEventListener(FINAL_TEST_UPDATE_EVENT, loadData);
      window.removeEventListener("storage", loadData);
    };
  }, [loadData]);

  // Speaking tests
  const speakingRecords = useMemo(() => {
    return records.filter((r) => r.testType === "speaking" || r.testType === "full_4_skills");
  }, [records]);

  // Writing tests
  const writingRecords = useMemo(() => {
    return records.filter((r) => r.testType === "writing" || r.testType === "full_4_skills");
  }, [records]);

  // Graded & Checked (approved by ACA) tests
  const completedRecords = useMemo(() => {
    return records.filter(
      (r) =>
        r.isChecked === true &&
        (r.status === "graded" || r.scoreOverall || r.scoreSpeaking || r.scoreWriting)
    );
  }, [records]);

  const latestCompleted = completedRecords[0] || null;

  // Entrance Scores summary
  const entranceScores = diagnosis?.scores || {
    listening: 5.5,
    reading: 5.0,
    writing: 5.0,
    speaking: 5.5,
    overall: 5.0,
  };

  // Upcoming speaking ca thi
  const upcomingSpeaking = speakingRecords.filter(
    (r) => r.status === "scheduled" || r.status === "in_progress"
  );

  return (
    <StudentLayout>
      <div className="space-y-10 pb-20">
        {/* Page Header */}
        <header>
          <h2 className="text-2xl font-extrabold text-foreground tracking-tight">Lưu trữ bài test</h2>
          <p className="text-muted text-sm mt-1 font-medium">
            Theo dõi điểm số Entrance (Đầu vào) & Final Test (Cuối khóa), so sánh mức tăng trưởng và xem hồ sơ Bảng Chẩn Bệnh (BCB).
          </p>
        </header>

        {!canRegisterFinalTest && eligibility && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <p className="font-bold">Chưa đủ điều kiện đăng ký Final Test</p>
            <p className="mt-1 text-xs font-medium text-amber-800">
              {eligibility.reason ||
                "Bạn cần hoàn thành đủ 2 chặng (1 khóa học) trước khi đăng ký Final Test."}
            </p>
            <p className="mt-1 text-[11px] text-amber-700">
              Tiến độ học: {eligibility.totalSessionsElapsed}/{eligibility.requiredSessions} buổi đã học
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 items-stretch gap-10 lg:grid-cols-12">
          {/* Left Column: 9 cols */}
          <div className="lg:col-span-9 flex min-h-0 flex-col space-y-6">

            {/* ══════════════════════════════════════════════════════════
                TAB 1: TEST ĐẦU VÀO (ENTRANCE TEST)
                ══════════════════════════════════════════════════════════ */}
            <CollapsiblePanel
              title="Điểm Test Đầu Vào (Entrance Test) & Bảng Chẩn Bệnh Ban Đầu"
              className="w-full"
              transparentTab={true}
              isOpen={panelEntranceOpen}
              onToggle={setPanelEntranceOpen}
              topContent={
                <div className="space-y-4">
                  {/* ── Entrance Quota / Status Card (giống Mock Test Speaking) ── */}
                  <div className="rounded-2xl border border-zinc-100 bg-[#595082] p-5 flex items-center justify-between gap-4 flex-wrap shadow-soft">
                    <div className="flex items-center gap-4">
                      {/* Circular score badge */}
                      <div className="relative h-16 w-16 shrink-0">
                        <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                          <circle
                            cx="18"
                            cy="18"
                            r="15.9"
                            fill="none"
                            stroke="#8578b8"
                            strokeWidth="3.2"
                          />
                          <circle
                            cx="18"
                            cy="18"
                            r="15.9"
                            fill="none"
                            stroke="#f8c662"
                            strokeWidth="3.2"
                            strokeDasharray="100 100"
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-sm font-black text-[#f8c662] tabular-nums">
                            {entranceScores.overall || "5.0"}
                          </span>
                        </div>
                      </div>

                      <div>
                        <div className="text-sm font-black text-[#f8c662]">
                          Kết Quả Test Đầu Vào (Entrance Test)
                        </div>
                        <div className="text-xs text-[#f8c662]/90 font-medium mt-0.5">
                          Đánh giá 4 kỹ năng Listening, Reading, Writing, Speaking khi nhập học
                        </div>
                        <div className="text-[10px] text-[#f8c662]/80 font-medium mt-0.5">
                          Mục tiêu đầu ra chương trình: {diagnosis?.aim || "IELTS 6.5 Band"}
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="flex items-center gap-2">
                      {diagnosis?.bcbLink && (
                        <a
                          href={diagnosis.bcbLink}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-2xl px-5 py-3 text-xs font-black uppercase tracking-wide bg-[#f8c662] text-slate-950 hover:bg-[#ffe082] transition-all shadow-md active:scale-[0.98] cursor-pointer"
                        >
                          Xem file BCB Đầu Vào ↗
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => setPanelEntranceOpen(!panelEntranceOpen)}
                        className="rounded-xl px-3 py-1.5 text-[11px] font-extrabold bg-white/20 text-white hover:bg-white/30 transition-all cursor-pointer"
                      >
                        {panelEntranceOpen ? "Thu gọn" : "Chi tiết"}
                      </button>
                    </div>
                  </div>

                  {/* 4 Skills Score Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div className="rounded-2xl border border-sky-200/80 bg-sky-50/50 p-3.5 text-center shadow-2xs">
                      <div className="text-[10px] font-black uppercase tracking-wider text-sky-600">
                        🎧 Listening
                      </div>
                      <div className="text-xl font-black text-sky-900 mt-1 tabular-nums">
                        {entranceScores.listening || "—"}
                      </div>
                      <div className="text-[9px] font-bold text-sky-500 mt-0.5">Band Đầu Vào</div>
                    </div>

                    <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-3.5 text-center shadow-2xs">
                      <div className="text-[10px] font-black uppercase tracking-wider text-emerald-600">
                        📖 Reading
                      </div>
                      <div className="text-xl font-black text-emerald-900 mt-1 tabular-nums">
                        {entranceScores.reading || "—"}
                      </div>
                      <div className="text-[9px] font-bold text-emerald-500 mt-0.5">Band Đầu Vào</div>
                    </div>

                    <div className="rounded-2xl border border-amber-200/80 bg-amber-50/50 p-3.5 text-center shadow-2xs">
                      <div className="text-[10px] font-black uppercase tracking-wider text-amber-600">
                        ✍️ Writing
                      </div>
                      <div className="text-xl font-black text-amber-900 mt-1 tabular-nums">
                        {entranceScores.writing || "—"}
                      </div>
                      <div className="text-[9px] font-bold text-amber-500 mt-0.5">Band Đầu Vào</div>
                    </div>

                    <div className="rounded-2xl border border-purple-200/80 bg-purple-50/50 p-3.5 text-center shadow-2xs">
                      <div className="text-[10px] font-black uppercase tracking-wider text-purple-600">
                        🗣️ Speaking
                      </div>
                      <div className="text-xl font-black text-purple-900 mt-1 tabular-nums">
                        {entranceScores.speaking || "—"}
                      </div>
                      <div className="text-[9px] font-bold text-purple-500 mt-0.5">Band Đầu Vào</div>
                    </div>

                    <div className="col-span-2 sm:col-span-1 rounded-2xl border-2 border-primary/30 bg-primary/5 p-3.5 text-center shadow-xs">
                      <div className="text-[10px] font-black uppercase tracking-wider text-primary">
                        ⭐ OVERALL
                      </div>
                      <div className="text-2xl font-black text-primary mt-0.5 tabular-nums">
                        {entranceScores.overall || "5.0"}
                      </div>
                      <div className="text-[9px] font-black text-primary/80 mt-0.5">Target: 6.5 Band</div>
                    </div>
                  </div>
                </div>
              }
            >
              {/* Entrance Test Bookings Table if any */}
              <div className="space-y-4">
                {entranceBookings.length === 0 ? (
                  <div className="text-center py-8 text-zinc-400 text-xs font-bold bg-zinc-50/50 rounded-2xl border border-zinc-200/60">
                    Chưa có lịch sử ca thi Entrance chi tiết.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-soft">
                    <table className="w-full text-center text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-zinc-200 bg-zinc-50 text-[10px] font-black uppercase tracking-wider text-zinc-500">
                          <th className="px-4 py-3 text-left">Bài test Entrance</th>
                          <th className="px-4 py-3">Grader chấm</th>
                          <th className="px-4 py-3">Ngày thi</th>
                          <th className="px-4 py-3">Trạng thái</th>
                          <th className="px-4 py-3">Điểm chấm</th>
                          <th className="px-4 py-3 text-right">Chi tiết</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 font-medium">
                        {entranceBookings.map((b) => (
                          <tr key={b.id} className="hover:bg-zinc-50/60 transition-colors">
                            <td className="px-4 py-3 text-left font-bold text-zinc-900">
                              {ENTRANCE_TYPE_LABELS[b.type] || b.type}
                            </td>
                            <td className="px-4 py-3 font-bold text-zinc-700">{b.graderName}</td>
                            <td className="px-4 py-3 font-mono text-zinc-600">{b.date} • {b.time}</td>
                            <td className="px-4 py-3">
                              <span className="inline-flex rounded-md px-2 py-0.5 text-[9px] font-black uppercase tracking-wider border bg-emerald-50 text-emerald-700 border-emerald-200">
                                {ENTRANCE_STATUS_LABELS[b.status] || "Đã có điểm"}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-black text-primary tabular-nums">
                              {b.scoreSpeaking || b.scoreWriting || "5.0"}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {b.submissionLink ? (
                                <a
                                  href={b.submissionLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-primary font-bold hover:underline"
                                >
                                  Bài làm ↗
                                </a>
                              ) : (
                                <span className="text-zinc-400 text-[11px]">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </CollapsiblePanel>

            {/* ══════════════════════════════════════════════════════════
                TAB 2: FINAL TEST SPEAKING (GIỐNG MOCK TEST SPEAKING)
                ══════════════════════════════════════════════════════════ */}
            <CollapsiblePanel
              title="Final Test Speaking"
              className="w-full"
              transparentTab={true}
              isOpen={panelSpeakingOpen}
              onToggle={setPanelSpeakingOpen}
              topContent={
                <div className="space-y-4">
                  {/* ── Quota Card (giống Mock Test Speaking) ── */}
                  <div className="rounded-2xl border border-zinc-100 bg-[#595082] p-5 flex items-center justify-between gap-4 flex-wrap shadow-soft">
                    <div className="flex items-center gap-4">
                      {/* Circular Progress */}
                      <div className="relative h-16 w-16 shrink-0">
                        <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                          <circle
                            cx="18"
                            cy="18"
                            r="15.9"
                            fill="none"
                            stroke="#8578b8"
                            strokeWidth="3.2"
                          />
                          <circle
                            cx="18"
                            cy="18"
                            r="15.9"
                            fill="none"
                            stroke={speakingRecords.some((r) => r.isChecked) ? "#10b981" : "#f8c662"}
                            strokeWidth="3.2"
                            strokeDasharray={`${speakingRecords.some((r) => r.isChecked) ? 100 : 0} 100`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-sm font-black text-[#f8c662] tabular-nums">
                            {speakingRecords.filter((r) => r.isChecked).length}/1
                          </span>
                        </div>
                      </div>

                      <div>
                        <div className="text-sm font-black text-[#f8c662]">Final Test Speaking 1-1</div>
                        {speakingRecords.length === 0 ? (
                          <div className="text-xs text-[#f8c662]/90 font-medium mt-0.5">
                            Chưa đăng ký ca Final Test Speaking cuối khóa
                          </div>
                        ) : (
                          <div className="text-xs text-emerald-300 font-bold mt-0.5">
                            Đã đăng ký {speakingRecords.length} ca thi Final Speaking
                          </div>
                        )}
                        <div className="text-[10px] text-[#f8c662]/80 font-medium mt-0.5">
                          Thi trực tiếp 1-1 với Giám khảo theo Band Descriptors chuẩn đầu ra
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={openBookingModal}
                        disabled={!canRegisterFinalTest}
                        className="rounded-2xl px-6 py-3.5 text-xs font-black uppercase tracking-wide bg-[#f8c662] text-slate-950 hover:bg-[#ffe082] transition-all shadow-md active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        + Đăng ký lịch
                      </button>
                      <button
                        type="button"
                        onClick={() => setPanelSpeakingOpen(!panelSpeakingOpen)}
                        className="rounded-xl px-3 py-1.5 text-[11px] font-extrabold bg-white/20 text-white hover:bg-white/30 transition-all cursor-pointer"
                      >
                        {panelSpeakingOpen ? "Thu gọn" : "Chi tiết"}
                      </button>
                    </div>
                  </div>

                  {/* Upcoming Speaking Card */}
                  {upcomingSpeaking.length > 0 && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {upcomingSpeaking.map((t) => {
                        const meet = t.meetLink || getGraderMeetLink(t.examinerName);
                        return (
                          <div
                            key={t.id}
                            className="rounded-2xl border border-primary/30 bg-primary/5 p-4 flex justify-between items-start shadow-2xs"
                          >
                            <div>
                              <div className="text-sm font-extrabold text-foreground">
                                Final Test Speaking
                              </div>
                              <div className="text-[10px] font-bold text-muted uppercase mt-1 font-mono">
                                {t.date} • {t.time}
                              </div>
                              <div className="text-[10px] font-bold text-primary mt-0.5">
                                Giám khảo: {t.examinerName}
                              </div>
                              <div className="mt-1 text-[10px] font-bold uppercase text-sky-600">
                                {FINAL_TEST_STATUS_LABELS[t.status]}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1.5">
                              {meet && (
                                <a
                                  href={meet}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-700 border border-emerald-200 hover:bg-emerald-100 shadow-2xs"
                                >
                                  Meet thi ↗
                                </a>
                              )}
                              <button
                                type="button"
                                onClick={async () => {
                                  if (!confirm("Bạn có chắc muốn hủy ca thi này?")) return;
                                  await cancelFinalTestRecord(t.id);
                                  void loadData();
                                }}
                                className="text-[10px] font-black uppercase text-secondary hover:underline"
                              >
                                Hủy ca
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              }
            >
              <div className="space-y-4">
                {speakingRecords.length === 0 ? (
                  <div className="text-center py-10 text-zinc-400 space-y-2 bg-zinc-50/50 rounded-2xl border border-zinc-200/60">
                    <div className="text-xs font-bold text-zinc-700">Chưa có ca Final Test Speaking nào</div>
                    <p className="text-[11px] text-zinc-400">
                      Bấm nút &quot;Đăng ký lịch&quot; ở trên để chọn giờ thi Speaking 1-1 với Giám khảo.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-soft">
                    <table className="w-full text-center text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-zinc-200 bg-zinc-50 text-[10px] font-black uppercase tracking-wider text-zinc-500">
                          <th className="px-4 py-3 text-left">Ngày giờ test</th>
                          <th className="px-4 py-3">Giám khảo</th>
                          <th className="px-4 py-3">Trạng thái</th>
                          <th className="px-4 py-3">Điểm Speaking</th>
                          <th className="px-4 py-3">Link Google Meet</th>
                          <th className="px-4 py-3 text-right">Bảng Chẩn Bệnh</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 font-medium">
                        {speakingRecords.map((r) => {
                          const meetUrl = r.meetLink || getGraderMeetLink(r.examinerName);
                          const isReleased = !!r.isChecked;
                          return (
                            <tr key={r.id} className="hover:bg-zinc-50/60 transition-colors">
                              <td className="px-4 py-3 text-left font-bold text-zinc-900 tabular-nums">
                                {r.date} • {r.time}
                              </td>
                              <td className="px-4 py-3 text-zinc-700 font-bold">{r.examinerName}</td>
                              <td className="px-4 py-3">
                                {isReleased ? (
                                  <span
                                    className={`inline-flex rounded-md px-2 py-0.5 text-[9px] font-black uppercase tracking-wider border ${
                                      r.status === "graded"
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                        : "bg-sky-50 text-sky-700 border-sky-200"
                                    }`}
                                  >
                                    {FINAL_TEST_STATUS_LABELS[r.status]}
                                  </span>
                                ) : (
                                  <span className="inline-flex rounded-md px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                                    Đang duyệt kết quả
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-sm font-black text-primary tabular-nums">
                                  {isReleased && r.scoreSpeaking ? formatBandScore(r.scoreSpeaking) : "—"}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                {meetUrl ? (
                                  <a
                                    href={meetUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-all shadow-2xs"
                                  >
                                    Meet thi ↗
                                  </a>
                                ) : (
                                  <span className="text-zinc-400 text-xs italic">—</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right">
                                {isReleased ? (
                                  <button
                                    type="button"
                                    onClick={() => setActiveBcbRecord(r)}
                                    className="inline-flex items-center gap-1 rounded-lg bg-primary/10 border border-primary/20 hover:bg-primary hover:text-white px-2.5 py-1 text-[10px] font-black text-primary transition-all cursor-pointer"
                                  >
                                    Xem BCB
                                  </button>
                                ) : (
                                  <span className="text-zinc-400 text-[10px] italic">Chờ duyệt</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </CollapsiblePanel>

            {/* ══════════════════════════════════════════════════════════
                TAB 3: FINAL TEST WRITING (GIỐNG MOCK TEST WRITING)
                ══════════════════════════════════════════════════════════ */}
            <CollapsiblePanel
              title="Chấm - Chữa Final Test Writing"
              className="w-full"
              transparentTab={true}
              isOpen={panelWritingOpen}
              onToggle={setPanelWritingOpen}
              topContent={
                <div className="space-y-4">
                  {/* ── Quota Card ── */}
                  <div className="rounded-2xl border border-zinc-100 bg-[#595082] p-5 flex items-center justify-between gap-4 flex-wrap shadow-soft">
                    <div className="flex items-center gap-4">
                      {/* Circular Progress */}
                      <div className="relative h-16 w-16 shrink-0">
                        <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                          <circle
                            cx="18"
                            cy="18"
                            r="15.9"
                            fill="none"
                            stroke="#8578b8"
                            strokeWidth="3.2"
                          />
                          <circle
                            cx="18"
                            cy="18"
                            r="15.9"
                            fill="none"
                            stroke={writingRecords.some((r) => r.isChecked) ? "#10b981" : "#f8c662"}
                            strokeWidth="3.2"
                            strokeDasharray={`${writingRecords.some((r) => r.isChecked) ? 100 : 0} 100`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-sm font-black text-[#f8c662] tabular-nums">
                            {writingRecords.filter((r) => r.isChecked).length}/1
                          </span>
                        </div>
                      </div>

                      <div>
                        <div className="text-sm font-black text-[#f8c662]">Final Test Writing</div>
                        {writingRecords.length === 0 ? (
                          <div className="text-xs text-[#f8c662]/90 font-medium mt-0.5">
                            Chưa nộp bài Final Test Writing cuối khóa
                          </div>
                        ) : (
                          <div className="text-xs text-emerald-300 font-bold mt-0.5">
                            Đã nộp {writingRecords.length} bài Final Writing
                          </div>
                        )}
                        <div className="text-[10px] text-[#f8c662]/80 font-medium mt-0.5">
                          Nộp link Google Docs bài viết Task 1 & Task 2 để Giám khảo chấm chữa chi tiết
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPanelWritingOpen(!panelWritingOpen)}
                        className="rounded-xl px-3 py-1.5 text-[11px] font-extrabold bg-white/20 text-white hover:bg-white/30 transition-all cursor-pointer"
                      >
                        {panelWritingOpen ? "Thu gọn" : "Nộp bài"}
                      </button>
                    </div>
                  </div>
                </div>
              }
            >
              <div className="space-y-6">
                {/* Submit link input box */}
                <div className="flex flex-col gap-2 rounded-2xl border border-primary/20 bg-primary/5 p-4 shadow-2xs">
                  <label className="text-[10px] font-black text-primary uppercase tracking-widest">
                    Nộp Link Bài Làm Final Test Writing (Google Docs)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={writingLink}
                      onChange={(e) => setWritingLink(e.target.value)}
                      placeholder="Dán link Google Docs bài viết cuối khóa vào đây..."
                      className="flex-1 h-11 rounded-xl border border-primary/20 bg-white px-4 text-xs font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        if (!writingLink.trim()) return;
                        try {
                          await createFinalTestRecord({
                            candidateName: student.name,
                            candidatePhone: (student as any).phone || "0947 188 794",
                            studentId: student.id,
                            testType: "writing",
                            format: "online",
                            examinerName: MOCK_TEST_TEACHER_OPTIONS[0],
                            date: new Date().toISOString().split("T")[0],
                            time: "19:00",
                            submissionLink: writingLink.trim(),
                            targetBand: "6.5",
                          });
                          setWritingLink("");
                          void loadData();
                          setDialog({
                            tone: "success",
                            title: "Nộp bài thành công",
                            message: "Bài Final Writing của bạn đã được gửi tới Giám khảo chấm điểm!",
                          });
                        } catch (err: any) {
                          setDialog({
                            tone: "warning",
                            title: "Lỗi nộp bài",
                            message: err?.message || "Không gửi được bài Writing.",
                          });
                        }
                      }}
                      className="h-11 rounded-xl bg-primary px-6 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-primary/90 shadow-2xs cursor-pointer active:scale-[0.98]"
                    >
                      Gửi bài
                    </button>
                  </div>
                </div>

                {/* Writing Results Table */}
                {writingRecords.length === 0 ? (
                  <div className="text-center py-8 text-zinc-400 text-xs font-bold bg-zinc-50/50 rounded-2xl border border-zinc-200/60">
                    Chưa có bài Final Writing nào được gửi chấm.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-soft">
                    <table className="w-full text-center text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-zinc-200 bg-zinc-50 text-[10px] font-black uppercase tracking-wider text-zinc-500">
                          <th className="px-4 py-3 text-left">Ngày nộp</th>
                          <th className="px-4 py-3">Giám khảo chấm</th>
                          <th className="px-4 py-3">Trạng thái</th>
                          <th className="px-4 py-3">Điểm Writing</th>
                          <th className="px-4 py-3">Link bài làm</th>
                          <th className="px-4 py-3 text-right">Bảng Chẩn Bệnh</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 font-medium">
                        {writingRecords.map((r) => {
                          const isReleased = !!r.isChecked;
                          return (
                            <tr key={r.id} className="hover:bg-zinc-50/60 transition-colors">
                              <td className="px-4 py-3 text-left font-bold text-zinc-900 tabular-nums">
                                {r.date}
                              </td>
                              <td className="px-4 py-3 text-zinc-700 font-bold">{r.examinerName}</td>
                              <td className="px-4 py-3">
                                {isReleased ? (
                                  <span
                                    className={`inline-flex rounded-md px-2 py-0.5 text-[9px] font-black uppercase tracking-wider border ${
                                      r.status === "graded"
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                        : "bg-sky-50 text-sky-700 border-sky-200"
                                    }`}
                                  >
                                    {FINAL_TEST_STATUS_LABELS[r.status]}
                                  </span>
                                ) : (
                                  <span className="inline-flex rounded-md px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                                    Đang chấm bài
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-sm font-black text-primary tabular-nums">
                                  {isReleased && r.scoreWriting ? formatBandScore(r.scoreWriting) : "—"}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                {r.submissionLink ? (
                                  <a
                                    href={r.submissionLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-secondary/10 px-2.5 py-1 text-xs font-black text-secondary border border-secondary/20 hover:bg-secondary/20 transition-all shadow-2xs"
                                  >
                                    Bài làm ↗
                                  </a>
                                ) : (
                                  <span className="text-zinc-400 text-xs italic">—</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right">
                                {isReleased ? (
                                  <button
                                    type="button"
                                    onClick={() => setActiveBcbRecord(r)}
                                    className="inline-flex items-center gap-1 rounded-lg bg-primary/10 border border-primary/20 hover:bg-primary hover:text-white px-2.5 py-1 text-[10px] font-black text-primary transition-all cursor-pointer"
                                  >
                                    Xem BCB
                                  </button>
                                ) : (
                                  <span className="text-zinc-400 text-[10px] italic">Chờ chấm</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </CollapsiblePanel>

            {/* ══════════════════════════════════════════════════════════
                TAB 4: BCB FINAL TEST (FULL 4 KỸ NĂNG)
                ══════════════════════════════════════════════════════════ */}
            <CollapsiblePanel
              title="BCB Final Test (Full 4 Kỹ Năng)"
              className="w-full"
              transparentTab={true}
              isOpen={panelFullOpen}
              onToggle={setPanelFullOpen}
              topContent={
                <div className="space-y-4">
                  {/* ── Quota & Status Banner ── */}
                  <div className="rounded-2xl border border-zinc-100 bg-[#595082] p-5 flex items-center justify-between gap-4 flex-wrap shadow-soft">
                    <div className="flex items-center gap-4">
                      {/* Circular Progress */}
                      <div className="relative h-16 w-16 shrink-0">
                        <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                          <circle
                            cx="18"
                            cy="18"
                            r="15.9"
                            fill="none"
                            stroke="#8578b8"
                            strokeWidth="3.2"
                          />
                          <circle
                            cx="18"
                            cy="18"
                            r="15.9"
                            fill="none"
                            stroke={completedRecords.length > 0 ? "#10b981" : "#f8c662"}
                            strokeWidth="3.2"
                            strokeDasharray={`${Math.min(completedRecords.length, 1) * 100} 100`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-sm font-black text-[#f8c662] tabular-nums">
                            {completedRecords.length}/1
                          </span>
                        </div>
                      </div>

                      <div>
                        <div className="text-sm font-black text-[#f8c662]">Hồ Sơ Final Test & Bảng Chẩn Bệnh (BCB)</div>
                        {completedRecords.length === 0 ? (
                          <div className="text-xs text-[#f8c662]/90 font-medium mt-0.5">
                            Chưa có kết quả Final Test được công bố. Hãy đăng ký ca thi cuối khóa để hoàn thành chương trình.
                          </div>
                        ) : (
                          <div className="text-xs text-emerald-300 font-bold mt-0.5 flex items-center gap-1.5">
                            <span>Đã có kết quả Final Test: Overall {latestCompleted?.scoreOverall || "6.5"} Band</span>
                            {latestCompleted?.resultStatus === "Đạt" || latestCompleted?.bcbData?.targetAchieved ? (
                              <span className="bg-emerald-500/20 text-emerald-200 text-[10px] px-2 py-0.5 rounded-md border border-emerald-400/30">
                                Đạt Chuẩn Đầu Ra
                              </span>
                            ) : (
                              <span className="bg-rose-500/20 text-rose-200 text-[10px] px-2 py-0.5 rounded-md border border-rose-400/30">
                                Cần Bổ Trợ
                              </span>
                            )}
                          </div>
                        )}
                        <div className="text-[10px] text-[#f8c662]/80 font-medium mt-0.5">
                          Được đánh giá 4 kỹ năng chuẩn theo Band Descriptors của Hội đồng Khảo thí
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="flex items-center gap-2">
                      {latestCompleted && (
                        <button
                          type="button"
                          onClick={() => setActiveBcbRecord(latestCompleted)}
                          className="rounded-2xl px-5 py-3 text-xs font-black uppercase tracking-wide bg-emerald-500 hover:bg-emerald-400 text-white transition-all shadow-md active:scale-[0.98] cursor-pointer"
                        >
                          Xem Bảng Chẩn Bệnh (BCB)
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={openBookingModal}
                        disabled={!canRegisterFinalTest}
                        className="rounded-2xl px-5 py-3 text-xs font-black uppercase tracking-wide bg-[#f8c662] text-slate-950 hover:bg-[#ffe082] transition-all shadow-md active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        + Đăng ký Final Test
                      </button>
                    </div>
                  </div>
                </div>
              }
            >
              <div className="space-y-4">
                {records.length === 0 ? (
                  <div className="text-center py-12 text-zinc-400 space-y-2 bg-zinc-50/50 rounded-2xl border border-zinc-200/60">
                    <div className="text-sm font-bold text-zinc-700">Chưa có kết quả Final Test nào</div>
                    <p className="text-xs text-zinc-400">
                      Hãy đăng ký thi Final Test sau khi hoàn thành lộ trình học để nhận Bảng Chẩn Bệnh chi tiết.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-soft">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-zinc-200 bg-zinc-50/80 text-[10px] font-black uppercase tracking-wider text-zinc-500">
                          <th className="px-4 py-3.5">Bài thi & Lớp</th>
                          <th className="px-4 py-3.5">Giám khảo</th>
                          <th className="px-4 py-3.5">Ngày thi</th>
                          <th className="px-4 py-3.5 text-center">L</th>
                          <th className="px-4 py-3.5 text-center">R</th>
                          <th className="px-4 py-3.5 text-center">W</th>
                          <th className="px-4 py-3.5 text-center">S</th>
                          <th className="px-4 py-3.5 text-center">OVERALL</th>
                          <th className="px-4 py-3.5">Chuẩn Đầu Ra</th>
                          <th className="px-4 py-3.5 text-right">Bảng Chẩn Bệnh (BCB)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 font-medium">
                        {records.map((r) => {
                          const isReleased = !!r.isChecked;
                          return (
                            <tr key={r.id} className="hover:bg-zinc-50/60 transition-colors">
                              <td className="px-4 py-3.5">
                                <div className="font-bold text-zinc-900">{FINAL_TEST_TYPE_LABELS[r.testType]}</div>
                                <div className="text-[10px] text-zinc-500 font-medium mt-0.5">
                                  {r.className || r.classCode || "Khóa học IELTS"}
                                </div>
                              </td>
                              <td className="px-4 py-3.5 font-bold text-zinc-700">{r.examinerName}</td>
                              <td className="px-4 py-3.5 font-mono text-zinc-600">{r.date}</td>
                              <td className="px-4 py-3.5 text-center font-bold text-zinc-800 tabular-nums">
                                {isReleased ? (r.scoreListening || "—") : "—"}
                              </td>
                              <td className="px-4 py-3.5 text-center font-bold text-zinc-800 tabular-nums">
                                {isReleased ? (r.scoreReading || "—") : "—"}
                              </td>
                              <td className="px-4 py-3.5 text-center font-bold text-zinc-800 tabular-nums">
                                {isReleased ? (r.scoreWriting || "—") : "—"}
                              </td>
                              <td className="px-4 py-3.5 text-center font-bold text-zinc-800 tabular-nums">
                                {isReleased ? (r.scoreSpeaking || "—") : "—"}
                              </td>
                              <td className="px-4 py-3.5 text-center font-black text-primary text-sm tabular-nums">
                                {isReleased ? (r.scoreOverall || "—") : "—"}
                              </td>
                              <td className="px-4 py-3.5">
                                {isReleased ? (
                                  <span
                                    className={`inline-flex rounded-md px-2 py-0.5 text-[9px] font-black uppercase tracking-wider border ${
                                      r.resultStatus === "Đạt" || r.bcbData?.targetAchieved
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                        : "bg-rose-50 text-rose-700 border-rose-200"
                                    }`}
                                  >
                                    {r.resultStatus || (r.bcbData?.targetAchieved ? "ĐẠT CHUẨN" : "CẦN BỔ TRỢ")}
                                  </span>
                                ) : (
                                  <span className="inline-flex rounded-md px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                                    Đang kiểm duyệt
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3.5 text-right">
                                {isReleased ? (
                                  <button
                                    type="button"
                                    onClick={() => setActiveBcbRecord(r)}
                                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary hover:bg-[#6a5acd] text-white px-3 py-1.5 text-xs font-black transition-all shadow-xs cursor-pointer active:scale-[0.98]"
                                  >
                                    Xem BCB
                                  </button>
                                ) : (
                                  <span className="text-zinc-400 text-xs italic">Chờ duyệt kết quả</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </CollapsiblePanel>

          </div>

          {/* Right Column: 3 cols (Sticky Schedule Panel) */}
          <div className="lg:col-span-3 self-start sticky top-4 z-20">
            <StudentSchedulePanel schedule={schedule} title="Thời khoá biểu" className="w-full" />
          </div>
        </div>
      </div>

      {/* ── Final Speaking Booking Modal (y chang Mock Test Speaking) ── */}
      {isBookingOpen && (
        <FinalSpeakingBookingModal
          open={isBookingOpen}
          studentId={student.id}
          studentName={student.name}
          studentPhone={(student as any).phone}
          onClose={() => setIsBookingOpen(false)}
          onSuccess={() => {
            void loadData();
            setDialog({
              tone: "success",
              title: "Đăng ký thành công",
              message: "Bạn đã đăng ký ca Final Test Speaking thành công! Vui lòng theo dõi lịch thi.",
            });
          }}
        />
      )}

      {/* ── BCB Report Drawer ── */}
      {activeBcbRecord && (
        <FinalTestBcbDrawer
          record={activeBcbRecord}
          onClose={() => setActiveBcbRecord(null)}
          onSaved={() => {
            void loadData();
          }}
        />
      )}

      {/* ── Student Dialogs ── */}
      {dialog && (
        <StudentDialog
          open={!!dialog}
          tone={dialog.tone}
          title={dialog.title}
          message={dialog.message}
          onClose={() => setDialog(null)}
        />
      )}
    </StudentLayout>
  );
}
