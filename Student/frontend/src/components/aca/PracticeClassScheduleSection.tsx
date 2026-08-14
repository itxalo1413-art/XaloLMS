"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { canUsePracticeClassApi } from "@/lib/practiceClassApi";
import {
  getDefaultPracticeWeeklySchedule,
  getPracticeScheduleUpdatedAt,
  getPracticeWeekRangeLabel,
  PRACTICE_CLASS_SCHEDULE_UPDATE_EVENT,
  PRACTICE_SLOT_IDS,
  refreshPracticeScheduleForAca,
  savePracticeScheduleFromAca,
  type PracticeSlotId,
  type PracticeSlotScheduleOverride,
} from "@/lib/practiceClass";

function formatUpdatedAt(iso: string | undefined | null) {
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

function overridesFromSlots(
  slots: ReturnType<typeof getDefaultPracticeWeeklySchedule>,
): Record<PracticeSlotId, PracticeSlotScheduleOverride> {
  const out = {} as Record<PracticeSlotId, PracticeSlotScheduleOverride>;
  for (const id of PRACTICE_SLOT_IDS) {
    const slot = slots.find((s) => s.id === id)!;
    out[id] = {
      dayLabel: slot.dayLabel,
      time: slot.time,
      dateNote: slot.dateNote ?? "",
      title: slot.title ?? "",
      detail: slot.detail ?? "",
      platform: slot.platform ?? "Zoom",
      meetingId: slot.meeting?.meetingId ?? "842 1963 4521",
      password: slot.meeting?.password ?? "XaloLrw26",
      joinUrl: slot.meeting?.joinUrl ?? "",
    };
  }
  return out;
}

export function PracticeClassScheduleSection() {
  const [weekRangeLabel, setWeekRangeLabel] = useState("");
  const [slotDrafts, setSlotDrafts] = useState<
    Record<PracticeSlotId, PracticeSlotScheduleOverride>
  >(() => overridesFromSlots(getDefaultPracticeWeeklySchedule()));
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const syncFromServer = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await refreshPracticeScheduleForAca();
      setWeekRangeLabel(res.weekRangeLabel);
      setSlotDrafts(overridesFromSlots(res.slots));
      setSavedAt(res.updatedAt);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Không tải được lịch từ server.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void syncFromServer();
    const onUpdate = () => void syncFromServer();
    window.addEventListener(PRACTICE_CLASS_SCHEDULE_UPDATE_EVENT, onUpdate);
    return () => window.removeEventListener(PRACTICE_CLASS_SCHEDULE_UPDATE_EVENT, onUpdate);
  }, [syncFromServer]);

  const previewSlots = useMemo(() => {
    return getDefaultPracticeWeeklySchedule().map((base) => {
      const d = slotDrafts[base.id];
      return {
        ...base,
        dayLabel: d.dayLabel.trim() || base.dayLabel,
        time: d.time.trim() || base.time,
        dateNote: d.dateNote?.trim() || undefined,
        title: d.title?.trim() || base.title,
        detail: d.detail?.trim() || base.detail,
        platform: d.platform?.trim() || base.platform,
        meeting: {
          meetingId: d.meetingId?.trim() || base.meeting.meetingId,
          password: d.password?.trim() || base.meeting.password,
          joinUrl: d.joinUrl?.trim() || base.meeting.joinUrl,
        },
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

  const save = async () => {
    setStatus("idle");
    setErrorMessage(null);
    try {
      const res = await savePracticeScheduleFromAca(weekRangeLabel, slotDrafts);
      setSavedAt(res.updatedAt);
      setStatus("saved");
      setWeekRangeLabel(res.weekRangeLabel);
      setSlotDrafts(overridesFromSlots(res.slots));
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        err instanceof Error ? err.message : "Lưu lịch thất bại.",
      );
    }
  };

  const resetToDefaults = () => {
    const defaults = getDefaultPracticeWeeklySchedule();
    setSlotDrafts(overridesFromSlots(defaults));
    setWeekRangeLabel("");
    setStatus("idle");
  };

  const defaults = getDefaultPracticeWeeklySchedule();
  const weekLabelDisplay = getPracticeWeekRangeLabel();
  const updatedAtDisplay = getPracticeScheduleUpdatedAt();

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-primary/15 bg-primary/5 p-5">
        <h2 className="text-sm font-bold text-foreground">Lịch tuần & Thông tin Zoom/Meet — Lớp luyện đề tập trung</h2>
        <p className="mt-2 text-xs font-medium leading-relaxed text-muted">
          Cập nhật ngày, giờ học, <strong>ID phòng Zoom (vd: 842 1963 4521)</strong>, <strong>Mật khẩu Zoom (vd: XaloLrw26)</strong> và nội dung bài học. Sau khi bấm <strong>LƯU LỊCH TUẦN</strong>, học viên sẽ thấy ngay thông tin mới trên trang <strong>Hỗ trợ tự học</strong> và <strong>Thời khoá biểu</strong>.
        </p>
        {!canUsePracticeClassApi() ? (
          <p className="mt-2 text-xs font-bold text-amber-800">
            Đăng nhập tài khoản ACA (cùng trang /login) để lưu lịch lên server. Hiện đang dùng bản
            local trên trình duyệt.
          </p>
        ) : null}
        <p className="mt-2 text-[11px] text-muted">
          Cập nhật lần cuối:{" "}
          <span className="font-bold text-foreground">
            {formatUpdatedAt(savedAt ?? updatedAtDisplay)}
          </span>
          {weekLabelDisplay ? (
            <>
              {" "}
              · Tuần:{" "}
              <span className="font-bold text-primary">{weekLabelDisplay}</span>
            </>
          ) : (
            <span className="italic"> (chưa ghi nhãn tuần)</span>
          )}
        </p>
      </section>

      {errorMessage ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-sm text-muted">
          Đang tải lịch...
        </div>
      ) : (
        <>
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

          <div className="space-y-6">
            {PRACTICE_SLOT_IDS.map((id) => {
              const base = defaults.find((s) => s.id === id)!;
              const draft = slotDrafts[id];
              return (
                <div
                  key={id}
                  className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between border-b border-zinc-100 pb-3 gap-2">
                    <div>
                      <div className="text-sm font-bold text-zinc-900">{draft.title || base.title}</div>
                      <div className="mt-0.5 text-xs font-semibold text-primary">
                        {base.dayLabel} ({base.dayOfWeek === 4 ? "Thứ 5" : base.dayOfWeek === 2 ? "Thứ 3" : "Thứ 7"}) · {draft.time || base.time}
                      </div>
                    </div>
                    <span className="rounded-lg bg-zinc-100 px-2.5 py-1 text-[10px] font-black uppercase text-zinc-600 border border-zinc-200">
                      {draft.platform || base.platform}
                    </span>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-zinc-500">
                        Tiêu đề buổi học
                      </label>
                      <input
                        type="text"
                        value={draft.title}
                        onChange={(e) => updateSlot(id, "title", e.target.value)}
                        placeholder={base.title}
                        className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs font-bold outline-none focus:border-primary/40"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-zinc-500">
                        Giờ học thực tế
                      </label>
                      <input
                        type="text"
                        value={draft.time}
                        onChange={(e) => updateSlot(id, "time", e.target.value)}
                        placeholder={base.time}
                        className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs font-bold outline-none focus:border-primary/40"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-zinc-500">
                        Nền tảng học (Zoom / Meet)
                      </label>
                      <input
                        type="text"
                        value={draft.platform}
                        onChange={(e) => updateSlot(id, "platform", e.target.value)}
                        placeholder={base.platform}
                        className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs font-bold outline-none focus:border-primary/40"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-zinc-500">
                        ID phòng Zoom / Meet
                      </label>
                      <input
                        type="text"
                        value={draft.meetingId}
                        onChange={(e) => updateSlot(id, "meetingId", e.target.value)}
                        placeholder="842 1963 4521"
                        className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs font-bold text-indigo-900 outline-none focus:border-primary/40"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-zinc-500">
                        Mật khẩu Zoom / Passcode
                      </label>
                      <input
                        type="text"
                        value={draft.password}
                        onChange={(e) => updateSlot(id, "password", e.target.value)}
                        placeholder="XaloLrw26"
                        className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs font-bold text-indigo-900 outline-none focus:border-primary/40"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-zinc-500">
                        Link phòng học trực tiếp (Join URL)
                      </label>
                      <input
                        type="text"
                        value={draft.joinUrl}
                        onChange={(e) => updateSlot(id, "joinUrl", e.target.value)}
                        placeholder="https://zoom.us/j/84219634521?pwd=..."
                        className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs font-bold outline-none focus:border-primary/40"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-zinc-500">
                      Chi tiết mô tả lớp học (Mô tả hiển thị cho học viên)
                    </label>
                    <textarea
                      rows={2}
                      value={draft.detail}
                      onChange={(e) => updateSlot(id, "detail", e.target.value)}
                      placeholder={base.detail}
                      className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs font-medium outline-none focus:border-primary/40"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void save()}
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
              <span className="text-xs font-bold text-success">
                Đã lưu — học viên sẽ thấy lịch mới.
              </span>
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
        </>
      )}
    </div>
  );
}
