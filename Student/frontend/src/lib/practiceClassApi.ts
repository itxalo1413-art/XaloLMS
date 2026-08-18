import { apiFetch, getAuthToken, isAuthDisabled } from "@/lib/auth";
import type {
  PracticeClassSlot,
  PracticeSlotId,
  PracticeSlotRegistration,
  PracticeSlotScheduleOverride,
} from "@/lib/practiceClass";

export type PracticeScheduleResponse = {
  weekRangeLabel: string;
  updatedAt: string | null;
  zoomId: string;
  zoomPassword: string;
  slots: PracticeClassSlot[];
};

export type PracticeRegistrationsResponse = {
  registrations: PracticeSlotRegistration[];
};

export function canUsePracticeClassApi(): boolean {
  return !isAuthDisabled() && Boolean(getAuthToken());
}

async function parseJson<T>(response: Response): Promise<T> {
  if (response.status === 401) {
    throw new Error("UNAUTHORIZED");
  }
  if (!response.ok) {
    let message = `Practice class API failed (${response.status})`;
    try {
      const body = (await response.json()) as { message?: string | string[] };
      if (typeof body.message === "string") message = body.message;
      else if (Array.isArray(body.message)) message = body.message.join(", ");
    } catch {
      // ignore
    }
    throw new Error(message);
  }
  return (await response.json()) as T;
}

export async function fetchPracticeScheduleForStudent(): Promise<PracticeScheduleResponse> {
  const response = await apiFetch("/api/student/practice-class/schedule", {
    method: "GET",
  });
  return parseJson(response);
}

export async function fetchPracticeScheduleForAca(): Promise<PracticeScheduleResponse> {
  const response = await apiFetch("/api/aca/practice-class/schedule", {
    method: "GET",
  });
  return parseJson(response);
}

export async function savePracticeScheduleForAca(
  weekRangeLabel: string,
  slots: Record<PracticeSlotId, PracticeSlotScheduleOverride>,
): Promise<PracticeScheduleResponse> {
  const response = await apiFetch("/api/aca/practice-class/schedule", {
    method: "PUT",
    body: JSON.stringify({ weekRangeLabel, slots }),
  });
  return parseJson(response);
}

export async function fetchPracticeRegistrations(): Promise<PracticeRegistrationsResponse> {
  const response = await apiFetch("/api/student/practice-class/registrations", {
    method: "GET",
  });
  const data = await parseJson<
    PracticeSlotRegistration[] | { registrations: PracticeSlotRegistration[] }
  >(response);
  const registrations = Array.isArray(data) ? data : (data?.registrations ?? []);
  return { registrations };
}

export async function registerPracticeSlotApi(
  slotId: PracticeSlotId,
): Promise<PracticeSlotRegistration> {
  const response = await apiFetch("/api/student/practice-class/registrations", {
    method: "POST",
    body: JSON.stringify({ slotId }),
  });
  const data = await parseJson<{ registration: PracticeSlotRegistration }>(response);
  return data.registration;
}

export async function unregisterPracticeSlotApi(slotId: PracticeSlotId): Promise<void> {
  const response = await apiFetch(
    `/api/student/practice-class/registrations/${slotId}`,
    { method: "DELETE" },
  );
  await parseJson(response);
}

export type PracticeRegistrationAcaRow = {
  id: string;
  studentId: string;
  studentName: string;
  slotId: PracticeSlotId;
  slotTitle: string;
  slotSchedule: string;
  registeredAt: string;
  linkFolder?: string;
  scoreR?: string;
  scoreL?: string;
  scoreW?: string;
};

export async function fetchPracticeRegistrationsForAca(): Promise<
  PracticeRegistrationAcaRow[]
> {
  const response = await apiFetch("/api/aca/practice-class/registrations", {
    method: "GET",
  });
  return parseJson(response);
}

export async function savePracticeZoomForAca(
  zoomId: string,
  zoomPassword: string,
): Promise<PracticeScheduleResponse> {
  const response = await apiFetch("/api/aca/practice-class/zoom", {
    method: "PUT",
    body: JSON.stringify({ zoomId, zoomPassword }),
  });
  return parseJson(response);
}

export async function updateStudentPracticeLinkFolderApi(
  studentId: string,
  linkFolder: string,
  asTeacher = false,
): Promise<{ linkFolder: string }> {
  const base = asTeacher
    ? `/api/teacher/practice-class/students/${encodeURIComponent(studentId)}/link-folder`
    : "/api/student/practice-class/link-folder";
  const response = await apiFetch(base, {
    method: "PUT",
    body: JSON.stringify({ linkFolder }),
  });
  return parseJson(response);
}

export async function updatePracticeSlotMaterialsApi(
  slotId: PracticeSlotId,
  materialsUrl: string,
): Promise<PracticeScheduleResponse> {
  const response = await apiFetch(
    `/api/teacher/practice-class/slots/${encodeURIComponent(slotId)}/materials`,
    {
      method: "PUT",
      body: JSON.stringify({ materialsUrl }),
    },
  );
  return parseJson(response);
}

export async function updateRegistrationDetailsApi(
  id: string,
  payload: { linkFolder?: string; scoreR?: string; scoreL?: string; scoreW?: string }
): Promise<PracticeRegistrationAcaRow> {
  const response = await apiFetch(`/api/aca/practice-class/registration/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return parseJson(response);
}
