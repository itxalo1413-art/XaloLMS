"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import type { BcbGrammarRow, BcbQuestionTypeRow } from "@/lib/guestBcbDiagnosis";
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
  saveStudentDiagnosis,
  STUDENT_DIAGNOSIS_UPDATE_EVENT,
  type StudentDiagnosisRecord,
} from "@/lib/studentDiagnosisStore";

type Variant = "student" | "guest";

type Props = {
  variant: Variant;
  portalLabel: string;
  studentId?: string;
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
  "w-full rounded-xl border border-primary/15 px-3 py-2 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10";

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
        <div key={row.id} className="rounded-xl border border-primary/10 bg-background/60 p-3 space-y-2">
          <Field label="Dạng bài">
            <input
              className={inputClass}
              value={row.title}
              onChange={(e) => update(idx, { title: e.target.value })}
            />
          </Field>
          <div className="grid gap-2 sm:grid-cols-2">
            <Field label="Tỷ lệ sai (%)">
              <input
                type="number"
                min={0}
                max={100}
                className={inputClass}
                value={row.errorRate}
                onChange={(e) => update(idx, { errorRate: Number(e.target.value) })}
              />
            </Field>
            <Field label="Mã (tuỳ chọn)">
              <input
                className={inputClass}
                value={row.tag ?? ""}
                onChange={(e) => update(idx, { tag: e.target.value || undefined })}
              />
            </Field>
          </div>
          <Field label="Chẩn đoán">
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

function GrammarRowsEditor({
  rows,
  onChange,
}: {
  rows: BcbGrammarRow[];
  onChange: (rows: BcbGrammarRow[]) => void;
}) {
  const update = (idx: number, patch: Partial<BcbGrammarRow>) => {
    onChange(rows.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  return (
    <div className="space-y-3">
      {rows.map((row, idx) => (
        <div key={row.id} className="rounded-xl border border-primary/10 bg-background/60 p-3 space-y-2">
          <Field label="Chủ đề">
            <input
              className={inputClass}
              value={row.topic}
              onChange={(e) => update(idx, { topic: e.target.value })}
            />
          </Field>
          <div className="grid gap-2 sm:grid-cols-3">
            <Field label="Số lỗi">
              <input
                type="number"
                className={inputClass}
                value={row.errorCount}
                onChange={(e) => update(idx, { errorCount: Number(e.target.value) })}
              />
            </Field>
            <Field label="Mức độ">
              <select
                className={inputClass}
                value={row.severity}
                onChange={(e) =>
                  update(idx, { severity: e.target.value as BcbGrammarRow["severity"] })
                }
              >
                <option value="red">Đỏ</option>
                <option value="yellow">Vàng</option>
                <option value="green">Xanh</option>
              </select>
            </Field>
          </div>
          <Field label="Mô tả">
            <textarea
              rows={2}
              className={inputClass}
              value={row.description}
              onChange={(e) => update(idx, { description: e.target.value })}
            />
          </Field>
        </div>
      ))}
    </div>
  );
}

export function DiagnosisEditorSection({ variant, portalLabel, studentId }: Props) {
  const [studentForm, setStudentForm] = useState<StudentDiagnosisRecord>(DEFAULT_STUDENT_DIAGNOSIS);
  const [guestForm, setGuestForm] = useState<GuestDiagnosisRecord>(DEFAULT_GUEST_DIAGNOSIS);
  const [saved, setSaved] = useState(false);
  const [section, setSection] = useState<"scores" | "bcb" | "links">("scores");

  const sync = useCallback(() => {
    if (variant === "student" && studentId) setStudentForm(getStudentDiagnosis(studentId));
    else if (variant === "guest") setGuestForm(getGuestDiagnosis());
  }, [variant, studentId]);

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

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">
        Chỉnh BCB và điểm chẩn đoán {variant === "student" ? "học viên" : "khách"} — {portalLabel}{" "}
        lưu tại đây sẽ cập nhật ngay trên LMS.
      </p>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["scores", "Điểm & tổng quan"],
            ["bcb", "BCB chi tiết"],
            ["links", "Link bài làm"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setSection(id)}
            className={[
              "rounded-xl px-4 py-2 text-xs font-bold transition-colors",
              section === id ? "bg-primary text-white" : "bg-zinc-100 text-zinc-700",
            ].join(" ")}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 rounded-2xl border border-primary/10 bg-white p-6 shadow-soft">
        {variant === "guest" && section === "scores" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Tên khách">
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
        ) : null}

        {section === "scores" ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(
                [
                  ["listening", "Listening"],
                  ["reading", "Reading"],
                  ["speaking", "Speaking"],
                  ["overall", "Overall"],
                  ["aim", "Mục tiêu"],
                ] as const
              ).map(([key, label]) =>
                key === "aim" ? (
                  variant === "student" ? (
                    <Field key={key} label={label}>
                      <input
                        className={inputClass}
                        value={studentForm.aim}
                        onChange={(e) =>
                          setStudentForm((f) => ({ ...f, aim: e.target.value }))
                        }
                      />
                    </Field>
                  ) : (
                    <Field key={key} label={label}>
                      <input
                        className={inputClass}
                        value={guestForm.aim}
                        onChange={(e) => setGuestForm((f) => ({ ...f, aim: e.target.value }))}
                      />
                    </Field>
                  )
                ) : (
                  <Field key={key} label={label}>
                    <input
                      type="number"
                      step={0.5}
                      className={inputClass}
                      value={form.scores[key]}
                      onChange={(e) => setScores({ [key]: Number(e.target.value) })}
                    />
                  </Field>
                ),
              )}
              {variant === "student" ? (
                <Field label="Ngày thi dự kiến">
                  <input
                    type="date"
                    className={inputClass}
                    value={studentForm.examDate}
                    onChange={(e) =>
                      setStudentForm((f) => ({ ...f, examDate: e.target.value }))
                    }
                  />
                </Field>
              ) : null}
            </div>
            <Field label="Tiêu đề đánh giá tổng quan">
              <input
                className={inputClass}
                value={form.bcbOverviewTitle}
                onChange={(e) =>
                  variant === "student"
                    ? setStudentForm((f) => ({ ...f, bcbOverviewTitle: e.target.value }))
                    : setGuestForm((f) => ({ ...f, bcbOverviewTitle: e.target.value }))
                }
              />
            </Field>
            <Field label="Mô tả đánh giá tổng quan">
              <textarea
                rows={3}
                className={inputClass}
                value={form.bcbOverviewSummary}
                onChange={(e) =>
                  variant === "student"
                    ? setStudentForm((f) => ({ ...f, bcbOverviewSummary: e.target.value }))
                    : setGuestForm((f) => ({ ...f, bcbOverviewSummary: e.target.value }))
                }
              />
            </Field>
            <Field label="Tóm tắt Listening">
              <textarea
                rows={2}
                className={inputClass}
                value={form.skillSummaries.listening}
                onChange={(e) =>
                  variant === "student"
                    ? setStudentForm((f) => ({
                        ...f,
                        skillSummaries: { ...f.skillSummaries, listening: e.target.value },
                      }))
                    : setGuestForm((f) => ({
                        ...f,
                        skillSummaries: { ...f.skillSummaries, listening: e.target.value },
                      }))
                }
              />
            </Field>
            <Field label="Tóm tắt Reading">
              <textarea
                rows={2}
                className={inputClass}
                value={form.skillSummaries.reading}
                onChange={(e) =>
                  variant === "student"
                    ? setStudentForm((f) => ({
                        ...f,
                        skillSummaries: { ...f.skillSummaries, reading: e.target.value },
                      }))
                    : setGuestForm((f) => ({
                        ...f,
                        skillSummaries: { ...f.skillSummaries, reading: e.target.value },
                      }))
                }
              />
            </Field>
          </>
        ) : null}

        {section === "bcb" ? (
          <div className="space-y-6">
            <div>
              <h3 className="mb-3 text-xs font-black uppercase tracking-widest text-primary">
                Listening
              </h3>
              <BcbRowsEditor
                rows={form.bcbListening}
                onChange={(bcbListening) =>
                  variant === "student"
                    ? setStudentForm((f) => ({ ...f, bcbListening }))
                    : setGuestForm((f) => ({ ...f, bcbListening }))
                }
              />
            </div>
            <div>
              <h3 className="mb-3 text-xs font-black uppercase tracking-widest text-primary">
                Reading
              </h3>
              <BcbRowsEditor
                rows={form.bcbReading}
                onChange={(bcbReading) =>
                  variant === "student"
                    ? setStudentForm((f) => ({ ...f, bcbReading }))
                    : setGuestForm((f) => ({ ...f, bcbReading }))
                }
              />
            </div>
            <div>
              <h3 className="mb-3 text-xs font-black uppercase tracking-widest text-primary">
                Grammar
              </h3>
              <GrammarRowsEditor
                rows={form.bcbGrammar}
                onChange={(bcbGrammar) =>
                  variant === "student"
                    ? setStudentForm((f) => ({ ...f, bcbGrammar }))
                    : setGuestForm((f) => ({ ...f, bcbGrammar }))
                }
              />
            </div>
          </div>
        ) : null}

        {section === "links" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Link Listening">
              <input
                className={inputClass}
                value={form.listeningLink}
                onChange={(e) =>
                  variant === "student"
                    ? setStudentForm((f) => ({ ...f, listeningLink: e.target.value }))
                    : setGuestForm((f) => ({ ...f, listeningLink: e.target.value }))
                }
              />
            </Field>
            <Field label="Link Reading">
              <input
                className={inputClass}
                value={form.readingLink}
                onChange={(e) =>
                  variant === "student"
                    ? setStudentForm((f) => ({ ...f, readingLink: e.target.value }))
                    : setGuestForm((f) => ({ ...f, readingLink: e.target.value }))
                }
              />
            </Field>
            <Field label="Link Writing Task 1">
              <input
                className={inputClass}
                value={form.writingLinks.task1}
                onChange={(e) =>
                  variant === "student"
                    ? setStudentForm((f) => ({
                        ...f,
                        writingLinks: { ...f.writingLinks, task1: e.target.value },
                      }))
                    : setGuestForm((f) => ({
                        ...f,
                        writingLinks: { ...f.writingLinks, task1: e.target.value },
                      }))
                }
              />
            </Field>
            <Field label="Link Writing Task 2">
              <input
                className={inputClass}
                value={form.writingLinks.task2}
                onChange={(e) =>
                  variant === "student"
                    ? setStudentForm((f) => ({
                        ...f,
                        writingLinks: { ...f.writingLinks, task2: e.target.value },
                      }))
                    : setGuestForm((f) => ({
                        ...f,
                        writingLinks: { ...f.writingLinks, task2: e.target.value },
                      }))
                }
              />
            </Field>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-3 border-t border-primary/10 pt-4">
          <button
            type="button"
            onClick={save}
            className="rounded-xl bg-primary px-5 py-2.5 text-xs font-black uppercase tracking-widest text-white hover:bg-primary/90"
          >
            Lưu chẩn đoán
          </button>
          {saved ? (
            <span className="text-xs font-bold text-success">Đã lưu — học viên sẽ thấy ngay.</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
