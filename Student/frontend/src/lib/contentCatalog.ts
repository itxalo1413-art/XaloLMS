import { mockDocuments, type MockDocument } from "@/components/student/mockLearning";

export type ContentStatus = "draft" | "pending" | "published" | "hidden";

export type CatalogDocument = MockDocument & {
  status: ContentStatus;
  category: string;
  updatedAt: string;
};

const SEED: CatalogDocument[] = mockDocuments.map((doc, i) => ({
  ...doc,
  status: "published" as const,
  category: doc.subject,
  updatedAt: `2026-0${(i % 5) + 1}-15`,
}));

const STORAGE_KEY = "xalo.content.catalog.v1";
export const CONTENT_CATALOG_UPDATE_EVENT = "xalo-content-catalog-updated";

let cache: CatalogDocument[] = SEED.map((d) => ({ ...d }));

function dispatchUpdate() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CONTENT_CATALOG_UPDATE_EVENT));
}

function loadLocal(): CatalogDocument[] {
  if (typeof window === "undefined") return SEED.map((d) => ({ ...d }));
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED.map((d) => ({ ...d }));
    const data = JSON.parse(raw) as CatalogDocument[];
    return data.length ? data : SEED.map((d) => ({ ...d }));
  } catch {
    return SEED.map((d) => ({ ...d }));
  }
}

export function getContentCatalog(): CatalogDocument[] {
  if (typeof window !== "undefined") {
    cache = loadLocal();
  }
  return cache;
}

export function getPublishedCatalogDocuments(): CatalogDocument[] {
  return getContentCatalog().filter((d) => d.status === "published");
}

export function saveContentCatalog(rows: CatalogDocument[]): CatalogDocument[] {
  cache = rows;
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
    dispatchUpdate();
  }
  return cache;
}

export function updateCatalogDocument(
  id: string,
  patch: Partial<CatalogDocument>,
): CatalogDocument[] {
  const next = getContentCatalog().map((r) =>
    r.id === id ? { ...r, ...patch, updatedAt: new Date().toISOString().slice(0, 10) } : r,
  );
  return saveContentCatalog(next);
}

export function refreshContentCatalog(): CatalogDocument[] {
  cache = loadLocal();
  dispatchUpdate();
  return cache;
}

export function contentStatusVi(status: ContentStatus): string {
  if (status === "draft") return "Nháp";
  if (status === "pending") return "Chờ duyệt";
  if (status === "published") return "Đã hiển thị";
  return "Đã ẩn";
}

if (typeof window !== "undefined") {
  cache = loadLocal();
}
