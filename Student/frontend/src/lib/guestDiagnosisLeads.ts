import {
  canUseAcaApi,
  createGuestDiagnosisLeadApi,
  deleteGuestDiagnosisLeadApi,
  fetchGuestDiagnosisLeadApi,
  fetchGuestDiagnosisLeadPublicApi,
  fetchGuestDiagnosisLeadsApi,
  saveGuestLeadDiagnosisApi,
  updateGuestDiagnosisLeadApi,
} from "@/lib/acaManagementApi";
import { getAuthToken } from "@/lib/auth";
import {
  normalizeLeadDiagnosis,
  type LeadDiagnosisRecord,
} from "@/lib/leadDiagnosis";
import type { GuestDiagnosisRecord } from "@/lib/guestDiagnosisStore";
import { DEFAULT_GUEST_DIAGNOSIS } from "@/lib/guestDiagnosisStore";

export type GuestDiagnosisLeadStatus = "new" | "contacted" | "converted" | "closed";

export type GuestDiagnosisLead = {
  id: string;
  name: string;
  phone: string;
  aim: string;
  submittedAt: string;
  status: GuestDiagnosisLeadStatus;
  note: string;
  assignedClassId?: string;
  assignedClassName?: string;
  hasDiagnosis?: boolean;
};

const STORAGE_KEY = "xalo.guestDiagnosis.leads.v1";
export const GUEST_DIAGNOSIS_LEADS_EVENT = "xalo-guest-diagnosis-leads-updated";

export const GUEST_LEAD_STATUS_LABEL: Record<GuestDiagnosisLeadStatus, string> = {
  new: "Mới",
  contacted: "Đã liên hệ",
  converted: "Chốt học (Học viên)",
  closed: "Đóng",
};

function dispatchUpdate() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(GUEST_DIAGNOSIS_LEADS_EVENT));
}

function loadLocal(): GuestDiagnosisLead[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw) as GuestDiagnosisLead[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveLocal(rows: GuestDiagnosisLead[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  dispatchUpdate();
}

export async function listGuestDiagnosisLeads(): Promise<GuestDiagnosisLead[]> {
  if (canUseAcaApi()) {
    try {
      const rows = await fetchGuestDiagnosisLeadsApi();
      if (rows) return rows as GuestDiagnosisLead[];
    } catch {
      if (getAuthToken()) return [];
    }
  }
  if (getAuthToken()) return [];
  const rows = loadLocal();
  return [...rows].sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
  );
}

export async function submitGuestDiagnosisLead(input: {
  name: string;
  phone: string;
  aim: string;
}): Promise<GuestDiagnosisLead> {
  if (canUseAcaApi()) {
    const row = await createGuestDiagnosisLeadApi(input);
    dispatchUpdate();
    return row as GuestDiagnosisLead;
  }
  if (getAuthToken()) {
    throw new Error("Không thể tạo lead khi backend chưa sẵn sàng.");
  }
  const row: GuestDiagnosisLead = {
    id: `lead-${Date.now()}`,
    name: input.name.trim(),
    phone: input.phone.trim(),
    aim: input.aim.trim(),
    submittedAt: new Date().toISOString(),
    status: "new",
    note: "",
  };
  saveLocal([row, ...loadLocal()]);
  return row;
}

export async function updateGuestDiagnosisLead(
  id: string,
  patch: Partial<Pick<GuestDiagnosisLead, "status" | "note" | "assignedClassId" | "assignedClassName">>,
): Promise<GuestDiagnosisLead> {
  if (canUseAcaApi()) {
    const updated = await updateGuestDiagnosisLeadApi(id, patch);
    dispatchUpdate();
    return updated as GuestDiagnosisLead;
  }
  if (getAuthToken()) {
    throw new Error("Không thể cập nhật lead khi backend chưa sẵn sàng.");
  }
  let updated: GuestDiagnosisLead | null = null;
  const next = loadLocal().map((row) => {
    if (row.id !== id) return row;
    updated = {
      ...row,
      ...(patch.status !== undefined ? { status: patch.status } : {}),
      ...(patch.note !== undefined ? { note: patch.note } : {}),
      ...(patch.assignedClassId !== undefined ? { assignedClassId: patch.assignedClassId } : {}),
      ...(patch.assignedClassName !== undefined ? { assignedClassName: patch.assignedClassName } : {}),
    };
    return updated;
  });
  if (!updated) throw new Error("Không tìm thấy lead");
  saveLocal(next);
  return updated;
}

export async function deleteGuestDiagnosisLead(id: string): Promise<void> {
  if (canUseAcaApi()) {
    await deleteGuestDiagnosisLeadApi(id);
    dispatchUpdate();
    return;
  }
  if (getAuthToken()) {
    throw new Error("Không thể xóa lead khi backend chưa sẵn sàng.");
  }
  saveLocal(loadLocal().filter((r) => r.id !== id));
}

export async function getGuestLeadWithDiagnosis(id: string): Promise<{
  lead: GuestDiagnosisLead;
  diagnosis: LeadDiagnosisRecord;
}> {
  const row = await fetchGuestDiagnosisLeadApi(id);
  const lead: GuestDiagnosisLead = {
    id: row.id || row._id,
    name: row.name || "",
    phone: row.phone || "",
    aim: row.aim || "",
    submittedAt: row.submittedAt || new Date().toISOString(),
    status: (row.status || "new") as GuestDiagnosisLeadStatus,
    note: row.note || "",
    assignedClassId: row.assignedClassId,
    assignedClassName: row.assignedClassName,
    hasDiagnosis: Boolean(row.hasDiagnosis ?? row.diagnosis),
  };
  return {
    lead,
    diagnosis: normalizeLeadDiagnosis(lead, row.diagnosis ?? null),
  };
}

/** Guest portal (public): load BCB theo leadId. */
export async function getGuestLeadDiagnosisPublic(
  id: string,
): Promise<GuestDiagnosisRecord | null> {
  try {
    const row = await fetchGuestDiagnosisLeadPublicApi(id);
    const lead: GuestDiagnosisLead = {
      id: row.id,
      name: row.name || "",
      phone: "",
      aim: row.aim || "",
      submittedAt: new Date().toISOString(),
      status: "new",
      note: "",
      hasDiagnosis: row.hasDiagnosis,
    };
    if (!row.hasDiagnosis || !row.diagnosis) {
      // Chưa có BCB Sale điền → giữ template demo, gắn tên/aim lead
      return {
        ...structuredClone(DEFAULT_GUEST_DIAGNOSIS),
        name: lead.name || DEFAULT_GUEST_DIAGNOSIS.name,
        aim: lead.aim || DEFAULT_GUEST_DIAGNOSIS.aim,
      };
    }
    return normalizeLeadDiagnosis(lead, row.diagnosis as Partial<LeadDiagnosisRecord>);
  } catch {
    return null;
  }
}

export async function saveGuestLeadDiagnosis(
  id: string,
  diagnosis: Partial<GuestDiagnosisRecord | LeadDiagnosisRecord>,
): Promise<LeadDiagnosisRecord> {
  const { updatedAt: _u, ...rest } = diagnosis as LeadDiagnosisRecord & {
    updatedAt?: string;
  };
  const saved = await saveGuestLeadDiagnosisApi(id, {
    ...rest,
    updatedAt: new Date().toISOString(),
  });
  dispatchUpdate();
  const lead: GuestDiagnosisLead = {
    id: saved.id || id,
    name: saved.name || rest.name || "",
    phone: saved.phone || "",
    aim: saved.aim || rest.aim || "",
    submittedAt: saved.submittedAt || new Date().toISOString(),
    status: (saved.status || "new") as GuestDiagnosisLeadStatus,
    note: saved.note || "",
    hasDiagnosis: true,
  };
  return normalizeLeadDiagnosis(lead, saved.diagnosis ?? rest);
}
