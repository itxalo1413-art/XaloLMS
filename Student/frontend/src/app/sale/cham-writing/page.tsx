"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  cancelEntranceTestBooking,
  ENTRANCE_BOOKINGS_UPDATE_EVENT,
  ENTRANCE_STATUS_LABELS,
  listEntranceTestBookings,
  updateEntranceTestBooking,
  type EntranceTestBooking,
  type EntranceTestStatus,
} from "@/lib/entranceTestBookings";
import { EntranceBookingModal } from "@/components/sale/EntranceBookingModal";
import {
  getGraderOptions,
  GRADER_OPTIONS_EVENT,
  syncGraderOptions,
} from "@/lib/mockTestTeacherNames";
import { confirmDialog } from "@/components/shared/ConfirmDialog";

function formatDateShort(isoDate: string) {
  try {
    const [y, m, d] = isoDate.split("-");
    return `${d}/${m}/${y}`;
  } catch {
    return isoDate;
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

export default function SaleWritingEntrancePage() {
  const [bookings, setBookings] = useState<EntranceTestBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [graderOptions, setGraderOptions] = useState<string[]>(() => getGraderOptions());
  const [statusFilter, setStatusFilter] = useState<"all" | EntranceTestStatus>("all");
  const [graderFilter, setGraderFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const [gradingBooking, setGradingBooking] = useState<EntranceTestBooking | null>(null);
  const [feedbackDraft, setFeedbackDraft] = useState("");
  const [savingGrade, setSavingGrade] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await listEntranceTestBookings();
      setBookings(rows);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
    const onUpdate = () => void loadData();
    window.addEventListener(ENTRANCE_BOOKINGS_UPDATE_EVENT, onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener(ENTRANCE_BOOKINGS_UPDATE_EVENT, onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, [loadData]);

  useEffect(() => {
    void syncGraderOptions().then(setGraderOptions);
    const onGraders = () => setGraderOptions(getGraderOptions());
    window.addEventListener(GRADER_OPTIONS_EVENT, onGraders);
    return () => window.removeEventListener(GRADER_OPTIONS_EVENT, onGraders);
  }, []);

  const writingList = useMemo(
    () => bookings.filter((b) => b.type === "writing" || b.type === "both"),
    [bookings],
  );

  const filtered = useMemo(() => {
    let list = writingList;
    if (statusFilter !== "all") list = list.filter((b) => b.status === statusFilter);
    if (graderFilter !== "all") {
      list = list.filter(
        (b) => (b.graderName ?? "").trim().toLowerCase() === graderFilter.trim().toLowerCase(),
      );
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (b) =>
          b.candidateName.toLowerCase().includes(q) ||
          b.candidatePhone.includes(q) ||
          (b.candidateEmail && b.candidateEmail.toLowerCase().includes(q)) ||
          b.graderName.toLowerCase().includes(q),
      );
    }
    return list;
  }, [writingList, statusFilter, graderFilter, search]);

  const handleCancel = async (id: string, name: string) => {
    const ok = await confirmDialog({
      title: "Hủy bài Writing",
      message: `Bạn có chắc chắn muốn hủy bài Writing của học viên "${name}" không?`,
      confirmText: "Đồng ý hủy",
      cancelText: "Giữ lại",
      variant: "danger",
    });
    if (!ok) return;
    try {
      await cancelEntranceTestBooking(id);
      void loadData();
    } catch (err: any) {
      alert("Hủy thất bại: " + (err?.message || "lỗi"));
    }
  };

  const openNoteModal = (b: EntranceTestBooking) => {
    setGradingBooking(b);
    setFeedbackDraft(b.feedback || "");
  };

  const handleSaveNote = async () => {
    if (!gradingBooking) return;
    setSavingGrade(true);
    try {
      await updateEntranceTestBooking(gradingBooking.id, {
        feedback: feedbackDraft.trim() || undefined,
      });
      setGradingBooking(null);
      void loadData();
    } catch (err: any) {
      alert("Lưu ghi chú thất bại: " + (err?.message || "lỗi"));
    } finally {
      setSavingGrade(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      <div className="border-b border-zinc-200/80 pb-4">
        <h1 className="text-xl font-black text-zinc-900">Nộp bài Writing Entrance</h1>
        <p className="text-xs text-zinc-500 mt-0.5 font-medium">
          Dán link Google Docs bài làm của ứng viên — hệ thống tự phân chia Grader (giống học viên nộp Writing)
        </p>
      </div>

      <div className="rounded-2xl border border-primary/20 bg-white p-5 shadow-soft space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-primary">Entrance Writing</div>
            <h2 className="text-base font-black text-zinc-900 mt-0.5">Nộp bài Writing cho ứng viên</h2>
            <p className="text-xs text-zinc-500 font-medium mt-0.5">
              Giống học viên: dán link Google Docs → gửi. Hệ thống tự phân Grader 1 / 2 / 3.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-black uppercase tracking-wide transition-all shadow-md active:scale-[0.98] cursor-pointer"
          >
            + Nộp bài Writing
          </button>
        </div>

        <div className="flex flex-col gap-2 rounded-2xl border border-primary/20 bg-primary/5 p-4 shadow-2xs">
          <label className="text-[10px] font-black text-primary uppercase tracking-widest">
            Quy trình (giống trang Hỗ trợ tự học)
          </label>
          <ol className="text-xs text-zinc-600 font-medium space-y-1 list-decimal list-inside">
            <li>Nhập tên + SĐT ứng viên</li>
            <li>Dán link bài làm Google Docs</li>
            <li>Bấm Gửi bài — hệ thống tự chia Grader</li>
          </ol>
        </div>
      </div>

      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-base font-black text-zinc-900">Danh sách bài Writing Entrance đã nộp</h2>
            <p className="text-xs text-zinc-500 font-medium mt-0.5">
              {writingList.length} bài · theo dõi trạng thái & điểm từ Grader
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="h-9 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-bold text-zinc-700 outline-none focus:border-primary cursor-pointer shadow-xs"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="scheduled">Chờ chấm</option>
              <option value="in_progress">Đang chấm</option>
              <option value="graded">Đã có điểm</option>
              <option value="cancelled">Đã hủy</option>
            </select>
            <select
              value={graderFilter}
              onChange={(e) => setGraderFilter(e.target.value)}
              className="h-9 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-bold text-zinc-700 outline-none focus:border-primary cursor-pointer shadow-xs"
            >
              <option value="all">Tất cả Grader</option>
              {graderOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm tên, SĐT..."
              className="h-9 min-w-[200px] rounded-xl border border-zinc-200 bg-white px-3 text-xs text-zinc-900 placeholder-zinc-400 outline-none focus:border-primary shadow-xs font-medium"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-soft">
          {loading ? (
            <div className="p-12 text-center text-zinc-400 text-xs font-bold">Đang tải danh sách...</div>
          ) : filtered.length === 0 ? (
            <div className="p-16 text-center space-y-3">
              <div className="text-sm font-bold text-zinc-800">Chưa có bài Writing nào</div>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                Bấm &quot;+ Nộp bài Writing&quot; để gửi link bài làm của ứng viên.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50/80 text-[10px] font-black uppercase tracking-wider text-zinc-500">
                    <th className="px-4 py-3.5">Ứng viên / Khách</th>
                    <th className="px-4 py-3.5">Grader (tự phân)</th>
                    <th className="px-4 py-3.5">Ngày nộp</th>
                    <th className="px-4 py-3.5">Link bài làm</th>
                    <th className="px-4 py-3.5 text-center">Điểm Writing</th>
                    <th className="px-4 py-3.5">Trạng thái</th>
                    <th className="px-4 py-3.5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 font-medium">
                  {filtered.map((b) => (
                    <tr key={b.id} className="hover:bg-zinc-50/60 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-zinc-900 text-sm leading-tight">{b.candidateName}</div>
                        <div className="text-[11px] text-zinc-500 font-mono mt-0.5">{b.candidatePhone}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-zinc-900">{b.graderName || "—"}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-zinc-900 tabular-nums">{formatDateShort(b.date)}</div>
                        {b.note && (
                          <div className="text-[10px] text-zinc-400 italic mt-0.5 truncate max-w-[150px]" title={b.note}>
                            {b.note}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        {b.submissionLink ? (
                          <a
                            href={b.submissionLink}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-bold text-primary hover:underline truncate max-w-[220px] inline-block"
                          >
                            Mở bài làm ↗
                          </a>
                        ) : (
                          <span className="text-zinc-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {b.scoreWriting ? (
                          <div className="inline-flex items-center gap-1.5 text-xs font-black text-amber-900 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl">
                            <span>Band</span>
                            <span className="text-sm">{b.scoreWriting}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold text-zinc-400">Chờ Grader</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wider border ${statusBadge(b.status)}`}
                        >
                          {ENTRANCE_STATUS_LABELS[b.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openNoteModal(b)}
                            className="rounded-lg p-1.5 text-zinc-400 hover:text-primary hover:bg-zinc-100 transition-colors cursor-pointer"
                            title="Ghi chú Sale"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                              />
                            </svg>
                          </button>
                          {b.status !== "cancelled" && (
                            <button
                              type="button"
                              onClick={() => handleCancel(b.id, b.candidateName)}
                              className="rounded-lg p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Hủy"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
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
      </div>

      {gradingBooking && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Đóng"
            onClick={() => setGradingBooking(null)}
            className="absolute inset-0 bg-black/40 backdrop-blur-xs"
          />
          <div className="relative w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-zinc-900">Ghi chú Writing Entrance</h3>
            <p className="text-xs text-zinc-500">
              {gradingBooking.candidateName} · Điểm do Grader nhập
              {gradingBooking.scoreWriting ? ` · Band ${gradingBooking.scoreWriting}` : ""}
            </p>
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Ghi chú Sale</label>
              <textarea
                rows={3}
                value={feedbackDraft}
                onChange={(e) => setFeedbackDraft(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 p-3 text-xs outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setGradingBooking(null)}
                className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-bold text-zinc-600 hover:bg-zinc-100"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={savingGrade}
                onClick={() => void handleSaveNote()}
                className="rounded-xl px-5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-50"
              >
                {savingGrade ? "Đang lưu..." : "Lưu ghi chú"}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalOpen && (
        <EntranceBookingModal
          lockType
          initialType="writing"
          onClose={() => setModalOpen(false)}
          onSuccess={() => {
            setModalOpen(false);
            void loadData();
          }}
        />
      )}
    </div>
  );
}
