"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  fetchGuestDiagnosisLeadApi,
  saveGuestLeadDiagnosisApi,
} from "@/lib/acaManagementApi";
import {
  computeBcbErrorRate,
  type BcbGrammarRow,
  type BcbQuestionTypeRow,
} from "@/lib/guestBcbDiagnosis";
import type { GuestDiagnosisLead } from "@/lib/guestDiagnosisLeads";
import {
  normalizeLeadDiagnosis,
  sumCorrect,
  type LeadDiagnosisRecord,
} from "@/lib/leadDiagnosis";
import { resolveWritingBands } from "@/lib/writingScore";

const inputClass =
  "w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10";

type Tab = "scores" | "listening" | "reading" | "writing" | "speaking" | "grammar";

function roundHalf(n: number) {
  return Math.round(n * 2) / 2;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] font-black uppercase tracking-wider text-zinc-500">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function QuestionTypeEditor({
  rows,
  onChange,
}: {
  rows: BcbQuestionTypeRow[];
  onChange: (rows: BcbQuestionTypeRow[]) => void;
}) {
  const update = (idx: number, patch: Partial<BcbQuestionTypeRow>) => {
    onChange(
      rows.map((r, i) => {
        if (i !== idx) return r;
        const next = { ...r, ...patch };
        next.errorRate = computeBcbErrorRate(next.correct, next.total, next.errorRate);
        return next;
      }),
    );
  };

  return (
    <div className="overflow-x-auto rounded-2xl border border-zinc-200">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50 text-[10px] font-black uppercase tracking-wider text-zinc-500">
            <th className="px-3 py-2">Dạng bài</th>
            <th className="px-3 py-2 w-24 text-center">Đúng</th>
            <th className="px-3 py-2 w-24 text-center">Tổng</th>
            <th className="px-3 py-2 w-24 text-center">% sai</th>
            <th className="px-3 py-2">Mã / nhận xét</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={row.id} className="border-b border-zinc-100 align-top">
              <td className="px-3 py-2 text-xs font-bold text-zinc-800">{row.title}</td>
              <td className="px-2 py-2">
                <input
                  type="number"
                  min={0}
                  className={`${inputClass} text-center`}
                  value={row.correct ?? 0}
                  onChange={(e) => update(idx, { correct: Number(e.target.value) || 0 })}
                />
              </td>
              <td className="px-2 py-2">
                <input
                  type="number"
                  min={0}
                  className={`${inputClass} text-center`}
                  value={row.total ?? 0}
                  onChange={(e) => update(idx, { total: Number(e.target.value) || 0 })}
                />
              </td>
              <td className="px-3 py-2 text-center text-xs font-black tabular-nums text-zinc-700">
                {row.errorRate ?? 0}%
              </td>
              <td className="px-2 py-2 space-y-1">
                <input
                  className={inputClass}
                  placeholder="Mã BCB"
                  value={row.tag ?? ""}
                  onChange={(e) => update(idx, { tag: e.target.value })}
                />
                <textarea
                  rows={2}
                  className={inputClass}
                  placeholder="Chẩn đoán dạng bài"
                  value={row.diagnosis}
                  onChange={(e) => update(idx, { diagnosis: e.target.value })}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function LeadBcbEditor({ leadId }: { leadId: string }) {
  const router = useRouter();
  const [lead, setLead] = useState<GuestDiagnosisLead | null>(null);
  const [form, setForm] = useState<LeadDiagnosisRecord | null>(null);
  const [tab, setTab] = useState<Tab>("scores");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchGuestDiagnosisLeadApi(leadId)
      .then((data) => {
        if (cancelled) return;
        const row = data as GuestDiagnosisLead;
        setLead(row);
        setForm(normalizeLeadDiagnosis(row, data?.diagnosis ?? null));
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || "Không tải được lead");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [leadId]);

  const writingBands = useMemo(
    () => (form ? resolveWritingBands(form.writingCriteria) : null),
    [form],
  );

  const listeningSum = useMemo(
    () => (form ? sumCorrect(form.bcbListening) : { correct: 0, total: 0 }),
    [form],
  );
  const readingSum = useMemo(
    () => (form ? sumCorrect(form.bcbReading) : { correct: 0, total: 0 }),
    [form],
  );

  const setScore = (key: keyof LeadDiagnosisRecord["scores"], value: number) => {
    setForm((f) => {
      if (!f) return f;
      const scores = { ...f.scores, [key]: value };
      if (key !== "overall") {
        scores.overall = roundHalf(
          (scores.listening + scores.reading + scores.writing + scores.speaking) / 4,
        );
      }
      return { ...f, scores };
    });
  };

  const save = async () => {
    if (!form) return;
    setSaving(true);
    setMsg(null);
    setError(null);
    try {
      const listeningTotals = sumCorrect(form.bcbListening);
      const readingTotals = sumCorrect(form.bcbReading);
      const bands = resolveWritingBands(form.writingCriteria);
      const payload: LeadDiagnosisRecord = {
        ...form,
        scores: {
          ...form.scores,
          writing: form.scores.writing || bands.writingOverall,
          overall: form.scores.overall,
        },
        listeningCorrect: listeningTotals.correct || form.listeningCorrect,
        listeningTotal: listeningTotals.total || form.listeningTotal,
        readingCorrect: readingTotals.correct || form.readingCorrect,
        readingTotal: readingTotals.total || form.readingTotal,
        updatedAt: new Date().toISOString(),
      };
      await saveGuestLeadDiagnosisApi(leadId, payload as unknown as Record<string, unknown>);
      setForm(payload);
      setMsg("Đã lưu BCB và điểm chi tiết.");
    } catch (err: any) {
      setError(err?.message || "Lưu thất bại");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-sm font-semibold text-zinc-500">Đang tải phiếu BCB...</div>;
  }
  if (error && !form) {
    return <div className="p-8 text-sm font-semibold text-rose-600">{error}</div>;
  }
  if (!form || !lead) return null;

  const tabs: { id: Tab; label: string }[] = [
    { id: "scores", label: "1. Tổng hợp điểm" },
    { id: "listening", label: "2. Listening" },
    { id: "reading", label: "3. Reading" },
    { id: "writing", label: "4. Writing" },
    { id: "speaking", label: "5. Speaking" },
    { id: "grammar", label: "6. Grammar" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <button
            type="button"
            onClick={() => router.push("/sale/leads")}
            className="text-xs font-bold text-primary hover:underline"
          >
            ← Mục lục / Danh sách lead
          </button>
          <h1 className="mt-2 text-xl font-black text-zinc-900">Nhập điểm & BCB</h1>
          <p className="text-sm font-semibold text-zinc-600">
            {lead.name} · {lead.phone}
            {lead.aim ? ` · Aim ${lead.aim}` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving}
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-black text-white shadow-sm disabled:opacity-60"
        >
          {saving ? "Đang lưu..." : "Lưu phiếu BCB"}
        </button>
      </div>

      {(msg || error) && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
            msg ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {msg || error}
        </div>
      )}

      <div className="flex flex-wrap gap-2 border-b border-zinc-200 pb-3">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-xl px-3 py-2 text-xs font-black ${
              tab === t.id ? "bg-primary text-white" : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "scores" && (
        <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Tên học viên">
              <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="Ngày test">
              <input className={inputClass} placeholder="26/05/2026" value={form.testDate} onChange={(e) => setForm({ ...form, testDate: e.target.value })} />
            </Field>
            <Field label="Link bài Listening">
              <input className={inputClass} value={form.listeningLink} onChange={(e) => setForm({ ...form, listeningLink: e.target.value })} />
            </Field>
            <Field label="Link bài Reading">
              <input className={inputClass} value={form.readingLink} onChange={(e) => setForm({ ...form, readingLink: e.target.value })} />
            </Field>
            <Field label="Link Writing Task 1">
              <input className={inputClass} value={form.writingLinks.task1} onChange={(e) => setForm({ ...form, writingLinks: { ...form.writingLinks, task1: e.target.value } })} />
            </Field>
            <Field label="Link Writing Task 2">
              <input className={inputClass} value={form.writingLinks.task2} onChange={(e) => setForm({ ...form, writingLinks: { ...form.writingLinks, task2: e.target.value } })} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            {(["listening", "reading", "writing", "speaking", "overall"] as const).map((k) => (
              <Field key={k} label={k}>
                <input
                  type="number"
                  step={0.5}
                  min={0}
                  max={9}
                  className={inputClass}
                  value={form.scores[k]}
                  onChange={(e) => setScore(k, Number(e.target.value) || 0)}
                />
              </Field>
            ))}
          </div>
          <Field label="Tổng hợp / overview BCB">
            <input className={inputClass} value={form.bcbOverviewTitle} onChange={(e) => setForm({ ...form, bcbOverviewTitle: e.target.value })} placeholder="Người dùng Khá (Competent)" />
          </Field>
          <Field label="Nhận xét tổng">
            <textarea rows={4} className={inputClass} value={form.bcbOverviewSummary} onChange={(e) => setForm({ ...form, bcbOverviewSummary: e.target.value })} />
          </Field>
        </div>
      )}

      {tab === "listening" && (
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <Field label="Số câu đúng (tổng L)">
              <input type="number" className={inputClass} value={form.listeningCorrect || listeningSum.correct} onChange={(e) => setForm({ ...form, listeningCorrect: Number(e.target.value) || 0 })} />
            </Field>
            <Field label="Tổng câu Listening">
              <input type="number" className={inputClass} value={form.listeningTotal} onChange={(e) => setForm({ ...form, listeningTotal: Number(e.target.value) || 0 })} />
            </Field>
            <Field label="Điểm Listening">
              <input type="number" step={0.5} className={inputClass} value={form.scores.listening} onChange={(e) => setScore("listening", Number(e.target.value) || 0)} />
            </Field>
          </div>
          <p className="text-xs font-semibold text-zinc-500">
            Cộng từ dạng bài: {listeningSum.correct}/{listeningSum.total}
          </p>
          <Field label="Nhận xét Listening">
            <textarea rows={3} className={inputClass} value={form.skillSummaries.listening} onChange={(e) => setForm({ ...form, skillSummaries: { ...form.skillSummaries, listening: e.target.value } })} />
          </Field>
          <QuestionTypeEditor
            rows={form.bcbListening}
            onChange={(bcbListening) => setForm({ ...form, bcbListening })}
          />
        </div>
      )}

      {tab === "reading" && (
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <Field label="Số câu đúng (tổng R)">
              <input type="number" className={inputClass} value={form.readingCorrect || readingSum.correct} onChange={(e) => setForm({ ...form, readingCorrect: Number(e.target.value) || 0 })} />
            </Field>
            <Field label="Tổng câu Reading">
              <input type="number" className={inputClass} value={form.readingTotal} onChange={(e) => setForm({ ...form, readingTotal: Number(e.target.value) || 0 })} />
            </Field>
            <Field label="Điểm Reading">
              <input type="number" step={0.5} className={inputClass} value={form.scores.reading} onChange={(e) => setScore("reading", Number(e.target.value) || 0)} />
            </Field>
          </div>
          <p className="text-xs font-semibold text-zinc-500">
            Cộng từ dạng bài: {readingSum.correct}/{readingSum.total}
          </p>
          <Field label="Nhận xét Reading">
            <textarea rows={3} className={inputClass} value={form.skillSummaries.reading} onChange={(e) => setForm({ ...form, skillSummaries: { ...form.skillSummaries, reading: e.target.value } })} />
          </Field>
          <QuestionTypeEditor
            rows={form.bcbReading}
            onChange={(bcbReading) => setForm({ ...form, bcbReading })}
          />
        </div>
      )}

      {tab === "writing" && (
        <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="grid gap-3 md:grid-cols-3">
            <Field label="Writing overall">
              <input type="number" step={0.5} className={inputClass} value={form.scores.writing || writingBands?.writingOverall || 0} onChange={(e) => setScore("writing", Number(e.target.value) || 0)} />
            </Field>
            <Field label="Task 1 band (tự tính)">
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-black">{writingBands?.task1Band ?? 0}</div>
            </Field>
            <Field label="Task 2 band (tự tính)">
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-black">{writingBands?.task2Band ?? 0}</div>
            </Field>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {(
              [
                ["task1", "Task Achievement T.1", "taskAchievement"],
                ["task1", "Coherence T.1", "coherenceCohesion"],
                ["task1", "Lexical T.1", "lexicalResource"],
                ["task1", "Grammar T.1", "grammaticalRange"],
              ] as const
            ).map(([task, label, key]) => (
              <Field key={`${task}-${key}`} label={label}>
                <input
                  type="number"
                  step={0.5}
                  min={0}
                  max={9}
                  className={inputClass}
                  value={(form.writingCriteria.task1 as any)[key]}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      writingCriteria: {
                        ...form.writingCriteria,
                        task1: { ...form.writingCriteria.task1, [key]: Number(e.target.value) || 0 },
                      },
                    })
                  }
                />
              </Field>
            ))}
            {(
              [
                ["taskResponse", "Task Response T.2"],
                ["coherenceCohesion", "Coherence T.2"],
                ["lexicalResource", "Lexical T.2"],
                ["grammaticalRange", "Grammar T.2"],
              ] as const
            ).map(([key, label]) => (
              <Field key={key} label={label}>
                <input
                  type="number"
                  step={0.5}
                  min={0}
                  max={9}
                  className={inputClass}
                  value={(form.writingCriteria.task2 as any)[key]}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      writingCriteria: {
                        ...form.writingCriteria,
                        task2: { ...form.writingCriteria.task2, [key]: Number(e.target.value) || 0 },
                      },
                    })
                  }
                />
              </Field>
            ))}
          </div>
          <Field label="Nhận xét Task 1">
            <textarea rows={3} className={inputClass} value={form.writingSummary.task1} onChange={(e) => setForm({ ...form, writingSummary: { ...form.writingSummary, task1: e.target.value } })} />
          </Field>
          <Field label="Nhận xét Task 2 / Writing">
            <textarea rows={3} className={inputClass} value={form.writingSummary.task2} onChange={(e) => setForm({ ...form, writingSummary: { ...form.writingSummary, task2: e.target.value } })} />
          </Field>
        </div>
      )}

      {tab === "speaking" && (
        <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5">
          <Field label="Điểm Speaking">
            <input type="number" step={0.5} className={inputClass} value={form.scores.speaking} onChange={(e) => setScore("speaking", Number(e.target.value) || 0)} />
          </Field>
          <div className="grid gap-3 md:grid-cols-2">
            {(
              [
                ["fluencyCoherence", "Fluency & Coherence"],
                ["lexicalResource", "Lexical Resource"],
                ["grammaticalRangeAccuracy", "Grammar"],
                ["pronunciation", "Pronunciation"],
              ] as const
            ).map(([key, label]) => (
              <Field key={key} label={label}>
                <input
                  type="number"
                  step={0.5}
                  min={0}
                  max={9}
                  className={inputClass}
                  value={form.speakingCriteria[key]}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      speakingCriteria: { ...form.speakingCriteria, [key]: Number(e.target.value) || 0 },
                    })
                  }
                />
              </Field>
            ))}
          </div>
          <Field label="Nhận xét Speaking">
            <textarea rows={4} className={inputClass} value={form.skillSummaries.speaking} onChange={(e) => setForm({ ...form, skillSummaries: { ...form.skillSummaries, speaking: e.target.value } })} />
          </Field>
        </div>
      )}

      {tab === "grammar" && (
        <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white">
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-[10px] font-black uppercase tracking-wider text-zinc-500">
                <th className="px-3 py-2 text-left">Nhóm ngữ pháp</th>
                <th className="px-3 py-2 text-center">Wri</th>
                <th className="px-3 py-2 text-center">Spk</th>
                <th className="px-3 py-2 text-center">Ov</th>
                <th className="px-3 py-2">Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {form.bcbGrammar.map((row, idx) => (
                <tr key={row.id} className="border-b border-zinc-100">
                  <td className="px-3 py-2">
                    <div className="text-xs font-black text-zinc-800">{row.topic}</div>
                    <div className="text-[11px] text-zinc-500">{row.code}</div>
                  </td>
                  {(["writingFlag", "speakingFlag", "overallFlag"] as const).map((flag) => (
                    <td key={flag} className="px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={Boolean(row[flag])}
                        onChange={(e) => {
                          const next = form.bcbGrammar.map((g, i) =>
                            i === idx ? { ...g, [flag]: e.target.checked } : g,
                          ) as BcbGrammarRow[];
                          setForm({ ...form, bcbGrammar: next });
                        }}
                      />
                    </td>
                  ))}
                  <td className="px-3 py-2">
                    <input
                      className={inputClass}
                      value={row.description}
                      onChange={(e) => {
                        const next = form.bcbGrammar.map((g, i) =>
                          i === idx ? { ...g, description: e.target.value } : g,
                        );
                        setForm({ ...form, bcbGrammar: next });
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
