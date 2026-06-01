"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  HOMEWORK_STATUS_LABEL,
  type Attendance,
  type HomeworkStatus,
  type RlpSession,
} from "@/lib/courseSchedule";
import {
  refreshRlpSessions,
  RLP_SESSIONS_UPDATE_EVENT,
  updateRlpSession,
} from "@/lib/rlpSessionStore";

const ATTENDANCE_OPTIONS: { value: Attendance; label: string }[] = [
  { value: "present", label: "Đi học" },
  { value: "absent", label: "Vắng học" },
];

const HOMEWORK_OPTIONS: { value: HomeworkStatus; label: string }[] = [
  { value: "submitted", label: HOMEWORK_STATUS_LABEL.submitted },
  { value: "in_progress", label: HOMEWORK_STATUS_LABEL.in_progress },
  { value: "overdue", label: HOMEWORK_STATUS_LABEL.overdue },
  { value: "not_assigned", label: HOMEWORK_STATUS_LABEL.not_assigned },
];

type Draft = {
  attendance: Attendance;
  homeworkStatus: HomeworkStatus;
  teacherNote: string;
  lessonFileUrl: string;
};

function draftFromRow(row: RlpSession): Draft {
  return {
    attendance: row.attendance,
    homeworkStatus: row.homeworkStatus,
    teacherNote: row.teacherNote === "—" ? "" : row.teacherNote,
    lessonFileUrl: row.lessonFileUrl?.trim() ?? "",
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

  const sync = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await refreshRlpSessions();
      setRows(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được RLP.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void sync();
    const onUpdate = () => void sync();
    window.addEventListener(RLP_SESSIONS_UPDATE_EVENT, onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener(RLP_SESSIONS_UPDATE_EVENT, onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, [sync]);

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
      });
      await sync();
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
        <p className="text-sm text-muted">
          Cập nhật điểm danh, homework, ghi chú GV và link file bài học cho từng buổi RLP. Học viên
          thấy ngay trên trang Thông tin khóa học.
        </p>
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
                          className="font-semibold text-primary hover:underline"
                        >
                          Đã gắn link
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-muted" title={row.teacherNote}>
                      {row.teacherNote}
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
