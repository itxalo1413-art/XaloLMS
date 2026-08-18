"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  cancelEntranceTestBooking,
  ENTRANCE_BOOKINGS_UPDATE_EVENT,
  ENTRANCE_STATUS_LABELS,
  ENTRANCE_TYPE_LABELS,
  listEntranceTestBookings,
  updateEntranceTestBooking,
  type EntranceTestBooking,
  type EntranceTestStatus,
  type EntranceTestType,
} from "@/lib/entranceTestBookings";
import { EntranceBookingModal } from "@/components/sale/EntranceBookingModal";
import { MOCK_TEST_TEACHER_OPTIONS } from "@/lib/mockTestTeacherNames";

function formatDateDisplay(isoDate: string, time: string) {
  try {
    const [y, m, d] = isoDate.split("-");
    return `${d}/${m}/${y} Lúc ${time}`;
  } catch {
    return `${isoDate} ${time}`;
  }
}

function statusBadge(status: EntranceTestStatus) {
  return {
    scheduled: "bg-sky-500/15 text-sky-300 border-sky-500/30",
    in_progress: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    graded: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    cancelled: "bg-slate-600/40 text-slate-400 border-slate-600/40",
  }[status];
}

export default function SaleDatLichTestPage() {
  const [bookings, setBookings] = useState<EntranceTestBooking[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [typeFilter, setTypeFilter] = useState<"all" | EntranceTestType>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | EntranceTestStatus>("all");
  const [graderFilter, setGraderFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<EntranceTestBooking | null>(null);
  const [gradingBooking, setGradingBooking] = useState<EntranceTestBooking | null>(null);

  // Quick grading state
  const [scoreSpeakingDraft, setScoreSpeakingDraft] = useState("");
  const [scoreWritingDraft, setScoreWritingDraft] = useState("");
  const [feedbackDraft, setFeedbackDraft] = useState("");
  const [savingGrade, setSavingGrade] = useState(false);

  const loadData = useCallback(() => {
    setLoading(true);
    void listEntranceTestBookings().then(setBookings).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadData();
    window.addEventListener(ENTRANCE_BOOKINGS_UPDATE_EVENT, loadData);
    window.addEventListener("storage", loadData);
    return () => {
      window.removeEventListener(ENTRANCE_BOOKINGS_UPDATE_EVENT, loadData);
      window.removeEventListener("storage", loadData);
    };
  }, [loadData]);

  // Metrics
  const metrics = useMemo(() => {
    const total = bookings.length;
    const speaking = bookings.filter((b) => b.type === "speaking" || b.type === "both").length;
    const writing = bookings.filter((b) => b.type === "writing" || b.type === "both").length;
    const graded = bookings.filter((b) => b.status === "graded" || b.scoreSpeaking || b.scoreWriting).length;
    const pending = bookings.filter((b) => b.status === "scheduled" || b.status === "in_progress").length;

    return { total, speaking, writing, graded, pending };
  }, [bookings]);

  // Filtered List
  const filtered = useMemo(() => {
    let list = bookings;

    if (typeFilter !== "all") {
      list = list.filter((b) => b.type === typeFilter || (typeFilter !== "both" && b.type === "both"));
    }

    if (statusFilter !== "all") {
      list = list.filter((b) => b.status === statusFilter);
    }

    if (graderFilter !== "all") {
      list = list.filter((b) => (b.graderName ?? "").trim().toLowerCase() === graderFilter.trim().toLowerCase());
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (b) =>
          b.candidateName.toLowerCase().includes(q) ||
          b.candidatePhone.includes(q) ||
          (b.candidateEmail && b.candidateEmail.toLowerCase().includes(q)) ||
          b.graderName.toLowerCase().includes(q)
      );
    }

    return list;
  }, [bookings, typeFilter, statusFilter, graderFilter, search]);

  const handleCancel = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc muốn hủy ca test của "${name}"?`)) return;
    try {
      await cancelEntranceTestBooking(id);
      loadData();
    } catch (err: any) {
      alert("Hủy ca thất bại: " + err.message);
    }
  };

  const openGradingModal = (b: EntranceTestBooking) => {
    setGradingBooking(b);
    setScoreSpeakingDraft(b.scoreSpeaking || "");
    setScoreWritingDraft(b.scoreWriting || "");
    setFeedbackDraft(b.feedback || "");
  };

  const handleSaveGrade = async () => {
    if (!gradingBooking) return;
    setSavingGrade(true);
    try {
      await updateEntranceTestBooking(gradingBooking.id, {
        scoreSpeaking: scoreSpeakingDraft.trim() || undefined,
        scoreWriting: scoreWritingDraft.trim() || undefined,
        feedback: feedbackDraft.trim() || undefined,
        status: (scoreSpeakingDraft || scoreWritingDraft) ? "graded" : gradingBooking.status,
      });
      setGradingBooking(null);
      loadData();
    } catch (err: any) {
      alert("Lưu điểm thất bại: " + err.message);
    } finally {
      setSavingGrade(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white">Quản Lý Đặt Lịch Test Entrance (Speaking & Writing)</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Xếp lịch chấm bài đầu vào cho khách chẩn đoán và theo dõi kết quả điểm thi từ Grader
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2.5 text-xs font-black text-slate-950 transition-all shadow-lg hover:shadow-amber-500/20 shrink-0"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Đặt Lịch Test Mới
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-1">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tổng ca test</div>
          <div className="text-2xl font-black text-white">{metrics.total}</div>
          <div className="text-[10px] text-slate-500">{metrics.pending} ca đang chờ/sắp diễn ra</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-1">
          <div className="text-[11px] font-bold text-purple-400 uppercase tracking-wider">Speaking Entrance</div>
          <div className="text-2xl font-black text-purple-300">{metrics.speaking}</div>
          <div className="text-[10px] text-slate-500">Ca test nói 1-1 với Grader</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-1">
          <div className="text-[11px] font-bold text-sky-400 uppercase tracking-wider">Writing Entrance</div>
          <div className="text-2xl font-black text-sky-300">{metrics.writing}</div>
          <div className="text-[10px] text-slate-500">Ca chấm bài viết tự luận</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-1">
          <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Đã có điểm</div>
          <div className="text-2xl font-black text-emerald-400">{metrics.graded}</div>
          <div className="text-[10px] text-slate-500">Sẵn sàng tư vấn khóa học</div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        {/* Type Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold flex-wrap">
          {[
            { key: "all", label: "Tất cả bài test" },
            { key: "speaking", label: "Speaking" },
            { key: "writing", label: "Writing" },
            { key: "both", label: "Cả hai (S+W)" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setTypeFilter(tab.key as any)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                typeFilter === tab.key
                  ? "bg-amber-500 text-slate-950 font-black shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Status & Grader filters + Search */}
        <div className="flex flex-wrap items-center gap-2 flex-1 lg:justify-end">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="h-9 rounded-xl border border-slate-800 bg-slate-950 px-3 text-xs font-bold text-slate-300 outline-none focus:border-amber-500/60 cursor-pointer"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="scheduled">Đã xếp lịch</option>
            <option value="in_progress">Đang chấm / Đang thi</option>
            <option value="graded">Đã có điểm</option>
            <option value="cancelled">Đã hủy</option>
          </select>

          <select
            value={graderFilter}
            onChange={(e) => setGraderFilter(e.target.value)}
            className="h-9 rounded-xl border border-slate-800 bg-slate-950 px-3 text-xs font-bold text-slate-300 outline-none focus:border-amber-500/60 cursor-pointer"
          >
            <option value="all">Tất cả Grader</option>
            {MOCK_TEST_TEACHER_OPTIONS.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>

          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm tên, SĐT, Grader..."
              className="h-9 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 pl-8 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-amber-500/60 transition-all"
            />
            <svg
              className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs font-bold">Đang tải danh sách ca test...</div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="text-3xl">🗓️</div>
            <div className="text-sm font-bold text-white">Chưa tìm thấy ca Entrance Test nào</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Nhấn nút &quot;Đặt Lịch Test Mới&quot; ở trên để xếp lịch kiểm tra Speaking hoặc Writing cho học viên.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/80 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <th className="px-4 py-3.5">Ứng viên / Khách</th>
                  <th className="px-4 py-3.5">Loại Test</th>
                  <th className="px-4 py-3.5">Grader chấm</th>
                  <th className="px-4 py-3.5">Thời gian thi</th>
                  <th className="px-4 py-3.5">Link đề / Bài nộp</th>
                  <th className="px-4 py-3.5 text-center">Điểm số</th>
                  <th className="px-4 py-3.5">Trạng thái</th>
                  <th className="px-4 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-900/50 transition-colors">
                    {/* Candidate */}
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-white text-sm leading-tight">{b.candidateName}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">{b.candidatePhone}</div>
                      {b.leadId && (
                        <span className="inline-flex mt-1 rounded bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.2 text-[9px] font-bold text-amber-400">
                          Lead BCB
                        </span>
                      )}
                    </td>

                    {/* Type & Format */}
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-200">{ENTRANCE_TYPE_LABELS[b.type]}</div>
                      <span
                        className={`inline-flex mt-1 rounded px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                          b.format === "online"
                            ? "bg-purple-500/15 text-purple-300 border border-purple-500/30"
                            : "bg-sky-500/15 text-sky-300 border border-sky-500/30"
                        }`}
                      >
                        {b.format === "online" ? "🌐 Online" : "🏫 Offline"}
                      </span>
                    </td>

                    {/* Grader */}
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-amber-300">{b.graderName}</div>
                      {b.meetLink && (
                        <a
                          href={b.meetLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-emerald-400 hover:underline"
                        >
                          Google Meet ↗
                        </a>
                      )}
                    </td>

                    {/* Date Time */}
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-white tabular-nums">{formatDateDisplay(b.date, b.time)}</div>
                      {b.note && <div className="text-[10px] text-slate-400 italic mt-0.5 truncate max-w-[140px]" title={b.note}>{b.note}</div>}
                    </td>

                    {/* Links */}
                    <td className="px-4 py-3.5 space-y-1">
                      {b.examLink ? (
                        <a
                          href={b.examLink}
                          target="_blank"
                          rel="noreferrer"
                          className="block text-[11px] font-bold text-indigo-400 hover:underline truncate max-w-[130px]"
                          title={b.examLink}
                        >
                          📄 Link đề thi
                        </a>
                      ) : (
                        <span className="text-[11px] text-slate-600">—</span>
                      )}

                      {b.submissionLink && (
                        <a
                          href={b.submissionLink}
                          target="_blank"
                          rel="noreferrer"
                          className="block text-[11px] font-bold text-sky-400 hover:underline truncate max-w-[130px]"
                          title={b.submissionLink}
                        >
                          📝 Bài nộp Writing
                        </a>
                      )}
                    </td>

                    {/* Scores */}
                    <td className="px-4 py-3.5 text-center">
                      {(b.scoreSpeaking || b.scoreWriting) ? (
                        <div className="flex flex-col items-center gap-1">
                          {b.scoreSpeaking && (
                            <div className="text-xs font-black text-white bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded-lg">
                              Speaking: <span className="text-emerald-400">{b.scoreSpeaking}</span>
                            </div>
                          )}
                          {b.scoreWriting && (
                            <div className="text-xs font-black text-white bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded-lg">
                              Writing: <span className="text-emerald-400">{b.scoreWriting}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openGradingModal(b)}
                          className="text-[10px] font-bold text-amber-400 hover:text-amber-300 hover:underline"
                        >
                          + Nhập điểm
                        </button>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wider border ${statusBadge(b.status)}`}>
                        {ENTRANCE_STATUS_LABELS[b.status]}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openGradingModal(b)}
                          className="rounded-lg p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-900 transition-colors"
                          title="Cập nhật điểm & nhận xét"
                        >
                          ✏️
                        </button>
                        {b.status !== "cancelled" && (
                          <button
                            type="button"
                            onClick={() => handleCancel(b.id, b.candidateName)}
                            className="rounded-lg p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-900 transition-colors"
                            title="Hủy ca thi"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Grading Modal */}
      {gradingBooking && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Đóng"
            onClick={() => setGradingBooking(null)}
            className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm"
          />
          <div className="relative w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-black text-white">Nhập Điểm Entrance</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Ứng viên: <span className="text-amber-400 font-bold">{gradingBooking.candidateName}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setGradingBooking(null)}
                className="rounded-lg p-1 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {(gradingBooking.type === "speaking" || gradingBooking.type === "both") && (
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Điểm Speaking (Band)</label>
                  <input
                    type="text"
                    value={scoreSpeakingDraft}
                    onChange={(e) => setScoreSpeakingDraft(e.target.value)}
                    placeholder="VD: 6.5"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-sm font-bold text-white outline-none focus:border-amber-500/60"
                  />
                </div>
              )}

              {(gradingBooking.type === "writing" || gradingBooking.type === "both") && (
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Điểm Writing (Band)</label>
                  <input
                    type="text"
                    value={scoreWritingDraft}
                    onChange={(e) => setScoreWritingDraft(e.target.value)}
                    placeholder="VD: 6.0"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-sm font-bold text-white outline-none focus:border-amber-500/60"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Nhận xét / Feedback</label>
                <textarea
                  rows={3}
                  value={feedbackDraft}
                  onChange={(e) => setFeedbackDraft(e.target.value)}
                  placeholder="Ghi chú nhận xét từ Grader..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs text-white outline-none focus:border-amber-500/60 resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setGradingBooking(null)}
                className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-bold text-slate-400 hover:bg-slate-800"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={savingGrade}
                onClick={handleSaveGrade}
                className="rounded-xl bg-amber-500 hover:bg-amber-400 px-5 py-2 text-xs font-black text-slate-950 transition-all disabled:opacity-50"
              >
                {savingGrade ? "Đang lưu..." : "Lưu Điểm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {isCreateOpen && (
        <EntranceBookingModal
          onClose={() => setIsCreateOpen(false)}
          onSuccess={() => {
            loadData();
          }}
        />
      )}
    </div>
  );
}
