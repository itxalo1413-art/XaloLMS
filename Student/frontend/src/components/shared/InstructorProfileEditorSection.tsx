"use client";

import { useCallback, useEffect, useState } from "react";
import { getCourseMetadata, COURSE_METADATA_UPDATE_EVENT } from "@/lib/courseMetadata";
import {
  DEFAULT_INSTRUCTOR_PROFILES,
  getInstructorProfileExtras,
  INSTRUCTOR_PROFILES_UPDATE_EVENT,
  saveInstructorProfileExtra,
  type InstructorProfileExtra,
} from "@/lib/instructorProfileStore";

const inputClass =
  "w-full rounded-xl border border-primary/15 px-3 py-2 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10";

export function InstructorProfileEditorSection({ portalLabel }: { portalLabel: string }) {
  const [instructorName, setInstructorName] = useState(() => getCourseMetadata().instructor);
  const [form, setForm] = useState<InstructorProfileExtra>(
    () =>
      getInstructorProfileExtras()[getCourseMetadata().instructor] ??
      DEFAULT_INSTRUCTOR_PROFILES["Nghiêm Doãn Quỳnh Châu"],
  );
  const [saved, setSaved] = useState(false);

  const loadForName = useCallback((name: string) => {
    const extras = getInstructorProfileExtras();
    setForm(
      extras[name] ??
        DEFAULT_INSTRUCTOR_PROFILES[name] ?? {
          ieltsBand: "—",
          specialties: ["IELTS"],
          experience: "—",
          certifications: [],
          bio: "",
        },
    );
  }, []);

  useEffect(() => {
    const sync = () => {
      const name = getCourseMetadata().instructor;
      setInstructorName(name);
      loadForName(name);
    };
    sync();
    window.addEventListener(COURSE_METADATA_UPDATE_EVENT, sync);
    window.addEventListener(INSTRUCTOR_PROFILES_UPDATE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(COURSE_METADATA_UPDATE_EVENT, sync);
      window.removeEventListener(INSTRUCTOR_PROFILES_UPDATE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [loadForName]);

  const save = () => {
    saveInstructorProfileExtra(instructorName, form);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-4 rounded-2xl border border-primary/10 bg-white p-6 shadow-soft">
      <p className="text-sm text-muted">
        Hồ sơ giáo viên hiển thị khi học viên bấm tên GV trên Thông tin khóa học. Giáo viên hiện
        tại: <strong>{instructorName}</strong> (đổi tên ở Metadata khóa). {portalLabel}
      </p>
      <label className="block">
        <span className="text-xs font-bold uppercase tracking-wider text-muted">Band IELTS</span>
        <input
          className={`mt-1 ${inputClass}`}
          value={form.ieltsBand}
          onChange={(e) => setForm((f) => ({ ...f, ieltsBand: e.target.value }))}
        />
      </label>
      <label className="block">
        <span className="text-xs font-bold uppercase tracking-wider text-muted">
          Chuyên môn (phẩy)
        </span>
        <input
          className={`mt-1 ${inputClass}`}
          value={form.specialties.join(", ")}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              specialties: e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            }))
          }
        />
      </label>
      <label className="block">
        <span className="text-xs font-bold uppercase tracking-wider text-muted">Kinh nghiệm</span>
        <input
          className={`mt-1 ${inputClass}`}
          value={form.experience}
          onChange={(e) => setForm((f) => ({ ...f, experience: e.target.value }))}
        />
      </label>
      <label className="block">
        <span className="text-xs font-bold uppercase tracking-wider text-muted">
          Chứng chỉ (mỗi dòng một mục)
        </span>
        <textarea
          rows={2}
          className={`mt-1 ${inputClass}`}
          value={form.certifications.join("\n")}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              certifications: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean),
            }))
          }
        />
      </label>
      <label className="block">
        <span className="text-xs font-bold uppercase tracking-wider text-muted">Giới thiệu</span>
        <textarea
          rows={4}
          className={`mt-1 ${inputClass}`}
          value={form.bio}
          onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
        />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={save}
          className="rounded-xl bg-primary px-5 py-2.5 text-xs font-black uppercase tracking-widest text-white hover:bg-primary/90"
        >
          Lưu hồ sơ giáo viên
        </button>
        {saved ? <span className="text-xs font-bold text-success">Đã lưu.</span> : null}
      </div>
    </div>
  );
}
