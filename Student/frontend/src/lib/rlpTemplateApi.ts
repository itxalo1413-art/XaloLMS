import { parseApiJson } from "@/lib/apiBase";
import { apiFetch } from "@/lib/auth";

export interface RlpTemplateSessionItem {
  no: number;
  skill: string;
  contents: string;
  teacherNote?: string;
  lessonFileUrl?: string;
  homeworkFileUrl?: string;
  recordingUrl?: string;
}

export interface RlpTemplate {
  _id?: string;
  key: string;
  title: string;
  level: string;
  description: string;
  totalSessions: number;
  sessions: RlpTemplateSessionItem[];
  isDefault?: boolean;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateRlpTemplatePayload {
  key: string;
  title: string;
  level: string;
  description?: string;
  totalSessions?: number;
  sessions?: RlpTemplateSessionItem[];
  isDefault?: boolean;
}

export interface UpdateRlpTemplatePayload {
  title?: string;
  level?: string;
  description?: string;
  totalSessions?: number;
  sessions?: RlpTemplateSessionItem[];
  isDefault?: boolean;
}

export interface ApplyRlpTemplatePayload {
  classId: string;
  startDate?: string;
  scheduleMode?: "auto" | "keep_dates";
  overwriteExisting?: boolean;
}

export interface ApplyRlpTemplateResult {
  applied: boolean;
  templateTitle: string;
  totalSessions: number;
  sessions: any[];
}

/** RLP lấy từ lớp ACA thật. */
export interface ClassRlpCatalogItem {
  classId: string;
  className: string;
  classCode: string;
  teacher: string;
  openDate: string;
  phaseStartDate: string;
  totalSessions: number;
  filledSessions: number;
  sessions: RlpTemplateSessionItem[];
}

async function parseJson<T>(response: Response): Promise<T> {
  if (response.status === 401) {
    throw new Error("UNAUTHORIZED");
  }
  if (!response.ok) {
    let message = `RLP Template API failed (${response.status})`;
    try {
      const body = await parseApiJson<{ message?: string | string[] }>(response);
      if (typeof body.message === "string") message = body.message;
      else if (Array.isArray(body.message)) message = body.message.join(", ");
    } catch (err) {
      if (err instanceof Error && err.message.startsWith("API lỗi")) {
        message = err.message;
      }
    }
    throw new Error(message);
  }
  return parseApiJson<T>(response);
}

export async function fetchClassRlpCatalog(): Promise<ClassRlpCatalogItem[]> {
  const response = await apiFetch("/api/rlp/templates/from-classes", { method: "GET" });
  return parseJson(response);
}

export async function fetchClassRlpSource(sourceClassId: string): Promise<ClassRlpCatalogItem> {
  const response = await apiFetch(
    `/api/rlp/templates/from-classes/${encodeURIComponent(sourceClassId)}`,
    { method: "GET" },
  );
  return parseJson(response);
}

export async function applyClassRlpToClass(
  sourceClassId: string,
  payload: ApplyRlpTemplatePayload,
): Promise<ApplyRlpTemplateResult> {
  const response = await apiFetch(
    `/api/rlp/templates/from-classes/${encodeURIComponent(sourceClassId)}/apply`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
  return parseJson(response);
}

export async function fetchRlpTemplates(): Promise<RlpTemplate[]> {
  const response = await apiFetch("/api/rlp/templates", { method: "GET" });
  return parseJson(response);
}

export async function fetchRlpTemplate(idOrKey: string): Promise<RlpTemplate> {
  const response = await apiFetch(`/api/rlp/templates/${encodeURIComponent(idOrKey)}`, {
    method: "GET",
  });
  return parseJson(response);
}

export async function createRlpTemplate(
  payload: CreateRlpTemplatePayload,
): Promise<RlpTemplate> {
  const response = await apiFetch("/api/rlp/templates", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return parseJson(response);
}

export async function updateRlpTemplate(
  idOrKey: string,
  payload: UpdateRlpTemplatePayload,
): Promise<RlpTemplate> {
  const response = await apiFetch(`/api/rlp/templates/${encodeURIComponent(idOrKey)}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return parseJson(response);
}

export async function deleteRlpTemplate(idOrKey: string): Promise<{ deleted: boolean }> {
  const response = await apiFetch(`/api/rlp/templates/${encodeURIComponent(idOrKey)}`, {
    method: "DELETE",
  });
  return parseJson(response);
}

export async function applyRlpTemplate(
  idOrKey: string,
  payload: ApplyRlpTemplatePayload,
): Promise<ApplyRlpTemplateResult> {
  const response = await apiFetch(
    `/api/rlp/templates/${encodeURIComponent(idOrKey)}/apply`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
  return parseJson(response);
}
