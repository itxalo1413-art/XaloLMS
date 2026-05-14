"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  type StudentStatus,
  students,
  statusLabel,
} from "@/components/teacher/mockData";
import { NativeSelectChevron } from "@/components/student/ui";

const groups = Array.from(new Set(students.map((s) => s.group)));

export function StudentListSection() {
  const [q, setQ] = useState("");
  const [group, setGroup] = useState<string>("all");
  const [status, setStatus] = useState<"all" | StudentStatus>("all");

  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    return students.filter((s) => {
      const matchName = !n || s.name.toLowerCase().includes(n);
      const matchGroup = group === "all" || s.group === group;
      const matchStatus = status === "all" || s.status === status;
      return matchName && matchGroup && matchStatus;
    });
  }, [q, group, status]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm md:flex-row md:items-end md:justify-between">
        <div className="flex-1">
          <label className="text-[10px] font-bold uppercase   text-zinc-500">
            Tìm theo tên
          </label>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Nhập tên học sinh…"
            className="mt-2 w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:border-[#6a5acd]"
          />
        </div>
        <div className="grid w-full gap-3 sm:grid-cols-2 md:w-auto md:min-w-[320px]">
          <div>
            <label className="text-[10px] font-bold uppercase   text-zinc-500">
              Nhóm / lớp
            </label>
            <NativeSelectChevron
              value={group}
              onChange={(e) => setGroup(e.target.value)}
              className="mt-2 h-11 rounded-2xl border border-zinc-200 bg-white text-sm font-bold text-foreground shadow-sm focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
            >
              <option value="all">Tất cả</option>
              {groups.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </NativeSelectChevron>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase   text-zinc-500">
              Trạng thái
            </label>
            <NativeSelectChevron
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as typeof status)
              }
              className="mt-2 h-11 rounded-2xl border border-zinc-200 bg-white text-sm font-bold text-foreground shadow-sm focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
            >
              <option value="all">Tất cả</option>
              <option value="active">Đang học</option>
              <option value="follow_up">Cần theo dõi</option>
              <option value="paused">Tạm dừng</option>
            </NativeSelectChevron>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
        <div className="grid grid-cols-[1fr_140px_140px_120px] gap-2 border-b border-zinc-100 bg-zinc-50/80 px-4 py-3 text-[10px] font-bold uppercase   text-zinc-500 md:grid-cols-[1.2fr_1fr_140px_140px_120px]">
          <span>Học sinh</span>
          <span className="hidden md:block">Nhóm</span>
          <span>Tóm tắt</span>
          <span className="hidden md:block">Trạng thái</span>
          <span className="text-right">Hồ sơ</span>
        </div>
        <ul className="divide-y divide-zinc-100">
          {filtered.map((s) => (
            <li key={s.id}>
              <Link
                href={`/teacher/hoc-sinh/${s.id}`}
                className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-4 transition-colors hover:bg-[#efeaff]/40 md:grid-cols-[1.2fr_1fr_140px_140px_120px]"
              >
                <div>
                  <div className="font-semibold text-zinc-900">{s.name}</div>
                  <div className="text-xs text-zinc-500">{s.email}</div>
                </div>
                <div className="hidden text-sm text-zinc-600 md:block">
                  {s.group}
                </div>
                <div className="hidden text-sm font-medium text-zinc-700 md:block">
                  {s.overallBand ? `Overall ~${s.overallBand}` : "—"}
                </div>
                <div className="hidden md:block">
                  <span
                    className={[
                      "inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
                      s.status === "active"
                        ? "bg-emerald-100 text-emerald-800"
                        : s.status === "follow_up"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-zinc-100 text-zinc-600",
                    ].join(" ")}
                  >
                    {statusLabel(s.status)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="inline-flex rounded-lg bg-[#6a5acd] px-3 py-1.5 text-xs font-semibold text-white md:bg-transparent md:px-0 md:py-0 md:font-semibold md:text-[#6a5acd] md:underline-offset-2 md:hover:underline">
                    Mở
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
        {filtered.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-zinc-500">
            Không có học sinh khớp bộ lọc.
          </div>
        ) : null}
      </div>
    </div>
  );
}
