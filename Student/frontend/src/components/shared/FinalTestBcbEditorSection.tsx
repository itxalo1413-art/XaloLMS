"use client";

import React, { useState, useEffect, useMemo, type ReactNode } from "react";
import type { FinalTestRecord, FinalTestBcbData } from "@/lib/finalTestArchive";
import { updateFinalTestRecord } from "@/lib/finalTestArchive";
import type { BcbQuestionTypeRow } from "@/lib/guestBcbDiagnosis";
import {
  ENTRANCE_BCB_LISTENING,
  ENTRANCE_BCB_READING,
} from "@/lib/guestBcbDiagnosis";
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
import { confirmDialog } from "@/components/shared/ConfirmDialog";

export type FinalTestSkillScope = "all" | "lr-only";

interface FinalTestBcbEditorSectionProps {
  record: FinalTestRecord;
  portalLabel?: string;
  skillScope?: FinalTestSkillScope;
  onSaved?: () => void;
}

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

export function FinalTestBcbEditorSection({
  record,
  portalLabel = "Học Vụ Khảo Thí",
  skillScope = "all",
  onSaved,
}: FinalTestBcbEditorSectionProps) {
  const lrOnly = skillScope === "lr-only";
  const [section, setSection] = useState<"scores" | "lr" | "writing" | "speaking">("scores");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showWritingRef, setShowWritingRef] = useState(false);
  const [showSpeakingRef, setShowSpeakingRef] = useState(false);

  useEffect(() => {
    if (lrOnly && (section === "writing" || section === "speaking")) {
      setSection("lr");
    }
  }, [lrOnly, section]);

  // Scores
  const [scoreOverall, setScoreOverall] = useState(record.scoreOverall || "");
  const [scoreListening, setScoreListening] = useState(record.scoreListening || "");
  const [scoreReading, setScoreReading] = useState(record.scoreReading || "");
  const [scoreWriting, setScoreWriting] = useState(record.scoreWriting || "");
  const [scoreSpeaking, setScoreSpeaking] = useState(record.scoreSpeaking || "");

  // Status flags
  const [resultStatus, setResultStatus] = useState<"Đạt" | "Không đạt" | "">(record.resultStatus || "");
  const [hasTakenTest, setHasTakenTest] = useState(record.hasTakenTest ?? true);
  const [isChecked, setIsChecked] = useState(record.isChecked ?? false);

  // Overview
  const [overviewTitle, setOverviewTitle] = useState(record.bcbData?.overviewTitle || "");
  const [overviewSummary, setOverviewSummary] = useState(record.bcbData?.overviewSummary || "");

  // Listening & Reading
  const [listeningSummary, setListeningSummary] = useState(record.bcbData?.lr?.listeningSummary || "");
  const [readingSummary, setReadingSummary] = useState(record.bcbData?.lr?.readingSummary || "");
  const [bcbListening, setBcbListening] = useState<BcbQuestionTypeRow[]>(
    record.bcbData?.bcbListening && record.bcbData.bcbListening.length > 0
      ? record.bcbData.bcbListening
      : ENTRANCE_BCB_LISTENING.map((r) => ({ ...r, id: `final-lis-${r.id}`, correct: 0, errorRate: 0, diagnosis: "" }))
  );
  const [bcbReading, setBcbReading] = useState<BcbQuestionTypeRow[]>(
    record.bcbData?.bcbReading && record.bcbData.bcbReading.length > 0
      ? record.bcbData.bcbReading
      : ENTRANCE_BCB_READING.map((r) => ({ ...r, id: `final-read-${r.id}`, correct: 0, errorRate: 0, diagnosis: "" }))
  );

  // Writing Task 1
  const [wriTask1Ta, setWriTask1Ta] = useState(record.bcbData?.writing?.task1?.ta || record.bcbData?.writing?.ta || "");
  const [wriTask1Cc, setWriTask1Cc] = useState(record.bcbData?.writing?.task1?.cc || record.bcbData?.writing?.cc || "");
  const [wriTask1Lr, setWriTask1Lr] = useState(record.bcbData?.writing?.task1?.lr || record.bcbData?.writing?.lr || "");
  const [wriTask1Gra, setWriTask1Gra] = useState(record.bcbData?.writing?.task1?.gra || record.bcbData?.writing?.gra || "");
  const [wriTask1Notes, setWriTask1Notes] = useState(record.bcbData?.writing?.task1?.notes || record.bcbData?.writing?.task1Notes || "");

  // Writing Task 2
  const [wriTask2Tr, setWriTask2Tr] = useState(record.bcbData?.writing?.task2?.tr || record.bcbData?.writing?.ta || "");
  const [wriTask2Cc, setWriTask2Cc] = useState(record.bcbData?.writing?.task2?.cc || record.bcbData?.writing?.cc || "");
  const [wriTask2Lr, setWriTask2Lr] = useState(record.bcbData?.writing?.task2?.lr || record.bcbData?.writing?.lr || "");
  const [wriTask2Gra, setWriTask2Gra] = useState(record.bcbData?.writing?.task2?.gra || record.bcbData?.writing?.gra || "");
  const [wriTask2Notes, setWriTask2Notes] = useState(record.bcbData?.writing?.task2?.notes || record.bcbData?.writing?.task2Notes || "");
  const [wriSummary, setWriSummary] = useState(record.bcbData?.writing?.summary || "");
  const [wriPrescription, setWriPrescription] = useState(record.bcbData?.writing?.prescription || "");

  // Speaking
  const [spkFc, setSpkFc] = useState(record.bcbData?.speaking?.fc || "");
  const [spkLr, setSpkLr] = useState(record.bcbData?.speaking?.lr || "");
  const [spkGra, setSpkGra] = useState(record.bcbData?.speaking?.gra || "");
  const [spkPr, setSpkPr] = useState(record.bcbData?.speaking?.pr || "");
  const [spkStrengths, setSpkStrengths] = useState(record.bcbData?.speaking?.strengths || "");
  const [spkWeaknesses, setSpkWeaknesses] = useState(record.bcbData?.speaking?.weaknesses || "");
  const [spkSummary, setSpkSummary] = useState(record.bcbData?.speaking?.summary || "");
  const [spkPrescription, setSpkPrescription] = useState(record.bcbData?.speaking?.prescription || "");

  // Recommendations
  const [nextCourse, setNextCourse] = useState(record.bcbData?.nextCourseRecommendation || "");
  const [generalPrescription, setGeneralPrescription] = useState(record.bcbData?.generalPrescription || "");

  // Synchronize when record changes
  useEffect(() => {
    setScoreOverall(record.scoreOverall || "");
    setScoreListening(record.scoreListening || "");
    setScoreReading(record.scoreReading || "");
    setScoreWriting(record.scoreWriting || "");
    setScoreSpeaking(record.scoreSpeaking || "");
    setResultStatus(record.resultStatus || "");
    setHasTakenTest(record.hasTakenTest ?? true);
    setIsChecked(record.isChecked ?? false);

    setOverviewTitle(record.bcbData?.overviewTitle || "");
    setOverviewSummary(record.bcbData?.overviewSummary || "");

    setListeningSummary(record.bcbData?.lr?.listeningSummary || "");
    setReadingSummary(record.bcbData?.lr?.readingSummary || "");
    setBcbListening(
      record.bcbData?.bcbListening && record.bcbData.bcbListening.length > 0
        ? record.bcbData.bcbListening
        : ENTRANCE_BCB_LISTENING.map((r) => ({ ...r, id: `final-lis-${r.id}`, correct: 0, errorRate: 0, diagnosis: "" }))
    );
    setBcbReading(
      record.bcbData?.bcbReading && record.bcbData.bcbReading.length > 0
        ? record.bcbData.bcbReading
        : ENTRANCE_BCB_READING.map((r) => ({ ...r, id: `final-read-${r.id}`, correct: 0, errorRate: 0, diagnosis: "" }))
    );

    setWriTask1Ta(record.bcbData?.writing?.task1?.ta || record.bcbData?.writing?.ta || "");
    setWriTask1Cc(record.bcbData?.writing?.task1?.cc || record.bcbData?.writing?.cc || "");
    setWriTask1Lr(record.bcbData?.writing?.task1?.lr || record.bcbData?.writing?.lr || "");
    setWriTask1Gra(record.bcbData?.writing?.task1?.gra || record.bcbData?.writing?.gra || "");
    setWriTask1Notes(record.bcbData?.writing?.task1?.notes || record.bcbData?.writing?.task1Notes || "");

    setWriTask2Tr(record.bcbData?.writing?.task2?.tr || record.bcbData?.writing?.ta || "");
    setWriTask2Cc(record.bcbData?.writing?.task2?.cc || record.bcbData?.writing?.cc || "");
    setWriTask2Lr(record.bcbData?.writing?.task2?.lr || record.bcbData?.writing?.lr || "");
    setWriTask2Gra(record.bcbData?.writing?.task2?.gra || record.bcbData?.writing?.gra || "");
    setWriTask2Notes(record.bcbData?.writing?.task2?.notes || record.bcbData?.writing?.task2Notes || "");
    setWriSummary(record.bcbData?.writing?.summary || "");
    setWriPrescription(record.bcbData?.writing?.prescription || "");

    setSpkFc(record.bcbData?.speaking?.fc || "");
    setSpkLr(record.bcbData?.speaking?.lr || "");
    setSpkGra(record.bcbData?.speaking?.gra || "");
    setSpkPr(record.bcbData?.speaking?.pr || "");
    setSpkStrengths(record.bcbData?.speaking?.strengths || "");
    setSpkWeaknesses(record.bcbData?.speaking?.weaknesses || "");
    setSpkSummary(record.bcbData?.speaking?.summary || "");
    setSpkPrescription(record.bcbData?.speaking?.prescription || "");

    setNextCourse(record.bcbData?.nextCourseRecommendation || "");
    setGeneralPrescription(record.bcbData?.generalPrescription || "");
  }, [record?.id]);

  // Auto calculate overall
  const autoOverall = useMemo(() => {
    const nl = parseFloat(scoreListening || "0");
    const nr = parseFloat(scoreReading || "0");
    const nw = parseFloat((lrOnly ? record.scoreWriting : scoreWriting) || "0");
    const ns = parseFloat((lrOnly ? record.scoreSpeaking : scoreSpeaking) || "0");
    if (!nl && !nr && !nw && !ns) return scoreOverall || "0.0";
    const avg = (nl + nr + nw + ns) / 4;
    return (Math.round(avg * 2) / 2).toFixed(1);
  }, [scoreListening, scoreReading, scoreWriting, scoreSpeaking, scoreOverall, lrOnly, record.scoreWriting, record.scoreSpeaking]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const totalListeningCorrect = bcbListening.reduce((sum, r) => sum + (Number(r.correct) || 0), 0);
      const totalReadingCorrect = bcbReading.reduce((sum, r) => sum + (Number(r.correct) || 0), 0);

      const bcbData: FinalTestBcbData = {
        overviewTitle: overviewTitle.trim() || undefined,
        overviewSummary: overviewSummary.trim() || undefined,
        lr: {
          listeningCorrect: String(totalListeningCorrect),
          readingCorrect: String(totalReadingCorrect),
          listeningSummary: listeningSummary.trim() || undefined,
          readingSummary: readingSummary.trim() || undefined,
        },
        bcbListening,
        bcbReading,
        writing: lrOnly
          ? record.bcbData?.writing
          : {
              task1: {
                ta: wriTask1Ta.trim(),
                cc: wriTask1Cc.trim(),
                lr: wriTask1Lr.trim(),
                gra: wriTask1Gra.trim(),
                notes: wriTask1Notes.trim(),
              },
              task2: {
                tr: wriTask2Tr.trim(),
                cc: wriTask2Cc.trim(),
                lr: wriTask2Lr.trim(),
                gra: wriTask2Gra.trim(),
                notes: wriTask2Notes.trim(),
              },
              summary: wriSummary.trim() || undefined,
              prescription: wriPrescription.trim() || undefined,
            },
        speaking: lrOnly
          ? record.bcbData?.speaking
          : {
              fc: spkFc.trim(),
              lr: spkLr.trim(),
              gra: spkGra.trim(),
              pr: spkPr.trim(),
              strengths: spkStrengths.trim() || undefined,
              weaknesses: spkWeaknesses.trim() || undefined,
              summary: spkSummary.trim() || undefined,
              prescription: spkPrescription.trim() || undefined,
            },
        nextCourseRecommendation: nextCourse.trim() || undefined,
        generalPrescription: generalPrescription.trim() || undefined,
      };

      const finalW = lrOnly ? record.scoreWriting : scoreWriting.trim();
      const finalS = lrOnly ? record.scoreSpeaking : scoreSpeaking.trim();

      await updateFinalTestRecord(record.id, {
        scoreListening: scoreListening.trim() || undefined,
        scoreReading: scoreReading.trim() || undefined,
        scoreWriting: finalW || undefined,
        scoreSpeaking: finalS || undefined,
        scoreOverall: autoOverall || undefined,
        resultStatus: resultStatus || undefined,
        hasTakenTest,
        isChecked,
        bcbData,
        status: (autoOverall || finalS || finalW) ? "graded" : "scheduled",
      });

      setSaved(true);
      if (onSaved) onSaved();
      setTimeout(() => setSaved(false), 4000);
    } catch (err: any) {
      alert("Lỗi khi lưu BCB Final: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const tabs = lrOnly
    ? [
        ["scores", "1. Điểm & Đánh giá"],
        ["lr", "2. Listening & Reading"],
      ]
    : [
        ["scores", "1. Điểm & Mục tiêu"],
        ["lr", "2. Listening & Reading"],
        ["writing", "3. Writing (Task 1 & Task 2)"],
        ["speaking", "4. Speaking (Part 1-3)"],
      ];

  return (
    <div className="space-y-6">
      {/* Subtitle notification */}
      {lrOnly && (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2 text-xs font-semibold text-zinc-600 flex items-center justify-between">
          <span>
            {portalLabel} chỉ điền <strong>Listening</strong> &amp; <strong>Reading</strong>. Điểm và tiêu chí <strong>Writing</strong> / <strong>Speaking</strong> do Grader chấm và điền.
          </span>
        </div>
      )}

      {/* Tab Navigation Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-primary/10 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          {tabs.map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setSection(key as any)}
              className={`rounded-xl px-4 py-2 text-xs font-black transition-all cursor-pointer ${
                section === key
                  ? "bg-primary text-white shadow-soft"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {saved && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800 animate-in fade-in">
          ✓ Đã lưu toàn bộ thông tin Bảng Chẩn Bệnh Final thành công! Học viên sẽ thấy trên trang Chẩn đoán Final.
        </div>
      )}

      {/* ─── TAB 1: SCORES & OVERVIEW ─── */}
      {section === "scores" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <Field label="Listening (Band)">
              <input
                className={inputClass}
                value={scoreListening}
                onChange={(e) => setScoreListening(e.target.value)}
                placeholder="6.5"
              />
            </Field>
            <Field label="Reading (Band)">
              <input
                className={inputClass}
                value={scoreReading}
                onChange={(e) => setScoreReading(e.target.value)}
                placeholder="6.5"
              />
            </Field>
            <Field label={lrOnly ? "Writing (Grader chấm)" : "Writing (Band)"}>
              <input
                className={`${inputClass} ${lrOnly ? "bg-zinc-100/80 text-zinc-600 cursor-not-allowed" : ""}`}
                value={lrOnly ? (record.scoreWriting || "") : scoreWriting}
                readOnly={lrOnly}
                onChange={(e) => !lrOnly && setScoreWriting(e.target.value)}
                placeholder={lrOnly ? "—" : "6.0"}
                title={lrOnly ? "Điểm Writing do Grader chấm" : undefined}
              />
            </Field>
            <Field label={lrOnly ? "Speaking (Grader chấm)" : "Speaking (Band)"}>
              <input
                className={`${inputClass} ${lrOnly ? "bg-zinc-100/80 text-zinc-600 cursor-not-allowed" : ""}`}
                value={lrOnly ? (record.scoreSpeaking || "") : scoreSpeaking}
                readOnly={lrOnly}
                onChange={(e) => !lrOnly && setScoreSpeaking(e.target.value)}
                placeholder={lrOnly ? "—" : "6.5"}
                title={lrOnly ? "Điểm Speaking do Grader chấm" : undefined}
              />
            </Field>
            <Field label="Overall (Band)">
              <input
                className={`${inputClass} font-black text-amber-700 bg-amber-50/40`}
                value={autoOverall}
                readOnly
                placeholder="6.5"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <Field label="Kết quả Final Test">
              <select
                className={inputClass}
                value={resultStatus}
                onChange={(e) => setResultStatus(e.target.value as "Đạt" | "Không đạt" | "")}
              >
                <option value="">Chưa xác định</option>
                <option value="Đạt">Đạt chuẩn đầu ra</option>
                <option value="Không đạt">Chưa đạt chuẩn đầu ra</option>
              </select>
            </Field>

            <Field label="Tình trạng thi">
              <select
                className={inputClass}
                value={hasTakenTest ? "taken" : "not_taken"}
                onChange={(e) => setHasTakenTest(e.target.value === "taken")}
              >
                <option value="taken">Đã hoàn thành bài thi</option>
                <option value="not_taken">Chưa thi</option>
              </select>
            </Field>

            <Field label="Trạng thái Trả Kết Quả (Check)">
              <select
                className={inputClass}
                value={isChecked ? "checked" : "unchecked"}
                onChange={(e) => setIsChecked(e.target.value === "checked")}
              >
                <option value="checked">Đã Check & Duyệt trả kết quả</option>
                <option value="unchecked">Chưa Check (Bảo lưu nội bộ)</option>
              </select>
            </Field>
          </div>

          <div className="pt-4 border-t border-zinc-100 space-y-4">
            <Field label="Tiêu đề Đánh giá Tổng quan BCB Final">
              <input
                className={inputClass}
                placeholder="VD: Năng lực Khá (Competent User) — Đạt mục tiêu khóa học"
                value={overviewTitle}
                onChange={(e) => setOverviewTitle(e.target.value)}
              />
            </Field>
            <Field label="Mô tả chi tiết Đánh giá Tổng quan">
              <textarea
                rows={3}
                className={inputClass}
                placeholder="Nhập nhận xét tổng quan về quá trình học, điểm mạnh nổi bật và kết quả cuối khóa của học viên..."
                value={overviewSummary}
                onChange={(e) => setOverviewSummary(e.target.value)}
              />
            </Field>
          </div>
        </div>
      )}

      {/* ─── TAB 2: LISTENING & READING ─── */}
      {section === "lr" && (
        <div className="space-y-10 animate-in fade-in duration-150">
          {/* 1. Listening Diagnostic Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-[#796eb2] flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#796eb2]" />
              1. Bảng Chẩn Bệnh Kỹ Năng Listening Final
            </h3>
            <BcbSkillDiagnosticSection
              skill="listening"
              bandScore={Number(scoreListening) || 0}
              onBandScoreChange={(score) => setScoreListening(score > 0 ? String(score) : "")}
              summaryText={listeningSummary}
              onSummaryTextChange={setListeningSummary}
              rows={bcbListening}
              onRowsChange={setBcbListening}
            />
          </div>

          {/* 2. Reading Diagnostic Section */}
          <div className="space-y-3 pt-6 border-t-2 border-[#796eb2]/20">
            <h3 className="text-xs font-black uppercase tracking-widest text-[#796eb2] flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#796eb2]" />
              2. Bảng Chẩn Bệnh Kỹ Năng Reading Final
            </h3>
            <BcbSkillDiagnosticSection
              skill="reading"
              bandScore={Number(scoreReading) || 0}
              onBandScoreChange={(score) => setScoreReading(score > 0 ? String(score) : "")}
              summaryText={readingSummary}
              onSummaryTextChange={setReadingSummary}
              rows={bcbReading}
              onRowsChange={setBcbReading}
            />
          </div>
        </div>
      )}

      {/* ─── TAB 3: WRITING ─── */}
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

          {/* Writing Task 1 */}
          <div className="space-y-4 rounded-2xl border border-primary/15 bg-background/50 p-5">
            <h3 className="text-xs font-black uppercase tracking-widest text-primary border-b border-primary/10 pb-2">
              Writing Task 1 (Báo cáo biểu đồ / Diagram)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Field label="TA (Task Achievement)">
                <input
                  className={inputClass}
                  value={wriTask1Ta}
                  onChange={(e) => setWriTask1Ta(e.target.value)}
                  placeholder="6.0"
                />
              </Field>
              <Field label="CC (Coherence)">
                <input
                  className={inputClass}
                  value={wriTask1Cc}
                  onChange={(e) => setWriTask1Cc(e.target.value)}
                  placeholder="6.0"
                />
              </Field>
              <Field label="LR (Lexical Resource)">
                <input
                  className={inputClass}
                  value={wriTask1Lr}
                  onChange={(e) => setWriTask1Lr(e.target.value)}
                  placeholder="6.0"
                />
              </Field>
              <Field label="GRA (Grammar)">
                <input
                  className={inputClass}
                  value={wriTask1Gra}
                  onChange={(e) => setWriTask1Gra(e.target.value)}
                  placeholder="6.0"
                />
              </Field>
            </div>
            <Field label="Nhận xét chi tiết Writing Task 1">
              <textarea
                rows={3}
                className={inputClass}
                placeholder="Nhận xét về Overview, số liệu chi tiết, cấu trúc so sánh và từ vựng biểu đồ..."
                value={wriTask1Notes}
                onChange={(e) => setWriTask1Notes(e.target.value)}
              />
            </Field>
          </div>

          {/* Writing Task 2 */}
          <div className="space-y-4 rounded-2xl border border-primary/15 bg-background/50 p-5">
            <h3 className="text-xs font-black uppercase tracking-widest text-primary border-b border-primary/10 pb-2">
              Writing Task 2 (Bài luận Essay)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Field label="TR (Task Response)">
                <input
                  className={inputClass}
                  value={wriTask2Tr}
                  onChange={(e) => setWriTask2Tr(e.target.value)}
                  placeholder="6.0"
                />
              </Field>
              <Field label="CC (Coherence)">
                <input
                  className={inputClass}
                  value={wriTask2Cc}
                  onChange={(e) => setWriTask2Cc(e.target.value)}
                  placeholder="6.0"
                />
              </Field>
              <Field label="LR (Lexical Resource)">
                <input
                  className={inputClass}
                  value={wriTask2Lr}
                  onChange={(e) => setWriTask2Lr(e.target.value)}
                  placeholder="6.0"
                />
              </Field>
              <Field label="GRA (Grammar)">
                <input
                  className={inputClass}
                  value={wriTask2Gra}
                  onChange={(e) => setWriTask2Gra(e.target.value)}
                  placeholder="6.0"
                />
              </Field>
            </div>
            <Field label="Nhận xét chi tiết Writing Task 2">
              <textarea
                rows={3}
                className={inputClass}
                placeholder="Nhận xét về lập luận, giải thích ví dụ, liên kết đoạn văn, từ vựng học thuật và lỗi ngữ pháp..."
                value={wriTask2Notes}
                onChange={(e) => setWriTask2Notes(e.target.value)}
              />
            </Field>
          </div>

          {/* General Writing Prescription */}
          <div className="space-y-4 pt-2">
            <Field label="Nhận xét chung Kỹ năng Writing">
              <textarea
                rows={2}
                className={inputClass}
                placeholder="Tổng kết năng lực Writing cuối khóa..."
                value={wriSummary}
                onChange={(e) => setWriSummary(e.target.value)}
              />
            </Field>
            <Field label="Toa thuốc & Lời khuyên tự luyện Writing">
              <textarea
                rows={3}
                className={inputClass}
                placeholder="Phương pháp khắc phục lỗi, tài liệu rèn luyện thêm..."
                value={wriPrescription}
                onChange={(e) => setWriPrescription(e.target.value)}
              />
            </Field>
          </div>
        </div>
      )}

      {/* ─── TAB 4: SPEAKING ─── */}
      {section === "speaking" && (
        <div className="space-y-8 animate-in fade-in duration-150">
          {/* Quick Reference Button */}
          <div className="flex items-center justify-between rounded-xl bg-purple-50 border border-purple-200 p-3">
            <div className="text-xs font-bold text-purple-900">
              Quy chuẩn 4 Tiêu chí IELTS Speaking (25% mỗi tiêu chí: FC, LR, GRA, PR)
            </div>
            <button
              type="button"
              onClick={() => setShowSpeakingRef(!showSpeakingRef)}
              className="rounded-lg bg-purple-200 px-3 py-1 text-xs font-black text-purple-900 hover:bg-purple-300"
            >
              {showSpeakingRef ? "Ẩn quy chuẩn" : "Xem quy chuẩn chi tiết"}
            </button>
          </div>

          <div className="space-y-4 rounded-2xl border border-primary/15 bg-background/50 p-5">
            <h3 className="text-xs font-black uppercase tracking-widest text-primary border-b border-primary/10 pb-2">
              Speaking (Part 1, Part 2 & Part 3)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Field label="FC (Fluency & Coherence)">
                <input
                  className={inputClass}
                  value={spkFc}
                  onChange={(e) => setSpkFc(e.target.value)}
                  placeholder="6.5"
                />
              </Field>
              <Field label="LR (Lexical Resource)">
                <input
                  className={inputClass}
                  value={spkLr}
                  onChange={(e) => setSpkLr(e.target.value)}
                  placeholder="6.5"
                />
              </Field>
              <Field label="GRA (Grammar Range & Acc)">
                <input
                  className={inputClass}
                  value={spkGra}
                  onChange={(e) => setSpkGra(e.target.value)}
                  placeholder="6.0"
                />
              </Field>
              <Field label="PR (Pronunciation)">
                <input
                  className={inputClass}
                  value={spkPr}
                  onChange={(e) => setSpkPr(e.target.value)}
                  placeholder="6.5"
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <Field label="Điểm mạnh nổi bật (Strengths)">
                <textarea
                  rows={2}
                  className={inputClass}
                  placeholder="Phản xạ tự nhiên, phát âm rõ ràng..."
                  value={spkStrengths}
                  onChange={(e) => setSpkStrengths(e.target.value)}
                />
              </Field>
              <Field label="Điểm cần cải thiện (Weaknesses)">
                <textarea
                  rows={2}
                  className={inputClass}
                  placeholder="Thiếu từ vựng chuyên sâu Part 3, lặp thì quá khứ..."
                  value={spkWeaknesses}
                  onChange={(e) => setSpkWeaknesses(e.target.value)}
                />
              </Field>
            </div>

            <Field label="Nhận xét chi tiết buổi phỏng vấn Speaking Final">
              <textarea
                rows={3}
                className={inputClass}
                placeholder="Đánh giá chi tiết từng Part 1, 2, 3 và độ tự tin của thí sinh..."
                value={spkSummary}
                onChange={(e) => setSpkSummary(e.target.value)}
              />
            </Field>

            <Field label="Toa thuốc & Lời khuyên tự luyện Speaking">
              <textarea
                rows={2}
                className={inputClass}
                placeholder="Lời khuyên luyện tập ngữ điệu, mở rộng ý tưởng..."
                value={spkPrescription}
                onChange={(e) => setSpkPrescription(e.target.value)}
              />
            </Field>
          </div>
        </div>
      )}


      {/* Bottom Save Action Button */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-primary/10">
        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          className="rounded-xl bg-primary hover:bg-primary-hover px-6 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-soft transition-all cursor-pointer disabled:opacity-50"
        >
          {saving ? "Đang lưu BCB Final..." : "✓ Lưu Toàn Bộ BCB Final"}
        </button>
      </div>
    </div>
  );
}
