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

function loadAll(): GuestDiagnosisLead[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedDemoIfEmpty();
    const data = JSON.parse(raw) as GuestDiagnosisLead[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveAll(rows: GuestDiagnosisLead[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  dispatchUpdate();
}

function seedDemoIfEmpty(): GuestDiagnosisLead[] {
  const demo: GuestDiagnosisLead[] = [
    {
      id: "lead-demo-1",
      name: "Dương Ngọc Khôi Nguyên",
      phone: "0947 188 794",
      aim: "7.5 IELTS",
      submittedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      status: "new",
      note: "",
    },
  ];
  saveAll(demo);
  return demo;
}

export function listGuestDiagnosisLeads(): GuestDiagnosisLead[] {
  const rows = loadAll();
  if (rows.length === 0) return seedDemoIfEmpty();
  return [...rows].sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
  );
}

export function submitGuestDiagnosisLead(input: {
  name: string;
  phone: string;
  aim: string;
}): GuestDiagnosisLead {
  const row: GuestDiagnosisLead = {
    id: `lead-${Date.now()}`,
    name: input.name.trim(),
    phone: input.phone.trim(),
    aim: input.aim.trim(),
    submittedAt: new Date().toISOString(),
    status: "new",
    note: "",
  };
  saveAll([row, ...loadAll()]);
  return row;
}

export function updateGuestDiagnosisLead(
  id: string,
  patch: Partial<Pick<GuestDiagnosisLead, "status" | "note" | "assignedClassId" | "assignedClassName">>,
): GuestDiagnosisLead {
  let updated: GuestDiagnosisLead | null = null;
  const next = loadAll().map((row) => {
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
  saveAll(next);
  return updated;
}
