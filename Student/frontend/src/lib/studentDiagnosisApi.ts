import { apiFetch } from "@/lib/auth";

export type LiveStudentDiagnosis = {
  name: string;
  email: string;
  phone: string;
  classId: string;
  bcbLink: string;
  scores: {
    listening: number;
    reading: number;
    writing: number;
    speaking: number;
    overall: number;
  };
  finalScores: {
    listening: number;
    reading: number;
    writing: number;
    speaking: number;
    overall: number;
  };
};

export async function fetchLiveStudentDiagnosis(): Promise<LiveStudentDiagnosis | null> {
  const response = await apiFetch("/api/student/profile/diagnosis", { method: "GET" });
  if (response.status === 401) {
    throw new Error("UNAUTHORIZED");
  }
  if (!response.ok) {
    return null;
  }
  return response.json();
}
