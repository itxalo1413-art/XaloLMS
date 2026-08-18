import {
  canUseAcaApi,
  createGuestDiagnosisLeadApi,
  deleteGuestDiagnosisLeadApi,
  fetchGuestDiagnosisLeadsApi,
  updateGuestDiagnosisLeadApi,
} from "@/lib/acaManagementApi";

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
      // fallthrough to local
    }
  }
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
  saveLocal(loadLocal().filter((r) => r.id !== id));
}
