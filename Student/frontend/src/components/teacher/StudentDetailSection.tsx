"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  getStudent,
  internalNotesByStudent,
  recentActivityByStudent,
  studentScores,
  type TimelineEntry,
  timelineByStudent,
  statusLabel,
} from "@/components/teacher/mockData";
import { NativeSelectChevron } from "@/components/student/ui";

type Props = { studentId: string };

export function StudentDetailSection({ studentId }: Props) {
  const router = useRouter();
  const student = getStudent(studentId);
  const scores = studentScores[studentId];
  const activity = recentActivityByStudent[studentId] ?? [];
  const note = internalNotesByStudent[studentId] ?? "—";

  const [timeline, setTimeline] = useState<TimelineEntry[]>(
    () => timelineByStudent[studentId] ?? [],
  );
  const [commentBody, setCommentBody] = useState("");
  const [commentSkill, setCommentSkill] = useState("");
  const [abilityNote, setAbilityNote] = useState("");
  const [resultPick, setResultPick] = useState("");

  const sortedTimeline = useMemo(
    () =>
      [...timeline].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)),
    [timeline],
  );

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

  const addComment = () => {
    const text = commentBody.trim();
    if (!text) return;
    const entry: TimelineEntry = {
      id: `local-${Date.now()}`,
      kind: "comment",
      date: new Date().toISOString().slice(0, 10),
      label: "Nhận xét",
      detail: text,
      skill: commentSkill.trim() || undefined,
    };
    setTimeline((prev) => [entry, ...prev]);
    setCommentBody("");
    setCommentSkill("");
  };

  const addStructuredUpdate = () => {
    const r = resultPick.trim();
    const a = abilityNote.trim();
    if (!r && !a) return;
    const parts = [r && `Kết quả: ${r}`, a && `Năng lực: ${a}`].filter(Boolean);
    const entry: TimelineEntry = {
      id: `upd-${Date.now()}`,
      kind: "update",
      date: new Date().toISOString().slice(0, 10),
      label: "Cập nhật thông tin",
      detail: parts.join(" · "),
    };
    setTimeline((prev) => [entry, ...prev]);
    setResultPick("");
    setAbilityNote("");
  };

  return (
    <div className="space-y-8">
      <button
        type="button"
        onClick={() => router.back()}
        className="text-sm font-semibold text-[#6a5acd] hover:underline"
      >
        ← Quay lại danh sách
      </button>

      {/* Header card */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm md:flex md:items-start md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-zinc-900">{student.name}</h2>
          <p className="mt-1 text-sm text-zinc-500">
            {student.group} · {student.email}
          </p>
        </div>
        <span
          className={[
            "mt-4 inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide md:mt-0",
            student.status === "active"
              ? "bg-emerald-100 text-emerald-800"
              : student.status === "follow_up"
                ? "bg-amber-100 text-amber-800"
                : "bg-zinc-100 text-zinc-600",
          ].join(" ")}
        >
          {statusLabel(student.status)}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Cá nhân */}
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm lg:col-span-1">
          <h3 className="text-[11px] font-bold uppercase   text-zinc-500">
            Thông tin cá nhân
          </h3>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-xs font-medium text-zinc-400">Điện thoại</dt>
              <dd className="font-medium text-zinc-900">{student.phone}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-400">Email</dt>
              <dd className="break-all font-medium text-zinc-900">
                {student.email}
              </dd>
            </div>
          </dl>
        </section>

        {/* Học tập */}
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm lg:col-span-2">
          <h3 className="text-[11px] font-bold uppercase   text-zinc-500">
            Thông tin học tập
          </h3>
          {scores ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-4">
              {(
                [
                  ["Listening", scores.listening],
                  ["Reading", scores.reading],
                  ["Writing", scores.writing],
                  ["Speaking", scores.speaking],
                ] as const
              ).map(([label, val]) => (
                <div
                  key={label}
                  className="rounded-xl border border-zinc-100 bg-zinc-50/80 px-3 py-3 text-center"
                >
                  <div className="text-[10px] font-bold uppercase text-zinc-400">
                    {label}
                  </div>
                  <div className="text-lg font-black text-[#6a5acd]">{val}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-zinc-500">Chưa có điểm kỹ năng.</p>
          )}
          <p className="mt-4 text-sm leading-relaxed text-zinc-600">
            {student.learningSummary}
          </p>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h3 className="text-[11px] font-bold uppercase   text-zinc-500">
            Hoạt động gần đây
          </h3>
          <ul className="mt-4 list-inside list-disc space-y-2 text-sm text-zinc-600">
            {activity.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h3 className="text-[11px] font-bold uppercase   text-zinc-500">
            Ghi chú nội bộ (trước đó)
          </h3>
          <p className="mt-4 text-sm leading-relaxed text-zinc-700">{note}</p>
        </section>
      </div>

      {/* Nhận xét — form ngắn */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h3 className="text-[11px] font-bold uppercase   text-zinc-500">
          Nhận xét nhanh
        </h3>
        <p className="mt-1 text-xs text-zinc-500">
          Thêm nhận xét theo kỹ năng hoặc nội dung — sẽ xuất hiện trong lịch sử.
        </p>
        <div className="mt-4 flex flex-col gap-3 md:flex-row">
          <input
            value={commentSkill}
            onChange={(e) => setCommentSkill(e.target.value)}
            placeholder="Kỹ năng (vd. Writing)"
            className="md:w-48 rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-[#6a5acd]"
          />
          <input
            value={commentBody}
            onChange={(e) => setCommentBody(e.target.value)}
            placeholder="Nội dung nhận xét ngắn…"
            className="min-w-0 flex-1 rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-[#6a5acd]"
          />
          <button
            type="button"
            onClick={addComment}
            className="rounded-xl bg-[#6a5acd] px-5 py-2 text-sm font-semibold text-white hover:bg-[#5b4ec0]"
          >
            Thêm nhận xét
          </button>
        </div>
      </section>

      {/* Cập nhật có cấu trúc */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h3 className="text-[11px] font-bold uppercase   text-zinc-500">
          Cập nhật thông tin (có cấu trúc)
        </h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-zinc-500">
              Kết quả học tập
            </label>
            <NativeSelectChevron
              value={resultPick}
              onChange={(e) => setResultPick(e.target.value)}
              className="mt-1 h-11 rounded-2xl border border-zinc-200 bg-white text-sm font-bold text-foreground shadow-sm focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
            >
              <option value="">Chọn…</option>
              <option value="Tiến bộ rõ">Tiến bộ rõ</option>
              <option value="Ổn định">Ổn định</option>
              <option value="Cần hỗ trợ thêm">Cần hỗ trợ thêm</option>
            </NativeSelectChevron>
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-500">
              Nhận định năng lực (ngắn)
            </label>
            <input
              value={abilityNote}
              onChange={(e) => setAbilityNote(e.target.value)}
              placeholder="Một dòng nhận định…"
              className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-[#6a5acd]"
            />
          </div>
        </div>
        <button
          type="button"
          onClick={addStructuredUpdate}
          className="mt-4 rounded-xl border border-[#fe7794] bg-[#fff0f4] px-5 py-2 text-sm font-semibold text-[#d65a7a] hover:bg-[#ffe0e8]"
        >
          Lưu cập nhật (demo)
        </button>
      </section>

      {/* Timeline */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h3 className="text-[11px] font-bold uppercase   text-zinc-500">
          Lịch sử & theo dõi
        </h3>
        <ol className="relative mt-6 ml-1 border-l border-zinc-200">
          {sortedTimeline.map((item) => (
            <li key={item.id} className="relative pb-8 pl-6 last:pb-0">
              <span className="absolute left-0 top-1.5 z-10 size-2.5 -translate-x-1/2 rounded-full bg-[#6a5acd] ring-4 ring-white" />
              <div className="text-[10px] font-bold uppercase   text-zinc-400">
                {item.date}
                {item.skill ? ` · ${item.skill}` : ""}
              </div>
              <div className="mt-1 text-sm font-bold text-zinc-900">
                {item.label}
                {item.kind === "comment" ? (
                  <span className="ml-2 text-[10px] font-bold uppercase text-[#6a5acd]">
                    Nhận xét
                  </span>
                ) : (
                  <span className="ml-2 text-[10px] font-bold uppercase text-[#fe7794]">
                    Cập nhật
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-zinc-600">{item.detail}</p>
            </li>
          ))}
        </ol>
        {sortedTimeline.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">Chưa có mục lịch sử.</p>
        ) : null}
      </section>
    </div>
  );
}
