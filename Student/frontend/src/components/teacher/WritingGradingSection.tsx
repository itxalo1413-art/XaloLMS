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

export function WritingGradingSection() {
  const [rows, setRows] = useState<WritingSubmission[]>([]);
  const [filter, setFilter] = useState<StatusFilter>("pending");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [scoreDraft, setScoreDraft] = useState("");
  const [linkDraft, setLinkDraft] = useState("");
  const [saving, setSaving] = useState(false);

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

  const filtered = useMemo(() => {
    const list =
      filter === "all" ? rows : rows.filter((r) => r.status === filter);
    return [...list].sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
    );
  }, [rows, filter]);

  const counts = useMemo(
    () => ({
      all: rows.length,
      pending: rows.filter((r) => r.status === "pending").length,
      grading: rows.filter((r) => r.status === "grading").length,
      graded: rows.filter((r) => r.status === "graded").length,
    }),
    [rows],
  );

  const activeRow = filtered.find((r) => r.id === activeId) ?? rows.find((r) => r.id === activeId);

  const openGrade = (row: WritingSubmission) => {
    setActiveId(row.id);
    setScoreDraft(row.score ?? "");
    setLinkDraft(row.examLink);
  };

  const setStatusQuick = async (row: WritingSubmission, status: WritingSubmissionStatus) => {
    setSaving(true);
    setError(null);
    try {
      await gradeWritingSubmission(row.id, {
        status,
        score: status === "graded" ? scoreDraft || row.score : undefined,
        examLink: linkDraft || row.examLink,
      });
      await sync();
      if (status === "graded") setActiveId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không cập nhật được.");
    } finally {
      setSaving(false);
    }
  };

  const saveGraded = async () => {
    if (!activeRow) return;
    if (!scoreDraft.trim()) {
      setError("Vui lòng nhập điểm trước khi hoàn tất chấm.");
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
        <div className="space-y-3">
          {filtered.map((row) => (
            <div
              key={row.id}
              className={`rounded-2xl border bg-white p-4 shadow-sm transition-colors ${
                activeId === row.id ? "border-primary/30 ring-2 ring-primary/10" : "border-zinc-200"
              }`}
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-foreground">
                      {resolveStudentName(row)}
                    </span>
                    <StatusBadge
                      label={writingStatusLabel(row.status)}
                      tone={writingStatusTone(row.status)}
                    />
                  </div>
                  <div className="mt-1 text-[11px] font-medium text-muted">
                    Nộp: {formatIsoDateTimeVi(row.submittedAt)}
                    {row.gradedAt ? ` · Chấm: ${formatIsoDateTimeVi(row.gradedAt)}` : ""}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <a
                      href={row.examLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-primary underline-offset-2 hover:underline"
                    >
                      Mở bài làm
                    </a>
                    {row.score ? (
                      <span className="text-sm font-black tabular-nums text-secondary">
                        {formatBandScore(row.score)}
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {row.status === "pending" ? (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void setStatusQuick(row, "grading")}
                      className="rounded-xl bg-primary/10 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/15 disabled:opacity-50"
                    >
                      Bắt đầu chấm
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => openGrade(row)}
                    className="rounded-xl border border-zinc-200 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-foreground hover:bg-zinc-50"
                  >
                    {row.status === "graded" ? "Sửa điểm" : "Chấm bài"}
                  </button>
                </div>
              </div>

              {activeId === row.id ? (
                <div className="mt-4 grid gap-3 border-t border-zinc-100 pt-4 md:grid-cols-2">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted">
                      Điểm Writing
                    </label>
                    <input
                      value={scoreDraft}
                      onChange={(e) => setScoreDraft(e.target.value)}
                      placeholder="vd. 6.5"
                      className="mt-1 h-11 w-full rounded-xl border border-zinc-200 px-3 text-sm font-bold outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted">
                      Link bài chấm (tuỳ chọn)
                    </label>
                    <input
                      value={linkDraft}
                      onChange={(e) => setLinkDraft(e.target.value)}
                      placeholder="Google Docs đã chấm…"
                      className="mt-1 h-11 w-full rounded-xl border border-zinc-200 px-3 text-xs font-medium outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
                    />
                  </div>
                  <div className="md:col-span-2 flex flex-wrap gap-2">
                    {row.status !== "grading" ? (
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => void setStatusQuick(row, "grading")}
                        className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-primary disabled:opacity-50"
                      >
                        Đánh dấu đang chấm
                      </button>
                    ) : null}
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void saveGraded()}
                      className="rounded-xl bg-primary px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white hover:bg-primary/90 disabled:opacity-50"
                    >
                      {saving ? "Đang lưu…" : "Hoàn tất chấm"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveId(null)}
                      className="rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest text-muted hover:text-foreground"
                    >
                      Đóng
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
