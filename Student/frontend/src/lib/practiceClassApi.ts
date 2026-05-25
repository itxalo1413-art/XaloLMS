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
  const data = await parseJson<{ registrations: PracticeSlotRegistration[] }>(response);
  return { registrations: data.registrations ?? [] };
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
