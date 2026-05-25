"use client";

import { Panel } from "@/components/student/ui";
import { usePracticeWeeklySchedule } from "@/hooks/usePracticeWeeklySchedule";
import { PRACTICE_CLASS_DESCRIPTION, type PracticeSlotId } from "@/lib/practiceClass";

type PracticeClassPanelProps = {
  registeredSlotIds: Set<PracticeSlotId>;
  onRegisterSlot: (slotId: PracticeSlotId) => void;
  onUnregisterSlot?: (slotId: PracticeSlotId) => void;
  onResetTest?: () => void;
};

export function PracticeClassPanel({
  registeredSlotIds,
  onRegisterSlot,
  onUnregisterSlot,
  onResetTest,
}: PracticeClassPanelProps) {
  const { slots, weekRangeLabel } = usePracticeWeeklySchedule();

  return (
    <Panel title="Lớp luyện đề tập trung" className="w-full">
      <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4">
        <div className="text-[10px] font-black uppercase tracking-widest text-primary">
          Giới thiệu lớp
        </div>
        <p className="mt-2 text-sm font-medium leading-relaxed text-foreground">
          {PRACTICE_CLASS_DESCRIPTION}
        </p>
      </div>

      <div className="mt-5">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <div className="text-[10px] font-black uppercase tracking-widest text-muted">
            Lịch học hàng tuần
          </div>
          {weekRangeLabel ? (
            <span className="text-[10px] font-bold text-primary">{weekRangeLabel}</span>
          ) : null}
        </div>
        <p className="mb-3 text-[11px] font-medium text-muted">
          Đăng ký từng buổi bên dưới — buổi nào đã đăng ký sẽ hiển thị trên Thời khoá biểu. Lịch
          do ACA cập nhật mỗi tuần.
        </p>
        <ul className="space-y-3">
          {slots.map((slot) => {
            const registered = registeredSlotIds.has(slot.id);
            return (
              <li
                key={slot.id}
                className={`rounded-2xl border p-4 transition-colors ${
                  registered
                    ? "border-success/25 bg-success/5"
                    : "border-primary/10 bg-background/60"
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <span className="text-xs font-black uppercase text-primary">
                        [{slot.dayLabel}]
                      </span>
                      {slot.dateNote ? (
                        <span className="text-xs font-bold text-foreground">{slot.dateNote}</span>
                      ) : null}
                      <span className="text-xs font-bold text-foreground">{slot.time}</span>
                      <span className="text-[10px] font-semibold text-muted">
                        · {slot.platform}
                      </span>
                    </div>
                    <div className="mt-2 text-sm font-bold text-foreground">{slot.title}</div>
                    <p className="mt-1.5 text-[12px] font-medium leading-relaxed text-muted">
                      {slot.detail}
                    </p>
                  </div>
                  <div className="shrink-0 sm:pt-1">
                    {registered ? (
                      <div className="flex flex-col items-stretch gap-2 sm:items-end">
                        <span className="inline-flex rounded-full bg-success/10 px-3 py-1.5 text-[10px] font-black uppercase text-success">
                          Đã đăng ký · trên lịch
                        </span>
                        {onUnregisterSlot ? (
                          <button
                            type="button"
                            onClick={() => onUnregisterSlot(slot.id)}
                            className="text-[10px] font-bold uppercase tracking-wide text-muted underline-offset-2 hover:text-danger hover:underline"
                          >
                            Huỷ đăng ký
                          </button>
                        ) : null}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onRegisterSlot(slot.id)}
                        className="h-10 whitespace-nowrap rounded-xl bg-primary px-4 text-[10px] font-black uppercase tracking-widest text-white shadow-sm transition-all hover:bg-primary/90"
                      >
                        Đăng ký ngay
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        {onResetTest ? (
          <div className="mt-4 flex justify-end border-t border-primary/5 pt-4">
            <button
              type="button"
              onClick={onResetTest}
              className="text-[10px] font-bold uppercase tracking-wide text-muted underline-offset-2 hover:text-secondary hover:underline"
            >
              Reset đăng ký (test)
            </button>
          </div>
        ) : null}
      </div>
    </Panel>
  );
}
