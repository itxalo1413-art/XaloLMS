"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  loadMockTestRequests,
  type MockTestRequest,
  MOCK_TEST_UPDATE_EVENT,
} from "@/lib/mockTestRequests";
import { LOGGED_IN_TEACHER_NAME } from "./mockTestTeachers";

const months = [
  "Tháng 1",
  "Tháng 2",
  "Tháng 3",
  "Tháng 4",
  "Tháng 5",
  "Tháng 6",
  "Tháng 7",
  "Tháng 8",
  "Tháng 9",
  "Tháng 10",
  "Tháng 11",
  "Tháng 12",
];

function slotTs(r: MockTestRequest): number {
  const d = new Date(r.year, r.month, r.day);
  const raw = r.examTime ?? "09:00";
  const parts = raw.split(":");
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  d.setHours(Number.isFinite(h) ? h : 9, Number.isFinite(m) ? m : 0, 0, 0);
  return d.getTime();
}

function dateLabel(r: MockTestRequest) {
  return `${r.day} ${months[r.month] ?? `T${r.month + 1}`} ${r.year}`;
}

export function MockTestScheduleSection() {
  const [rows, setRows] = useState<MockTestRequest[]>([]);

  const sync = useCallback(() => {
    setRows(loadMockTestRequests());
  }, []);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) sync();
    });
    window.addEventListener(MOCK_TEST_UPDATE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      cancelled = true;
      window.removeEventListener(MOCK_TEST_UPDATE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [sync]);

  const teacherName = LOGGED_IN_TEACHER_NAME;

  const assigned = useMemo(() => {
    return rows
      .filter(
        (r) =>
          r.status === "approved" &&
          (r.examTeacher ?? "").trim() === teacherName.trim(),
      )
      .sort((a, b) => slotTs(a) - slotTs(b));
  }, [rows, teacherName]);

  const startOfTodayTs = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, []);

  return (
    <div className="space-y-6">
      {assigned.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white px-8 py-14 text-center shadow-sm">
          <p className="text-sm font-semibold text-zinc-800">
            Bạn chưa có ca Mock Test nào được xếp
          </p>
          <p className="mt-2 max-w-lg mx-auto text-sm text-zinc-500 leading-relaxed">
            Các ca sẽ hiển thị sau khi học viên đăng ký và ACA duyệt, giao cho bạn.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {assigned.map((r) => (
            <li
              key={r.id}
              className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-colors hover:border-[#6a5acd]/35"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-zinc-900">{r.studentName}</div>
                  <div className="mt-1 text-xs text-zinc-500">
                    {r.skill}
                    {" · "}
                    <span className="font-medium text-zinc-700">{dateLabel(r)}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="inline-flex rounded-full bg-[#efeaff] px-2.5 py-0.5 text-[11px] font-semibold text-[#4b3fb3]">
                      {r.examTime ?? "—"} — Mock Test
                    </span>
                    {slotTs(r) >= startOfTodayTs ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-800">
                        Sắp tới
                      </span>
                    ) : (
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold uppercase text-zinc-600">
                        Đã qua
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-[10px] font-mono text-zinc-400">{r.id}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
