
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  formatIsoDateTimeVi,
  formatExternalUrl,
  writingStatusLabel,
  writingStatusTone,
} from "@/lib/selfStudyFormat";
import { formatBandScore } from "@/lib/formatBandScore";
import {
  ACA_GRADERS,
  deduplicateWritingSubmissions,
  gradeWritingSubmission,
  rebalanceWritingSubmissions,
  refreshWritingSubmissionsForTeacher,
  WRITING_SUBMISSIONS_EVENT,
  type WritingSubmission,
  type WritingSubmissionStatus,
} from "@/lib/writingSubmissions";
import { StatusBadge } from "@/components/student/SelfStudyResultsTable";

import { getCachedAuthUser } from "@/lib/auth";

type StatusFilter = WritingSubmissionStatus | "all";

function resolveStudentName(row: WritingSubmission): string {
  return row.studentName?.trim() || row.studentId;
}

const TYPE_OPTIONS = ["Support", "Entrance", "Final", "Mock test", "RLP", "RLP HW"];

export function WritingGradingSection() {
  const [rows, setRows] = useState<WritingSubmission[]>([]);
  const [filter, setFilter] = useState<StatusFilter>("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isKhanhThi, setIsKhanhThi] = useState(false);
  
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
  const [graderDraft, setGraderDraft] = useState("");
  const [saving, setSaving] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const user = getCachedAuthUser();
    if (user) {
      const name = (user.name || "").trim().toLowerCase();
      const email = (user.email || "").trim().toLowerCase();
      const isKT =
        name === "lê nguyễn khánh thi" ||
        name.includes("khánh thi") ||
        email === "aca@xaloenglish.vn";
      setIsKhanhThi(isKT);
    }
  }, []);

  const sync = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await refreshWritingSubmissionsForTeacher("all");
      setRows(deduplicateWritingSubmissions(data));
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

  // Identify logged in grader's name ("Grader 1", "Grader 2", "Grader 3")
  const currentGraderName = useMemo(() => {
    const user = getCachedAuthUser();
    if (!user) return null;
    const name = (user.name || "").trim().toLowerCase();
    const email = (user.email || "").trim().toLowerCase();

    if (email === "aca_1@gmail.com" || name.includes("aca 1") || name.includes("aca_1") || name.includes("grader 1")) {
      return "Grader 1";
    }
    if (email === "aca_2@gmail.com" || name.includes("aca 2") || name.includes("aca_2") || name.includes("grader 2")) {
      return "Grader 2";
    }
    if (email === "aca@xalo.internal" || name.includes("aca 3") || name.includes("grader 3")) {
      return "Grader 3";
    }
    for (const g of ACA_GRADERS) {
      if (name === g.toLowerCase() || name.includes(g.toLowerCase())) return g;
    }
    return null;
  }, []);

  // Graders only see their own assigned submissions; Học vụ Khánh Thi sees all.
  const visibleRows = useMemo(() => {
    if (isKhanhThi) return rows;
    const user = getCachedAuthUser();
    const loginName = (user?.name || "").trim().toLowerCase();
    return rows.filter((r) => {
      const assigned = (r.assignedGrader || "").trim().toLowerCase();
      if (!assigned) return true;
      if (currentGraderName && assigned === currentGraderName.toLowerCase()) return true;
      if (loginName && assigned === loginName) return true;
      return false;
    });
  }, [rows, isKhanhThi, currentGraderName]);

  // Reset page when filter or search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchQuery]);

  const filtered = useMemo(() => {
    let list = visibleRows;
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
          (r.type || "").toLowerCase().includes(q) ||
          (r.assignedGrader || "").toLowerCase().includes(q)
      );
    }
    return [...list].sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
    );
  }, [visibleRows, filter, searchQuery]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage]);

  const counts = useMemo(
    () => ({
      all: visibleRows.length,
      pending: visibleRows.filter((r) => r.status === "pending").length,
      grading: visibleRows.filter((r) => r.status === "grading").length,
      graded: visibleRows.filter((r) => r.status === "graded").length,
    }),
    [visibleRows],
  );

  const graderCounts = useMemo(() => {
    const cMap: Record<string, number> = {};
    for (const g of ACA_GRADERS) cMap[g] = 0;
    rows.forEach((r) => {
      if (r.assignedGrader && cMap[r.assignedGrader] !== undefined) {
        cMap[r.assignedGrader]++;
      }
    });
    return cMap;
  }, [rows]);

  const activeRow = rows.find((r) => r.id === activeId);

  const openGrade = (row: WritingSubmission) => {
    setActiveId(row.id);
    setScoreDraft(row.score ?? "");
    setLinkDraft(row.examLink ?? "");
    setDueDraft(row.dueDate ?? "");
    setGmailDraft(row.studentGmail ?? "");
    setTypeDraft(row.type || (row.source === "final" ? "Final" : row.source === "entrance" ? "Entrance" : "Support"));
    setTask1Draft(row.task1 ?? "");
    setTask2Draft(row.task2 ?? "");
    setNoteDraft(row.note ?? "");
    setGraderDraft(row.assignedGrader || ACA_GRADERS[0]);

    if (row.status === "pending") {
      void setStatusQuick(row, "grading");
    }
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
        assignedGrader: graderDraft || row.assignedGrader,
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

  const handleRebalance = () => {
    const updated = rebalanceWritingSubmissions(rows);
    setRows(updated);
  };

  const filters: { id: StatusFilter; label: string; count: number }[] = [
    { id: "pending", label: "Chờ chấm", count: counts.pending },
    { id: "graded", label: "Đã chấm", count: counts.graded },
    { id: "all", label: "Tất cả", count: counts.all },
  ];

  return (
    <div className="space-y-6">
      {/* ACA Assignment Balance Banner (Only visible to Học vụ Khánh Thi) */}
      {isKhanhThi && (
        <div className="rounded-2xl bg-gradient-to-r from-purple-900/5 via-indigo-900/5 to-purple-900/5 border border-purple-200/80 p-4 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
              Tự động phân bổ bài chấm Writing cho các Grader (Cân bằng khối lượng công việc)
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleRebalance}
                className="text-[10px] font-black uppercase tracking-wider text-purple-700 bg-purple-100 hover:bg-purple-200 px-2.5 py-1 rounded-xl transition-all shadow-2xs cursor-pointer"
                title="Cân bằng lại toàn bộ bài chấm đều cho 3 Grader"
              >
                ⚡ Chia đều bài cho Graders
              </button>
              <span className="text-[10px] font-bold text-purple-700 bg-purple-100/80 px-2 py-0.5 rounded-full">
                Tổng: {rows.length} bài
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
            {ACA_GRADERS.map((grader) => (
              <div key={grader} className="bg-white/80 backdrop-blur rounded-xl p-2.5 border border-purple-100 flex items-center justify-between shadow-xs">
                <span className="text-xs font-bold text-zinc-700 truncate">{grader}</span>
                <span className="ml-2 font-black text-purple-800 bg-purple-50 px-2 py-0.5 rounded-lg text-xs tabular-nums">
                  {graderCounts[grader] || 0} bài
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

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
          placeholder="Tìm tên học viên, gmail, ACA chấm..."
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
                  <th className="px-4 py-3 min-w-[140px]">Grader Chấm bài</th>
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
                    <td className="px-4 py-3">
                      {isKhanhThi ? (
                        <select
                          value={row.assignedGrader || ACA_GRADERS[0]}
                          onChange={(e) => void setStatusQuick(row, row.status, { assignedGrader: e.target.value })}
                          disabled={saving}
                          className="rounded-xl border border-purple-200 bg-purple-50/90 px-2.5 py-1 text-xs font-black text-purple-900 outline-none hover:bg-purple-100 focus:ring-2 focus:ring-purple-400 transition-all cursor-pointer shadow-2xs"
                          title="Click để phân bổ lại bài chấm cho Grader khác"
                        >
                          {ACA_GRADERS.map((grader) => (
                            <option key={grader} value={grader}>
                              {grader}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 text-purple-800 border border-purple-200/70 text-[11px] font-black"
                          title="Chỉ Học vụ Khánh Thi mới có quyền phân bổ lại bài chấm"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-600 shrink-0" />
                          {row.assignedGrader || "Chưa phân bổ"}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-500 font-medium">{row.studentGmail || "—"}</td>
                    <td className="px-4 py-3">
                      {formatExternalUrl(row.examLink) ? (
                        <a
                          href={formatExternalUrl(row.examLink)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded bg-primary/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-primary hover:bg-primary/20 transition-all"
                        >
                          Mở file bài làm ↗
                        </a>
                      ) : (
                        <span className="text-zinc-400 text-[11px] italic">Chưa có link</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-600">{row.type || (row.source === "final" ? "Final" : row.source === "entrance" ? "Entrance" : "Support")}</td>
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
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => openGrade(row)}
                          className={`rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all shadow-2xs ${
                            row.status === "graded"
                              ? "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                              : "bg-primary text-white hover:bg-primary/90"
                          }`}
                        >
                          {row.status === "graded" ? "Sửa điểm" : "Chấm bài"}
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
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted">Link bài làm (BCB)</span>
                  {formatExternalUrl(linkDraft || activeRow.examLink) ? (
                    <a
                      href={formatExternalUrl(linkDraft || activeRow.examLink)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-black uppercase text-primary hover:underline flex items-center gap-1"
                    >
                      Mở tab mới ↗
                    </a>
                  ) : null}
                </div>
                <div className="flex gap-2 mt-1">
                  <input
                    type="url"
                    value={linkDraft}
                    onChange={(e) => setLinkDraft(e.target.value)}
                    placeholder="https://docs.google.com/..."
                    className="flex-1 h-10 rounded-xl border border-primary/15 px-3 text-xs outline-none focus:border-primary/45 font-medium"
                  />
                  {formatExternalUrl(linkDraft || activeRow.examLink) ? (
                    <a
                      href={formatExternalUrl(linkDraft || activeRow.examLink)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-10 px-3 rounded-xl bg-primary text-white flex items-center justify-center text-xs font-black hover:bg-primary/90 shrink-0"
                    >
                      Vào link ↗
                    </a>
                  ) : null}
                </div>
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
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-900">Grader Chấm bài (Phân bổ)</span>
                  {!isKhanhThi && (
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Chỉ Học vụ Khánh Thi mới được phép phân bổ lại bài chấm
                    </span>
                  )}
                </div>
                <select
                  value={graderDraft}
                  onChange={(e) => setGraderDraft(e.target.value)}
                  disabled={!isKhanhThi}
                  className="mt-1 h-10 w-full rounded-xl border border-purple-300 px-3 text-sm font-bold outline-none focus:border-purple-500 bg-purple-50/40 text-purple-900 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {ACA_GRADERS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
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
