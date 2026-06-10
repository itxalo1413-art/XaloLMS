"use client";

import { useCallback, useEffect, useState } from "react";
import { StudentLayout } from "@/app/StudentLayout";
import { StudentSchedulePanel } from "@/components/student/StudentSchedulePanel";
import { Panel } from "@/components/student/ui";
import { useStudentSchedule } from "@/hooks/useStudentSchedule";
import {
  HOMEWORK_STATUS_TEXT_CLASS,
  HOMEWORK_STATUS_LABEL,
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
} from "@/lib/rlpSessionStore";
import Link from "next/link";
import { InstructorProfileDialog } from "@/components/student/InstructorProfileDialog";
import {
  INSTRUCTOR_PROFILES_UPDATE_EVENT,
  resolveInstructorPublicProfile,
} from "@/lib/courseInstructorProfile";
import { PORTAL_PROFILE_UPDATE_EVENT } from "@/lib/portalProfile";
import { useCourseImportantLinks } from "@/hooks/useCourseImportantLinks";

function resolveLessonFileToken(url: string) {
  const clean = url.split("#")[0]?.split("?")[0]?.toLowerCase() ?? "";
  if (clean.endsWith(".pdf")) return { label: "PDF", tone: "bg-danger/10 text-danger" };
  if (clean.endsWith(".doc") || clean.endsWith(".docx"))
    return { label: "DOC", tone: "bg-primary/10 text-primary" };
  if (clean.endsWith(".ppt") || clean.endsWith(".pptx") || clean.endsWith(".key"))
    return { label: "SLD", tone: "bg-warning/10 text-warning" };
  if (clean.endsWith(".xls") || clean.endsWith(".xlsx"))
    return { label: "XLS", tone: "bg-success/10 text-success" };
  return { label: "LINK", tone: "bg-zinc-100 text-zinc-700" };
}

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
      value: meta.course,
      icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
    },
    {
      label: "Giáo viên",
      value: meta.instructor,
      icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    },
    {
      label: "Phòng học",
      value: meta.room,
      icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
    },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {basics.map((item) => {
          const inner = (
            <>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-primary shadow-sm">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d={item.icon} />
                </svg>
              </div>
              <div className="min-w-0 text-left">
                <div className="text-[10px] font-black uppercase tracking-widest text-muted">{item.label}</div>
                <div className="mt-1.5 text-sm font-bold leading-snug text-foreground">{item.value}</div>
                {item.label === "Giáo viên" ? (
                  <div className="mt-1 text-[10px] font-bold text-primary"></div>
                ) : null}
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
                className="flex h-full w-full gap-3 rounded-2xl border border-primary/10 bg-background/60 p-4 text-left transition-colors hover:border-primary/25 hover:bg-primary-soft/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                {inner}
              </button>
            );
          }

          return (
            <div
              key={item.label}
              className="flex h-full gap-3 rounded-2xl border border-primary/10 bg-background/60 p-4"
            >
              {inner}
            </div>
          );
        })}
      </div>

      <InstructorProfileDialog
        open={instructorDialogOpen}
        profile={instructorProfile}
        onClose={() => setInstructorDialogOpen(false)}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {meta.zoomPassword && meta.zoomPassword !== "—" ? (
          <div className="flex h-full gap-3 rounded-2xl border border-primary/10 bg-background/60 p-4 md:col-span-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-primary shadow-sm">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-black uppercase tracking-widest text-muted">
                Zoom khóa chính
              </div>
              <div className="mt-2 text-sm font-bold text-foreground">
                Mật khẩu:{" "}
                <span className="font-mono text-primary">{meta.zoomPassword}</span>
              </div>
              <p className="mt-1 text-xs text-muted">
                Dùng khi tham gia buổi học online trên Zoom (cập nhật bởi ACA/GV).
              </p>
            </div>
          </div>
        ) : null}

        <div className="flex h-full gap-3 rounded-2xl border border-primary/10 bg-background/60 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-primary shadow-sm">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-black uppercase tracking-widest text-muted">Lịch học</div>
            <ul className="mt-2 space-y-1.5">
              {meta.schedule.map((slot) => (
                <li key={slot} className="text-sm font-bold text-foreground">
                  {slot}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex h-full gap-3 rounded-2xl border border-primary/10 bg-background/60 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-primary shadow-sm">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-black uppercase tracking-widest text-muted">Ngày khai giảng</div>
            <ul className="mt-2 space-y-1.5">
              {meta.phases.map((p) => (
                <li key={p.name} className="text-sm font-bold text-foreground">
                  {p.name === "Chặng 1" ? (
                    <Link
                      href="#rlp-section"
                      className="text-primary hover:underline decoration-2 underline-offset-4"
                    >
                      {p.name}
                    </Link>
                  ) : (
                    <span>{p.name}</span>
                  )}
                  <span className="text-muted"> · </span>
                  <span>{p.date}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CourseInfoPage() {
  const { links: importantLinks } = useCourseImportantLinks();
  const schedule = useStudentSchedule();
  const { clientToday } = schedule;
  const [rlpSessions, setRlpSessions] = useState<RlpSession[]>(() => getCourseRlpSessions());

  useEffect(() => {
    void refreshRlpSessions().then(setRlpSessions);
    const onUpdate = () => setRlpSessions(getCourseRlpSessions());
    window.addEventListener(RLP_SESSIONS_UPDATE_EVENT, onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener(RLP_SESSIONS_UPDATE_EVENT, onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, []);


  return (
    <StudentLayout>
      <div className="space-y-10 pb-20">
        
        <header>
          <h2 className="text-2xl font-extrabold text-foreground tracking-tight">Thông tin khóa học</h2>
          <p className="text-muted text-sm mt-1 font-medium">Thông tin lớp học, RLP và lịch học chính khóa của bạn.</p>
        </header>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          
          <div className="lg:col-span-8 flex flex-col gap-10">
            <Panel title="Tổng quan khoá học">
              <CourseOverviewSection />
            </Panel>

            <Panel title="Hỗ trợ tự học" className="flex-1">
              <div className="flex h-full flex-col gap-4">
                <div className="rounded-2xl border border-primary/25 bg-primary-soft/20 p-5">
                  <p className="text-sm font-semibold text-zinc-800">
                    Các mục đăng ký Mock Test, chấm chữa Writing và lớp luyện đề đã được chuyển sang tab mới.
                  </p>
                  <p className="mt-2 text-xs text-zinc-600">
                    Vào tab <strong>Hỗ trợ tự học</strong> để thao tác đăng ký và theo dõi lịch tự học.
                  </p>
                  <Link
                    href="/ho-tro-tu-hoc"
                    className="mt-4 inline-flex rounded-xl bg-primary px-4 py-2 text-xs font-bold uppercase tracking-wide text-white hover:bg-primary/90"
                  >
                    Mở tab hỗ trợ tự học
                  </Link>
                </div>
                <div className="mt-auto rounded-2xl border border-primary/10 bg-background/60 p-4">
                  <div className="text-[10px] font-black uppercase tracking-widest text-muted">
                    Nội dung trong tab Hỗ trợ tự học
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <div className="rounded-xl border border-primary/10 bg-card px-3 py-2 text-[11px] font-semibold text-foreground">
                      Đăng ký Mock Test Speaking
                    </div>
                    <div className="rounded-xl border border-primary/10 bg-card px-3 py-2 text-[11px] font-semibold text-foreground">
                      Chấm - chữa Writing
                    </div>
                    <div className="rounded-xl border border-primary/10 bg-card px-3 py-2 text-[11px] font-semibold text-foreground">
                      Lớp luyện đề tập trung
                    </div>
                  </div>
                </div>
              </div>
            </Panel>

          </div>

          <StudentSchedulePanel schedule={schedule} className="lg:col-span-4" />

          <div className="lg:col-span-12 scroll-mt-24" id="rlp-section">
            <Panel title="RLP - Resonant Lesson Plan">
              <div className="space-y-4">
                {importantLinks.map((link) => (
                  <div
                    key={link.id}
                    className="rounded-2xl border border-primary/15 bg-card p-5 shadow-soft"
                  >
                    <div className="text-[10px] font-black uppercase tracking-widest text-primary">
                      {link.label}
                    </div>
                    <div className="mt-2 text-sm font-bold text-foreground break-words">
                      {link.value}
                    </div>
                    {link.id !== "rlp" && link.url ? (
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 inline-block rounded-lg bg-primary px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white hover:bg-primary/90 transition-all"
                      >
                        Truy cập
                      </a>
                    ) : null}
                    {link.id !== "rlp" && !link.url ? (
                      <span className="mt-4 inline-block rounded-lg bg-zinc-200 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                        Chưa có link
                      </span>
                    ) : null}
                    {link.id === "rlp" ? (
                      <div className="mt-4 rounded-xl border border-primary/10 bg-background/40 p-3">
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[1060px] table-fixed border-separate border-spacing-0">
                            <colgroup>
                              <col className="w-[92px]" />
                              <col />
                              <col className="w-[52px]" />
                              <col className="w-[200px]" />
                              <col className="w-[96px]" />
                              <col className="w-[108px]" />
                              <col className="w-[96px]" />
                              <col className="w-[112px]" />
                            </colgroup>
                            <thead>
                              <tr>
                                {[
                                  { label: "Skill", align: "text-center", nowrap: false },
                                  { label: "Nội dung", align: "text-left", nowrap: false },
                                  { label: "File bài học", align: "text-center", nowrap: false },
                                  { label: "Tiến độ", align: "text-left", nowrap: false },
                                  { label: "Điểm danh", align: "text-center", nowrap: false },
                                  { label: "Homework", align: "text-center", nowrap: true },
                                  { label: "Deadline", align: "text-center", nowrap: true },
                                  { label: "Trạng thái", align: "text-center", nowrap: false },
                                ].map((col) => (
                                  <th
                                    key={col.label}
                                    className={`sticky top-0 z-10 border-b border-primary/10 bg-background px-3 py-2.5 align-middle text-[10px] font-black uppercase tracking-widest text-muted ${col.align} ${col.nowrap ? "whitespace-nowrap" : ""}`}
                                  >
                                    {col.label}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {rlpSessions.map((row) => {
                                const past = isSessionPast(row, clientToday);
                                const cell =
                                  "border-b border-primary/10 px-3 py-2.5 align-middle";
                                return (
                                <tr key={row.no} className="hover:bg-white/80 transition-colors">
                                  <td className={`${cell} text-center`}>
                                    <span
                                      className={[
                                        "inline-flex rounded-full px-2 py-0.5 text-[10px] font-black uppercase",
                                        row.skill === "Speaking"
                                          ? "bg-primary/10 text-primary"
                                          : "bg-info/10 text-info",
                                      ].join(" ")}
                                    >
                                      {row.skill}
                                    </span>
                                  </td>
                                  <td className={`${cell} text-left text-[12px] font-medium leading-snug text-foreground`}>
                                    {row.contents}
                                  </td>
                                  <td className={`${cell} text-center`}>
                                    {row.lessonFileUrl?.trim() ? (
                                      <a
                                        href={row.lessonFileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center justify-center transition-opacity hover:opacity-80"
                                        aria-label="Mở file bài học"
                                      >
                                        <span
                                          className={[
                                            "inline-flex min-w-[38px] justify-center rounded-md px-2 py-1 text-[10px] font-black uppercase tracking-wide",
                                            resolveLessonFileToken(row.lessonFileUrl).tone,
                                          ].join(" ")}
                                        >
                                          {resolveLessonFileToken(row.lessonFileUrl).label}
                                        </span>
                                      </a>
                                    ) : (
                                      <span className="text-[11px] font-medium text-muted">—</span>
                                    )}
                                  </td>
                                  <td className={`${cell} text-left text-[12px] font-medium leading-snug text-muted`}>
                                    {row.teacherNote}
                                  </td>
                                  <td className={`${cell} text-center`}>
                                    {past ? (
                                      row.attendance === "present" ? (
                                        <span className="text-[11px] font-bold text-success">Đi học</span>
                                      ) : (
                                        <span className="text-[11px] font-bold text-danger">Vắng học</span>
                                      )
                                    ) : (
                                      <span className="text-[11px] font-medium text-muted">—</span>
                                    )}
                                  </td>
                                  <td className={`${cell} text-center`}>
                                    <button
                                      type="button"
                                      className="inline-flex text-secondary transition-colors hover:text-secondary/80"
                                      aria-label="Mở homework"
                                    >
                                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                                    </button>
                                  </td>
                                  <td
                                    className={`${cell} text-center text-[11px] font-semibold tabular-nums ${
                                      past ? "text-zinc-400" : "text-muted"
                                    }`}
                                  >
                                    {row.deadline}
                                  </td>
                                  <td className={`${cell} text-center`}>
                                    <span
                                      className={`text-[11px] font-bold ${HOMEWORK_STATUS_TEXT_CLASS[row.homeworkStatus]}`}
                                    >
                                      {HOMEWORK_STATUS_LABEL[row.homeworkStatus]}
                                    </span>
                                  </td>
                                </tr>
                              );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
