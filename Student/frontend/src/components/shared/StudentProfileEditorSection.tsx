"use client";

import { useCallback, useEffect, useState } from "react";
import { AVATAR_IMAGE_ACCEPT, isAllowedAvatarImageFile } from "@/lib/avatarImage";
import {
  DEFAULT_STUDENT_PROFILE,
  getStudentProfile,
  registerStudentInfoCache,
  saveStudentProfile,
  STUDENT_PROFILE_UPDATE_EVENT,
  type StudentProfile,
} from "@/lib/studentProfile";
import { fetchStudentProfile, updateStudentProfile } from "@/lib/studentProfileApi";
import { resolveActiveStudentId } from "@/lib/studentRoster";

type Props = {
  portalLabel: string;
  studentId: string;
  studentData?: {
    name?: string;
    email?: string;
    phone?: string;
  };
};

const inputClass =
  "w-full rounded-xl border border-primary/15 px-3 py-2 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10";

export function StudentProfileEditorSection({ portalLabel, studentId, studentData }: Props) {
  const [profile, setProfile] = useState<StudentProfile>(DEFAULT_STUDENT_PROFILE);
  const [saved, setSaved] = useState(false);
  const isActiveStudent = studentId === resolveActiveStudentId();

  const sync = useCallback(() => {
    if (studentData) {
      registerStudentInfoCache(studentId, studentData);
    }
    const current = getStudentProfile(studentId);
    if (studentData) {
      if (studentData.name && (!current.name || current.name === "Học viên mới")) {
        current.name = studentData.name;
      }
      if (studentData.email && !current.email) {
        current.email = studentData.email;
      }
      if (studentData.phone && !current.phone) {
        current.phone = studentData.phone;
      }
    }
    setProfile(current);

    if (isActiveStudent) {
      void fetchStudentProfile()
        .then((remote) => {
          if (remote) {
            setProfile(remote);
            saveStudentProfile(remote, studentId);
          }
        })
        .catch(() => {});
    }
  }, [studentId, isActiveStudent, studentData]);

  useEffect(() => {
    sync();
    const onUpdate = (event: Event) => {
      const detail = (event as CustomEvent<{ studentId?: string }>).detail;
      if (!detail?.studentId || detail.studentId === studentId) sync();
    };
    window.addEventListener(STUDENT_PROFILE_UPDATE_EVENT, onUpdate);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(STUDENT_PROFILE_UPDATE_EVENT, onUpdate);
      window.removeEventListener("storage", sync);
    };
  }, [sync, studentId]);

  const save = async () => {
    saveStudentProfile(profile, studentId);
    if (isActiveStudent) {
      try {
        await updateStudentProfile(profile);
      } catch {
        /* local already saved */
      }
    }
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
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
            <span className="text-xs font-bold text-success">Đã lưu — học viên sẽ thấy khi đăng nhập đúng tài khoản.</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
