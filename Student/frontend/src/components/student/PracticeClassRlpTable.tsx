"use client";

import { useCallback, useEffect, useState } from "react";
import {
  isSessionPast,
  HOMEWORK_STATUS_TEXT_CLASS,
  type RlpSession,
  type HomeworkStatus,
  type Attendance,
} from "@/lib/courseSchedule";
import type { CreatePracticeRlpPayload, UpdatePracticeRlpPayload } from "@/lib/practiceRlpApi";
import { useClientToday } from "@/hooks/useClientToday";

// ─── Types ────────────────────────────────────────────────────────────────────

type PracticeRlpTableProps = {
  /** Per-student ID used by the API */
  studentId: string;
  /** All sessions fetched from API */
  sessions: RlpSession[];
  /** If true: show Add/Edit/Delete buttons */
  canEdit: boolean;
  /** Called by teacher/ACA to add a session */
  onAdd?: (payload: CreatePracticeRlpPayload) => Promise<void>;
  /** Called by teacher/ACA to update a session */
  onUpdate?: (no: number, payload: UpdatePracticeRlpPayload) => Promise<void>;
  /** Called by teacher/ACA to delete a session */
  onDelete?: (no: number) => Promise<void>;
  /** Called by student to toggle homework submission */
  onToggleHomework?: (row: RlpSession) => Promise<void>;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SKILL_OPTIONS = ["Speaking", "Listening", "Reading", "Writing"];

function SkillBadge({ skill }: { skill: string }) {
  const colorMap: Record<string, string> = {
    Speaking: "bg-primary/10 text-primary",
    Listening: "bg-emerald-100 text-emerald-700",
    Reading: "bg-info/10 text-info",
    Writing: "bg-amber-100 text-amber-700",
  };
  const cls = colorMap[skill] ?? "bg-zinc-100 text-zinc-600";
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${cls}`}>
      {skill}
    </span>
  );
}

// ─── Add/Edit Modal ───────────────────────────────────────────────────────────

type ModalMode = "add" | "edit";

type SessionFormData = {
  no: string;
  date: string;
  skill: string;
  contents: string;
  teacherNote: string;
  deadline: string;
  lessonFileUrl: string;
  homeworkFileUrl: string;
  recordingUrl: string;
  attendance: Attendance;
  homeworkStatus: HomeworkStatus;
};

function emptyForm(): SessionFormData {
  return {
    no: "",
    date: "",
    skill: "Speaking",
    contents: "",
    teacherNote: "",
    deadline: "",
    lessonFileUrl: "",
    homeworkFileUrl: "",
    recordingUrl: "",
    attendance: "present",
    homeworkStatus: "not_assigned",
  };
}

function sessionToForm(s: RlpSession): SessionFormData {
  return {
    no: String(s.no),
    date: s.date,
    skill: s.skill,
    contents: s.contents,
    teacherNote: s.teacherNote === "—" ? "" : s.teacherNote,
    deadline: s.deadline,
    lessonFileUrl: s.lessonFileUrl ?? "",
    homeworkFileUrl: s.homeworkFileUrl ?? "",
    recordingUrl: s.recordingUrl ?? "",
    attendance: s.attendance,
    homeworkStatus: s.homeworkStatus,
  };
}

type SessionFormModalProps = {
  mode: ModalMode;
  initialData?: RlpSession;
  existingNos: number[];
  onConfirm: (data: SessionFormData) => Promise<void>;
  onClose: () => void;
};

function SessionFormModal({ mode, initialData, existingNos, onConfirm, onClose }: SessionFormModalProps) {
  const [form, setForm] = useState<SessionFormData>(() =>
    initialData ? sessionToForm(initialData) : emptyForm(),
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof SessionFormData, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.date.trim()) { setError("Vui lòng nhập ngày học"); return; }
    if (!form.contents.trim()) { setError("Vui lòng nhập nội dung"); return; }
    if (mode === "add") {
      const noNum = parseInt(form.no, 10);
      if (!form.no || isNaN(noNum) || noNum < 1) { setError("Vui lòng nhập số buổi hợp lệ"); return; }
      if (existingNos.includes(noNum)) { setError(`Buổi số ${noNum} đã tồn tại`); return; }
    }
    setSubmitting(true);
    try {
      await onConfirm(form);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls =
    "w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-800 placeholder-zinc-400 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all";
  const labelCls = "text-[10px] font-black uppercase tracking-wider text-zinc-500 block mb-1";

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 px-6 py-4 flex items-center justify-between border-b border-primary/10">
          <div>
            <h3 className="text-sm font-black text-foreground uppercase tracking-wide">
              {mode === "add" ? "Thêm buổi RLP" : "Chỉnh sửa buổi RLP"}
            </h3>
            <p className="text-[11px] text-muted mt-0.5">Lớp luyện đề</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-zinc-400 hover:text-zinc-700 hover:bg-white transition-all shadow-2xs"
            aria-label="Đóng"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto scrollbar-thin">
          <div className="grid grid-cols-2 gap-4">
            {/* Số buổi */}
            <div>
              <label className={labelCls}>Số buổi *</label>
              <input
                type="number"
                min={1}
                value={form.no}
                onChange={(e) => set("no", e.target.value)}
                disabled={mode === "edit"}
                placeholder="VD: 1"
                className={`${inputCls} ${mode === "edit" ? "bg-zinc-50 text-zinc-400 cursor-not-allowed" : ""}`}
              />
            </div>
            {/* Skill */}
            <div>
              <label className={labelCls}>Kỹ năng *</label>
              <select value={form.skill} onChange={(e) => set("skill", e.target.value)} className={inputCls}>
                {SKILL_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Ngày học */}
          <div>
            <label className={labelCls}>Ngày học * (DD/MM/YYYY)</label>
            <input
              type="text"
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
              placeholder="VD: 15/09/2026"
              className={inputCls}
            />
          </div>

          {/* Nội dung */}
          <div>
            <label className={labelCls}>Nội dung *</label>
            <textarea
              value={form.contents}
              onChange={(e) => set("contents", e.target.value)}
              rows={2}
              placeholder="Mô tả nội dung buổi học..."
              className={`${inputCls} resize-none`}
            />
          </div>

          {/* Tiến độ (Ghi chú GV) */}
          <div>
            <label className={labelCls}>Tiến độ / Ghi chú GV</label>
            <textarea
              value={form.teacherNote}
              onChange={(e) => set("teacherNote", e.target.value)}
              rows={2}
              placeholder="Nhận xét tiến độ học viên trong buổi này..."
              className={`${inputCls} resize-none`}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Deadline */}
            <div>
              <label className={labelCls}>Deadline Homework</label>
              <input
                type="text"
                value={form.deadline}
                onChange={(e) => set("deadline", e.target.value)}
                placeholder="DD/MM/YYYY"
                className={inputCls}
              />
            </div>
            {/* Điểm danh */}
            <div>
              <label className={labelCls}>Điểm danh</label>
              <select value={form.attendance} onChange={(e) => set("attendance", e.target.value as Attendance)} className={inputCls}>
                <option value="present">Đi học</option>
                <option value="absent">Vắng học</option>
              </select>
            </div>
          </div>

          {/* Homework status */}
          <div>
            <label className={labelCls}>Trạng thái Homework</label>
            <select value={form.homeworkStatus} onChange={(e) => set("homeworkStatus", e.target.value as HomeworkStatus)} className={inputCls}>
              <option value="not_assigned">Chưa giao</option>
              <option value="in_progress">Chưa nộp</option>
              <option value="submitted_waiting">Đã nộp (chờ chấm)</option>
              <option value="submitted">Đã chấm</option>
              <option value="overdue">Quá hạn</option>
            </select>
          </div>

          {/* File URLs */}
          <div>
            <label className={labelCls}>Link File bài học (Google Drive)</label>
            <input
              type="url"
              value={form.lessonFileUrl}
              onChange={(e) => set("lessonFileUrl", e.target.value)}
              placeholder="https://drive.google.com/..."
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Link Homework Docs</label>
            <input
              type="url"
              value={form.homeworkFileUrl}
              onChange={(e) => set("homeworkFileUrl", e.target.value)}
              placeholder="https://docs.google.com/..."
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Link Video Record</label>
            <input
              type="url"
              value={form.recordingUrl}
              onChange={(e) => set("recordingUrl", e.target.value)}
              placeholder="https://..."
              className={inputCls}
            />
          </div>

          {error && (
            <div className="rounded-xl bg-danger/10 border border-danger/20 px-4 py-2.5 text-xs font-bold text-danger">
              {error}
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-2.5 border-t border-zinc-100 px-6 py-4 bg-zinc-50/50">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-bold text-zinc-600 hover:bg-zinc-100 transition-all"
          >
            Hủy
          </button>
          <button
            type="submit"
            form="practice-rlp-form"
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-xl bg-primary px-5 py-2 text-xs font-black uppercase text-white shadow-sm transition-all hover:bg-primary/90 disabled:opacity-50"
          >
            {submitting ? "Đang lưu..." : mode === "add" ? "Thêm buổi" : "Lưu thay đổi"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Confirm Dialog ────────────────────────────────────────────────────

function DeleteConfirmDialog({
  no,
  onConfirm,
  onClose,
}: {
  no: number;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 w-full max-w-sm rounded-3xl bg-white p-7 shadow-2xl">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-danger/10">
            <svg className="h-7 w-7 text-danger" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-black text-foreground">Xóa Buổi {no}?</h3>
            <p className="mt-1 text-xs font-medium text-muted">Hành động này không thể hoàn tác.</p>
          </div>
          <div className="flex gap-3 w-full mt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-zinc-200 py-2.5 text-xs font-bold text-zinc-600 hover:bg-zinc-50 transition-all"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={async () => {
                setSubmitting(true);
                try { await onConfirm(); onClose(); } finally { setSubmitting(false); }
              }}
              className="flex-1 rounded-xl bg-danger py-2.5 text-xs font-black uppercase text-white shadow-sm hover:bg-danger/90 transition-all disabled:opacity-50"
            >
              {submitting ? "Đang xóa..." : "Xóa"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Phase Config ─────────────────────────────────────────────────────────────

type PhaseConfig = {
  id: string;
  label: string;
  shortLabel: string;
  min?: number; // session no min (inclusive)
  max?: number; // session no max (inclusive)
};

const PRACTICE_RLP_PHASES: PhaseConfig[] = [
  { id: "all", label: "Tất cả", shortLabel: "Tất cả" },
  { id: "phase1", label: "Chặng 1 (1–12)", shortLabel: "Chặng 1", min: 1, max: 12 },
  { id: "phase2", label: "Chặng 2 (13–20)", shortLabel: "Chặng 2", min: 13, max: 20 },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export function PracticeClassRlpTable({
  sessions,
  canEdit,
  onAdd,
  onUpdate,
  onDelete,
  onToggleHomework,
}: PracticeRlpTableProps) {
  const clientToday = useClientToday();
  const [activePhaseId, setActivePhaseId] = useState("all");
  const [modal, setModal] = useState<
    | { kind: "add" }
    | { kind: "edit"; row: RlpSession }
    | { kind: "delete"; no: number }
    | null
  >(null);

  const currentPhase = PRACTICE_RLP_PHASES.find((p) => p.id === activePhaseId) ?? PRACTICE_RLP_PHASES[0];

  const displayed = sessions.filter((s) => {
    if (!currentPhase.min && !currentPhase.max) return true;
    if (currentPhase.min && s.no < currentPhase.min) return false;
    if (currentPhase.max && s.no > currentPhase.max) return false;
    return true;
  });

  const existingNos = sessions.map((s) => s.no);

  const handleAdd = async (form: SessionFormData) => {
    if (!onAdd) return;
    await onAdd({
      no: parseInt(form.no, 10),
      date: form.date,
      skill: form.skill,
      contents: form.contents,
      teacherNote: form.teacherNote.trim() || "—",
      deadline: form.deadline,
      lessonFileUrl: form.lessonFileUrl,
      homeworkFileUrl: form.homeworkFileUrl,
      recordingUrl: form.recordingUrl,
      attendance: form.attendance,
      homeworkStatus: form.homeworkStatus,
    });
  };

  const handleEdit = async (form: SessionFormData) => {
    if (!onUpdate || modal?.kind !== "edit") return;
    await onUpdate(modal.row.no, {
      date: form.date,
      skill: form.skill,
      contents: form.contents,
      teacherNote: form.teacherNote.trim() || "—",
      deadline: form.deadline,
      lessonFileUrl: form.lessonFileUrl,
      homeworkFileUrl: form.homeworkFileUrl,
      recordingUrl: form.recordingUrl,
      attendance: form.attendance,
      homeworkStatus: form.homeworkStatus,
    });
  };

  const handleDelete = async (no: number) => {
    if (!onDelete) return;
    await onDelete(no);
  };

  const cell = "px-3.5 py-3 align-middle";

  if (sessions.length === 0 && !canEdit) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-200 p-8 text-center">
        <svg className="h-10 w-10 mx-auto text-zinc-300 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p className="text-xs font-semibold text-zinc-400">Chưa có buổi học nào trong bảng RLP</p>
        <p className="text-[11px] text-zinc-300 mt-1">Giáo viên Thanh Tâm sẽ cập nhật sau mỗi buổi học</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-xs font-black uppercase tracking-wider text-zinc-950">
            RLP - Resonant Lesson Plan
          </h3>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            Lớp luyện đề · {sessions.length} buổi học
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Phase tabs */}
          <div className="flex items-center gap-1 rounded-xl bg-zinc-100 p-1 shrink-0">
            {PRACTICE_RLP_PHASES.map((phase) => {
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

          {/* Add button — only for Thanh Tâm & Khánh Thi */}
          {canEdit && onAdd && (
            <button
              type="button"
              onClick={() => setModal({ kind: "add" })}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 text-[10px] font-black uppercase text-white shadow-sm transition-all hover:bg-primary/90 active:scale-95"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Thêm buổi
            </button>
          )}
        </div>
      </div>

      {/* ── Mobile Card View ─────────────────────────────────────────────────── */}
      <div className="block lg:hidden space-y-4">
        {displayed.length === 0 ? (
          <p className="text-xs text-zinc-400 text-center py-6">Không có buổi học trong chặng này</p>
        ) : (
          displayed.map((row) => {
            const past = isSessionPast(row, clientToday);
            return (
              <div key={row.no} className="rounded-2xl border border-primary/10 bg-white p-4 shadow-xs space-y-3">
                {/* Row header */}
                <div className="flex items-center justify-between border-b border-primary/5 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">Buổi {row.no}</span>
                    <SkillBadge skill={row.skill} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-zinc-400">{row.date}</span>
                    {canEdit && (
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setModal({ kind: "edit", row })}
                          className="h-7 w-7 flex items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all"
                          title="Sửa buổi này"
                        >
                          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => setModal({ kind: "delete", no: row.no })}
                          className="h-7 w-7 flex items-center justify-center rounded-lg bg-danger/10 text-danger hover:bg-danger/20 transition-all"
                          title="Xóa buổi này"
                        >
                          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Contents */}
                <div className="space-y-1">
                  <div className="text-[9px] font-black uppercase text-zinc-400 tracking-wider">Nội dung</div>
                  <p className="text-xs font-medium text-foreground leading-relaxed">{row.contents}</p>
                </div>

                {/* Teacher note */}
                {row.teacherNote && row.teacherNote.trim() !== "—" && (
                  <div className="space-y-1 rounded-xl bg-primary-soft/30 border border-primary/5 p-2.5">
                    <div className="text-[9px] font-black uppercase text-primary tracking-wider">Tiến độ (Ghi chú GV)</div>
                    <p className="text-xs font-medium text-zinc-700 italic leading-relaxed">"{row.teacherNote}"</p>
                  </div>
                )}

                {/* Links + Attendance grid */}
                <div className="grid grid-cols-3 gap-2 bg-zinc-50/50 rounded-xl p-2 text-[11px]">
                  <div>
                    <div className="text-[9px] font-black uppercase text-zinc-400 tracking-wider">File bài học</div>
                    <div className="mt-1">
                      {row.lessonFileUrl?.trim() ? (
                        <a href={row.lessonFileUrl} target="_blank" rel="noopener noreferrer" className="text-success hover:underline font-bold">
                          Tải file
                        </a>
                      ) : <span className="text-zinc-400">—</span>}
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] font-black uppercase text-zinc-400 tracking-wider">Điểm danh</div>
                    <div className="mt-1">
                      {past ? (
                        row.attendance === "present"
                          ? <span className="font-bold text-success">Đi học</span>
                          : <span className="font-bold text-danger">Vắng học</span>
                      ) : <span className="text-zinc-400">—</span>}
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] font-black uppercase text-zinc-400 tracking-wider">Homework</div>
                    <div className="mt-1">
                      {row.homeworkFileUrl?.trim() ? (
                        <a href={row.homeworkFileUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-bold">
                          Mở Docs
                        </a>
                      ) : <span className="text-zinc-400">—</span>}
                    </div>
                  </div>
                </div>

                {/* Deadline + Status */}
                <div className="flex items-center justify-between border-t border-primary/5 pt-3">
                  <div className="text-[10px] text-zinc-500 font-medium">Hạn: {row.deadline || "—"}</div>
                  {(() => {
                    if (row.homeworkStatus === "submitted") {
                      return <span className="rounded-lg bg-emerald-50 px-2 py-1 text-[10px] font-black uppercase text-emerald-800">Đã chấm</span>;
                    }
                    const isWaiting = row.homeworkStatus === "submitted_waiting";
                    return onToggleHomework ? (
                      <button
                        type="button"
                        onClick={() => onToggleHomework(row)}
                        className={`rounded-lg border px-2.5 py-1 text-[10px] font-black uppercase ${
                          isWaiting ? "bg-blue-50 border-blue-200 text-primary" : "bg-rose-50 border-rose-200 text-rose-700"
                        }`}
                      >
                        {isWaiting ? "Hủy nộp" : "Nộp bài"}
                      </button>
                    ) : (
                      <span className={`text-[10px] font-bold ${HOMEWORK_STATUS_TEXT_CLASS[row.homeworkStatus]}`}>
                        {row.homeworkStatus === "submitted_waiting" ? "Đã nộp" :
                         row.homeworkStatus === "in_progress" || row.homeworkStatus === "overdue" ? "Chưa nộp" : "—"}
                      </span>
                    );
                  })()}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Desktop Table View ────────────────────────────────────────────────── */}
      <div className="hidden lg:flex flex-col rounded-2xl border border-zinc-200/80 bg-white shadow-xs overflow-hidden">
        <div className="overflow-auto scrollbar-thin" style={{ maxHeight: 480 }}>
          <table className="w-full min-w-[1100px] table-fixed border-collapse">
            <thead className="sticky top-0 z-30 bg-zinc-50 border-b border-zinc-200 text-[10px] font-black uppercase tracking-widest text-zinc-400">
              <tr>
                <th className="sticky top-0 left-0 z-30 bg-zinc-50 px-3.5 py-3 text-center w-[75px]">Buổi</th>
                <th className="sticky top-0 left-[75px] z-30 bg-zinc-50 px-3.5 py-3 text-center w-[90px]">Skill</th>
                <th className="px-3.5 py-3 text-left w-[200px]">Nội dung</th>
                <th className="px-3.5 py-3 text-center w-[85px]">File bài học</th>
                <th className="px-3.5 py-3 text-left w-[200px]">Tiến độ (GV)</th>
                <th className="px-3.5 py-3 text-center w-[80px]">Record</th>
                <th className="px-3.5 py-3 text-center w-[95px]">Điểm danh</th>
                <th className="px-3.5 py-3 text-center w-[85px]">Homework</th>
                <th className="px-3.5 py-3 text-center w-[95px]">Deadline</th>
                <th className="px-3.5 py-3 text-center w-[105px]">Trạng thái</th>
                {canEdit && <th className="px-3.5 py-3 text-center w-[80px]">Thao tác</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 font-medium text-xs text-zinc-700">
              {displayed.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 11 : 10} className="px-4 py-10 text-center text-xs text-zinc-400">
                    {canEdit
                      ? `Không có buổi học nào trong chặng này. Nhấn "Thêm buổi" để thêm buổi RLP đầu tiên.`
                      : "Không có buổi học nào trong chặng này."}
                  </td>
                </tr>
              ) : (
                displayed.map((row) => {
                  const past = isSessionPast(row, clientToday);
                  return (
                    <tr key={row.no} className="group hover:bg-zinc-50/60 transition-colors">
                      {/* Buổi — frozen */}
                      <td className={`${cell} sticky left-0 z-20 bg-white group-hover:bg-zinc-50/80 text-center font-black text-foreground tabular-nums`}>
                        Buổi {row.no}
                      </td>

                      {/* Skill — frozen */}
                      <td className={`${cell} sticky left-[75px] z-20 bg-white group-hover:bg-zinc-50/80 text-center`}>
                        <SkillBadge skill={row.skill} />
                      </td>

                      {/* Nội dung */}
                      <td className={`${cell} text-left font-semibold text-zinc-900 leading-snug break-words`}>
                        <div>{row.contents}</div>
                        <div className="text-[10px] text-zinc-400 font-medium mt-0.5">{row.date}</div>
                      </td>

                      {/* File bài học */}
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
                        ) : <span className="text-[11px] text-zinc-400">—</span>}
                      </td>

                      {/* Tiến độ */}
                      <td className={`${cell} text-left text-zinc-500 text-[11px] break-words`}>
                        {row.teacherNote && row.teacherNote.trim() !== "—" ? (
                          <span className="italic text-zinc-700">"{row.teacherNote}"</span>
                        ) : "—"}
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
                        ) : <span className="text-[11px] text-zinc-400">—</span>}
                      </td>

                      {/* Điểm danh */}
                      <td className={`${cell} text-center`}>
                        {past ? (
                          row.attendance === "present"
                            ? <span className="text-[11px] font-bold text-emerald-600">Đi học</span>
                            : <span className="text-[11px] font-bold text-rose-600">Vắng học</span>
                        ) : <span className="text-[11px] text-zinc-400">—</span>}
                      </td>

                      {/* Homework */}
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
                        ) : <span className="text-[11px] text-zinc-400">—</span>}
                      </td>

                      {/* Deadline */}
                      <td className={`${cell} text-center text-[11px] font-semibold tabular-nums text-zinc-500`}>
                        {row.deadline || "—"}
                      </td>

                      {/* Trạng thái */}
                      <td className={`${cell} text-center`}>
                        {(() => {
                          if (row.homeworkStatus === "submitted") {
                            return (
                              <span className="inline-flex items-center rounded-lg bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-800 select-none">
                                Đã chấm
                              </span>
                            );
                          }
                          const isWaiting = row.homeworkStatus === "submitted_waiting";
                          if (onToggleHomework) {
                            return (
                              <button
                                type="button"
                                onClick={() => onToggleHomework(row)}
                                className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-bold transition-all hover:scale-105 ${
                                  isWaiting
                                    ? "bg-primary/10 border-primary/20 text-primary hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600"
                                    : "bg-rose-50 border-rose-200 text-rose-700 hover:bg-primary/10 hover:border-primary/20 hover:text-primary"
                                }`}
                              >
                                <span className={`h-1.5 w-1.5 rounded-full ${isWaiting ? "bg-primary animate-pulse" : "bg-rose-600"}`} />
                                {isWaiting ? "Đã nộp" : "Chưa nộp"}
                              </button>
                            );
                          }
                          return (
                            <span className={`text-[10px] font-bold ${HOMEWORK_STATUS_TEXT_CLASS[row.homeworkStatus]}`}>
                              {isWaiting ? "Đã nộp" :
                               row.homeworkStatus === "in_progress" || row.homeworkStatus === "overdue" ? "Chưa nộp" :
                               row.homeworkStatus === "not_assigned" ? "—" : row.homeworkStatus}
                            </span>
                          );
                        })()}
                      </td>

                      {/* Edit/Delete — teacher only */}
                      {canEdit && (
                        <td className={`${cell} text-center`}>
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => setModal({ kind: "edit", row })}
                              className="h-7 w-7 flex items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all"
                              title="Sửa"
                            >
                              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => setModal({ kind: "delete", no: row.no })}
                              className="h-7 w-7 flex items-center justify-center rounded-lg bg-danger/10 text-danger hover:bg-danger/20 transition-all"
                              title="Xóa"
                            >
                              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────────────── */}
      {modal?.kind === "add" && (
        <SessionFormModal
          mode="add"
          existingNos={existingNos}
          onConfirm={handleAdd}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.kind === "edit" && (
        <SessionFormModal
          mode="edit"
          initialData={modal.row}
          existingNos={existingNos}
          onConfirm={handleEdit}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.kind === "delete" && (
        <DeleteConfirmDialog
          no={modal.no}
          onConfirm={() => handleDelete(modal.no)}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
