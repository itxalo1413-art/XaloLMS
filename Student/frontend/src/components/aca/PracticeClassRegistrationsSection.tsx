"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  PRACTICE_CLASS_UPDATE_EVENT,
  refreshAllPracticeRegistrationsForAca,
  type PracticeRegistrationAcaRow,
} from "@/lib/practiceClass";

function formatRegisteredAt(iso: string) {
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

export function PracticeClassRegistrationsSection() {
  const [rows, setRows] = useState<PracticeRegistrationAcaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [slotFilter, setSlotFilter] = useState<string>("all");

  const sync = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await refreshAllPracticeRegistrationsForAca();
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
    window.addEventListener(PRACTICE_CLASS_UPDATE_EVENT, onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener(PRACTICE_CLASS_UPDATE_EVENT, onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, [sync]);

  const slotOptions = useMemo(
    () => [
      "all",
      ...new Set(rows.map((r) => r.slotId)),
    ],
    [rows],
  );

  const filtered = useMemo(() => {
    if (slotFilter === "all") return rows;
    return rows.filter((r) => r.slotId === slotFilter);
  }, [rows, slotFilter]);

  return (
    <section className="mt-8 space-y-4">
      <div>
        <h2 className="text-lg font-black text-foreground">Danh sách đăng ký</h2>
        <p className="mt-1 text-sm text-muted">
          Học viên đã đăng ký từng buổi lớp luyện đề trên Hỗ trợ tự học.
        </p>
      </div>

      {error ? (
        <p className="rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {slotOptions.map((id) => {
          const label =
            id === "all"
              ? `Tất cả (${rows.length})`
              : rows.find((r) => r.slotId === id)?.slotTitle ?? id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setSlotFilter(id)}
              className={[
                "rounded-full px-3 py-1.5 text-xs font-bold transition-colors",
                slotFilter === id
                  ? "bg-primary text-white"
                  : "bg-primary-soft/60 text-primary hover:bg-primary-soft",
              ].join(" ")}
            >
              {label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <p className="text-sm text-muted">Đang tải…</p>
      ) : filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-primary/20 bg-white px-6 py-10 text-center text-sm text-muted">
          Chưa có đăng ký nào.
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-primary/10 bg-white shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-primary/10 bg-background text-[10px] font-black uppercase tracking-widest text-muted">
                  <th className="px-4 py-3">Học viên</th>
                  <th className="px-4 py-3">Buổi</th>
                  <th className="px-4 py-3">Lịch</th>
                  <th className="px-4 py-3">Đăng ký lúc</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr
                    key={`${row.studentId}-${row.slotId}-${row.registeredAt}`}
                    className="border-b border-primary/5 hover:bg-primary-soft/20"
                  >
                    <td className="px-4 py-3">
                      <div className="font-bold text-foreground">{row.studentName}</div>
                      <div className="text-xs text-muted">{row.studentId}</div>
                    </td>
                    <td className="px-4 py-3">{row.slotTitle}</td>
                    <td className="px-4 py-3 text-muted">{row.slotSchedule}</td>
                    <td className="px-4 py-3 tabular-nums text-muted">
                      {formatRegisteredAt(row.registeredAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
