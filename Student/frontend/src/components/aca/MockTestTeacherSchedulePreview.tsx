"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  loadMockTestRequests,
  type MockTestRequest,
  MOCK_TEST_UPDATE_EVENT,
} from "@/lib/mockTestRequests";
import { MOCK_TEST_TEACHER_OPTIONS } from "@/lib/mockTestTeacherNames";

const PREVIEW_TEACHER_STORAGE_KEY = "lms_aca_mock_test_preview_teacher_v1";

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

export function MockTestTeacherSchedulePreview() {
  const [rows, setRows] = useState<MockTestRequest[]>([]);
  const [previewTeacher, setPreviewTeacher] = useState<string>(
    () => MOCK_TEST_TEACHER_OPTIONS[0],
  );

  const sync = useCallback(() => {
    setRows(loadMockTestRequests());
  }, []);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      sync();
      const saved = window.sessionStorage.getItem(PREVIEW_TEACHER_STORAGE_KEY);
      if (
        saved &&
        (MOCK_TEST_TEACHER_OPTIONS as readonly string[]).includes(saved)
      ) {
        setPreviewTeacher(saved);
      }
    });
    window.addEventListener(MOCK_TEST_UPDATE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      cancelled = true;
      window.removeEventListener(MOCK_TEST_UPDATE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [sync]);

  const onTeacherChange = (name: string) => {
    setPreviewTeacher(name);
    window.sessionStorage.setItem(PREVIEW_TEACHER_STORAGE_KEY, name);
  };

  const assigned = useMemo(() => {
    return rows
      .filter(
        (r) =>
          r.status === "approved" &&
          (r.examTeacher ?? "").trim() === previewTeacher.trim(),
      )
      .sort((a, b) => slotTs(a) - slotTs(b));
  }, [rows, previewTeacher]);

  const startOfTodayTs = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, []);

  return (
    <section className="rounded-2xl border border-[#6a5acd]/25 bg-[#efeaff]/30 p-5 shadow-sm">
      <h2 className="text-sm font-bold text-zinc-900">Xem lịch Mock Test theo giáo viên</h2>
      <p className="mt-1 text-xs leading-relaxed text-zinc-600">
        ACA chọn GV để xem các ca <strong className="text-zinc-800">đã duyệt</strong> được gán cho
        người đó — tương ứng với lịch hiển thị trên portal giáo viên (demo cùng dữ liệu
        localStorage).
      </p>
      <div className="mt-4">
        <label
          htmlFor="aca-mock-test-preview-teacher"
          className="text-[10px] font-bold uppercase tracking-wider text-zinc-500"
        >
          Giáo viên test
        </label>
        <select
          id="aca-mock-test-preview-teacher"
          value={previewTeacher}
          onChange={(e) => onTeacherChange(e.target.value)}
          className="mt-2 block w-full max-w-md rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm font-medium outline-none focus:border-[#6a5acd] sm:w-auto sm:min-w-[260px]"
        >
          {MOCK_TEST_TEACHER_OPTIONS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {assigned.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-zinc-200 bg-white/60 px-4 py-6 text-center text-sm text-zinc-500">
          Chưa có ca đã duyệt nào gán cho giáo viên này.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {assigned.map((r) => (
            <li
              key={r.id}
              className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm shadow-sm"
            >
              <div className="font-semibold text-zinc-900">{r.studentName}</div>
              <div className="mt-0.5 text-xs text-zinc-500">
                {r.skill} · {dateLabel(r)}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="inline-flex rounded-full bg-[#efeaff] px-2 py-0.5 text-[11px] font-semibold text-[#4b3fb3]">
                  {r.examTime ?? "—"}
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
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
