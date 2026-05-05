"use client";

import { useMemo, useState } from "react";
import { userRows, type Role, type UserRow, roleLabel } from "./mockData";

export function UserManagementSection() {
  const [rows, setRows] = useState<UserRow[]>(() => [...userRows]);
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | Role>("all");

  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    return rows.filter(
      (u) =>
        (!n ||
          u.name.toLowerCase().includes(n) ||
          u.email.toLowerCase().includes(n)) &&
        (roleFilter === "all" || u.role === roleFilter),
    );
  }, [rows, q, roleFilter]);

  const toggleLock = (id: string) => {
    const u = rows.find((x) => x.id === id);
    if (!u) return;
    const act = u.locked ? "Mở khóa" : "Khóa";
    if (!confirm(`${act} tài khoản ${u.email}?`)) return;
    setRows((prev) =>
      prev.map((row) =>
        row.id === id ? { ...row, locked: !row.locked } : row,
      ),
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm md:flex-row md:items-end">
        <div className="min-w-0 flex-1">
          <label className="text-[10px] font-bold uppercase text-zinc-500">
            Tìm theo tên hoặc email
          </label>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Nguyễn, @school…"
            className="mt-2 w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:border-[#6a5acd]"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
          className="rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-[#6a5acd] md:w-48"
        >
          <option value="all">Mọi vai trò</option>
          <option value="HS">Học sinh</option>
          <option value="GV">Giáo viên</option>
          <option value="ACA">ACA</option>
        </select>
        <button
          type="button"
          onClick={() =>
            alert("Demo: wizard tạo tài khoản (email, vai trò, gửi mời).")
          }
          className="rounded-xl bg-[#6a5acd] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#5b4ec0]"
        >
          + Tạo người dùng (demo)
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-100 bg-zinc-50/90 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            <tr>
              <th className="px-4 py-3">Họ tên</th>
              <th className="hidden px-4 py-3 md:table-cell">Email</th>
              <th className="px-4 py-3">Vai trò</th>
              <th className="px-4 py-3 text-right">Khóa / mở</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {filtered.map((u) => (
              <tr key={u.id} className="hover:bg-[#efeaff]/30">
                <td className="px-4 py-3 font-semibold text-zinc-900">{u.name}</td>
                <td className="hidden px-4 py-3 text-zinc-600 md:table-cell">
                  {u.email}
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[10px] font-bold uppercase text-zinc-700">
                    {roleLabel(u.role)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => toggleLock(u.id)}
                    className={
                      u.locked
                        ? "rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100"
                        : "rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-bold text-zinc-700 hover:bg-zinc-200"
                    }
                  >
                    {u.locked ? "Mở khóa" : "Khóa"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
