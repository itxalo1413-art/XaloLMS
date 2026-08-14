"use client";

import {
  fetchAcaTeacherProfiles,
  createAcaTeacherProfileApi,
  updateAcaTeacherProfileApi,
  deleteAcaTeacherProfileApi,
} from "./acaManagementApi";

export interface TeacherProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  skills: string[];
  status: "active" | "inactive";
  joinDate: string;
  notes?: string;
}

export const DEFAULT_TEACHERS: TeacherProfile[] = [
  {
    id: "tch-1",
    name: "Lê Nguyễn Khánh Thi",
    email: "khanhthi.le@xalo.edu.vn",
    phone: "0901 234 567",
    skills: ["Writing", "Speaking"],
    status: "active",
    joinDate: "15/01/2024",
    notes: "Chuyên sâu giảng dạy IELTS Writing Task 2 & Speaking Part 3",
  },
  {
    id: "tch-2",
    name: "Lê Thị Diệu Linh",
    email: "dieulinh.le@xalo.edu.vn",
    phone: "0912 345 678",
    skills: ["Reading", "Listening"],
    status: "active",
    joinDate: "01/03/2024",
    notes: "Phụ trách các lớp nâng band Reading chiến thuật",
  },
  {
    id: "tch-3",
    name: "Nghiêm Doãn Quỳnh Châu",
    email: "quynhchau.nghiem@xalo.edu.vn",
    phone: "0987 654 321",
    skills: ["Writing", "Speaking", "Reading"],
    status: "active",
    joinDate: "10/09/2023",
    notes: "Giảng viên chủ nhiệm lớp Chuyên sâu & Luyện đề",
  },
  {
    id: "tch-4",
    name: "Lê Minh Trang",
    email: "minhtrang.le@xalo.edu.vn",
    phone: "0934 567 890",
    skills: ["Writing", "Reading"],
    status: "active",
    joinDate: "20/02/2024",
    notes: "Chấm bài và feedback chi tiết Writing Task 1",
  },
  {
    id: "tch-5",
    name: "Phạm Hoàng An",
    email: "hoangan.pham@xalo.edu.vn",
    phone: "0945 678 901",
    skills: ["Speaking", "Listening"],
    status: "active",
    joinDate: "05/05/2024",
    notes: "Huấn luyện phát âm và giao tiếp tự nhiên",
  },
  {
    id: "tch-6",
    name: "Trần Thu Lan",
    email: "thulan.tran@xalo.edu.vn",
    phone: "0956 789 012",
    skills: ["Reading", "Writing"],
    status: "inactive",
    joinDate: "12/08/2023",
    notes: "Đang tạm nghỉ thai sản",
  },
  {
    id: "tch-7",
    name: "Grader",
    email: "grader@xalo.edu.vn",
    phone: "024 777 999",
    skills: ["Quản lý", "Chấm bài Writing & Speaking"],
    status: "active",
    joinDate: "01/01/2023",
    notes: "Bộ phận Grader & Giám sát chất lượng chấm bài",
  },
];

const LOCAL_STORAGE_KEY = "xalo_aca_teacher_profiles_v2";

export async function fetchTeacherProfilesAsync(): Promise<TeacherProfile[]> {
  try {
    const fromDb = await fetchAcaTeacherProfiles();
    if (Array.isArray(fromDb) && fromDb.length > 0) {
      saveLocalTeacherProfiles(fromDb);
      return fromDb;
    }
  } catch (err) {
    console.warn("Backend API fetch for teacher profiles failed, using local storage fallback:", err);
  }
  return getLocalTeacherProfiles();
}

export function getLocalTeacherProfiles(): TeacherProfile[] {
  if (typeof window === "undefined") return DEFAULT_TEACHERS;
  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_TEACHERS));
      return DEFAULT_TEACHERS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (err) {
    console.error("Error reading teacher profiles from localStorage:", err);
  }
  return DEFAULT_TEACHERS;
}

export function saveLocalTeacherProfiles(profiles: TeacherProfile[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(profiles));
  } catch (err) {
    console.error("Error saving teacher profiles locally:", err);
  }
}

export async function addTeacherProfileAsync(data: Omit<TeacherProfile, "id">): Promise<TeacherProfile> {
  const newId = `tch-${Date.now()}`;
  const payload = { ...data, id: newId };

  try {
    const res = await createAcaTeacherProfileApi(payload);
    const current = getLocalTeacherProfiles();
    const updated = [res, ...current.filter((t) => t.id !== res.id)];
    saveLocalTeacherProfiles(updated);
    return res;
  } catch (err) {
    console.warn("Failed to create teacher profile on backend DB, saving locally:", err);
    const current = getLocalTeacherProfiles();
    const updated = [payload, ...current];
    saveLocalTeacherProfiles(updated);
    return payload;
  }
}

export async function updateTeacherProfileAsync(id: string, data: Partial<TeacherProfile>): Promise<TeacherProfile | null> {
  try {
    const res = await updateAcaTeacherProfileApi(id, data);
    const current = getLocalTeacherProfiles();
    const index = current.findIndex((t) => t.id === id);
    if (index >= 0) {
      current[index] = { ...current[index], ...res };
    } else {
      current.unshift(res);
    }
    saveLocalTeacherProfiles(current);
    return res;
  } catch (err) {
    console.warn("Failed to update teacher profile on backend DB, updating locally:", err);
    const current = getLocalTeacherProfiles();
    const index = current.findIndex((t) => t.id === id);
    if (index < 0) return null;
    const updatedProfile = { ...current[index], ...data };
    current[index] = updatedProfile;
    saveLocalTeacherProfiles(current);
    return updatedProfile;
  }
}

export async function deleteTeacherProfileAsync(id: string): Promise<boolean> {
  try {
    await deleteAcaTeacherProfileApi(id);
    const current = getLocalTeacherProfiles();
    const filtered = current.filter((t) => t.id !== id);
    saveLocalTeacherProfiles(filtered);
    return true;
  } catch (err) {
    console.warn("Failed to delete teacher profile on backend DB, deleting locally:", err);
    const current = getLocalTeacherProfiles();
    const filtered = current.filter((t) => t.id !== id);
    saveLocalTeacherProfiles(filtered);
    return true;
  }
}
