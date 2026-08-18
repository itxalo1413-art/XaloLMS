import { useState, useEffect } from "react";
import { PracticeZoomRoomBlock } from "@/components/student/PracticeMeetingAccessBlock";
import { PracticeClassWeeklyWarning } from "@/components/student/PracticeClassWeeklyWarning";
import { usePracticeWeeklySchedule } from "@/hooks/usePracticeWeeklySchedule";
import { CollapsiblePanel } from "@/components/student/ui";
import {
  resolvePracticeMeetingAccess,
  getStudentPracticeFolderUrl,
  saveStudentPracticeFolderUrl,
  getSaturdayRotatedWeekNumber,
  getPracticeSlotMaterialsUrl,
  savePracticeSlotMaterialsUrl,
  PRACTICE_CLASS_SCHEDULE_UPDATE_EVENT,
  type PracticeSlotId,
} from "@/lib/practiceClass";
import { PracticeClassRlpTable } from "@/components/student/PracticeClassRlpTable";
import type { RlpSession } from "@/lib/courseSchedule";
import type { CreatePracticeRlpPayload, UpdatePracticeRlpPayload } from "@/lib/practiceRlpApi";

export { PracticeClassWeeklyWarning } from "@/components/student/PracticeClassWeeklyWarning";

export type PracticeScoreRow = {
  test: string;
  name: string;
  l: string;
  r: string;
  w: string;
};

type PracticeClassPanelProps = {
  registeredSlotIds: Set<PracticeSlotId>;
  onRegisterSlot: (slotId: PracticeSlotId) => void;
  onUnregisterSlot?: (slotId: PracticeSlotId) => void;
  onResetTest?: () => void;
  scoresRows?: PracticeScoreRow[];
  /** Student ID for RLP API */
  studentId?: string;
  /** RLP sessions for this student */
  rlpSessions?: RlpSession[];
  /** Whether to show the RLP section at all.
   *  true  = HS (own data) or Thanh Tâm/Khánh Thi
   *  false = other GV — RLP section is completely hidden
   */
  showRlp?: boolean;
  /** If true: show Add/Edit/Delete buttons (Thanh Tâm & Khánh Thi only) */
  canEditRlp?: boolean;
  onRlpAdd?: (payload: CreatePracticeRlpPayload) => Promise<void>;
  onRlpUpdate?: (no: number, payload: UpdatePracticeRlpPayload) => Promise<void>;
  onRlpDelete?: (no: number) => Promise<void>;
  onToggleHomework?: (row: RlpSession) => Promise<void>;
};

export function PracticeClassPanel({
  registeredSlotIds,
  onRegisterSlot,
  onUnregisterSlot,
  onResetTest,
  scoresRows,
  studentId = "",
  rlpSessions = [],
  showRlp = false,
  canEditRlp = false,
  onRlpAdd,
  onRlpUpdate,
  onRlpDelete,
  onToggleHomework,
}: PracticeClassPanelProps) {
  const { slots, weekRangeLabel } = usePracticeWeeklySchedule();
  const [selectedSlotId, setSelectedSlotId] = useState<PracticeSlotId | null>(null);
  const [folderUrl, setFolderUrl] = useState(() => getStudentPracticeFolderUrl(studentId));
  const [isEditingFolder, setIsEditingFolder] = useState(false);
  const [folderInput, setFolderInput] = useState("");

  const [editingMaterialsSlotId, setEditingMaterialsSlotId] = useState<string | null>(null);
  const [materialsInput, setMaterialsInput] = useState("");

  const [folderSaving, setFolderSaving] = useState(false);
  const [materialsSaving, setMaterialsSaving] = useState(false);

  useEffect(() => {
    setFolderUrl(getStudentPracticeFolderUrl(studentId));
    const onUpdate = () => setFolderUrl(getStudentPracticeFolderUrl(studentId));
    window.addEventListener(PRACTICE_CLASS_SCHEDULE_UPDATE_EVENT, onUpdate);
    return () => window.removeEventListener(PRACTICE_CLASS_SCHEDULE_UPDATE_EVENT, onUpdate);
  }, [studentId]);

  const toggleSlot = (id: PracticeSlotId) => {
    if (!registeredSlotIds.has(id)) return;
    setSelectedSlotId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-4">
      <PracticeClassWeeklyWarning />

      {onResetTest ? (
        <div className="mt-3 flex justify-start">
          <button
            type="button"
            onClick={onResetTest}
            className="inline-flex items-center rounded-xl border border-zinc-200 bg-white px-3.5 py-1.5 text-xs font-bold text-zinc-600 hover:bg-zinc-100 hover:text-danger transition-all shadow-2xs"
            title="Reset đăng ký và quay lại nút Đăng ký lớp luyện đề ban đầu"
          >
            Reset đăng ký (Quay lại Đăng ký lớp luyện đề)
          </button>
        </div>
      ) : null}

      <div className="mt-5">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <div className="text-[10px] font-black uppercase tracking-widest text-muted">
            Lịch học hàng tuần (Đăng ký buổi học để xem thông tin lớp)
          </div>
          {weekRangeLabel ? (
            <span className="text-[10px] font-bold text-primary">{weekRangeLabel}</span>
          ) : null}
        </div>

        <ul className="space-y-3">
          {slots.map((slot) => {
            const registered = registeredSlotIds.has(slot.id);
            const isSelected = selectedSlotId === slot.id;
            const showDetails = registered && isSelected;
            const meeting = resolvePracticeMeetingAccess(slot);
            return (
              <li
                key={slot.id}
                onClick={() => toggleSlot(slot.id)}
                className={`rounded-2xl border p-4 transition-all ${
                  registered
                    ? "border-success/30 bg-success/5 shadow-2xs cursor-pointer"
                    : "border-primary/10 bg-background/60"
                } ${
                  isSelected ? "ring-2 ring-primary/10" : ""
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
                    <div className="mt-2 text-sm font-bold text-foreground flex items-center gap-2">
                      {slot.title}
                      {registered ? (
                        <span className="text-[10px] font-semibold text-primary/70 bg-primary/10 px-2 py-0.5 rounded-md">
                          {showDetails ? "▲ Thu gọn" : "▼ Xem thông tin lớp"}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1.5 text-[12px] font-medium leading-relaxed text-muted">
                      {slot.detail}
                    </p>
                  </div>
                  <div
                    className="shrink-0 sm:pt-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {registered ? (
                      <div className="flex flex-col items-stretch gap-2 sm:items-end">
                        <span className="inline-flex rounded-full bg-success/10 px-3 py-1.5 text-[10px] font-black uppercase text-success">
                          Đã đăng ký · trên lịch
                        </span>
                        {onUnregisterSlot ? (
                          <button
                            type="button"
                            onClick={() => {
                              if (selectedSlotId === slot.id) setSelectedSlotId(null);
                              onUnregisterSlot(slot.id);
                            }}
                            className="text-[10px] font-bold uppercase tracking-wide text-muted underline-offset-2 hover:text-danger hover:underline"
                          >
                            Huỷ đăng ký
                          </button>
                        ) : null}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          onRegisterSlot(slot.id);
                          setSelectedSlotId(slot.id);
                        }}
                        className="h-10 whitespace-nowrap rounded-xl bg-primary px-4 text-[10px] font-black uppercase tracking-widest text-white shadow-sm transition-all hover:bg-primary/90"
                      >
                        Đăng ký buổi này
                      </button>
                    )}
                  </div>
                </div>

                {showDetails ? (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="mt-3.5 pt-3 border-t border-emerald-200/80 rounded-xl bg-white/90 p-3.5 space-y-3 shadow-2xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-xs font-black text-emerald-900 flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        Thông tin lớp học ({slot.platform})
                      </div>
                      <a
                        href={meeting.joinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-3 py-1 text-xs font-black text-white hover:bg-emerald-800 transition-all shadow-2xs"
                      >
                        Vào lớp học ngay ↗
                      </a>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold text-zinc-700 bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-200/60">
                      <div>
                        <span className="text-[10px] font-black uppercase text-emerald-800 block">Thời gian học:</span>
                        <span className="font-bold text-foreground">[{slot.dayLabel}] {slot.time}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase text-emerald-800 block">Phòng học / ID & Pass:</span>
                        <span className="font-mono text-foreground font-bold">
                          ID: {meeting.meetingId} · Pass: {meeting.password}
                        </span>
                      </div>
                    </div>

                    {/* 2 Cột: 1) Folder bài tập cá nhân & 2) Bộ đề & bài tập (Xoay đổi Thứ 7) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold text-zinc-700 bg-emerald-50/40 p-2.5 rounded-lg border border-emerald-200/50">
                      {/* Column 1: Personal Homework Folder */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase text-emerald-800 block">1. Folder Bài Tập Cá Nhân:</span>
                        {isEditingFolder ? (
                          <div className="flex items-center gap-1.5 mt-1">
                            <input
                              type="text"
                              value={folderInput}
                              onChange={(e) => setFolderInput(e.target.value)}
                              placeholder="Link Drive Folder..."
                              className="h-8 flex-1 rounded-lg border border-zinc-300 bg-white px-2 text-[11px]"
                            />
                            <button
                              type="button"
                              disabled={folderSaving}
                              onClick={() => {
                                void (async () => {
                                  if (!folderInput.trim()) {
                                    setIsEditingFolder(false);
                                    return;
                                  }
                                  setFolderSaving(true);
                                  try {
                                    await saveStudentPracticeFolderUrl(studentId, folderInput.trim(), {
                                      asTeacher: canEditRlp,
                                    });
                                    setFolderUrl(folderInput.trim());
                                    setIsEditingFolder(false);
                                  } catch (err) {
                                    console.error(err);
                                    alert(err instanceof Error ? err.message : "Không lưu được link folder.");
                                  } finally {
                                    setFolderSaving(false);
                                  }
                                })();
                              }}
                              className="h-8 rounded-lg bg-emerald-700 px-2 text-[10px] font-bold text-white hover:bg-emerald-800 disabled:opacity-50"
                            >
                              {folderSaving ? "..." : "Lưu"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsEditingFolder(false)}
                              className="h-8 rounded-lg border border-zinc-300 px-2 text-[10px] font-bold text-zinc-600 hover:bg-zinc-100"
                            >
                              Hủy
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 flex-wrap mt-0.5">
                            {folderUrl ? (
                              <a
                                href={folderUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 rounded-lg bg-emerald-800 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-900 transition-all"
                              >
                                Mở Folder cá nhân
                              </a>
                            ) : (
                              <span className="text-[11px] text-zinc-400 italic">Chưa cài link folder</span>
                            )}
                            {canEditRlp && (
                              <button
                                type="button"
                                onClick={() => {
                                  setFolderInput(folderUrl);
                                  setIsEditingFolder(true);
                                }}
                                className="text-[10px] font-bold text-emerald-700 underline hover:text-emerald-900 cursor-pointer"
                              >
                                Đổi Link
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Column 2: Weekly Exam Material Link (Rotates every Saturday) */}
                      {(() => {
                        const matUrl = getPracticeSlotMaterialsUrl(slot.id, slot.materialsUrl);
                        const isEditingMat = editingMaterialsSlotId === slot.id;
                        return (
                          <div className="space-y-1">
                            <span className="text-[10px] font-black uppercase text-emerald-800 block">
                              2. Bộ Đề & Bài Tập (Đã cập nhật Đề Tuần {getSaturdayRotatedWeekNumber()}):
                            </span>
                            {isEditingMat ? (
                              <div className="flex items-center gap-1.5 mt-1">
                                <input
                                  type="text"
                                  value={materialsInput}
                                  onChange={(e) => setMaterialsInput(e.target.value)}
                                  placeholder="Link Bộ Đề mới..."
                                  className="h-8 flex-1 rounded-lg border border-zinc-300 bg-white px-2 text-[11px]"
                                />
                                <button
                                  type="button"
                                  disabled={materialsSaving}
                                  onClick={() => {
                                    void (async () => {
                                      if (!materialsInput.trim()) {
                                        setEditingMaterialsSlotId(null);
                                        return;
                                      }
                                      setMaterialsSaving(true);
                                      try {
                                        await savePracticeSlotMaterialsUrl(
                                          slot.id,
                                          materialsInput.trim(),
                                        );
                                        setEditingMaterialsSlotId(null);
                                      } catch (err) {
                                        console.error(err);
                                        alert(err instanceof Error ? err.message : "Không lưu được link bộ đề.");
                                      } finally {
                                        setMaterialsSaving(false);
                                      }
                                    })();
                                  }}
                                  className="h-8 rounded-lg bg-emerald-700 px-2 text-[10px] font-bold text-white hover:bg-emerald-800 disabled:opacity-50"
                                >
                                  {materialsSaving ? "..." : "Lưu"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingMaterialsSlotId(null)}
                                  className="h-8 rounded-lg border border-zinc-300 px-2 text-[10px] font-bold text-zinc-600 hover:bg-zinc-100"
                                >
                                  Hủy
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 flex-wrap mt-0.5">
                                <a
                                  href={matUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-800 transition-all"
                                >
                                  Mở Bộ Đề Tuần {getSaturdayRotatedWeekNumber()}
                                </a>
                                {canEditRlp && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setMaterialsInput(matUrl);
                                      setEditingMaterialsSlotId(slot.id);
                                    }}
                                    className="text-[10px] font-bold text-emerald-700 underline hover:text-emerald-900 cursor-pointer"
                                  >
                                    Đổi Link Đề
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>

      {scoresRows ? (
        <div className="mt-8 pt-6 border-t border-primary/10 space-y-3">
          <div className="text-[10px] font-black uppercase tracking-widest text-muted">
            Kết quả Mock Test Lớp luyện đề
          </div>
          <div className="overflow-x-auto rounded-2xl border border-primary/10 bg-card shadow-2xs">
            <table className="w-full border-separate border-spacing-0">
              <thead>
                <tr className="bg-background/50">
                  {["TEST", "HỌC VIÊN", "LISTENING", "READING", "WRITING"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-[10px] font-black text-muted uppercase tracking-widest border-b border-primary/5"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/5">
                {scoresRows.length > 0 ? (
                  scoresRows.map((row, idx) => (
                    <tr key={`${row.test}-${idx}`} className="hover:bg-background/30 transition-colors">
                      <td className="px-4 py-4 text-xs font-bold text-foreground">{row.test}</td>
                      <td className="px-4 py-4 text-xs font-bold text-muted">{row.name}</td>
                      <td className="px-4 py-4 text-xs font-black text-foreground">{row.l}</td>
                      <td className="px-4 py-4 text-xs font-black text-foreground">{row.r}</td>
                      <td className="px-4 py-4 text-xs font-black text-foreground">{row.w}</td>
                    </tr>
                  ))
                ) : (
                  <tr className="hover:bg-background/30 transition-colors">
                    <td className="px-4 py-4 text-xs font-bold text-muted">—</td>
                    <td className="px-4 py-4 text-xs font-bold text-muted">—</td>
                    <td className="px-4 py-4 text-xs font-black text-muted">—</td>
                    <td className="px-4 py-4 text-xs font-black text-muted">—</td>
                    <td className="px-4 py-4 text-xs font-black text-muted">—</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {/* ── RLP - Resonant Lesson Plan ──────────────────────────────────────── */}
      {showRlp && (
        <div className="mt-8 pt-6 border-t border-primary/10">
          <PracticeClassRlpTable
            studentId={studentId}
            sessions={rlpSessions}
            canEdit={canEditRlp}
            onAdd={onRlpAdd}
            onUpdate={onRlpUpdate}
            onDelete={onRlpDelete}
            onToggleHomework={onToggleHomework}
          />
        </div>
      )}
    </div>
  );
}
