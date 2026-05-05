"use client";

import { useMemo, useState } from "react";
import {
  contentRows,
  type ContentRow,
  type ContentStatus,
  contentStatusVi,
} from "./mockData";

const categories = ["Tất cả", ...Array.from(new Set(contentRows.map((c) => c.category)))];

export function ContentGovernanceSection() {
  const [rows, setRows] = useState<ContentRow[]>(() => [...contentRows]);
  const [q, setQ] = useState("");
  const [st, setSt] = useState<"all" | ContentStatus>("all");
  const [cat, setCat] = useState("Tất cả");

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
    setRows((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: "published" as ContentStatus } : r,
      ),
    );
  };

  const hideDoc = (id: string) => {
    if (!confirm("Ẩn tài liệu khỏi người dùng cuối?")) return;
    setRows((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: "hidden" as ContentStatus } : r,
      ),
    );
  };

  const metaNote = (id: string) => {
    alert(
      `Demo: mở form metadata cho «${rows.find((r) => r.id === id)?.title ?? id}».`,
    );
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <div className="min-w-0 flex-1">
            <label className="text-[10px] font-bold uppercase text-zinc-500">
              Tìm kiếm
            </label>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="mt-2 w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:border-[#6a5acd]"
              placeholder="Tên tài liệu hoặc danh mục…"
            />
          </div>
          <select
            value={st}
            onChange={(e) => setSt(e.target.value as typeof st)}
            className="rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-[#6a5acd] lg:w-44"
          >
            <option value="all">Mọi trạng thái</option>
            <option value="draft">Nháp</option>
            <option value="pending">Chờ duyệt</option>
            <option value="published">Đã hiển thị</option>
            <option value="hidden">Đã ẩn</option>
          </select>
          <select
            value={cat}
            onChange={(e) => setCat(e.target.value)}
            className="rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-[#6a5acd] lg:w-52"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-100 bg-zinc-50/90 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
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
                <td className="hidden px-4 py-3 text-zinc-600 md:table-cell">
                  {r.category}
                </td>
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
