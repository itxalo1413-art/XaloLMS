"use client";

import React, { useState } from "react";
import {
  type FinalTestRecord,
  type FinalTestBcbData,
  updateFinalTestRecord,
} from "@/lib/finalTestArchive";

interface FinalTestBcbDrawerProps {
  record: FinalTestRecord;
  onClose: () => void;
  onSaved: () => void;
}

export function FinalTestBcbDrawer({ record, onClose, onSaved }: FinalTestBcbDrawerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // Scores
  const [scoreOverall, setScoreOverall] = useState(record.scoreOverall || "");
  const [scoreListening, setScoreListening] = useState(record.scoreListening || "");
  const [scoreReading, setScoreReading] = useState(record.scoreReading || "");
  const [scoreWriting, setScoreWriting] = useState(record.scoreWriting || "");
  const [scoreSpeaking, setScoreSpeaking] = useState(record.scoreSpeaking || "");

  // Speaking BCB
  const [spkFc, setSpkFc] = useState(record.bcbData?.speaking?.fc || "6.5");
  const [spkLr, setSpkLr] = useState(record.bcbData?.speaking?.lr || "6.5");
  const [spkGra, setSpkGra] = useState(record.bcbData?.speaking?.gra || "6.0");
  const [spkPr, setSpkPr] = useState(record.bcbData?.speaking?.pr || "7.0");
  const [spkStrengths, setSpkStrengths] = useState(
    record.bcbData?.speaking?.strengths || "Phản xạ nhanh, phát âm chuẩn có ngữ điệu tự nhiên, từ vựng phong phú ở Part 1 & 2."
  );
  const [spkWeaknesses, setSpkWeaknesses] = useState(
    record.bcbData?.speaking?.weaknesses || "Còn ngập ngừng nhẹ ở Part 3 khi gặp chủ đề trừu tượng; đôi chỗ thiếu cấu trúc câu phức đảo ngữ."
  );
  const [spkPrescription, setSpkPrescription] = useState(
    record.bcbData?.speaking?.prescription || "Luyện 15 đề dự đoán Part 3 theo phương pháp PEEL; duy trì shadow accent 20p mỗi ngày."
  );

  // Writing BCB
  const [wriTa, setWriTa] = useState(record.bcbData?.writing?.ta || "6.0");
  const [wriCc, setWriCc] = useState(record.bcbData?.writing?.cc || "6.5");
  const [wriLr, setWriLr] = useState(record.bcbData?.writing?.lr || "6.0");
  const [wriGra, setWriGra] = useState(record.bcbData?.writing?.gra || "6.0");
  const [wriTask1Notes, setWriTask1Notes] = useState(
    record.bcbData?.writing?.task1Notes || "Task 1 miêu tả xu hướng biểu đồ đường rõ ràng, có so sánh số liệu then chốt."
  );
  const [wriTask2Notes, setWriTask2Notes] = useState(
    record.bcbData?.writing?.task2Notes || "Task 2 lập luận có tính thuyết phục nhưng phần giải pháp chưa đào sâu nguyên nhân gốc."
  );
  const [wriPrescription, setWriPrescription] = useState(
    record.bcbData?.writing?.prescription || "Ôn tập collocations học thuật chủ đề Environment & Technology; viết 3 bài full timed trong tuần."
  );

  // L-R BCB
  const [lrListeningCorrect, setLrListeningCorrect] = useState(record.bcbData?.lr?.listeningCorrect || "30/40");
  const [lrReadingCorrect, setLrReadingCorrect] = useState(record.bcbData?.lr?.readingCorrect || "27/40");
  const [lrListeningWeaknesses, setLrListeningWeaknesses] = useState(
    record.bcbData?.lr?.listeningWeaknesses || "Dễ mất tập trung ở Section 3 (hội thoại đa nhân vật)."
  );
  const [lrReadingWeaknesses, setLrReadingWeaknesses] = useState(
    record.bcbData?.lr?.readingWeaknesses || "Mất nhiều thời gian ở dạng bài Matching Headings Passage 3."
  );

  // General Prescription
  const [generalPrescription, setGeneralPrescription] = useState(
    record.bcbData?.generalPrescription || "Đạt chuẩn đầu ra khóa học! Đủ điều kiện đăng ký thi thật hoặc tham gia khóa nâng cao tiếp theo."
  );
  const [nextCourse, setNextCourse] = useState(
    record.bcbData?.nextCourseRecommendation || "IELTS Advanced Master 7.5+"
  );
  const [targetAchieved, setTargetAchieved] = useState(
    record.bcbData?.targetAchieved ?? true
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      const bcbData: FinalTestBcbData = {
        speaking: {
          fc: spkFc,
          lr: spkLr,
          gra: spkGra,
          pr: spkPr,
          strengths: spkStrengths,
          weaknesses: spkWeaknesses,
          prescription: spkPrescription,
        },
        writing: {
          ta: wriTa,
          cc: wriCc,
          lr: wriLr,
          gra: wriGra,
          task1Notes: wriTask1Notes,
          task2Notes: wriTask2Notes,
          prescription: wriPrescription,
        },
        lr: {
          listeningCorrect: lrListeningCorrect,
          readingCorrect: lrReadingCorrect,
          listeningWeaknesses: lrListeningWeaknesses,
          readingWeaknesses: lrReadingWeaknesses,
        },
        generalPrescription,
        nextCourseRecommendation: nextCourse,
        targetAchieved,
      };

      await updateFinalTestRecord(record.id, {
        scoreOverall: scoreOverall.trim() || undefined,
        scoreListening: scoreListening.trim() || undefined,
        scoreReading: scoreReading.trim() || undefined,
        scoreWriting: scoreWriting.trim() || undefined,
        scoreSpeaking: scoreSpeaking.trim() || undefined,
        status: (scoreOverall || scoreSpeaking || scoreWriting) ? "graded" : record.status,
        bcbData,
      });

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
BẢNG CHẨN BỆNH (BCB) FINAL TEST - XALO IELTS
--------------------------------------------
Học viên: ${record.candidateName}
SĐT: ${record.candidatePhone}
Lớp: ${record.className || record.classCode || "Lớp học viên"}
Mục tiêu: ${record.targetBand || "6.5"} IELTS
Giám khảo chấm: ${record.examinerName}
Ngày thi: ${record.date} lúc ${record.time}

KẾT QUẢ ĐIỂM SỐ:
• OVERALL BAND: ${scoreOverall || "—"}
• Listening: ${scoreListening || "—"} | Reading: ${scoreReading || "—"}
• Writing: ${scoreWriting || "—"} | Speaking: ${scoreSpeaking || "—"}
• Đạt chuẩn đầu ra: ${targetAchieved ? "ĐẠT" : "CẦN BỔ TRỢ"}

PHÂN TÍCH KỸ NĂNG SPEAKING:
- Tiêu chí: FC ${spkFc} | LR ${spkLr} | GRA ${spkGra} | PR ${spkPr}
- Điểm mạnh: ${spkStrengths}
- Điểm yếu: ${spkWeaknesses}
- Kê đơn Speaking: ${spkPrescription}

PHÂN TÍCH KỸ NĂNG WRITING:
- Tiêu chí: TA ${wriTa} | CC ${wriCc} | LR ${wriLr} | GRA ${wriGra}
- Task 1: ${wriTask1Notes}
- Task 2: ${wriTask2Notes}
- Kê đơn Writing: ${wriPrescription}

KỸ NĂNG LISTENING & READING:
- Listening: Đúng ${lrListeningCorrect} - Điểm yếu: ${lrListeningWeaknesses}
- Reading: Đúng ${lrReadingCorrect} - Điểm yếu: ${lrReadingWeaknesses}

KÊ ĐƠN & LỘ TRÌNH TIẾP THEO:
${generalPrescription}
Khóa học đề xuất tiếp theo: ${nextCourse}
--------------------------------------------
    `.trim();

    void navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-end">
      <button
        type="button"
        aria-label="Đóng"
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-md transition-all"
      />
      <div className="relative w-full max-w-2xl h-full bg-white shadow-2xl flex flex-col border-l border-zinc-200 z-10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/80">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-zinc-900">Bảng Chẩn Bệnh (BCB) Final Test</h2>
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
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
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
                <div className="text-base font-black text-primary">{record.targetBand || "6.5"}</div>
              </div>
              <div className="text-center px-4 py-2 rounded-xl bg-primary text-white shadow-sm">
                <div className="text-[9px] font-black uppercase tracking-wider text-white/80">OVERALL</div>
                <div className="text-lg font-black">{scoreOverall || "—"}</div>
              </div>
            </div>
          </div>

          {/* 4 Skills Score Input / Display */}
          <div className="space-y-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-500">Điểm số 4 Kỹ Năng</h3>
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
                  <div className="text-base font-black text-zinc-900 mt-1">{scoreWriting || "—"}</div>
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

          {/* Speaking BCB Section */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900">
                Bảng Chẩn Bệnh Chi Tiết: Speaking
              </h4>
              <span className="text-xs font-bold text-primary">Band {scoreSpeaking || "6.5"}</span>
            </div>

            {/* Speaking 4 Rubric Criteria */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200/80 text-center">
                <div className="text-[10px] font-bold text-zinc-500">Fluency & Coherence</div>
                {isEditing ? (
                  <input
                    type="text"
                    value={spkFc}
                    onChange={(e) => setSpkFc(e.target.value)}
                    className="w-full mt-1 text-center font-black text-xs text-zinc-900 bg-white border border-zinc-200 rounded py-0.5"
                  />
                ) : (
                  <div className="text-xs font-black text-zinc-900 mt-1">{spkFc}</div>
                )}
              </div>

              <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200/80 text-center">
                <div className="text-[10px] font-bold text-zinc-500">Lexical Resource</div>
                {isEditing ? (
                  <input
                    type="text"
                    value={spkLr}
                    onChange={(e) => setSpkLr(e.target.value)}
                    className="w-full mt-1 text-center font-black text-xs text-zinc-900 bg-white border border-zinc-200 rounded py-0.5"
                  />
                ) : (
                  <div className="text-xs font-black text-zinc-900 mt-1">{spkLr}</div>
                )}
              </div>

              <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200/80 text-center">
                <div className="text-[10px] font-bold text-zinc-500">Grammar (GRA)</div>
                {isEditing ? (
                  <input
                    type="text"
                    value={spkGra}
                    onChange={(e) => setSpkGra(e.target.value)}
                    className="w-full mt-1 text-center font-black text-xs text-zinc-900 bg-white border border-zinc-200 rounded py-0.5"
                  />
                ) : (
                  <div className="text-xs font-black text-zinc-900 mt-1">{spkGra}</div>
                )}
              </div>

              <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200/80 text-center">
                <div className="text-[10px] font-bold text-zinc-500">Pronunciation (PR)</div>
                {isEditing ? (
                  <input
                    type="text"
                    value={spkPr}
                    onChange={(e) => setSpkPr(e.target.value)}
                    className="w-full mt-1 text-center font-black text-xs text-zinc-900 bg-white border border-zinc-200 rounded py-0.5"
                  />
                ) : (
                  <div className="text-xs font-black text-zinc-900 mt-1">{spkPr}</div>
                )}
              </div>
            </div>

            {/* Strengths & Weaknesses */}
            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-emerald-700 mb-1">Điểm mạnh Speaking</label>
                {isEditing ? (
                  <textarea
                    rows={2}
                    value={spkStrengths}
                    onChange={(e) => setSpkStrengths(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 bg-zinc-50/50 outline-none focus:bg-white focus:border-primary"
                  />
                ) : (
                  <p className="text-xs text-zinc-700 p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-100 font-medium">
                    {spkStrengths}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-amber-700 mb-1">Điểm yếu cần khắc phục</label>
                {isEditing ? (
                  <textarea
                    rows={2}
                    value={spkWeaknesses}
                    onChange={(e) => setSpkWeaknesses(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 bg-zinc-50/50 outline-none focus:bg-white focus:border-primary"
                  />
                ) : (
                  <p className="text-xs text-zinc-700 p-2.5 rounded-xl bg-amber-50/50 border border-amber-100 font-medium">
                    {spkWeaknesses}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-primary mb-1">Kê đơn Speaking</label>
                {isEditing ? (
                  <textarea
                    rows={2}
                    value={spkPrescription}
                    onChange={(e) => setSpkPrescription(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 bg-zinc-50/50 outline-none focus:bg-white focus:border-primary"
                  />
                ) : (
                  <p className="text-xs text-primary font-bold p-2.5 rounded-xl bg-primary/5 border border-primary/20">
                    {spkPrescription}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Writing BCB Section */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900">
                Bảng Chẩn Bệnh Chi Tiết: Writing
              </h4>
              <span className="text-xs font-bold text-sky-600">Band {scoreWriting || "6.0"}</span>
            </div>

            {/* Writing 4 Rubric Criteria */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200/80 text-center">
                <div className="text-[10px] font-bold text-zinc-500">Task Achievement</div>
                {isEditing ? (
                  <input
                    type="text"
                    value={wriTa}
                    onChange={(e) => setWriTa(e.target.value)}
                    className="w-full mt-1 text-center font-black text-xs text-zinc-900 bg-white border border-zinc-200 rounded py-0.5"
                  />
                ) : (
                  <div className="text-xs font-black text-zinc-900 mt-1">{wriTa}</div>
                )}
              </div>

              <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200/80 text-center">
                <div className="text-[10px] font-bold text-zinc-500">Coherence & Cohesion</div>
                {isEditing ? (
                  <input
                    type="text"
                    value={wriCc}
                    onChange={(e) => setWriCc(e.target.value)}
                    className="w-full mt-1 text-center font-black text-xs text-zinc-900 bg-white border border-zinc-200 rounded py-0.5"
                  />
                ) : (
                  <div className="text-xs font-black text-zinc-900 mt-1">{wriCc}</div>
                )}
              </div>

              <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200/80 text-center">
                <div className="text-[10px] font-bold text-zinc-500">Lexical Resource</div>
                {isEditing ? (
                  <input
                    type="text"
                    value={wriLr}
                    onChange={(e) => setWriLr(e.target.value)}
                    className="w-full mt-1 text-center font-black text-xs text-zinc-900 bg-white border border-zinc-200 rounded py-0.5"
                  />
                ) : (
                  <div className="text-xs font-black text-zinc-900 mt-1">{wriLr}</div>
                )}
              </div>

              <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200/80 text-center">
                <div className="text-[10px] font-bold text-zinc-500">Grammar (GRA)</div>
                {isEditing ? (
                  <input
                    type="text"
                    value={wriGra}
                    onChange={(e) => setWriGra(e.target.value)}
                    className="w-full mt-1 text-center font-black text-xs text-zinc-900 bg-white border border-zinc-200 rounded py-0.5"
                  />
                ) : (
                  <div className="text-xs font-black text-zinc-900 mt-1">{wriGra}</div>
                )}
              </div>
            </div>

            {/* Task 1 & Task 2 breakdown */}
            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-zinc-600 mb-1">Nhận xét Task 1</label>
                {isEditing ? (
                  <textarea
                    rows={2}
                    value={wriTask1Notes}
                    onChange={(e) => setWriTask1Notes(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 bg-zinc-50/50 outline-none focus:bg-white focus:border-primary"
                  />
                ) : (
                  <p className="text-xs text-zinc-700 p-2.5 rounded-xl bg-zinc-50 border border-zinc-200/80 font-medium">
                    {wriTask1Notes}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-600 mb-1">Nhận xét Task 2</label>
                {isEditing ? (
                  <textarea
                    rows={2}
                    value={wriTask2Notes}
                    onChange={(e) => setWriTask2Notes(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 bg-zinc-50/50 outline-none focus:bg-white focus:border-primary"
                  />
                ) : (
                  <p className="text-xs text-zinc-700 p-2.5 rounded-xl bg-zinc-50 border border-zinc-200/80 font-medium">
                    {wriTask2Notes}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-sky-700 mb-1">Kê đơn Writing</label>
                {isEditing ? (
                  <textarea
                    rows={2}
                    value={wriPrescription}
                    onChange={(e) => setWriPrescription(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 bg-zinc-50/50 outline-none focus:bg-white focus:border-primary"
                  />
                ) : (
                  <p className="text-xs text-sky-800 font-bold p-2.5 rounded-xl bg-sky-50 border border-sky-200">
                    {wriPrescription}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Listening & Reading BCB */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900">
                Listening & Reading Diagnosis
              </h4>
              <span className="text-xs font-bold text-emerald-600">
                L: {scoreListening || "7.0"} • R: {scoreReading || "6.5"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-800">Listening ({lrListeningCorrect})</span>
                </div>
                {isEditing ? (
                  <textarea
                    rows={2}
                    value={lrListeningWeaknesses}
                    onChange={(e) => setLrListeningWeaknesses(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-zinc-200 bg-white"
                  />
                ) : (
                  <p className="text-xs text-zinc-600 font-medium">{lrListeningWeaknesses}</p>
                )}
              </div>

              <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-800">Reading ({lrReadingCorrect})</span>
                </div>
                {isEditing ? (
                  <textarea
                    rows={2}
                    value={lrReadingWeaknesses}
                    onChange={(e) => setLrReadingWeaknesses(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-zinc-200 bg-white"
                  />
                ) : (
                  <p className="text-xs text-zinc-600 font-medium">{lrReadingWeaknesses}</p>
                )}
              </div>
            </div>
          </div>

          {/* General Prescription & Next Course recommendation */}
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-primary">
                Tổng Kết & Kê Đơn Lộ Trình Tiếp Theo
              </h4>
              <label className="flex items-center gap-2 text-xs font-bold text-zinc-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={targetAchieved}
                  disabled={!isEditing}
                  onChange={(e) => setTargetAchieved(e.target.checked)}
                  className="rounded text-primary focus:ring-primary"
                />
                Đạt chuẩn đầu ra khóa
              </label>
            </div>

            <div>
              {isEditing ? (
                <textarea
                  rows={3}
                  value={generalPrescription}
                  onChange={(e) => setGeneralPrescription(e.target.value)}
                  placeholder="Kê đơn tổng quát cho học viên..."
                  className="w-full text-xs p-3 rounded-xl border border-primary/20 bg-white outline-none focus:ring-2 focus:ring-primary/20"
                />
              ) : (
                <p className="text-xs text-zinc-800 font-medium bg-white p-3 rounded-xl border border-primary/20">
                  {generalPrescription}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-primary/20">
              <span className="text-xs font-bold text-zinc-700">Khóa học đề xuất tiếp theo:</span>
              {isEditing ? (
                <input
                  type="text"
                  value={nextCourse}
                  onChange={(e) => setNextCourse(e.target.value)}
                  placeholder="VD: IELTS Master 7.5+"
                  className="text-xs font-black text-primary px-3 py-1.5 rounded-lg border border-primary/30 bg-white outline-none"
                />
              ) : (
                <span className="text-xs font-black text-primary bg-white px-3 py-1.5 rounded-lg border border-primary/20 shadow-xs">
                  {nextCourse}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-zinc-100 bg-zinc-50/80 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-xs font-bold text-zinc-600 hover:bg-zinc-100 transition-colors shadow-xs"
          >
            Đóng
          </button>
          {isEditing && (
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="rounded-xl bg-primary hover:bg-[#6a5acd] px-6 py-2.5 text-xs font-black text-white transition-all shadow-md hover:shadow-primary/25 disabled:opacity-50"
            >
              {saving ? "Đang lưu BCB..." : "Lưu Bảng Chẩn Bệnh"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
