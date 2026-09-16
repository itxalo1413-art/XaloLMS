"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { StudentLayout } from "@/app/StudentLayout";
import { StudentSchedulePanel } from "@/components/student/StudentSchedulePanel";
import { Panel } from "@/components/student/ui";
import { StudentDialog } from "@/components/student/StudentDialog";
import { useStudentSchedule } from "@/hooks/useStudentSchedule";
import {
  isSessionPast,
  type RlpSession,
} from "@/lib/courseSchedule";
import {
  COURSE_METADATA_UPDATE_EVENT,
  getCourseMetadata,
  refreshCourseMetadata,
} from "@/lib/courseMetadata";
import {
  getCourseRlpSessions,
  refreshRlpSessions,
  RLP_SESSIONS_UPDATE_EVENT,
  updateRlpSession,
} from "@/lib/rlpSessionStore";
import { resolveRlpPhaseBounds } from "@/lib/rlpPhaseBounds";
import Link from "next/link";
import { InstructorProfileDialog } from "@/components/student/InstructorProfileDialog";
import {
  INSTRUCTOR_PROFILES_UPDATE_EVENT,
  resolveInstructorPublicProfile,
} from "@/lib/courseInstructorProfile";
import { PORTAL_PROFILE_UPDATE_EVENT } from "@/lib/portalProfile";
import { useCourseImportantLinks } from "@/hooks/useCourseImportantLinks";
import { fetchPracticeCurrentWeek, type PracticeCurrentWeekResponse } from "@/lib/practiceClassApi";

type PhaseConfig = {
  id: string;
  name: string;
  shortLabel: string;
  startDate: string;
  endDate: string;
  sessionMin: number;
  sessionMax: number;
};

function CourseOverviewSection() {
  const [meta, setMeta] = useState(() => getCourseMetadata());
  const [instructorDialogOpen, setInstructorDialogOpen] = useState(false);
  const [instructorProfile, setInstructorProfile] = useState(() =>
    resolveInstructorPublicProfile(getCourseMetadata().instructor),
  );

  const refreshInstructorProfile = useCallback((instructorName: string) => {
    setInstructorProfile(resolveInstructorPublicProfile(instructorName));
  }, []);

  useEffect(() => {
    setMeta(refreshCourseMetadata());
    const onUpdate = () => {
      const next = getCourseMetadata();
      setMeta(next);
      refreshInstructorProfile(next.instructor);
    };
    window.addEventListener(COURSE_METADATA_UPDATE_EVENT, onUpdate);
    window.addEventListener(PORTAL_PROFILE_UPDATE_EVENT, onUpdate);
    window.addEventListener(INSTRUCTOR_PROFILES_UPDATE_EVENT, onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener(COURSE_METADATA_UPDATE_EVENT, onUpdate);
      window.removeEventListener(PORTAL_PROFILE_UPDATE_EVENT, onUpdate);
      window.removeEventListener(INSTRUCTOR_PROFILES_UPDATE_EVENT, onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, [refreshInstructorProfile]);

  const basics = [
    {
      label: "Khoá học",
      value: meta.course || "—",
      icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
    },
    {
      label: "Giáo viên",
      value: meta.instructor || "—",
      icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    },
    {
      label: "Phòng học",
      value: meta.room || "—",
      icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
    },
  ] as const;

  return (
    <div className="flex flex-col gap-3 justify-between h-full overflow-y-auto pr-1 scrollbar-thin">
      {basics.map((item) => {
        const inner = (
          <>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-primary shadow-2xs">
              <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d={item.icon} />
              </svg>
            </div>
            <div className="min-w-0 text-left">
              <div className="text-[10px] font-black uppercase tracking-widest text-muted">{item.label}</div>
              <div className="mt-1 text-xs font-bold leading-snug text-foreground">{item.value}</div>
            </div>
          </>
        );

        if (item.label === "Giáo viên") {
          return (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                refreshInstructorProfile(meta.instructor);
                setInstructorDialogOpen(true);
              }}
              className="flex w-full items-center gap-3 rounded-2xl border border-primary/10 bg-background/60 p-3.5 text-left transition-colors hover:border-primary/25 hover:bg-primary-soft/20 focus-visible:outline-none"
            >
              {inner}
            </button>
          );
        }

        return (
          <div
            key={item.label}
            className="flex items-center gap-3 rounded-2xl border border-primary/10 bg-background/60 p-3.5"
          >
            {inner}
          </div>
        );
      })}

      <InstructorProfileDialog
        open={instructorDialogOpen}
        profile={instructorProfile}
        onClose={() => setInstructorDialogOpen(false)}
      />

      {meta.zoomPassword && meta.zoomPassword !== "—" ? (
        <div className="flex items-center gap-3 rounded-2xl border border-primary/10 bg-background/60 p-3.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-primary shadow-2xs">
            <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-black uppercase tracking-widest text-muted">
              Zoom khóa chính
            </div>
            <div className="mt-1 text-xs font-bold text-foreground">
              Pass: <span className="font-mono text-primary">{meta.zoomPassword}</span>
            </div>
            {meta.zoomLink ? (
              <a
                href={meta.zoomLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block text-[11px] font-bold text-primary hover:underline"
              >
                Vào phòng Zoom
              </a>
            ) : null}
          </div>
        </div>
      ) : meta.zoomLink ? (
        <div className="flex items-center gap-3 rounded-2xl border border-primary/10 bg-background/60 p-3.5">
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-black uppercase tracking-widest text-muted">Zoom</div>
            <a
              href={meta.zoomLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-xs font-bold text-primary hover:underline"
            >
              Vào phòng Zoom
            </a>
          </div>
        </div>
      ) : null}

      <div className="flex items-start gap-3 rounded-2xl border border-primary/10 bg-background/60 p-3.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-primary shadow-2xs">
          <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-black uppercase tracking-widest text-muted">Lịch học</div>
          {meta.schedule.length > 0 ? (
            <ul className="mt-1 space-y-1">
              {meta.schedule.map((slot) => (
                <li key={slot} className="text-xs font-bold text-foreground">
                  {slot}
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-1 text-xs font-bold text-muted">Chưa có lịch học</div>
          )}
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-primary/10 bg-background/60 p-3.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-primary shadow-2xs">
          <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-black uppercase tracking-widest text-muted">Lịch bắt đầu chặng</div>
          {meta.phases.length > 0 ? (
            <ul className="mt-1 space-y-1">
              {meta.phases.map((p) => (
                <li key={p.name} className="text-xs font-bold text-foreground">
                  <span>{p.name}</span>
                  {p.date ? (
                    <>
                      <span className="text-muted"> · </span>
                      <span>{p.date}</span>
                    </>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-1 text-xs font-bold text-muted">Chưa có lịch chặng</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CourseInfoPage() {
  const { links: importantLinks } = useCourseImportantLinks();
  const schedule = useStudentSchedule();
  const { clientToday } = schedule;
  const [meta, setMeta] = useState(() => getCourseMetadata());
  const [rlpSessions, setRlpSessions] = useState<RlpSession[]>(() => getCourseRlpSessions());
  const [activePhaseId, setActivePhaseId] = useState<string>("phase1");
  const [submitRow, setSubmitRow] = useState<RlpSession | null>(null);
  const [homeworkLinkDraft, setHomeworkLinkDraft] = useState("");
  const [homeworkSubmitting, setHomeworkSubmitting] = useState(false);
  const [homeworkError, setHomeworkError] = useState<string | null>(null);
  const [practiceWeek, setPracticeWeek] = useState<PracticeCurrentWeekResponse | null>(null);

  useEffect(() => {
    setMeta(refreshCourseMetadata());
    const onMetaUpdate = () => setMeta(getCourseMetadata());
    window.addEventListener(COURSE_METADATA_UPDATE_EVENT, onMetaUpdate);
    return () => window.removeEventListener(COURSE_METADATA_UPDATE_EVENT, onMetaUpdate);
  }, []);

  useEffect(() => {
    void fetchPracticeCurrentWeek()
      .then((week) => setPracticeWeek(week))
      .catch(() => setPracticeWeek(null));
  }, []);

  const oneToOne = meta.oneToOne;

  const phaseBounds = useMemo(
    () => resolveRlpPhaseBounds(rlpSessions, meta),
    [rlpSessions, meta],
  );

  const RLP_PHASES: PhaseConfig[] = useMemo(() => {
    const phases: PhaseConfig[] = [
      {
        id: "phase1",
        name: "Chặng 1",
        shortLabel: "Chặng 1",
        startDate: "",
        endDate: "",
        sessionMin: 1,
        sessionMax: phaseBounds.phase1Max,
      },
    ];
    if (phaseBounds.showPhase2) {
      phases.push({
        id: "phase2",
        name: "Chặng 2",
        shortLabel: "Chặng 2",
        startDate: "",
        endDate: "",
        sessionMin: phaseBounds.phase1Max + 1,
        sessionMax: Math.max(phaseBounds.phase1Max + 1, rlpSessions.length),
      });
    }
    return phases;
  }, [phaseBounds, rlpSessions.length]);

  const currentPhase = RLP_PHASES.find((p) => p.id === activePhaseId) ?? RLP_PHASES[0];

  useEffect(() => {
    if (!phaseBounds.showPhase2 && activePhaseId === "phase2") {
      setActivePhaseId("phase1");
    }
  }, [phaseBounds.showPhase2, activePhaseId]);

  const displayedRlpSessions = rlpSessions.filter(
    (s) => s.no >= currentPhase.sessionMin && s.no <= currentPhase.sessionMax,
  );

  const phaseIndex = activePhaseId === "phase1" ? 0 : 1;
  const phase1Name = meta.phases[0]?.name || RLP_PHASES[0].name;
  const phase2Name = meta.phases[1]?.name || RLP_PHASES[1]?.name || "Chặng 2";
  const activePhaseName = activePhaseId === "phase1" ? phase1Name : phase2Name;

  const phaseStartDate =
    displayedRlpSessions[0]?.date ||
    meta.phases[phaseIndex]?.date ||
    (phaseIndex === 0 ? meta.openDate : undefined) ||
    currentPhase.startDate ||
    "—";

  const phaseEndDate =
    displayedRlpSessions[displayedRlpSessions.length - 1]?.date ||
    meta.endDate ||
    currentPhase.endDate ||
    "—";

  useEffect(() => {
    void refreshRlpSessions()
      .then(setRlpSessions)
      .catch((err) => {
        console.warn("Could not load RLP sessions", err);
        setRlpSessions(getCourseRlpSessions());
      });
    const onUpdate = () => setRlpSessions(getCourseRlpSessions());
    window.addEventListener(RLP_SESSIONS_UPDATE_EVENT, onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener(RLP_SESSIONS_UPDATE_EVENT, onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, []);

  const openHomeworkSubmit = (row: RlpSession) => {
    setSubmitRow(row);
    setHomeworkLinkDraft(row.homeworkFileUrl?.trim() || "");
    setHomeworkError(null);
  };

  const closeHomeworkSubmit = () => {
    if (homeworkSubmitting) return;
    setSubmitRow(null);
    setHomeworkLinkDraft("");
    setHomeworkError(null);
  };

  const handleConfirmHomeworkSubmit = async () => {
    if (!submitRow) return;
    const link = homeworkLinkDraft.trim();
    if (!link) {
      setHomeworkError("Vui lòng dán link bài tập (Google Docs / Drive).");
      return;
    }
    setHomeworkSubmitting(true);
    setHomeworkError(null);
    try {
      const remote = await updateRlpSession(submitRow.no, {
        homeworkStatus: "submitted_waiting",
        homeworkFileUrl: link,
      });
      setRlpSessions((prev) => prev.map((s) => (s.no === submitRow.no ? remote : s)));
      setSubmitRow(null);
      setHomeworkLinkDraft("");
    } catch (err) {
      console.error("Failed to submit homework:", err);
      setHomeworkError(err instanceof Error ? err.message : "Nộp bài thất bại.");
    } finally {
      setHomeworkSubmitting(false);
    }
  };

  const handleUnsubmitHomework = async (row: RlpSession) => {
    setRlpSessions((prev) =>
      prev.map((s) =>
        s.no === row.no ? { ...s, homeworkStatus: "in_progress" as const } : s,
      ),
    );
    try {
      const remote = await updateRlpSession(row.no, {
        homeworkStatus: "in_progress",
      });
      setRlpSessions((prev) => prev.map((s) => (s.no === row.no ? remote : s)));
    } catch (err) {
      console.error("Failed to unsubmit homework:", err);
      void refreshRlpSessions().then(setRlpSessions);
    }
  };

  const renderHomeworkAction = (row: RlpSession) => {
    const isGraded = row.homeworkStatus === "submitted";
    const isSubmitted = row.homeworkStatus === "submitted_waiting";
    const canSubmit =
      row.homeworkStatus === "in_progress" ||
      row.homeworkStatus === "overdue" ||
      row.homeworkStatus === "submitted_waiting";

    if (isGraded) {
      return (
        <span className="inline-flex items-center rounded-lg bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-800 select-none">
          Đã chấm
        </span>
      );
    }
    if (!canSubmit) {
      return <span className="text-[10px] font-bold text-zinc-400">Chưa giao</span>;
    }
    if (isSubmitted) {
      return (
        <div className="flex flex-col items-center gap-1">
          <button
            type="button"
            onClick={() => openHomeworkSubmit(row)}
            className="inline-flex items-center gap-1 rounded-lg border border-primary/20 bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary transition-all hover:scale-105"
          >
            Đã nộp · Sửa link
          </button>
          <button
            type="button"
            onClick={() => void handleUnsubmitHomework(row)}
            className="text-[9px] font-bold uppercase tracking-wide text-rose-600 hover:underline"
          >
            Hủy nộp
          </button>
        </div>
      );
    }
    return (
      <button
        type="button"
        onClick={() => openHomeworkSubmit(row)}
        className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-[10px] font-black uppercase text-rose-700 transition-all hover:scale-105 hover:bg-primary/10 hover:border-primary/20 hover:text-primary"
      >
        Nộp bài
      </button>
    );
  };

  return (
    <StudentLayout>
      <div className="space-y-8 pb-16">
        <header>
          <h2 className="text-2xl font-extrabold text-foreground tracking-tight">Thông tin khóa học</h2>
          <p className="text-muted text-sm mt-1 font-medium">Thông tin lớp học, RLP và lịch học chính khóa của bạn.</p>
        </header>

        {oneToOne && meta.mode === "one-to-one" ? (
          <Panel title="Lớp 1:1 của bạn">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <div className="text-[10px] font-black uppercase tracking-wider text-muted">Lớp / RLP</div>
                <div className="mt-1 text-sm font-bold text-foreground">{oneToOne.className}</div>
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-wider text-muted">Giáo viên</div>
                <div className="mt-1 text-sm font-bold text-foreground">{oneToOne.teacher || "—"}</div>
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-wider text-muted">Trạng thái</div>
                <div className="mt-1 text-sm font-bold text-foreground">{oneToOne.status || "—"}</div>
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-wider text-muted">Thời gian</div>
                <div className="mt-1 text-sm font-bold text-foreground">
                  {oneToOne.startDate || "—"}
                  {oneToOne.endDate ? ` → ${oneToOne.endDate}` : ""}
                </div>
              </div>
            </div>
            {oneToOne.schedule ? (
              <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-zinc-50 px-3 py-2 text-xs font-semibold text-zinc-700">
                {oneToOne.schedule}
              </pre>
            ) : null}
            {oneToOne.progress ? (
              <p className="mt-2 text-xs text-zinc-600">
                <span className="font-bold">Tiến độ:</span> {oneToOne.progress}
              </p>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-2">
              {oneToOne.zoomLink ? (
                <a
                  href={oneToOne.zoomLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl bg-primary px-3 py-2 text-[10px] font-black uppercase tracking-wider text-white"
                >
                  Vào Zoom 1:1
                </a>
              ) : null}
              {oneToOne.successorLink ? (
                <a
                  href={oneToOne.successorLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl border border-primary/20 bg-primary/10 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-primary"
                >
                  Mở RLP Tab
                </a>
              ) : null}
              {oneToOne.materials ? (
                <a
                  href={oneToOne.materials}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-wider text-zinc-700"
                >
                  Tài liệu
                </a>
              ) : null}
            </div>
          </Panel>
        ) : null}

        {practiceWeek?.linkFolder?.trim() ? (
          <Panel title="Link folder lớp luyện đề (theo tuần)">
            <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4 space-y-2">
              <div className="text-sm font-bold text-foreground">
                Tuần {practiceWeek.weekRange}
                {practiceWeek.examWeekNumber
                  ? ` · Đề tuần ${practiceWeek.examWeekNumber}`
                  : ""}
              </div>
              <p className="text-[11px] text-zinc-500 font-medium">
                Folder bài tập / điểm tuần do học vụ gắn trên Lớp luyện đề tuần.
              </p>
              <a
                href={
                  practiceWeek.linkFolder.startsWith("http")
                    ? practiceWeek.linkFolder
                    : `https://${practiceWeek.linkFolder}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-xl bg-amber-600 px-4 py-2 text-[10px] font-black uppercase tracking-wider text-white hover:bg-amber-700"
              >
                Mở link folder
              </a>
            </div>
          </Panel>
        ) : null}

        {/* 3 Columns Row - Height matched to Schedule Panel on desktop (lg:h-[640px]) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
          
          {/* Left Column (Tổng quan - height matched to schedule panel) */}
          <div className="lg:col-span-3 lg:h-[640px] flex flex-col">
            <Panel title="Tổng quan" className="h-full flex flex-col overflow-hidden">
              <CourseOverviewSection />
            </Panel>
          </div>

          {/* Middle Column (Bảng RLP - height matched to schedule panel with vertical scroll) */}
          <div className="lg:col-span-6 lg:h-[640px] flex flex-col space-y-3" id="rlp-section">
            
            {/* Header with Start/End Date and Phase Selector Tabs */}
            <div className="shrink-0 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-1">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-zinc-950">RLP - Resonant Lesson Plan</h3>
                <p className="text-[11px] text-zinc-500 mt-0.5 flex flex-wrap items-center gap-1.5">
                  <span className="font-semibold text-zinc-700">{activePhaseName}</span>
                  <span>·</span>
                  <span>Bắt đầu chặng: <strong className="font-bold text-zinc-800">{phaseStartDate}</strong></span>
                  <span>–</span>
                  <span>Kết thúc: <strong className="font-bold text-zinc-800">{phaseEndDate}</strong></span>
                </p>
              </div>

              {/* Interactive Phase Selector Tabs */}
              <div className="flex items-center gap-1 rounded-xl bg-zinc-100 p-1 shrink-0">
                {RLP_PHASES.map((phase) => {
                  const isActive = activePhaseId === phase.id;
                  return (
                    <button
                      key={phase.id}
                      type="button"
                      onClick={() => setActivePhaseId(phase.id)}
                      className={`rounded-lg px-2.5 py-1 text-[10px] font-black uppercase transition-all ${
                        isActive
                          ? "bg-white text-primary shadow-2xs ring-1 ring-black/5"
                          : "text-zinc-500 hover:text-zinc-900"
                      }`}
                    >
                      {phase.shortLabel}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mobile Grid/Card View */}
            <div className="block lg:hidden space-y-4">
              {displayedRlpSessions.map((row) => {
                const past = isSessionPast(row, clientToday);
                return (
                  <div key={row.no} className="rounded-2xl border border-primary/10 bg-white p-4 shadow-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-primary/5 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-foreground">Buổi {row.no}</span>
                        <span
                          className={[
                            "inline-flex rounded-full px-2 py-0.5 text-[10px] font-black uppercase",
                            row.skill === "Speaking" ? "bg-primary/10 text-primary" : "bg-info/10 text-info",
                          ].join(" ")}
                        >
                          {row.skill}
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-zinc-400">{row.date}</span>
                    </div>

                    <div className="space-y-1">
                      <div className="text-[9px] font-black uppercase text-zinc-400 tracking-wider">
                        Giáo viên phụ trách
                      </div>
                      <p className="text-xs font-bold text-foreground">
                        {row.responsibleTeacher?.trim() || meta.instructor || "—"}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <div className="text-[9px] font-black uppercase text-zinc-400 tracking-wider">Nội dung</div>
                      <p className="text-xs font-medium text-foreground leading-relaxed whitespace-pre-line">{row.contents}</p>
                    </div>

                    {row.teacherNote && row.teacherNote.trim() !== "—" && (
                      <div className="space-y-1 rounded-xl bg-primary-soft/30 border border-primary/5 p-2.5">
                        <div className="text-[9px] font-black uppercase text-primary tracking-wider">Tiến độ (Ghi chú GV)</div>
                        <p className="text-xs font-medium text-zinc-700 italic leading-relaxed">"{row.teacherNote}"</p>
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-2 bg-zinc-50/50 rounded-xl p-2 text-[11px]">
                      <div>
                        <div className="text-[9px] font-black uppercase text-zinc-400 tracking-wider">File bài học</div>
                        <div className="mt-1">
                          {row.lessonFileUrl?.trim() ? (
                            <a href={row.lessonFileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-success hover:underline font-bold">
                              Tải file
                            </a>
                          ) : (
                            <span className="text-zinc-400 font-medium">—</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-[9px] font-black uppercase text-zinc-400 tracking-wider">Điểm danh</div>
                        <div className="mt-1">
                          {past ? (
                            row.studentAttendance &&
                            Object.keys(row.studentAttendance).length > 0 ? (
                              row.attendance === "present" ? (
                                <span className="font-bold text-success">Đi học</span>
                              ) : (
                                <span className="font-bold text-danger">Vắng học</span>
                              )
                            ) : (
                              <span className="text-zinc-400 font-medium">Chưa ĐD</span>
                            )
                          ) : (
                            <span className="text-zinc-400 font-medium">—</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-[9px] font-black uppercase text-zinc-400 tracking-wider">Homework</div>
                        <div className="mt-1">
                          {row.homeworkFileUrl?.trim() ? (
                            <a href={row.homeworkFileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline font-bold">
                              Mở Docs
                            </a>
                          ) : (
                            <span className="text-zinc-400 font-medium">—</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-primary/5 pt-3">
                      <div className="text-[10px] text-zinc-500 font-medium">Hạn: {row.deadline}</div>
                      {renderHomeworkAction(row)}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View: Container height fixed to 640px + vertical table scroll + Fixed Freeze Columns (Buổi & Skill stay fixed at left) */}
            <div className="hidden lg:flex flex-1 min-h-0 flex-col rounded-2xl border border-zinc-200/80 bg-white shadow-xs overflow-hidden">
              <div className="overflow-auto flex-1 scrollbar-thin">
                <table className="w-full min-w-[1400px] table-fixed border-collapse">
                  <thead className="sticky top-0 z-30 bg-zinc-50 border-b border-zinc-200 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                    <tr>
                      <th className="sticky top-0 left-0 z-30 bg-zinc-50 px-3.5 py-3 text-center w-[75px]">Buổi</th>
                      <th className="sticky top-0 left-[75px] z-30 bg-zinc-50 px-3.5 py-3 text-center w-[85px]">Skill</th>
                      <th className="px-3.5 py-3 text-left w-[150px]">Giáo viên phụ trách</th>
                      <th className="px-3.5 py-3 text-left w-[260px]">Nội dung</th>
                      <th className="px-3.5 py-3 text-center w-[95px]">File bài học</th>
                      <th className="px-3.5 py-3 text-left w-[200px]">Tiến độ</th>
                      <th className="px-3.5 py-3 text-center w-[90px]">Record</th>
                      <th className="px-3.5 py-3 text-center w-[100px]">Điểm danh</th>
                      <th className="px-3.5 py-3 text-center w-[100px] whitespace-nowrap">Homework</th>
                      <th className="px-3.5 py-3 text-center w-[100px] whitespace-nowrap">Deadline</th>
                      <th className="px-3.5 py-3 text-center w-[115px]">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 font-medium text-xs text-zinc-700">
                    {displayedRlpSessions.map((row) => {
                      const past = isSessionPast(row, clientToday);
                      const cell = "px-3.5 py-3 align-middle";
                      return (
                        <tr key={row.no} className="group hover:bg-zinc-50/60 transition-colors">
                          {/* 0. Buổi (Fixed Left 0px) */}
                          <td className={`${cell} sticky left-0 z-20 bg-white group-hover:bg-zinc-50/80 text-center font-black text-foreground tabular-nums`}>
                            Buổi {row.no}
                          </td>

                          {/* 1. Skill (Fixed Left 75px) */}
                          <td className={`${cell} sticky left-[75px] z-20 bg-white group-hover:bg-zinc-50/80 text-center`}>
                            <span
                              className={[
                                "inline-flex rounded-full px-2 py-0.5 text-[10px] font-black uppercase",
                                row.skill === "Speaking" ? "bg-primary/10 text-primary" : "bg-info/10 text-info",
                              ].join(" ")}
                            >
                              {row.skill}
                            </span>
                          </td>

                          {/* 1b. Giáo viên phụ trách */}
                          <td className={`${cell} text-left font-bold text-zinc-800 leading-snug`}>
                            {row.responsibleTeacher?.trim() || meta.instructor || "—"}
                          </td>

                          {/* 2. Nội dung */}
                          <td className={`${cell} text-left font-semibold text-zinc-900 leading-snug break-words whitespace-pre-line`}>
                            {row.contents}
                          </td>

                          {/* 3. File bài học */}
                          <td className={`${cell} text-center`}>
                            {row.lessonFileUrl?.trim() ? (
                              <a
                                href={row.lessonFileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-success/20 bg-success/10 text-success transition-all hover:bg-success/20 hover:scale-105"
                                title="Mở file bài học"
                              >
                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                                  <polyline points="14 2 14 8 20 8" />
                                </svg>
                              </a>
                            ) : (
                              <span className="text-[11px] text-zinc-400">—</span>
                            )}
                          </td>

                          {/* 4. Tiến độ */}
                          <td className={`${cell} text-left text-zinc-500 text-[11px] break-words`}>
                            {row.teacherNote && row.teacherNote.trim() !== "—" ? (
                              <span className="italic text-zinc-700">"{row.teacherNote}"</span>
                            ) : (
                              "—"
                            )}
                          </td>

                          {/* Record */}
                          <td className={`${cell} text-center`}>
                            {row.recordingUrl?.trim() ? (
                              <a
                                href={row.recordingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-purple-200 bg-purple-100 text-purple-700 transition-all hover:bg-purple-200 hover:scale-105"
                                title="Xem video Record"
                              >
                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <polygon points="23 7 16 12 23 17 23 7" />
                                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                                </svg>
                              </a>
                            ) : (
                              <span className="text-[11px] text-zinc-400">—</span>
                            )}
                          </td>

                          {/* 5. Điểm danh */}
                          <td className={`${cell} text-center`}>
                            {past ? (
                              row.studentAttendance &&
                              Object.keys(row.studentAttendance).length > 0 ? (
                                row.attendance === "present" ? (
                                  <span className="text-[11px] font-bold text-emerald-600">Đi học</span>
                                ) : (
                                  <span className="text-[11px] font-bold text-rose-600">Vắng học</span>
                                )
                              ) : (
                                <span className="text-[11px] text-zinc-400">Chưa ĐD</span>
                              )
                            ) : (
                              <span className="text-[11px] text-zinc-400">—</span>
                            )}
                          </td>

                          {/* 6. Homework */}
                          <td className={`${cell} text-center`}>
                            {row.homeworkFileUrl?.trim() ? (
                              <a
                                href={row.homeworkFileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary transition-all hover:bg-primary/20 hover:scale-105"
                                title="Mở Docs bài tập"
                              >
                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <path d="M14 2H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V8z" />
                                  <polyline points="14 2 14 8 20 8" />
                                  <line x1="9" y1="13" x2="15" y2="13" />
                                </svg>
                              </a>
                            ) : row.homeworkStatus === "in_progress" || row.homeworkStatus === "overdue" ? (
                              <button
                                type="button"
                                onClick={() => openHomeworkSubmit(row)}
                                className="inline-flex items-center rounded-lg border border-dashed border-primary/30 bg-primary/5 px-2 py-1 text-[10px] font-bold text-primary hover:bg-primary/10"
                              >
                                + Link
                              </button>
                            ) : (
                              <span className="text-[11px] text-zinc-400">—</span>
                            )}
                          </td>

                          {/* 7. Deadline */}
                          <td className={`${cell} text-center text-[11px] font-semibold tabular-nums text-zinc-500`}>
                            {row.deadline}
                          </td>

                          {/* 8. Trạng thái */}
                          <td className={`${cell} text-center`}>
                            {renderHomeworkAction(row)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column (Thời khóa biểu) */}
          <div className="lg:col-span-3 flex flex-col">
            <StudentSchedulePanel schedule={schedule} className="h-full flex flex-col" />
          </div>

          {/* Bottom Row: 3 Resource Folders */}
          <div className="lg:col-span-12 space-y-4 pt-6 border-t border-zinc-100">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-950">Thư mục & Tài nguyên học tập</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {importantLinks
                .filter((link) => link.id !== "rlp")
                .map((link) => (
                  <div
                    key={link.id}
                    className="flex flex-col justify-between rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs hover:border-primary/30 transition-all"
                  >
                    <div>
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary">
                        <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                        {link.label}
                      </div>
                      <div className="mt-2 text-sm font-bold text-zinc-900 break-words">
                        {link.value}
                      </div>
                    </div>
                    <div className="mt-4">
                      {link.url ? (
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center rounded-xl bg-primary px-3.5 py-2 text-[10px] font-black uppercase tracking-wider text-white hover:bg-primary/90 transition-all shadow-2xs"
                        >
                          Truy cập
                        </a>
                      ) : (
                        <span className="inline-flex items-center justify-center rounded-xl bg-zinc-100 px-3.5 py-2 text-[10px] font-black uppercase tracking-wider text-zinc-400">
                          Chưa có link
                        </span>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>

        </div>
      </div>

      <StudentDialog
        open={Boolean(submitRow)}
        onClose={closeHomeworkSubmit}
        title={submitRow ? `Nộp bài tập · Buổi ${submitRow.no}` : "Nộp bài tập"}
        tone="info"
        size="lg"
        position="center"
        variant="confirm"
        confirmLabel={homeworkSubmitting ? "Đang nộp..." : "Xác nhận nộp"}
        cancelLabel="Hủy"
        onConfirm={() => {
          if (!homeworkSubmitting) void handleConfirmHomeworkSubmit();
        }}
      >
        {submitRow && (
          <div className="space-y-3 text-left">
            <div className="rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2">
              <div className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                {submitRow.skill} · {submitRow.date}
              </div>
              <div className="mt-1 text-xs font-semibold text-zinc-800 line-clamp-3 whitespace-pre-line">
                {submitRow.contents}
              </div>
              {submitRow.deadline ? (
                <div className="mt-1 text-[11px] font-medium text-zinc-500">
                  Hạn nộp: {submitRow.deadline}
                </div>
              ) : null}
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-zinc-500">
                Link bài nộp (Google Docs / Drive)
              </label>
              <input
                type="url"
                value={homeworkLinkDraft}
                onChange={(e) => setHomeworkLinkDraft(e.target.value)}
                placeholder="https://docs.google.com/..."
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm font-medium text-zinc-900 outline-none ring-primary/20 placeholder:text-zinc-400 focus:border-primary focus:ring-2"
                autoFocus
              />
              {homeworkError ? (
                <p className="mt-1.5 text-[11px] font-semibold text-rose-600">{homeworkError}</p>
              ) : (
                <p className="mt-1.5 text-[11px] font-medium text-zinc-500">
                  Dán link bài viết / bài tập của bạn rồi bấm Xác nhận nộp.
                </p>
              )}
            </div>
          </div>
        )}
      </StudentDialog>
    </StudentLayout>
  );
}
