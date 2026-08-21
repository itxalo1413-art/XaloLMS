"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  GUEST_DIAGNOSIS_LEADS_EVENT,
  GUEST_LEAD_STATUS_LABEL,
  listGuestDiagnosisLeads,
  submitGuestDiagnosisLead,
  updateGuestDiagnosisLead,
  type GuestDiagnosisLead,
  type GuestDiagnosisLeadStatus,
} from "@/lib/guestDiagnosisLeads";
import {
  fetchAcaClasses,
  createAcaStudent,
  type AcaClass,
} from "@/lib/acaManagementApi";
import { EntranceBookingModal } from "@/components/sale/EntranceBookingModal";
import Link from "next/link";

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function statusColor(status: GuestDiagnosisLeadStatus) {
  return {
    new: "bg-sky-50 text-sky-700 border-sky-200",
    contacted: "bg-amber-50 text-amber-700 border-amber-200",
    converted: "bg-emerald-50 text-emerald-700 border-emerald-200",
    closed: "bg-zinc-100 text-zinc-600 border-zinc-200",
  }[status];
}

// ─── Metric Card ─────────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: number;
  sub?: string;
  color: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-xs">
      <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{label}</div>
      <div className={`text-2xl font-black ${color}`}>{value}</div>
      {sub && <div className="text-[11px] text-zinc-400 font-medium">{sub}</div>}
    </div>
  );
}

// ─── Add Lead Modal ───────────────────────────────────────────────────────────

function AddLeadModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [aim, setAim] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!name.trim()) { setErr("Vui lòng nhập tên khách."); return; }
    if (!phone.trim()) { setErr("Vui lòng nhập số điện thoại."); return; }
    setSubmitting(true);
    try {
      submitGuestDiagnosisLead({ name: name.trim(), phone: phone.trim(), aim: aim.trim() });
      onAdded();
      onClose();
    } catch {
      setErr("Thêm lead thất bại. Thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Đóng"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-xs"
      />
      <div className="relative w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-black text-zinc-900">Thêm Lead Mới</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1.5">
              Tên khách <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Nguyễn Văn A"
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50/40 px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all font-medium"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1.5">
              Số điện thoại <span className="text-rose-500">*</span>
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="VD: 0901 234 567"
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50/40 px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all font-medium"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1.5">Mục tiêu IELTS</label>
            <input
              type="text"
              value={aim}
              onChange={(e) => setAim(e.target.value)}
              placeholder="VD: 7.0 IELTS"
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50/40 px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all font-medium"
            />
          </div>

          {err && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-700">
              {err}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-bold text-zinc-600 hover:bg-zinc-100 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-primary hover:bg-[#6a5acd] px-5 py-2 text-xs font-black text-white transition-colors disabled:opacity-60 shadow-sm"
            >
              {submitting ? "Đang thêm..." : "Thêm Lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Lead Detail Drawer ───────────────────────────────────────────────────────

function LeadDetailDrawer({
  lead,
  classes,
  onClose,
  onSaved,
  onBookTest,
}: {
  lead: GuestDiagnosisLead;
  classes: AcaClass[];
  onClose: () => void;
  onSaved: () => void;
  onBookTest: (lead: GuestDiagnosisLead) => void;
}) {
  const [statusDraft, setStatusDraft] = useState<GuestDiagnosisLeadStatus>(lead.status);
  const [noteDraft, setNoteDraft] = useState(lead.note);
  const [classDraft, setClassDraft] = useState(lead.assignedClassId || "");
  const [saving, setSaving] = useState(false);
  const [converting, setConverting] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const hasChanges =
    statusDraft !== lead.status ||
    noteDraft !== lead.note ||
    classDraft !== (lead.assignedClassId || "");

  const handleSave = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const selectedClass = classes.find((c) => c.id === classDraft);
      updateGuestDiagnosisLead(lead.id, {
        status: statusDraft,
        note: noteDraft,
        ...(classDraft
          ? {
              assignedClassId: classDraft,
              assignedClassName: selectedClass ? selectedClass.name || selectedClass.classCode : classDraft,
            }
          : {}),
      });
      setMsg({ type: "success", text: "Đã lưu thay đổi!" });
      onSaved();
    } catch {
      setMsg({ type: "error", text: "Lưu thất bại." });
    } finally {
      setSaving(false);
    }
  };

  const handleConvert = async () => {
    if (!classDraft) {
      setMsg({ type: "error", text: "Vui lòng chọn lớp trước khi chốt học." });
      return;
    }
    if (!confirm(`Xác nhận chuyển "${lead.name}" thành học viên lớp đã chọn?`)) return;
    setConverting(true);
    setMsg(null);
    try {
      const selectedClass = classes.find((c) => c.id === classDraft);
      await createAcaStudent({
        name: lead.name,
        phone: lead.phone,
        email: `${lead.phone.replace(/\s/g, "")}@xalo.student.local`,
        classId: classDraft,
      });
      updateGuestDiagnosisLead(lead.id, {
        status: "converted",
        assignedClassId: classDraft,
        assignedClassName: selectedClass ? selectedClass.name || selectedClass.classCode : classDraft,
      });
      setMsg({ type: "success", text: `Đã chốt học thành công! "${lead.name}" đã là học viên.` });
      onSaved();
    } catch (e: any) {
      setMsg({ type: "error", text: "Chuyển đổi thất bại: " + (e?.message || "Lỗi không xác định") });
    } finally {
      setConverting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end md:items-center justify-center md:justify-end p-0 md:p-4">
      <button
        type="button"
        aria-label="Đóng"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-xs"
      />
      <div className="relative w-full md:w-[460px] md:max-h-[92vh] rounded-t-2xl md:rounded-2xl border border-zinc-200 bg-white shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-zinc-100 bg-zinc-50/70">
          <div>
            <div className="text-base font-black text-zinc-900">{lead.name}</div>
            <div className="text-xs text-zinc-500 font-mono mt-0.5">{lead.phone}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors mt-0.5"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Meta */}
          <div className="flex flex-wrap gap-4 p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/80">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Mục tiêu</span>
              <span className="text-xs font-bold text-zinc-800">{lead.aim || "—"}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Ngày gửi</span>
              <span className="text-xs font-bold text-zinc-800">{formatDate(lead.submittedAt)}</span>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1.5">Trạng thái</label>
            <div className="relative">
              <select
                value={statusDraft}
                onChange={(e) => setStatusDraft(e.target.value as GuestDiagnosisLeadStatus)}
                className="w-full appearance-none rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 pr-8 text-sm font-medium text-zinc-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all cursor-pointer shadow-xs"
              >
                {(Object.keys(GUEST_LEAD_STATUS_LABEL) as GuestDiagnosisLeadStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {GUEST_LEAD_STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </div>
          </div>

          {/* Class Assignment */}
          {classes.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1.5">Gán lớp học</label>
              <div className="relative">
                <select
                  value={classDraft}
                  onChange={(e) => setClassDraft(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 pr-8 text-sm font-medium text-zinc-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all cursor-pointer shadow-xs"
                >
                  <option value="">-- Chưa chọn lớp --</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.classCode} — {c.name || c.classCode}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </div>
            </div>
          )}

          {/* Note */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1.5">Ghi chú nội bộ</label>
            <textarea
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              rows={4}
              placeholder="Thêm ghi chú về lead này..."
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50/40 px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all resize-none"
            />
          </div>

          {msg && (
            <div
              className={`rounded-xl border px-3.5 py-2.5 text-xs font-semibold ${
                msg.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-rose-200 bg-rose-50 text-rose-700"
              }`}
            >
              {msg.text}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-zinc-100 flex flex-col gap-2.5 bg-zinc-50/40">
          <button
            type="button"
            onClick={() => onBookTest(lead)}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-[#6a5acd] px-4 py-2.5 text-sm font-black text-white transition-colors shadow-sm cursor-pointer"
          >
            Đặt Lịch Test Entrance (S / W)
          </button>
          <Link
            href={`/sale/leads/${lead.id}/bcb`}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 px-4 py-2.5 text-sm font-black text-white transition-colors shadow-sm"
          >
            Nhập điểm & BCB chi tiết
          </Link>
          {lead.status !== "converted" && (
            <button
              type="button"
              onClick={handleConvert}
              disabled={converting || !classDraft}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 text-sm font-black text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
            >
              {converting ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Đang chuyển đổi...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Chốt học → Thành học viên
                </>
              )}
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="w-full rounded-xl border border-zinc-200 bg-white hover:bg-zinc-100 px-4 py-2.5 text-sm font-black text-zinc-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
          >
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SaleLeadsPage() {
  const [rows, setRows] = useState<GuestDiagnosisLead[]>([]);
  const [classes, setClasses] = useState<AcaClass[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | GuestDiagnosisLeadStatus>("all");
  const [search, setSearch] = useState("");
  const [activeLead, setActiveLead] = useState<GuestDiagnosisLead | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [bookingLead, setBookingLead] = useState<GuestDiagnosisLead | null>(null);

  const sync = useCallback(() => {
    void listGuestDiagnosisLeads().then(setRows);
  }, []);

  useEffect(() => {
    sync();
    window.addEventListener(GUEST_DIAGNOSIS_LEADS_EVENT, sync);
    window.addEventListener("storage", sync);

    fetchAcaClasses()
      .then((data) => {
        if (data?.length > 0) setClasses(data);
      })
      .catch(() => {});

    return () => {
      window.removeEventListener(GUEST_DIAGNOSIS_LEADS_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [sync]);

  const today = new Date().toDateString();
  const metrics = useMemo(
    () => ({
      total: rows.length,
      newToday: rows.filter((r) => new Date(r.submittedAt).toDateString() === today).length,
      contacted: rows.filter((r) => r.status === "contacted").length,
      converted: rows.filter((r) => r.status === "converted").length,
    }),
    [rows, today]
  );

  const filtered = useMemo(() => {
    let data = rows;
    if (statusFilter !== "all") data = data.filter((r) => r.status === statusFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      data = data.filter(
        (r) => r.name.toLowerCase().includes(q) || r.phone.includes(q) || r.aim.toLowerCase().includes(q)
      );
    }
    return data;
  }, [rows, statusFilter, search]);

  return (
    <>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-zinc-900">Danh Sách Lead BCB</h1>
            <p className="text-xs text-zinc-500 mt-0.5 font-medium">
              Quản lý khách làm bài chẩn đoán và chuyển đổi thành học viên chính thức
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 rounded-xl bg-primary hover:bg-[#6a5acd] px-4 py-2.5 text-xs font-black text-white transition-all shadow-md hover:shadow-primary/20 shrink-0"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Thêm Lead Mới
          </button>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard label="Tổng Lead" value={metrics.total} color="text-zinc-900" />
          <MetricCard label="Hôm nay" value={metrics.newToday} sub="Lead mới gửi" color="text-sky-600" />
          <MetricCard label="Đã liên hệ" value={metrics.contacted} color="text-amber-600" />
          <MetricCard label="Đã chốt học" value={metrics.converted} color="text-emerald-600" />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-100 border border-zinc-200/80 text-[11px] font-bold flex-wrap">
            {(
              [
                ["all", "Tất cả"],
                ["new", "Mới"],
                ["contacted", "Đã liên hệ"],
                ["converted", "Đã chốt"],
                ["closed", "Đóng"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setStatusFilter(key)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  statusFilter === key
                    ? "bg-primary text-white shadow-sm font-black"
                    : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative min-w-[240px]">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm tên, SĐT, mục tiêu..."
              className="w-full h-9 rounded-xl bg-white border border-zinc-200 px-3 pl-9 text-xs text-zinc-900 placeholder-zinc-400 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all shadow-xs"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Table Card */}
        <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-soft">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-400 space-y-2">
              <svg className="h-10 w-10 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div className="text-sm font-bold text-zinc-700">Không có lead nào</div>
              <div className="text-xs text-zinc-400">Thử thay đổi bộ lọc hoặc thêm lead mới</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50/80 text-[10px] font-black uppercase tracking-wider text-zinc-500">
                    <th className="px-4 py-3.5 text-left">Tên khách</th>
                    <th className="px-4 py-3.5 text-left">Số điện thoại</th>
                    <th className="px-4 py-3.5 text-left hidden sm:table-cell">Mục tiêu</th>
                    <th className="px-4 py-3.5 text-left">Trạng thái</th>
                    <th className="px-4 py-3.5 text-left hidden md:table-cell">Ngày gửi</th>
                    <th className="px-4 py-3.5 text-left hidden lg:table-cell">Lớp gán</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 font-medium">
                  {filtered.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => setActiveLead(row)}
                      className="cursor-pointer transition-colors hover:bg-primary-soft/15"
                    >
                      <td className="px-4 py-3.5 font-bold text-zinc-900">
                        <div>{row.name}</div>
                        {row.hasDiagnosis ? (
                          <div className="mt-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-700">
                            Đã có BCB
                          </div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3.5 text-zinc-600 font-mono tabular-nums">{row.phone}</td>
                      <td className="px-4 py-3.5 text-zinc-600 hidden sm:table-cell">{row.aim || "—"}</td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wider border ${statusColor(
                            row.status
                          )}`}
                        >
                          {GUEST_LEAD_STATUS_LABEL[row.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-zinc-400 text-xs hidden md:table-cell">
                        {formatDate(row.submittedAt)}
                      </td>
                      <td className="px-4 py-3.5 text-zinc-600 text-xs hidden lg:table-cell font-semibold">
                        {row.assignedClassName || <span className="text-zinc-300">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Count */}
        <div className="text-xs text-zinc-400 text-right font-medium">
          Hiển thị {filtered.length} / {rows.length} lead
        </div>
      </div>

      {/* Add Lead Modal */}
      {showAddModal && (
        <AddLeadModal
          onClose={() => setShowAddModal(false)}
          onAdded={sync}
        />
      )}

      {/* Lead Detail Drawer */}
      {activeLead && (
        <LeadDetailDrawer
          lead={activeLead}
          classes={classes}
          onClose={() => setActiveLead(null)}
          onBookTest={(lead) => {
            setActiveLead(null);
            setBookingLead(lead);
          }}
          onSaved={() => {
            sync();
            void listGuestDiagnosisLeads().then((rows) => {
              setActiveLead((prev) => {
                if (!prev) return null;
                return rows.find((r) => r.id === prev.id) ?? null;
              });
            });
          }}
        />
      )}

      {/* Entrance Booking Modal */}
      {bookingLead && (
        <EntranceBookingModal
          initialLead={bookingLead}
          onClose={() => setBookingLead(null)}
          onSuccess={() => {
            sync();
          }}
        />
      )}
    </>
  );
}
