"use client";

import {
  canUseAcaApi,
  createEntranceBookingApi,
  deleteEntranceBookingApi,
  fetchEntranceBookingsApi,
  fetchAcaFreeSlots,
  updateAcaFreeSlot,
  updateEntranceBookingApi,
} from "@/lib/acaManagementApi";
import {
  deduplicateMockTestRequests,
  loadMockTestRequests,
  MOCK_TEST_STORAGE_KEY,
  MOCK_TEST_UPDATE_EVENT,
  type MockTestRequest,
} from "@/lib/mockTestRequests";
import { getGraderMeetLink } from "@/lib/graderMeetLinks";

export type EntranceTestType = "speaking" | "writing" | "both";
export type EntranceTestFormat = "online" | "offline";
export type EntranceTestStatus = "scheduled" | "in_progress" | "graded" | "cancelled";

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
  createdAt: string;
  slotId?: string;
}

const STORAGE_KEY = "xalo.sale.entrance_test_bookings.v1";
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
    if (!raw) return seedDemoIfEmpty();
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

function seedDemoIfEmpty(): EntranceTestBooking[] {
  const today = new Date();
  const d1 = new Date(today.getTime() + 86400000); // tomorrow
  const d2 = new Date(today.getTime() + 86400000 * 2);

  const demo: EntranceTestBooking[] = [
    {
      id: "ent-demo-1",
      candidateName: "Dương Ngọc Khôi Nguyên",
      candidatePhone: "0947 188 794",
      candidateEmail: "nguyenduong939705@gmail.com",
      leadId: "lead-demo-1",
      type: "speaking",
      format: "online",
      graderName: "Lê Nguyễn Khánh Thi",
      date: `${d1.getFullYear()}-${String(d1.getMonth() + 1).padStart(2, "0")}-${String(d1.getDate()).padStart(2, "0")}`,
      time: "19:00",
      day: d1.getDate(),
      month: d1.getMonth(),
      year: d1.getFullYear(),
      meetLink: getGraderMeetLink("Lê Nguyễn Khánh Thi") || "https://meet.google.com/xle-test-spe",
      examLink: "https://xalo.edu.vn/de-thi-speaking-entrance-01",
      note: "Học viên mục tiêu 7.5, test kỹ năng phản xạ Part 3",
      status: "scheduled",
      createdAt: new Date().toISOString(),
    },
    {
      id: "ent-demo-2",
      candidateName: "Trần Minh Anh",
      candidatePhone: "0912 345 678",
      type: "writing",
      format: "online",
      graderName: "Quản lý Grader",
      date: `${d2.getFullYear()}-${String(d2.getMonth() + 1).padStart(2, "0")}-${String(d2.getDate()).padStart(2, "0")}`,
      time: "14:30",
      day: d2.getDate(),
      month: d2.getMonth(),
      year: d2.getFullYear(),
      submissionLink: "https://docs.google.com/document/d/sample-writing-submission",
      note: "Bài viết Task 2 về Education. Cần chấm trước 17h.",
      status: "scheduled",
      createdAt: new Date().toISOString(),
    },
  ];

  saveAll(demo);
  return demo;
}

export async function listEntranceTestBookings(): Promise<EntranceTestBooking[]> {
  if (canUseAcaApi()) {
    try {
      const rows = await fetchEntranceBookingsApi();
      if (rows) return rows as EntranceTestBooking[];
    } catch {
      // fallthrough to local
    }
  }

  const rows = loadAll();
  if (rows.length === 0) return seedDemoIfEmpty();

  // Sync scores from mockTestRequests if available (local fallback only)
  const mockRequests = loadMockTestRequests();
  let updatedAny = false;

  const mapped = rows.map((b) => {
    const match = mockRequests.find(
      (m) =>
        (m.id === b.id || (m.studentName === b.candidateName && m.day === b.day && m.month === b.month)) &&
        m.score &&
        m.score !== "—"
    );
    if (match && match.score && match.score !== b.scoreSpeaking) {
      updatedAny = true;
      return { ...b, scoreSpeaking: match.score, status: "graded" as EntranceTestStatus };
    }
    return b;
  });

  if (updatedAny) saveAll(mapped);

  return [...mapped].sort(
    (a, b) => new Date(`${b.date}T${b.time || "00:00"}`).getTime() - new Date(`${a.date}T${a.time || "00:00"}`).getTime()
  );
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
      if (created?.id) booking = { ...booking, id: created.id };
    } catch (err) {
      console.warn("Could not create entrance booking via API:", err);
      const current = loadAll();
      saveAll([booking, ...current]);
    }
  } else {
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

  // 3. Mirror into MockTestRequests so ACA / Grader sees it on their test speaking schedule
  try {
    const mockRow: MockTestRequest = {
      id: booking.id,
      studentId: input.leadId || `guest-${input.candidatePhone.replace(/\s/g, "")}`,
      studentName: input.candidateName.trim(),
      skill: input.type === "writing" ? "Writing Entrance" : "Speaking Entrance",
      day,
      month,
      year,
      status: "approved",
      requestedAt: new Date().toISOString(),
      examTime: `${input.time} ${input.format === "online" ? "(Online)" : "(Offline)"}`,
      examTeacher: input.graderName.trim(),
      examLink: meetLink || input.examLink || "",
      note: input.note || `Entrance Test booked by SALE for ${input.candidatePhone}`,
    };

    if (typeof window !== "undefined") {
      const raw = window.localStorage.getItem(MOCK_TEST_STORAGE_KEY);
      let list: MockTestRequest[] = [];
      try {
        list = raw ? JSON.parse(raw) : [];
      } catch {}
      const deduped = deduplicateMockTestRequests([mockRow, ...list]);
      window.localStorage.setItem(MOCK_TEST_STORAGE_KEY, JSON.stringify(deduped));
      window.dispatchEvent(new Event(MOCK_TEST_UPDATE_EVENT));
    }
  } catch (err) {
    console.warn("Could not sync into mock test storage:", err);
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
      return updated as EntranceTestBooking;
    } catch (err) {
      console.warn("Could not update entrance booking via API:", err);
    }
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

  // Sync to mockTestRequests if status or scores changed
  if (patch.scoreSpeaking || patch.scoreWriting || patch.status) {
    try {
      if (typeof window !== "undefined") {
        const raw = window.localStorage.getItem(MOCK_TEST_STORAGE_KEY);
        if (raw) {
          const list: MockTestRequest[] = JSON.parse(raw);
          const nextMock = list.map((m) => {
            if (m.id === id) {
              return {
                ...m,
                score: patch.scoreSpeaking || m.score,
                status: patch.status === "cancelled" ? ("rejected" as const) : m.status,
              };
            }
            return m;
          });
          window.localStorage.setItem(MOCK_TEST_STORAGE_KEY, JSON.stringify(nextMock));
          window.dispatchEvent(new Event(MOCK_TEST_UPDATE_EVENT));
        }
      }
    } catch {}
  }

  return updated;
}

export async function cancelEntranceTestBooking(id: string): Promise<void> {
  const all = loadAll();
  const booking = all.find((b) => b.id === id);
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
