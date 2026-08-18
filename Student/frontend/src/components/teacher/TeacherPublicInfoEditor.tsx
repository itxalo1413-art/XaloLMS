"use client";

import { useEffect, useState } from "react";
import { getLoggedInTeacherName } from "@/lib/teacherIdentity";
import { getPortalProfile } from "@/lib/portalProfile";
import {
  getInstructorProfileExtra,
  saveInstructorProfileExtra,
  type InstructorProfileExtra,
} from "@/lib/instructorProfileStore";
import { resolveInstructorPublicProfile } from "@/lib/courseInstructorProfile";

const SKILL_OPTIONS = [
  "Listening",
  "Reading",
  "Writing",
  "Speaking",
  "Grammar",
  "Vocabulary",
  "IELTS Academic",
  "IELTS General",
];

export function TeacherPublicInfoEditor() {
  const portalGv = getPortalProfile("gv");
  const teacherName = getLoggedInTeacherName() || portalGv.name || "";

  const [form, setForm] = useState<InstructorProfileExtra>(() => {
    return (
      getInstructorProfileExtra(teacherName) ?? {
        ieltsBand: "8.0",
        specialties: ["Listening", "Reading", "Writing", "Speaking"],
        experience: "5+ năm kinh nghiệm giảng dạy IELTS",
        certifications: ["CELTA", "TESOL"],
        bio: "Chuyên đồng hành cùng học viên từ 5.5-6.5 lên 7.0+, tập trung chẩn đoán lỗi theo BCB.",
      }
    );
  });

  const [certInput, setCertInput] = useState(() => (form.certifications || []).join(", "));
  const [saved, setSaved] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    const existing = getInstructorProfileExtra(teacherName);
    if (existing) {
      setForm(existing);
      setCertInput((existing.certifications || []).join(", "));
    }
  }, [teacherName]);

  const handleToggleSkill = (skill: string) => {
    setForm((prev) => {
      const current = prev.specialties || [];
      const next = current.includes(skill)
        ? current.filter((s) => s !== skill)
        : [...current, skill];
      return { ...prev, specialties: next };
    });
  };

  const handleSave = () => {
    const certs = certInput
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);

    const payload: InstructorProfileExtra = {
      ...form,
      certifications: certs,
    };

    saveInstructorProfileExtra(teacherName, payload);
    saveInstructorProfileExtra(portalGv.name, payload);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  // Preview profile object
  const publicProfile = resolveInstructorPublicProfile(teacherName);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-base font-black text-foreground">
            Thông tin hiển thị cho Học viên
          </h3>
          <p className="text-xs text-muted font-medium mt-0.5">
            Thông tin này sẽ xuất hiện trong thẻ Giới thiệu Giảng viên khi học viên bấm vào tên bạn.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setPreviewOpen(!previewOpen)}
          className="inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3.5 py-2 text-xs font-bold text-primary hover:bg-primary/10 transition-all self-start sm:self-auto"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          {previewOpen ? "Ẩn xem trước" : "Xem trước thẻ học viên thấy"}
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-12 items-start">
        {/* Form editor */}
        <div className={`space-y-4 rounded-2xl border border-primary/10 bg-white p-6 shadow-soft ${previewOpen ? "md:col-span-7" : "md:col-span-12"}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
                Band điểm IELTS Overall
              </label>
              <input
                type="text"
                value={form.ieltsBand}
                onChange={(e) => setForm({ ...form, ieltsBand: e.target.value })}
                placeholder="vd. 8.0, 8.5"
                className="w-full rounded-xl border border-primary/15 px-3.5 py-2.5 text-sm font-bold text-foreground outline-none focus:border-primary/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
                Kinh nghiệm giảng dạy
              </label>
              <input
                type="text"
                value={form.experience}
                onChange={(e) => setForm({ ...form, experience: e.target.value })}
                placeholder="vd. 5+ năm luyện thi IELTS"
                className="w-full rounded-xl border border-primary/15 px-3.5 py-2.5 text-sm font-semibold text-foreground outline-none focus:border-primary/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-2">
              Kỹ năng chuyên môn phụ trách
            </label>
            <div className="flex flex-wrap gap-2">
              {SKILL_OPTIONS.map((skill) => {
                const active = (form.specialties || []).includes(skill);
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => handleToggleSkill(skill)}
                    className={`rounded-full px-3 py-1 text-xs font-bold transition-all ${
                      active
                        ? "bg-primary text-white shadow-xs"
                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                    }`}
                  >
                    {active ? `✓ ${skill}` : `+ ${skill}`}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
              Bằng cấp & Chứng chỉ (Phân cách bằng dấu phẩy)
            </label>
            <input
              type="text"
              value={certInput}
              onChange={(e) => setCertInput(e.target.value)}
              placeholder="vd. CELTA, TESOL, Thạc sĩ Ngôn ngữ Anh"
              className="w-full rounded-xl border border-primary/15 px-3.5 py-2.5 text-sm font-semibold text-foreground outline-none focus:border-primary/50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
              Giới thiệu bản thân & Phương pháp giảng dạy
            </label>
            <textarea
              rows={4}
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              placeholder="Nhập phần giới thiệu phong cách giảng dạy và thông điệp dành cho học viên..."
              className="w-full rounded-xl border border-primary/15 p-3.5 text-sm font-medium text-foreground outline-none focus:border-primary/50"
            />
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
              className="rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white hover:bg-primary/90 transition-all shadow-md"
            >
              {saved ? "Đã lưu thay đổi ✓" : "Lưu thông tin hiển thị"}
            </button>
            {saved && (
              <span className="text-xs font-bold text-emerald-600 animate-in fade-in">
                Đã đồng bộ với thẻ Giảng viên của học viên!
              </span>
            )}
          </div>
        </div>

        {/* Live Preview Card */}
        {previewOpen && (
          <div className="md:col-span-5 space-y-3 animate-in fade-in slide-in-from-right-2">
            <div className="text-xs font-black uppercase tracking-wider text-muted">
              Giao diện xem trước (Học viên nhìn thấy)
            </div>
            <div className="overflow-hidden rounded-2xl border border-primary/15 bg-card p-5 shadow-xl">
              <div className="flex items-center gap-3 pb-4 border-b border-primary/10">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-black text-primary">
                  {publicProfile.name
                    .split(" ")
                    .filter(Boolean)
                    .slice(-2)
                    .map((w) => w[0])
                    .join("")
                    .toUpperCase()}
                </div>
                <div>
                  <h4 className="text-base font-black text-foreground">{publicProfile.name}</h4>
                  <p className="text-xs font-bold text-primary">{publicProfile.title}</p>
                  <p className="text-[11px] font-semibold text-muted">IELTS {form.ieltsBand || "—"}</p>
                </div>
              </div>

              <div className="mt-4 space-y-3.5 text-xs">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-muted">Liên hệ</div>
                  <p className="font-semibold text-foreground mt-0.5">{portalGv.email}</p>
                  <p className="font-semibold text-foreground">{portalGv.phone}</p>
                </div>

                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-muted">Kỹ năng phụ trách</div>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {(form.specialties || []).map((s) => (
                      <span key={s} className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-muted">Kinh nghiệm</div>
                  <p className="font-medium text-foreground mt-0.5">{form.experience || "—"}</p>
                </div>

                {certInput && (
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-muted">Chứng chỉ</div>
                    <p className="font-medium text-foreground mt-0.5">{certInput}</p>
                  </div>
                )}

                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-muted">Giới thiệu</div>
                  <p className="font-medium leading-relaxed text-foreground mt-0.5">{form.bio || "—"}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
