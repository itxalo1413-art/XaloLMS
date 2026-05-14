import { type StudentProfile } from "@/lib/studentProfile";

const API_BASE =
  process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") ?? "http://localhost:5000";

async function parseResponse(response: Response): Promise<StudentProfile> {
  if (!response.ok) {
    throw new Error(`Profile API failed with status ${response.status}`);
  }
  return (await response.json()) as StudentProfile;
}

export async function fetchStudentProfile(): Promise<StudentProfile> {
  const response = await fetch(`${API_BASE}/api/student/profile`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  return parseResponse(response);
}

export async function updateStudentProfile(
  payload: StudentProfile,
): Promise<StudentProfile> {
  const response = await fetch(`${API_BASE}/api/student/profile`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return parseResponse(response);
}

export async function uploadStudentAvatar(file: File): Promise<StudentProfile> {
  const formData = new FormData();
  formData.append("avatar", file);
  const response = await fetch(`${API_BASE}/api/student/profile/avatar`, {
    method: "POST",
    body: formData,
  });
  return parseResponse(response);
}
