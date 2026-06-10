"use client";

import { useCallback, useEffect, useState } from "react";
import {
  COURSE_IMPORTANT_LINKS_UPDATE_EVENT,
  getCourseImportantLinks,
  saveCourseImportantLinks,
  type CourseImportantLink,
} from "@/lib/courseImportantLinks";

const inputClass =
  "w-full rounded-xl border border-primary/15 px-3 py-2 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10";

export function CourseImportantLinksEditorSection({ portalLabel }: { portalLabel: string }) {
  const [links, setLinks] = useState<CourseImportantLink[]>(() => getCourseImportantLinks());
  const [saved, setSaved] = useState(false);

  const sync = useCallback(() => setLinks(getCourseImportantLinks()), []);

  useEffect(() => {
    sync();
    window.addEventListener(COURSE_IMPORTANT_LINKS_UPDATE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(COURSE_IMPORTANT_LINKS_UPDATE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [sync]);

  const update = (id: string, patch: Partial<CourseImportantLink>) => {
    setLinks((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  };

  const save = () => {
    saveCourseImportantLinks(links);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-4 rounded-2xl border border-primary/10 bg-white p-6 shadow-soft">
      <p className="text-sm text-muted">
        Link thư mục hiển thị trong RLP trên Thông tin khóa học. {portalLabel} chỉnh tại đây.
      </p>
      {links.map((link) => (
        <div key={link.id} className="grid gap-3 rounded-xl border border-primary/10 bg-background/50 p-4 md:grid-cols-2">
          <label className="block md:col-span-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">Nhãn</span>
            <input
              className={`mt-1 ${inputClass}`}
              value={link.label}
              onChange={(e) => update(link.id, { label: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">Mô tả ngắn</span>
            <input
              className={`mt-1 ${inputClass}`}
              value={link.value}
              onChange={(e) => update(link.id, { value: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">URL (Drive / link)</span>
            <input
              className={`mt-1 ${inputClass}`}
              value={link.url}
              onChange={(e) => update(link.id, { url: e.target.value })}
              placeholder="https://..."
            />
          </label>
        </div>
      ))}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={save}
          className="rounded-xl bg-primary px-5 py-2.5 text-xs font-black uppercase tracking-widest text-white hover:bg-primary/90"
        >
          Lưu link thư mục
        </button>
        {saved ? <span className="text-xs font-bold text-success">Đã lưu.</span> : null}
      </div>
    </div>
  );
}
