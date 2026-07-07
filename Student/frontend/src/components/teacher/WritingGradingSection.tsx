
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { students } from "@/components/teacher/mockData";
import {
  formatIsoDateTimeVi,
  writingStatusLabel,
  writingStatusTone,
} from "@/lib/selfStudyFormat";
import { formatBandScore } from "@/lib/formatBandScore";
import {
  gradeWritingSubmission,
  refreshWritingSubmissionsForTeacher,
  WRITING_SUBMISSIONS_EVENT,
  type WritingSubmission,
  type WritingSubmissionStatus,
} from "@/lib/writingSubmissions";
import { StatusBadge } from "@/components/student/SelfStudyResultsTable";

type StatusFilter = WritingSubmissionStatus | "all";

function resolveStudentName(row: WritingSubmission): string {
  if (row.studentName?.trim()) return row.studentName;
  const found = students.find((s) => s.id === row.studentId);
  return found?.name ?? row.studentId;
}

const TYPE_OPTIONS = ["Mock test", "Final", "Entrance", "Support", "RLP", "RLP HW"];

export function WritingGradingSection() {
  const [rows, setRows] = useState<WritingSubmission[]>([]);
  const [filter, setFilter] = useState<StatusFilter>("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal & Draft States
  const [activeId, setActiveId] = useState<string | null>(null);
  const [scoreDraft, setScoreDraft] = useState("");
  const [linkDraft, setLinkDraft] = useState("");
  const [dueDraft, setDueDraft] = useState("");
  const [gmailDraft, setGmailDraft] = useState("");
  const [typeDraft, setTypeDraft] = useState("");
  const [task1Draft, setTask1Draft] = useState("");
  const [task2Draft, setTask2Draft] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [saving, setSaving] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const sync = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await refreshWritingSubmissionsForTeacher("all");
      setRows(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được danh sách.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void sync();
    const onUpdate = () => void sync();
    window.addEventListener(WRITING_SUBMISSIONS_EVENT, onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener(WRITING_SUBMISSIONS_EVENT, onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, [sync]);

  // Reset page when filter or search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchQuery]);

  const filtered = useMemo(() => {
    let list = rows;
    if (filter !== "all") {
      list = list.filter((r) => r.status === filter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (r) =>
          resolveStudentName(r).toLowerCase().includes(q) ||
          (r.studentGmail || "").toLowerCase().includes(q) ||
          (r.note || "").toLowerCase().includes(q) ||
          (r.type || "").toLowerCase().includes(q)
      );
    }
    return [...list].sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
    );
  }, [rows, filter, searchQuery]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage]);

  const counts = useMemo(
    () => ({
      all: rows.length,
      pending: rows.filter((r) => r.status === "pending").length,
      grading: rows.filter((r) => r.status === "grading").length,
      graded: rows.filter((r) => r.status === "graded").length,
    }),
    [rows],
  );

  const activeRow = rows.find((r) => r.id === activeId);

  const openGrade = (row: WritingSubmission) => {
    setActiveId(row.id);
    setScoreDraft(row.score ?? "");
    setLinkDraft(row.examLink ?? "");
    setDueDraft(row.dueDate ?? "");
    setGmailDraft(row.studentGmail ?? "");
    setTypeDraft(row.type ?? "");
    setTask1Draft(row.task1 ?? "");
    setTask2Draft(row.task2 ?? "");
    setNoteDraft(row.note ?? "");
  };

  const setStatusQuick = async (
    row: WritingSubmission,
    nextStatus: WritingSubmissionStatus,
    overridePayload?: Partial<Parameters<typeof gradeWritingSubmission>[1]>
  ) => {
    setSaving(true);
    setError(null);
    try {
      await gradeWritingSubmission(row.id, {
        status: nextStatus,
        score: nextStatus === "graded" ? scoreDraft || row.score : scoreDraft || undefined,
        examLink: linkDraft || row.examLink,
        dueDate: dueDraft ?? row.dueDate,
        studentGmail: gmailDraft ?? row.studentGmail,
        type: typeDraft ?? row.type,
        task1: task1Draft ?? row.task1,
        task2: task2Draft ?? row.task2,
        note: noteDraft ?? row.note,
        ...overridePayload,
      });
      await sync();
      if (nextStatus === "graded" || (overridePayload && activeId === row.id)) {
        setActiveId(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không cập nhật được.");
    } finally {
      setSaving(false);
    }
  };

  const saveGraded = async () => {
    if (!activeRow) return;
    if (!scoreDraft.trim()) {
      setError("Vui lòng nhập tổng điểm W trước khi hoàn tất.");
      return;
    }
    await setStatusQuick(activeRow, "graded");
  };

  const filters: { id: StatusFilter; label: string; count: number }[] = [
    { id: "pending", label: "Chờ chấm", count: counts.pending },
    { id: "grading", label: "Đang chấm", count: counts.grading },
    { id: "graded", label: "Đã chấm", count: counts.graded },
    { id: "all", label: "Tất cả", count: counts.all },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`rounded-2xl px-4 py-2 text-xs font-bold transition-all ${
                filter === f.id
                  ? "bg-primary text-white shadow-soft"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              {f.label}
              <span className="ml-1.5 opacity-80">({f.count})</span>
            </button>
          ))}
        </div>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tìm tên học viên, gmail, ghi chú..."
          className="h-10 w-full md:w-80 rounded-xl border border-zinc-200 px-4 text-sm font-semibold outline-none focus:border-primary/45 focus:ring-2 focus:ring-primary/10 bg-white"
        />
      </div>

      {error ? (
        <div className="rounded-xl border border-danger/20 bg-danger/10 px-4 py-3 text-xs font-semibold text-danger">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-sm text-muted">
          Đang tải…
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-sm text-muted">
          Không có bài nộp trong mục này.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-primary/10 bg-white shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left text-sm">
              <thead>
                <tr className="border-b border-primary/10 bg-background text-[10px] font-black uppercase tracking-widest text-muted">
                  <th className="px-4 py-3">DUE</th>
                  <th className="px-4 py-3">Tên học viên</th>
                  <th className="px-4 py-3">Gmail</th>
                  <th className="px-4 py-3">Bài làm (BCB)</th>
                  <th className="px-4 py-3">Dạng</th>
                  <th className="px-4 py-3">Tổng W</th>
                  <th className="px-4 py-3">Task 1</th>
                  <th className="px-4 py-3">Task 2</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3">Ghi chú</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-primary/5 hover:bg-primary-soft/20 text-xs font-semibold"
                  >
                    <td className="px-4 py-3 tabular-nums text-muted">{row.dueDate || "—"}</td>
                    <td className="px-4 py-3 font-bold text-foreground">{resolveStudentName(row)}</td>
                    <td className="px-4 py-3 text-zinc-500 font-medium">{row.studentGmail || "—"}</td>
                    <td className="px-4 py-3">
                      <a
                        href={row.examLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded bg-primary/10 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-primary hover:bg-primary/20"
                      >
                        Mở file bài làm
                      </a>
                    </td>
                    <td className="px-4 py-3 text-zinc-600">{row.type || "—"}</td>
                    <td className="px-4 py-3 font-black text-secondary text-sm">
                      {row.score ? formatBandScore(row.score) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {row.task1 ? (
                        <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-bold ${
                          row.task1 === "Graded" ? "bg-success/15 text-success" : "bg-warning/15 text-warning"
                        }`}>
                          {row.task1}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {row.task2 ? (
                        <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-bold ${
                          row.task2 === "Graded" ? "bg-success/15 text-success" : "bg-warning/15 text-warning"
                        }`}>
                          {row.task2}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        label={writingStatusLabel(row.status)}
                        tone={writingStatusTone(row.status)}
                      />
                    </td>
                    <td className="max-w-[150px] truncate px-4 py-3 text-muted" title={row.note}>
                      {row.note || "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1.5">
                        {row.status === "pending" ? (
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => void setStatusQuick(row, "grading")}
                            className="rounded-lg bg-primary/10 px-2 py-1.5 text-[10px] font-black uppercase tracking-wider text-primary hover:bg-primary/15 disabled:opacity-50"
                          >
                            Chấm
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => openGrade(row)}
                          className="rounded-lg border border-zinc-200 px-2 py-1.5 text-[10px] font-black uppercase tracking-wider text-foreground hover:bg-zinc-50"
                        >
                          Sửa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 ? (
            <div className="flex items-center justify-between border-t border-primary/10 bg-background/50 px-4 py-3.5">
              <span className="text-xs text-muted">
                Hiển thị bản ghi thứ <strong>{((currentPage - 1) * itemsPerPage) + 1}</strong> đến{" "}
                <strong>{Math.min(currentPage * itemsPerPage, filtered.length)}</strong> trên tổng số{" "}
                <strong>{filtered.length}</strong> bài nộp
              </span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-bold text-foreground hover:bg-zinc-50 disabled:opacity-50"
                >
                  Trước
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setCurrentPage(p)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                      currentPage === p
                        ? "bg-primary text-white"
                        : "border border-zinc-200 bg-white text-foreground hover:bg-zinc-50"
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-bold text-foreground hover:bg-zinc-50 disabled:opacity-50"
                >
                  Sau
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Editing Dialog Modal */}
      {activeRow && activeId === activeRow.id ? (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div
            className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-premium"
            role="dialog"
            aria-labelledby="grading-modal-title"
          >
            <h3 id="grading-modal-title" className="text-lg font-black text-foreground">
              Chấm bài & Cập nhật: {resolveStudentName(activeRow)}
            </h3>
            <p className="mt-1 text-xs text-muted">
              Nộp lúc: {formatIsoDateTimeVi(activeRow.submittedAt)}
            </p>

            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wider text-muted">Gmail</span>
                <input
                  type="email"
                  value={gmailDraft}
                  onChange={(e) => setGmailDraft(e.target.value)}
                  placeholder="student@gmail.com"
                  className="mt-1 h-10 w-full rounded-xl border border-primary/15 px-3 text-sm font-semibold outline-none focus:border-primary/45"
                />
              </label>

              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wider text-muted">Hạn nộp (Due)</span>
                <input
                  type="text"
                  value={dueDraft}
                  onChange={(e) => setDueDraft(e.target.value)}
                  placeholder="vd. 03/06"
                  className="mt-1 h-10 w-full rounded-xl border border-primary/15 px-3 text-sm font-semibold outline-none focus:border-primary/45"
                />
              </label>

              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wider text-muted">Dạng bài nộp</span>
                <select
                  value={typeDraft}
                  onChange={(e) => setTypeDraft(e.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-primary/15 px-3 text-sm font-semibold outline-none focus:border-primary/45 bg-white"
                >
                  <option value="">-- Chọn dạng --</option>
                  {TYPE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                  {!TYPE_OPTIONS.includes(typeDraft) && typeDraft && (
                    <option value={typeDraft}>{typeDraft}</option>
                  )}
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wider text-muted">Link bài làm (BCB)</span>
                <input
                  type="url"
                  value={linkDraft}
                  onChange={(e) => setLinkDraft(e.target.value)}
                  placeholder="https://docs.google.com/..."
                  className="mt-1 h-10 w-full rounded-xl border border-primary/15 px-3 text-xs outline-none focus:border-primary/45"
                />
              </label>

              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wider text-muted">Trạng thái Task 1</span>
                <input
                  type="text"
                  value={task1Draft}
                  onChange={(e) => setTask1Draft(e.target.value)}
                  placeholder="vd. Graded, AI, No"
                  className="mt-1 h-10 w-full rounded-xl border border-primary/15 px-3 text-sm font-semibold outline-none focus:border-primary/45"
                />
              </label>

              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wider text-muted">Trạng thái Task 2</span>
                <input
                  type="text"
                  value={task2Draft}
                  onChange={(e) => setTask2Draft(e.target.value)}
                  placeholder="vd. Graded, No, Ne"
                  className="mt-1 h-10 w-full rounded-xl border border-primary/15 px-3 text-sm font-semibold outline-none focus:border-primary/45"
                />
              </label>

              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wider text-muted">Tổng điểm W</span>
                <input
                  type="text"
                  value={scoreDraft}
                  onChange={(e) => setScoreDraft(e.target.value)}
                  placeholder="vd. 6.5"
                  className="mt-1 h-10 w-full rounded-xl border border-primary/15 px-3 text-sm font-black outline-none focus:border-primary/45 text-secondary"
                />
              </label>

              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wider text-muted">Trạng thái chấm</span>
                <select
                  value={activeRow.status}
                  onChange={(e) => void setStatusQuick(activeRow, e.target.value as WritingSubmissionStatus)}
                  className="mt-1 h-10 w-full rounded-xl border border-primary/15 px-3 text-sm font-semibold outline-none focus:border-primary/45 bg-white"
                >
                  <option value="pending">Chờ chấm</option>
                  <option value="grading">Đang chấm</option>
                  <option value="graded">Đã chấm</option>
                </select>
              </label>

              <label className="block md:col-span-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted">Ghi chú (Lớp / Note)</span>
                <textarea
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  rows={2}
                  placeholder="vd. RLP Nguyễn Thị Kim Thơ - 13812502CC2"
                  className="mt-1 w-full resize-none rounded-xl border border-primary/15 px-3 py-2 text-sm outline-none focus:border-primary/45"
                />
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveId(null)}
                className="rounded-xl px-4 py-2 text-sm font-bold text-muted hover:bg-zinc-100"
              >
                Hủy
              </button>
              
              {activeRow.status !== "grading" && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void setStatusQuick(activeRow, "grading")}
                  className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-bold text-primary hover:bg-primary/10 disabled:opacity-60"
                >
                  Đang chấm
                </button>
              )}

              <button
                type="button"
                disabled={saving}
                onClick={() => void saveGraded()}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-60"
              >
                {saving ? "Đang lưu…" : "Hoàn tất & Lưu"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
