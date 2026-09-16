"use client";

import { useCallback, useEffect, useState } from "react";
import { AVATAR_IMAGE_ACCEPT, isAllowedAvatarImageFile } from "@/lib/avatarImage";
import {
  DEFAULT_STUDENT_PROFILE,
  getStudentProfile,
  registerStudentInfoCache,
  saveStudentProfile,
  type StudentProfile,
} from "@/lib/studentProfile";
import { updateStudentProfile } from "@/lib/studentProfileApi";
import { resolveActiveStudentId } from "@/lib/studentRoster";
import { fetchAcaStudent, saveStudentIdentityForAca, updateAcaStudent } from "@/lib/acaManagementApi";

type Props = {
  portalLabel: string;
  studentId: string;
  studentData?: {
    name?: string;
    email?: string;
    phone?: string;
    dob?: string;
    zodiac?: string;
    avatarUrl?: string;
    examDate?: string;
  };
};

const inputClass =
  "w-full rounded-xl border border-primary/15 px-3 py-2 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10";

export function StudentProfileEditorSection({ portalLabel, studentId, studentData }: Props) {
  const [profile, setProfile] = useState<StudentProfile>(DEFAULT_STUDENT_PROFILE);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isActiveStudent = studentId === resolveActiveStudentId();

  const applyIdentity = useCallback((current: StudentProfile, data?: Props["studentData"]) => {
    const next = { ...current };
    if (data) {
      if (data.name) next.name = data.name;
      if (data.email) next.email = data.email;
      if (data.phone) next.phone = data.phone;
      if (data.dob) next.dob = data.dob;
      if (data.zodiac) next.zodiac = data.zodiac;
      if (data.avatarUrl) next.avatarUrl = data.avatarUrl;
      if (data.examDate !== undefined && String(data.examDate).trim()) {
        next.examDate = String(data.examDate).trim();
      }
    }
    return next;
  }, []);

  const sync = useCallback(() => {
    if (studentData) {
      registerStudentInfoCache(studentId, studentData);
    }
    setProfile(applyIdentity(getStudentProfile(studentId), studentData));
  }, [studentId, studentData, applyIdentity]);

  useEffect(() => {
    sync();
    let alive = true;
    void fetchAcaStudent(studentId).then((fresh) => {
      if (!alive || !fresh) return;
      setProfile((prev) =>
        applyIdentity(prev, {
          name: fresh.name,
          email: fresh.email,
          phone: fresh.phone,
          dob: fresh.dob,
          zodiac: fresh.zodiac,
          avatarUrl: fresh.avatarUrl,
          examDate: fresh.examDate,
        }),
      );
    });
    return () => {
      alive = false;
    };
  }, [studentId, studentData, sync, applyIdentity]);

  const save = async () => {
    setError(null);
    const next = { ...profile };
    try {
      if (studentId) {
        await updateAcaStudent(studentId, {
          name: next.name,
          email: next.email,
          phone: next.phone,
          dob: next.dob,
          zodiac: next.zodiac,
          avatarUrl: next.avatarUrl,
          examDate: next.examDate,
        });
      }
      const email = next.email.trim();
      if (email || studentId) {
        await saveStudentIdentityForAca(email || studentData?.email || "", {
          studentId,
          name: next.name,
          email: next.email,
          phone: next.phone,
          dob: next.dob,
          zodiac: next.zodiac,
          avatarUrl: next.avatarUrl,
          examDate: next.examDate,
        });
      }
      if (isActiveStudent) {
        await updateStudentProfile(next);
      }
      saveStudentProfile(next, studentId);
      setProfile(next);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không lưu được hồ sơ");
    }
  };

  const onAvatarFile = (file: File | null) => {
    if (!file || !isAllowedAvatarImageFile(file)) {
      if (file) window.alert("Chỉ chấp nhận ảnh: JPG, PNG, GIF, WebP, SVG.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setProfile((p) => ({ ...p, avatarUrl: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">
        Hồ sơ hiển thị trên trang chủ học viên <strong>{profile.name || "Học viên"}</strong>. {portalLabel}{" "}
        chỉnh tại đây (theo từng học viên).
      </p>
      <div className="grid gap-4 rounded-2xl border border-primary/10 bg-white p-6 shadow-soft md:grid-cols-2">
        <div className="flex items-center gap-4 md:col-span-2">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-primary/15 bg-primary/5">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xl font-black text-primary">
                {(profile.name || "H").slice(0, 1)}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-muted">
                URL ảnh đại diện
              </span>
              <input
                className={`mt-1 ${inputClass}`}
                value={profile.avatarUrl}
                onChange={(e) => setProfile((p) => ({ ...p, avatarUrl: e.target.value }))}
                placeholder="https://... hoặc tải file bên dưới"
              />
            </label>
            <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-bold text-primary">
              <input
                type="file"
                accept={AVATAR_IMAGE_ACCEPT}
                className="hidden"
                onChange={(e) => {
                  onAvatarFile(e.target.files?.[0] ?? null);
                  e.target.value = "";
                }}
              />
              Tải ảnh từ máy
            </label>
          </div>
        </div>
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-wider text-muted">Họ và tên</span>
          <input
            className={`mt-1 ${inputClass}`}
            value={profile.name}
            onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
          />
        </label>
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-wider text-muted">Email</span>
          <input
            className={`mt-1 ${inputClass}`}
            value={profile.email}
            onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
          />
        </label>
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-wider text-muted">Số điện thoại</span>
          <input
            className={`mt-1 ${inputClass}`}
            value={profile.phone}
            onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
          />
        </label>
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-wider text-muted">Ngày sinh</span>
          <input
            className={`mt-1 ${inputClass}`}
            value={profile.dob}
            onChange={(e) => setProfile((p) => ({ ...p, dob: e.target.value }))}
            placeholder="20/08/2006"
          />
        </label>
        <label className="block md:col-span-2">
          <span className="text-xs font-bold uppercase tracking-wider text-muted">Cung hoàng đạo</span>
          <input
            className={`mt-1 ${inputClass}`}
            value={profile.zodiac}
            onChange={(e) => setProfile((p) => ({ ...p, zodiac: e.target.value }))}
            placeholder="Tự nhập nếu có"
          />
        </label>

        <div className="md:col-span-2 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void save()}
            className="rounded-xl bg-primary px-5 py-2.5 text-xs font-black uppercase tracking-widest text-white hover:bg-primary/90"
          >
            Lưu hồ sơ
          </button>
          {saved ? (
            <span className="text-xs font-bold text-success">Đã lưu — học viên thấy trên Thông tin học viên.</span>
          ) : null}
          {error ? <span className="text-xs font-bold text-rose-600">{error}</span> : null}
        </div>
      </div>
    </div>
  );
}
