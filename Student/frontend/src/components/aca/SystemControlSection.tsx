"use client";

import { useState } from "react";
import { systemCategories, systemTags } from "./mockData";

export function SystemControlSection() {
  const [catInput, setCatInput] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [cats] = useState(() => [...systemCategories]);
  const [tags] = useState(() => [...systemTags]);

  const destructive = (msg: string) => {
    if (!confirm(`${msg}\n\nHành động nhạy cảm — bạn có chắc?`)) return;
    alert("Đã xác nhận (demo — không có backend).");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-bold text-zinc-900">Danh mục (category)</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Kiểm soát nhóm hiển thị trong catalogue.
        </p>
        <ul className="mt-4 flex flex-wrap gap-2">
          {cats.map((c) => (
            <li
              key={c}
              className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-800"
            >
              {c}
            </li>
          ))}
        </ul>
        <div className="mt-6 flex gap-2">
          <input
            value={catInput}
            onChange={(e) => setCatInput(e.target.value)}
            placeholder="Tên danh mục mới…"
            className="min-w-0 flex-1 rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-[#6a5acd]"
          />
          <button
            type="button"
            onClick={() =>
              catInput.trim()
                ? alert(`Demo thêm "${catInput.trim()}"`)
                : undefined
            }
            className="rounded-xl bg-[#6a5acd] px-4 py-2 text-sm font-semibold text-white hover:bg-[#5b4ec0]"
          >
            Thêm
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-bold text-zinc-900">Tag</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Metadata gắn tài liệu — chỉnh tại chỗ trong bản đầy đủ.
        </p>
        <ul className="mt-4 flex flex-wrap gap-2">
          {tags.map((t) => (
            <li
              key={t}
              className="rounded-lg bg-[#fff0f4] px-2.5 py-1 text-xs font-bold lowercase text-[#d65a7a]"
            >
              #{t}
            </li>
          ))}
        </ul>
        <div className="mt-6 flex gap-2">
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="tag-mới…"
            className="min-w-0 flex-1 rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-[#fe7794]"
          />
          <button
            type="button"
            onClick={() =>
              tagInput.trim()
                ? alert(`Demo gắn tag "${tagInput.trim()}"`)
                : undefined
            }
            className="rounded-xl border border-[#fe7794] bg-[#fff0f4] px-4 py-2 text-sm font-semibold text-[#d65a7a] hover:bg-[#ffe0e8]"
          >
            Thêm tag
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm lg:col-span-2">
        <h2 className="text-sm font-bold text-zinc-900">Hoạt động hệ thống</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Theo doc UX — các hành động quan trọng có xác nhận trước khi chạy.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
            onClick={() => alert("Demo: xem log jobs / ingestion (static).")}
          >
            Xem log đồng bộ (demo)
          </button>
          <button
            type="button"
            className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-900 hover:bg-amber-100"
            onClick={() => destructive("Rebuild search index")}
          >
            Rebuild chỉ mục tìm kiếm
          </button>
          <button
            type="button"
            className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-900 hover:bg-rose-100"
            onClick={() => destructive("Xóa các tài liệu orphaned")}
          >
            Dọn orphaned content
          </button>
        </div>
      </section>
    </div>
  );
}
