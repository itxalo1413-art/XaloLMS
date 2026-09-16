"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import type { BcbQuestionTypeRow } from "@/lib/guestBcbDiagnosis";
import {
  DEFAULT_GUEST_DIAGNOSIS,
  getGuestDiagnosis,
  saveGuestDiagnosis,
  type GuestDiagnosisRecord,
} from "@/lib/guestDiagnosisStore";
import {
  getGuestLeadWithDiagnosis,
  saveGuestLeadDiagnosis,
} from "@/lib/guestDiagnosisLeads";
import {
  DEFAULT_STUDENT_DIAGNOSIS,
  EMPTY_STUDENT_DIAGNOSIS,
  persistStudentDiagnosisToApi,
  registerDynamicStudentScores,
  syncStudentDiagnosisFromApi,
  type StudentDiagnosisRecord,
} from "@/lib/studentDiagnosisStore";
import { fetchAcaStudent } from "@/lib/acaManagementApi";
import { confirmDialog } from "@/components/shared/ConfirmDialog";
import {
  getSpeakingStandardDescription,
  getWritingTask1StandardDescription,
  getWritingTask2StandardDescription,
  WRITING_TASK1_STANDARD_DESCRIPTIONS,
  WRITING_TASK2_STANDARD_DESCRIPTIONS,
  SPEAKING_BAND_DESCRIPTIONS,
} from "@/lib/bcbStandardReference";
import { formatBandScore } from "@/lib/formatBandScore";
import { BcbSkillDiagnosticSection } from "@/components/shared/BcbSkillDiagnosticSection";

type Variant = "student" | "guest";

/** Sale chỉ điền L/R; Writing & Speaking do Grader nhập khi chấm. */
type SkillScope = "all" | "lr-only";

type Props = {
  variant: Variant;
  portalLabel: string;
  studentId?: string;
  studentEmail?: string;
  studentName?: string;
  /** Lead guest-diagnosis — lưu/đọc BCB theo lead trên Mongo. */
  leadId?: string;
  initialScores?: any;
  /** Mặc định `all`. Sale dùng `lr-only`. */
  skillScope?: SkillScope;
};

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-wider text-muted">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

const inputClass =
  "w-full rounded-xl border border-primary/15 bg-white px-3 py-2 text-xs font-bold text-foreground outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 shadow-2xs";

function BcbRowsEditor({
  rows,
  onChange,
  skillName = "bài",
  presets = [],
}: {
  rows: BcbQuestionTypeRow[];
  onChange: (rows: BcbQuestionTypeRow[]) => void;
  skillName?: string;
  presets?: string[];
}) {
  // Automatically pre-populate standard question types if rows is empty
  useEffect(() => {
    if ((!rows || rows.length === 0) && presets.length > 0) {
      const initialRows: BcbQuestionTypeRow[] = presets.map((title, idx) => ({
        id: `row_init_${idx}_${Date.now()}`,
        title,
        correct: 0,
        total: 0,
        errorRate: 0,
        diagnosis: "",
      }));
      onChange(initialRows);
    }
  }, [rows, presets, onChange]);

  const currentRows = (rows && rows.length > 0) ? rows : presets.map((title, idx) => ({
    id: `row_fallback_${idx}`,
    title,
    correct: 0,
    total: 0,
    errorRate: 0,
    diagnosis: "",
  }));

  const update = (idx: number, patch: Partial<BcbQuestionTypeRow>) => {
    onChange(currentRows.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  const handleAddRow = (title = "") => {
    const newRow: BcbQuestionTypeRow = {
      id: `row_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: title || `Dạng bài bổ sung`,
      correct: 0,
      total: 0,
      errorRate: 0,
      diagnosis: "",
    };
    onChange([...currentRows, newRow]);
  };

  const handleDeleteRow = (idx: number) => {
    onChange(currentRows.filter((_, i) => i !== idx));
  };

  const handleResetToStandard = async () => {
    const ok = await confirmDialog({
      title: "Thiết lập lại dạng bài chuẩn",
      message: `Bạn có muốn thiết lập lại toàn bộ danh sách dạng bài chuẩn cho kỹ năng ${skillName}?`,
      confirmText: "Thiết lập lại",
      cancelText: "Hủy",
      variant: "warning",
    });
    if (!ok) return;
    const resetRows: BcbQuestionTypeRow[] = presets.map((title, idx) => ({
      id: `row_reset_${idx}_${Date.now()}`,
      title,
      correct: 0,
      total: 0,
      errorRate: 0,
      diagnosis: "",
    }));
    onChange(resetRows);
  };

  const weakCount = currentRows.filter((r) => (r.errorRate ?? 0) >= 50).length;
  const avgError = currentRows.length > 0
    ? Math.round(currentRows.reduce((acc, r) => acc + (r.errorRate ?? 0), 0) / currentRows.length)
    : 0;

  return (
    <div className="space-y-3">
      {/* Top Header & Summary Info */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 rounded-2xl bg-zinc-50 border border-zinc-200">
        <div className="flex items-center gap-2 text-xs font-black text-zinc-800">
          <span className="h-2 w-2 rounded-full bg-primary" />
          <span>Bảng chia sẵn {currentRows.length} dạng bài chuẩn {skillName}</span>
          <span className="text-zinc-300">|</span>
          <span className="text-zinc-500 font-bold">Tỷ lệ sai TB: <strong className="text-amber-700 font-black">{avgError}%</strong></span>
          {weakCount > 0 && (
            <span className="text-rose-700 font-black bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md text-[11px]">
              {weakCount} dạng sai &ge; 50%
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetToStandard}
            className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-zinc-500 hover:text-zinc-800 bg-white border border-zinc-200 hover:bg-zinc-100 transition-all cursor-pointer shadow-2xs"
            title="Khôi phục lại danh sách dạng bài chuẩn"
          >
            ↺ Đặt lại dạng chuẩn
          </button>
        </div>
      </div>

      {/* Column-divided Structured Table */}
      <div className="overflow-hidden rounded-2xl border border-primary/20 bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[780px]">
            <thead>
              <tr className="bg-gradient-to-r from-zinc-50 to-zinc-100/80 border-b border-primary/15 text-[10px] font-black uppercase tracking-wider text-zinc-500">
                <th className="px-4 py-3.5 w-[28%]">Tên dạng bài</th>
                <th className="px-3 py-3.5 w-[11%] text-center">Số câu đúng</th>
                <th className="px-3 py-3.5 w-[11%] text-center">Tổng số câu</th>
                <th className="px-3 py-3.5 w-[14%] text-center">Tỷ lệ sai (%)</th>
                <th className="px-4 py-3.5 w-[31%]">Chẩn đoán & Ghi chú chi tiết</th>
                <th className="px-2 py-3.5 w-[5%] text-center">Xóa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-xs">
              {currentRows.map((row, idx) => {
                const errorRate = row.errorRate ?? 0;
                const isHighError = errorRate >= 50;
                const isModerateError = errorRate >= 30 && errorRate < 50;

                return (
                  <tr
                    key={row.id || idx}
                    className={`transition-colors ${
                      isHighError
                        ? "bg-rose-50/25 hover:bg-rose-50/40"
                        : idx % 2 === 1
                        ? "bg-zinc-50/40 hover:bg-zinc-50/70"
                        : "hover:bg-zinc-50/50"
                    }`}
                  >
                    {/* Cột 1: Tên Dạng bài */}
                    <td className="px-4 py-3 align-middle">
                      <div className="flex items-center gap-2">
                        <span className="shrink-0 flex items-center justify-center h-6 w-6 rounded-lg bg-zinc-100 text-[10px] font-black text-zinc-600 border border-zinc-200">
                          #{idx + 1}
                        </span>
                        <input
                          className="w-full rounded-xl border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-bold text-zinc-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 shadow-2xs"
                          placeholder="Tên dạng bài..."
                          value={row.title}
                          onChange={(e) => update(idx, { title: e.target.value })}
                        />
                      </div>
                    </td>

                    {/* Cột 2: Số câu đúng */}
                    <td className="px-3 py-3 align-middle text-center">
                      <input
                        type="number"
                        min={0}
                        className="w-full rounded-xl border border-zinc-200 bg-white px-2 py-1.5 text-xs font-black text-center text-emerald-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 shadow-2xs"
                        placeholder="0"
                        value={row.correct ?? 0}
                        title="Số câu làm đúng"
                        onChange={(e) => {
                          const correct = Number(e.target.value) || 0;
                          const total = row.total ?? 0;
                          update(idx, {
                            correct,
                            errorRate: total > 0 ? Math.round(((total - Math.min(correct, total)) / total) * 100) : row.errorRate,
                          });
                        }}
                      />
                    </td>

                    {/* Cột 3: Tổng số câu */}
                    <td className="px-3 py-3 align-middle text-center">
                      <input
                        type="number"
                        min={0}
                        className="w-full rounded-xl border border-zinc-200 bg-white px-2 py-1.5 text-xs font-black text-center text-zinc-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 shadow-2xs"
                        placeholder="0"
                        value={row.total ?? 0}
                        title="Tổng số câu bài thi"
                        onChange={(e) => {
                          const total = Number(e.target.value) || 0;
                          const correct = row.correct ?? 0;
                          update(idx, {
                            total,
                            errorRate: total > 0 ? Math.round(((total - Math.min(correct, total)) / total) * 100) : row.errorRate,
                          });
                        }}
                      />
                    </td>

                    {/* Cột 4: Tỷ lệ sai (%) */}
                    <td className="px-3 py-3 align-middle text-center">
                      <div className="flex flex-col items-center justify-center gap-1">
                        <div
                          className={`flex items-center justify-center rounded-xl border px-2.5 py-1 shadow-2xs w-20 ${
                            isHighError
                              ? "bg-rose-50 border-rose-200 text-rose-700"
                              : isModerateError
                              ? "bg-amber-50 border-amber-200 text-amber-700"
                              : "bg-emerald-50 border-emerald-200 text-emerald-700"
                          }`}
                        >
                          <input
                            type="number"
                            min={0}
                            max={100}
                            className="w-10 bg-transparent text-center text-xs font-black outline-none"
                            value={row.errorRate ?? 0}
                            onChange={(e) => update(idx, { errorRate: Number(e.target.value) || 0 })}
                          />
                          <span className="text-[10px] font-black">%</span>
                        </div>
                        {isHighError && (
                          <span className="text-[9px] font-black text-rose-600 uppercase tracking-tight">
                            Ưu tiên
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Cột 5: Chẩn đoán & Ghi chú chi tiết */}
                    <td className="px-4 py-3 align-middle">
                      <textarea
                        rows={2}
                        className="w-full rounded-xl border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 shadow-2xs resize-y"
                        placeholder="Chẩn đoán nguyên nhân sai, bẫy từ vựng hay kỹ năng cần khắc phục..."
                        value={row.diagnosis}
                        onChange={(e) => update(idx, { diagnosis: e.target.value })}
                      />
                    </td>

                    {/* Cột 6: Thao tác Xóa */}
                    <td className="px-2 py-3 align-middle text-center">
                      <button
                        type="button"
                        onClick={() => handleDeleteRow(idx)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Xoá dạng bài này khỏi bảng"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Button Thêm Dạng Bài Khác nếu cần */}
      <button
        type="button"
        onClick={() => handleAddRow()}
        className="w-full py-2.5 rounded-xl border-2 border-dashed border-primary/25 bg-primary/5 hover:bg-primary/10 text-primary text-xs font-black transition-all cursor-pointer shadow-2xs flex items-center justify-center gap-1.5"
      >
        <span>+ Thêm dạng bài bổ sung cho {skillName}</span>
      </button>
    </div>
  );
}

export function DiagnosisEditorSection({
  variant,
  portalLabel,
  studentId,
  studentEmail,
  studentName,
  leadId,
  initialScores,
  skillScope = "all",
}: Props) {
  const lrOnly = skillScope === "lr-only";
  const [studentForm, setStudentForm] = useState<StudentDiagnosisRecord>(
    lrOnly ? EMPTY_STUDENT_DIAGNOSIS : DEFAULT_STUDENT_DIAGNOSIS,
  );
  const [guestForm, setGuestForm] = useState<GuestDiagnosisRecord>(DEFAULT_GUEST_DIAGNOSIS);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [section, setSection] = useState<"scores" | "lr" | "writing" | "speaking">("scores");

  // Reference Drawer Toggles
  const [showWritingRef, setShowWritingRef] = useState(false);
  const [showSpeakingRef, setShowSpeakingRef] = useState(false);

  // Selected Bands for quick inserts
  const [selectedSpeakingBandInsert, setSelectedSpeakingBandInsert] = useState<number>(6);
  const [selectedWritingTask1BandInsert, setSelectedWritingTask1BandInsert] = useState<number>(6);
  const [selectedWritingTask2BandInsert, setSelectedWritingTask2BandInsert] = useState<number>(6);

  useEffect(() => {
    if (lrOnly && (section === "writing" || section === "speaking")) {
      setSection("lr");
    }
  }, [lrOnly, section]);

  const applyGuestBands = (fetched: GuestDiagnosisRecord) => {
    setGuestForm(fetched);
    if (fetched.scores?.speaking) {
      setSelectedSpeakingBandInsert(Math.min(9, Math.max(1, Math.round(fetched.scores.speaking))));
    }
    if (fetched.scores?.writing) {
      const wBand = Math.min(9, Math.max(1, Math.round(fetched.scores.writing)));
      setSelectedWritingTask1BandInsert(wBand);
      setSelectedWritingTask2BandInsert(wBand);
    }
  };

  const sync = useCallback(async () => {
    if (variant === "student" && studentId) {
      if (initialScores) {
        registerDynamicStudentScores(studentId, initialScores);
      }
      const [fetched, roster] = await Promise.all([
        syncStudentDiagnosisFromApi(studentId, studentEmail),
        fetchAcaStudent(studentId),
      ]);
      const examFromRoster = String(roster?.examDate || "").trim();
      const aimFromRoster = String(roster?.aim || "").trim();
      const next = {
        ...fetched,
        ...(examFromRoster ? { examDate: examFromRoster } : {}),
        ...(aimFromRoster && !String(fetched.aim || "").trim()
          ? { aim: aimFromRoster }
          : {}),
        studentEmail: studentEmail || fetched.studentEmail || roster?.email || "",
        studentName: studentName || fetched.studentName || roster?.name || "",
        studentPhone: fetched.studentPhone || roster?.phone || "",
      };
      setStudentForm(next);
      if (next.scores?.speaking) {
        setSelectedSpeakingBandInsert(Math.min(9, Math.max(1, Math.round(next.scores.speaking))));
      }
      if (next.scores?.writing) {
        const wBand = Math.min(9, Math.max(1, Math.round(next.scores.writing)));
        setSelectedWritingTask1BandInsert(wBand);
        setSelectedWritingTask2BandInsert(wBand);
      }
    } else if (variant === "guest" && leadId) {
      try {
        const { diagnosis } = await getGuestLeadWithDiagnosis(leadId);
        applyGuestBands(diagnosis);
      } catch (err: unknown) {
        setSaveError(
          err instanceof Error ? err.message : "Không tải được BCB lead.",
        );
      }
    } else if (variant === "guest") {
      applyGuestBands(getGuestDiagnosis());
    }
  }, [variant, studentId, studentEmail, studentName, leadId, initialScores]);

  useEffect(() => {
    void sync();
  }, [sync]);

  const save = () => {
    setSaveError("");
    if (variant === "student" && studentId) {
      const { updatedAt: _u, ...rest } = studentForm;
      const emailForSave =
        studentEmail || studentForm.studentEmail || rest.studentEmail || "";

      // Sale chỉ lưu L/R + overview; không gửi W/S criteria để backend giữ dữ liệu Grader.
      const payload: Partial<Omit<StudentDiagnosisRecord, "updatedAt">> = lrOnly
        ? (() => {
            const {
              writingCriteria: _w,
              writingSummary: _ws,
              speakingCriteria: _s,
              ...lrSafe
            } = rest;
            return {
              ...lrSafe,
              studentEmail: emailForSave || rest.studentEmail,
              studentName: studentName || rest.studentName,
              skillSummaries: {
                listening: rest.skillSummaries.listening,
                reading: rest.skillSummaries.reading,
                speaking: rest.skillSummaries.speaking,
              },
            };
          })()
        : {
            ...rest,
            studentEmail: emailForSave || rest.studentEmail,
            studentName: studentName || rest.studentName,
          };

      void persistStudentDiagnosisToApi(studentId, emailForSave, payload)
        .then(() => {
          setSaved(true);
          window.setTimeout(() => setSaved(false), 2000);
        })
        .catch((err: unknown) => {
          setSaveError(
            err instanceof Error
              ? err.message
              : "Không lưu được BCB. Kiểm tra email học viên và thử lại.",
          );
        });
      return;
    }

    if (variant === "guest" && leadId) {
      const { updatedAt: _u, ...rest } = guestForm;
      const payload = lrOnly
        ? (() => {
            const {
              writingCriteria: _w,
              writingSummary: _ws,
              speakingCriteria: _s,
              ...lrSafe
            } = rest;
            return {
              ...lrSafe,
              skillSummaries: {
                listening: rest.skillSummaries.listening,
                reading: rest.skillSummaries.reading,
                speaking: rest.skillSummaries.speaking,
              },
            };
          })()
        : rest;

      void saveGuestLeadDiagnosis(leadId, payload)
        .then((savedRow) => {
          applyGuestBands(savedRow);
          setSaved(true);
          window.setTimeout(() => setSaved(false), 2000);
        })
        .catch((err: unknown) => {
          setSaveError(
            err instanceof Error
              ? err.message
              : "Không lưu được BCB lead. Thử lại.",
          );
        });
      return;
    }

    const { updatedAt: _u, ...rest } = guestForm;
    saveGuestDiagnosis(rest);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  };

  const form = variant === "student" ? studentForm : guestForm;

  const setScores = (patch: Partial<typeof form.scores>) => {
    if (variant === "student") {
      setStudentForm((f) => ({ ...f, scores: { ...f.scores, ...patch } }));
    } else {
      setGuestForm((f) => ({ ...f, scores: { ...f.scores, ...patch } }));
    }
  };

  const setSkillSummary = (skill: "listening" | "reading" | "speaking", val: string) => {
    if (variant === "student") {
      setStudentForm((f) => ({ ...f, skillSummaries: { ...f.skillSummaries, [skill]: val } }));
    } else {
      setGuestForm((f) => ({ ...f, skillSummaries: { ...f.skillSummaries, [skill]: val } }));
    }
  };

  const setWritingSummary = (task: "task1" | "task2", val: string) => {
    if (variant === "student") {
      setStudentForm((f) => ({ ...f, writingSummary: { ...f.writingSummary, [task]: val } }));
    } else {
      setGuestForm((f) => ({ ...f, writingSummary: { ...f.writingSummary, [task]: val } }));
    }
  };

  const setWritingCriterion = (task: "task1" | "task2", key: string, val: number) => {
    if (variant === "student") {
      setStudentForm((f) => ({
        ...f,
        writingCriteria: {
          ...f.writingCriteria,
          [task]: {
            ...f.writingCriteria[task],
            [key]: val,
          },
        },
      }));
    } else {
      setGuestForm((f) => ({
        ...f,
        writingCriteria: {
          ...f.writingCriteria,
          [task]: {
            ...f.writingCriteria[task],
            [key]: val,
          },
        },
      }));
    }
  };

  const setSpeakingCriterion = (key: string, val: number) => {
    if (variant === "student") {
      setStudentForm((f) => ({
        ...f,
        speakingCriteria: {
          ...f.speakingCriteria,
          [key]: val,
        },
      }));
    } else {
      setGuestForm((f) => ({
        ...f,
        speakingCriteria: {
          ...f.speakingCriteria,
          [key]: val,
        },
      }));
    }
  };

  const fillStandardWritingTask1Band = (band: number) => {
    const b = Math.min(9, Math.max(1, Math.round(Number(band) || 0)));
    const text = getWritingTask1StandardDescription(b);
    if (variant === "student") {
      setStudentForm((f) => ({
        ...f,
        writingSummary: { ...f.writingSummary, task1: text },
        writingCriteria: {
          ...f.writingCriteria,
          task1: {
            taskAchievement: b,
            coherenceCohesion: b,
            lexicalResource: b,
            grammaticalRange: b,
          },
        },
      }));
    } else {
      setGuestForm((f) => ({
        ...f,
        writingSummary: { ...f.writingSummary, task1: text },
        writingCriteria: {
          ...f.writingCriteria,
          task1: {
            taskAchievement: b,
            coherenceCohesion: b,
            lexicalResource: b,
            grammaticalRange: b,
          },
        },
      }));
    }
  };

  const fillStandardWritingTask2Band = (band: number) => {
    const b = Math.min(9, Math.max(1, Math.round(Number(band) || 0)));
    const text = getWritingTask2StandardDescription(b);
    if (variant === "student") {
      setStudentForm((f) => ({
        ...f,
        writingSummary: { ...f.writingSummary, task2: text },
        writingCriteria: {
          ...f.writingCriteria,
          task2: {
            taskResponse: b,
            coherenceCohesion: b,
            lexicalResource: b,
            grammaticalRange: b,
          },
        },
      }));
    } else {
      setGuestForm((f) => ({
        ...f,
        writingSummary: { ...f.writingSummary, task2: text },
        writingCriteria: {
          ...f.writingCriteria,
          task2: {
            taskResponse: b,
            coherenceCohesion: b,
            lexicalResource: b,
            grammaticalRange: b,
          },
        },
      }));
    }
  };

  const fillStandardSpeakingBand = (band: number) => {
    const b = Math.min(9, Math.max(1, Math.round(Number(band) || 0)));
    const desc = getSpeakingStandardDescription(b);
    if (variant === "student") {
      setStudentForm((f) => ({
        ...f,
        skillSummaries: { ...f.skillSummaries, speaking: desc },
        speakingCriteria: {
          fluencyCoherence: b,
          lexicalResource: b,
          grammaticalRangeAccuracy: b,
          pronunciation: b,
        },
      }));
    } else {
      setGuestForm((f) => ({
        ...f,
        skillSummaries: { ...f.skillSummaries, speaking: desc },
        speakingCriteria: {
          fluencyCoherence: b,
          lexicalResource: b,
          grammaticalRangeAccuracy: b,
          pronunciation: b,
        },
      }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-black uppercase tracking-wider text-foreground">
            {lrOnly
              ? `BCB chi tiết — Listening & Reading${studentName ? ` · ${studentName}` : ""}`
              : `Chỉnh sửa Nội dung Bảng Chẩn Bệnh Chi Tiết (BCB) ${studentName ? `cho ${studentName}` : ""}`}
          </h2>
          <p className="text-xs text-muted mt-0.5">
            {lrOnly
              ? `Dành cho ${portalLabel} — chỉ điền Listening & Reading. Writing / Speaking do Grader nhập khi chấm Entrance.`
              : `Dành cho ${portalLabel} — Lưu thông tin tại đây sẽ cập nhật 100% thời gian thực trên trang LMS học viên.`}
          </p>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-primary/10 pb-3">
        {(
          (
            lrOnly
              ? ([
                  ["scores", "1. Điểm & Đánh giá tổng quan"],
                  ["lr", "2. Listening & Reading"],
                ] as const)
              : ([
                  ["scores", "1. Điểm & Đánh giá tổng quan"],
                  ["lr", "2. Listening & Reading"],
                  ["writing", "3. Tiêu chí Writing"],
                  ["speaking", "4. Tiêu chí Speaking"],
                ] as const)
          )
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setSection(id)}
            className={[
              "rounded-xl px-4 py-2.5 text-xs font-bold transition-all shadow-2xs",
              section === id ? "bg-primary text-white shadow-sm ring-2 ring-primary/20" : "bg-zinc-100/80 hover:bg-zinc-200 text-zinc-700",
            ].join(" ")}
          >
            {label}
          </button>
        ))}
      </div>

      {lrOnly && (
        <p className="text-xs text-muted leading-relaxed">
          Sale chỉ điền Listening &amp; Reading. Writing / Speaking do Grader nhập khi chấm Entrance
          (Chấm Writing &amp; Test Speaking).
        </p>
      )}

      <div className="grid gap-6 rounded-2xl border border-primary/10 bg-white p-6 shadow-soft">
        
        {/* TAB 1: SCORES & GENERAL OVERVIEW */}
        {section === "scores" && (
          <div className="space-y-5 animate-in fade-in duration-150">
            {variant === "guest" && (
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Tên học viên / khách">
                  <input
                    className={inputClass}
                    value={guestForm.name}
                    onChange={(e) => setGuestForm((f) => ({ ...f, name: e.target.value }))}
                  />
                </Field>
                <Field label="Ngày kiểm tra">
                  <input
                    className={inputClass}
                    value={guestForm.testDate}
                    onChange={(e) => setGuestForm((f) => ({ ...f, testDate: e.target.value }))}
                  />
                </Field>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(
                [
                  ["overall", "Band Overall"],
                  ["listening", "Band Listening"],
                  ["reading", "Band Reading"],
                  ["writing", "Band Writing"],
                  ["speaking", "Band Speaking"],
                  ["aim", "Mục tiêu (Aim)"],
                ] as const
              ).map(([key, label]) =>
                key === "aim" ? (
                  <Field key={key} label={label}>
                    <input
                      className={inputClass}
                      value={variant === "student" ? studentForm.aim : guestForm.aim}
                      onChange={(e) =>
                        variant === "student"
                          ? setStudentForm((f) => ({ ...f, aim: e.target.value }))
                          : setGuestForm((f) => ({ ...f, aim: e.target.value }))
                      }
                    />
                  </Field>
                ) : (
                  <Field
                    key={key}
                    label={
                      lrOnly && (key === "writing" || key === "speaking")
                        ? `${label} (Grader)`
                        : label
                    }
                  >
                    <input
                      type="text"
                      readOnly={lrOnly && (key === "writing" || key === "speaking")}
                      title={
                        lrOnly && (key === "writing" || key === "speaking")
                          ? "Do Grader điền khi chấm Entrance"
                          : undefined
                      }
                      className={`${inputClass}${
                        lrOnly && (key === "writing" || key === "speaking")
                          ? " bg-zinc-50 text-zinc-500 cursor-not-allowed"
                          : ""
                      }`}
                      value={formatBandScore(form.scores[key]) === "—" ? "" : formatBandScore(form.scores[key])}
                      onChange={(e) => {
                        if (lrOnly && (key === "writing" || key === "speaking")) return;
                        const raw = e.target.value.replace(",", ".");
                        const num = Number.parseFloat(raw);
                        setScores({ [key]: Number.isFinite(num) ? num : 0 });
                      }}
                    />
                  </Field>
                ),
              )}

              {variant === "student" && (
                <Field label="Ngày thi dự kiến">
                  <input
                    type="date"
                    className={inputClass}
                    value={studentForm.examDate}
                    onChange={(e) => setStudentForm((f) => ({ ...f, examDate: e.target.value }))}
                  />
                </Field>
              )}
            </div>

            <div className="pt-3 border-t border-zinc-100 space-y-4">
              <Field label="Tiêu đề Đánh giá Tổng quan BCB">
                <input
                  className={inputClass}
                  placeholder="VD: Người dùng Khá (Competent)"
                  value={form.bcbOverviewTitle}
                  onChange={(e) =>
                    variant === "student"
                      ? setStudentForm((f) => ({ ...f, bcbOverviewTitle: e.target.value }))
                      : setGuestForm((f) => ({ ...f, bcbOverviewTitle: e.target.value }))
                  }
                />
              </Field>
              <Field label="Mô tả chi tiết Đánh giá Tổng quan">
                <textarea
                  rows={3}
                  className={inputClass}
                  placeholder="Nhập nhận xét tổng quan năng lực học viên..."
                  value={form.bcbOverviewSummary}
                  onChange={(e) =>
                    variant === "student"
                      ? setStudentForm((f) => ({ ...f, bcbOverviewSummary: e.target.value }))
                      : setGuestForm((f) => ({ ...f, bcbOverviewSummary: e.target.value }))
                  }
                />
              </Field>
            </div>
          </div>
        )}

        {/* TAB 2: LISTENING & READING */}
        {section === "lr" && (
          <div className="space-y-10 animate-in fade-in duration-150">
            {/* 1. Listening Diagnostic Section */}
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-[#796eb2] flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#796eb2]" />
                1. Bảng Chẩn Bệnh Kỹ Năng Listening
              </h3>
              <BcbSkillDiagnosticSection
                skill="listening"
                bandScore={form.scores.listening}
                onBandScoreChange={(score) => setScores({ listening: score })}
                summaryText={form.skillSummaries.listening}
                onSummaryTextChange={(val) => setSkillSummary("listening", val)}
                rows={form.bcbListening}
                onRowsChange={(bcbListening) =>
                  variant === "student"
                    ? setStudentForm((f) => ({ ...f, bcbListening }))
                    : setGuestForm((f) => ({ ...f, bcbListening }))
                }
              />
            </div>

            {/* 2. Reading Diagnostic Section */}
            <div className="space-y-3 pt-6 border-t-2 border-[#796eb2]/20">
              <h3 className="text-xs font-black uppercase tracking-widest text-[#796eb2] flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#796eb2]" />
                2. Bảng Chẩn Bệnh Kỹ Năng Reading
              </h3>
              <BcbSkillDiagnosticSection
                skill="reading"
                bandScore={form.scores.reading}
                onBandScoreChange={(score) => setScores({ reading: score })}
                summaryText={form.skillSummaries.reading}
                onSummaryTextChange={(val) => setSkillSummary("reading", val)}
                rows={form.bcbReading}
                onRowsChange={(bcbReading) =>
                  variant === "student"
                    ? setStudentForm((f) => ({ ...f, bcbReading }))
                    : setGuestForm((f) => ({ ...f, bcbReading }))
                }
              />
            </div>
          </div>
        )}

        {/* TAB 3: WRITING */}
        {section === "writing" && !lrOnly && (
          <div className="space-y-8 animate-in fade-in duration-150">
            {/* Quick Reference Button */}
            <div className="flex items-center justify-between rounded-xl bg-amber-50 border border-amber-200 p-3">
              <div className="text-xs font-bold text-amber-900">
                Quy chuẩn 4 Tiêu chí IELTS Writing (25% mỗi tiêu chí: TA/TR, CC, LR, GRA)
              </div>
              <button
                type="button"
                onClick={() => setShowWritingRef(!showWritingRef)}
                className="rounded-lg bg-amber-200 px-3 py-1 text-xs font-black text-amber-900 hover:bg-amber-300"
              >
                {showWritingRef ? "Ẩn quy chuẩn" : "Xem quy chuẩn chi tiết"}
              </button>
            </div>

            {/* Standard Writing Reference Box */}
            {showWritingRef && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 space-y-4 text-xs text-amber-950 animate-in fade-in">
                <h4 className="font-black text-amber-900 uppercase tracking-wider border-b border-amber-200 pb-2">
                  Mô tả chuẩn 4 Tiêu chí IELTS Writing
                </h4>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 bg-white p-3.5 rounded-xl border border-amber-100">
                    <span className="font-black text-primary block">Task Achievement (25%) - Task 1</span>
                    <p className="text-[11px] leading-relaxed text-zinc-700 whitespace-pre-line">
                      {WRITING_TASK1_STANDARD_DESCRIPTIONS.taskAchievement}
                    </p>
                  </div>

                  <div className="space-y-2 bg-white p-3.5 rounded-xl border border-amber-100">
                    <span className="font-black text-primary block">Task Response (25%) - Task 2</span>
                    <p className="text-[11px] leading-relaxed text-zinc-700 whitespace-pre-line">
                      {WRITING_TASK2_STANDARD_DESCRIPTIONS.taskResponse}
                    </p>
                  </div>

                  <div className="space-y-2 bg-white p-3.5 rounded-xl border border-amber-100">
                    <span className="font-black text-primary block">Coherence & Cohesion (25%)</span>
                    <p className="text-[11px] leading-relaxed text-zinc-700 whitespace-pre-line">
                      {WRITING_TASK1_STANDARD_DESCRIPTIONS.coherenceCohesion}
                    </p>
                  </div>

                  <div className="space-y-2 bg-white p-3.5 rounded-xl border border-amber-100">
                    <span className="font-black text-primary block">Lexical Resource & GRA (25% + 25%)</span>
                    <p className="text-[11px] leading-relaxed text-zinc-700 whitespace-pre-line">
                      {WRITING_TASK1_STANDARD_DESCRIPTIONS.lexicalResource}
                      {"\n\n"}
                      {WRITING_TASK1_STANDARD_DESCRIPTIONS.grammaticalRange}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Task 1 */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-primary/10 pb-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-primary">
                  1. Writing Task 1
                </h3>
                
                {/* Dynamic Band Selector & Insert Button for Task 1 */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-zinc-600">Chọn Band Task 1:</span>
                  <select
                    value={String(selectedWritingTask1BandInsert)}
                    onChange={(e) => setSelectedWritingTask1BandInsert(Number(e.target.value))}
                    className="rounded-xl border border-primary/20 bg-white px-3 py-1.5 text-xs font-bold text-foreground outline-none shadow-2xs"
                  >
                    {[9, 8, 7, 6, 5, 4, 3, 2, 1].map((b) => (
                      <option key={b} value={String(b)}>
                        Band {b}.0
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => fillStandardWritingTask1Band(selectedWritingTask1BandInsert)}
                    className="rounded-xl bg-primary px-3.5 py-1.5 text-xs font-bold text-white hover:bg-primary/90 transition-all shadow-2xs"
                  >
                    Chèn nhận xét Band {selectedWritingTask1BandInsert}.0
                  </button>
                </div>
              </div>

              <Field label="Mô tả nhận xét Writing Task 1">
                <textarea
                  rows={4}
                  className={inputClass}
                  value={form.writingSummary.task1}
                  onChange={(e) => setWritingSummary("task1", e.target.value)}
                />
              </Field>
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-muted block mb-2">
                  Điểm số tiêu chí chấm Writing Task 1
                </span>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Field label="Task Achievement (TA)">
                    <input
                      type="number"
                      step={0.5}
                      min={0}
                      max={9}
                      className={inputClass}
                      value={form.writingCriteria.task1.taskAchievement}
                      onChange={(e) => setWritingCriterion("task1", "taskAchievement", Number(e.target.value))}
                    />
                  </Field>
                  <Field label="Coherence & Cohesion (CC)">
                    <input
                      type="number"
                      step={0.5}
                      min={0}
                      max={9}
                      className={inputClass}
                      value={form.writingCriteria.task1.coherenceCohesion}
                      onChange={(e) => setWritingCriterion("task1", "coherenceCohesion", Number(e.target.value))}
                    />
                  </Field>
                  <Field label="Lexical Resource (LR)">
                    <input
                      type="number"
                      step={0.5}
                      min={0}
                      max={9}
                      className={inputClass}
                      value={form.writingCriteria.task1.lexicalResource}
                      onChange={(e) => setWritingCriterion("task1", "lexicalResource", Number(e.target.value))}
                    />
                  </Field>
                  <Field label="Grammatical Range (GRA)">
                    <input
                      type="number"
                      step={0.5}
                      min={0}
                      max={9}
                      className={inputClass}
                      value={form.writingCriteria.task1.grammaticalRange}
                      onChange={(e) => setWritingCriterion("task1", "grammaticalRange", Number(e.target.value))}
                    />
                  </Field>
                </div>
              </div>
            </div>

            {/* Task 2 */}
            <div className="space-y-4 pt-4 border-t border-zinc-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-primary/10 pb-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-primary">
                  2. Writing Task 2
                </h3>
                
                {/* Dynamic Band Selector & Insert Button for Task 2 */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-zinc-600">Chọn Band Task 2:</span>
                  <select
                    value={String(selectedWritingTask2BandInsert)}
                    onChange={(e) => setSelectedWritingTask2BandInsert(Number(e.target.value))}
                    className="rounded-xl border border-primary/20 bg-white px-3 py-1.5 text-xs font-bold text-foreground outline-none shadow-2xs"
                  >
                    {[9, 8, 7, 6, 5, 4, 3, 2, 1].map((b) => (
                      <option key={b} value={String(b)}>
                        Band {b}.0
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => fillStandardWritingTask2Band(selectedWritingTask2BandInsert)}
                    className="rounded-xl bg-primary px-3.5 py-1.5 text-xs font-bold text-white hover:bg-primary/90 transition-all shadow-2xs"
                  >
                    Chèn nhận xét Band {selectedWritingTask2BandInsert}.0
                  </button>
                </div>
              </div>

              <Field label="Mô tả nhận xét Writing Task 2">
                <textarea
                  rows={4}
                  className={inputClass}
                  value={form.writingSummary.task2}
                  onChange={(e) => setWritingSummary("task2", e.target.value)}
                />
              </Field>
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-muted block mb-2">
                  Điểm số tiêu chí chấm Writing Task 2
                </span>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Field label="Task Response (TR)">
                    <input
                      type="number"
                      step={0.5}
                      min={0}
                      max={9}
                      className={inputClass}
                      value={form.writingCriteria.task2.taskResponse}
                      onChange={(e) => setWritingCriterion("task2", "taskResponse", Number(e.target.value))}
                    />
                  </Field>
                  <Field label="Coherence & Cohesion (CC)">
                    <input
                      type="number"
                      step={0.5}
                      min={0}
                      max={9}
                      className={inputClass}
                      value={form.writingCriteria.task2.coherenceCohesion}
                      onChange={(e) => setWritingCriterion("task2", "coherenceCohesion", Number(e.target.value))}
                    />
                  </Field>
                  <Field label="Lexical Resource (LR)">
                    <input
                      type="number"
                      step={0.5}
                      min={0}
                      max={9}
                      className={inputClass}
                      value={form.writingCriteria.task2.lexicalResource}
                      onChange={(e) => setWritingCriterion("task2", "lexicalResource", Number(e.target.value))}
                    />
                  </Field>
                  <Field label="Grammatical Range (GRA)">
                    <input
                      type="number"
                      step={0.5}
                      min={0}
                      max={9}
                      className={inputClass}
                      value={form.writingCriteria.task2.grammaticalRange}
                      onChange={(e) => setWritingCriterion("task2", "grammaticalRange", Number(e.target.value))}
                    />
                  </Field>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SPEAKING */}
        {section === "speaking" && !lrOnly && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Quick Reference Toggle Header */}
            <div className="flex items-center justify-between rounded-xl bg-amber-50 border border-amber-200 p-3">
              <div className="text-xs font-bold text-amber-900">
                Quy chuẩn Mô tả 9 Band Điểm Speaking (Band 1.0 ➔ Band 9.0)
              </div>
              <button
                type="button"
                onClick={() => setShowSpeakingRef(!showSpeakingRef)}
                className="rounded-lg bg-amber-200 px-3 py-1 text-xs font-black text-amber-900 hover:bg-amber-300"
              >
                {showSpeakingRef ? "Ẩn bảng quy chuẩn" : "Xem quy chuẩn 9 Band"}
              </button>
            </div>

            {/* Speaking Standard Reference Box */}
            {showSpeakingRef && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 space-y-3 text-xs text-amber-950 animate-in fade-in max-h-80 overflow-y-auto">
                <h4 className="font-black text-amber-900 uppercase tracking-wider border-b border-amber-200 pb-2">
                  Bảng Quy chuẩn Mô tả 9 Band Speaking
                </h4>
                <div className="space-y-2">
                  {[9, 8, 7, 6, 5, 4, 3, 2, 1].map((b) => (
                    <div key={b} className="bg-white p-3 rounded-xl border border-amber-100 space-y-1">
                      <span className="font-black text-primary inline-block bg-primary/10 px-2 py-0.5 rounded text-[10px]">
                        Band {b}.0
                      </span>
                      <p className="text-[11px] text-zinc-700 leading-relaxed whitespace-pre-line">
                        {SPEAKING_BAND_DESCRIPTIONS[b]}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-primary/10 pb-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-primary">
                Speaking (Đặc trưng & 4 Tiêu chí)
              </h3>
              
              {/* Dynamic Band Selector & Insert Button */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-zinc-600">Chọn Band:</span>
                <select
                  value={String(selectedSpeakingBandInsert)}
                  onChange={(e) => setSelectedSpeakingBandInsert(Number(e.target.value))}
                  className="rounded-xl border border-primary/20 bg-white px-3 py-1.5 text-xs font-bold text-foreground outline-none shadow-2xs"
                >
                  {[9, 8, 7, 6, 5, 4, 3, 2, 1].map((b) => (
                    <option key={b} value={String(b)}>
                      Band {b}.0
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => fillStandardSpeakingBand(selectedSpeakingBandInsert)}
                  className="rounded-xl bg-primary px-3.5 py-1.5 text-xs font-bold text-white hover:bg-primary/90 transition-all shadow-2xs"
                >
                  Chèn nhận xét Band {selectedSpeakingBandInsert}.0
                </button>
              </div>
            </div>

            <Field label="Mô tả đặc trưng Band Speaking">
              <textarea
                rows={4}
                className={inputClass}
                value={form.skillSummaries.speaking}
                onChange={(e) => setSkillSummary("speaking", e.target.value)}
              />
            </Field>

            <div>
              <span className="text-xs font-black uppercase tracking-wider text-muted block mb-2">
                Điểm số 4 tiêu chí chấm Speaking (FC, LR, GRA, PRON)
              </span>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Field label="Fluency & Coherence (FC)">
                  <input
                    type="number"
                    step={0.5}
                    min={0}
                    max={9}
                    className={inputClass}
                    value={form.speakingCriteria.fluencyCoherence}
                    onChange={(e) => setSpeakingCriterion("fluencyCoherence", Number(e.target.value))}
                  />
                </Field>
                <Field label="Lexical Resource (LR)">
                  <input
                    type="number"
                    step={0.5}
                    min={0}
                    max={9}
                    className={inputClass}
                    value={form.speakingCriteria.lexicalResource}
                    onChange={(e) => setSpeakingCriterion("lexicalResource", Number(e.target.value))}
                  />
                </Field>
                <Field label="Grammatical Range (GRA)">
                  <input
                    type="number"
                    step={0.5}
                    min={0}
                    max={9}
                    className={inputClass}
                    value={form.speakingCriteria.grammaticalRangeAccuracy}
                    onChange={(e) => setSpeakingCriterion("grammaticalRangeAccuracy", Number(e.target.value))}
                  />
                </Field>
                <Field label="Pronunciation (PRON)">
                  <input
                    type="number"
                    step={0.5}
                    min={0}
                    max={9}
                    className={inputClass}
                    value={form.speakingCriteria.pronunciation}
                    onChange={(e) => setSpeakingCriterion("pronunciation", Number(e.target.value))}
                  />
                </Field>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between border-t border-primary/10 pt-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={save}
              className="rounded-xl bg-primary px-6 py-2.5 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-primary/90 shadow-sm"
            >
              Lưu chẩn đoán BCB
            </button>
            {saved ? (
              <span className="text-xs font-bold text-emerald-600 animate-in fade-in">
                Đã lưu thành công — Học viên sẽ thấy ngay tức thì.
              </span>
            ) : null}
            {saveError ? (
              <span className="text-xs font-bold text-rose-600">{saveError}</span>
            ) : null}
          </div>
        </div>

      </div>
    </div>
  );
}
