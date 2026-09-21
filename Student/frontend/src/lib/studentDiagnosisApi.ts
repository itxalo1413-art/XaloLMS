import { apiFetch, getAuthToken } from "@/lib/auth";
import type { StudentDiagnosisRecord } from "@/lib/studentDiagnosisStore";

export type LiveSkillScores = {
  listening: number;
  reading: number;
  writing: number;
  speaking: number;
  overall: number;
};

export type ScoreHistoryItem = {
  cycleIndex: number;
  label: string;
  classCode: string;
  className?: string;
  entranceScores: LiveSkillScores;
  finalScores: LiveSkillScores;
  hasFinal: boolean;
  deltaOverall: number | null;
  isCurrent: boolean;
  status: 'completed' | 'in_progress' | 'upcoming';
};

export type LiveStudentDiagnosis = {
  name: string;
  email: string;
  phone: string;
  classId: string;
  aim?: string;
  examDate?: string;
  examCountdownAnchor?: string;
  scores: LiveSkillScores;
  finalScores: LiveSkillScores;
  scoreHistory?: ScoreHistoryItem[];
  cycles?: any[];
  diagnosisData?: Partial<StudentDiagnosisRecord> | null;
};

export async function fetchLiveStudentDiagnosis(): Promise<LiveStudentDiagnosis | null> {
  if (!getAuthToken()) {
    return null;
  }
  let response: Response;
  try {
    response = await apiFetch("/api/student/profile/diagnosis", { method: "GET" });
  } catch {
    // Backend không kết nối được: coi như chưa có dữ liệu live.
    return null;
  }
  // 401 = chưa đăng nhập (bình thường khi tắt auth); không phải lỗi cần ném ra.
  if (!response.ok) {
    return null;
  }
  const text = await response.text();
  if (!text || !text.trim()) {
    return null;
  }
  try {
    const data = JSON.parse(text);
    return data || null;
  } catch {
    return null;
  }
}
