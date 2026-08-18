"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AcaStudent } from "@/lib/acaManagementApi";

type Props = {
  studentId: string;
  student: AcaStudent | null;
  loading?: boolean;
};

export function StudentDetailSection({ student, loading }: Props) {
  const router = useRouter();

  if (loading) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500 shadow-sm">
        Đang tải hồ sơ học viên...
      </div>
    );
  }

  if (!student) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
        <p className="text-zinc-600">Không tìm thấy học sinh.</p>
        <Link
          href="/teacher"
          className="mt-4 inline-block text-sm font-semibold text-[#6a5acd] hover:underline"
        >
          ← Về danh sách
        </Link>
      </div>
    );
  }

  const scores = student.scores;

  return (
    <div className="space-y-8">
      <button
        type="button"
        onClick={() => router.back()}
        className="text-sm font-semibold text-[#6a5acd] hover:underline"
      >
        ← Quay lại danh sách
      </button>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm md:flex md:items-start md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-zinc-900">{student.name}</h2>
          <p className="mt-1 text-sm text-zinc-500">
            {student.classification || "Học viên"} · {student.email || "Chưa có email"}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm lg:col-span-1">
          <h3 className="text-[11px] font-bold uppercase text-zinc-500">Thông tin cá nhân</h3>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-xs font-medium text-zinc-400">Điện thoại</dt>
              <dd className="font-medium text-zinc-900">{student.phone || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-400">Email</dt>
              <dd className="break-all font-medium text-zinc-900">{student.email || "—"}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm lg:col-span-2">
          <h3 className="text-[11px] font-bold uppercase text-zinc-500">Điểm kỹ năng</h3>
          {scores ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-5">
              {(
                [
                  ["L", scores.l],
                  ["R", scores.r],
                  ["W", scores.w],
                  ["S", scores.s],
                  ["O", scores.o],
                ] as const
              ).map(([label, val]) => (
                <div
                  key={label}
                  className="rounded-xl border border-zinc-100 bg-zinc-50/80 px-3 py-3 text-center"
                >
                  <div className="text-[10px] font-bold uppercase text-zinc-400">{label}</div>
                  <div className="text-lg font-black text-[#6a5acd]">{val || "—"}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-zinc-500">Chưa có điểm kỹ năng.</p>
          )}
        </section>
      </div>
    </div>
  );
}
