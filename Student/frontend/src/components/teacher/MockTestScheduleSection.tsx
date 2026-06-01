"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  loadMockTestRequests,
  refreshMockTestRequestsForTeacher,
  submitMockTestSpeakingResult,
  MOCK_TEST_UPDATE_EVENT,
  type MockTestRequest,
} from "@/lib/mockTestRequests";
import {
  formatMockTestDateTime,
  isSpeakingMockTest,
  mockTestStatusLabel,
} from "@/lib/selfStudyFormat";
import { formatBandScore } from "@/lib/formatBandScore";
import { LOGGED_IN_TEACHER_NAME } from "./mockTestTeachers";

type ResultFilter = "all" | "pending" | "done";

function slotTs(r: MockTestRequest): number {
  const d = new Date(r.year, r.month, r.day);
  const raw = r.examTime ?? "09:00";
  const parts = raw.split(":");
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  d.setHours(Number.isFinite(h) ? h : 9, Number.isFinite(m) ? m : 0, 0, 0);
  return d.getTime();
}

export function MockTestScheduleSection() {
  const [rows, setRows] = useState<MockTestRequest[]>([]);
  const [filter, setFilter] = useState<ResultFilter>("pending");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [scoreDraft, setScoreDraft] = useState("");
  const [linkDraft, setLinkDraft] = useState("");
  const [saving, setSaving] = useState(false);

  const teacherName = LOGGED_IN_TEACHER_NAME;

  const sync = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await refreshMockTestRequestsForTeacher(teacherName);
      const all = loadMockTestRequests();
      const assigned = all
        .filter(
          (r) =>
            r.status === "approved" &&
            isSpeakingMockTest(r.skill) &&
            (r.examTeacher ?? "").trim() === teacherName.trim(),
        )
        .sort((a, b) => slotTs(a) - slotTs(b));
      setRows(assigned);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được lịch mock test.");
    } finally {
      setLoading(false);
    }
  }, [teacherName]);

  useEffect(() => {
    void sync();
    const onUpdate = () => void sync();
    window.addEventListener(MOCK_TEST_UPDATE_EVENT, onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener(MOCK_TEST_UPDATE_EVENT, onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, [sync]);

  const filtered = useMemo(() => {
    if (filter === "pending") return rows.filter((r) => !r.score?.trim());
    if (filter === "done") return rows.filter((r) => Boolean(r.score?.trim()));
    return rows;
  }, [rows, filter]);

  const counts = useMemo(
    () => ({
      all: rows.length,
      pending: rows.filter((r) => !r.score?.trim()).length,
      done: rows.filter((r) => Boolean(r.score?.trim())).length,
    }),
    [rows],
  );

  const startOfTodayTs = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, []);

  const openGrade = (row: MockTestRequest) => {
    setActiveId(row.id);
    setScoreDraft(row.score ?? "");
    setLinkDraft(row.examLink ?? "");
  };

  const saveResult = async (row: MockTestRequest) => {
    setSaving(true);
    setError(null);
    try {
      await submitMockTestSpeakingResult(row.id, teacherName, {
        score: scoreDraft,
        examLink: linkDraft,
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
      <div className="rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3 text-xs font-medium text-foreground">
        Giáo viên demo: <strong>{teacherName}</strong>. ACA cần chọn đúng tên GV khi duyệt để ca
        hiển thị tại đây.
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
              ? "Bạn chưa có ca Mock Test Speaking nào được xếp"
              : "Không có ca trong mục lọc này"}
          </p>
          <p className="mt-2 mx-auto max-w-lg text-sm leading-relaxed text-zinc-500">
            {rows.length === 0
              ? "Các ca sẽ hiển thị sau khi học viên đăng ký Speaking và ACA duyệt, giao cho bạn."
              : "Chọn bộ lọc khác hoặc nhập kết quả cho ca đang chờ."}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((r) => {
            const isPast = slotTs(r) < startOfTodayTs;
            const hasResult = Boolean(r.score?.trim());
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
                      <span className="text-sm font-bold text-zinc-900">{r.studentName}</span>
                      <span className="rounded-full bg-[#efeaff] px-2.5 py-0.5 text-[10px] font-black uppercase text-primary">
                        Speaking
                      </span>
                      {hasResult ? (
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
                      {formatMockTestDateTime(r)}
                      {" · "}
                      <span className="font-medium">{mockTestStatusLabel(r.status)}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="inline-flex rounded-full bg-zinc-100 px-2.5 py-0.5 text-[11px] font-semibold text-zinc-700">
                        {r.examTime ?? "—"}
                      </span>
                      {isPast ? (
                        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold uppercase text-zinc-600">
                          Đã qua
                        </span>
                      ) : (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-800">
                          Sắp tới
                        </span>
                      )}
                      {hasResult ? (
                        <span className="text-sm font-black tabular-nums text-secondary">
                          {formatBandScore(r.score!)}
                        </span>
                      ) : null}
                    </div>
                    {r.examLink ? (
                      <a
                        href={r.examLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-block text-xs font-bold text-primary underline-offset-2 hover:underline"
                      >
                        {hasResult ? "Mở bài chấm" : "Link đăng ký / bài làm"}
                      </a>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => openGrade(r)}
                    className="shrink-0 rounded-xl border border-zinc-200 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-foreground hover:bg-zinc-50"
                  >
                    {hasResult ? "Sửa kết quả" : "Nhập kết quả"}
                  </button>
                </div>

                {activeId === r.id ? (
                  <div className="mt-4 grid gap-3 border-t border-zinc-100 pt-4 md:grid-cols-2">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted">
                        Điểm Speaking
                      </label>
                      <input
                        value={scoreDraft}
                        onChange={(e) => setScoreDraft(e.target.value)}
                        placeholder="vd. 7.0"
                        className="mt-1 h-11 w-full rounded-xl border border-zinc-200 px-3 text-sm font-bold outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted">
                        Link bài chấm (Google Docs)
                      </label>
                      <input
                        value={linkDraft}
                        onChange={(e) => setLinkDraft(e.target.value)}
                        placeholder="https://docs.google.com/..."
                        className="mt-1 h-11 w-full rounded-xl border border-zinc-200 px-3 text-xs font-medium outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2 md:col-span-2">
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => void saveResult(r)}
                        className="rounded-xl bg-primary px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white hover:bg-primary/90 disabled:opacity-50"
                      >
                        {saving ? "Đang lưu…" : "Lưu kết quả"}
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
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
