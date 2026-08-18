"use client";

import { useEffect, useState } from "react";
import { fetchAcaDashboardKpi, type AcaDashboardKpi } from "@/lib/acaManagementApi";

const fmt = (n: number) => n.toLocaleString("vi-VN");

export function DashboardHome() {
  const [kpi, setKpi] = useState<AcaDashboardKpi | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAcaDashboardKpi()
      .then(setKpi)
      .catch(() => setKpi(null))
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    {
      k: "Học viên",
      v: loading ? "…" : fmt(kpi?.totalStudents ?? 0),
      tint: "text-zinc-900",
    },
    {
      k: "Bài writing",
      v: loading ? "…" : fmt(kpi?.totalWriting ?? 0),
      tint: "text-[#6a5acd]",
      badge: kpi?.pendingWriting ? `${kpi.pendingWriting} chờ chấm` : undefined,
    },
    {
      k: "Mock test chờ",
      v: loading ? "…" : fmt(kpi?.pendingMockTest ?? 0),
      tint: "text-[#0369a1]",
    },
    {
      k: "Lead chẩn đoán",
      v: loading ? "…" : fmt(kpi?.totalLeads ?? 0),
      tint: "text-[#fe7794]",
      badge: kpi?.newLeads ? `${kpi.newLeads} mới` : undefined,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.k}
            className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="text-[10px] font-bold uppercase text-zinc-500">
                {card.k}
              </div>
              {card.badge && (
                <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-700">
                  {card.badge}
                </span>
              )}
            </div>
            <div className={`mt-2 text-2xl font-black ${card.tint}`}>
              {card.v}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-dashed border-zinc-200 bg-white/80 p-6 text-center text-sm text-zinc-400">
        Các biểu đồ phân tích chi tiết (lượt xem tài liệu, xu hướng) sẽ hiển thị ở đây khi có dữ liệu từ hệ thống.
      </div>
    </div>
  );
}
