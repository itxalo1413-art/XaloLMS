"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { NativeSelectChevron } from "@/components/student/ui";
import {
  fetchAcaClasses,
  createAcaStudent,
  type AcaClass,
} from "@/lib/acaManagementApi";
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
  const [classes, setClasses] = useState<AcaClass[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | GuestDiagnosisLeadStatus>("all");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [statusDraft, setStatusDraft] = useState<GuestDiagnosisLeadStatus>("new");
  const [classDraft, setClassDraft] = useState<string>("");

  const sync = useCallback(() => {
    void listGuestDiagnosisLeads().then(setRows);
  }, []);

  useEffect(() => {
    sync();
    const onUpdate = () => sync();
    window.addEventListener(GUEST_DIAGNOSIS_LEADS_EVENT, onUpdate);
    window.addEventListener("storage", onUpdate);

    // Load available classes for assignment
    async function loadClasses() {
      try {
        const data = await fetchAcaClasses();
        if (data && data.length > 0) setClasses(data);
      } catch (err) {
        console.warn("Could not load ACA classes for guest assignment:", err);
      }
    }
    void loadClasses();

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
    setClassDraft(row.assignedClassId || "");
  };

  const saveLead = async () => {
    if (!activeId || !active) return;
    const selectedClass = classes.find((c) => c.id === classDraft);
    const className = selectedClass ? selectedClass.name : "";

    await updateGuestDiagnosisLead(activeId, {
      status: statusDraft,
      note: noteDraft,
      assignedClassId: classDraft,
      assignedClassName: className,
    });

    // If converted or class assigned, register student profile to LMS
    if (classDraft || statusDraft === "converted") {
      try {
        await createAcaStudent({
          name: active.name,
          email: `${active.phone.replace(/\s+/g, "")}@student.xalo.vn`,
          phone: active.phone,
          classId: classDraft || "",
        });
      } catch (err) {
        console.warn("Auto-register student error:", err);
      }
    }

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
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-primary/10 bg-background text-[10px] font-black uppercase tracking-widest text-muted">
                <th className="px-4 py-3">Họ tên</th>
                <th className="px-4 py-3">SĐT</th>
                <th className="px-4 py-3">Mục tiêu</th>
                <th className="px-4 py-3">Lớp gán (Học viên)</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Gửi lúc</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted">
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
                      {row.assignedClassName ? (
                        <span className="inline-flex rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 text-xs font-bold">
                          {row.assignedClassName}
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-zinc-100 text-zinc-500 px-2.5 py-0.5 text-xs font-medium">
                          Chưa gán lớp
                        </span>
                      )}
                    </td>
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
                        Gán Lớp & Xử lý
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
                  Gán Lớp Học Viên (Chuyển Guest sang Học viên)
                </span>
                <div className="group relative mt-1">
                  <select
                    value={classDraft}
                    onChange={(e) => setClassDraft(e.target.value)}
                    className="h-11 w-full cursor-pointer appearance-none rounded-xl border border-primary/15 bg-white px-3 pr-10 text-sm font-semibold"
                  >
                    <option value="">-- Chưa gán lớp (Tự do) --</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} {cls.classCode ? `(${cls.classCode})` : ""}
                      </option>
                    ))}
                  </select>
                  <NativeSelectChevron />
                </div>
              </label>

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
                  rows={3}
                  className="mt-1 w-full resize-y rounded-xl border border-primary/15 px-3 py-2 text-sm"
                  placeholder="Đã gọi tư vấn, xếp vào lớp..."
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
                Lưu & Chuyển Học Viên
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
