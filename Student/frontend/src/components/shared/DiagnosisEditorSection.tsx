"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import type { BcbQuestionTypeRow } from "@/lib/guestBcbDiagnosis";
import {
  DEFAULT_GUEST_DIAGNOSIS,
  getGuestDiagnosis,
  GUEST_DIAGNOSIS_UPDATE_EVENT,
  saveGuestDiagnosis,
  type GuestDiagnosisRecord,
} from "@/lib/guestDiagnosisStore";
import {
  DEFAULT_STUDENT_DIAGNOSIS,
  getStudentDiagnosis,
  registerDynamicStudentScores,
  saveStudentDiagnosis,
  STUDENT_DIAGNOSIS_UPDATE_EVENT,
  type StudentDiagnosisRecord,
} from "@/lib/studentDiagnosisStore";
import { saveStudentDiagnosisForAca } from "@/lib/acaManagementApi";
import {
  getSpeakingStandardDescription,
  getWritingTask1StandardDescription,
  getWritingTask2StandardDescription,
  WRITING_TASK1_STANDARD_DESCRIPTIONS,
  WRITING_TASK2_STANDARD_DESCRIPTIONS,
  SPEAKING_BAND_DESCRIPTIONS,
} from "@/lib/bcbStandardReference";
import { formatBandScore } from "@/lib/formatBandScore";

type Variant = "student" | "guest";

type Props = {
  variant: Variant;
  portalLabel: string;
  studentId?: string;
  studentEmail?: string;
  studentName?: string;
  initialScores?: any;
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
}: {
  rows: BcbQuestionTypeRow[];
  onChange: (rows: BcbQuestionTypeRow[]) => void;
}) {
  const update = (idx: number, patch: Partial<BcbQuestionTypeRow>) => {
    onChange(rows.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  return (
    <div className="space-y-3">
      {rows.map((row, idx) => (
        <div key={row.id || idx} className="rounded-xl border border-primary/10 bg-background/60 p-3.5 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <Field label="Dạng bài">
                <input
                  className={inputClass}
                  value={row.title}
                  onChange={(e) => update(idx, { title: e.target.value })}
                />
              </Field>
            </div>
            <div>
              <Field label="Tỷ lệ sai (%)">
                <input
                  type="number"
                  min={0}
                  max={100}
                  className={inputClass}
                  value={row.errorRate ?? 0}
                  onChange={(e) => update(idx, { errorRate: Number(e.target.value) || 0 })}
                />
              </Field>
            </div>
          </div>
          <Field label="Chẩn đoán & nhận xét">
            <textarea
              rows={2}
              className={inputClass}
              value={row.diagnosis}
              onChange={(e) => update(idx, { diagnosis: e.target.value })}
            />
          </Field>
        </div>
      ))}
    </div>
  );
}

export function DiagnosisEditorSection({ variant, portalLabel, studentId, studentEmail, studentName, initialScores }: Props) {
  const [studentForm, setStudentForm] = useState<StudentDiagnosisRecord>(DEFAULT_STUDENT_DIAGNOSIS);
  const [guestForm, setGuestForm] = useState<GuestDiagnosisRecord>(DEFAULT_GUEST_DIAGNOSIS);
  const [saved, setSaved] = useState(false);
  const [section, setSection] = useState<"scores" | "lr" | "writing" | "speaking">("scores");

  // Reference Drawer Toggles
  const [showWritingRef, setShowWritingRef] = useState(false);
  const [showSpeakingRef, setShowSpeakingRef] = useState(false);

  // Selected Bands for quick inserts
  const [selectedSpeakingBandInsert, setSelectedSpeakingBandInsert] = useState<number>(6);
  const [selectedWritingTask1BandInsert, setSelectedWritingTask1BandInsert] = useState<number>(6);
  const [selectedWritingTask2BandInsert, setSelectedWritingTask2BandInsert] = useState<number>(6);

  const sync = useCallback(() => {
    if (variant === "student" && studentId) {
      if (initialScores) {
        registerDynamicStudentScores(studentId, initialScores);
      }
      const fetched = getStudentDiagnosis(studentId);
      setStudentForm(fetched);
      if (fetched.scores?.speaking) {
        setSelectedSpeakingBandInsert(Math.min(9, Math.max(1, Math.round(fetched.scores.speaking))));
      }
      if (fetched.scores?.writing) {
        const wBand = Math.min(9, Math.max(1, Math.round(fetched.scores.writing)));
        setSelectedWritingTask1BandInsert(wBand);
        setSelectedWritingTask2BandInsert(wBand);
      }
    } else if (variant === "guest") {
      const fetched = getGuestDiagnosis();
      setGuestForm(fetched);
      if (fetched.scores?.speaking) {
        setSelectedSpeakingBandInsert(Math.min(9, Math.max(1, Math.round(fetched.scores.speaking))));
      }
      if (fetched.scores?.writing) {
        const wBand = Math.min(9, Math.max(1, Math.round(fetched.scores.writing)));
        setSelectedWritingTask1BandInsert(wBand);
        setSelectedWritingTask2BandInsert(wBand);
      }
    }
  }, [variant, studentId, initialScores]);

  useEffect(() => {
    sync();
    const event =
      variant === "student" ? STUDENT_DIAGNOSIS_UPDATE_EVENT : GUEST_DIAGNOSIS_UPDATE_EVENT;
    const onUpdate = (e: Event) => {
      if (variant === "student" && studentId) {
        const detail = (e as CustomEvent<{ studentId?: string }>).detail;
        if (!detail?.studentId || detail.studentId === studentId) sync();
      } else if (variant === "guest") {
        sync();
      }
    };
    window.addEventListener(event, onUpdate);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(event, onUpdate);
      window.removeEventListener("storage", sync);
    };
  }, [sync, variant, studentId]);

  const save = () => {
    if (variant === "student" && studentId) {
      const { updatedAt: _u, ...rest } = studentForm;
      saveStudentDiagnosis(rest, studentId);
      if (studentEmail) {
        void saveStudentDiagnosisForAca(studentEmail, rest as unknown as Record<string, unknown>).catch(() => {});
      }
    } else {
      const { updatedAt: _u, ...rest } = guestForm;
      saveGuestDiagnosis(rest);
    }
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
    const text = getWritingTask1StandardDescription(band);
    setWritingSummary("task1", text);
  };

  const fillStandardWritingTask2Band = (band: number) => {
    const text = getWritingTask2StandardDescription(band);
    setWritingSummary("task2", text);
  };

  const fillStandardSpeakingBand = (band: number) => {
    const desc = getSpeakingStandardDescription(band);
    setSkillSummary("speaking", desc);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-black uppercase tracking-wider text-foreground">
            Chỉnh sửa Nội dung Bảng Chẩn Bệnh Chi Tiết (BCB) {studentName ? `cho ${studentName}` : ""}
          </h2>
          <p className="text-xs text-muted mt-0.5">
            Dành cho {portalLabel} — Lưu thông tin tại đây sẽ cập nhật 100% thời gian thực trên trang LMS học viên.
          </p>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-primary/10 pb-3">
        {(
          [
            ["scores", "1. Điểm & Đánh giá tổng quan"],
            ["lr", "2. Listening & Reading"],
            ["writing", "3. Tiêu chí Writing"],
            ["speaking", "4. Tiêu chí Speaking"],
          ] as const
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
                  <Field key={key} label={label}>
                    <input
                      type="text"
                      className={inputClass}
                      value={formatBandScore(form.scores[key]) === "—" ? "" : formatBandScore(form.scores[key])}
                      onChange={(e) => {
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
          <div className="space-y-8 animate-in fade-in duration-150">
            {/* Listening */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-primary/10 pb-2">
                <h3 className="text-xs font-black uppercase tracking-widest text-primary">
                  1. Listening (Đặc trưng & Dạng bài)
                </h3>
              </div>
              <Field label="Mô tả đặc trưng Band Listening">
                <textarea
                  rows={3}
                  className={inputClass}
                  value={form.skillSummaries.listening}
                  onChange={(e) => setSkillSummary("listening", e.target.value)}
                />
              </Field>
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-muted block mb-2">
                  Danh sách dạng bài & Nhận xét Listening
                </span>
                <BcbRowsEditor
                  rows={form.bcbListening}
                  onChange={(bcbListening) =>
                    variant === "student"
                      ? setStudentForm((f) => ({ ...f, bcbListening }))
                      : setGuestForm((f) => ({ ...f, bcbListening }))
                  }
                />
              </div>
            </div>

            {/* Reading */}
            <div className="space-y-4 pt-4 border-t border-zinc-100">
              <div className="flex items-center justify-between border-b border-primary/10 pb-2">
                <h3 className="text-xs font-black uppercase tracking-widest text-primary">
                  2. Reading (Đặc trưng & Dạng bài)
                </h3>
              </div>
              <Field label="Mô tả đặc trưng Band Reading">
                <textarea
                  rows={3}
                  className={inputClass}
                  value={form.skillSummaries.reading}
                  onChange={(e) => setSkillSummary("reading", e.target.value)}
                />
              </Field>
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-muted block mb-2">
                  Danh sách dạng bài & Nhận xét Reading
                </span>
                <BcbRowsEditor
                  rows={form.bcbReading}
                  onChange={(bcbReading) =>
                    variant === "student"
                      ? setStudentForm((f) => ({ ...f, bcbReading }))
                      : setGuestForm((f) => ({ ...f, bcbReading }))
                  }
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: WRITING */}
        {section === "writing" && (
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
                    value={selectedWritingTask1BandInsert}
                    onChange={(e) => setSelectedWritingTask1BandInsert(Number(e.target.value))}
                    className="rounded-xl border border-primary/20 bg-white px-3 py-1.5 text-xs font-bold text-foreground outline-none shadow-2xs"
                  >
                    {[9, 8, 7, 6, 5, 4, 3, 2, 1].map((b) => (
                      <option key={b} value={b}>
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
                    value={selectedWritingTask2BandInsert}
                    onChange={(e) => setSelectedWritingTask2BandInsert(Number(e.target.value))}
                    className="rounded-xl border border-primary/20 bg-white px-3 py-1.5 text-xs font-bold text-foreground outline-none shadow-2xs"
                  >
                    {[9, 8, 7, 6, 5, 4, 3, 2, 1].map((b) => (
                      <option key={b} value={b}>
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
        {section === "speaking" && (
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
                  value={selectedSpeakingBandInsert}
                  onChange={(e) => setSelectedSpeakingBandInsert(Number(e.target.value))}
                  className="rounded-xl border border-primary/20 bg-white px-3 py-1.5 text-xs font-bold text-foreground outline-none shadow-2xs"
                >
                  {[9, 8, 7, 6, 5, 4, 3, 2, 1].map((b) => (
                    <option key={b} value={b}>
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
          </div>
        </div>

      </div>
    </div>
  );
}
