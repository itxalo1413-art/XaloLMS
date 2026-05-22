"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useStudentAuth } from "@/contexts/StudentAuthContext";
import { clearAuthToken, isAuthDisabled } from "@/lib/auth";
import { isAllowedAvatarImageFile } from "@/lib/avatarImage";
import { fileToDataUrl } from "@/lib/fileToDataUrl";
import {
  DEFAULT_STUDENT_PROFILE,
  loadStudentProfileFromStorage,
  saveStudentProfileToStorage,
  type StudentProfile,
} from "@/lib/studentProfile";
import {
  fetchStudentProfile,
  updateStudentProfile,
  uploadStudentAvatar,
} from "@/lib/studentProfileApi";

function handleUnauthorized(router: ReturnType<typeof useRouter>) {
  if (isAuthDisabled()) return;
  clearAuthToken();
  router.replace("/login");
}

export function useStudentProfile() {
  const router = useRouter();
  const { user, refreshUser } = useStudentAuth();
  const [profileOpen, setProfileOpen] = React.useState(false);
  const [profile, setProfile] = React.useState<StudentProfile>(() => ({
    ...DEFAULT_STUDENT_PROFILE,
    name: user.name,
    email: user.email,
  }));
  const [draft, setDraft] = React.useState<StudentProfile>(profile);
  const [profileSaving, setProfileSaving] = React.useState(false);
  const [avatarUploading, setAvatarUploading] = React.useState(false);
  const [profileStatus, setProfileStatus] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;
    void fetchStudentProfile()
      .then((remote) => {
        if (!alive) return;
        setProfile(remote);
        setDraft(remote);
        saveStudentProfileToStorage(remote);
        setProfileStatus(null);
      })
      .catch((err) => {
        if (!alive) return;
        if (err instanceof Error && err.message === "UNAUTHORIZED") {
          handleUnauthorized(router);
          return;
        }
        const local = loadStudentProfileFromStorage();
        setProfile((prev) => ({
          ...local,
          name: user.name,
          email: user.email,
        }));
        setDraft((prev) => ({
          ...local,
          name: user.name,
          email: user.email,
        }));
        setProfileStatus("Không kết nối được backend, đang dùng dữ liệu local.");
      });

    return () => {
      alive = false;
    };
  }, [router, user.email, user.name]);

  const openProfile = React.useCallback(() => {
    setDraft(profile);
    setProfileStatus(null);
    setProfileOpen(true);
  }, [profile]);

  const closeProfile = React.useCallback(() => {
    setProfileOpen(false);
  }, []);

  const saveProfile = React.useCallback(async () => {
    setProfileSaving(true);
    setProfileStatus(null);
    try {
      const remote = await updateStudentProfile(draft);
      setProfile(remote);
      setDraft(remote);
      saveStudentProfileToStorage(remote);
      if (remote.name !== user.name) {
        await refreshUser();
      }
      setProfileStatus("Đã lưu hồ sơ.");
      setProfileOpen(false);
    } catch (err) {
      if (err instanceof Error && err.message === "UNAUTHORIZED") {
        handleUnauthorized(router);
        return;
      }
      setProfile(draft);
      saveStudentProfileToStorage(draft);
      setProfileStatus("Backend lỗi, đã lưu tạm localStorage.");
      setProfileOpen(false);
    } finally {
      setProfileSaving(false);
    }
  }, [draft, refreshUser, router, user.name]);

  const onChangeDraft = React.useCallback((key: keyof StudentProfile, value: string) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }, []);

  const onUploadAvatar = React.useCallback(
    async (file: File | null) => {
      if (!file) return;
      if (!isAllowedAvatarImageFile(file)) {
        window.alert("Chỉ chấp nhận ảnh: JPG, PNG, GIF, WebP, SVG.");
        return;
      }
      setAvatarUploading(true);
      setProfileStatus(null);
      try {
        const remote = await uploadStudentAvatar(file);
        setDraft((prev) => ({ ...prev, avatarUrl: remote.avatarUrl }));
        setProfile((prev) => ({ ...prev, avatarUrl: remote.avatarUrl }));
        setProfileStatus("File đã upload. Bấm Lưu hồ sơ nếu bạn vừa đổi thông tin khác.");
      } catch (err) {
        if (err instanceof Error && err.message === "UNAUTHORIZED") {
          handleUnauthorized(router);
          return;
        }
        try {
          const localDataUrl = await fileToDataUrl(file);
          setDraft((prev) => ({ ...prev, avatarUrl: localDataUrl }));
          setProfileStatus("Upload backend lỗi, đang preview bằng dữ liệu local.");
        } catch {
          setProfileStatus("Không đọc được file.");
        }
      } finally {
        setAvatarUploading(false);
      }
    },
    [router],
  );

  return {
    profile,
    openProfile,
    closeProfile,
    profileModalProps: {
      open: profileOpen,
      draft,
      onChangeDraft,
      onUploadAvatar,
      onClose: closeProfile,
      onSave: () => void saveProfile(),
      saving: profileSaving,
      uploadPending: avatarUploading,
      statusMessage: profileStatus,
    },
  };
}
