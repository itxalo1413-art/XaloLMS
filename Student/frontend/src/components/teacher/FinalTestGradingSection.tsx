"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FINAL_TEST_STATUS_LABELS,
  FINAL_TEST_TYPE_LABELS,
  FINAL_TEST_UPDATE_EVENT,
  listTeacherFinalTestRecords,
  submitTeacherFinalTestResult,
  type FinalTestRecord,
} from "@/lib/finalTestArchive";
import { formatBandScore } from "@/lib/formatBandScore";
import { getLoggedInTeacherName } from "@/lib/teacherIdentity";

type ResultFilter = "all" | "pending" | "done";

function hasScores(r: FinalTestRecord): boolean {
  return Boolean(
    r.scoreOverall?.trim() ||
      r.scoreSpeaking?.trim() ||
      r.scoreWriting?.trim() ||
      r.scoreListening?.trim() ||
      r.scoreReading?.trim() ||
      r.status === "graded" ||
      r.isDone,
  );
}

function formatSlot(r: FinalTestRecord): string {
  const [y, m, d] = r.date.split("-");
  const dateLabel = d && m && y ? `${d}/${m}/${y}` : r.date;
  return `${dateLabel}${r.time ? ` · ${r.time}` : ""}`;
}

export function FinalTestGradingSection() {
  const [rows, setRows] = useState<FinalTestRecord[]>([]);
  const [filter, setFilter] = useState<ResultFilter>("pending");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [scoreO, setScoreO] = useState("");
  const [scoreL, setScoreL] = useState("");
  const [scoreR, setScoreR] = useState("");
  const [scoreW, setScoreW] = useState("");
  const [scoreS, setScoreS] = useState("");
  const [examLink, setExamLink] = useState("");
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);

  const teacherName = getLoggedInTeacherName();

  const sync = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listTeacherFinalTestRecords(teacherName);
      setRows(data.filter((r) => r.status !== "cancelled"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được final test.");
    } finally {
      setLoading(false);
    }
  }, [teacherName]);

  useEffect(() => {
    void sync();
    const onUpdate = () => void sync();
    window.addEventListener(FINAL_TEST_UPDATE_EVENT, onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener(FINAL_TEST_UPDATE_EVENT, onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, [sync]);

  const filtered = useMemo(() => {
    if (filter === "pending") return rows.filter((r) => !hasScores(r));
    if (filter === "done") return rows.filter((r) => hasScores(r));
    return rows;
  }, [rows, filter]);

  const counts = useMemo(
    () => ({
      all: rows.length,
      pending: rows.filter((r) => !hasScores(r)).length,
      done: rows.filter((r) => hasScores(r)).length,
    }),
    [rows],
  );

  const openGrade = (row: FinalTestRecord) => {
    setActiveId(row.id);
    setScoreO(row.scoreOverall ?? "");
    setScoreL(row.scoreListening ?? "");
    setScoreR(row.scoreReading ?? "");
    setScoreW(row.scoreWriting ?? "");
    setScoreS(row.scoreSpeaking ?? "");
    setExamLink(row.examLink ?? "");
    setFeedback(row.feedback ?? "");
  };

  const saveResult = async (row: FinalTestRecord) => {
    setSaving(true);
    setError(null);
    try {
      await submitTeacherFinalTestResult(row.id, {
        scoreOverall: scoreO.trim(),
        scoreListening: scoreL.trim(),
        scoreReading: scoreR.trim(),
        scoreWriting: scoreW.trim(),
        scoreSpeaking: scoreS.trim(),
        examLink: examLink.trim(),
        feedback: feedback.trim(),
        status: "graded",
        isDone: true,
      });
      setActiveId(null);
      await sync();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không lưu được kết quả.");
    } finally {
      setSaving(false);
    }
  };

  const filters: { id: ResultFilter; label: string; count: number }[] = [
    { id: "pending", label: "Chưa nhập điểm", count: counts.pending },
    { id: "done", label: "Đã nhập điểm", count: counts.done },
    { id: "all", label: "Tất cả ca", count: counts.all },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4 text-xs font-medium text-foreground">
        Giám khảo: <strong>{teacherName || "—"}</strong>. Chỉ hiện các ca Final Test được gán cho bạn.
      </div>

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
        <div className="rounded-2xl border border-zinc-200 bg-white px-8 py-14 text-center shadow-sm">
          <p className="text-sm font-semibold text-zinc-800">
            {rows.length === 0
              ? "Bạn chưa được gán ca Final Test nào"
              : "Không có ca trong mục lọc này"}
          </p>
          <p className="mt-2 mx-auto max-w-lg text-sm leading-relaxed text-zinc-500">
            {rows.length === 0
              ? "Ca sẽ hiện sau khi Sale/ACA xếp lịch và chọn bạn làm giám khảo."
              : "Chọn bộ lọc khác hoặc nhập điểm cho ca đang chờ."}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((r) => {
            const done = hasScores(r);
            return (
              <li
                key={r.id}
                className={`rounded-2xl border bg-white p-5 shadow-sm transition-colors ${
                  activeId === r.id
                    ? "border-primary/30 ring-2 ring-primary/10"
                    : "border-zinc-200 hover:border-primary/25"
                }`}
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-zinc-900">{r.candidateName}</span>
                      <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-[10px] font-black uppercase text-sky-800">
                        {FINAL_TEST_TYPE_LABELS[r.testType]}
                      </span>
                      {done ? (
                        <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-bold uppercase text-success">
                          Đã chấm
                        </span>
                      ) : (
                        <span className="rounded-full bg-warning/10 px-2 py-0.5 text-[10px] font-bold uppercase text-warning">
                          Chưa chấm
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-xs text-zinc-500">
                      {formatSlot(r)}
                      {" · "}
                      <span className="font-medium">{FINAL_TEST_STATUS_LABELS[r.status]}</span>
                      {r.classCode || r.className ? (
                        <>
                          {" · "}
                          <span className="font-semibold text-zinc-700">
                            {r.classCode || r.className}
                          </span>
                        </>
                      ) : null}
                    </div>
                    {done ? (
                      <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-bold text-zinc-700">
                        {r.scoreOverall ? (
                          <span className="rounded-lg bg-zinc-100 px-2 py-0.5">
                            O {formatBandScore(r.scoreOverall)}
                          </span>
                        ) : null}
                        {r.scoreListening ? (
                          <span className="rounded-lg bg-zinc-100 px-2 py-0.5">
                            L {formatBandScore(r.scoreListening)}
                          </span>
                        ) : null}
                        {r.scoreReading ? (
                          <span className="rounded-lg bg-zinc-100 px-2 py-0.5">
                            R {formatBandScore(r.scoreReading)}
                          </span>
                        ) : null}
                        {r.scoreWriting ? (
                          <span className="rounded-lg bg-zinc-100 px-2 py-0.5">
                            W {formatBandScore(r.scoreWriting)}
                          </span>
                        ) : null}
                        {r.scoreSpeaking ? (
                          <span className="rounded-lg bg-zinc-100 px-2 py-0.5">
                            S {formatBandScore(r.scoreSpeaking)}
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {r.meetLink ? (
                      <a
                        href={r.meetLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-9 items-center rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-bold text-emerald-800 hover:bg-emerald-100"
                      >
                        Meet ↗
                      </a>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => (activeId === r.id ? setActiveId(null) : openGrade(r))}
                      className="inline-flex h-9 items-center rounded-xl bg-primary px-3 text-xs font-bold text-white hover:bg-primary/90"
                    >
                      {activeId === r.id ? "Đóng" : done ? "Sửa điểm" : "Nhập điểm"}
                    </button>
                  </div>
                </div>

                {activeId === r.id ? (
                  <div className="mt-4 space-y-3 border-t border-zinc-100 pt-4">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                      {(
                        [
                          ["O", scoreO, setScoreO],
                          ["L", scoreL, setScoreL],
                          ["R", scoreR, setScoreR],
                          ["W", scoreW, setScoreW],
                          ["S", scoreS, setScoreS],
                        ] as const
                      ).map(([label, value, setter]) => (
                        <label key={label} className="block space-y-1">
                          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">
                            {label}
                          </span>
                          <input
                            value={value}
                            onChange={(e) => setter(e.target.value)}
                            placeholder="6.5"
                            className="h-9 w-full rounded-xl border border-zinc-200 px-3 text-sm font-semibold outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                          />
                        </label>
                      ))}
                    </div>
                    <label className="block space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">
                        Link bài / đề
                      </span>
                      <input
                        value={examLink}
                        onChange={(e) => setExamLink(e.target.value)}
                        placeholder="https://..."
                        className="h-9 w-full rounded-xl border border-zinc-200 px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                      />
                    </label>
                    <label className="block space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">
                        Feedback
                      </span>
                      <textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        rows={3}
                        className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                      />
                    </label>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveId(null)}
                        className="h-9 rounded-xl border border-zinc-200 px-4 text-xs font-bold text-zinc-600 hover:bg-zinc-50"
                      >
                        Huỷ
                      </button>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => void saveResult(r)}
                        className="h-9 rounded-xl bg-primary px-4 text-xs font-bold text-white hover:bg-primary/90 disabled:opacity-60"
                      >
                        {saving ? "Đang lưu..." : "Lưu kết quả"}
                      </button>
                    </div>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
