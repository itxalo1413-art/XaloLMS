export type ReadingStatus = "not_started" | "in_progress" | "completed";

export type MockDocument = {
  id: string;
  title: string;
  description: string;
  subject: string;
  type: "PDF" | "Video" | "Text";
  suggestedReason: string;
  defaultStatus: ReadingStatus;
  defaultPosition: string;
};

export type DocumentProgress = {
  status: ReadingStatus;
  position: string;
  updatedAt: number;
};

const STORAGE_KEY = "student_reading_progress_v1";

export const mockDocuments: MockDocument[] = [
  {
    id: "listening-map-01",
    title: "Listening Map - Note Taking Basics",
    description:
      "Hướng dẫn ghi chú nhanh và nắm ý chính trong bài nghe.",
    subject: "Nghe",
    type: "Video",
    suggestedReason: "Phù hợp với kỹ năng bạn đang cần cải thiện.",
    defaultStatus: "in_progress",
    defaultPosition: "12:05",
  },
  {
    id: "reading-true-false",
    title: "Reading Strategy - True/False/Not Given",
    description:
      "Tổng hợp mẹo xử lý dạng bài True/False/Not Given.",
    subject: "Đọc",
    type: "PDF",
    suggestedReason: "Liên quan đến nội dung bạn vừa xem.",
    defaultStatus: "not_started",
    defaultPosition: "Trang 1",
  },
  {
    id: "writing-task2-idea",
    title: "Writing Task 2 - Idea Bank",
    description:
      "Mẫu ý tưởng cho các chủ đề thường gặp trong IELTS Writing.",
    subject: "Viết",
    type: "Text",
    suggestedReason: "Được gợi ý theo kết quả học tập gần đây.",
    defaultStatus: "not_started",
    defaultPosition: "Đoạn 1",
  },
  {
    id: "speaking-part2-structure",
    title: "Speaking Part 2 - 2 Minute Structure",
    description:
      "Khung triển khai ý để nói trọn vẹn trong 2 phút.",
    subject: "Nói",
    type: "Video",
    suggestedReason: "Nội dung có mức độ liên quan cao với bạn.",
    defaultStatus: "completed",
    defaultPosition: "Hoàn thành",
  },
  {
    id: "vocab-theme-education",
    title: "Vocabulary Theme - Education",
    description:
      "Cụm từ và collocation chủ đề Education dùng cho Viết/Nói.",
    subject: "Từ vựng",
    type: "PDF",
    suggestedReason: "Gợi ý bổ sung cho bài học hiện tại.",
    defaultStatus: "in_progress",
    defaultPosition: "Trang 8",
  },
];

export function statusLabel(status: ReadingStatus) {
  if (status === "completed") return "Đã xem";
  if (status === "in_progress") return "Đang xem dở";
  return "Chưa xem";
}

export function contentTypeLabel(type: MockDocument["type"]) {
  if (type === "Text") return "Văn bản";
  return type;
}

function safeParse(raw: string | null): Record<string, DocumentProgress> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, DocumentProgress>;
    return parsed ?? {};
  } catch {
    return {};
  }
}

export function getProgressMap(): Record<string, DocumentProgress> {
  if (typeof window === "undefined") return {};
  return safeParse(window.localStorage.getItem(STORAGE_KEY));
}

export function saveDocumentProgress(
  documentId: string,
  patch: Partial<DocumentProgress>,
) {
  if (typeof window === "undefined") return;
  const map = getProgressMap();
  const current = map[documentId] ?? {
    status: "not_started" as ReadingStatus,
    position: "Trang 1",
    updatedAt: Date.now(),
  };

  map[documentId] = {
    ...current,
    ...patch,
    updatedAt: Date.now(),
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function getDocumentProgress(documentId: string, defaults: MockDocument) {
  const map = getProgressMap();
  const hit = map[documentId];
  if (hit) return hit;
  return {
    status: defaults.defaultStatus,
    position: defaults.defaultPosition,
    updatedAt: 0,
  };
}

export function getRecentlyViewedDocuments(
  limit = 5,
  progressMap: Record<string, DocumentProgress> = getProgressMap(),
) {
  return mockDocuments
    .map((doc) => {
      const progress = progressMap[doc.id];
      return {
        ...doc,
        status: progress?.status ?? doc.defaultStatus,
        position: progress?.position ?? doc.defaultPosition,
        updatedAt: progress?.updatedAt ?? 0,
      };
    })
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, limit);
}
