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
import {
  cancelFinalTestRecord,
  submitFinalWritingSubmission,
  FINAL_TEST_STATUS_LABELS,
  FINAL_TEST_TYPE_LABELS,
  FINAL_TEST_UPDATE_EVENT,
  listMyFinalTestRecords,
  type FinalTestRecord,
} from "@/lib/finalTestArchive";
import { confirmDialog } from "@/components/shared/ConfirmDialog";
import {
  fetchFinalTestEligibilityApi,
  type FinalTestEligibility,
} from "@/lib/acaManagementApi";
import { fetchLiveStudentDiagnosis } from "@/lib/studentDiagnosisApi";
import { useStudentDiagnosis } from "@/hooks/useStudentDiagnosis";
import { FinalSpeakingBookingModal } from "@/components/student/FinalSpeakingBookingModal";
import { FinalLrwBookingModal } from "@/components/student/FinalLrwBookingModal";
import {
  listMyEntranceTestBookings,
  ENTRANCE_STATUS_LABELS,
  ENTRANCE_TYPE_LABELS,
  type EntranceTestBooking,
} from "@/lib/entranceTestBookings";
import { getCachedAuthUser } from "@/lib/auth";
import { BcbQuestionTypeTable } from "@/components/diagnosis/BcbQuestionTypeTable";
import { SkillDiagIntro } from "@/components/diagnosis/SkillDiagIntro";
import { WritingDiagIntro } from "@/components/diagnosis/WritingDiagIntro";
import { WritingTask1CriteriaPanel } from "@/components/diagnosis/WritingTask1CriteriaPanel";
import { WritingTask2CriteriaPanel } from "@/components/diagnosis/WritingTask2CriteriaPanel";
import { SpeakingCriteriaPanel } from "@/components/diagnosis/SpeakingCriteriaPanel";
import { WritingScoreFormulaNote } from "@/components/diagnosis/WritingScoreFormulaNote";
import {
  getSpeakingStandardDescription,
  getWritingTask1StandardDescription,
  getWritingTask2StandardDescription,
} from "@/lib/bcbStandardReference";

export default function StudentLuuTruTestPage() {
  const student = getStudentIdentity();
  const schedule = useStudentSchedule();
  const authUser = getCachedAuthUser();
  const { diagnosis, writingBands } = useStudentDiagnosis();

  const [records, setRecords] = useState<FinalTestRecord[]>([]);
  const [entranceBookings, setEntranceBookings] = useState<EntranceTestBooking[]>([]);
  const [livePhone, setLivePhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [eligibility, setEligibility] = useState<FinalTestEligibility | null>(null);
  const [activeEntranceDiagTab, setActiveEntranceDiagTab] = useState<
    "listening" | "reading" | "writing" | "speaking"
  >("listening");
  const [entranceWritingTaskMode, setEntranceWritingTaskMode] = useState<"task1" | "task2">("task1");

  // 2 main tabs open state
  const [panelEntranceOpen, setPanelEntranceOpen] = useState(false);
  const [panelFinalOpen, setPanelFinalOpen] = useState(false);

  // Modals
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isLrwBookingOpen, setIsLrwBookingOpen] = useState(false);
  const [activeFinalBcbTab, setActiveFinalBcbTab] = useState<"speaking" | "writing" | "listening" | "reading">("speaking");
  const [finalWritingTaskMode, setFinalWritingTaskMode] = useState<"task1" | "task2">("task1");
  const [dialog, setDialog] = useState<{ tone: "success" | "warning"; title: string; message: string } | null>(null);

  // Final Writing Submission State
  const [finalWritingLink, setFinalWritingLink] = useState("");
  const [submittingFinalWriting, setSubmittingFinalWriting] = useState(false);
  const [selectedWritingTestId, setSelectedWritingTestId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const live = await fetchLiveStudentDiagnosis().catch(() => null);
      const identity = {
        id: student.id,
        name: student.name,
        email: authUser?.email || student.email || live?.email || "",
        phone: student.phone || live?.phone || "",
      };
      const [forStudent, eligibilityResult, myEntrance] = await Promise.all([
        listMyFinalTestRecords({
          id: identity.id,
          name: identity.name,
        }),
        fetchFinalTestEligibilityApi().catch(() => null),
        listMyEntranceTestBookings({
          name: identity.name,
          email: identity.email,
          phone: identity.phone,
        }).catch(() => []),
      ]);
      setRecords(forStudent);
      setEligibility(eligibilityResult);
      setLivePhone(live?.phone?.trim() || "");
      setEntranceBookings(myEntrance);
    } catch (err) {
      console.error("Failed to load tests", err);
    } finally {
      setLoading(false);
    }
  }, [student.id, student.name, student.email, student.phone, authUser?.email]);

  const hasGradedFinalResult = useMemo(() => {
    return records.some(
      (r) =>
        r.status !== "cancelled" &&
        (r.status === "graded" ||
          r.isChecked === true ||
          Boolean(r.scoreOverall || r.scoreSpeaking || r.scoreWriting || r.scoreListening || r.scoreReading))
    );
  }, [records]);

  const canRegisterFinalTest =
    eligibility?.eligible !== false && !hasGradedFinalResult;

  const openBookingModal = useCallback(() => {
    if (hasGradedFinalResult) {
      setDialog({
        tone: "warning",
        title: "Đã có kết quả Final Test",
        message: "Bạn đã có kết quả thi Final Test, không thể đăng ký thi lại.",
      });
      return;
    }
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
  }, [canRegisterFinalTest, hasGradedFinalResult, eligibility?.reason]);

  const openLrwBookingModal = useCallback(() => {
    if (hasGradedFinalResult) {
      setDialog({
        tone: "warning",
        title: "Đã có kết quả Final Test",
        message: "Bạn đã có kết quả thi Final Test, không thể đăng ký thi lại.",
      });
      return;
    }
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
    setIsLrwBookingOpen(true);
  }, [canRegisterFinalTest, hasGradedFinalResult, eligibility?.reason]);

  useEffect(() => {
    void loadData();
    window.addEventListener(FINAL_TEST_UPDATE_EVENT, loadData);
    window.addEventListener("storage", loadData);
    return () => {
      window.removeEventListener(FINAL_TEST_UPDATE_EVENT, loadData);
      window.removeEventListener("storage", loadData);
    };
  }, [loadData]);

  // Speaking tests — ẩn ca đã hủy (test/cancelled không hiện như đang duyệt)
  const speakingRecords = useMemo(() => {
    return records.filter(
      (r) =>
        r.status !== "cancelled" &&
        (r.testType === "speaking" || r.testType === "full_4_skills"),
    );
  }, [records]);

  // L-R-W (3 kỹ năng còn lại)
  const lrwRecords = useMemo(() => {
    return records.filter(
      (r) =>
        r.status !== "cancelled" &&
        (r.testType === "lr" ||
          r.testType === "writing" ||
          r.testType === "full_4_skills"),
    );
  }, [records]);

  // Writing tests
  const writingRecords = useMemo(() => {
    return records.filter(
      (r) =>
        r.status !== "cancelled" &&
        (r.testType === "writing" ||
          r.testType === "lr" ||
          r.testType === "full_4_skills"),
    );
  }, [records]);

  const activeWritingTest = useMemo(() => {
    if (selectedWritingTestId) {
      const found = writingRecords.find((r) => r.id === selectedWritingTestId);
      if (found) return found;
    }
    return (
      writingRecords.find((r) => r.status !== "graded") ||
      writingRecords[0] ||
      null
    );
  }, [writingRecords, selectedWritingTestId]);

  const handleSubmitFinalWriting = useCallback(
    async (targetId?: string) => {
      const target = targetId
        ? records.find((r) => r.id === targetId)
        : activeWritingTest;
      if (!target) {
        setDialog({
          tone: "warning",
          title: "Chưa có ca thi Writing",
          message:
            "Bạn chưa có ca thi Final Writing nào được xếp lịch. Vui lòng bấm 'Đăng ký lịch' trước khi nộp bài.",
        });
        return;
      }
      const link = finalWritingLink.trim();
      if (!link) {
        setDialog({
          tone: "warning",
          title: "Thiếu link bài làm",
          message: "Vui lòng dán link Google Docs bài làm Final Writing.",
        });
        return;
      }
      setSubmittingFinalWriting(true);
      try {
        await submitFinalWritingSubmission(target.id, link);
        setFinalWritingLink("");
        setSelectedWritingTestId(null);
        setDialog({
          tone: "success",
          title: "Nộp bài thành công",
          message:
            "Bài thi Final Writing của bạn đã được gửi thành công đến Hội đồng Khảo thí / Grader để chấm điểm.",
        });
        void loadData();
      } catch (err: any) {
        setDialog({
          tone: "warning",
          title: "Không gửi được bài",
          message: err.message || "Đã xảy ra lỗi khi gửi bài thi.",
        });
      } finally {
        setSubmittingFinalWriting(false);
      }
    },
    [activeWritingTest, finalWritingLink, loadData, records]
  );

  // Graded & Checked tests
  const completedRecords = useMemo(() => {
    return records.filter(
      (r) =>
        r.isChecked === true &&
        (r.status === "graded" || r.scoreOverall || r.scoreSpeaking || r.scoreWriting)
    );
  }, [records]);

  const latestCompleted = completedRecords[0] || null;

  // Entrance scores + BCB: cùng nguồn với trang Thông tin học viên
  const entranceScores = diagnosis.scores;
  const entranceAim = (diagnosis.aim || "").trim();
  const studentPhone = livePhone || diagnosis.studentPhone?.trim() || student.phone?.trim() || "";
  const entranceBand = (value?: number | null) =>
    value && value > 0 ? formatBandScore(value) : "—";
  const hasEntranceBcb = Boolean(
    diagnosis.bcbOverviewTitle ||
      diagnosis.bcbOverviewSummary ||
      diagnosis.bcbListening?.length ||
      diagnosis.bcbReading?.length ||
      diagnosis.skillSummaries?.listening ||
      diagnosis.skillSummaries?.reading ||
      diagnosis.skillSummaries?.speaking,
  );

  // Final Scores for 5-box grid
  const finalSpeakingScore = speakingRecords.find((r) => r.isChecked && r.scoreSpeaking)?.scoreSpeaking;
  const finalWritingScore = writingRecords.find((r) => r.isChecked && r.scoreWriting)?.scoreWriting;
  const finalListeningScore = latestCompleted?.scoreListening || null;
  const finalReadingScore = latestCompleted?.scoreReading || null;
  const finalOverallScore =
    latestCompleted?.scoreOverall ||
    (finalSpeakingScore && finalWritingScore
      ? Math.round(((Number(finalSpeakingScore) + Number(finalWritingScore)) / 2) * 2) / 2
      : null);

  // Final Writing Task 1 & 2 bands — không fallback band giả khi chưa có Final
  const finalTask1Band = useMemo(() => {
    const t1 = latestCompleted?.bcbData?.writing?.task1;
    const arr = [t1?.ta, t1?.cc, t1?.lr, t1?.gra].map(Number).filter((n) => !isNaN(n) && n > 0);
    if (arr.length > 0) return arr.reduce((a, b) => a + b, 0) / arr.length;
    const w = Number(finalWritingScore);
    return !isNaN(w) && w > 0 ? w : 0;
  }, [latestCompleted?.bcbData?.writing?.task1, finalWritingScore]);

  const finalTask2Band = useMemo(() => {
    const t2 = latestCompleted?.bcbData?.writing?.task2;
    const arr = [t2?.tr, t2?.cc, t2?.lr, t2?.gra].map(Number).filter((n) => !isNaN(n) && n > 0);
    if (arr.length > 0) return arr.reduce((a, b) => a + b, 0) / arr.length;
    const w = Number(finalWritingScore);
    return !isNaN(w) && w > 0 ? w : 0;
  }, [latestCompleted?.bcbData?.writing?.task2, finalWritingScore]);

  const finalCalculatedWritingOverall = useMemo(() => {
    if (finalTask1Band <= 0 && finalTask2Band <= 0) return 0;
    return Math.round(((finalTask1Band + finalTask2Band * 2) / 3) * 2) / 2;
  }, [finalTask1Band, finalTask2Band]);

  const hasFinalBcb = Boolean(
    latestCompleted?.bcbData &&
      (latestCompleted.bcbData.overviewTitle ||
        latestCompleted.bcbData.overviewSummary ||
        latestCompleted.bcbData.speaking ||
        latestCompleted.bcbData.writing ||
        latestCompleted.bcbData.lr ||
        (latestCompleted.bcbData.bcbListening && latestCompleted.bcbData.bcbListening.length > 0) ||
        (latestCompleted.bcbData.bcbReading && latestCompleted.bcbData.bcbReading.length > 0) ||
        finalSpeakingScore ||
        finalWritingScore ||
        finalListeningScore ||
        finalReadingScore),
  );

  // Final BCB Listening & Reading rows — chỉ lấy từ Final, không dùng bảng Entrance
  const finalBcbListeningRows = useMemo(() => {
    if (latestCompleted?.bcbData?.bcbListening && latestCompleted.bcbData.bcbListening.length > 0) {
      return latestCompleted.bcbData.bcbListening;
    }
    return [];
  }, [latestCompleted?.bcbData?.bcbListening]);

  const finalBcbReadingRows = useMemo(() => {
    if (latestCompleted?.bcbData?.bcbReading && latestCompleted.bcbData.bcbReading.length > 0) {
      return latestCompleted.bcbData.bcbReading;
    }
    return [];
  }, [latestCompleted?.bcbData?.bcbReading]);

  // Tự động tính tổng số câu đúng cho Listening và Reading
  const finalListeningCorrectCount = useMemo(() => {
    if (finalBcbListeningRows.length > 0) {
      const sum = finalBcbListeningRows.reduce((acc, r) => acc + (Number(r.correct) || 0), 0);
      const total = finalBcbListeningRows.reduce((acc, r) => acc + (Number(r.total) || 0), 0);
      if (sum > 0 || total > 0) {
        return total > 0 ? `${sum}/${total}` : String(sum);
      }
    }
    const raw = latestCompleted?.bcbData?.lr?.listeningCorrect;
    if (raw && String(raw).trim() !== "" && String(raw).trim() !== "0") {
      return String(raw).trim();
    }
    return "—";
  }, [latestCompleted?.bcbData?.lr?.listeningCorrect, finalBcbListeningRows]);

  const finalReadingCorrectCount = useMemo(() => {
    if (finalBcbReadingRows.length > 0) {
      const sum = finalBcbReadingRows.reduce((acc, r) => acc + (Number(r.correct) || 0), 0);
      const total = finalBcbReadingRows.reduce((acc, r) => acc + (Number(r.total) || 0), 0);
      if (sum > 0 || total > 0) {
        return total > 0 ? `${sum}/${total}` : String(sum);
      }
    }
    const raw = latestCompleted?.bcbData?.lr?.readingCorrect;
    if (raw && String(raw).trim() !== "" && String(raw).trim() !== "0") {
      return String(raw).trim();
    }
    return "—";
  }, [latestCompleted?.bcbData?.lr?.readingCorrect, finalBcbReadingRows]);

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

        <div className="grid grid-cols-1 items-stretch gap-10 lg:grid-cols-12">
          {/* Left Column: 9 cols */}
          <div className="lg:col-span-9 flex min-h-0 flex-col space-y-8">

            {/* ══════════════════════════════════════════════════════════
                TAB 1: ENTRANCE TEST (BÀI ĐẦU VÀO)
                ══════════════════════════════════════════════════════════ */}
            <CollapsiblePanel
              title="Entrance Test"
              className="w-full"
              transparentTab={true}
              isOpen={panelEntranceOpen}
              onToggle={setPanelEntranceOpen}
              topContent={
                <div className="space-y-4">
                  {/* ── Entrance Header Card ── */}
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
                            {entranceBand(entranceScores?.overall)}
                          </span>
                        </div>
                      </div>

                      <div>
                        <div className="text-sm font-black text-[#f8c662]">
                          Entrance Test
                        </div>
                        <div className="text-xs text-[#f8c662]/90 font-medium mt-0.5">
                          Bài đầu vào
                        </div>
                        {entranceAim && (
                          <div className="text-[10px] text-[#f8c662]/80 font-medium mt-0.5">
                            Mục tiêu: IELTS {entranceAim}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 5 Skills Score Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {[
                      { key: "Listening", val: entranceBand(entranceScores?.listening) },
                      { key: "Reading", val: entranceBand(entranceScores?.reading) },
                      { key: "Writing", val: entranceBand(entranceScores?.writing) },
                      { key: "Speaking", val: entranceBand(entranceScores?.speaking) },
                    ].map((s) => (
                      <div
                        key={s.key}
                        className="rounded-2xl border border-zinc-200/80 bg-zinc-50/80 p-3.5 text-center shadow-2xs"
                      >
                        <div className="text-xs font-black uppercase tracking-wider text-muted">
                          {s.key}
                        </div>
                        <div className="text-2xl sm:text-3xl font-black text-secondary mt-1 tabular-nums">
                          {s.val}
                        </div>
                        <div className="text-[10px] font-bold text-muted/80 mt-0.5">Band Đầu Vào</div>
                      </div>
                    ))}

                    <div className="col-span-2 sm:col-span-1 rounded-2xl border-2 border-primary/30 bg-primary/5 p-3.5 text-center shadow-xs flex flex-col justify-center">
                      <div className="text-xs font-black uppercase tracking-wider text-primary">
                        OVERALL
                      </div>
                      <div className="text-3xl sm:text-4xl font-black text-primary mt-0.5 tabular-nums">
                        {entranceBand(entranceScores?.overall)}
                      </div>
                      <div className="text-[10px] font-black text-primary/80 mt-0.5">
                        {entranceAim ? `Aim: ${entranceAim}` : "Band Đầu Vào"}
                      </div>
                    </div>
                  </div>
                </div>
              }
            >
              <div className="space-y-8">
                {entranceBookings.length > 0 && (
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
                              {b.scoreSpeaking || b.scoreWriting
                                ? formatBandScore(b.scoreSpeaking || b.scoreWriting)
                                : "—"}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {b.submissionLink ? (
                                <a
                                  href={b.submissionLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-primary font-bold hover:underline"
                                >
                                  Bài làm
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

                <div className="space-y-6">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900 flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                      Bảng Chẩn Bệnh Chi Tiết (BCB) Entrance Test
                    </h4>
                    <p className="text-[11px] text-zinc-500 font-medium mt-0.5">
                      Cùng nội dung với trang Thông tin học viên
                    </p>
                  </div>

                  {!hasEntranceBcb ? (
                    <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/60 px-6 py-10 text-center">
                      <p className="text-sm font-bold text-zinc-700">Chưa có dữ liệu BCB đầu vào</p>
                      <p className="mt-1.5 text-xs font-medium text-zinc-500 leading-relaxed max-w-md mx-auto">
                        Khi Sale nhập Listening &amp; Reading và Grader chấm Writing / Speaking Entrance, nội dung BCB sẽ hiện ở đây.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="rounded-3xl border border-zinc-100 bg-gradient-to-br from-zinc-50 to-white p-6 shadow-soft">
                        <div className="flex w-full flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
                          <div className="relative flex shrink-0 items-center justify-center self-center sm:self-start">
                            <svg className="h-20 w-20 -rotate-90 transform" viewBox="0 0 36 36">
                              <circle cx="18" cy="18" r="15.9" stroke="#eeebff" strokeWidth="3" fill="transparent" />
                              <circle
                                cx="18"
                                cy="18"
                                r="15.9"
                                stroke="#6a5acd"
                                strokeWidth="3"
                                fill="transparent"
                                strokeDasharray="100 100"
                                strokeLinecap="round"
                              />
                            </svg>
                            <div className="absolute text-center">
                              <span className="block text-lg font-black leading-none text-primary tabular-nums">
                                {entranceBand(entranceScores.overall)}
                              </span>
                              <span className="mt-0.5 block text-[8px] font-bold uppercase tracking-wider text-muted">
                                Aim {formatBandScore(diagnosis.aim)}
                              </span>
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-[10px] font-black uppercase tracking-widest text-muted">Đánh giá chung</div>
                            <h4 className="text-md mt-0.5 font-bold text-foreground">{diagnosis.bcbOverviewTitle}</h4>
                            <p className="mt-1 w-full text-xs font-medium leading-relaxed text-zinc-500">
                              {diagnosis.bcbOverviewSummary}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 border-b border-zinc-100 pb-4">
                        {[
                          { id: "listening", label: "Listening", score: formatBandScore(diagnosis.scores.listening) },
                          { id: "reading", label: "Reading", score: formatBandScore(diagnosis.scores.reading) },
                          { id: "writing", label: "Writing", score: formatBandScore(diagnosis.scores.writing) },
                          { id: "speaking", label: "Speaking", score: formatBandScore(diagnosis.scores.speaking) },
                        ].map((tab) => {
                          const active = activeEntranceDiagTab === tab.id;
                          return (
                            <button
                              key={tab.id}
                              type="button"
                              onClick={() =>
                                setActiveEntranceDiagTab(
                                  tab.id as "listening" | "reading" | "writing" | "speaking",
                                )
                              }
                              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                                active
                                  ? "bg-primary text-white shadow-soft"
                                  : "bg-zinc-100/70 hover:bg-zinc-100 text-zinc-600"
                              }`}
                            >
                              <span>{tab.label}</span>
                              {tab.score && (
                                <span
                                  className={`px-1.5 py-0.5 rounded-lg text-[9px] font-black ${
                                    active ? "bg-white/20 text-white" : "bg-zinc-200 text-zinc-700"
                                  }`}
                                >
                                  {tab.score}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {activeEntranceDiagTab === "listening" && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                          <SkillDiagIntro
                            bandLabel={`Đặc trưng Band ${formatBandScore(diagnosis.scores.listening)}`}
                            summary={diagnosis.skillSummaries.listening}
                          />
                          <BcbQuestionTypeTable rows={diagnosis.bcbListening} showWeakCta />
                        </div>
                      )}

                      {activeEntranceDiagTab === "reading" && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                          <SkillDiagIntro
                            bandLabel={`Đặc trưng Band ${formatBandScore(diagnosis.scores.reading)}`}
                            summary={diagnosis.skillSummaries.reading}
                          />
                          <BcbQuestionTypeTable rows={diagnosis.bcbReading} showWeakCta />
                        </div>
                      )}

                      {activeEntranceDiagTab === "writing" && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                          <WritingDiagIntro
                            taskMode={entranceWritingTaskMode}
                            onTaskModeChange={setEntranceWritingTaskMode}
                            task1Band={writingBands.task1Band}
                            task2Band={writingBands.task2Band}
                            summary={diagnosis.writingSummary[entranceWritingTaskMode]}
                            submissionLink={diagnosis.writingLinks[entranceWritingTaskMode]}
                          />
                          <div>
                            <div className="text-[10px] font-black text-muted uppercase tracking-widest mb-3">
                              Chi tiết tiêu chí chấm điểm -{" "}
                              {entranceWritingTaskMode === "task1" ? "Writing Task 1" : "Writing Task 2"}
                            </div>
                            {entranceWritingTaskMode === "task1" ? (
                              <WritingTask1CriteriaPanel scores={diagnosis.writingCriteria.task1} />
                            ) : (
                              <WritingTask2CriteriaPanel scores={diagnosis.writingCriteria.task2} />
                            )}
                          </div>
                          <WritingScoreFormulaNote
                            task1Band={writingBands.task1Band}
                            task2Band={writingBands.task2Band}
                            writingOverall={writingBands.writingOverall}
                          />
                        </div>
                      )}

                      {activeEntranceDiagTab === "speaking" && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                          <div className="p-5 rounded-2xl border border-zinc-100 bg-zinc-50/50">
                            <div className="text-[10px] font-black text-muted uppercase tracking-widest">
                              Đặc trưng Speaking Band {formatBandScore(diagnosis.scores.speaking)}
                            </div>
                            <p className="text-xs font-medium text-foreground leading-relaxed mt-2">
                              {diagnosis.skillSummaries.speaking}
                            </p>
                          </div>
                          <div>
                            <div className="text-[10px] font-black text-muted uppercase tracking-widest mb-3">
                              Chi tiết tiêu chí Speaking
                            </div>
                            <SpeakingCriteriaPanel scores={diagnosis.speakingCriteria} />
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </CollapsiblePanel>

            {/* ══════════════════════════════════════════════════════════
                TAB 2: FINAL TEST (BÀI ĐẦU RA)
                ══════════════════════════════════════════════════════════ */}
            <CollapsiblePanel
              title="Final Test"
              className="w-full"
              transparentTab={true}
              isOpen={panelFinalOpen}
              onToggle={setPanelFinalOpen}
              topContent={
                <div className="space-y-4">
                  {/* ── Final Header Card (Khung tròn điểm + Final Test / Bài đầu ra / Aim / ĐK) ── */}
                  <div className="rounded-2xl border border-zinc-100 bg-[#595082] p-5 flex items-center justify-between gap-4 flex-wrap shadow-soft">
                    <div className="flex items-center gap-4">
                      {/* Circular Progress / Score */}
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
                            stroke={finalOverallScore ? "#10b981" : "#f8c662"}
                            strokeWidth="3.2"
                            strokeDasharray={`${finalOverallScore ? 100 : 0} 100`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-sm font-black text-[#f8c662] tabular-nums">
                            {finalOverallScore ? formatBandScore(finalOverallScore) : "—"}
                          </span>
                        </div>
                      </div>

                      <div>
                        <div className="text-sm font-black text-[#f8c662]">Final Test</div>
                        <div className="text-xs text-[#f8c662]/90 font-medium mt-0.5">
                          Bài đầu ra
                        </div>
                        <div className="text-[11px] text-[#f8c662] font-extrabold mt-0.5">
                          Aim: {entranceAim || "—"}
                        </div>
                      </div>
                    </div>

                    {/* Action Button: Đăng ký ngay / Xem kết quả khi thu gọn / Thu gọn khi mở rộng */}
                    <button
                      type="button"
                      onClick={() => setPanelFinalOpen(!panelFinalOpen)}
                      className={`flex items-center gap-1.5 transition-all cursor-pointer ${
                        panelFinalOpen
                          ? "rounded-xl px-3 py-1.5 text-[11px] font-extrabold bg-zinc-100 text-zinc-600 hover:bg-zinc-200 shadow-2xs"
                          : hasGradedFinalResult
                          ? "rounded-2xl px-6 py-3.5 text-sm font-black uppercase tracking-wide bg-emerald-600 text-white hover:bg-emerald-500 active:scale-[0.98] hover:shadow-md"
                          : "rounded-2xl px-6 py-3.5 text-sm font-black uppercase tracking-wide bg-primary text-white hover:bg-primary/90 active:scale-[0.98] hover:shadow-md"
                      }`}
                    >
                      {panelFinalOpen ? (
                        <>
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                          </svg>
                          Thu gọn
                        </>
                      ) : hasGradedFinalResult ? (
                        <>
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Xem kết quả
                        </>
                      ) : (
                        <>
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                          </svg>
                          Đăng ký ngay
                        </>
                      )}
                    </button>
                  </div>

                  {/* ── Warning Điều kiện đăng ký Final Test (chỉ nằm gọn trong tab Final Test) ── */}
                  {!canRegisterFinalTest && eligibility && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-2xs">
                      <p className="font-bold flex items-center gap-1.5">
                        <svg className="h-4 w-4 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Chưa đủ điều kiện đăng ký Final Test
                      </p>
                      <p className="mt-1 text-xs font-medium text-amber-800">
                        {eligibility.reason ||
                          "Bạn cần hoàn thành đủ 2 chặng (1 khóa học) trước khi đăng ký Final Test."}
                      </p>
                      <p className="mt-1 text-[11px] text-amber-700">
                        Tiến độ lớp: {eligibility.totalSessionsElapsed}/{eligibility.requiredSessions} buổi đã hoàn thành
                        <span className="block text-xs font-medium text-amber-700/80 mt-0.5">
                          Tính theo buổi lớp (điểm danh/lịch), kể cả khi bạn vắng.
                        </span>
                      </p>
                    </div>
                  )}

                  {/* 5 Skills Score Grid for Final Test */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {[
                      { key: "Listening", val: finalListeningScore ? formatBandScore(finalListeningScore) : "—" },
                      { key: "Reading", val: finalReadingScore ? formatBandScore(finalReadingScore) : "—" },
                      { key: "Writing", val: finalWritingScore ? formatBandScore(finalWritingScore) : "—" },
                      { key: "Speaking", val: finalSpeakingScore ? formatBandScore(finalSpeakingScore) : "—" },
                    ].map((s) => (
                      <div
                        key={s.key}
                        className="rounded-2xl border border-zinc-200/80 bg-zinc-50/80 p-3.5 text-center shadow-2xs"
                      >
                        <div className="text-xs font-black uppercase tracking-wider text-muted">
                          {s.key}
                        </div>
                        <div className="text-2xl sm:text-3xl font-black text-secondary mt-1 tabular-nums">
                          {s.val}
                        </div>
                        <div className="text-[10px] font-bold text-muted/80 mt-0.5">Band Đầu Ra</div>
                      </div>
                    ))}

                    <div className="col-span-2 sm:col-span-1 rounded-2xl border-2 border-primary/30 bg-primary/5 p-3.5 text-center shadow-xs flex flex-col justify-center">
                      <div className="text-xs font-black uppercase tracking-wider text-primary">
                        OVERALL
                      </div>
                      <div className="text-3xl sm:text-4xl font-black text-primary mt-0.5 tabular-nums">
                        {finalOverallScore ? formatBandScore(finalOverallScore) : "—"}
                      </div>
                      <div className="text-[10px] font-black text-primary/80 mt-0.5">
                        {entranceAim ? `Aim: ${entranceAim}` : "Band Đầu Ra"}
                      </div>
                    </div>
                  </div>

                  {/* Upcoming Speaking Card if any */}
                  {upcomingSpeaking.length > 0 && (
                    <div className="grid gap-3 sm:grid-cols-2 pt-2">
                      {upcomingSpeaking.map((t) => {
                        const meet = t.meetLink || getGraderMeetLink(t.examinerName);
                        return (
                          <div
                            key={t.id}
                            className="rounded-2xl border border-primary/30 bg-primary/5 p-4 flex justify-between items-start shadow-2xs"
                          >
                            <div>
                              <div className="text-sm font-extrabold text-foreground">
                                Ca Thi Final Test Speaking Sắp Diễn Ra
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
                                  Meet thi
                                </a>
                              )}
                              <button
                                type="button"
                                onClick={async () => {
                                  const ok = await confirmDialog({
                                    title: "Hủy ca thi",
                                    message: "Bạn có chắc chắn muốn hủy ca thi này không?",
                                    confirmText: "Đồng ý hủy",
                                    cancelText: "Giữ lại",
                                    variant: "danger",
                                  });
                                  if (!ok) return;
                                  await cancelFinalTestRecord(t.id);
                                  void loadData();
                                }}
                                className="text-[10px] font-black uppercase text-secondary hover:underline cursor-pointer"
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
              <div className="space-y-8">
                {/* ── Sub-section 1: Final Test Speaking Table ── */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-wider text-zinc-700 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-purple-500" />
                      1. Ca Thi Final Test Speaking (1-1 Giám Khảo)
                    </h4>
                    <button
                      type="button"
                      onClick={openBookingModal}
                      disabled={!canRegisterFinalTest}
                      className="inline-flex items-center gap-1 rounded-xl bg-primary text-white hover:bg-primary/90 px-3 py-1 text-[11px] font-black uppercase tracking-wider transition-all shadow-2xs cursor-pointer active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      Đăng ký lịch
                    </button>
                  </div>

                  {speakingRecords.length === 0 ? (
                    <div className="text-center py-6 text-zinc-400 text-xs font-bold bg-zinc-50/50 rounded-2xl border border-zinc-200/60">
                      Chưa có ca thi Final Speaking nào. Bấm &quot;Đăng ký ngay&quot; để chọn lịch thi.
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
                            <th className="px-4 py-3 text-right">Link Google Meet</th>
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
                                <td className="px-4 py-3 text-right">
                                  {meetUrl ? (
                                    <a
                                      href={meetUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-all shadow-2xs"
                                    >
                                      Meet thi
                                    </a>
                                  ) : (
                                    <span className="text-zinc-400 text-xs italic">—</span>
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

                {/* ── Sub-section 1b: Final Test L-R-W & Writing Submission ── */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-wider text-zinc-700 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-sky-500" />
                      2. Ca Thi Final Listening · Reading · Writing
                    </h4>
                    <button
                      type="button"
                      onClick={openLrwBookingModal}
                      disabled={!canRegisterFinalTest}
                      className="inline-flex items-center gap-1 rounded-xl bg-sky-600 text-white hover:bg-sky-500 px-3 py-1 text-[11px] font-black uppercase tracking-wider transition-all shadow-2xs cursor-pointer active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      Đăng ký lịch
                    </button>
                  </div>

                  {/* ── Submit Link Input — Tương tự bên Chấm - Chữa Writing bên Hỗ trợ tự học ── */}
                  {activeWritingTest ? (
                    <div className="flex flex-col gap-2 rounded-2xl border border-sky-200/80 bg-sky-50/50 p-4 shadow-2xs animate-in fade-in duration-200">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <label className="text-[10px] font-black text-sky-900 uppercase tracking-widest flex items-center gap-1.5">
                          <svg className="h-4 w-4 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Nộp bài thi Final Writing (Google Docs)
                        </label>
                        <span className="text-[10px] font-bold text-sky-800 bg-sky-100/80 px-2.5 py-0.5 rounded-full border border-sky-200">
                          Ngày thi: {activeWritingTest.date} • {activeWritingTest.examinerName || "Hội đồng khảo thí"}
                        </span>
                      </div>

                      <div className="flex gap-2 pt-1">
                        <input
                          id="final-writing-link-input"
                          type="url"
                          value={finalWritingLink}
                          onChange={(e) => setFinalWritingLink(e.target.value)}
                          placeholder="Dán link Google Docs bài làm Final Writing vào đây..."
                          className="flex-1 h-11 rounded-xl border border-sky-200 bg-white px-4 text-xs font-medium focus:ring-2 focus:ring-sky-200 outline-none transition-all placeholder:text-zinc-400"
                        />
                        <button
                          type="button"
                          onClick={() => void handleSubmitFinalWriting(selectedWritingTestId || activeWritingTest.id)}
                          disabled={submittingFinalWriting || !finalWritingLink.trim()}
                          className="h-11 rounded-xl bg-sky-600 hover:bg-sky-500 px-6 text-[10px] font-black uppercase tracking-widest text-white transition-all shadow-2xs cursor-pointer active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shrink-0 flex items-center gap-1.5"
                        >
                          {submittingFinalWriting
                            ? "Đang gửi..."
                            : activeWritingTest.submissionLink
                            ? "Cập nhật bài nộp"
                            : "Gửi bài thi"}
                        </button>
                      </div>

                      {activeWritingTest.submissionLink && (
                        <div className="flex items-center justify-between pt-1 text-[11px] text-zinc-600 flex-wrap gap-2">
                          <div className="flex items-center gap-1.5 truncate max-w-lg">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase">Link bài đã nộp:</span>
                            <span className="truncate font-mono text-zinc-800 font-semibold">{activeWritingTest.submissionLink}</span>
                          </div>
                          <a
                            href={activeWritingTest.submissionLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sky-700 hover:text-sky-900 hover:underline font-extrabold text-[11px] inline-flex items-center gap-1 shrink-0"
                          >
                            <span>Mở Google Docs bài làm</span>
                            <span>↗</span>
                          </a>
                        </div>
                      )}
                    </div>
                  ) : null}

                  {lrwRecords.length === 0 ? (
                    <div className="text-center py-6 text-zinc-400 text-xs font-bold bg-zinc-50/50 rounded-2xl border border-zinc-200/60">
                      Chưa có ca thi Final L·R·W nào. Bấm &quot;Đăng ký lịch&quot; để chọn ngày thi 3 kỹ năng còn lại.
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-soft">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-zinc-200 bg-zinc-50/80 text-[10px] font-black uppercase tracking-wider text-zinc-500">
                            <th className="px-4 py-3">Bài thi</th>
                            <th className="px-4 py-3">Ngày thi</th>
                            <th className="px-4 py-3">Hình thức</th>
                            <th className="px-4 py-3">Trạng thái</th>
                            <th className="px-4 py-3 text-center">L</th>
                            <th className="px-4 py-3 text-center">R</th>
                            <th className="px-4 py-3 text-center">W</th>
                            <th className="px-4 py-3 text-center">Link bài làm</th>
                            <th className="px-4 py-3 text-center">Bài chấm / BCB</th>
                            <th className="px-4 py-3 text-right">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 font-medium">
                          {lrwRecords.map((r) => {
                            const isReleased = !!r.isChecked;
                            const isWriting = r.testType === "writing" || r.testType === "full_4_skills";
                            const hasSubmitted = Boolean(r.submissionLink && r.submissionLink.startsWith("http"));
                            
                            return (
                              <tr key={`lrw-${r.id}`} className="hover:bg-zinc-50/60 transition-colors">
                                <td className="px-4 py-3">
                                  <div className="font-bold text-zinc-900">
                                    {FINAL_TEST_TYPE_LABELS[r.testType] || r.testType}
                                  </div>
                                </td>
                                <td className="px-4 py-3 font-mono text-zinc-600">{r.date}</td>
                                <td className="px-4 py-3 text-zinc-700 capitalize">{r.format}</td>
                                <td className="px-4 py-3">
                                  {isReleased ? (
                                    <span
                                      className={`inline-flex rounded-md px-2 py-0.5 text-[9px] font-black uppercase tracking-wider border ${
                                        r.status === "graded"
                                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                          : "bg-sky-50 text-sky-700 border-sky-200"
                                      }`}
                                    >
                                      {FINAL_TEST_STATUS_LABELS[r.status] || r.status}
                                    </span>
                                  ) : hasSubmitted ? (
                                    <span className="inline-flex rounded-md px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                                      Đã nộp bài (Đang chấm)
                                    </span>
                                  ) : (
                                    <span className="inline-flex rounded-md px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-zinc-100 text-zinc-600 border border-zinc-200">
                                      {isWriting ? "Chưa nộp bài" : (FINAL_TEST_STATUS_LABELS[r.status] || r.status)}
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-center font-bold tabular-nums">
                                  {isReleased ? r.scoreListening || "—" : "—"}
                                </td>
                                <td className="px-4 py-3 text-center font-bold tabular-nums">
                                  {isReleased ? r.scoreReading || "—" : "—"}
                                </td>
                                <td className="px-4 py-3 text-center font-bold tabular-nums">
                                  {isReleased ? (
                                    <span className="text-primary font-black">{r.scoreWriting || "—"}</span>
                                  ) : (
                                    "—"
                                  )}
                                </td>

                                {/* Link bài làm (Google Docs) */}
                                <td className="px-4 py-3 text-center">
                                  {hasSubmitted ? (
                                    <a
                                      href={r.submissionLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 rounded-md bg-sky-50 border border-sky-200 px-2 py-1 text-[10px] font-bold text-sky-700 hover:bg-sky-100 transition-colors shadow-2xs"
                                    >
                                      <span>Mở bài làm</span>
                                      <span className="text-[9px]">↗</span>
                                    </a>
                                  ) : isWriting ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedWritingTestId(r.id);
                                        const el = document.getElementById("final-writing-link-input");
                                        if (el) {
                                          el.focus();
                                          el.scrollIntoView({ behavior: "smooth", block: "center" });
                                        }
                                      }}
                                      className="inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200 px-2 py-1 text-[10px] font-bold text-amber-700 hover:bg-amber-100 transition-colors cursor-pointer"
                                    >
                                      + Nộp bài
                                    </button>
                                  ) : (
                                    <span className="text-zinc-400 text-[10px]">—</span>
                                  )}
                                </td>

                                {/* Bài chấm */}
                                <td className="px-4 py-3 text-center">
                                  {isReleased ? (
                                    r.examLink && r.examLink.startsWith("http") ? (
                                      <a
                                        href={r.examLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-2 py-1 text-[10px] font-bold text-emerald-700 hover:bg-emerald-100 transition-colors shadow-2xs"
                                        title="Mở bài chấm Google Docs"
                                      >
                                        <span>Bài chấm</span>
                                        <span className="text-[9px]">↗</span>
                                      </a>
                                    ) : (
                                      <span className="text-zinc-400 text-[10px]">—</span>
                                    )
                                  ) : hasSubmitted ? (
                                    <span className="text-zinc-400 text-[10px] italic">Đang chấm</span>
                                  ) : (
                                    <span className="text-zinc-400 text-[10px]">—</span>
                                  )}
                                </td>

                                {/* Thao tác */}
                                <td className="px-4 py-3 text-right">
                                  <div className="inline-flex items-center gap-2 justify-end">
                                    {isWriting && (r.status === "scheduled" || r.status === "in_progress") && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSelectedWritingTestId(r.id);
                                          if (r.submissionLink) {
                                            setFinalWritingLink(r.submissionLink);
                                          }
                                          const el = document.getElementById("final-writing-link-input");
                                          if (el) {
                                            el.focus();
                                            el.scrollIntoView({ behavior: "smooth", block: "center" });
                                          }
                                        }}
                                        className="text-[10px] font-bold text-sky-600 hover:underline cursor-pointer"
                                      >
                                        {hasSubmitted ? "Đổi link" : "Nộp bài"}
                                      </button>
                                    )}

                                    {r.status === "scheduled" || r.status === "in_progress" ? (
                                      <button
                                        type="button"
                                        onClick={async () => {
                                          const ok = await confirmDialog({
                                            title: "Hủy đăng ký ca thi",
                                            message: "Bạn có chắc chắn muốn hủy đăng ký ca thi này không?",
                                            confirmText: "Đồng ý hủy",
                                            cancelText: "Giữ lại",
                                            variant: "danger",
                                          });
                                          if (!ok) return;
                                          try {
                                            await cancelFinalTestRecord(r.id);
                                            void loadData();
                                          } catch (err) {
                                            setDialog({
                                              tone: "warning",
                                              title: "Không hủy được",
                                              message:
                                                err instanceof Error
                                                  ? err.message
                                                  : "Không thể hủy ca thi. Vui lòng thử lại.",
                                            });
                                          }
                                        }}
                                        className="text-[10px] font-bold text-rose-600 hover:underline cursor-pointer"
                                      >
                                        Hủy ca
                                      </button>
                                    ) : (
                                      <span className="text-zinc-400 text-[10px]">—</span>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* ── Sub-section 2: Bảng Chẩn Bệnh (BCB) Final Tổng Hợp ── */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-wider text-zinc-700 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      3. Hồ Sơ Bảng Chẩn Bệnh (BCB) Final Test 4 Kỹ Năng
                    </h4>
                  </div>

                  {records.length === 0 ? (
                    <div className="text-center py-6 text-zinc-400 text-xs font-bold bg-zinc-50/50 rounded-2xl border border-zinc-200/60">
                      Chưa có kết quả Final Test nào được công bố.
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
                            <th className="px-4 py-3.5 text-right">Chuẩn Đầu Ra</th>
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
                                <td className="px-4 py-3.5 text-right">
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
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* ── Bảng Chẩn Bệnh Chi Tiết (BCB) Final Test (4 Kỹ Năng) ── */}
                  <div className="mt-8 pt-6 border-t border-zinc-200/80 space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900 flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                          Bảng Chẩn Bệnh Chi Tiết (BCB) Final Test
                        </h4>
                        <p className="text-[11px] text-zinc-500 font-medium mt-0.5">
                          Đánh giá chi tiết 4 kỹ năng chuẩn theo Band Descriptors của Hội đồng Khảo thí
                        </p>
                      </div>
                    </div>

                    {/* Overall Health Card */}
                    <div className="rounded-3xl border border-zinc-100 bg-gradient-to-br from-zinc-50 to-white p-6 shadow-soft">
                      <div className="flex w-full flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
                        {/* Circular overall score badge */}
                        <div className="relative flex shrink-0 items-center justify-center self-center sm:self-start">
                          <svg className="h-20 w-20 -rotate-90 transform" viewBox="0 0 36 36">
                            <circle cx="18" cy="18" r="15.9" stroke="#eeebff" strokeWidth="3" fill="transparent" />
                            <circle
                              cx="18"
                              cy="18"
                              r="15.9"
                              stroke={finalOverallScore ? "#6a5acd" : "#f8c662"}
                              strokeWidth="3"
                              fill="transparent"
                              strokeDasharray="100 100"
                              strokeDashoffset={finalOverallScore ? "0" : "75"}
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute text-center">
                            <span className="block text-lg font-black leading-none text-primary tabular-nums">
                              {finalOverallScore ? formatBandScore(finalOverallScore) : "—"}
                            </span>
                            <span className="mt-0.5 block text-[8px] font-bold uppercase tracking-wider text-muted">
                              {entranceAim ? `Aim ${entranceAim}` : "Band Final"}
                            </span>
                          </div>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="text-[10px] font-black uppercase tracking-widest text-muted">
                            Đánh giá chuẩn đầu ra Final
                          </div>
                          <h4 className="text-sm mt-0.5 font-bold text-foreground">
                            {latestCompleted?.bcbData?.overviewTitle ||
                              (hasFinalBcb
                                ? "Kết quả Final Test"
                                : "Chưa có dữ liệu chẩn bệnh Final")}
                          </h4>
                          <p className="mt-1 w-full text-xs font-medium leading-relaxed text-zinc-500">
                            {latestCompleted?.bcbData?.overviewSummary ||
                              latestCompleted?.bcbData?.generalPrescription ||
                              (hasFinalBcb
                                ? "Điểm Final đã được công bố. Chi tiết nhận xét sẽ hiện khi ACA hoàn tất BCB."
                                : "Chưa có dữ liệu chẩn bệnh Final Test. Hãy hoàn thành ca thi để nhận kết quả phân tích 4 kỹ năng.")}
                          </p>
                          {latestCompleted?.bcbData?.nextCourseRecommendation && (
                            <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-primary/10 border border-primary/20 text-xs font-bold text-primary">
                              <span>🎯 Lộ trình nâng cao đề xuất:</span>
                              <span className="font-extrabold">{latestCompleted.bcbData.nextCourseRecommendation}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 4 Skill Tabs — chỉ hiện chi tiết khi đã có Final đã duyệt */}
                    {!hasFinalBcb ? (
                      <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/60 px-6 py-10 text-center">
                        <p className="text-sm font-bold text-zinc-700">Chưa có dữ liệu chẩn bệnh Final Test</p>
                        <p className="mt-1.5 text-xs font-medium text-zinc-500 leading-relaxed max-w-md mx-auto">
                          Hoàn thành ca thi và chờ giám khảo/ACA duyệt trả kết quả để xem phân tích 4 kỹ năng.
                        </p>
                      </div>
                    ) : (
                      <>
                    <div className="flex flex-wrap gap-2 border-b border-zinc-100 pb-4">
                      {[
                        { id: "speaking", label: "Speaking", score: finalSpeakingScore ? formatBandScore(finalSpeakingScore) : null },
                        { id: "writing", label: "Writing", score: finalWritingScore || (finalCalculatedWritingOverall > 0 ? formatBandScore(finalCalculatedWritingOverall) : null) },
                        { id: "listening", label: "Listening", score: finalListeningScore ? formatBandScore(finalListeningScore) : null },
                        { id: "reading", label: "Reading", score: finalReadingScore ? formatBandScore(finalReadingScore) : null },
                      ].map((tab) => {
                        const active = activeFinalBcbTab === tab.id;
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveFinalBcbTab(tab.id as any)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                              active
                                ? "bg-primary text-white shadow-soft"
                                : "bg-zinc-100/70 hover:bg-zinc-100 text-zinc-600"
                            }`}
                          >
                            <span>{tab.label}</span>
                            {tab.score && (
                              <span
                                className={`px-1.5 py-0.5 rounded-lg text-[9px] font-black ${
                                  active ? "bg-white/20 text-white" : "bg-zinc-200 text-zinc-700"
                                }`}
                              >
                                {tab.score}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Tab Content: Speaking */}
                    {activeFinalBcbTab === "speaking" && (
                      <div className="space-y-5 animate-in fade-in duration-200">
                        {finalSpeakingScore || latestCompleted?.bcbData?.speaking ? (
                          <>
                        {/* Standard Band Overview */}
                        <div className="p-4 rounded-2xl border border-purple-100 bg-purple-50/40">
                          <div className="text-[10px] font-black text-purple-700 uppercase tracking-widest">
                            Đặc trưng Speaking Band {formatBandScore(Number(finalSpeakingScore) || Number(latestCompleted?.bcbData?.speaking?.fc) || 0)} (Chuẩn Cambridge)
                          </div>
                          <p className="text-xs font-medium text-zinc-700 leading-relaxed mt-1.5 whitespace-pre-line">
                            {getSpeakingStandardDescription(
                              Number(finalSpeakingScore) ||
                                Number(latestCompleted?.bcbData?.speaking?.fc) ||
                                0,
                            )}
                          </p>
                        </div>

                        {/* 4 Rubric Criteria Panel */}
                        <SpeakingCriteriaPanel
                          scores={{
                            fluencyCoherence: Number(latestCompleted?.bcbData?.speaking?.fc) || Number(finalSpeakingScore) || 0,
                            lexicalResource: Number(latestCompleted?.bcbData?.speaking?.lr) || Number(finalSpeakingScore) || 0,
                            grammaticalRangeAccuracy: Number(latestCompleted?.bcbData?.speaking?.gra) || Number(finalSpeakingScore) || 0,
                            pronunciation: Number(latestCompleted?.bcbData?.speaking?.pr) || Number(finalSpeakingScore) || 0,
                          }}
                        />

                        {/* Strengths & Weaknesses */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-4">
                            <div className="text-[10px] font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                              <span>✓</span> Điểm mạnh (Strengths)
                            </div>
                            <p className="text-xs font-medium text-emerald-950 mt-1.5 leading-relaxed">
                              {latestCompleted?.bcbData?.speaking?.strengths || "Chưa có nhận xét điểm mạnh."}
                            </p>
                          </div>
                          <div className="rounded-2xl border border-rose-100 bg-rose-50/30 p-4">
                            <div className="text-[10px] font-black uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
                              <span>!</span> Điểm cần cải thiện (Weaknesses)
                            </div>
                            <p className="text-xs font-medium text-rose-950 mt-1.5 leading-relaxed">
                              {latestCompleted?.bcbData?.speaking?.weaknesses || "Chưa có nhận xét điểm yếu."}
                            </p>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                          <div className="text-[10px] font-black uppercase tracking-wider text-primary">
                            Phác đồ cải thiện Speaking từ Giám khảo
                          </div>
                          <p className="text-xs font-medium text-zinc-700 mt-1.5 leading-relaxed">
                            {latestCompleted?.bcbData?.speaking?.prescription || "Chưa có phác đồ cải thiện Speaking."}
                          </p>
                        </div>
                          </>
                        ) : (
                          <p className="text-xs font-medium text-zinc-500 py-6 text-center">
                            Chưa có điểm / nhận xét Speaking Final.
                          </p>
                        )}
                      </div>
                    )}

                    {/* Tab Content: Writing (Tách Task 1 & Task 2) */}
                    {activeFinalBcbTab === "writing" && (
                      <div className="space-y-5 animate-in fade-in duration-200">
                        {finalTask1Band > 0 || finalTask2Band > 0 || finalWritingScore ? (
                          <>
                        {/* Task Mode Switcher */}
                        <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setFinalWritingTaskMode("task1")}
                              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                finalWritingTaskMode === "task1"
                                  ? "bg-amber-600 text-white shadow-xs"
                                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                              }`}
                            >
                              Writing Task 1 (Band {finalTask1Band > 0 ? finalTask1Band.toFixed(1) : "—"})
                            </button>
                            <button
                              type="button"
                              onClick={() => setFinalWritingTaskMode("task2")}
                              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                finalWritingTaskMode === "task2"
                                  ? "bg-amber-600 text-white shadow-xs"
                                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                              }`}
                            >
                              Writing Task 2 (Band {finalTask2Band > 0 ? finalTask2Band.toFixed(1) : "—"})
                            </button>
                          </div>
                          <div className="text-xs font-bold text-amber-800">
                            Overall Writing: <span className="font-black text-sm">{finalCalculatedWritingOverall || finalWritingScore || "—"}</span>
                          </div>
                        </div>

                        {/* Task 1 Details */}
                        {finalWritingTaskMode === "task1" && (
                          <div className="space-y-4">
                            <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/40">
                              <div className="text-[10px] font-black text-amber-800 uppercase tracking-widest">
                                Đặc trưng Writing Task 1 Band {finalTask1Band > 0 ? finalTask1Band.toFixed(1) : "—"}
                              </div>
                              {finalTask1Band > 0 ? (
                                <p className="text-xs font-medium text-zinc-700 leading-relaxed mt-1.5 whitespace-pre-line">
                                  {getWritingTask1StandardDescription(finalTask1Band)}
                                </p>
                              ) : null}
                            </div>

                            <WritingTask1CriteriaPanel
                              scores={{
                                taskAchievement: Number(latestCompleted?.bcbData?.writing?.task1?.ta) || Number(latestCompleted?.bcbData?.writing?.ta) || finalTask1Band || 0,
                                coherenceCohesion: Number(latestCompleted?.bcbData?.writing?.task1?.cc) || Number(latestCompleted?.bcbData?.writing?.cc) || finalTask1Band || 0,
                                lexicalResource: Number(latestCompleted?.bcbData?.writing?.task1?.lr) || Number(latestCompleted?.bcbData?.writing?.lr) || finalTask1Band || 0,
                                grammaticalRange: Number(latestCompleted?.bcbData?.writing?.task1?.gra) || Number(latestCompleted?.bcbData?.writing?.gra) || finalTask1Band || 0,
                              }}
                            />

                            <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-4">
                              <div className="text-[10px] font-black uppercase tracking-wider text-zinc-700">
                                Nhận xét chi tiết Task 1
                              </div>
                              <p className="text-xs font-medium text-zinc-800 mt-1.5 leading-relaxed">
                                {latestCompleted?.bcbData?.writing?.task1?.notes ||
                                  latestCompleted?.bcbData?.writing?.task1Notes ||
                                  "Chưa có nhận xét chi tiết Task 1."}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Task 2 Details */}
                        {finalWritingTaskMode === "task2" && (
                          <div className="space-y-4">
                            <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/40">
                              <div className="text-[10px] font-black text-amber-800 uppercase tracking-widest">
                                Đặc trưng Writing Task 2 Band {finalTask2Band > 0 ? finalTask2Band.toFixed(1) : "—"}
                              </div>
                              {finalTask2Band > 0 ? (
                                <p className="text-xs font-medium text-zinc-700 leading-relaxed mt-1.5 whitespace-pre-line">
                                  {getWritingTask2StandardDescription(finalTask2Band)}
                                </p>
                              ) : null}
                            </div>

                            <WritingTask2CriteriaPanel
                              scores={{
                                taskResponse: Number(latestCompleted?.bcbData?.writing?.task2?.tr) || Number(latestCompleted?.bcbData?.writing?.ta) || finalTask2Band || 0,
                                coherenceCohesion: Number(latestCompleted?.bcbData?.writing?.task2?.cc) || Number(latestCompleted?.bcbData?.writing?.cc) || finalTask2Band || 0,
                                lexicalResource: Number(latestCompleted?.bcbData?.writing?.task2?.lr) || Number(latestCompleted?.bcbData?.writing?.lr) || finalTask2Band || 0,
                                grammaticalRange: Number(latestCompleted?.bcbData?.writing?.task2?.gra) || Number(latestCompleted?.bcbData?.writing?.gra) || finalTask2Band || 0,
                              }}
                            />

                            <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-4">
                              <div className="text-[10px] font-black uppercase tracking-wider text-zinc-700">
                                Nhận xét chi tiết Task 2
                              </div>
                              <p className="text-xs font-medium text-zinc-800 mt-1.5 leading-relaxed">
                                {latestCompleted?.bcbData?.writing?.task2?.notes ||
                                  latestCompleted?.bcbData?.writing?.task2Notes ||
                                  "Chưa có nhận xét chi tiết Task 2."}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Writing Prescription & Formula Note */}
                        <div className="pt-2 space-y-3">
                          <div className="rounded-2xl border border-amber-200/80 bg-amber-50/30 p-4">
                            <div className="text-[10px] font-black uppercase tracking-wider text-amber-900">
                              Phác đồ cải thiện Writing
                            </div>
                            <p className="text-xs font-medium text-amber-950 mt-1.5 leading-relaxed">
                              {latestCompleted?.bcbData?.writing?.prescription || "Chưa có phác đồ cải thiện Writing."}
                            </p>
                          </div>

                          {finalTask1Band > 0 && finalTask2Band > 0 ? (
                            <WritingScoreFormulaNote
                              task1Band={finalTask1Band}
                              task2Band={finalTask2Band}
                              writingOverall={finalCalculatedWritingOverall}
                            />
                          ) : null}
                        </div>
                          </>
                        ) : (
                          <p className="text-xs font-medium text-zinc-500 py-6 text-center">
                            Chưa có điểm / nhận xét Writing Final.
                          </p>
                        )}
                      </div>
                    )}

                    {/* Tab Content: Listening (Bảng dạng câu) */}
                    {activeFinalBcbTab === "listening" && (
                      <div className="space-y-5 animate-in fade-in duration-200">
                        <div className="rounded-2xl border border-sky-100 bg-sky-50/40 p-4 flex items-center justify-between">
                          <div>
                            <div className="text-[10px] font-black uppercase text-sky-700 tracking-wider">Số câu đúng Listening</div>
                            <div className="text-lg font-black text-sky-950 mt-0.5">
                              {finalListeningCorrectCount} {finalListeningCorrectCount !== "—" ? "câu" : ""}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] font-bold text-sky-600">Band điểm Final</div>
                            <div className="text-xl font-black text-sky-900">
                              {finalListeningScore ? formatBandScore(finalListeningScore) : "—"}
                            </div>
                          </div>
                        </div>

                        {finalBcbListeningRows.length > 0 ? (
                          <BcbQuestionTypeTable rows={finalBcbListeningRows} />
                        ) : (
                          <p className="text-xs font-medium text-zinc-500 text-center py-4">
                            Chưa có bảng dạng câu Listening Final.
                          </p>
                        )}

                        <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-4">
                          <div className="text-[10px] font-black uppercase tracking-wider text-zinc-700">
                            Điểm cần lưu ý khi làm bài Listening
                          </div>
                          <p className="text-xs font-medium text-zinc-800 mt-1.5 leading-relaxed">
                            {latestCompleted?.bcbData?.lr?.listeningWeaknesses || "Chưa có nhận xét điểm yếu Listening."}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Tab Content: Reading (Bảng dạng câu) */}
                    {activeFinalBcbTab === "reading" && (
                      <div className="space-y-5 animate-in fade-in duration-200">
                        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 flex items-center justify-between">
                          <div>
                            <div className="text-[10px] font-black uppercase text-emerald-700 tracking-wider">Số câu đúng Reading</div>
                            <div className="text-lg font-black text-emerald-950 mt-0.5">
                              {finalReadingCorrectCount} {finalReadingCorrectCount !== "—" ? "câu" : ""}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] font-bold text-emerald-600">Band điểm Final</div>
                            <div className="text-xl font-black text-emerald-900">
                              {finalReadingScore ? formatBandScore(finalReadingScore) : "—"}
                            </div>
                          </div>
                        </div>

                        {finalBcbReadingRows.length > 0 ? (
                          <BcbQuestionTypeTable rows={finalBcbReadingRows} />
                        ) : (
                          <p className="text-xs font-medium text-zinc-500 text-center py-4">
                            Chưa có bảng dạng câu Reading Final.
                          </p>
                        )}

                        <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-4">
                          <div className="text-[10px] font-black uppercase tracking-wider text-zinc-700">
                            Điểm cần lưu ý khi làm bài Reading
                          </div>
                          <p className="text-xs font-medium text-zinc-800 mt-1.5 leading-relaxed">
                            {latestCompleted?.bcbData?.lr?.readingWeaknesses || "Chưa có nhận xét điểm yếu Reading."}
                          </p>
                        </div>
                      </div>
                    )}
                      </>
                    )}
                  </div>
                </div>
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
          studentPhone={studentPhone}
          studentEmail={authUser?.email || student.email || ""}
          targetBand={entranceAim}
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

      {isLrwBookingOpen && (
        <FinalLrwBookingModal
          open={isLrwBookingOpen}
          studentId={student.id}
          studentName={student.name}
          studentPhone={studentPhone}
          studentEmail={authUser?.email || student.email || ""}
          targetBand={entranceAim}
          onClose={() => setIsLrwBookingOpen(false)}
          onSuccess={() => {
            void loadData();
            setDialog({
              tone: "success",
              title: "Đăng ký thành công",
              message:
                "Bạn đã đăng ký ca Final Test Listening · Reading · Writing thành công! Vui lòng theo dõi lịch thi.",
            });
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
