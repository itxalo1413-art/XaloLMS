"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { NativeSelectChevron } from "@/components/student/ui";
import {
  GUEST_DIAGNOSIS_LEADS_EVENT,
  GUEST_LEAD_STATUS_LABEL,
  listGuestDiagnosisLeads,
  updateGuestDiagnosisLead,
  type GuestDiagnosisLead,
  type GuestDiagnosisLeadStatus,
} from "@/lib/guestDiagnosisLeads";

function formatSubmittedAt(iso: string) {
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

export function GuestDiagnosisLeadsSection() {
  const [rows, setRows] = useState<GuestDiagnosisLead[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | GuestDiagnosisLeadStatus>("all");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [statusDraft, setStatusDraft] = useState<GuestDiagnosisLeadStatus>("new");

  const sync = useCallback(() => {
    setRows(listGuestDiagnosisLeads());
  }, []);

  useEffect(() => {
    sync();
    const onUpdate = () => sync();
    window.addEventListener(GUEST_DIAGNOSIS_LEADS_EVENT, onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener(GUEST_DIAGNOSIS_LEADS_EVENT, onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, [sync]);

  const filtered = useMemo(() => {
    if (statusFilter === "all") return rows;
    return rows.filter((r) => r.status === statusFilter);
  }, [rows, statusFilter]);

  const active = rows.find((r) => r.id === activeId);

  const openLead = (row: GuestDiagnosisLead) => {
    setActiveId(row.id);
    setNoteDraft(row.note);
    setStatusDraft(row.status);
  };

  const saveLead = () => {
    if (!activeId) return;
    updateGuestDiagnosisLead(activeId, { status: statusDraft, note: noteDraft });
    sync();
    setActiveId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {(["all", "new", "contacted", "converted", "closed"] as const).map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setStatusFilter(st)}
            className={[
              "rounded-full px-3 py-1.5 text-xs font-bold transition-colors",
              statusFilter === st
                ? "bg-primary text-white"
                : "bg-primary-soft/60 text-primary hover:bg-primary-soft",
            ].join(" ")}
          >
            {st === "all" ? `Tất cả (${rows.length})` : GUEST_LEAD_STATUS_LABEL[st]}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-primary/10 bg-white shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-primary/10 bg-background text-[10px] font-black uppercase tracking-widest text-muted">
                <th className="px-4 py-3">Họ tên</th>
                <th className="px-4 py-3">SĐT</th>
                <th className="px-4 py-3">Mục tiêu</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Gửi lúc</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted">
                    Chưa có lead tư vấn.
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-primary/5 hover:bg-primary-soft/20"
                  >
                    <td className="px-4 py-3 font-bold">{row.name}</td>
                    <td className="px-4 py-3 tabular-nums">{row.phone}</td>
                    <td className="px-4 py-3">{row.aim}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-bold">{GUEST_LEAD_STATUS_LABEL[row.status]}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">
                      {formatSubmittedAt(row.submittedAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openLead(row)}
                        className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white hover:bg-primary/90"
                      >
                        Xử lý
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {active ? (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-premium">
            <h3 className="text-lg font-black">{active.name}</h3>
            <p className="mt-1 text-sm text-muted">
              {active.phone} · {active.aim}
            </p>
            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wider text-muted">
                  Trạng thái
                </span>
                <div className="group relative mt-1">
                  <select
                    value={statusDraft}
                    onChange={(e) =>
                      setStatusDraft(e.target.value as GuestDiagnosisLeadStatus)
                    }
                    className="h-11 w-full cursor-pointer appearance-none rounded-xl border border-primary/15 bg-white px-3 pr-10 text-sm font-semibold"
                  >
                    {(Object.keys(GUEST_LEAD_STATUS_LABEL) as GuestDiagnosisLeadStatus[]).map(
                      (k) => (
                        <option key={k} value={k}>
                          {GUEST_LEAD_STATUS_LABEL[k]}
                        </option>
                      ),
                    )}
                  </select>
                  <NativeSelectChevron />
                </div>
              </label>
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wider text-muted">
                  Ghi chú nội bộ
                </span>
                <textarea
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  rows={4}
                  className="mt-1 w-full resize-y rounded-xl border border-primary/15 px-3 py-2 text-sm"
                  placeholder="Đã gọi, hẹn test lại…"
                />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveId(null)}
                className="rounded-xl px-4 py-2 text-sm font-bold text-muted hover:bg-zinc-100"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={saveLead}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90"
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
