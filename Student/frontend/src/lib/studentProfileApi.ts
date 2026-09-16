import { apiFetch } from "@/lib/auth";
import { normalizeFocusSkills } from "@/lib/focusSkills";
import {
  DEFAULT_STUDENT_PROFILE,
  type StudentProfile,
} from "@/lib/studentProfile";

async function parseResponse(response: Response): Promise<StudentProfile> {
  if (response.status === 401) {
    throw new Error("UNAUTHORIZED");
  }
  if (response.status === 403) {
    throw new Error("FORBIDDEN");
  }
  if (!response.ok) {
    let detail = "";
    try {
      const body = (await response.json()) as { message?: string | string[] };
      if (typeof body.message === "string") detail = body.message;
      else if (Array.isArray(body.message)) detail = body.message.join(", ");
    } catch {
      // ignore
    }
    throw new Error(
      detail
        ? `Profile API failed with status ${response.status}: ${detail}`
        : `Profile API failed with status ${response.status}`,
    );
  }
  const data = (await response.json()) as StudentProfile;
  const focusSkills = normalizeFocusSkills(data.focusSkills);
  return {
    ...data,
    focusSkills: focusSkills.length > 0 ? focusSkills : DEFAULT_STUDENT_PROFILE.focusSkills,
  };
}

export async function fetchStudentProfile(): Promise<StudentProfile> {
  const response = await apiFetch("/api/student/profile", { method: "GET" });
  return parseResponse(response);
}

export async function updateStudentProfile(
  payload: Partial<StudentProfile>,
): Promise<StudentProfile> {
  const response = await apiFetch("/api/student/profile", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return parseResponse(response);
}

export async function uploadStudentAvatar(file: File): Promise<StudentProfile> {
  const formData = new FormData();
  formData.append("avatar", file);
  const response = await apiFetch("/api/student/profile/avatar", {
    method: "POST",
    body: formData,
  });
  return parseResponse(response);
}
