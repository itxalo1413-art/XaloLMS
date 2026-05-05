"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  loadMockTestRequests,
  saveMockTestRequests,
  type MockTestRequest,
  MOCK_TEST_UPDATE_EVENT,
} from "@/lib/mockTestRequests";
import { MOCK_TEST_TEACHER_OPTIONS } from "@/lib/mockTestTeacherNames";
import { MockTestTeacherSchedulePreview } from "./MockTestTeacherSchedulePreview";

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

export function MockTestApprovalSection() {
  const [rows, setRows] = useState<MockTestRequest[]>([]);
  const [timeById, setTimeById] = useState<Record<string, string>>({});
  const [teacherById, setTeacherById] = useState<Record<string, string>>({});

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

  const pending = useMemo(
    () => rows.filter((r) => r.status === "pending"),
    [rows],
  );

  const done = useMemo(
    () =>
      rows
        .filter((r) => r.status === "approved" || r.status === "rejected")
        .sort((a, b) => (a.reviewedAt && b.reviewedAt && a.reviewedAt < b.reviewedAt ? 1 : -1)),
    [rows],
  );

  const approve = (r: MockTestRequest) => {
    const examTime =
      timeById[r.id]?.trim() || r.examTime || "09:00";
    const examTeacher =
      teacherById[r.id]?.trim() ||
      r.examTeacher ||
      MOCK_TEST_TEACHER_OPTIONS[0];

    const next = loadMockTestRequests().map((x) =>
      x.id === r.id
        ? {
            ...x,
            status: "approved" as const,
            examTime,
            examTeacher,
            reviewedAt: new Date().toISOString(),
          }
        : x,
    );
    saveMockTestRequests(next);
  };

  const reject = (r: MockTestRequest) => {
    if (!confirm(`Từ chối yêu cầu Mock Test của ${r.studentName}?`)) return;
    const next = loadMockTestRequests().map((x) =>
      x.id === r.id
        ? {
            ...x,
            status: "rejected" as const,
            reviewedAt: new Date().toISOString(),
          }
        : x,
    );
    saveMockTestRequests(next);
  };

  const dateLabel = (r: MockTestRequest) =>
    `${r.day} ${months[r.month] ?? `T${r.month + 1}`} ${r.year}`;

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-amber-200/80 bg-amber-50/40 p-5">
        <h2 className="text-sm font-bold text-amber-950">Chờ duyệt</h2>
        <p className="mt-1 text-xs text-amber-900/80">
          Xác nhận <strong>giờ thi</strong> và <strong>giáo viên test</strong> trước khi chấp
          nhận. Sau khi duyệt, lịch mới hiển thị trên lịch học viên.
        </p>
      </section>

      <MockTestTeacherSchedulePreview />

      {pending.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-500 shadow-sm">
          Hiện không có yêu cầu Mock Test nào chờ duyệt.
        </div>
      ) : (
        <div className="space-y-4">
          {pending.map((r) => (
            <div
              key={r.id}
              className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-bold text-zinc-900">
                    {r.studentName}
                  </div>
                  <div className="mt-1 text-xs text-zinc-500">
                    {r.skill} · {dateLabel(r)}
                  </div>
                  <div className="mt-1 text-[10px] font-mono text-zinc-400">
                    ID: {r.id}
                  </div>
                </div>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-[10px] font-bold uppercase text-amber-900">
                  Chờ duyệt
                </span>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="text-[10px] font-bold uppercase text-zinc-500">
                    Giờ thi (duyệt)
                  </label>
                  <input
                    type="time"
                    value={timeById[r.id] ?? "09:00"}
                    onChange={(e) =>
                      setTimeById((m) => ({ ...m, [r.id]: e.target.value }))
                    }
                    className="mt-2 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-[#6a5acd]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold uppercase text-zinc-500">
                    Giáo viên test
                  </label>
                  <select
                    value={
                      teacherById[r.id] ?? MOCK_TEST_TEACHER_OPTIONS[0]
                    }
                    onChange={(e) =>
                      setTeacherById((m) => ({ ...m, [r.id]: e.target.value }))
                    }
                    className="mt-2 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-[#6a5acd]"
                  >
                    {MOCK_TEST_TEACHER_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-wrap items-end gap-2 lg:justify-end">
                  <button
                    type="button"
                    onClick={() => reject(r)}
                    className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
                  >
                    Từ chối
                  </button>
                  <button
                    type="button"
                    onClick={() => approve(r)}
                    className="rounded-xl bg-[#6a5acd] px-5 py-2 text-sm font-semibold text-white hover:bg-[#5b4ec0]"
                  >
                    Duyệt & gửi lịch
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <section>
        <h2 className="text-sm font-bold text-zinc-900">Đã xử lý gần đây</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Các yêu cầu đã duyệt / từ chối (demo — lưu cục bộ).
        </p>
        <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-100 bg-zinc-50 text-[10px] font-bold uppercase text-zinc-500">
              <tr>
                <th className="px-4 py-3">Học sinh</th>
                <th className="px-4 py-3">Kỹ năng · Ngày</th>
                <th className="px-4 py-3">Kết quả</th>
                <th className="hidden px-4 py-3 lg:table-cell">Chi tiết duyệt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {done.slice(0, 12).map((r) => (
                <tr key={r.id} className="hover:bg-[#efeaff]/30">
                  <td className="px-4 py-3 font-semibold text-zinc-900">
                    {r.studentName}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {r.skill}
                    <br />
                    <span className="text-xs text-zinc-400">{dateLabel(r)}</span>
                  </td>
                  <td className="px-4 py-3">
                    {r.status === "approved" ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold uppercase text-emerald-800">
                        Đã duyệt
                      </span>
                    ) : (
                      <span className="rounded-full bg-zinc-100 px-2 py-1 text-[10px] font-bold uppercase text-zinc-600">
                        Từ chối
                      </span>
                    )}
                  </td>
                  <td className="hidden px-4 py-3 text-xs text-zinc-600 lg:table-cell">
                    {r.status === "approved" ? (
                      <>
                        {r.examTime} · {r.examTeacher}
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {done.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-zinc-500">
              Chưa có lịch sử.
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
