"use client";

import { useEffect, useState } from "react";
import { TeacherLayout } from "@/components/teacher/TeacherLayout";
import { TeacherTopbar } from "@/components/teacher/TeacherTopbar";
import { apiFetch } from "@/lib/auth";
import type { CourseImportantLink } from "@/lib/courseImportantLinks";

export default function TeachingMaterialsPage() {
  const [links, setLinks] = useState<CourseImportantLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void apiFetch("/api/aca/course-settings", { method: "GET" })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setLinks(Array.isArray(data?.links) ? data.links : []);
      })
      .catch(() => {
        if (!cancelled) setLinks([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <TeacherLayout>
      <TeacherTopbar
        title="Teaching Materials"
        subtitle="Tài nguyên học thuật lấy từ cài đặt khóa học trên hệ thống."
      />
      <main className="mx-auto max-w-6xl px-6 py-6 pb-16 md:px-8 space-y-6">
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-soft">
          <div className="p-5 border-b border-zinc-100">
            <h3 className="text-sm font-bold text-zinc-950">Thư viện tài liệu giảng dạy</h3>
            <p className="text-xs text-zinc-500 mt-1">
              Liên kết tài liệu do ACA cấu hình trong Course Settings.
            </p>
          </div>
          {loading ? (
            <div className="px-6 py-10 text-center text-sm text-zinc-500">Đang tải tài liệu...</div>
          ) : links.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-zinc-500">
              Chưa có tài liệu nào được cấu hình.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 border-b border-zinc-200 text-[10px] font-black uppercase tracking-widest text-muted">
                  <tr>
                    <th className="px-6 py-4">Tên tài liệu / Thư mục</th>
                    <th className="px-6 py-4">Mô tả</th>
                    <th className="px-6 py-4 text-right">Liên kết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 font-semibold text-zinc-700">
                  {links.map((mat) => (
                    <tr key={mat.id} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-zinc-950">{mat.label}</td>
                      <td className="px-6 py-4 text-zinc-500 max-w-md font-medium">{mat.value}</td>
                      <td className="px-6 py-4 text-right">
                        {mat.url ? (
                          <a
                            href={mat.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex rounded-lg bg-primary/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-primary hover:bg-primary/15 transition-colors"
                          >
                            Mở liên kết
                          </a>
                        ) : (
                          <span className="text-zinc-400">Chưa có link</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </TeacherLayout>
  );
}
