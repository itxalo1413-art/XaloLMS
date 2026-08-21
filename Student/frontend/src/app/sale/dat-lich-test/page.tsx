"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import {
  getMockTestTeacherOptions,
  MOCK_TEST_TEACHER_OPTIONS_EVENT,
  syncMockTestTeacherOptions,
} from "@/lib/mockTestTeacherNames";

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
    scheduled: "bg-sky-50 text-sky-700 border-sky-200",
    in_progress: "bg-amber-50 text-amber-700 border-amber-200",
    graded: "bg-emerald-50 text-emerald-700 border-emerald-200",
    cancelled: "bg-zinc-100 text-zinc-600 border-zinc-200",
  }[status];
}

export default function SaleDatLichTestPage() {
  const [bookings, setBookings] = useState<EntranceTestBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [teacherOptions, setTeacherOptions] = useState<string[]>(() => getMockTestTeacherOptions());

  // Filters
  const [typeFilter, setTypeFilter] = useState<"all" | EntranceTestType>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | EntranceTestStatus>("all");
  const [graderFilter, setGraderFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
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

  useEffect(() => {
    void syncMockTestTeacherOptions().then(setTeacherOptions);
    const onTeachers = () => setTeacherOptions(getMockTestTeacherOptions());
    window.addEventListener(MOCK_TEST_TEACHER_OPTIONS_EVENT, onTeachers);
    return () => window.removeEventListener(MOCK_TEST_TEACHER_OPTIONS_EVENT, onTeachers);
  }, []);

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
          <h1 className="text-xl font-black text-zinc-900">Quản Lý Đặt Lịch Test Entrance (Speaking & Writing)</h1>
          <p className="text-xs text-zinc-500 mt-0.5 font-medium">
            Xếp lịch chấm bài đầu vào cho khách chẩn đoán và theo dõi kết quả điểm thi từ Grader
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-primary hover:bg-[#6a5acd] px-4 py-2.5 text-xs font-black text-white transition-all shadow-md hover:shadow-primary/20 shrink-0"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Đặt Lịch Test Mới
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-xs space-y-1">
          <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Tổng ca test</div>
          <div className="text-2xl font-black text-zinc-900">{metrics.total}</div>
          <div className="text-[10px] text-zinc-400 font-medium">{metrics.pending} ca đang chờ/sắp diễn ra</div>
        </div>

        <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-xs space-y-1">
          <div className="text-[11px] font-bold text-primary uppercase tracking-wider">Speaking Entrance</div>
          <div className="text-2xl font-black text-primary">{metrics.speaking}</div>
          <div className="text-[10px] text-zinc-400 font-medium">Ca test nói 1-1 với Grader</div>
        </div>

        <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-xs space-y-1">
          <div className="text-[11px] font-bold text-sky-600 uppercase tracking-wider">Writing Entrance</div>
          <div className="text-2xl font-black text-sky-600">{metrics.writing}</div>
          <div className="text-[10px] text-zinc-400 font-medium">Ca chấm bài viết tự luận</div>
        </div>

        <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-xs space-y-1">
          <div className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Đã có điểm</div>
          <div className="text-2xl font-black text-emerald-600">{metrics.graded}</div>
          <div className="text-[10px] text-zinc-400 font-medium">Sẵn sàng tư vấn khóa học</div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        {/* Type Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-100 border border-zinc-200/80 text-xs font-bold flex-wrap">
          {[
            { key: "all", label: "Tất cả bài test" },
            { key: "speaking", label: "Speaking" },
            { key: "writing", label: "Writing" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setTypeFilter(tab.key as any)}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                typeFilter === tab.key
                  ? "bg-primary text-white font-black shadow-sm"
                  : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60"
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
            className="h-9 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-bold text-zinc-700 outline-none focus:border-primary cursor-pointer shadow-xs"
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
            className="h-9 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-bold text-zinc-700 outline-none focus:border-primary cursor-pointer shadow-xs"
          >
            <option value="all">Tất cả Grader</option>
            {teacherOptions.map((name) => (
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
              className="h-9 w-full rounded-xl border border-zinc-200 bg-white px-3 pl-8 text-xs text-zinc-900 placeholder-zinc-400 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all shadow-xs"
            />
            <svg
              className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 pointer-events-none"
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
      <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-soft">
        {loading ? (
          <div className="p-12 text-center text-zinc-400 text-xs font-bold">Đang tải danh sách ca test...</div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="text-sm font-bold text-zinc-800">Chưa tìm thấy ca Entrance Test nào</div>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              Nhấn nút &quot;Đặt Lịch Test Mới&quot; ở trên để xếp lịch kiểm tra Speaking hoặc Writing cho học viên.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/80 text-[10px] font-black uppercase tracking-wider text-zinc-500">
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
              <tbody className="divide-y divide-zinc-100 font-medium">
                {filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-zinc-50/60 transition-colors">
                    {/* Candidate */}
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-zinc-900 text-sm leading-tight">{b.candidateName}</div>
                      <div className="text-[11px] text-zinc-500 font-mono mt-0.5">{b.candidatePhone}</div>
                      {b.leadId && (
                        <span className="inline-flex mt-1 rounded bg-primary/10 border border-primary/20 px-1.5 py-0.2 text-[9px] font-bold text-primary">
                          Lead BCB
                        </span>
                      )}
                    </td>

                    {/* Type & Format */}
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-zinc-800">{ENTRANCE_TYPE_LABELS[b.type]}</div>
                      <span
                        className={`inline-flex mt-1 rounded px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                          b.format === "online"
                            ? "bg-[#fae8ff] text-[#86198f] border border-[#f5d0fe]"
                            : "bg-[#dbeafe] text-[#1e40af] border border-[#bfdbfe]"
                        }`}
                      >
                        {b.format === "online" ? "Online" : "Offline"}
                      </span>
                    </td>

                    {/* Grader */}
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-zinc-800">{b.graderName}</div>
                      {b.meetLink && (
                        <a
                          href={b.meetLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-emerald-600 hover:underline"
                        >
                          Google Meet ↗
                        </a>
                      )}
                    </td>

                    {/* Date Time */}
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-zinc-900 tabular-nums">{formatDateDisplay(b.date, b.time)}</div>
                      {b.note && <div className="text-[10px] text-zinc-400 italic mt-0.5 truncate max-w-[140px]" title={b.note}>{b.note}</div>}
                    </td>

                    {/* Links */}
                    <td className="px-4 py-3.5 space-y-1">
                      {b.examLink ? (
                        <a
                          href={b.examLink}
                          target="_blank"
                          rel="noreferrer"
                          className="block text-[11px] font-bold text-primary hover:underline truncate max-w-[130px]"
                          title={b.examLink}
                        >
                          Link đề thi
                        </a>
                      ) : (
                        <span className="text-[11px] text-zinc-300">—</span>
                      )}

                      {b.submissionLink && (
                        <a
                          href={b.submissionLink}
                          target="_blank"
                          rel="noreferrer"
                          className="block text-[11px] font-bold text-sky-600 hover:underline truncate max-w-[130px]"
                          title={b.submissionLink}
                        >
                        Bài nộp Writing
                        </a>
                      )}
                    </td>

                    {/* Scores */}
                    <td className="px-4 py-3.5 text-center">
                      {(b.scoreSpeaking || b.scoreWriting) ? (
                        <div className="flex flex-col items-center gap-1">
                          {b.scoreSpeaking && (
                            <div className="text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">
                              Speaking: <span>{b.scoreSpeaking}</span>
                            </div>
                          )}
                          {b.scoreWriting && (
                            <div className="text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">
                              Writing: <span>{b.scoreWriting}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openGradingModal(b)}
                          className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
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
                          className="rounded-lg p-1.5 text-zinc-400 hover:text-primary hover:bg-zinc-100 transition-colors cursor-pointer"
                          title="Cập nhật điểm & nhận xét"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        {b.status !== "cancelled" && (
                          <button
                            type="button"
                            onClick={() => handleCancel(b.id, b.candidateName)}
                            className="rounded-lg p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Hủy ca thi"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
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
            className="absolute inset-0 bg-black/40 backdrop-blur-xs"
          />
          <div className="relative w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <h3 className="text-sm font-black text-zinc-900">Nhập Điểm Entrance</h3>
                <p className="text-xs text-zinc-500 mt-0.5 font-medium">
                  Ứng viên: <span className="text-primary font-bold">{gradingBooking.candidateName}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setGradingBooking(null)}
                className="rounded-lg p-1 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {(gradingBooking.type === "speaking" || gradingBooking.type === "both") && (
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Điểm Speaking (Band)</label>
                  <input
                    type="text"
                    value={scoreSpeakingDraft}
                    onChange={(e) => setScoreSpeakingDraft(e.target.value)}
                    placeholder="VD: 6.5"
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2 text-sm font-bold text-zinc-900 outline-none focus:border-primary focus:bg-white"
                  />
                </div>
              )}

              {(gradingBooking.type === "writing" || gradingBooking.type === "both") && (
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Điểm Writing (Band)</label>
                  <input
                    type="text"
                    value={scoreWritingDraft}
                    onChange={(e) => setScoreWritingDraft(e.target.value)}
                    placeholder="VD: 6.0"
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2 text-sm font-bold text-zinc-900 outline-none focus:border-primary focus:bg-white"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Nhận xét / Feedback</label>
                <textarea
                  rows={3}
                  value={feedbackDraft}
                  onChange={(e) => setFeedbackDraft(e.target.value)}
                  placeholder="Ghi chú nhận xét từ Grader..."
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2 text-xs text-zinc-900 outline-none focus:border-primary focus:bg-white resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setGradingBooking(null)}
                className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-bold text-zinc-600 hover:bg-zinc-100 transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={savingGrade}
                onClick={handleSaveGrade}
                className="rounded-xl bg-primary hover:bg-[#6a5acd] px-5 py-2 text-xs font-bold text-white transition-all disabled:opacity-50 shadow-sm"
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
