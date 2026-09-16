"use client";

import { useEffect, useState } from "react";
import { fetchAcaDashboardKpi, type AcaDashboardKpi } from "@/lib/acaManagementApi";

const fmt = (n: number) => n.toLocaleString("vi-VN");

export function AnalyticsSection() {
  const [kpi, setKpi] = useState<AcaDashboardKpi | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAcaDashboardKpi()
      .then((data) => {
        setKpi(data);
        setError(data ? null : "Không tải được KPI.");
      })
      .catch(() => {
        setKpi(null);
        setError("Không tải được KPI từ API.");
      })
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    { k: "Học viên", v: kpi?.totalStudents, hint: "aca_students" },
    { k: "Lớp đang mở", v: kpi?.activeClasses, hint: "aca_classes" },
    { k: "Lớp 1:1 đang học", v: kpi?.active11Classes, hint: "aca_11_classes" },
    {
      k: "Writing chờ chấm",
      v: kpi?.pendingWriting,
      hint: kpi ? `${fmt(kpi.gradedWriting ?? 0)} đã chấm / ${fmt(kpi.totalWriting)} tổng` : undefined,
    },
    { k: "Speaking chờ duyệt", v: kpi?.pendingMockTest, hint: "mock_test_requests" },
    {
      k: "Speaking đã test",
      v: kpi?.testedMockTest,
      hint: kpi ? `${fmt(kpi.approvedMockTest ?? 0)} đã duyệt` : undefined,
    },
    { k: "Lead mới", v: kpi?.newLeads, hint: kpi ? `${fmt(kpi.totalLeads)} tổng lead` : undefined },
    { k: "HV luyện đề", v: kpi?.practiceStudents, hint: "aca_practice_students" },
    { k: "Final còn mở", v: kpi?.finalTestsOpen, hint: "final_tests" },
  ];

  const funnel = [
    { label: "Writing pending", value: kpi?.pendingWriting ?? 0, total: kpi?.totalWriting ?? 0 },
    { label: "Speaking pending", value: kpi?.pendingMockTest ?? 0, total: (kpi?.pendingMockTest ?? 0) + (kpi?.approvedMockTest ?? 0) + (kpi?.testedMockTest ?? 0) },
    { label: "HV luyện đề", value: kpi?.practiceStudents ?? 0, total: Math.max(kpi?.totalStudents ?? 0, 1) },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold text-zinc-900">Vận hành LMS (dữ liệu thật)</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Tổng hợp từ học viên, lớp, writing, speaking, luyện đề và Final — không dùng mock analytics.
        </p>
        {error ? <p className="mt-2 text-xs font-semibold text-rose-600">{error}</p> : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((m) => (
          <div key={m.k} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="text-[10px] font-bold uppercase text-zinc-500">{m.k}</div>
            <div className="mt-3 text-xl font-black text-zinc-900">
              {loading ? "…" : fmt(m.v ?? 0)}
            </div>
            {m.hint ? <p className="mt-2 text-[11px] text-zinc-500">{m.hint}</p> : null}
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-bold text-zinc-900">Hàng đợi cần xử lý</h2>
        <div className="mt-4 space-y-4">
          {funnel.map((row) => {
            const pct = row.total > 0 ? Math.min(100, Math.round((row.value / row.total) * 100)) : 0;
            return (
              <div key={row.label}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-semibold text-zinc-800">{row.label}</span>
                  <span className="tabular-nums text-zinc-500">
                    {fmt(row.value)}
                    {row.total > 0 ? ` / ${fmt(row.total)}` : ""}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
