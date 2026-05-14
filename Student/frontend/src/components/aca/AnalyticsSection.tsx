"use client";

import { useState } from "react";
import { analyticsSnapshot, subjectComparison } from "./mockData";
import { NativeSelectChevron } from "@/components/student/ui";

const fmt = (n: number) => n.toLocaleString("vi-VN");

export function AnalyticsSection() {
  const [period, setPeriod] = useState("7d");
  const [cat, setCat] = useState("all");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div>
          <label className="text-[10px] font-bold uppercase text-zinc-500">
            Chu kỳ
          </label>
          <NativeSelectChevron
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="mt-2 h-11 rounded-2xl border border-zinc-200 bg-white text-sm font-bold text-foreground shadow-sm focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
          >
            <option value="7d">7 ngày</option>
            <option value="30d">30 ngày</option>
            <option value="90d">90 ngày</option>
          </NativeSelectChevron>
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase text-zinc-500">
            Danh mục (lọc)
          </label>
          <NativeSelectChevron
            value={cat}
            onChange={(e) => setCat(e.target.value)}
            className="mt-2 h-11 rounded-2xl border border-zinc-200 bg-white text-sm font-bold text-foreground shadow-sm focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
          >
            <option value="all">Toàn hệ</option>
            <option value="ielts">IELTS</option>
            <option value="vocab">Từ vựng</option>
          </NativeSelectChevron>
        </div>
        <p className="ml-auto max-w-xs text-[11px] text-zinc-500">
          Bộ lọc chỉ làm đổi nhãn trên chip (demo) — không gọi API.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { k: "Lượt mở tài liệu", v: fmt(analyticsSnapshot.totalViewsPeriod) },
          { k: "Tổng phút sử dụng", v: fmt(analyticsSnapshot.totalMinutesPeriod) },
          { k: "Top nội dung", v: analyticsSnapshot.topTitle, small: true },
          { k: "Ít tương tác", v: analyticsSnapshot.lowTitle, small: true },
        ].map((m) => (
          <div
            key={m.k}
            className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
          >
            <div className="text-[10px] font-bold uppercase   text-zinc-500">
              {m.k}{" "}
              <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[9px] text-zinc-500">
                {period}
              </span>
              {cat !== "all" ? (
                <span className="ml-1 rounded bg-[#efeaff] px-1.5 py-0.5 text-[9px] text-[#4b3fb3]">
                  {cat}
                </span>
              ) : null}
            </div>
            <div
              className={`mt-3 font-black text-zinc-900 ${m.small ? "text-sm leading-snug" : "text-xl"}`}
            >
              {m.v}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-zinc-900">So sánh mức độ quan tâm theo môn</h2>
            <p className="mt-1 text-xs text-zinc-500">
              Drill-down: bấm dòng để xem chi tiết (demo).
            </p>
          </div>
        </div>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-100 text-[10px] font-bold uppercase text-zinc-500">
              <tr>
                <th className="py-3 text-left">Môn</th>
                <th className="py-3 text-right">Lượt mở</th>
                <th className="py-3 text-right">Phút</th>
                <th className="py-3 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {subjectComparison.map((s) => (
                <tr key={s.subject} className="hover:bg-[#efeaff]/30">
                  <td className="py-3 font-semibold text-zinc-900">{s.subject}</td>
                  <td className="py-3 text-right text-zinc-700">{fmt(s.views)}</td>
                  <td className="py-3 text-right text-zinc-700">{fmt(s.minutes)}</td>
                  <td className="py-3 text-right">
                    <button
                      type="button"
                      className="text-xs font-bold text-[#6a5acd] hover:underline"
                      onClick={() =>
                        alert(
                          `Demo drill-down:\n• ${s.subject}\n• Top docs\n• Người dùng thoát sớm`,
                        )
                      }
                    >
                      Mở
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <section className="rounded-2xl border border-dashed border-zinc-200 bg-white/80 p-5">
        <h3 className="text-xs font-bold uppercase   text-zinc-500">
          Insight thoát xem (demo)
        </h3>
        <p className="mt-2 text-sm text-zinc-700">{analyticsSnapshot.dropoffHint}</p>
      </section>
    </div>
  );
}
