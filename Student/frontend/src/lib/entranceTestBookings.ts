"use client";

import {
  canUseAcaApi,
  createEntranceBookingApi,
  fetchEntranceBookingsApi,
  fetchAcaFreeSlots,
  updateAcaFreeSlot,
  updateEntranceBookingApi,
} from "@/lib/acaManagementApi";
import { getAuthToken } from "@/lib/auth";
import { MOCK_TEST_UPDATE_EVENT } from "@/lib/mockTestRequests";
import { getGraderMeetLink } from "@/lib/graderMeetLinks";
import type { FinalTestBcbData } from "@/lib/finalTestArchive";

export type EntranceTestType = "speaking" | "writing" | "both";
export type EntranceTestFormat = "online" | "offline";
export type EntranceTestStatus = "scheduled" | "in_progress" | "graded" | "cancelled";

export type EntranceTestBcbData = FinalTestBcbData;

export interface EntranceTestBooking {
  id: string;
  candidateName: string;
  candidatePhone: string;
  candidateEmail?: string;
  leadId?: string;
  type: EntranceTestType;
  format: EntranceTestFormat;
  graderName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  day: number;
  month: number; // 0-indexed
  year: number;
  meetLink?: string;
  examLink?: string;
  submissionLink?: string;
  note?: string;
  status: EntranceTestStatus;
  scoreSpeaking?: string;
  scoreWriting?: string;
  feedback?: string;
  speakingCriteria?: {
    fluencyCoherence?: number;
    lexicalResource?: number;
    grammaticalRangeAccuracy?: number;
    pronunciation?: number;
  } | null;
  writingCriteria?: Record<string, unknown> | null;
  /** BCB chi tiết Entrance — cặp với Final.bcbData */
  bcbData?: EntranceTestBcbData | null;
  createdAt: string;
  slotId?: string;
  mockTestId?: string;
  writingSubmissionId?: string;
}

const STORAGE_KEY = "xalo.sale.entrance_test_bookings.v2";
export const ENTRANCE_BOOKINGS_UPDATE_EVENT = "xalo-entrance-bookings-updated";

export const ENTRANCE_STATUS_LABELS: Record<EntranceTestStatus, string> = {
  scheduled: "Đã xếp lịch",
  in_progress: "Đang chấm / Đang thi",
  graded: "Đã có điểm",
  cancelled: "Đã hủy",
};

export const ENTRANCE_TYPE_LABELS: Record<EntranceTestType, string> = {
  speaking: "Speaking Entrance",
  writing: "Writing Entrance",
  both: "Speaking + Writing Entrance",
};

function dispatchUpdate() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(ENTRANCE_BOOKINGS_UPDATE_EVENT));
}

function loadAll(): EntranceTestBooking[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw) as EntranceTestBooking[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveAll(rows: EntranceTestBooking[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  dispatchUpdate();
}

export async function listEntranceTestBookings(): Promise<EntranceTestBooking[]> {
  if (canUseAcaApi()) {
    try {
      const rows = await fetchEntranceBookingsApi();
      if (rows) return rows as EntranceTestBooking[];
    } catch {
      if (getAuthToken()) return [];
    }
  }
  if (getAuthToken()) return [];

  const rows = loadAll();
  return [...rows].sort(
    (a, b) => new Date(`${b.date}T${b.time || "00:00"}`).getTime() - new Date(`${a.date}T${a.time || "00:00"}`).getTime()
  );
}

function digitsPhone(value?: string) {
  return (value || "").replace(/\D/g, "");
}

/** Chỉ ca Entrance của học viên đang xem — không fallback sang booking người khác. */
export async function listMyEntranceTestBookings(identity: {
  name?: string;
  email?: string;
  phone?: string;
}): Promise<EntranceTestBooking[]> {
  const all = await listEntranceTestBookings();
  const name = identity.name?.trim().toLowerCase();
  const email = identity.email?.trim().toLowerCase();
  const phoneTail = digitsPhone(identity.phone).slice(-9);
  return all.filter((b) => {
    const bEmail = (b.candidateEmail || "").trim().toLowerCase();
    const bName = (b.candidateName || "").trim().toLowerCase();
    const bPhone = digitsPhone(b.candidatePhone);
    if (email && bEmail && bEmail === email) return true;
    if (phoneTail.length >= 8 && bPhone.endsWith(phoneTail)) return true;
    if (name && bName && bName === name) return true;
    return false;
  });
}

export async function createEntranceTestBooking(input: {
  candidateName: string;
  candidatePhone: string;
  candidateEmail?: string;
  leadId?: string;
  type: EntranceTestType;
  format: EntranceTestFormat;
  graderName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  meetLink?: string;
  examLink?: string;
  submissionLink?: string;
  note?: string;
  slotId?: string;
}): Promise<EntranceTestBooking> {
  const dateObj = new Date(input.date);
  const day = dateObj.getDate();
  const month = dateObj.getMonth();
  const year = dateObj.getFullYear();

  const id = `ent-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const meetLink = input.meetLink || getGraderMeetLink(input.graderName) || "";

  let booking: EntranceTestBooking = {
    id,
    candidateName: input.candidateName.trim(),
    candidatePhone: input.candidatePhone.trim(),
    candidateEmail: input.candidateEmail?.trim(),
    leadId: input.leadId,
    type: input.type,
    format: input.format,
    graderName: input.graderName.trim(),
    date: input.date,
    time: input.time,
    day,
    month,
    year,
    meetLink,
    examLink: input.examLink?.trim(),
    submissionLink: input.submissionLink?.trim(),
    note: input.note?.trim(),
    status: "scheduled",
    createdAt: new Date().toISOString(),
    slotId: input.slotId,
  };

  // 1. Save booking (API or local)
  if (canUseAcaApi()) {
    try {
      const created = await createEntranceBookingApi({ ...booking });
      // use API-assigned id if returned
      if (created?.id) booking = { ...booking, ...created, id: created.id };
    } catch (err) {
      console.warn("Could not create entrance booking via API:", err);
      if (getAuthToken()) throw err instanceof Error ? err : new Error("Không thể tạo lịch test đầu vào.");
      const current = loadAll();
      saveAll([booking, ...current]);
    }
  } else {
    if (getAuthToken()) {
      throw new Error("Không thể tạo lịch test đầu vào khi backend chưa sẵn sàng.");
    }
    const current = loadAll();
    saveAll([booking, ...current]);
  }

  // 2. Mark free slot as booked if slotId provided or matches
  try {
    const slots = await fetchAcaFreeSlots();
    const targetSlot = input.slotId
      ? slots.find((s) => s.id === input.slotId)
      : slots.find(
          (s) =>
            s.day === day &&
            s.month === month &&
            s.year === year &&
            s.time === input.time &&
            (s.teacherName ?? "").trim() === input.graderName.trim()
        );

    if (targetSlot) {
      await updateAcaFreeSlot(targetSlot.id, { status: "booked" });
    }
  } catch (err) {
    console.warn("Could not mark slot as booked in API:", err);
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(MOCK_TEST_UPDATE_EVENT));
  }

  return booking;
}

export async function updateEntranceTestBooking(
  id: string,
  patch: Partial<EntranceTestBooking>
): Promise<EntranceTestBooking> {
  if (canUseAcaApi()) {
    try {
      const updated = await updateEntranceBookingApi(id, patch as Record<string, unknown>);
      dispatchUpdate();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event(MOCK_TEST_UPDATE_EVENT));
      }
      return updated as EntranceTestBooking;
    } catch (err) {
      console.warn("Could not update entrance booking via API:", err);
      if (getAuthToken()) throw err instanceof Error ? err : new Error("Không thể cập nhật lịch test đầu vào.");
    }
  }
  if (getAuthToken()) {
    throw new Error("Không thể cập nhật lịch test đầu vào khi backend chưa sẵn sàng.");
  }

  const all = loadAll();
  let updated: EntranceTestBooking | null = null;

  const next = all.map((b) => {
    if (b.id !== id) return b;
    updated = { ...b, ...patch };
    return updated;
  });

  if (!updated) throw new Error("Không tìm thấy ca thi");
  saveAll(next);
  return updated;
}

export async function cancelEntranceTestBooking(id: string): Promise<void> {
  let booking: EntranceTestBooking | undefined;
  if (canUseAcaApi()) {
    try {
      const rows = await fetchEntranceBookingsApi();
      booking = (rows as EntranceTestBooking[] | null)?.find((b) => b.id === id);
    } catch {
      if (!getAuthToken()) {
        booking = loadAll().find((b) => b.id === id);
      }
    }
  } else {
    if (getAuthToken()) return;
    booking = loadAll().find((b) => b.id === id);
  }
  if (!booking) return;

  // Unmark free slot if exists
  if (booking.slotId || (booking.day && booking.time && booking.graderName)) {
    try {
      const slots = await fetchAcaFreeSlots();
      const targetSlot = booking.slotId
        ? slots.find((s) => s.id === booking.slotId)
        : slots.find(
            (s) =>
              s.day === booking.day &&
              s.month === booking.month &&
              s.year === booking.year &&
              s.time === booking.time &&
              (s.teacherName ?? "").trim() === booking.graderName.trim()
          );

      if (targetSlot) {
        await updateAcaFreeSlot(targetSlot.id, { status: "available" });
      }
    } catch (err) {
      console.warn("Could not unmark slot in API:", err);
    }
  }

  // Update status to cancelled
  await updateEntranceTestBooking(id, { status: "cancelled" });
}

/** Map booking → shape dùng chung với FinalTestBcbDrawer. */
export function entranceBookingAsBcbRecord(
  booking: EntranceTestBooking,
): import("@/lib/finalTestArchive").FinalTestRecord {
  const testType =
    booking.type === "writing"
      ? "writing"
      : booking.type === "both"
        ? "full_4_skills"
        : "speaking";
  return {
    id: booking.id,
    candidateName: booking.candidateName,
    candidatePhone: booking.candidatePhone,
    candidateEmail: booking.candidateEmail,
    classCode: "Entrance",
    className: "Entrance Test",
    testType,
    format: booking.format,
    examinerName: booking.graderName,
    date: booking.date,
    time: booking.time,
    day: booking.day,
    month: booking.month,
    year: booking.year,
    status: booking.status,
    meetLink: booking.meetLink,
    examLink: booking.examLink,
    submissionLink: booking.submissionLink,
    scoreSpeaking: booking.scoreSpeaking,
    scoreWriting: booking.scoreWriting,
    feedback: booking.feedback,
    bcbData: booking.bcbData || undefined,
    note: booking.note,
    createdAt: booking.createdAt,
  };
}
