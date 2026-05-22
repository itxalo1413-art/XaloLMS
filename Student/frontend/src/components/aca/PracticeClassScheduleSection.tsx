"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getDefaultPracticeWeeklySchedule,
  getPracticeWeekRangeLabel,
  loadPracticeScheduleStore,
  PRACTICE_CLASS_SCHEDULE_UPDATE_EVENT,
  PRACTICE_SLOT_IDS,
  savePracticeScheduleFromAca,
  type PracticeSlotId,
  type PracticeSlotScheduleOverride,
} from "@/lib/practiceClass";

function formatUpdatedAt(iso: string | undefined) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function buildDraftFromStore(): {
  weekRangeLabel: string;
  slots: Record<PracticeSlotId, PracticeSlotScheduleOverride>;
} {
  const defaults = getDefaultPracticeWeeklySchedule();
  const store = loadPracticeScheduleStore();
  const slots = {} as Record<PracticeSlotId, PracticeSlotScheduleOverride>;
  for (const id of PRACTICE_SLOT_IDS) {
    const base = defaults.find((s) => s.id === id)!;
    const o = store?.slots[id];
    slots[id] = {
      dayLabel: o?.dayLabel ?? base.dayLabel,
      time: o?.time ?? base.time,
      dateNote: o?.dateNote ?? "",
    };
  }
  return {
    weekRangeLabel: store?.weekRangeLabel ?? "",
    slots,
  };
}

export function PracticeClassScheduleSection() {
  const [weekRangeLabel, setWeekRangeLabel] = useState("");
  const [slotDrafts, setSlotDrafts] = useState<
    Record<PracticeSlotId, PracticeSlotScheduleOverride>
  >(() => buildDraftFromStore().slots);
  const [savedAt, setSavedAt] = useState<string | undefined>(
    () => loadPracticeScheduleStore()?.updatedAt,
  );
  const [status, setStatus] = useState<"idle" | "saved">("idle");

  const sync = useCallback(() => {
    const draft = buildDraftFromStore();
    setWeekRangeLabel(draft.weekRangeLabel);
    setSlotDrafts(draft.slots);
    setSavedAt(loadPracticeScheduleStore()?.updatedAt);
  }, []);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) sync();
    });
    window.addEventListener(PRACTICE_CLASS_SCHEDULE_UPDATE_EVENT, sync);
    return () => {
      cancelled = true;
      window.removeEventListener(PRACTICE_CLASS_SCHEDULE_UPDATE_EVENT, sync);
    };
  }, [sync]);

  const previewSlots = useMemo(() => {
    return getDefaultPracticeWeeklySchedule().map((base) => {
      const d = slotDrafts[base.id];
      return {
        ...base,
        dayLabel: d.dayLabel.trim() || base.dayLabel,
        time: d.time.trim() || base.time,
        dateNote: d.dateNote?.trim() || undefined,
      };
    });
  }, [slotDrafts]);

  const updateSlot = (
    id: PracticeSlotId,
    field: keyof PracticeSlotScheduleOverride,
    value: string,
  ) => {
    setSlotDrafts((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
    setStatus("idle");
  };

  const save = () => {
    savePracticeScheduleFromAca(weekRangeLabel, slotDrafts);
    setSavedAt(new Date().toISOString());
    setStatus("saved");
    sync();
  };

  const resetToDefaults = () => {
    const defaults = getDefaultPracticeWeeklySchedule();
    const slots = {} as Record<PracticeSlotId, PracticeSlotScheduleOverride>;
    for (const id of PRACTICE_SLOT_IDS) {
      const base = defaults.find((s) => s.id === id)!;
      slots[id] = { dayLabel: base.dayLabel, time: base.time, dateNote: "" };
    }
    setSlotDrafts(slots);
    setWeekRangeLabel("");
    setStatus("idle");
  };

  const defaults = getDefaultPracticeWeeklySchedule();

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-primary/15 bg-primary/5 p-5">
        <h2 className="text-sm font-bold text-foreground">Lịch tuần — Lớp luyện đề tập trung</h2>
        <p className="mt-2 text-xs font-medium leading-relaxed text-muted">
          Ngày và giờ từng buổi (vd. <strong>[CN] 9h – 11h30</strong>) thay đổi{" "}
          <strong>mỗi tuần</strong>. Sau khi lưu, học viên thấy lịch mới ngay trên trang Hỗ trợ tự
          học và Thời khoá biểu.
        </p>
        <p className="mt-2 text-[11px] text-muted">
          Cập nhật lần cuối:{" "}
          <span className="font-bold text-foreground">{formatUpdatedAt(savedAt)}</span>
          {getPracticeWeekRangeLabel() ? (
            <>
              {" "}
              · Tuần:{" "}
              <span className="font-bold text-primary">{getPracticeWeekRangeLabel()}</span>
            </>
          ) : (
            <span className="italic"> (chưa ghi nhãn tuần)</span>
          )}
        </p>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
          Nhãn tuần (hiển thị cho học viên)
        </label>
        <input
          type="text"
          value={weekRangeLabel}
          onChange={(e) => {
            setWeekRangeLabel(e.target.value);
            setStatus("idle");
          }}
          placeholder="vd. 19/05 – 25/05/2026"
          className="mt-2 w-full max-w-md rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-bold text-foreground outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
        />
      </section>

      <div className="space-y-4">
        {PRACTICE_SLOT_IDS.map((id) => {
          const base = defaults.find((s) => s.id === id)!;
          const draft = slotDrafts[id];
          return (
            <div
              key={id}
              className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
            >
              <div className="mb-4 border-b border-zinc-100 pb-3">
                <div className="text-sm font-bold text-zinc-900">{base.title}</div>
                <div className="mt-1 text-xs text-zinc-500">
                  {base.platform} · Thứ cố định trên lịch:{" "}
                  {base.dayOfWeek === 0
                    ? "Chủ nhật"
                    : base.dayOfWeek === 2
                      ? "Thứ 3"
                      : "Thứ 7"}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-zinc-500">
                    Nhãn ngày (vd. CN)
                  </label>
                  <input
                    type="text"
                    value={draft.dayLabel}
                    onChange={(e) => updateSlot(id, "dayLabel", e.target.value)}
                    placeholder={base.dayLabel}
                    className="mt-2 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm font-bold outline-none focus:border-primary/40"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-zinc-500">
                    Giờ học
                  </label>
                  <input
                    type="text"
                    value={draft.time}
                    onChange={(e) => updateSlot(id, "time", e.target.value)}
                    placeholder={base.time}
                    className="mt-2 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm font-bold outline-none focus:border-primary/40"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-zinc-500">
                    Ngày trong tuần (tuỳ chọn)
                  </label>
                  <input
                    type="text"
                    value={draft.dateNote ?? ""}
                    onChange={(e) => updateSlot(id, "dateNote", e.target.value)}
                    placeholder="vd. 18/05"
                    className="mt-2 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm font-bold outline-none focus:border-primary/40"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={save}
          className="rounded-xl bg-primary px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-white shadow-sm hover:bg-primary/90"
        >
          Lưu lịch tuần
        </button>
        <button
          type="button"
          onClick={resetToDefaults}
          className="rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-zinc-600 hover:bg-zinc-50"
        >
          Khôi phục mặc định (form)
        </button>
        {status === "saved" ? (
          <span className="text-xs font-bold text-success">Đã lưu — học viên sẽ thấy lịch mới.</span>
        ) : null}
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-5">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-muted">
          Xem trước (học viên)
        </h3>
        <ul className="mt-4 space-y-3">
          {previewSlots.map((slot) => (
            <li
              key={slot.id}
              className="rounded-xl border border-primary/10 bg-white px-4 py-3 text-sm"
            >
              <span className="font-black uppercase text-primary">[{slot.dayLabel}]</span>{" "}
              <span className="font-bold text-foreground">{slot.time}</span>
              {slot.dateNote ? (
                <span className="text-muted"> · {slot.dateNote}</span>
              ) : null}
              <div className="mt-1 text-xs font-medium text-muted">{slot.title}</div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
