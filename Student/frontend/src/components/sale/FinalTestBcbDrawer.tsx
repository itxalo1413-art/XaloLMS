"use client";

import React, { useState } from "react";
import {
  type FinalTestRecord,
  type FinalTestBcbData,
  updateFinalTestRecord,
} from "@/lib/finalTestArchive";
import {
  type BcbQuestionTypeRow,
  ENTRANCE_BCB_LISTENING,
  ENTRANCE_BCB_READING,
  computeBcbErrorRate,
} from "@/lib/guestBcbDiagnosis";
import { BcbQuestionTypeTable } from "@/components/diagnosis/BcbQuestionTypeTable";
import { WritingTask1CriteriaPanel } from "@/components/diagnosis/WritingTask1CriteriaPanel";
import { WritingTask2CriteriaPanel } from "@/components/diagnosis/WritingTask2CriteriaPanel";
import { SpeakingCriteriaPanel } from "@/components/diagnosis/SpeakingCriteriaPanel";
import { WritingScoreFormulaNote } from "@/components/diagnosis/WritingScoreFormulaNote";
import {
  getSpeakingStandardDescription,
  getWritingTask1StandardDescription,
  getWritingTask2StandardDescription,
  WRITING_TASK1_STANDARD_DESCRIPTIONS,
  WRITING_TASK2_STANDARD_DESCRIPTIONS,
} from "@/lib/bcbStandardReference";
import { formatBandScore } from "@/lib/formatBandScore";

interface FinalTestBcbDrawerProps {
  record: FinalTestRecord;
  onClose: () => void;
  onSaved: () => void;
  /** Override title (e.g. Entrance). */
  title?: string;
  /** Custom persist — dùng cho Entrance booking thay vì Final. */
  persistOverride?: (
    id: string,
    patch: {
      scoreOverall?: string;
      scoreListening?: string;
      scoreReading?: string;
      scoreWriting?: string;
      scoreSpeaking?: string;
      status?: FinalTestRecord["status"];
      bcbData: FinalTestBcbData;
    },
  ) => Promise<void>;
}

export function FinalTestBcbDrawer({
  record,
  onClose,
  onSaved,
  title = "Bảng Chẩn Bệnh (BCB) Final Test",
  persistOverride,
}: FinalTestBcbDrawerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"speaking" | "writing" | "listening" | "reading" | "overview">("speaking");
  const [writingTaskMode, setWritingTaskMode] = useState<"task1" | "task2">("task1");
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [record, activeTab]);

  React.useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Scores
  const [scoreOverall, setScoreOverall] = useState(record.scoreOverall || "");
  const [scoreListening, setScoreListening] = useState(record.scoreListening || "");
  const [scoreReading, setScoreReading] = useState(record.scoreReading || "");
  const [scoreWriting, setScoreWriting] = useState(record.scoreWriting || "");
  const [scoreSpeaking, setScoreSpeaking] = useState(record.scoreSpeaking || "");

  // Speaking BCB - No pre-filled sample dummy text
  const [spkFc, setSpkFc] = useState(record.bcbData?.speaking?.fc || "");
  const [spkLr, setSpkLr] = useState(record.bcbData?.speaking?.lr || "");
  const [spkGra, setSpkGra] = useState(record.bcbData?.speaking?.gra || "");
  const [spkPr, setSpkPr] = useState(record.bcbData?.speaking?.pr || "");
  const [spkStrengths, setSpkStrengths] = useState(record.bcbData?.speaking?.strengths || "");
  const [spkWeaknesses, setSpkWeaknesses] = useState(record.bcbData?.speaking?.weaknesses || "");
  const [spkPrescription, setSpkPrescription] = useState(record.bcbData?.speaking?.prescription || "");
  const [spkSummary, setSpkSummary] = useState(record.bcbData?.speaking?.summary || "");

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

  const [wriPrescription, setWriPrescription] = useState(record.bcbData?.writing?.prescription || "");
  const [wriSummary, setWriSummary] = useState(record.bcbData?.writing?.summary || "");

  // L-R BCB & Question Types Table
  const [lrListeningCorrect, setLrListeningCorrect] = useState(record.bcbData?.lr?.listeningCorrect || "");
  const [lrReadingCorrect, setLrReadingCorrect] = useState(record.bcbData?.lr?.readingCorrect || "");
  const [lrListeningWeaknesses, setLrListeningWeaknesses] = useState(record.bcbData?.lr?.listeningWeaknesses || "");
  const [lrReadingWeaknesses, setLrReadingWeaknesses] = useState(record.bcbData?.lr?.readingWeaknesses || "");
  const [lrListeningSummary, setLrListeningSummary] = useState(record.bcbData?.lr?.listeningSummary || "");
  const [lrReadingSummary, setLrReadingSummary] = useState(record.bcbData?.lr?.readingSummary || "");

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

  // General Overview & Prescription
  const [overviewTitle, setOverviewTitle] = useState(record.bcbData?.overviewTitle || "");
  const [overviewSummary, setOverviewSummary] = useState(record.bcbData?.overviewSummary || "");
  const [generalPrescription, setGeneralPrescription] = useState(record.bcbData?.generalPrescription || "");
  const [nextCourse, setNextCourse] = useState(record.bcbData?.nextCourseRecommendation || "");
  const [targetAchieved, setTargetAchieved] = useState(record.bcbData?.targetAchieved ?? true);

  // Auto-calculated Task 1 and Task 2 bands
  const task1Band = React.useMemo(() => {
    const arr = [wriTask1Ta, wriTask1Cc, wriTask1Lr, wriTask1Gra].map(Number).filter((n) => !isNaN(n) && n > 0);
    if (arr.length === 0) {
      const w = Number(scoreWriting);
      return !isNaN(w) && w > 0 ? w : 0;
    }
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }, [wriTask1Ta, wriTask1Cc, wriTask1Lr, wriTask1Gra, scoreWriting]);

  const task2Band = React.useMemo(() => {
    const arr = [wriTask2Tr, wriTask2Cc, wriTask2Lr, wriTask2Gra].map(Number).filter((n) => !isNaN(n) && n > 0);
    if (arr.length === 0) {
      const w = Number(scoreWriting);
      return !isNaN(w) && w > 0 ? w : 0;
    }
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }, [wriTask2Tr, wriTask2Cc, wriTask2Lr, wriTask2Gra, scoreWriting]);

  const calculatedWritingOverall = React.useMemo(() => {
    if (task1Band <= 0 && task2Band <= 0) return 0;
    return Math.round(((task1Band + task2Band * 2) / 3) * 2) / 2;
  }, [task1Band, task2Band]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const bcbData: FinalTestBcbData = {
        overviewTitle: overviewTitle.trim() || undefined,
        overviewSummary: overviewSummary.trim() || undefined,
        speaking: {
          fc: spkFc.trim() || "0",
          lr: spkLr.trim() || "0",
          gra: spkGra.trim() || "0",
          pr: spkPr.trim() || "0",
          strengths: spkStrengths.trim() || undefined,
          weaknesses: spkWeaknesses.trim() || undefined,
          prescription: spkPrescription.trim() || undefined,
          summary: spkSummary.trim() || undefined,
        },
        writing: {
          task1: {
            ta: wriTask1Ta.trim() || "0",
            cc: wriTask1Cc.trim() || "0",
            lr: wriTask1Lr.trim() || "0",
            gra: wriTask1Gra.trim() || "0",
            notes: wriTask1Notes.trim() || undefined,
          },
          task2: {
            tr: wriTask2Tr.trim() || "0",
            cc: wriTask2Cc.trim() || "0",
            lr: wriTask2Lr.trim() || "0",
            gra: wriTask2Gra.trim() || "0",
            notes: wriTask2Notes.trim() || undefined,
          },
          task1Notes: wriTask1Notes.trim() || undefined,
          task2Notes: wriTask2Notes.trim() || undefined,
          prescription: wriPrescription.trim() || undefined,
          summary: wriSummary.trim() || undefined,
          ta: wriTask1Ta.trim() || undefined,
          cc: wriTask1Cc.trim() || undefined,
          lr: wriTask1Lr.trim() || undefined,
          gra: wriTask1Gra.trim() || undefined,
        },
        lr: {
          listeningCorrect: lrListeningCorrect.trim() || undefined,
          readingCorrect: lrReadingCorrect.trim() || undefined,
          listeningWeaknesses: lrListeningWeaknesses.trim() || undefined,
          readingWeaknesses: lrReadingWeaknesses.trim() || undefined,
          listeningSummary: lrListeningSummary.trim() || undefined,
          readingSummary: lrReadingSummary.trim() || undefined,
        },
        bcbListening,
        bcbReading,
        generalPrescription: generalPrescription.trim() || undefined,
        nextCourseRecommendation: nextCourse.trim() || undefined,
        targetAchieved,
      };

      if (persistOverride) {
        await persistOverride(record.id, {
          scoreOverall: scoreOverall.trim() || undefined,
          scoreListening: scoreListening.trim() || undefined,
          scoreReading: scoreReading.trim() || undefined,
          scoreWriting:
            scoreWriting.trim() ||
            (calculatedWritingOverall > 0 ? String(calculatedWritingOverall) : undefined),
          scoreSpeaking: scoreSpeaking.trim() || undefined,
          status: scoreOverall || scoreSpeaking || scoreWriting ? "graded" : record.status,
          bcbData,
        });
      } else {
        await updateFinalTestRecord(record.id, {
          scoreOverall: scoreOverall.trim() || undefined,
          scoreListening: scoreListening.trim() || undefined,
          scoreReading: scoreReading.trim() || undefined,
          scoreWriting:
            scoreWriting.trim() ||
            (calculatedWritingOverall > 0 ? String(calculatedWritingOverall) : undefined),
          scoreSpeaking: scoreSpeaking.trim() || undefined,
          status: scoreOverall || scoreSpeaking || scoreWriting ? "graded" : record.status,
          bcbData,
        });
      }

      setIsEditing(false);
      onSaved();
    } catch (err: any) {
      alert("Lưu BCB thất bại: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const copyReportText = () => {
    const text = `
BẢNG CHẨN BỆNH (BCB) ${persistOverride ? "ENTRANCE" : "FINAL"} TEST - XALO IELTS
--------------------------------------------
Học viên: ${record.candidateName}
SĐT: ${record.candidatePhone}
Lớp: ${record.className || record.classCode || "Lớp học viên"}
Mục tiêu: ${record.targetBand || "—"} IELTS
Giám khảo chấm: ${record.examinerName}
Ngày thi: ${record.date} lúc ${record.time}

KẾT QUẢ ĐIỂM SỐ:
• OVERALL BAND: ${scoreOverall || "—"}
• Listening: ${scoreListening || "—"} | Reading: ${scoreReading || "—"}
• Writing: ${scoreWriting || calculatedWritingOverall || "—"} | Speaking: ${scoreSpeaking || "—"}
• Đạt chuẩn đầu ra: ${targetAchieved ? "ĐẠT CHUẨN" : "CẦN BỔ TRỢ"}

PHÂN TÍCH KỸ NĂNG SPEAKING:
- Tiêu chí: FC ${spkFc || "—"} | LR ${spkLr || "—"} | GRA ${spkGra || "—"} | PR ${spkPr || "—"}
- Điểm mạnh: ${spkStrengths || "Chưa có"}
- Điểm yếu: ${spkWeaknesses || "Chưa có"}
- Kê đơn Speaking: ${spkPrescription || "Chưa có"}

PHÂN TÍCH KỸ NĂNG WRITING:
- Task 1: TA ${wriTask1Ta || "—"} | CC ${wriTask1Cc || "—"} | LR ${wriTask1Lr || "—"} | GRA ${wriTask1Gra || "—"}
  Nhận xét Task 1: ${wriTask1Notes || "Chưa có"}
- Task 2: TR ${wriTask2Tr || "—"} | CC ${wriTask2Cc || "—"} | LR ${wriTask2Lr || "—"} | GRA ${wriTask2Gra || "—"}
  Nhận xét Task 2: ${wriTask2Notes || "Chưa có"}
- Kê đơn Writing: ${wriPrescription || "Chưa có"}

KỸ NĂNG LISTENING & READING:
- Listening: Đúng ${lrListeningCorrect || "—"} | Điểm yếu: ${lrListeningWeaknesses || "Chưa có"}
- Reading: Đúng ${lrReadingCorrect || "—"} | Điểm yếu: ${lrReadingWeaknesses || "Chưa có"}

ĐÁNH GIÁ CHUNG & KÊ ĐƠN:
${overviewSummary || generalPrescription || "Hoàn thành Final Test."}
Lộ trình khóa học đề xuất: ${nextCourse || "Khóa nâng cao tiếp theo"}
--------------------------------------------
    `.trim();

    void navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const updateListeningRow = (idx: number, patch: Partial<BcbQuestionTypeRow>) => {
    setBcbListening((prev) =>
      prev.map((r, i) => {
        if (i !== idx) return r;
        const next = { ...r, ...patch };
        if (next.total && next.total > 0 && typeof next.correct === "number") {
          next.errorRate = computeBcbErrorRate(next.correct, next.total);
        }
        return next;
      })
    );
  };

  const updateReadingRow = (idx: number, patch: Partial<BcbQuestionTypeRow>) => {
    setBcbReading((prev) =>
      prev.map((r, i) => {
        if (i !== idx) return r;
        const next = { ...r, ...patch };
        if (next.total && next.total > 0 && typeof next.correct === "number") {
          next.errorRate = computeBcbErrorRate(next.correct, next.total);
        }
        return next;
      })
    );
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm cursor-pointer"
        aria-hidden="true"
      />

      {/* Drawer panel pinned to top-right */}
      <aside className="fixed top-0 right-0 bottom-0 z-[101] w-full max-w-2xl sm:max-w-3xl bg-white shadow-2xl flex flex-col border-l border-zinc-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/90 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-zinc-900">{title}</h2>
              <span
                className={`rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wider border ${
                  targetAchieved
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}
              >
                {targetAchieved ? "Đạt Chuẩn Đầu Ra" : "Cần Bổ Trợ"}
              </span>
            </div>
            <p className="text-xs text-zinc-500 font-medium mt-0.5">
              {record.candidateName} • {record.className || record.classCode || "Khóa IELTS"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={copyReportText}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 bg-white text-xs font-bold text-zinc-700 hover:bg-zinc-100 transition-all shadow-xs cursor-pointer"
            >
              {copied ? "✓ Đã copy" : "Copy BCB"}
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isEditing
                  ? "bg-zinc-800 text-white"
                  : "border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20"
              }`}
            >
              {isEditing ? "Xem trước" : "Chỉnh sửa"}
            </button>
            {isEditing && (
              <button
                type="button"
                disabled={saving}
                onClick={handleSave}
                className="px-4 py-1.5 rounded-xl bg-primary text-xs font-bold text-white hover:bg-primary/90 transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                {saving ? "Đang lưu..." : "Lưu BCB"}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Candidate Card */}
          <div className="rounded-2xl border border-zinc-200 bg-gradient-to-r from-primary/5 via-white to-primary/5 p-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-sm font-black text-zinc-900">{record.candidateName}</div>
              <div className="text-xs text-zinc-500 font-mono mt-0.5">
                {record.candidatePhone} {record.candidateEmail ? `• ${record.candidateEmail}` : ""}
              </div>
              <div className="text-xs text-zinc-600 mt-1 font-medium">
                Giám khảo: <span className="font-bold text-primary">{record.examinerName}</span> • Ngày thi:{" "}
                <span className="font-bold text-zinc-900">{record.date} ({record.time})</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-center px-3 py-2 rounded-xl bg-white border border-zinc-200 shadow-xs">
                <div className="text-[9px] font-bold text-zinc-400 uppercase">Mục tiêu</div>
                <div className="text-base font-black text-primary">{record.targetBand || "—"}</div>
              </div>
              <div className="text-center px-4 py-2 rounded-xl bg-primary text-white shadow-sm">
                <div className="text-[9px] font-black uppercase tracking-wider text-white/80">OVERALL</div>
                <div className="text-lg font-black">{scoreOverall || "—"}</div>
              </div>
            </div>
          </div>

          {/* 4 Skills Score Input / Display */}
          <div className="space-y-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-500">Điểm số 4 Kỹ Năng Final</h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-3 text-center">
                <div className="text-[10px] font-bold text-zinc-500 uppercase">Listening</div>
                {isEditing ? (
                  <input
                    type="text"
                    value={scoreListening}
                    onChange={(e) => setScoreListening(e.target.value)}
                    placeholder="7.0"
                    className="w-full mt-1 text-center font-black text-base text-zinc-900 bg-white border border-zinc-200 rounded-lg py-1 outline-none focus:border-primary"
                  />
                ) : (
                  <div className="text-base font-black text-zinc-900 mt-1">{scoreListening || "—"}</div>
                )}
              </div>

              <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-3 text-center">
                <div className="text-[10px] font-bold text-zinc-500 uppercase">Reading</div>
                {isEditing ? (
                  <input
                    type="text"
                    value={scoreReading}
                    onChange={(e) => setScoreReading(e.target.value)}
                    placeholder="6.5"
                    className="w-full mt-1 text-center font-black text-base text-zinc-900 bg-white border border-zinc-200 rounded-lg py-1 outline-none focus:border-primary"
                  />
                ) : (
                  <div className="text-base font-black text-zinc-900 mt-1">{scoreReading || "—"}</div>
                )}
              </div>

              <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-3 text-center">
                <div className="text-[10px] font-bold text-zinc-500 uppercase">Writing</div>
                {isEditing ? (
                  <input
                    type="text"
                    value={scoreWriting}
                    onChange={(e) => setScoreWriting(e.target.value)}
                    placeholder="6.0"
                    className="w-full mt-1 text-center font-black text-base text-zinc-900 bg-white border border-zinc-200 rounded-lg py-1 outline-none focus:border-primary"
                  />
                ) : (
                  <div className="text-base font-black text-zinc-900 mt-1">{scoreWriting || calculatedWritingOverall || "—"}</div>
                )}
              </div>

              <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-3 text-center">
                <div className="text-[10px] font-bold text-zinc-500 uppercase">Speaking</div>
                {isEditing ? (
                  <input
                    type="text"
                    value={scoreSpeaking}
                    onChange={(e) => setScoreSpeaking(e.target.value)}
                    placeholder="6.5"
                    className="w-full mt-1 text-center font-black text-base text-zinc-900 bg-white border border-zinc-200 rounded-lg py-1 outline-none focus:border-primary"
                  />
                ) : (
                  <div className="text-base font-black text-zinc-900 mt-1">{scoreSpeaking || "—"}</div>
                )}
              </div>

              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-center col-span-2 sm:col-span-1">
                <div className="text-[10px] font-black text-primary uppercase">Overall</div>
                {isEditing ? (
                  <input
                    type="text"
                    value={scoreOverall}
                    onChange={(e) => setScoreOverall(e.target.value)}
                    placeholder="6.5"
                    className="w-full mt-1 text-center font-black text-base text-primary bg-white border border-primary/30 rounded-lg py-1 outline-none focus:border-primary"
                  />
                ) : (
                  <div className="text-base font-black text-primary mt-1">{scoreOverall || "—"}</div>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-zinc-100 pb-3">
            {[
              { id: "speaking", label: "Speaking" },
              { id: "writing", label: "Writing (Task 1 & 2)" },
              { id: "listening", label: "Listening" },
              { id: "reading", label: "Reading" },
              { id: "overview", label: "Tổng Quan & Kê Đơn" },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === t.id
                    ? "bg-primary text-white shadow-soft"
                    : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* TAB 1: SPEAKING */}
          {activeTab === "speaking" && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-4 rounded-2xl border border-purple-100 bg-purple-50/40">
                <div className="text-[10px] font-black text-purple-700 uppercase tracking-widest">
                  Đặc trưng Speaking Band {scoreSpeaking ? formatBandScore(scoreSpeaking) : "—"} (Chuẩn Cambridge)
                </div>
                <p className="text-xs font-medium text-zinc-700 leading-relaxed mt-1.5 whitespace-pre-line">
                  {scoreSpeaking
                    ? getSpeakingStandardDescription(Number(scoreSpeaking))
                    : "Chưa có điểm Speaking Final."}
                </p>
              </div>

              {/* 4 Rubric Criteria */}
              <div className="space-y-2">
                <div className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">
                  Tiêu chí chấm điểm Speaking (FC, LR, GRA, PR)
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-center">
                    <div className="text-[10px] font-bold text-zinc-500">Fluency & Coherence</div>
                    {isEditing ? (
                      <input
                        type="text"
                        value={spkFc}
                        onChange={(e) => setSpkFc(e.target.value)}
                        placeholder="6.5"
                        className="w-full mt-1 text-center font-black text-xs text-zinc-900 bg-white border border-zinc-200 rounded py-1"
                      />
                    ) : (
                      <div className="text-sm font-black text-purple-700 mt-1">{spkFc || "—"}</div>
                    )}
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-center">
                    <div className="text-[10px] font-bold text-zinc-500">Lexical Resource</div>
                    {isEditing ? (
                      <input
                        type="text"
                        value={spkLr}
                        onChange={(e) => setSpkLr(e.target.value)}
                        placeholder="6.5"
                        className="w-full mt-1 text-center font-black text-xs text-zinc-900 bg-white border border-zinc-200 rounded py-1"
                      />
                    ) : (
                      <div className="text-sm font-black text-purple-700 mt-1">{spkLr || "—"}</div>
                    )}
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-center">
                    <div className="text-[10px] font-bold text-zinc-500">Grammar (GRA)</div>
                    {isEditing ? (
                      <input
                        type="text"
                        value={spkGra}
                        onChange={(e) => setSpkGra(e.target.value)}
                        placeholder="6.0"
                        className="w-full mt-1 text-center font-black text-xs text-zinc-900 bg-white border border-zinc-200 rounded py-1"
                      />
                    ) : (
                      <div className="text-sm font-black text-purple-700 mt-1">{spkGra || "—"}</div>
                    )}
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-center">
                    <div className="text-[10px] font-bold text-zinc-500">Pronunciation (PR)</div>
                    {isEditing ? (
                      <input
                        type="text"
                        value={spkPr}
                        onChange={(e) => setSpkPr(e.target.value)}
                        placeholder="7.0"
                        className="w-full mt-1 text-center font-black text-xs text-zinc-900 bg-white border border-zinc-200 rounded py-1"
                      />
                    ) : (
                      <div className="text-sm font-black text-purple-700 mt-1">{spkPr || "—"}</div>
                    )}
                  </div>
                </div>
              </div>

              {!isEditing && (Number(spkFc) > 0 || Number(spkLr) > 0 || Number(spkGra) > 0 || Number(spkPr) > 0 || Number(scoreSpeaking) > 0) && (
                <SpeakingCriteriaPanel
                  scores={{
                    fluencyCoherence: Number(spkFc) || Number(scoreSpeaking) || 0,
                    lexicalResource: Number(spkLr) || Number(scoreSpeaking) || 0,
                    grammaticalRangeAccuracy: Number(spkGra) || Number(scoreSpeaking) || 0,
                    pronunciation: Number(spkPr) || Number(scoreSpeaking) || 0,
                  }}
                />
              )}
            </div>
          )}

          {/* TAB 2: WRITING (TÁCH BIỆT TASK 1 & TASK 2) */}
          {activeTab === "writing" && (
            <div className="space-y-5 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setWritingTaskMode("task1")}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      writingTaskMode === "task1"
                        ? "bg-amber-600 text-white shadow-xs"
                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                    }`}
                  >
                    Writing Task 1 (Band {task1Band.toFixed(1)})
                  </button>
                  <button
                    type="button"
                    onClick={() => setWritingTaskMode("task2")}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      writingTaskMode === "task2"
                        ? "bg-amber-600 text-white shadow-xs"
                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                    }`}
                  >
                    Writing Task 2 (Band {task2Band.toFixed(1)})
                  </button>
                </div>
                <div className="text-xs font-bold text-amber-800">
                  Overall Writing: <span className="font-black text-sm">{calculatedWritingOverall}</span>
                </div>
              </div>

              {/* Task 1 Section */}
              {writingTaskMode === "task1" && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/40">
                    <div className="text-[10px] font-black text-amber-800 uppercase tracking-widest">
                      Đặc trưng Writing Task 1 Band {task1Band.toFixed(1)}
                    </div>
                    <p className="text-xs font-medium text-zinc-700 leading-relaxed mt-1.5 whitespace-pre-line">
                      {getWritingTask1StandardDescription(task1Band)}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-center">
                      <div className="text-[10px] font-bold text-zinc-500">Task Achievement (TA)</div>
                      {isEditing ? (
                        <input
                          type="text"
                          value={wriTask1Ta}
                          onChange={(e) => setWriTask1Ta(e.target.value)}
                          placeholder="6.0"
                          className="w-full mt-1 text-center font-black text-xs text-zinc-900 bg-white border border-zinc-200 rounded py-1"
                        />
                      ) : (
                        <div className="text-sm font-black text-amber-700 mt-1">{wriTask1Ta || "—"}</div>
                      )}
                    </div>

                    <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-center">
                      <div className="text-[10px] font-bold text-zinc-500">Coherence & Cohesion</div>
                      {isEditing ? (
                        <input
                          type="text"
                          value={wriTask1Cc}
                          onChange={(e) => setWriTask1Cc(e.target.value)}
                          placeholder="6.5"
                          className="w-full mt-1 text-center font-black text-xs text-zinc-900 bg-white border border-zinc-200 rounded py-1"
                        />
                      ) : (
                        <div className="text-sm font-black text-amber-700 mt-1">{wriTask1Cc || "—"}</div>
                      )}
                    </div>

                    <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-center">
                      <div className="text-[10px] font-bold text-zinc-500">Lexical Resource (LR)</div>
                      {isEditing ? (
                        <input
                          type="text"
                          value={wriTask1Lr}
                          onChange={(e) => setWriTask1Lr(e.target.value)}
                          placeholder="6.0"
                          className="w-full mt-1 text-center font-black text-xs text-zinc-900 bg-white border border-zinc-200 rounded py-1"
                        />
                      ) : (
                        <div className="text-sm font-black text-amber-700 mt-1">{wriTask1Lr || "—"}</div>
                      )}
                    </div>

                    <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-center">
                      <div className="text-[10px] font-bold text-zinc-500">Grammar (GRA)</div>
                      {isEditing ? (
                        <input
                          type="text"
                          value={wriTask1Gra}
                          onChange={(e) => setWriTask1Gra(e.target.value)}
                          placeholder="6.0"
                          className="w-full mt-1 text-center font-black text-xs text-zinc-900 bg-white border border-zinc-200 rounded py-1"
                        />
                      ) : (
                        <div className="text-sm font-black text-amber-700 mt-1">{wriTask1Gra || "—"}</div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-1">Nhận xét chi tiết Task 1</label>
                    {isEditing ? (
                      <textarea
                        rows={3}
                        value={wriTask1Notes}
                        onChange={(e) => setWriTask1Notes(e.target.value)}
                        placeholder="Nhập nhận xét bài làm Task 1..."
                        className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 bg-zinc-50/50 outline-none focus:bg-white focus:border-primary"
                      />
                    ) : (
                      <p className="text-xs text-zinc-800 p-3 rounded-xl bg-zinc-50 border border-zinc-200 font-medium leading-relaxed">
                        {wriTask1Notes || "Chưa có nhận xét Task 1."}
                      </p>
                    )}
                  </div>

                  {!isEditing && (
                    <WritingTask1CriteriaPanel
                      scores={{
                        taskAchievement: Number(wriTask1Ta) || task1Band,
                        coherenceCohesion: Number(wriTask1Cc) || task1Band,
                        lexicalResource: Number(wriTask1Lr) || task1Band,
                        grammaticalRange: Number(wriTask1Gra) || task1Band,
                      }}
                    />
                  )}
                </div>
              )}

              {/* Task 2 Section */}
              {writingTaskMode === "task2" && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/40">
                    <div className="text-[10px] font-black text-amber-800 uppercase tracking-widest">
                      Đặc trưng Writing Task 2 Band {task2Band.toFixed(1)}
                    </div>
                    <p className="text-xs font-medium text-zinc-700 leading-relaxed mt-1.5 whitespace-pre-line">
                      {getWritingTask2StandardDescription(task2Band)}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-center">
                      <div className="text-[10px] font-bold text-zinc-500">Task Response (TR)</div>
                      {isEditing ? (
                        <input
                          type="text"
                          value={wriTask2Tr}
                          onChange={(e) => setWriTask2Tr(e.target.value)}
                          placeholder="6.0"
                          className="w-full mt-1 text-center font-black text-xs text-zinc-900 bg-white border border-zinc-200 rounded py-1"
                        />
                      ) : (
                        <div className="text-sm font-black text-amber-700 mt-1">{wriTask2Tr || "—"}</div>
                      )}
                    </div>

                    <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-center">
                      <div className="text-[10px] font-bold text-zinc-500">Coherence & Cohesion</div>
                      {isEditing ? (
                        <input
                          type="text"
                          value={wriTask2Cc}
                          onChange={(e) => setWriTask2Cc(e.target.value)}
                          placeholder="6.5"
                          className="w-full mt-1 text-center font-black text-xs text-zinc-900 bg-white border border-zinc-200 rounded py-1"
                        />
                      ) : (
                        <div className="text-sm font-black text-amber-700 mt-1">{wriTask2Cc || "—"}</div>
                      )}
                    </div>

                    <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-center">
                      <div className="text-[10px] font-bold text-zinc-500">Lexical Resource (LR)</div>
                      {isEditing ? (
                        <input
                          type="text"
                          value={wriTask2Lr}
                          onChange={(e) => setWriTask2Lr(e.target.value)}
                          placeholder="6.0"
                          className="w-full mt-1 text-center font-black text-xs text-zinc-900 bg-white border border-zinc-200 rounded py-1"
                        />
                      ) : (
                        <div className="text-sm font-black text-amber-700 mt-1">{wriTask2Lr || "—"}</div>
                      )}
                    </div>

                    <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-center">
                      <div className="text-[10px] font-bold text-zinc-500">Grammar (GRA)</div>
                      {isEditing ? (
                        <input
                          type="text"
                          value={wriTask2Gra}
                          onChange={(e) => setWriTask2Gra(e.target.value)}
                          placeholder="6.0"
                          className="w-full mt-1 text-center font-black text-xs text-zinc-900 bg-white border border-zinc-200 rounded py-1"
                        />
                      ) : (
                        <div className="text-sm font-black text-amber-700 mt-1">{wriTask2Gra || "—"}</div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-1">Nhận xét chi tiết Task 2</label>
                    {isEditing ? (
                      <textarea
                        rows={3}
                        value={wriTask2Notes}
                        onChange={(e) => setWriTask2Notes(e.target.value)}
                        placeholder="Nhập nhận xét bài làm Task 2..."
                        className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 bg-zinc-50/50 outline-none focus:bg-white focus:border-primary"
                      />
                    ) : (
                      <p className="text-xs text-zinc-800 p-3 rounded-xl bg-zinc-50 border border-zinc-200 font-medium leading-relaxed">
                        {wriTask2Notes || "Chưa có nhận xét Task 2."}
                      </p>
                    )}
                  </div>

                  {!isEditing && (
                    <WritingTask2CriteriaPanel
                      scores={{
                        taskResponse: Number(wriTask2Tr) || task2Band,
                        coherenceCohesion: Number(wriTask2Cc) || task2Band,
                        lexicalResource: Number(wriTask2Lr) || task2Band,
                        grammaticalRange: Number(wriTask2Gra) || task2Band,
                      }}
                    />
                  )}
                </div>
              )}

              {/* Writing Prescription & Formula */}
              <div className="pt-2 space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-amber-800 mb-1">Phác đồ cải thiện Writing</label>
                  {isEditing ? (
                    <textarea
                      rows={2}
                      value={wriPrescription}
                      onChange={(e) => setWriPrescription(e.target.value)}
                      placeholder="Nhập phác đồ cải thiện kỹ năng Writing..."
                      className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 bg-zinc-50/50 outline-none focus:bg-white focus:border-primary"
                    />
                  ) : (
                    <p className="text-xs text-zinc-700 p-2.5 rounded-xl bg-amber-50/50 border border-amber-200 font-medium">
                      {wriPrescription || "Chưa có phác đồ Writing."}
                    </p>
                  )}
                </div>

                <WritingScoreFormulaNote
                  task1Band={task1Band}
                  task2Band={task2Band}
                  writingOverall={calculatedWritingOverall}
                />
              </div>
            </div>
          )}

          {/* TAB 3: LISTENING (BẢNG DẠNG CÂU) */}
          {activeTab === "listening" && (
            <div className="space-y-5 animate-in fade-in">
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl border border-sky-200 bg-sky-50/50">
                <div>
                  <div className="text-[10px] font-black text-sky-800 uppercase tracking-wider">Listening Band & Số câu đúng</div>
                  <div className="text-base font-black text-sky-950 mt-1">
                    Band {scoreListening || "—"} • Đúng {lrListeningCorrect || "—"}
                  </div>
                </div>
                {isEditing && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-600">Số câu đúng:</span>
                    <input
                      type="text"
                      value={lrListeningCorrect}
                      onChange={(e) => setLrListeningCorrect(e.target.value)}
                      placeholder="30/40"
                      className="w-24 px-2.5 py-1 text-xs font-bold text-center border border-zinc-300 rounded-lg bg-white"
                    />
                  </div>
                )}
              </div>

              {/* Question types table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-zinc-800">
                    Bảng Chẩn Đoán Chi Tiết Dạng Bài Listening
                  </h4>
                </div>

                {isEditing ? (
                  <div className="space-y-2">
                    {bcbListening.map((row, idx) => (
                      <div key={row.id || idx} className="p-3 rounded-xl border border-zinc-200 bg-zinc-50/50 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <input
                            type="text"
                            value={row.title}
                            onChange={(e) => updateListeningRow(idx, { title: e.target.value })}
                            className="flex-1 text-xs font-bold bg-white border border-zinc-200 rounded px-2 py-1"
                          />
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-bold text-zinc-500">Đúng:</span>
                            <input
                              type="number"
                              min={0}
                              max={row.total || 40}
                              value={row.correct ?? 0}
                              onChange={(e) => updateListeningRow(idx, { correct: Number(e.target.value) || 0 })}
                              className="w-12 text-center text-xs font-bold bg-white border border-zinc-200 rounded px-1 py-1"
                            />
                            <span className="text-[10px] font-bold text-zinc-500">/ {row.total || 10}</span>
                          </div>
                        </div>
                        <input
                          type="text"
                          value={row.diagnosis || ""}
                          onChange={(e) => updateListeningRow(idx, { diagnosis: e.target.value })}
                          placeholder="Chẩn đoán / lưu ý cho dạng bài này..."
                          className="w-full text-xs bg-white border border-zinc-200 rounded px-2 py-1"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <BcbQuestionTypeTable rows={bcbListening} />
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-sky-800 mb-1">Điểm cần lưu ý khi làm bài Listening</label>
                {isEditing ? (
                  <textarea
                    rows={2}
                    value={lrListeningWeaknesses}
                    onChange={(e) => setLrListeningWeaknesses(e.target.value)}
                    placeholder="Nhập lưu ý kỹ năng Listening..."
                    className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 bg-zinc-50/50 outline-none focus:bg-white focus:border-primary"
                  />
                ) : (
                  <p className="text-xs text-zinc-700 p-2.5 rounded-xl bg-sky-50/40 border border-sky-100 font-medium">
                    {lrListeningWeaknesses || "Chưa có nhận xét điểm yếu Listening."}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: READING (BẢNG DẠNG CÂU) */}
          {activeTab === "reading" && (
            <div className="space-y-5 animate-in fade-in">
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl border border-emerald-200 bg-emerald-50/50">
                <div>
                  <div className="text-[10px] font-black text-emerald-800 uppercase tracking-wider">Reading Band & Số câu đúng</div>
                  <div className="text-base font-black text-emerald-950 mt-1">
                    Band {scoreReading || "—"} • Đúng {lrReadingCorrect || "—"}
                  </div>
                </div>
                {isEditing && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-600">Số câu đúng:</span>
                    <input
                      type="text"
                      value={lrReadingCorrect}
                      onChange={(e) => setLrReadingCorrect(e.target.value)}
                      placeholder="28/40"
                      className="w-24 px-2.5 py-1 text-xs font-bold text-center border border-zinc-300 rounded-lg bg-white"
                    />
                  </div>
                )}
              </div>

              {/* Question types table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-zinc-800">
                    Bảng Chẩn Đoán Chi Tiết Dạng Bài Reading
                  </h4>
                </div>

                {isEditing ? (
                  <div className="space-y-2">
                    {bcbReading.map((row, idx) => (
                      <div key={row.id || idx} className="p-3 rounded-xl border border-zinc-200 bg-zinc-50/50 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <input
                            type="text"
                            value={row.title}
                            onChange={(e) => updateReadingRow(idx, { title: e.target.value })}
                            className="flex-1 text-xs font-bold bg-white border border-zinc-200 rounded px-2 py-1"
                          />
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-bold text-zinc-500">Đúng:</span>
                            <input
                              type="number"
                              min={0}
                              max={row.total || 40}
                              value={row.correct ?? 0}
                              onChange={(e) => updateReadingRow(idx, { correct: Number(e.target.value) || 0 })}
                              className="w-12 text-center text-xs font-bold bg-white border border-zinc-200 rounded px-1 py-1"
                            />
                            <span className="text-[10px] font-bold text-zinc-500">/ {row.total || 10}</span>
                          </div>
                        </div>
                        <input
                          type="text"
                          value={row.diagnosis || ""}
                          onChange={(e) => updateReadingRow(idx, { diagnosis: e.target.value })}
                          placeholder="Chẩn đoán / lưu ý cho dạng bài này..."
                          className="w-full text-xs bg-white border border-zinc-200 rounded px-2 py-1"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <BcbQuestionTypeTable rows={bcbReading} />
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-emerald-800 mb-1">Điểm cần lưu ý khi làm bài Reading</label>
                {isEditing ? (
                  <textarea
                    rows={2}
                    value={lrReadingWeaknesses}
                    onChange={(e) => setLrReadingWeaknesses(e.target.value)}
                    placeholder="Nhập lưu ý kỹ năng Reading..."
                    className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 bg-zinc-50/50 outline-none focus:bg-white focus:border-primary"
                  />
                ) : (
                  <p className="text-xs text-zinc-700 p-2.5 rounded-xl bg-emerald-50/40 border border-emerald-100 font-medium">
                    {lrReadingWeaknesses || "Chưa có nhận xét điểm yếu Reading."}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: TỔNG QUAN & KÊ ĐƠN */}
          {activeTab === "overview" && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center gap-3 p-4 rounded-2xl border border-zinc-200 bg-zinc-50">
                <input
                  type="checkbox"
                  id="chk-target-achieved"
                  checked={targetAchieved}
                  disabled={!isEditing}
                  onChange={(e) => setTargetAchieved(e.target.checked)}
                  className="h-4 w-4 rounded text-primary focus:ring-primary"
                />
                <label htmlFor="chk-target-achieved" className="text-xs font-bold text-zinc-900 cursor-pointer">
                  Đánh dấu học viên đã ĐẠT CHUẨN ĐẦU RA (Target Achieved)
                </label>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-700 mb-1">Tiêu đề đánh giá chung</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={overviewTitle}
                    onChange={(e) => setOverviewTitle(e.target.value)}
                    placeholder="e.g. Đạt Chuẩn Đầu Ra Khóa Học Master 6.5+"
                    className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 bg-zinc-50/50 outline-none focus:bg-white focus:border-primary"
                  />
                ) : (
                  <p className="text-xs text-zinc-800 p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 font-bold">
                    {overviewTitle || (targetAchieved ? "Đạt Chuẩn Đầu Ra Khóa Học" : "Cần Bổ Trợ Kỹ Năng")}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-700 mb-1">Nội dung tóm tắt đánh giá chung</label>
                {isEditing ? (
                  <textarea
                    rows={3}
                    value={overviewSummary}
                    onChange={(e) => setOverviewSummary(e.target.value)}
                    placeholder="Nhập nhận xét tổng quan 4 kỹ năng..."
                    className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 bg-zinc-50/50 outline-none focus:bg-white focus:border-primary"
                  />
                ) : (
                  <p className="text-xs text-zinc-700 p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 font-medium leading-relaxed">
                    {overviewSummary || "Học viên hoàn thành bài thi Final Test 4 kỹ năng."}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-primary mb-1">Kê đơn & Lời khuyên phác đồ học tập</label>
                {isEditing ? (
                  <textarea
                    rows={3}
                    value={generalPrescription}
                    onChange={(e) => setGeneralPrescription(e.target.value)}
                    placeholder="Nhập phác đồ, lộ trình học tập tiếp theo..."
                    className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 bg-zinc-50/50 outline-none focus:bg-white focus:border-primary"
                  />
                ) : (
                  <p className="text-xs text-zinc-700 p-2.5 rounded-xl bg-primary/5 border border-primary/20 font-medium leading-relaxed">
                    {generalPrescription || "Chưa có lời khuyên phác đồ."}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-700 mb-1">Khóa học / Lộ trình nâng cao đề xuất tiếp theo</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={nextCourse}
                    onChange={(e) => setNextCourse(e.target.value)}
                    placeholder="e.g. IELTS Advanced Master 7.5+"
                    className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 bg-zinc-50/50 outline-none focus:bg-white focus:border-primary"
                  />
                ) : (
                  <p className="text-xs text-primary p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 font-extrabold">
                    {nextCourse || "Chưa có đề xuất khóa học tiếp theo."}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
