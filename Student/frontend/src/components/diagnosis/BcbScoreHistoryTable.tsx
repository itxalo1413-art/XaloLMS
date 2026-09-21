"use client";

import React from "react";
import type { ScoreHistoryItem } from "@/lib/studentDiagnosisApi";

type Props = {
  items?: ScoreHistoryItem[];
  className?: string;
  selectedCycleIndex?: number;
  onSelectCycle?: (cycleIndex: number) => void;
  hideIfSingle?: boolean;
};

function formatBand(score?: number): string {
  if (score === undefined || score === null || score <= 0) return "—";
  return Number.isInteger(score) ? `${score}.0` : score.toString();
}

export function BcbScoreHistoryTable({
  items = [],
  className = "",
  selectedCycleIndex,
  onSelectCycle,
  hideIfSingle = true,
}: Props) {
  // Nếu chỉ có 1 lớp trở xuống và bật hideIfSingle, ẩn bảng kết quả đi
  if (!items || items.length === 0 || (hideIfSingle && items.length <= 1)) {
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-muted">
              Lịch sử điểm qua các chặng lớp (BCB &amp; Final Test)
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Bấm vào từng lớp bên dưới để hiển thị kết quả chi tiết của lớp đó.
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-primary/15 bg-card shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-primary/10 bg-zinc-50/80 text-[10px] font-black uppercase tracking-wider text-muted">
                <th className="py-3 pl-4 pr-3">Lần học &amp; Lớp</th>
                <th className="px-3 py-3">Điểm đầu vào (BCB)</th>
                <th className="px-3 py-3">Điểm cuối khóa (Final)</th>
                <th className="px-3 py-3 text-center">Tiến bộ</th>
                <th className="py-3 pl-3 pr-4 text-right">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {items.map((item) => {
                const isL1 = item.cycleIndex === 0;
                const entOverall = formatBand(item.entranceScores?.overall);
                const finOverall = formatBand(item.finalScores?.overall);
                const isSelected =
                  selectedCycleIndex !== undefined
                    ? item.cycleIndex === selectedCycleIndex
                    : item.isCurrent;

                return (
                  <tr
                    key={`history-cycle-${item.cycleIndex}`}
                    onClick={() => onSelectCycle?.(item.cycleIndex)}
                    className={`transition-all ${
                      onSelectCycle ? "cursor-pointer" : ""
                    } ${
                      isSelected
                        ? "bg-primary/[0.08] ring-2 ring-inset ring-primary/40"
                        : item.isCurrent
                        ? "bg-primary/[0.02] hover:bg-primary/[0.05]"
                        : "hover:bg-zinc-50/80"
                    }`}
                  >
                    {/* Column 1: Lần học & Lớp */}
                    <td className="py-3.5 pl-4 pr-3 align-middle">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                              isSelected
                                ? "bg-primary text-white shadow-xs"
                                : item.isCurrent
                                ? "bg-primary/20 text-primary border border-primary/30"
                                : "bg-zinc-100 text-zinc-700"
                            }`}
                          >
                            {item.label}
                          </span>
                          <span className="font-mono text-xs font-bold text-foreground">
                            {item.classCode || "Chưa gán lớp"}
                          </span>
                          {isSelected && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-primary text-white shadow-2xs">
                              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              Đang xem
                            </span>
                          )}
                        </div>
                        {item.isCurrent && (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                            <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">
                              Lớp hiện tại
                            </span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Column 2: Điểm đầu vào */}
                    <td className="px-3 py-3.5 align-middle">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-indigo-50 border border-indigo-200/60 text-xs font-black text-indigo-700">
                            Overall {entOverall}
                          </span>
                          {!isL1 && (
                            <span className="text-[9px] font-semibold text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded">
                              Tự động từ Final L{item.cycleIndex}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-muted-foreground flex gap-2 font-mono">
                          <span>L: {formatBand(item.entranceScores?.listening)}</span>
                          <span>R: {formatBand(item.entranceScores?.reading)}</span>
                          <span>W: {formatBand(item.entranceScores?.writing)}</span>
                          <span>S: {formatBand(item.entranceScores?.speaking)}</span>
                        </div>
                      </div>
                    </td>

                    {/* Column 3: Điểm cuối khóa */}
                    <td className="px-3 py-3.5 align-middle">
                      {item.hasFinal ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200/60 text-xs font-black text-emerald-700">
                              Overall {finOverall}
                            </span>
                          </div>
                          <div className="text-[10px] text-muted-foreground flex gap-2 font-mono">
                            <span>L: {formatBand(item.finalScores?.listening)}</span>
                            <span>R: {formatBand(item.finalScores?.reading)}</span>
                            <span>W: {formatBand(item.finalScores?.writing)}</span>
                            <span>S: {formatBand(item.finalScores?.speaking)}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50/80 border border-amber-200/60 text-[10px] font-bold text-amber-700">
                            <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Chưa thi (Reset theo lớp mới)
                          </span>
                          <p className="text-[9px] text-zinc-400">Đủ 36 buổi lớp mới để đăng ký thi</p>
                        </div>
                      )}
                    </td>

                    {/* Column 4: Tiến bộ */}
                    <td className="px-3 py-3.5 align-middle text-center">
                      {item.deltaOverall !== null ? (
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black ${
                            item.deltaOverall > 0
                              ? "bg-emerald-100 text-emerald-800"
                              : item.deltaOverall < 0
                              ? "bg-amber-100 text-amber-800"
                              : "bg-zinc-100 text-zinc-700"
                          }`}
                        >
                          {item.deltaOverall > 0 ? `+${item.deltaOverall}` : item.deltaOverall}
                        </span>
                      ) : (
                        <span className="text-zinc-300 font-bold">—</span>
                      )}
                    </td>

                    {/* Column 5: Trạng thái & Thao tác */}
                    <td className="py-3.5 pl-3 pr-4 align-middle text-right">
                      <div className="inline-flex items-center gap-2 justify-end">
                        {item.status === "completed" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-700">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            Hoàn thành
                          </span>
                        ) : item.status === "in_progress" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                            Đang học
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-zinc-100 text-[10px] font-medium text-zinc-500">
                            Sắp học
                          </span>
                        )}

                        {onSelectCycle && (
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                              isSelected
                                ? "bg-primary text-white shadow-2xs"
                                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                            }`}
                          >
                            {isSelected ? "Đang xem" : "Xem"}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
