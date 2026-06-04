"use client";

import { useCallback, useEffect, useState } from "react";
import {
  COURSE_METADATA_UPDATE_EVENT,
  DEFAULT_COURSE_METADATA,
  getCourseMetadata,
  saveCourseMetadata,
  type CourseMetadata,
} from "@/lib/courseMetadata";

type Props = {
  portalLabel: string;
};

export function CourseMetadataEditorSection({ portalLabel }: Props) {
  const [form, setForm] = useState<CourseMetadata>(DEFAULT_COURSE_METADATA);
  const [saved, setSaved] = useState(false);

  const sync = useCallback(() => {
    setForm(getCourseMetadata());
  }, []);

  useEffect(() => {
    sync();
    const onUpdate = () => sync();
    window.addEventListener(COURSE_METADATA_UPDATE_EVENT, onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener(COURSE_METADATA_UPDATE_EVENT, onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, [sync]);

  const save = () => {
    saveCourseMetadata(form);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">
        Thông tin hiển thị trên trang Thông tin khóa học của học viên. {portalLabel} chỉnh tại đây
        sẽ cập nhật ngay (demo localStorage).
      </p>

      <div className="grid gap-4 rounded-2xl border border-primary/10 bg-white p-6 shadow-soft md:grid-cols-2">
        <label className="block md:col-span-2">
          <span className="text-xs font-bold uppercase tracking-wider text-muted">Tên khóa</span>
          <input
            value={form.course}
            onChange={(e) => setForm((f) => ({ ...f, course: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-primary/15 px-3 py-2 text-sm font-semibold"
          />
        </label>
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-wider text-muted">Giáo viên</span>
          <input
            value={form.instructor}
            onChange={(e) => setForm((f) => ({ ...f, instructor: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-primary/15 px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-wider text-muted">Phòng học</span>
          <input
            value={form.room}
            onChange={(e) => setForm((f) => ({ ...f, room: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-primary/15 px-3 py-2 text-sm"
          />
        </label>
        <label className="block md:col-span-2">
          <span className="text-xs font-bold uppercase tracking-wider text-muted">Mật khẩu Zoom</span>
          <input
            value={form.zoomPassword}
            onChange={(e) => setForm((f) => ({ ...f, zoomPassword: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-primary/15 px-3 py-2 text-sm"
          />
        </label>

        <div className="md:col-span-2">
          <span className="text-xs font-bold uppercase tracking-wider text-muted">Lịch học (mỗi dòng một buổi)</span>
          {form.schedule.map((line, i) => (
            <input
              key={i}
              value={line}
              onChange={(e) => {
                const schedule = [...form.schedule];
                schedule[i] = e.target.value;
                setForm((f) => ({ ...f, schedule }));
              }}
              className="mt-2 w-full rounded-xl border border-primary/15 px-3 py-2 text-sm"
            />
          ))}
        </div>

        <div className="md:col-span-2 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-muted">Chặng / khai giảng</span>
          {form.phases.map((phase, i) => (
            <div key={i} className="flex flex-col gap-2 sm:flex-row">
              <input
                value={phase.name}
                onChange={(e) => {
                  const phases = [...form.phases];
                  phases[i] = { ...phases[i], name: e.target.value };
                  setForm((f) => ({ ...f, phases }));
                }}
                placeholder="Tên chặng"
                className="flex-1 rounded-xl border border-primary/15 px-3 py-2 text-sm"
              />
              <input
                value={phase.date}
                onChange={(e) => {
                  const phases = [...form.phases];
                  phases[i] = { ...phases[i], date: e.target.value };
                  setForm((f) => ({ ...f, phases }));
                }}
                placeholder="Ngày"
                className="flex-1 rounded-xl border border-primary/15 px-3 py-2 text-sm"
              />
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={save}
        className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary/90"
      >
        {saved ? "Đã lưu ✓" : "Lưu thông tin khóa"}
      </button>
    </div>
  );
}
