"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { StudentLayout } from "@/app/StudentLayout";
import {
  ExamLinkCell,
  SelfStudyResultsTable,
  StatusBadge,
} from "@/components/student/SelfStudyResultsTable";
import { StudentSchedulePanel } from "@/components/student/StudentSchedulePanel";
import {
  PracticeClassPanel,
  PracticeClassWeeklyWarning,
} from "@/components/student/PracticeClassPanel";
import { PracticeMeetingAccessBlock } from "@/components/student/PracticeMeetingAccessBlock";
import { StudentDialog } from "@/components/student/StudentDialog";
import { NativeSelectChevron, Panel } from "@/components/student/ui";
import { useStudentSchedule } from "@/hooks/useStudentSchedule";
import { formatBandScore } from "@/lib/formatBandScore";
import { getDaysInMonth } from "@/lib/courseSchedule";
import type { MockTestRequest } from "@/lib/mockTestRequests";
import {
  createMockTestRequest,
  hasDuplicateSlot,
  removeMockTestRequest,
} from "@/lib/mockTestRequests";
import {
  formatIsoDateTimeVi,
  formatMockTestDateTime,
  getDemoSpeakingMockTests,
  isSpeakingMockTest,
  mockTestStatusLabel,
  mockTestStatusTone,
  sortMockTestsByDateDesc,
  speakingResultExamLink,
  speakingResultScore,
  writingStatusLabel,
  writingStatusTone,
} from "@/lib/selfStudyFormat";
import { getStudentIdentity } from "@/lib/studentIdentity";
import {
  getPracticeSlotById,
  getPracticeSlotsForStudent,
  PRACTICE_CLASS_SKILL,
  PRACTICE_CLASS_DESCRIPTION,
  PRACTICE_CLASS_WEEKLY_REREGISTER_WARNING,
  PRACTICE_CLASS_UPDATE_EVENT,
  isPracticeClassJoined,
  refreshPracticeRegistrations,
  registerPracticeSlot,
  resetPracticeClassTestState,
  setPracticeClassJoined,
  unregisterPracticeSlot,
  type PracticeSlotId,
} from "@/lib/practiceClass";
import {
  submitWritingSubmission,
  refreshWritingSubmissionsForStudent,
  WRITING_SUBMISSIONS_EVENT,
  type WritingSubmission,
} from "@/lib/writingSubmissions";

type PageDialog =
  | { kind: "confirm-practice"; slotId: PracticeSlotId }
  | { kind: "success-practice"; slotId: PracticeSlotId }
  | { kind: "duplicate-mock" }
  | { kind: "alert"; message: string };

export default function HoTroTuHocPage() {
  const router = useRouter();
  const schedule = useStudentSchedule();
  const { month, year, months, myRequests, pendingTests, daysInMonth } = schedule;
  const [regSkill] = useState("Speaking Mock Test");
  const [regMonth, setRegMonth] = useState(month);
  const [regDay, setRegDay] = useState(1);
  const [regTime, setRegTime] = useState("09:00");

  const [writingLink, setWritingLink] = useState("");
  const [writingSubmissions, setWritingSubmissions] = useState<WritingSubmission[]>([]);
  const [practiceSlotVersion, setPracticeSlotVersion] = useState(0);
  const [practiceJoined, setPracticeJoined] = useState(false);
  const [dialog, setDialog] = useState<PageDialog | null>(null);

  const student = getStudentIdentity();

  const bumpPracticeSlots = useCallback(() => {
    void refreshPracticeRegistrations(student.id).finally(() =>
      setPracticeSlotVersion((v) => v + 1),
    );
  }, [student.id]);

  const registeredPracticeSlotIds = useMemo(
    () => new Set(getPracticeSlotsForStudent(student.id).map((r) => r.slotId)),
    [student.id, practiceSlotVersion],
  );

  const syncPracticeJoined = useCallback(() => {
    const joined =
      getPracticeSlotsForStudent(student.id).length > 0 ||
      isPracticeClassJoined(student.id);
    setPracticeJoined(joined);
  }, [student.id]);

  useEffect(() => {
    syncPracticeJoined();
  }, [syncPracticeJoined, practiceSlotVersion]);

  const refreshWritingSubmissions = useCallback(() => {
    void refreshWritingSubmissionsForStudent(student.id).then(setWritingSubmissions);
  }, [student.id]);

  useEffect(() => {
    setRegMonth(month);
  }, [month]);

  useEffect(() => {
    refreshWritingSubmissions();
    bumpPracticeSlots();
    window.addEventListener(WRITING_SUBMISSIONS_EVENT, refreshWritingSubmissions);
    window.addEventListener(PRACTICE_CLASS_UPDATE_EVENT, bumpPracticeSlots);
    return () => {
      window.removeEventListener(WRITING_SUBMISSIONS_EVENT, refreshWritingSubmissions);
      window.removeEventListener(PRACTICE_CLASS_UPDATE_EVENT, bumpPracticeSlots);
    };
  }, [refreshWritingSubmissions, bumpPracticeSlots]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("resetPractice") !== "1") return;
    resetPracticeClassTestState(student.id);
    setPracticeJoined(false);
    bumpPracticeSlots();
    router.replace("/ho-tro-tu-hoc");
  }, [student.id, bumpPracticeSlots, router]);

  const handleResetPracticeTest = () => {
    resetPracticeClassTestState(student.id);
    setPracticeJoined(false);
    bumpPracticeSlots();
    setDialog(null);
  };

  const joinPracticeClass = () => {
    setPracticeClassJoined(student.id, true);
    setPracticeJoined(true);
    bumpPracticeSlots();
  };

  const handleRegisterPracticeSlot = (slotId: PracticeSlotId) => {
    if (!getPracticeSlotById(slotId)) return;
    setDialog({ kind: "confirm-practice", slotId });
  };

  const confirmPracticeRegistration = async () => {
    if (dialog?.kind !== "confirm-practice") return;
    const slot = getPracticeSlotById(dialog.slotId);
    if (!slot) {
      setDialog(null);
      return;
    }
    try {
      await registerPracticeSlot(student.id, dialog.slotId);
      const now = new Date();
      await createMockTestRequest({
        studentId: student.id,
        studentName: student.name,
        skill: `${PRACTICE_CLASS_SKILL} · ${slot.title}`,
        day: now.getDate(),
        month: now.getMonth(),
        year: now.getFullYear(),
        examTime: `${slot.dayLabel} ${slot.time}`,
      });
      bumpPracticeSlots();
      setDialog({ kind: "success-practice", slotId: dialog.slotId });
    } catch (err) {
      setDialog({
        kind: "alert",
        message:
          err instanceof Error ? err.message : "Không đăng ký được. Thử lại sau.",
      });
    }
  };

  const handleUnregisterPracticeSlot = async (slotId: PracticeSlotId) => {
    try {
      await unregisterPracticeSlot(student.id, slotId);
      bumpPracticeSlots();
    } catch (err) {
      setDialog({
        kind: "alert",
        message:
          err instanceof Error ? err.message : "Không huỷ đăng ký được. Thử lại sau.",
      });
    }
  };

  const pendingPracticeSlot =
    dialog?.kind === "confirm-practice" ? getPracticeSlotById(dialog.slotId) : null;

  const successPracticeSlot =
    dialog?.kind === "success-practice" ? getPracticeSlotById(dialog.slotId) : null;

  const speakingMockRows = useMemo(() => {
    const rows = sortMockTestsByDateDesc(
      myRequests.filter((r) => isSpeakingMockTest(r.skill)),
    );
    return rows.length > 0 ? rows : getDemoSpeakingMockTests(student.id, student.name);
  }, [myRequests, student.id, student.name]);

  const practiceHistoryRows = useMemo(
    () => [
      { test: "LĐ16", name: "Dương Ngọc Khôi Nguyên", l: "—", r: "—", w: "—", s: "—" },
      { test: "LĐ17", name: "Dương Ngọc Khôi Nguyên", l: "6.0", r: "5.5", w: "4.5", s: "—" },
      { test: "LĐ18", name: "Dương Ngọc Khôi Nguyên", l: "—", r: "—", w: "—", s: "—" },
      { test: "LĐ19", name: "Dương Ngọc Khôi Nguyên", l: "—", r: "—", w: "—", s: "—" },
      { test: "LĐ20", name: "Dương Ngọc Khôi Nguyên", l: "—", r: "—", w: "—", s: "—" },
    ],
    [],
  );

  const practiceHistoryWithScoreRows = useMemo(
    () =>
      practiceHistoryRows.filter(
        (row) => row.l !== "—" || row.r !== "—" || row.w !== "—" || row.s !== "—",
      ),
    [practiceHistoryRows],
  );

  const registerMockTest = async () => {
    if (hasDuplicateSlot(student.id, regSkill, regDay, regMonth, year)) {
      setDialog({ kind: "duplicate-mock" });
      return;
    }
    try {
      await createMockTestRequest({
        studentId: student.id,
        studentName: student.name,
        skill: regSkill,
        day: regDay,
        month: regMonth,
        year,
        examTime: regTime,
      });
    } catch (err) {
      setDialog({
        kind: "alert",
        message:
          err instanceof Error ? err.message : "Không đăng ký được mock test.",
      });
    }
  };

  const cancelPendingRequest = async (id: string) => {
    try {
      await removeMockTestRequest(id, student.id);
    } catch (err) {
      setDialog({
        kind: "alert",
        message:
          err instanceof Error ? err.message : "Không huỷ được yêu cầu.",
      });
    }
  };

  return (
    <StudentLayout>
      <div className="space-y-10 pb-20">
        <header>
          <h2 className="text-2xl font-extrabold text-foreground tracking-tight">Hỗ trợ tự học</h2>
          <p className="text-muted text-sm mt-1 font-medium">
            Đăng ký mock test, chấm chữa writing và theo dõi lớp luyện đề tập trung.
          </p>
        </header>

        <div className="grid grid-cols-1 items-stretch gap-10 lg:grid-cols-12">
          
          {/* Left Column: Interactions & Content */}
          <div className="lg:col-span-8 flex min-h-0 flex-col gap-10">
            <Panel title="Đăng ký Mock Test Speaking" className="shrink-0">
              <div className="flex flex-col gap-3 rounded-3xl bg-background p-6 shadow-inner sm:flex-row sm:flex-wrap sm:items-end sm:gap-x-3 sm:gap-y-3">
                <div className="grid min-w-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-3">
                  <div className="flex min-w-0 flex-col gap-2">
                    <label className="text-[10px] font-black text-muted uppercase tracking-widest">Tháng</label>
                    <NativeSelectChevron
                      value={regMonth}
                      onChange={(e) => setRegMonth(parseInt(e.target.value, 10))}
                      className="h-11 w-full rounded-xl bg-white text-xs font-bold text-foreground shadow-sm focus:ring-2 focus:ring-primary/10"
                    >
                      {months.map((m, i) => (
                        <option key={m} value={i}>
                          {m}
                        </option>
                      ))}
                    </NativeSelectChevron>
                  </div>
                  <div className="flex min-w-0 flex-col gap-2">
                    <label className="text-[10px] font-black text-muted uppercase tracking-widest">Ngày</label>
                    <NativeSelectChevron
                      value={regDay}
                      onChange={(e) => setRegDay(parseInt(e.target.value, 10))}
                      className="h-11 w-full rounded-xl bg-white text-xs font-bold text-foreground shadow-sm focus:ring-2 focus:ring-primary/10"
                    >
                      {Array.from({ length: getDaysInMonth(regMonth, year) }).map((_, i) => (
                        <option key={i + 1} value={i + 1}>
                          Ngày {i + 1}
                        </option>
                      ))}
                    </NativeSelectChevron>
                  </div>
                  <div className="flex min-w-0 flex-col gap-2">
                    <label className="text-[10px] font-black text-muted uppercase tracking-widest">Giờ</label>
                    <NativeSelectChevron
                      value={regTime}
                      onChange={(e) => setRegTime(e.target.value)}
                      className="h-11 w-full rounded-xl bg-white text-xs font-bold text-foreground shadow-sm focus:ring-2 focus:ring-primary/10"
                    >
                      {["09:00", "09:30", "10:00", "10:30", "14:00", "14:30", "15:00", "15:30", "16:00", "19:45"].map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </NativeSelectChevron>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void registerMockTest()}
                  className="h-11 w-fit shrink-0 self-start rounded-xl bg-primary px-5 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-primary/90 sm:self-auto sm:px-4"
                >
                  Đăng ký
                </button>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {pendingTests
                  .filter((t) => isSpeakingMockTest(t.skill))
                  .map((test) => (
                  <div key={test.id} className="rounded-2xl border border-warning/30 bg-warning/5 p-4 flex justify-between items-start">
                    <div>
                      <div className="text-sm font-extrabold text-foreground">{test.skill}</div>
                      <div className="text-[10px] font-bold text-muted uppercase mt-1">
                        {formatMockTestDateTime(test)}
                      </div>
                      <div className="mt-1 text-[10px] font-bold text-warning uppercase">Chờ duyệt</div>
                    </div>
                    <button type="button" onClick={() => void cancelPendingRequest(test.id)} className="text-[10px] font-black uppercase text-secondary hover:underline">
                      Hủy
                    </button>
                  </div>
                ))}
              </div>

              <SelfStudyResultsTable<MockTestRequest>
                title="Bảng kết quả Mock Test Speaking"
                emptyMessage="Chưa có lần test nào. Đăng ký buổi test phía trên."
                equalColumns
                getRowKey={(row) => row.id}
                rows={speakingMockRows}
                columns={[
                  {
                    key: "datetime",
                    label: "Ngày giờ test",
                    align: "center",
                    render: (row) => (
                      <span className="font-semibold tabular-nums text-foreground">
                        {formatMockTestDateTime(row)}
                      </span>
                    ),
                  },
                  {
                    key: "status",
                    label: "Trạng thái",
                    align: "center",
                    render: (row) => (
                      <StatusBadge
                        label={mockTestStatusLabel(row.status)}
                        tone={mockTestStatusTone(row.status)}
                      />
                    ),
                  },
                  {
                    key: "score",
                    label: "Điểm",
                    align: "center",
                    render: (row) => (
                      <span className="text-sm font-black tabular-nums text-primary">
                        {speakingResultScore(row) === "—"
                          ? "—"
                          : formatBandScore(speakingResultScore(row))}
                      </span>
                    ),
                  },
                  {
                    key: "link",
                    label: "Link đề",
                    align: "center",
                    render: (row) => <ExamLinkCell href={speakingResultExamLink(row)} />,
                  },
                ]}
              />
            </Panel>

            <Panel title="Chấm - Chữa Writing" className="flex w-full flex-1 flex-col">
                <div className="flex min-h-0 flex-1 flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-muted uppercase tracking-widest">Link bài làm (Google Docs)</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={writingLink}
                        onChange={(e) => setWritingLink(e.target.value)}
                        placeholder="Dán link Google Docs vào đây..."
                        className="flex-1 h-11 rounded-xl border border-zinc-200 bg-background px-4 text-xs font-medium focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!writingLink.trim()) return;
                          void submitWritingSubmission({
                            studentId: student.id,
                            studentName: student.name,
                            examLink: writingLink.trim(),
                          })
                            .then(() => {
                              setWritingLink("");
                              refreshWritingSubmissions();
                            })
                            .catch((err) => {
                              setDialog({
                                kind: "alert",
                                message:
                                  err instanceof Error
                                    ? err.message
                                    : "Không gửi được bài Writing.",
                              });
                            });
                        }}
                        className="h-11 rounded-xl bg-primary px-4 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-secondary/90"
                      >
                        Gửi bài
                      </button>
                    </div>
                  </div>

                  <SelfStudyResultsTable<WritingSubmission>
                    title="Bảng kết quả chấm Writing"
                    emptyMessage="Chưa có bài nộp. Gửi link bài làm phía trên."
                    getRowKey={(row) => row.id}
                    rows={writingSubmissions}
                    columns={[
                      {
                        key: "datetime",
                        label: "Ngày giờ nộp",
                        align: "center",
                        width: "w-[128px]",
                        render: (row) => (
                          <span className="font-semibold tabular-nums text-foreground">
                            {formatIsoDateTimeVi(row.testDateTime)}
                          </span>
                        ),
                      },
                      {
                        key: "status",
                        label: "Trạng thái",
                        align: "center",
                        width: "w-[96px]",
                        render: (row) => (
                          <StatusBadge
                            label={writingStatusLabel(row.status)}
                            tone={writingStatusTone(row.status)}
                          />
                        ),
                      },
                      {
                        key: "score",
                        label: "Điểm",
                        align: "center",
                        width: "w-[64px]",
                        render: (row) => (
                          <span className="text-sm font-black tabular-nums text-secondary">
                            {row.score ? formatBandScore(row.score) : "—"}
                          </span>
                        ),
                      },
                      {
                        key: "link",
                        label: "Link bài chấm",
                        align: "center",
                        width: "w-[110px]",
                        render: (row) => (
                          <a
                            href={row.examLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block max-w-full truncate font-semibold text-primary underline-offset-2 hover:underline"
                          >
                            Bài làm
                          </a>
                        ),
                      },
                      {
                        key: "graded",
                        label: "Ngày chấm",
                        align: "center",
                        width: "w-[128px]",
                        render: (row) => (
                          <span className="font-semibold tabular-nums text-muted">
                            {row.gradedAt ? formatIsoDateTimeVi(row.gradedAt) : "—"}
                          </span>
                        ),
                      },
                    ]}
                  />
                </div>
            </Panel>
          </div>

          {/* Right Column: Schedule */}
          <div className="lg:col-span-4 flex min-h-0 flex-col">
            <StudentSchedulePanel schedule={schedule} title="Thời khoá biểu" className="h-full min-h-0" />
          </div>
        </div>

        <div className="mt-10 flex w-full flex-col gap-10">
          {!practiceJoined ? (
            <Panel title="Đăng ký lớp luyện đề" className="w-full">
              <div className="mb-4">
                <PracticeClassWeeklyWarning />
              </div>
              <div className="flex flex-col gap-4 rounded-3xl bg-background p-6 shadow-inner sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                <p className="min-w-0 flex-1 text-sm font-medium leading-relaxed text-muted">
                  {PRACTICE_CLASS_DESCRIPTION}
                </p>
                <button
                  type="button"
                  onClick={joinPracticeClass}
                  className="h-11 w-full min-w-[140px] shrink-0 rounded-xl bg-primary px-8 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-primary/90 sm:w-[168px] sm:self-center"
                >
                  Đăng ký
                </button>
              </div>
            </Panel>
          ) : (
            <>
              <PracticeClassPanel
                registeredSlotIds={registeredPracticeSlotIds}
                onRegisterSlot={handleRegisterPracticeSlot}
                onUnregisterSlot={handleUnregisterPracticeSlot}
                onResetTest={handleResetPracticeTest}
              />
              {registeredPracticeSlotIds.size > 0 ? (
                <Panel title="Lớp luyện đề — Mock Test Scores" className="w-full">
                  <div className="overflow-x-auto rounded-2xl border border-primary/10 bg-white">
                    <table className="w-full border-separate border-spacing-0">
                      <thead>
                        <tr className="bg-background/50">
                          {["TEST", "HỌC VIÊN", "LISTENING", "READING", "WRITING", "SPEAKING"].map((h) => (
                            <th key={h} className="px-4 py-3 text-left text-[10px] font-black text-muted uppercase tracking-widest border-b border-primary/5">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-primary/5">
                        {practiceHistoryWithScoreRows.length > 0 ? (
                          practiceHistoryWithScoreRows.map((row, idx) => (
                            <tr key={`${row.test}-${idx}`} className="hover:bg-background/30 transition-colors">
                              <td className="px-4 py-4 text-xs font-bold text-foreground">{row.test}</td>
                              <td className="px-4 py-4 text-xs font-bold text-muted">{row.name}</td>
                              <td className="px-4 py-4 text-xs font-black text-foreground">{row.l}</td>
                              <td className="px-4 py-4 text-xs font-black text-foreground">{row.r}</td>
                              <td className="px-4 py-4 text-xs font-black text-foreground">{row.w}</td>
                              <td className="px-4 py-4 text-xs font-black text-foreground">{row.s}</td>
                            </tr>
                          ))
                        ) : (
                          <tr className="hover:bg-background/30 transition-colors">
                            <td className="px-4 py-4 text-xs font-bold text-muted">—</td>
                            <td className="px-4 py-4 text-xs font-bold text-muted">—</td>
                            <td className="px-4 py-4 text-xs font-black text-muted">—</td>
                            <td className="px-4 py-4 text-xs font-black text-muted">—</td>
                            <td className="px-4 py-4 text-xs font-black text-muted">—</td>
                            <td className="px-4 py-4 text-xs font-black text-muted">—</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </Panel>
              ) : null}
            </>
          )}
        </div>
      </div>

      <StudentDialog
        open={dialog?.kind === "confirm-practice" && Boolean(pendingPracticeSlot)}
        variant="confirm"
        tone="info"
        title="Xác nhận đăng ký buổi học"
        cancelLabel="Huỷ"
        confirmLabel="Đăng ký"
        onClose={() => setDialog(null)}
        onConfirm={confirmPracticeRegistration}
      >
        {pendingPracticeSlot ? (
          <div className="rounded-xl border border-primary/10 bg-background/60 p-3 text-sm">
            <div className="font-black text-foreground">
              [{pendingPracticeSlot.dayLabel}]
              {pendingPracticeSlot.dateNote ? ` ${pendingPracticeSlot.dateNote}` : ""}{" "}
              {pendingPracticeSlot.time}
            </div>
            <div className="mt-1 font-bold text-foreground">{pendingPracticeSlot.title}</div>
            <p className="mt-2 text-[12px] font-medium leading-relaxed text-muted">
              Buổi này sẽ hiển thị trên <span className="font-bold text-foreground">Thời khoá biểu</span>{" "}
              (mọi {pendingPracticeSlot.dayLabel} trong tháng đang xem).
            </p>
            <p className="mt-2 text-[11px] font-semibold leading-relaxed text-warning">
              {PRACTICE_CLASS_WEEKLY_REREGISTER_WARNING}
            </p>
            <div className="mt-3">
              <PracticeMeetingAccessBlock slot={pendingPracticeSlot} compact />
            </div>
          </div>
        ) : null}
      </StudentDialog>

      <StudentDialog
        open={dialog?.kind === "success-practice" && Boolean(successPracticeSlot)}
        tone="success"
        title="Đăng ký thành công"
        onClose={() => setDialog(null)}
      >
        {successPracticeSlot ? (
          <div className="space-y-3">
            <p className="text-sm font-medium leading-relaxed text-muted">
              Buổi học đã được thêm vào <span className="font-bold text-foreground">Thời khoá biểu</span>.
              Dùng thông tin bên dưới để vào phòng:
            </p>
            <PracticeMeetingAccessBlock slot={successPracticeSlot} />
          </div>
        ) : null}
      </StudentDialog>

      <StudentDialog
        open={dialog?.kind === "duplicate-mock"}
        tone="warning"
        title="Không thể đăng ký"
        message="Bạn đã có đăng ký cho kỹ năng và ngày này. Vui lòng chọn ngày hoặc kỹ năng khác."
        onClose={() => setDialog(null)}
      />

      <StudentDialog
        open={dialog?.kind === "alert"}
        tone="warning"
        title="Thông báo"
        message={dialog?.kind === "alert" ? dialog.message : ""}
        onClose={() => setDialog(null)}
      />
    </StudentLayout>
  );
}
