"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { StudentLayout } from "@/app/StudentLayout";
import {
  contentTypeLabel,
  getDocumentProgress,
  mockDocuments,
  ReadingStatus,
  saveDocumentProgress,
  statusLabel,
} from "@/components/student/mockLearning";

export default function DocumentViewerPage() {
  const params = useParams<{ id: string }>();
  const documentId = params?.id ?? "";
  const doc = useMemo(
    () => mockDocuments.find((item) => item.id === documentId),
    [documentId],
  );

  const initialProgress = useMemo(() => {
    if (!doc) return null;
    return getDocumentProgress(doc.id, doc);
  }, [doc]);

  const [status, setStatus] = useState<ReadingStatus>(
    initialProgress?.status ?? "not_started",
  );
  const [position, setPosition] = useState(initialProgress?.position ?? "Trang 1");

  if (!doc) {
    return (
      <StudentLayout>
        <div className="max-w-4xl mx-auto py-10">
          <div className="bg-white rounded-2xl border border-zinc-200 p-8 shadow-sm">
            <div className="text-lg font-bold text-zinc-900">Không tìm thấy tài liệu</div>
            <Link
              href="/tai-lieu-them"
              className="mt-4 inline-flex rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Quay lại trang Kho tài liệu
            </Link>
          </div>
        </div>
      </StudentLayout>
    );
  }

  const saveStatus = (nextStatus: ReadingStatus) => {
    setStatus(nextStatus);
    saveDocumentProgress(doc.id, { status: nextStatus, position });
  };

  const savePosition = () => {
    saveDocumentProgress(doc.id, { status, position });
  };

  return (
    <StudentLayout>
      <div className="max-w-5xl mx-auto pb-12">
        <div className="flex items-center justify-between gap-3 mb-5">
          <Link
            href="/tai-lieu-them"
            className="inline-flex rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
          >
            ← Quay lại Kho tài liệu
          </Link>
          <span className="text-xs font-semibold text-zinc-500 uppercase  ">
            Trình xem (demo)
          </span>
        </div>

        <section className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-zinc-900">{doc.title}</h1>
              <p className="text-sm text-zinc-600 mt-2">{doc.description}</p>
              <p className="text-xs text-zinc-500 mt-2">
                {doc.subject} · {contentTypeLabel(doc.type)}
              </p>
            </div>
            <span className="inline-flex rounded-full bg-zinc-100 text-zinc-700 px-3 py-1 text-xs font-bold uppercase">
              {statusLabel(status)}
            </span>
          </div>

          <div className="mt-6 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-6 min-h-[320px]">
            {doc.type === "Video" ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="text-4xl">▶</div>
                <div className="mt-3 text-sm font-semibold text-zinc-800">
                  Khung video (bản demo)
                </div>
                <div className="mt-1 text-xs text-zinc-500">
                  Phiên bản thật sẽ dùng trình phát video và ghi nhận tiến độ tự động.
                </div>
              </div>
            ) : doc.type === "PDF" ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="text-4xl">📄</div>
                <div className="mt-3 text-sm font-semibold text-zinc-800">
                  Khung PDF (bản demo)
                </div>
                <div className="mt-1 text-xs text-zinc-500">
                  Phiên bản thật sẽ có trình xem PDF và lưu trang đang đọc.
                </div>
              </div>
            ) : (
              <div className="h-full">
                <div className="text-sm font-semibold text-zinc-800">Khung văn bản (bản demo)</div>
                <p className="mt-2 text-sm text-zinc-600 leading-relaxed">
                  Đây là nội dung mô phỏng. Phiên bản thật sẽ hiển thị dữ liệu tài liệu và
                  theo dõi vị trí cuộn khi bạn học.
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="mt-6 bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
          <h2 className="text-sm font-bold text-zinc-900">Theo dõi đọc (bản demo)</h2>
          <p className="text-xs text-zinc-500 mt-1">
            Bạn có thể cập nhật trạng thái và vị trí đọc; dữ liệu lưu cục bộ để Dashboard và danh sách tài liệu hiển thị lại.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => saveStatus("not_started")}
              className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
            >
              Đánh dấu: Chưa xem
            </button>
            <button
              onClick={() => saveStatus("in_progress")}
              className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
            >
              Đánh dấu: Đang xem dở
            </button>
            <button
              onClick={() => saveStatus("completed")}
              className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
            >
              Đánh dấu: Đã xem
            </button>
          </div>

          <div className="mt-4 flex flex-col md:flex-row gap-3">
            <input
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="Ví dụ: Trang 12 hoặc 08:30"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-800 outline-none focus:border-zinc-400"
            />
            <button
              onClick={savePosition}
              className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
            >
              Lưu vị trí đọc (demo)
            </button>
          </div>
        </section>
      </div>
    </StudentLayout>
  );
}
