"use client";

import { useCallback, useEffect, useState } from "react";
import { DailyNoteDisplay } from "@/components/student/DailyNoteDisplay";
import {
  DEFAULT_STUDENT_DAILY_NOTE,
  getStudentDailyNote,
  saveStudentDailyNote,
  STUDENT_DAILY_NOTE_UPDATE_EVENT,
  type StudentDailyNote,
} from "@/lib/studentDailyNote";

export function DailyNoteEditorSection() {
  const [form, setForm] = useState<StudentDailyNote>(DEFAULT_STUDENT_DAILY_NOTE);
  const [saved, setSaved] = useState(false);

  const sync = useCallback(() => {
    setForm(getStudentDailyNote());
  }, []);

  useEffect(() => {
    sync();
    const onUpdate = () => sync();
    window.addEventListener(STUDENT_DAILY_NOTE_UPDATE_EVENT, onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener(STUDENT_DAILY_NOTE_UPDATE_EVENT, onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, [sync]);

  const save = () => {
    saveStudentDailyNote({ word: form.word, meaning: form.meaning });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">
        Note hiển thị cho học viên (Word of the Day + giải nghĩa). Học viên thấy khi đăng nhập hoặc
        theo cấu hình popup trên LMS.
      </p>

      <div className="overflow-hidden rounded-2xl border border-primary/10 shadow-soft">
        <DailyNoteDisplay note={form} />
      </div>

      <div className="grid gap-4 rounded-2xl border border-primary/10 bg-white p-6 shadow-soft">
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-wider text-muted">Word of the day</span>
          <input
            value={form.word}
            onChange={(e) => setForm((f) => ({ ...f, word: e.target.value }))}
            placeholder="Clouds."
            className="mt-1 w-full rounded-xl border border-primary/15 px-3 py-2.5 text-sm font-bold text-foreground outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
          />
        </label>
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-wider text-muted">Giải nghĩa / ghi chú</span>
          <textarea
            value={form.meaning}
            onChange={(e) => setForm((f) => ({ ...f, meaning: e.target.value }))}
            rows={3}
            placeholder="there's divinity in the clouds."
            className="mt-1 w-full resize-y rounded-xl border border-primary/15 px-3 py-2.5 text-sm font-medium text-foreground outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
          />
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={save}
            className="rounded-xl bg-primary px-5 py-2.5 text-xs font-black uppercase tracking-widest text-white shadow-soft hover:bg-primary/90"
          >
            Lưu note
          </button>
          {saved ? (
            <span className="text-xs font-bold text-success">Đã lưu — học viên sẽ thấy nội dung mới.</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
