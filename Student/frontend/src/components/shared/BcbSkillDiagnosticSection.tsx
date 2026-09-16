"use client";

import React, { useMemo } from "react";
import type { BcbQuestionTypeRow } from "@/lib/guestBcbDiagnosis";

export interface DiagnosticOption {
  tag: string;
  text: string;
}

export interface SkillPresetConfig {
  id: string;
  title: string;
  defaultTotal: number;
  options: DiagnosticOption[];
}

export const LISTENING_STANDARD_CONFIG: SkillPresetConfig[] = [
  {
    id: "dl-ac",
    title: "Form, Note, Flow-chart, Table, Summary, Sentence Completion",
    defaultTotal: 24,
    options: [
      {
        tag: "DL_AC_00_001",
        text: "Sai nhiều câu thuộc dạng bài Form, Note, Flow-chart, Table, Summary Completion.",
      },
      {
        tag: "DL_AC_00_002",
        text: "Chưa quen đọc thông tin trong bảng (Table) hoặc lưu đồ (Flow Chart), dẫn đến việc lúng túng hoặc điền sai câu trả lời.",
      },
      {
        tag: "DL_AC_00_003",
        text: "Chưa chú ý giới hạn số từ (Word limit) cho phép hoặc sai chính tả từ vựng học thuật.",
      },
    ],
  },
  {
    id: "dl-ls",
    title: "List Selection",
    defaultTotal: 6,
    options: [
      {
        tag: "DL_LS_00_001",
        text: "Sai nhiều câu thuộc dạng bài List Selection.",
      },
      {
        tag: "DL_LS_00_002",
        text: "Sai dây chuyền do không làm từng câu hỏi mà chỉ áp dụng phương pháp loại trừ đáp án.",
      },
    ],
  },
  {
    id: "dl-ad",
    title: "Plan, Map, Diagram Labelling",
    defaultTotal: 0,
    options: [
      {
        tag: "DL_AD_00_001",
        text: "Sai nhiều câu thuộc dạng bài Plan, Map, Diagram Labelling.",
      },
      {
        tag: "DL_AD_00_002",
        text: "Chưa hiểu được mối liên kết giữa ngôn ngữ và dữ kiện hình ảnh (bài nói mô tả một bản đồ của địa danh, etc.).",
      },
      {
        tag: "DL_AD_00_003",
        text: "Chưa hiểu được hoặc theo kịp ngôn ngữ chỉ phương hướng (đi thẳng, rẽ trái, ở phía đối diện, etc.). Thiếu từ vựng chỉ phương hướng hoặc chưa sử dụng thành thạo.",
      },
    ],
  },
  {
    id: "dl-mc",
    title: "Multiple Choice",
    defaultTotal: 6,
    options: [
      {
        tag: "DL_MC_00_001",
        text: "Sai nhiều câu thuộc dạng bài Multiple Choice.",
      },
      {
        tag: "DL_MC_00_002",
        text: "Dễ bị bẫy bởi phương án gây nhiễu (distractors) do nghe bắt từ đơn lẻ thay vì nghe hiểu toàn bộ ý nghĩa.",
      },
    ],
  },
  {
    id: "dl-am",
    title: "Matching",
    defaultTotal: 4,
    options: [
      {
        tag: "DL_AM_00_001",
        text: "Sai nhiều câu thuộc dạng bài Matching.",
      },
      {
        tag: "DL_AM_00_002",
        text: "Sai dây chuyền do không làm từng câu hỏi mà chỉ áp dụng phương pháp loại trừ đáp án.",
      },
    ],
  },
  {
    id: "dl-sq",
    title: "Short-answer questions",
    defaultTotal: 0,
    options: [
      {
        tag: "DL_SQ_00_001",
        text: "Sai nhiều câu thuộc dạng bài Short-answer questions.",
      },
      {
        tag: "DL_SQ_00_002",
        text: "Hiểu sai hoặc chưa hiểu câu hỏi do không quen với ngữ pháp câu hỏi (Câu hỏi bắt đầu bằng Wh-, How, Auxiliary Verb, etc.)",
      },
    ],
  },
];

export const READING_STANDARD_CONFIG: SkillPresetConfig[] = [
  {
    id: "dr-mf",
    title: "Matching Features",
    defaultTotal: 5,
    options: [
      {
        tag: "DR_MF_00_001",
        text: "Sai nhiều câu thuộc dạng bài Matching Features.",
      },
      {
        tag: "DR_MF_00_002",
        text: "Không tìm được dữ kiện trả lời; bỏ lỡ tên riêng hoặc không nhận biết đại từ thay thế.",
      },
    ],
  },
  {
    id: "dr-mh",
    title: "Matching Headings",
    defaultTotal: 6,
    options: [
      {
        tag: "DR_MH_00_001",
        text: "Sai nhiều câu thuộc dạng bài Matching Headings.",
      },
      {
        tag: "DR_MH_00_002",
        text: "Không tóm tắt được ý chính toàn đoạn; dễ bị đánh lừa bởi từ khóa lặp ở câu đầu trong khi chủ đề nằm ở giữa.",
      },
    ],
  },
  {
    id: "dr-mi",
    title: "Matching (Paragraph) Information",
    defaultTotal: 0,
    options: [
      {
        tag: "DR_MI_00_001",
        text: "Sai nhiều câu thuộc dạng bài Matching Information.",
      },
      {
        tag: "DR_MI_00_002",
        text: "Chưa nắm được kỹ năng định vị thông tin chi tiết (Locating details) trong bài đọc dài.",
      },
    ],
  },
  {
    id: "dr-ac",
    title: "Summary, Note, Table, Flow Chart, Sentence Completion",
    defaultTotal: 11,
    options: [
      {
        tag: "DR_AC_00_001",
        text: "Sai nhiều câu thuộc dạng bài Summary, Note, Table, Flow Chart, Sentence Completion.",
      },
      {
        tag: "DR_AC_00_002",
        text: "Chưa quen việc xác định loại từ cần điền (danh từ, động từ, tính từ) hoặc viết sai chính tả từ vựng.",
      },
    ],
  },
  {
    id: "dr-dl",
    title: "Diagram Label Completion",
    defaultTotal: 0,
    options: [
      {
        tag: "DR_DL_00_001",
        text: "Sai nhiều câu thuộc dạng bài Diagram Label Completion.",
      },
      {
        tag: "DR_DL_00_002",
        text: "Chưa hiểu được quy trình và các bước liên kết trong biểu đồ kỹ thuật / quy trình.",
      },
    ],
  },
  {
    id: "dr-tf",
    title: "True / False / Not Given, Yes / No / Not Given",
    defaultTotal: 11,
    options: [
      {
        tag: "DR_TF_00_001",
        text: "Sai nhiều câu thuộc dạng bài True / False / Not Given, Yes / No / Not Given.",
      },
      {
        tag: "DR_TF_00_002",
        text: "Chưa phân biệt rõ ràng giữa False/No (thông tin trái ngược) và Not Given (không đề cập trong bài), có xu hướng suy diễn thêm.",
      },
    ],
  },
  {
    id: "dr-mc",
    title: "Multiple Choice, List Selection, Global Multiple Choice",
    defaultTotal: 7,
    options: [
      {
        tag: "DR_MC_00_001",
        text: "Sai nhiều câu thuộc dạng bài Multiple Choice, List Selection, Global Multiple Choice.",
      },
      {
        tag: "DR_MC_00_002",
        text: "Định vị đoạn tốt nhưng còn mắc bẫy paraphrase và các từ hạn định (always, never, only...) trong phương án gây nhiễu.",
      },
    ],
  },
  {
    id: "dr-sq",
    title: "Short-answer questions",
    defaultTotal: 0,
    options: [
      {
        tag: "DR_SQ_00_001",
        text: "Sai nhiều câu thuộc dạng bài Short-answer questions.",
      },
      {
        tag: "DR_SQ_00_002",
        text: "Chưa đọc kỹ giới hạn từ cho phép (No more than X words) dẫn đến thừa từ hoặc mất điểm đáng tiếc.",
      },
    ],
  },
];

export function calculateListeningBand(correct: number): number {
  if (correct >= 39) return 9.0;
  if (correct >= 37) return 8.5;
  if (correct >= 35) return 8.0;
  if (correct >= 32) return 7.5;
  if (correct >= 30) return 7.0;
  if (correct >= 26) return 6.5;
  if (correct >= 23) return 6.0;
  if (correct >= 18) return 5.5;
  if (correct >= 16) return 5.0;
  if (correct >= 13) return 4.5;
  if (correct >= 10) return 4.0;
  if (correct >= 6) return 3.5;
  if (correct >= 4) return 3.0;
  if (correct >= 2) return 2.5;
  return correct > 0 ? 2.0 : 0.0;
}

export function calculateReadingBand(correct: number): number {
  if (correct >= 39) return 9.0;
  if (correct >= 37) return 8.5;
  if (correct >= 35) return 8.0;
  if (correct >= 33) return 7.5;
  if (correct >= 30) return 7.0;
  if (correct >= 27) return 6.5;
  if (correct >= 23) return 6.0;
  if (correct >= 19) return 5.5;
  if (correct >= 15) return 5.0;
  if (correct >= 13) return 4.5;
  if (correct >= 10) return 4.0;
  if (correct >= 6) return 3.5;
  if (correct >= 4) return 3.0;
  if (correct >= 2) return 2.5;
  return correct > 0 ? 2.0 : 0.0;
}

interface BcbSkillDiagnosticSectionProps {
  skill: "listening" | "reading";
  bandScore: number;
  onBandScoreChange: (score: number) => void;
  summaryText: string;
  onSummaryTextChange: (text: string) => void;
  rows: BcbQuestionTypeRow[];
  onRowsChange: (rows: BcbQuestionTypeRow[]) => void;
}

export function BcbSkillDiagnosticSection({
  skill,
  bandScore,
  onBandScoreChange,
  summaryText,
  onSummaryTextChange,
  rows,
  onRowsChange,
}: BcbSkillDiagnosticSectionProps) {
  const isListening = skill === "listening";
  const skillLabel = isListening ? "Listening" : "Reading";
  const config = isListening ? LISTENING_STANDARD_CONFIG : READING_STANDARD_CONFIG;

  // Ensure all standard question types from config are present with canonical id
  const mergedRows = useMemo(() => {
    return config.map((cfg) => {
      const existing = (rows || []).find(
        (r) =>
          r.id === cfg.id ||
          (r.id && r.id.endsWith(cfg.id)) ||
          (r.id && cfg.id.endsWith(r.id)) ||
          r.title.toLowerCase().trim() === cfg.title.toLowerCase().trim()
      );
      if (existing) {
        return {
          ...existing,
          id: cfg.id,
          title: cfg.title,
          total: typeof existing.total === "number" ? existing.total : cfg.defaultTotal,
          correct: typeof existing.correct === "number" ? existing.correct : 0,
          errorRate: typeof existing.errorRate === "number" ? existing.errorRate : 0,
          diagnosis: existing.diagnosis || "",
          tag: existing.tag || cfg.options[0]?.tag,
        };
      }
      return {
        id: cfg.id,
        title: cfg.title,
        correct: 0,
        total: cfg.defaultTotal,
        errorRate: 0,
        diagnosis: "",
        tag: cfg.options[0]?.tag,
      };
    });
  }, [config, rows]);

  // Total correct questions across all question types
  const totalCorrect = useMemo(() => {
    return mergedRows.reduce((sum, r) => sum + (r.correct ?? 0), 0);
  }, [mergedRows]);

  // Update a specific row
  const updateRow = (rowId: string, patch: Partial<BcbQuestionTypeRow>) => {
    const nextRows = mergedRows.map((r) => {
      if (
        r.id === rowId ||
        (r.id && r.id.endsWith(rowId)) ||
        (rowId && rowId.endsWith(r.id)) ||
        r.title.toLowerCase().trim() === rowId.toLowerCase().trim()
      ) {
        const updated = { ...r, ...patch, id: r.id };
        const total = typeof updated.total === "number" ? updated.total : 0;
        const correct = typeof updated.correct === "number" ? updated.correct : 0;
        if (total > 0) {
          updated.errorRate = Math.round(((total - Math.min(correct, total)) / total) * 100);
        } else {
          updated.errorRate = 0;
        }
        return updated;
      }
      return r;
    });

    onRowsChange(nextRows);

    // Auto-update overall band if correct questions changed
    if (patch.correct !== undefined) {
      const newTotalCorrect = nextRows.reduce((sum, r) => sum + (r.correct ?? 0), 0);
      const calculated = isListening
        ? calculateListeningBand(newTotalCorrect)
        : calculateReadingBand(newTotalCorrect);
      if (calculated > 0) {
        onBandScoreChange(calculated);
      }
    }
  };

  // Direct total correct change
  const handleDirectTotalCorrectChange = (val: number) => {
    const clamped = Math.max(0, Math.min(40, val));
    const calculated = isListening
      ? calculateListeningBand(clamped)
      : calculateReadingBand(clamped);
    onBandScoreChange(calculated);

    if (mergedRows.length > 0) {
      let remaining = clamped;
      const nextRows = mergedRows.map((r) => {
        const total = r.total || 6;
        const take = Math.min(remaining, total);
        remaining -= take;
        return {
          ...r,
          correct: take,
          errorRate: total > 0 ? Math.round(((total - take) / total) * 100) : 0,
        };
      });
      onRowsChange(nextRows);
    }
  };

  // Toggle checkbox for a specific diagnostic option
  const toggleOption = (rowId: string, option: DiagnosticOption) => {
    const row = mergedRows.find(
      (r) =>
        r.id === rowId ||
        (r.id && r.id.endsWith(rowId)) ||
        (rowId && rowId.endsWith(r.id)) ||
        r.title.toLowerCase().trim() === rowId.toLowerCase().trim()
    );
    if (!row) return;

    const currentDiagnosis = (row.diagnosis || "").trim();
    const text = option.text;
    const tag = option.tag;

    let nextDiagnosis = "";
    if (
      (text && currentDiagnosis.includes(text)) ||
      (tag && currentDiagnosis.includes(tag))
    ) {
      // Uncheck: remove option text and tag
      nextDiagnosis = currentDiagnosis
        .replace(text, "")
        .replace(tag || "", "")
        .replace(/^\s*•\s*/gm, "")
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean)
        .join("\n• ");
      if (nextDiagnosis) {
        nextDiagnosis = "• " + nextDiagnosis;
      }
    } else {
      // Check: add option text
      nextDiagnosis = currentDiagnosis ? `${currentDiagnosis}\n• ${text}` : `• ${text}`;
    }

    updateRow(rowId, {
      diagnosis: nextDiagnosis,
      tag: tag,
    });
  };

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border-2 border-[#796eb2] bg-white shadow-soft font-sans">
        <div className="flex flex-col md:flex-row border-b-2 border-[#796eb2]">
          
          <div className="w-full md:w-52 shrink-0 grid grid-rows-2 divide-y-2 divide-[#796eb2] border-b-2 md:border-b-0 md:border-r-2 border-[#796eb2] bg-zinc-50/40">
            
            <div className="grid grid-cols-12 items-center divide-x-2 divide-dotted divide-[#796eb2]/50 p-2.5">
              <div className="col-span-7 pr-2 text-right text-xs font-black text-zinc-900">
                Số câu đúng:
              </div>
              <div className="col-span-5 pl-2 text-center">
                <input
                  type="number"
                  min={0}
                  max={40}
                  className="w-14 text-center text-xl font-black text-[#796eb2] bg-transparent outline-none border-b-2 border-dashed border-[#796eb2]/30 focus:border-[#796eb2]"
                  value={totalCorrect}
                  onChange={(e) => {
                    const val = e.target.value === "" ? 0 : parseInt(e.target.value, 10) || 0;
                    handleDirectTotalCorrectChange(val);
                  }}
                  placeholder="0"
                  title="Nhập tổng số câu đúng"
                />
              </div>
            </div>

            <div className="grid grid-cols-12 items-center divide-x-2 divide-dotted divide-[#796eb2]/50 p-2.5">
              <div className="col-span-7 pr-2 text-right text-xs font-black text-zinc-900">
                Điểm {skillLabel}:
              </div>
              <div className="col-span-5 pl-2 text-center">
                <input
                  type="number"
                  step={0.5}
                  min={0}
                  max={9}
                  className="w-14 text-center text-xl font-black text-[#796eb2] bg-transparent outline-none border-b-2 border-dashed border-[#796eb2]/30 focus:border-[#796eb2]"
                  value={bandScore || ""}
                  onChange={(e) => onBandScoreChange(Number(e.target.value) || 0)}
                  placeholder="7.0"
                />
              </div>
            </div>
          </div>

          <div className="flex-1 p-3 sm:p-4 flex flex-col sm:flex-row items-start gap-3 bg-white">
            <div className="shrink-0 text-xs font-black text-zinc-900 underline italic pt-1.5 whitespace-nowrap">
              Nhận xét:
            </div>
            <div className="flex-1 w-full">
              <textarea
                rows={4}
                className="w-full text-xs sm:text-[13px] italic font-semibold text-[#4338ca] leading-relaxed bg-zinc-50/40 hover:bg-white border border-[#796eb2]/30 hover:border-[#796eb2]/60 focus:border-[#796eb2] focus:bg-white rounded-xl p-3 outline-none resize-y transition-all placeholder:text-zinc-400 shadow-2xs"
                value={summaryText}
                onChange={(e) => onSummaryTextChange(e.target.value)}
                placeholder={`Nhập nhận xét tổng quan về trình độ / band điểm ${skillLabel} của học viên...`}
              />
            </div>
          </div>
        </div>

        <div className="bg-[#796eb2] text-white text-center py-2 text-xs font-black uppercase tracking-widest shadow-2xs">
          &gt; ĐIỂM THÀNH PHẦN {skillLabel.toUpperCase()} &lt;
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <tbody>
              {config.map((cfg, idx) => {
                const row = mergedRows.find(
                  (r) =>
                    r.id === cfg.id ||
                    (r.id && r.id.endsWith(cfg.id)) ||
                    (r.id && cfg.id.endsWith(r.id)) ||
                    r.title.toLowerCase().trim() === cfg.title.toLowerCase().trim()
                ) || ({
                  id: cfg.id,
                  title: cfg.title,
                  correct: 0,
                  total: cfg.defaultTotal,
                  errorRate: 0,
                  diagnosis: "",
                  tag: cfg.options[0]?.tag,
                } as BcbQuestionTypeRow);

                const isLastRow = idx === config.length - 1;

                return (
                  <tr
                    key={cfg.id}
                    className={`${!isLastRow ? "border-b-2 border-[#796eb2]" : ""} hover:bg-zinc-50/40 transition-colors`}
                  >
                    {/* Cột 1: Tên Dạng bài */}
                    <td className="p-3 w-[170px] min-w-[150px] border-r-2 border-[#796eb2] text-center align-middle">
                      <div className="text-xs font-black text-zinc-900 leading-snug">
                        {cfg.title}
                      </div>
                    </td>

                    {/* Cột 2: Điểm số Đúng / Tổng */}
                    <td className="p-2 w-[130px] min-w-[125px] border-r-2 border-[#796eb2] text-center align-middle bg-zinc-50/20">
                      <div className="flex items-center justify-center gap-1 font-black text-sm text-zinc-900 whitespace-nowrap">
                        <input
                          type="number"
                          min={0}
                          className="w-12 h-8 text-center font-black text-xs text-zinc-900 bg-white border border-[#796eb2]/40 rounded-lg py-1 px-1 outline-none focus:border-[#796eb2] focus:ring-1 focus:ring-[#796eb2]/20 shadow-2xs cursor-text"
                          value={row.correct !== undefined && row.correct !== null ? row.correct : 0}
                          onChange={(e) => {
                            const val = e.target.value === "" ? 0 : parseInt(e.target.value, 10) || 0;
                            updateRow(cfg.id, { correct: Math.max(0, val) });
                          }}
                          title="Số câu đúng"
                        />
                        <span className="text-[#796eb2] font-black text-xs px-0.5">/</span>
                        <input
                          type="number"
                          min={0}
                          className="w-12 h-8 text-center font-black text-xs text-zinc-700 bg-white border border-[#796eb2]/40 rounded-lg py-1 px-1 outline-none focus:border-[#796eb2] focus:ring-1 focus:ring-[#796eb2]/20 shadow-2xs cursor-text"
                          value={row.total ?? cfg.defaultTotal}
                          onChange={(e) => {
                            const val = e.target.value === "" ? 0 : parseInt(e.target.value, 10) || 0;
                            updateRow(cfg.id, { total: Math.max(0, val) });
                          }}
                          title="Tổng số câu"
                        />
                      </div>
                    </td>

                    {/* Cột 3: Checkboxes + Nội dung chẩn đoán & nhận xét (Không hiện mã tag DL/DR thừa) */}
                    <td className="p-0 align-middle">
                      <div className="divide-y-2 divide-dotted divide-[#796eb2]/40">
                        {cfg.options.map((opt) => {
                          const isChecked = Boolean(
                            (row.diagnosis || "").includes(opt.text) ||
                            (opt.tag && (row.diagnosis || "").includes(opt.tag)) ||
                            (opt.tag && row.tag === opt.tag)
                          );

                          return (
                            <div
                              key={opt.tag || opt.text}
                              onClick={() => toggleOption(cfg.id, opt)}
                              className={`flex items-start p-3 sm:p-3.5 transition-colors cursor-pointer gap-3.5 select-none ${
                                isChecked ? "bg-purple-50/80 font-semibold text-purple-950" : "hover:bg-zinc-50/80 text-zinc-800"
                              }`}
                            >
                              <div className="shrink-0 flex items-center justify-center pt-0.5 pointer-events-none">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  readOnly
                                  className="h-4 w-4 rounded border-[#796eb2] text-[#796eb2] focus:ring-[#796eb2]/30 cursor-pointer pointer-events-none"
                                />
                              </div>

                              <div className="flex-1 text-xs md:text-[13px] font-medium leading-relaxed">
                                {opt.text}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="p-3 border-t-2 border-dotted border-[#796eb2]/30 bg-zinc-50/50">
                        <textarea
                          rows={2}
                          className="w-full text-xs sm:text-[13px] text-zinc-700 placeholder:text-zinc-400 bg-white border border-[#796eb2]/20 rounded-lg px-3 py-2 outline-none focus:border-[#796eb2] shadow-2xs"
                          placeholder={`Ghi chú chẩn đoán bổ sung cho dạng bài ${cfg.title}...`}
                          value={row.diagnosis || ""}
                          onChange={(e) => updateRow(cfg.id, { diagnosis: e.target.value })}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
