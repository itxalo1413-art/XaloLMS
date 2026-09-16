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
  addRlpSession,
  deleteRlpSession,
  refreshRlpSessions,
  RLP_SESSIONS_UPDATE_EVENT,
  updateRlpSession,
} from "@/lib/rlpSessionStore";
import { fetchAcaClasses, displayClassCode, type AcaClass } from "@/lib/acaManagementApi";
import { getLoggedInTeacherName, teacherNameMatches } from "@/lib/teacherIdentity";
import {
  applyRlpTemplate,
  fetchRlpTemplates,
  type RlpTemplate,
} from "@/lib/rlpTemplateApi";

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
  skill: string;
  contents: string;
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
    skill: row.skill || "",
    contents: row.contents || "",
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
  const [adding, setAdding] = useState(false);
  const [deletingNo, setDeletingNo] = useState<number | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  // Standard RLP Templates from Học vụ Khánh Thi
  const [templates, setTemplates] = useState<RlpTemplate[]>([]);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string>("");
  const [templateStartDate, setTemplateStartDate] = useState<string>("");
  const [templateScheduleMode, setTemplateScheduleMode] = useState<"auto" | "keep_dates">("auto");
  const [applyingTemplate, setApplyingTemplate] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Helper detect and match template for class
  const resolveTemplateKeyForClass = useCallback((cls?: AcaClass, tpls: RlpTemplate[] = []): string => {
    if (!cls || tpls.length === 0) return tpls[0]?.key || "";
    const text = `${cls.name} ${cls.classCode}`.toUpperCase();
    if (text.includes("FOUNDATION") || text.includes("FOUND") || /\bF(246|357|SS)\b/.test(text)) {
      const found = tpls.find((x) => x.key.includes("foundation") || (x.level || "").toLowerCase().includes("foundation"));
      if (found) return found.key;
    }
    if (text.includes("PRE CORE") || text.includes("PRE-IELTS") || text.includes("PREIELTS") || /\b(M|PRE)\b/.test(text)) {
      const found = tpls.find((x) => x.key.includes("pre-ielts") || (x.level || "").toLowerCase().includes("pre"));
      if (found) return found.key;
    }
    if (text.includes("UPSTREAM") || text.includes("CORE 1")) {
      const found = tpls.find((x) => x.key.includes("core-1") || (x.level || "").toLowerCase().includes("core 1"));
      if (found) return found.key;
    }
    if (text.includes("MOMENTUM") || text.includes("SOAR") || text.includes("CORE 2")) {
      const found = tpls.find((x) => x.key.includes("core-2") || (x.level || "").toLowerCase().includes("core 2"));
      if (found) return found.key;
    }
    if (text.includes("INTENSIVE") || text.includes("CẤP TỐC")) {
      const found = tpls.find((x) => x.key.includes("intensive"));
      if (found) return found.key;
    }
    if (text.includes("LUYỆN ĐỀ") || text.includes("PRACTICE")) {
      const found = tpls.find((x) => x.key.includes("luyen-de"));
      if (found) return found.key;
    }
    if (text.includes("1:1") || text.includes("1-1")) {
      const found = tpls.find((x) => x.key.includes("1-1"));
      if (found) return found.key;
    }
    return tpls[0]?.key || "";
  }, []);

  useEffect(() => {
    async function loadInitial() {
      try {
        const [data, tpls] = await Promise.all([
          fetchAcaClasses(),
          fetchRlpTemplates().catch(() => [] as RlpTemplate[]),
        ]);
        const teacherName = getLoggedInTeacherName();
        const teacherClasses = data.filter(
          (c) => teacherNameMatches(c.teacher, teacherName) || teacherNameMatches(c.name, teacherName),
        );
        setClasses(teacherClasses);
        setTemplates(tpls);

        if (teacherClasses.length > 0) {
          setSelectedClassId(teacherClasses[0].id);
          setTemplateStartDate(teacherClasses[0].openDate || teacherClasses[0].phaseStartDate || "");
          const matchKey = resolveTemplateKeyForClass(teacherClasses[0], tpls);
          setSelectedTemplateKey(matchKey);
        } else if (tpls.length > 0) {
          setSelectedTemplateKey(tpls[0].key);
        }
      } catch (err) {
        console.error("Failed to load teacher classes or RLP templates", err);
      }
    }
    loadInitial();
  }, [resolveTemplateKeyForClass]);

  const handleOpenTemplateModal = () => {
    const currentClass = classes.find((c) => c.id === selectedClassId);
    if (currentClass) {
      setTemplateStartDate(currentClass.openDate || currentClass.phaseStartDate || "");
      const matchKey = resolveTemplateKeyForClass(currentClass, templates);
      if (matchKey) setSelectedTemplateKey(matchKey);
    }
    setIsTemplateModalOpen(true);
  };

  const handleApplyTemplate = async () => {
    if (!selectedClassId || !selectedTemplateKey) return;
    setApplyingTemplate(true);
    setError(null);
    try {
      const res = await applyRlpTemplate(selectedTemplateKey, {
        classId: selectedClassId,
        startDate: templateStartDate,
        scheduleMode: templateScheduleMode,
      });
      setIsTemplateModalOpen(false);
      await sync(selectedClassId);
      showToast(`Đã áp dụng thành công ${res.templateTitle} (${res.totalSessions} buổi) cho lớp!`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Áp dụng RLP Mẫu thất bại.");
    } finally {
      setApplyingTemplate(false);
    }
  };

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
        skill: draft.skill.trim() || activeRow?.skill,
        contents: draft.contents.trim(),
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

  const handleAddSession = async () => {
    if (!selectedClassId) {
      setError("Chọn lớp trước khi thêm buổi.");
      return;
    }
    setAdding(true);
    setError(null);
    try {
      const created = await addRlpSession(selectedClassId, {});
      await sync(selectedClassId);
      openEdit(created);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thêm được buổi.");
    } finally {
      setAdding(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (deletingNo == null || !selectedClassId) return;
    setDeleteBusy(true);
    setError(null);
    try {
      await deleteRlpSession(deletingNo, selectedClassId);
      if (activeNo === deletingNo) {
        setActiveNo(null);
        setDraft(null);
      }
      setDeletingNo(null);
      await sync(selectedClassId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không xóa được buổi.");
    } finally {
      setDeleteBusy(false);
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
            Cập nhật nội dung buổi học, điểm danh, homework, ghi chú GV và link file — học viên thấy ngay trên trang Thông tin khóa học. Có thể thêm/xoá buổi; ngưỡng cảnh báo BTVN tính theo 20% số buổi của lớp.
          </p>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
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
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenTemplateModal}
              disabled={!selectedClassId || loading}
              className="inline-flex items-center rounded-xl bg-primary px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-primary/90 disabled:opacity-50"
            >
              Áp dụng RLP Mẫu
            </button>
            <button
              type="button"
              onClick={() => void handleAddSession()}
              disabled={!selectedClassId || adding || loading}
              className="inline-flex items-center rounded-xl border border-zinc-300 bg-white px-3.5 py-1.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
            >
              {adding ? "Đang thêm…" : "Thêm buổi"}
            </button>
          </div>
        </div>
      </div>

      {toastMessage ? (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800 flex items-center justify-between">
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-xs font-bold text-green-700 hover:underline"
          >
            Đóng
          </button>
        </div>
      ) : null}

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
                  <th className="px-4 py-3 min-w-[200px]">Nội dung</th>
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
                    <td className="px-4 py-3 max-w-[240px] text-xs text-zinc-700 leading-relaxed">
                      <span className="line-clamp-2" title={row.contents}>
                        {row.contents || "—"}
                      </span>
                    </td>
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
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEdit(row)}
                          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white hover:bg-primary/90"
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingNo(row.no)}
                          className="rounded-lg border border-danger/20 bg-danger/5 px-3 py-1.5 text-xs font-bold text-danger hover:bg-danger/10"
                        >
                          Xóa
                        </button>
                      </div>
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
              Buổi {activeRow.no} · {activeRow.date}
            </h3>

            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wider text-muted">
                  Skill
                </span>
                <input
                  type="text"
                  value={draft.skill}
                  onChange={(e) =>
                    setDraft((d) => (d ? { ...d, skill: e.target.value } : d))
                  }
                  placeholder="Speaking / Reading / Writing / Listening"
                  className="mt-1 w-full rounded-xl border border-primary/15 px-3 py-2 text-sm"
                />
              </label>

              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wider text-muted">
                  Nội dung
                </span>
                <textarea
                  value={draft.contents}
                  onChange={(e) =>
                    setDraft((d) => (d ? { ...d, contents: e.target.value } : d))
                  }
                  rows={3}
                  placeholder="Nội dung buổi học hiển thị cho học viên…"
                  className="mt-1 w-full resize-y rounded-xl border border-primary/15 px-3 py-2 text-sm"
                />
              </label>

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

      {deletingNo != null ? (
        <div className="fixed inset-0 z-[110] flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-premium" role="dialog">
            <h3 className="text-lg font-black text-foreground">Xóa buổi {deletingNo}?</h3>
            <p className="mt-2 text-sm text-muted">
              Buổi này sẽ bị gỡ khỏi bảng RLP của lớp. Điểm danh / BTVN gắn với buổi cũng mất. Ngưỡng
              cảnh báo BTVN sẽ tính lại theo số buổi còn lại.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                disabled={deleteBusy}
                onClick={() => setDeletingNo(null)}
                className="rounded-xl px-4 py-2 text-sm font-bold text-muted hover:bg-zinc-100"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={deleteBusy}
                onClick={() => void handleConfirmDelete()}
                className="rounded-xl bg-danger px-4 py-2 text-sm font-bold text-white hover:bg-danger/90 disabled:opacity-60"
              >
                {deleteBusy ? "Đang xóa…" : "Xóa buổi"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* MODAL: Lấy RLP Mẫu từ Học Vụ Khánh Thi cho Giáo Viên */}
      {isTemplateModalOpen ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-white shadow-2xl overflow-hidden border border-zinc-200">
            <div className="p-6 border-b border-zinc-200 bg-zinc-50/60 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">
                  Học Vụ Khánh Thi · Bộ Giáo Án Chuẩn
                </span>
                <h3 className="text-base font-black text-zinc-900 mt-0.5">
                  Lấy Khuôn Mẫu RLP Cho Lớp Học
                </h3>
                <p className="text-xs text-zinc-500 font-medium mt-0.5">
                  Áp dụng khung giáo án chuẩn (nội dung, slide, link bài tập) do Học vụ Khánh Thi đã biên soạn.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsTemplateModalOpen(false)}
                className="rounded-full p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-zinc-700 mb-2">
                  1. Chọn khuôn mẫu RLP phù hợp
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-56 overflow-y-auto pr-1">
                  {templates.map((tpl) => {
                    const isSelected = tpl.key === selectedTemplateKey;
                    const sessionCount = tpl.sessions?.length || tpl.totalSessions || 18;
                    const currentCls = classes.find((c) => c.id === selectedClassId);
                    const isRecommended = currentCls && resolveTemplateKeyForClass(currentCls, templates) === tpl.key;

                    return (
                      <div
                        key={tpl.key}
                        onClick={() => setSelectedTemplateKey(tpl.key)}
                        className={`cursor-pointer rounded-2xl border p-3.5 transition-all relative ${
                          isSelected
                            ? "border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20 shadow-xs"
                            : "border-zinc-200 hover:border-emerald-300 bg-white"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-black text-zinc-900 leading-snug">
                            {tpl.title}
                          </span>
                          <span className="rounded-lg bg-zinc-100 px-2 py-0.5 text-[10px] font-black text-zinc-700 whitespace-nowrap">
                            {sessionCount} buổi
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-zinc-500 line-clamp-2 leading-relaxed">
                          {tpl.description || "Khuôn mẫu chuẩn do Học vụ Khánh Thi biên soạn."}
                        </p>
                        {isRecommended && (
                          <div className="mt-2 inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-800">
                            ★ Phù hợp nhất cho lớp này
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-zinc-100">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-700 mb-1.5">
                    2. Ngày khai giảng / Buổi 1 (DD/MM/YYYY)
                  </label>
                  <input
                    type="text"
                    value={templateStartDate}
                    onChange={(e) => setTemplateStartDate(e.target.value)}
                    placeholder="Ví dụ: 18/06/2026"
                    className="w-full h-10 rounded-xl border border-zinc-300 bg-white px-3.5 text-xs font-bold text-zinc-900 outline-none focus:border-emerald-500"
                  />
                  <span className="text-[10px] text-zinc-400 mt-1 block">
                    Mặc định lấy ngày mở lớp trong hệ thống.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-700 mb-1.5">
                    3. Chế độ tính ngày học
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTemplateScheduleMode("auto")}
                      className={`rounded-xl p-2.5 text-left border transition-all cursor-pointer ${
                        templateScheduleMode === "auto"
                          ? "border-emerald-500 bg-emerald-50/50 text-emerald-800 font-bold"
                          : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                      }`}
                    >
                      <div className="text-xs font-black">Tự động tính ngày</div>
                      <div className="text-[10px] text-zinc-500 mt-0.5 leading-snug">
                        Theo lịch 2-4-6 hoặc 3-5-7
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTemplateScheduleMode("keep_dates")}
                      className={`rounded-xl p-2.5 text-left border transition-all cursor-pointer ${
                        templateScheduleMode === "keep_dates"
                          ? "border-emerald-500 bg-emerald-50/50 text-emerald-800 font-bold"
                          : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                      }`}
                    >
                      <div className="text-xs font-black">Giữ ngày hiện tại</div>
                      <div className="text-[10px] text-zinc-500 mt-0.5 leading-snug">
                        Chỉ cập nhật nội dung
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {selectedTemplateKey && (
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50/60 p-4 space-y-2">
                  <div className="text-[10px] font-black uppercase tracking-wider text-zinc-500 flex items-center justify-between">
                    <span>Xem trước nội dung khuôn mẫu đã chọn</span>
                    <span className="text-emerald-700 font-bold">
                      {templates.find((t) => t.key === selectedTemplateKey)?.title}
                    </span>
                  </div>
                  <div className="text-xs text-zinc-600 line-clamp-3 italic leading-relaxed">
                    {templates.find((t) => t.key === selectedTemplateKey)?.sessions?.[0]?.contents
                      ? `Buổi 1: ${templates.find((t) => t.key === selectedTemplateKey)?.sessions?.[0]?.contents}`
                      : "Toàn bộ bài giảng, tài liệu slide và link bài tập Google Docs đã được chuẩn bị sẵn sàng."}
                  </div>
                </div>
              )}
            </div>

            <div className="p-5 border-t border-zinc-200 bg-zinc-50/80 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsTemplateModalOpen(false)}
                className="rounded-2xl border border-zinc-200 bg-white hover:bg-zinc-100 px-4 py-2 text-xs font-bold text-zinc-700 transition-all cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={applyingTemplate || !selectedClassId || !selectedTemplateKey}
                onClick={() => void handleApplyTemplate()}
                className="rounded-2xl bg-emerald-600 px-6 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-md hover:bg-emerald-500 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                {applyingTemplate ? "Đang áp dụng…" : "Áp Dụng RLP Mẫu Vào Lớp Này"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

