"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FinalTestBcbDrawer } from "@/components/sale/FinalTestBcbDrawer";
import {
  ENTRANCE_BOOKINGS_UPDATE_EVENT,
  ENTRANCE_STATUS_LABELS,
  ENTRANCE_TYPE_LABELS,
  entranceBookingAsBcbRecord,
  listEntranceTestBookings,
  updateEntranceTestBooking,
  type EntranceTestBooking,
  type EntranceTestStatus,
} from "@/lib/entranceTestBookings";

export default function SaleBcbEntrancePage() {
  const [bookings, setBookings] = useState<EntranceTestBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | EntranceTestStatus>("all");
  const [active, setActive] = useState<EntranceTestBooking | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await listEntranceTestBookings();
      setBookings(rows);
    } catch (err) {
      console.error(err);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
    const onUpdate = () => void reload();
    window.addEventListener(ENTRANCE_BOOKINGS_UPDATE_EVENT, onUpdate);
    return () => window.removeEventListener(ENTRANCE_BOOKINGS_UPDATE_EVENT, onUpdate);
  }, [reload]);

  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      if (statusFilter !== "all" && b.status !== statusFilter) return false;
      if (!search.trim()) return true;
      const q = search.trim().toLowerCase();
      return (
        b.candidateName.toLowerCase().includes(q) ||
        (b.candidatePhone || "").includes(q) ||
        (b.graderName || "").toLowerCase().includes(q)
      );
    });
  }, [bookings, search, statusFilter]);

  const stats = useMemo(() => {
    const withBcb = bookings.filter((b) => b.bcbData && Object.keys(b.bcbData).length > 0).length;
    const graded = bookings.filter((b) => b.status === "graded").length;
    return { total: bookings.length, withBcb, graded };
  }, [bookings]);

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-20">
      <div className="border-b border-zinc-200/80 pb-4">
        <h1 className="text-xl font-black text-zinc-900">BCB Entrance (chi tiết)</h1>
        <p className="mt-0.5 text-xs font-medium text-zinc-500">
          Cặp với BCB Final — Sale điền overview / L&amp;R; Grader sync tiêu chí W/S vào booking khi chấm.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xs">
          <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
            Tổng booking Entrance
          </div>
          <div className="mt-2 text-3xl font-black tabular-nums text-zinc-900">{stats.total}</div>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 shadow-2xs">
          <div className="text-[10px] font-black uppercase tracking-widest text-amber-800">Đã có điểm</div>
          <div className="mt-2 text-3xl font-black tabular-nums text-amber-800">{stats.graded}</div>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-2xs">
          <div className="text-[10px] font-black uppercase tracking-widest text-emerald-700">
            Đã có BCB chi tiết
          </div>
          <div className="mt-2 text-3xl font-black tabular-nums text-emerald-700">{stats.withBcb}</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm tên, SĐT, grader..."
          className="h-10 w-56 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-bold outline-none focus:border-primary"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as "all" | EntranceTestStatus)}
          className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-bold cursor-pointer"
        >
          <option value="all">Mọi trạng thái</option>
          {(Object.keys(ENTRANCE_STATUS_LABELS) as EntranceTestStatus[]).map((st) => (
            <option key={st} value={st}>
              {ENTRANCE_STATUS_LABELS[st]}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => void reload()}
          className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-black text-zinc-700 hover:bg-zinc-50"
        >
          Tải lại
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-soft">
        {loading ? (
          <div className="p-12 text-center text-xs font-bold text-zinc-400">Đang tải...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-xs font-bold text-zinc-400">
            Chưa có booking Entrance phù hợp.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                <tr>
                  <th className="px-5 py-3.5">Ứng viên</th>
                  <th className="px-5 py-3.5">Loại</th>
                  <th className="px-5 py-3.5">Ngày</th>
                  <th className="px-5 py-3.5">Trạng thái</th>
                  <th className="px-5 py-3.5 text-center">BCB</th>
                  <th className="px-5 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-semibold text-zinc-700">
                {filtered.map((b) => {
                  const hasBcb = Boolean(b.bcbData && Object.keys(b.bcbData).length > 0);
                  return (
                    <tr key={b.id} className="hover:bg-zinc-50/70">
                      <td className="px-5 py-4">
                        <div className="font-bold text-zinc-900">{b.candidateName}</div>
                        <div className="text-[10px] font-medium text-zinc-400">
                          {b.candidatePhone || "—"} · {b.graderName || "Chưa gán grader"}
                        </div>
                      </td>
                      <td className="px-5 py-4">{ENTRANCE_TYPE_LABELS[b.type]}</td>
                      <td className="px-5 py-4 tabular-nums">
                        {b.date} {b.time}
                      </td>
                      <td className="px-5 py-4">{ENTRANCE_STATUS_LABELS[b.status]}</td>
                      <td className="px-5 py-4 text-center">
                        {hasBcb ? (
                          <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase text-emerald-700">
                            Đã điền
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full border border-zinc-200 bg-zinc-100 px-2.5 py-1 text-[10px] font-black uppercase text-zinc-500">
                            Trống
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setActive(b)}
                          className="rounded-xl bg-primary/10 px-3 py-1.5 text-[11px] font-black text-primary hover:bg-primary hover:text-white"
                        >
                          Điền BCB
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {active && (
        <FinalTestBcbDrawer
          key={active.id}
          record={entranceBookingAsBcbRecord(active)}
          title="Bảng Chẩn Bệnh (BCB) Entrance Test"
          onClose={() => setActive(null)}
          onSaved={() => {
            setActive(null);
            void reload();
          }}
          persistOverride={async (id, patch) => {
            await updateEntranceTestBooking(id, {
              scoreSpeaking: patch.scoreSpeaking,
              scoreWriting: patch.scoreWriting,
              status: patch.status === "graded" ? "graded" : undefined,
              bcbData: patch.bcbData,
            });
          }}
        />
      )}
    </div>
  );
}
