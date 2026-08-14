"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  HOMEWORK_STATUS_LABEL,
  calculateGradingDeadline,
  type Attendance,
  type HomeworkStatus,
  type RlpSession,
} from "@/lib/courseSchedule";
import {
  refreshRlpSessions,
  RLP_SESSIONS_UPDATE_EVENT,
  updateRlpSession,
} from "@/lib/rlpSessionStore";
import { fetchAcaClasses, displayClassCode, type AcaClass } from "@/lib/acaManagementApi";

const ATTENDANCE_OPTIONS: { value: Attendance; label: string }[] = [
  { value: "present", label: "Đi học" },
  { value: "absent", label: "Vắng học" },
];

const HOMEWORK_OPTIONS: { value: HomeworkStatus; label: string }[] = [
  { value: "submitted", label: HOMEWORK_STATUS_LABEL.submitted },
  { value: "submitted_waiting", label: HOMEWORK_STATUS_LABEL.submitted_waiting },
  { value: "in_progress", label: HOMEWORK_STATUS_LABEL.in_progress },
  { value: "overdue", label: HOMEWORK_STATUS_LABEL.overdue },
  { value: "not_assigned", label: HOMEWORK_STATUS_LABEL.not_assigned },
];

type Draft = {
  attendance: Attendance;
  homeworkStatus: HomeworkStatus;
  teacherNote: string;
  lessonFileUrl: string;
  homeworkFileUrl: string;
};

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

function draftFromRow(row: RlpSession): Draft {
  return {
    attendance: row.attendance,
    homeworkStatus: row.homeworkStatus,
    teacherNote: row.teacherNote === "—" ? "" : row.teacherNote,
    lessonFileUrl: row.lessonFileUrl?.trim() ?? "",
    homeworkFileUrl: row.homeworkFileUrl?.trim() ?? "",
  };
}

export function RlpEditorSection() {
  const [rows, setRows] = useState<RlpSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeNo, setActiveNo] = useState<number | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [filterSkill, setFilterSkill] = useState<string>("all");
  
  const [classes, setClasses] = useState<AcaClass[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("");

  useEffect(() => {
    async function loadClasses() {
      try {
        const data = await fetchAcaClasses();
        const teacherClasses = data.filter((c) =>
          (c.teacher || "").toLowerCase().includes("quỳnh châu")
        );
        setClasses(teacherClasses);
        if (teacherClasses.length > 0) {
          setSelectedClassId(teacherClasses[0].id);
        }
      } catch (err) {
        console.error("Failed to load teacher classes", err);
      }
    }
    loadClasses();
  }, []);

  const sync = useCallback(async (classId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await refreshRlpSessions(classId);
      setRows(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được RLP.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void sync(selectedClassId);
    const onUpdate = () => void sync(selectedClassId);
    window.addEventListener(RLP_SESSIONS_UPDATE_EVENT, onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener(RLP_SESSIONS_UPDATE_EVENT, onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, [sync, selectedClassId]);

  const skills = useMemo(
    () => ["all", ...new Set(rows.map((r) => r.skill))],
    [rows],
  );

  const filtered = useMemo(() => {
    const list =
      filterSkill === "all" ? rows : rows.filter((r) => r.skill === filterSkill);
    return [...list].sort((a, b) => a.no - b.no);
  }, [rows, filterSkill]);

  const activeRow = rows.find((r) => r.no === activeNo);

  const openEdit = (row: RlpSession) => {
    setActiveNo(row.no);
    setDraft(draftFromRow(row));
  };

  const saveActive = async () => {
    if (activeNo == null || !draft) return;
    setSaving(true);
    setError(null);
    try {
      await updateRlpSession(activeNo, {
        attendance: draft.attendance,
        homeworkStatus: draft.homeworkStatus,
        teacherNote: draft.teacherNote.trim() || "—",
        lessonFileUrl: draft.lessonFileUrl.trim(),
        homeworkFileUrl: draft.homeworkFileUrl.trim(),
      }, selectedClassId);
      await sync(selectedClassId);
      setActiveNo(null);
      setDraft(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không lưu được.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-primary/10 bg-white p-5 shadow-soft">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-primary/5 pb-4 mb-4">
          <div className="space-y-1">
            <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400">Chọn lớp giảng dạy</h4>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="h-10 w-full md:w-80 rounded-xl border border-zinc-200 px-4 font-bold text-foreground outline-none focus:border-primary/45 focus:ring-2 focus:ring-primary/10 bg-white cursor-pointer"
            >
              {classes.length === 0 ? (
                <option value="">Không tìm thấy lớp học nào của bạn</option>
              ) : (
                classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.classCode ? `[${displayClassCode(cls.classCode)}] ${cls.name}` : cls.name}
                  </option>
                ))
              )}
            </select>
          </div>
          <p className="text-xs text-muted max-w-md leading-relaxed md:text-right">
            Cập nhật điểm danh, homework, ghi chú GV và link file bài học cho từng buổi RLP của lớp này. Học viên thấy ngay trên trang Thông tin khóa học.
          </p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {skills.map((skill) => (
            <button
              key={skill}
              type="button"
              onClick={() => setFilterSkill(skill)}
              className={[
                "rounded-full px-3 py-1.5 text-xs font-bold transition-colors",
                filterSkill === skill
                  ? "bg-primary text-white"
                  : "bg-primary-soft/60 text-primary hover:bg-primary-soft",
              ].join(" ")}
            >
              {skill === "all" ? "Tất cả" : skill}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <p className="rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted">Đang tải…</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-primary/10 bg-white shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-primary/10 bg-background text-[10px] font-black uppercase tracking-widest text-muted">
                  <th className="px-4 py-3">Buổi</th>
                  <th className="px-4 py-3">Ngày</th>
                  <th className="px-4 py-3">Skill</th>
                  <th className="px-4 py-3">Điểm danh</th>
                  <th className="px-4 py-3">Homework</th>
                  <th className="px-4 py-3">File bài học</th>
                  <th className="px-4 py-3">Ghi chú GV</th>
                  <th className="px-4 py-3">Đề bài tập</th>
                  <th className="px-4 py-3 text-primary">Hạn chấm bài</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr
                    key={row.no}
                    className="border-b border-primary/5 hover:bg-primary-soft/20"
                  >
                    <td className="px-4 py-3 font-bold tabular-nums">{row.no}</td>
                    <td className="px-4 py-3 tabular-nums text-muted">{row.date}</td>
                    <td className="px-4 py-3">{row.skill}</td>
                    <td className="px-4 py-3">
                      {row.attendance === "present" ? (
                        <span className="font-bold text-success">Đi học</span>
                      ) : (
                        <span className="font-bold text-danger">Vắng học</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {HOMEWORK_STATUS_LABEL[row.homeworkStatus]}
                    </td>
                    <td className="max-w-[140px] truncate px-4 py-3 text-xs text-muted">
                      {row.lessonFileUrl?.trim() ? (
                        <a
                          href={row.lessonFileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 hover:opacity-80"
                        >
                          <span
                            className={[
                              "inline-flex min-w-[38px] justify-center rounded-md px-2 py-1 text-[10px] font-black uppercase tracking-wide",
                              resolveLessonFileToken(row.lessonFileUrl).tone,
                            ].join(" ")}
                          >
                            {resolveLessonFileToken(row.lessonFileUrl).label}
                          </span>
                          <span className="font-semibold text-primary">Mở file</span>
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-muted" title={row.teacherNote}>
                      {row.teacherNote}
                    </td>
                    <td className="max-w-[140px] truncate px-4 py-3 text-xs text-muted">
                      {row.homeworkFileUrl?.trim() ? (
                        <a
                          href={row.homeworkFileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                        >
                          Mở Docs
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 font-bold text-primary tabular-nums text-xs whitespace-nowrap">
                      {calculateGradingDeadline(row.deadline)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openEdit(row)}
                        className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white hover:bg-primary/90"
                      >
                        Sửa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeRow && draft ? (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-premium"
            role="dialog"
            aria-labelledby="rlp-edit-title"
          >
            <h3 id="rlp-edit-title" className="text-lg font-black text-foreground">
              Buổi {activeRow.no} · {activeRow.skill} · {activeRow.date}
            </h3>
            <p className="mt-1 text-xs text-muted line-clamp-2">{activeRow.contents}</p>

            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wider text-muted">
                  Điểm danh
                </span>
                <select
                  value={draft.attendance}
                  onChange={(e) =>
                    setDraft((d) =>
                      d ? { ...d, attendance: e.target.value as Attendance } : d,
                    )
                  }
                  className="mt-1 w-full rounded-xl border border-primary/15 px-3 py-2 text-sm"
                >
                  {ATTENDANCE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wider text-muted">
                  Homework
                </span>
                <select
                  value={draft.homeworkStatus}
                  onChange={(e) =>
                    setDraft((d) =>
                      d ? { ...d, homeworkStatus: e.target.value as HomeworkStatus } : d,
                    )
                  }
                  className="mt-1 w-full rounded-xl border border-primary/15 px-3 py-2 text-sm"
                >
                  {HOMEWORK_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wider text-muted">
                  Link file bài học
                </span>
                <input
                  type="url"
                  value={draft.lessonFileUrl}
                  onChange={(e) =>
                    setDraft((d) => (d ? { ...d, lessonFileUrl: e.target.value } : d))
                  }
                  placeholder="https://drive.google.com/..."
                  className="mt-1 w-full rounded-xl border border-primary/15 px-3 py-2 text-sm"
                />
              </label>

              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wider text-muted">
                  Link file bài tập (Google Docs)
                </span>
                <input
                  type="url"
                  value={draft.homeworkFileUrl}
                  onChange={(e) =>
                    setDraft((d) => (d ? { ...d, homeworkFileUrl: e.target.value } : d))
                  }
                  placeholder="https://docs.google.com/..."
                  className="mt-1 w-full rounded-xl border border-primary/15 px-3 py-2 text-sm"
                />
              </label>

              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wider text-muted">
                  Ghi chú GV
                </span>
                <textarea
                  value={draft.teacherNote}
                  onChange={(e) =>
                    setDraft((d) => (d ? { ...d, teacherNote: e.target.value } : d))
                  }
                  rows={4}
                  className="mt-1 w-full resize-y rounded-xl border border-primary/15 px-3 py-2 text-sm"
                  placeholder="Nhận xét tiến độ buổi học…"
                />
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setActiveNo(null);
                  setDraft(null);
                }}
                className="rounded-xl px-4 py-2 text-sm font-bold text-muted hover:bg-zinc-100"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void saveActive()}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-60"
              >
                {saving ? "Đang lưu…" : "Lưu"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
