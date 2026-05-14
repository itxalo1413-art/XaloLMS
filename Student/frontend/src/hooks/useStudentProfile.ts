"use client";

import * as React from "react";
import { fileToDataUrl } from "@/lib/fileToDataUrl";
import {
  loadStudentProfileFromStorage,
  saveStudentProfileToStorage,
  type StudentProfile,
} from "@/lib/studentProfile";
import {
  fetchStudentProfile,
  updateStudentProfile,
  uploadStudentAvatar,
} from "@/lib/studentProfileApi";

export function useStudentProfile() {
  const [profileOpen, setProfileOpen] = React.useState(false);
  const [profile, setProfile] = React.useState<StudentProfile>(() => loadStudentProfileFromStorage());
  const [draft, setDraft] = React.useState<StudentProfile>(() => loadStudentProfileFromStorage());
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
      })
      .catch(() => {
        if (!alive) return;
        setProfileStatus("Không kết nối được backend, đang dùng dữ liệu local.");
      });

    return () => {
      alive = false;
    };
  }, []);

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
      setProfileStatus("Đã lưu hồ sơ lên backend.");
      setProfileOpen(false);
    } catch {
      setProfile(draft);
      saveStudentProfileToStorage(draft);
      setProfileStatus("Backend lỗi, đã lưu tạm localStorage.");
      setProfileOpen(false);
    } finally {
      setProfileSaving(false);
    }
  }, [draft]);

  const onChangeDraft = React.useCallback((key: keyof StudentProfile, value: string) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }, []);

  const onUploadAvatar = React.useCallback(async (file: File | null) => {
    if (!file) return;
    setAvatarUploading(true);
    setProfileStatus(null);
    try {
      const remote = await uploadStudentAvatar(file);
      setDraft((prev) => ({ ...prev, avatarUrl: remote.avatarUrl }));
      setProfileStatus("Ảnh đã upload lên backend, bấm Lưu hồ sơ để xác nhận.");
    } catch {
      try {
        const localDataUrl = await fileToDataUrl(file);
        setDraft((prev) => ({ ...prev, avatarUrl: localDataUrl }));
        setProfileStatus("Upload backend lỗi, đang preview bằng dữ liệu local.");
      } catch {
        setProfileStatus("Không đọc được file ảnh.");
      }
    } finally {
      setAvatarUploading(false);
    }
  }, []);

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
