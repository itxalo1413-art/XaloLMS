"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  contentStatusVi,
  CONTENT_CATALOG_UPDATE_EVENT,
  getContentCatalog,
  saveContentCatalog,
  updateCatalogDocument,
  type CatalogDocument,
  type ContentStatus,
} from "@/lib/contentCatalog";
import { NativeSelectChevron } from "@/components/student/ui";

export function ContentGovernanceSection() {
  const [rows, setRows] = useState<CatalogDocument[]>(() => getContentCatalog());
  const [q, setQ] = useState("");
  const [st, setSt] = useState<"all" | ContentStatus>("all");
  const [cat, setCat] = useState("Tất cả");

  const sync = useCallback(() => setRows(getContentCatalog()), []);

  useEffect(() => {
    sync();
    window.addEventListener(CONTENT_CATALOG_UPDATE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CONTENT_CATALOG_UPDATE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [sync]);

  const categories = useMemo(
    () => ["Tất cả", ...Array.from(new Set(rows.map((c) => c.category)))],
    [rows],
  );

  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    return rows.filter((r) => {
      const ok =
        (!n ||
          r.title.toLowerCase().includes(n) ||
          r.category.toLowerCase().includes(n)) &&
        (st === "all" || r.status === st) &&
        (cat === "Tất cả" || r.category === cat);
      return ok;
    });
  }, [rows, q, st, cat]);

  const approve = (id: string) => {
    if (!confirm("Duyệt và hiển thị tài liệu này cho người dùng?")) return;
    setRows(updateCatalogDocument(id, { status: "published" }));
  };

  const hideDoc = (id: string) => {
    if (!confirm("Ẩn tài liệu khỏi người dùng cuối?")) return;
    setRows(updateCatalogDocument(id, { status: "hidden" }));
  };

  const metaNote = (id: string) => {
    const row = rows.find((r) => r.id === id);
    if (!row) return;
    const nextTitle = window.prompt("Tiêu đề tài liệu", row.title);
    if (nextTitle === null) return;
    const nextDesc = window.prompt("Mô tả ngắn", row.description);
    if (nextDesc === null) return;
    const next = rows.map((r) =>
      r.id === id
        ? {
            ...r,
            title: nextTitle.trim() || r.title,
            description: nextDesc.trim() || r.description,
            updatedAt: new Date().toISOString().slice(0, 10),
          }
        : r,
    );
    setRows(saveContentCatalog(next));
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">
        Danh mục thống nhất — tài liệu <strong>Đã hiển thị</strong> xuất hiện trên trang Kho tài liệu
        của học viên.
      </p>
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <div className="min-w-0 flex-1">
            <label className="text-[10px] font-bold uppercase text-zinc-500">Tìm kiếm</label>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="mt-2 w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:border-[#6a5acd]"
              placeholder="Tên tài liệu hoặc danh mục…"
            />
          </div>
          <NativeSelectChevron
            value={st}
            onChange={(e) => setSt(e.target.value as typeof st)}
            className="h-11 rounded-2xl border border-zinc-200 bg-white text-sm font-bold text-foreground shadow-sm focus:border-primary/40 focus:ring-2 focus:ring-primary/10 lg:w-44"
          >
            <option value="all">Mọi trạng thái</option>
            <option value="draft">Nháp</option>
            <option value="pending">Chờ duyệt</option>
            <option value="published">Đã hiển thị</option>
            <option value="hidden">Đã ẩn</option>
          </NativeSelectChevron>
          <NativeSelectChevron
            value={cat}
            onChange={(e) => setCat(e.target.value)}
            className="h-11 rounded-2xl border border-zinc-200 bg-white text-sm font-bold text-foreground shadow-sm focus:border-primary/40 focus:ring-2 focus:ring-primary/10 lg:w-52"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </NativeSelectChevron>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-100 bg-zinc-50/90 text-[10px] font-bold uppercase   text-zinc-500">
            <tr>
              <th className="px-4 py-3">Tiêu đề</th>
              <th className="hidden px-4 py-3 md:table-cell">Danh mục</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="hidden px-4 py-3 lg:table-cell">Cập nhật</th>
              <th className="px-4 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {filtered.map((r) => (
              <tr key={r.id} className="hover:bg-[#efeaff]/30">
                <td className="px-4 py-3 font-semibold text-zinc-900">{r.title}</td>
                <td className="hidden px-4 py-3 text-zinc-600 md:table-cell">{r.category}</td>
                <td className="px-4 py-3">
                  <span
                    className={[
                      "inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase",
                      r.status === "published"
                        ? "bg-emerald-100 text-emerald-800"
                        : r.status === "pending"
                          ? "bg-amber-100 text-amber-800"
                          : r.status === "draft"
                            ? "bg-zinc-100 text-zinc-600"
                            : "bg-rose-100 text-rose-800",
                    ].join(" ")}
                  >
                    {contentStatusVi(r.status)}
                  </span>
                </td>
                <td className="hidden px-4 py-3 text-zinc-500 lg:table-cell">{r.updatedAt}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => metaNote(r.id)}
                    className="mr-1 rounded-lg px-2 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-100"
                  >
                    Metadata
                  </button>
                  {r.status !== "published" ? (
                    <button
                      type="button"
                      onClick={() => approve(r.id)}
                      className="mr-1 rounded-lg bg-[#6a5acd] px-2 py-1 text-xs font-semibold text-white hover:bg-[#5b4ec0]"
                    >
                      Duyệt
                    </button>
                  ) : null}
                  {r.status !== "hidden" ? (
                    <button
                      type="button"
                      onClick={() => hideDoc(r.id)}
                      className="rounded-lg px-2 py-1 text-xs font-semibold text-[#d65a7a] hover:bg-[#fff0f4]"
                    >
                      Ẩn
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
