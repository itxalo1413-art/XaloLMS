"use client";

import { useState } from "react";
import Link from "next/link";
import { formatBandScore } from "@/lib/formatBandScore";

// Mock data of the guest candidate
const guestCandidate = {
  name: "Dương Ngọc Khôi Nguyên",
  email: "nguyenduong939705@gmail.com",
  phone: "0947 188 794",
  testDate: "26/05/2026",
  scores: {
    listening: 7.0,
    reading: 5.5,
    writing: 7.0,
    speaking: 4.5,
    overall: 6.0,
  },
  aim: "7.5",
};

export default function GuestDiagnosisPage() {
  const [activeDiagTab, setActiveDiagTab] = useState<"listening" | "reading" | "writing" | "speaking" | "grammar">("listening");
  const [expandedRubric, setExpandedRubric] = useState<string | null>(null);
  const [grammarFilter, setGrammarFilter] = useState<"all" | "red" | "yellow">("all");
  const [expandedGrammarId, setExpandedGrammarId] = useState<string | null>(null);
  const [writingTaskMode, setWritingTaskMode] = useState<"task1" | "task2">("task1");

  // Booking Form State
  const [bookingName, setBookingName] = useState(guestCandidate.name);
  const [bookingPhone, setBookingPhone] = useState(guestCandidate.phone);
  const [bookingSubmitted, setBookingSubmitted] = useState(false);

  return (
    <div className="min-h-screen bg-[#fafcf7] text-[#2f2b46] font-sans antialiased">
      
      {/* Premium Top Navbar */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-100 shadow-sm">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <Link href="/guest-diagnosis" className="flex items-center gap-3 transition-opacity hover:opacity-90">
            <img
              src="/Logo chính - Dương bản.jpg"
              alt="Logo Xa Lộ English"
              className="h-10 w-10 shrink-0 rounded-2xl object-contain shadow-premium"
            />
            <div>
              <img
                src="/XALO.ENGLISH.svg"
                alt="Xalo English"
                className="h-5 w-auto object-contain"
              />
              <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-widest text-primary">
                Diagnostic Portal
              </span>
            </div>
          </Link>
          <Link 
            href="#tu-van"
            className="hidden sm:inline-flex items-center justify-center rounded-2xl bg-secondary px-5 py-2.5 text-xs font-black uppercase text-white shadow-soft transition-all hover:bg-secondary/95 hover:shadow-hover hover:-translate-y-0.5"
          >
            Đăng Ký Tư Vấn Lộ Trình
          </Link>
        </div>
      </header>

      {/* Hero Welcome & Identity Block */}
      <main className="mx-auto max-w-7xl px-4 py-8 md:px-8 space-y-10">
        
        {/* Banner Khách */}
        <div className="p-6 md:p-8 rounded-[32px] bg-gradient-to-br from-primary to-primary-soft text-white relative overflow-hidden shadow-premium">
          {/* Background circles */}
          <div className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute right-1/4 top-0 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-[10px] font-black uppercase tracking-wider">
                Guest Diagnostic Report
              </span>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
                Kết Quả Đánh Giá Năng Lực IELTS
              </h1>
              <p className="text-sm font-semibold opacity-90 max-w-xl">
                Hồ sơ thí sinh: <span className="underline font-black">{guestCandidate.name}</span> · Ngày kiểm tra: {guestCandidate.testDate}
              </p>
            </div>

          </div>
        </div>

        {/* Scoreboard Cards Grid */}
        <section className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="p-5 rounded-3xl border border-primary/20 bg-primary/5 text-center flex flex-col justify-center items-center relative overflow-hidden">
            <div className="text-[10px] font-black text-primary uppercase tracking-widest mb-1.5">Overall Band</div>
            <div className="text-4xl font-black text-primary tabular-nums">
              {formatBandScore(guestCandidate.scores.overall)}
            </div>
            <span className="text-[9.5px] font-black text-zinc-500 uppercase tracking-wide mt-1.5">Người dùng Khá</span>
          </div>

          {[
            { label: "Listening", val: guestCandidate.scores.listening, style: "text-warning bg-warning/5 border-warning/15" },
            { label: "Reading", val: guestCandidate.scores.reading, style: "text-warning bg-warning/5 border-warning/15" },
            { label: "Writing", val: guestCandidate.scores.writing, style: "text-warning bg-warning/5 border-warning/15" },
            { label: "Speaking", val: guestCandidate.scores.speaking, style: "text-warning bg-warning/5 border-warning/15" },
          ].map((s) => (
            <div key={s.label} className={`p-5 rounded-3xl border ${s.style} text-center flex flex-col justify-center items-center`}>
              <div className="text-[10px] font-black uppercase tracking-widest mb-1">{s.label}</div>
              <div className="text-3xl font-black tabular-nums">{formatBandScore(s.val)}</div>
            </div>
          ))}
        </section>

        {/* Core Diagnosis Panel */}
        <section className="relative">
          <div className="absolute top-0 left-0 h-10 w-fit min-w-[140px] px-6 bg-white border-t border-l border-r border-primary/15 rounded-t-[20px] shadow-[-2px_-4px_12px_rgba(0,0,0,0.03)] flex items-center z-0">
            <div className="w-1.5 h-3.5 bg-gradient-to-b from-primary to-secondary rounded-full mr-2.5"></div>
            <div className="text-[11px] font-black text-foreground uppercase tracking-wider whitespace-nowrap">Bảng Chẩn Bệnh (BCB)</div>
          </div>

          <div className="relative z-10 flex h-full flex-col overflow-hidden rounded-2xl rounded-tl-none border border-primary/10 bg-white shadow-soft p-6">
            
            {/* Visual Overall Health Row */}
            <div className="mb-8 rounded-3xl border border-zinc-100 bg-gradient-to-br from-zinc-50 to-white p-6 shadow-soft">
              <div className="flex w-full flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
                <div className="relative flex shrink-0 items-center justify-center self-center sm:self-start">
                  <svg className="h-24 w-24 -rotate-90 transform">
                    <circle cx="48" cy="48" r="40" stroke="#ffeef2" strokeWidth="6" fill="transparent" />
                    <circle cx="48" cy="48" r="40" stroke="#fe7789" strokeWidth="6" fill="transparent" strokeDasharray="251.2" strokeDashoffset="62.8" strokeLinecap="round" />
                  </svg>
                  <svg className="absolute h-20 w-20 -rotate-90 transform">
                    <circle cx="40" cy="40" r="32" stroke="#eeebff" strokeWidth="6" fill="transparent" />
                    <circle cx="40" cy="40" r="32" stroke="#6a5acd" strokeWidth="6" fill="transparent" strokeDasharray="201" strokeDashoffset="67" strokeLinecap="round" />
                  </svg>
                  <div className="absolute text-center">
                    <span className="block text-xl font-black leading-none text-primary">6.0</span>
                    <span className="mt-0.5 block text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Aim 7.5</span>
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-black uppercase tracking-widest text-muted">Đánh giá tổng quan</div>
                  <h4 className="text-md mt-0.5 font-bold text-foreground">Người dùng Khá (Competent)</h4>
                  <p className="mt-1 w-full text-xs font-medium leading-relaxed text-zinc-500">
                    Sử dụng ngôn ngữ hiệu quả, thỉnh thoảng có lỗi dùng từ chưa phù hợp. Đã bắt đầu hiểu được ngôn ngữ phức tạp nhưng phong độ chưa đều giữa các kỹ năng.
                  </p>
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex flex-wrap gap-2 mb-6 border-b border-zinc-100 pb-4">
              {[
                { id: "listening", label: "Listening", score: "7.0" },
                { id: "reading", label: "Reading", score: "5.5" },
                { id: "writing", label: "Writing", score: "7.0" },
                { id: "speaking", label: "Speaking", score: "4.5" },
              ].map((tab) => {
                const active = activeDiagTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveDiagTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                      active
                        ? "bg-primary text-white shadow-soft"
                        : "bg-zinc-100/70 hover:bg-zinc-100 text-zinc-600"
                    }`}
                  >
                    <span>{tab.label}</span>
                    {tab.score && (
                      <span className={`px-1.5 py-0.5 rounded-lg text-[9px] font-black ${
                        active ? "bg-white/20 text-white" : "bg-zinc-200 text-zinc-700"
                      }`}>
                        {tab.score}
                      </span>
                    )}

                  </button>
                );
              })}
            </div>

            {/* TAB CONTENT: LISTENING */}
            {activeDiagTab === "listening" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="p-5 rounded-2xl border border-zinc-100 bg-zinc-50/50">
                  <div className="text-[10px] font-black text-muted uppercase tracking-widest">Đặc trưng Band 7.0</div>
                  <p className="text-xs font-medium text-foreground leading-relaxed mt-2">
                    Bạn ở band này có thể hiểu được phần lớn từ vựng trong nhiều chủ đề, bao gồm các thuật ngữ học thuật trong tiếng Anh, kể cả khi bài nói có tốc độ nhanh và phức tạp. Bạn có thể hiểu được thông tin, thái độ, ý kiến, mục đích của người nói kể cả khi chúng không được đề cập trực tiếp.
                  </p>
                </div>

                <div>
                  <div className="text-[10px] font-black text-muted uppercase tracking-widest mb-3">Dạng bài cần cải thiện (Tỷ lệ sai {">"} 50%)</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      {
                        title: "Plan, Map, Diagram Labelling",
                        tag: "DL_AD_00_001",
                        diag: "Chưa hiểu được hoặc theo kịp ngôn ngữ chỉ phương hướng (đi thẳng, rẽ trái, ở phía đối diện, etc.). Thiếu từ vựng chỉ phương hướng hoặc chưa sử dụng thành thạo.",
                        mistake: "Bị lạc hướng ở Audio Part 2 (đoạn rẽ ở ngã tư thứ hai) dẫn đến sai liên tiếp 3 câu.",
                      },
                      {
                        title: "Form, Note, Summary Completion",
                        tag: "DL_AC_00_001",
                        diag: "Chưa quen đọc thông tin trong bảng (Table) hoặc lưu đồ (Flow Chart), dẫn đến việc lúng túng hoặc điền sai câu trả lời.",
                        mistake: "Điền sai chính tả (Spelling) câu 12 'restaurant' thay vì 'resort'.",
                      },
                      {
                        title: "Multiple Choice & Matching",
                        tag: "DL_MC_00_001",
                        diag: "Dễ bị bẫy bởi các thông tin nhiễu (distractors) do nghe bắt từ đơn lẻ thay vì nghe hiểu toàn bộ ngữ cảnh.",
                        mistake: "Chọn đáp án A ngay khi nghe thấy từ khóa trùng khớp, bỏ qua từ 'but' phủ định ngay sau đó.",
                      },
                      {
                        title: "Short-answer Questions",
                        tag: "DL_SQ_00_002",
                        diag: "Hiểu sai hoặc chưa hiểu câu hỏi do không quen với cấu trúc ngữ pháp câu hỏi phức tạp.",
                        mistake: "Hiểu nhầm đối tượng thực hiện hành động trong câu hỏi số 8.",
                      }
                    ].map((w, idx) => (
                      <div key={idx} className="p-5 rounded-2xl border border-secondary/10 bg-secondary/5 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <h5 className="text-xs font-black text-secondary uppercase">{w.title}</h5>
                            <span className="text-[9px] font-bold text-secondary bg-white px-2 py-0.5 rounded-lg border border-secondary/15">{w.tag}</span>
                          </div>
                          <p className="text-xs font-semibold text-foreground mt-2 leading-relaxed">{w.diag}</p>
                          <div className="mt-3 p-3 rounded-xl bg-white border border-secondary/5 text-[11px] text-muted-foreground italic leading-normal">
                            <strong className="text-secondary font-bold not-italic">Lỗi thực tế: </strong>{w.mistake}
                          </div>
                        </div>
                        <Link href="#tu-van" className="mt-4 block text-center py-2 bg-secondary text-white rounded-xl text-xs font-bold transition-all hover:bg-secondary/90 shadow-sm">
                          Đăng Ký Khắc Phục Dạng Bài Yếu
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: READING */}
            {activeDiagTab === "reading" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="p-5 rounded-2xl border border-zinc-100 bg-zinc-50/50">
                  <div className="text-[10px] font-black text-muted uppercase tracking-widest">Đặc trưng Band 5.5</div>
                  <p className="text-xs font-medium text-foreground leading-relaxed mt-2">
                    Bạn có khả năng xử lý các văn bản học thuật và bài viết nêu quan điểm cá nhân ở mức cơ bản. Bạn hiểu được từ vựng khi các ý tưởng đơn giản, nhưng dễ bị bối rối trước cấu trúc câu phức tạp và có xu hướng đọc dịch từng từ khiến tốc độ đọc bị chậm.
                  </p>
                </div>

                <div>
                  <div className="text-[10px] font-black text-muted uppercase tracking-widest mb-3">Dạng bài cần cải thiện (Tỷ lệ sai {">"} 50%)</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      {
                        title: "Matching Features",
                        tag: "DR_MF_00_001",
                        diag: "Không tìm được dữ kiện để trả lời câu hỏi. Có thể do bỏ lỡ các tên riêng/các thông tin liên quan đến tên riêng trong bài hoặc không nhận biết được các đại từ nhân xưng được dùng để nhắc đến đối tượng nào.",
                        mistake: "Lẫn lộn giữa hai ý kiến của hai nhà khoa học ở đoạn C do không để ý đại từ 'she' chỉ về ai.",
                      },
                      {
                        title: "Matching Headings",
                        tag: "DR_MH_00_001",
                        diag: "Không nắm / tóm tắt được ý chính mà đoạn văn đang muốn nói đến. Dễ bị đánh lừa bởi các từ khóa lặp lại ở câu đầu nhưng chủ đề đoạn nằm ở giữa.",
                        mistake: "Chọn nhầm Heading của đoạn B do đoạn này thay đổi luận điểm đột ngột ở giữa đoạn.",
                      }
                    ].map((w, idx) => (
                      <div key={idx} className="p-5 rounded-2xl border border-secondary/10 bg-secondary/5 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <h5 className="text-xs font-black text-secondary uppercase">{w.title}</h5>
                            <span className="text-[9px] font-bold text-secondary bg-white px-2 py-0.5 rounded-lg border border-secondary/15">{w.tag}</span>
                          </div>
                          <p className="text-xs font-semibold text-foreground mt-2 leading-relaxed">{w.diag}</p>
                          <div className="mt-3 p-3 rounded-xl bg-white border border-secondary/5 text-[11px] text-muted-foreground italic leading-normal">
                            <strong className="text-secondary font-bold not-italic">Lỗi thực tế: </strong>{w.mistake}
                          </div>
                        </div>
                        <Link href="#tu-van" className="mt-4 block text-center py-2 bg-secondary text-white rounded-xl text-xs font-bold transition-all hover:bg-secondary/90 shadow-sm">
                          Đăng Ký Khắc Phục Dạng Bài Yếu
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: WRITING */}
            {activeDiagTab === "writing" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="p-5 rounded-2xl border border-zinc-100 bg-zinc-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="text-[10px] font-black text-muted uppercase tracking-widest">Đặc trưng Writing Band 7.0</div>
                    <p className="text-xs font-medium text-foreground leading-relaxed mt-2 max-w-2xl">
                      Bạn đưa ra được thông tin khái quát (Overview) và quan điểm cá nhân rõ ràng. Dùng được tương đối đa dạng từ nối, vốn từ tương đối rộng bao gồm cả từ ít thông dụng một cách khá chính xác.
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button 
                      onClick={() => setWritingTaskMode("task1")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        writingTaskMode === "task1" ? "bg-primary text-white shadow-sm" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                      }`}
                    >
                      Task 1 (7.0)
                    </button>
                    <button 
                      onClick={() => setWritingTaskMode("task2")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        writingTaskMode === "task2" ? "bg-primary text-white shadow-sm" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                      }`}
                    >
                      Task 2 (7.0)
                    </button>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-black text-muted uppercase tracking-widest mb-3">
                    Chi tiết tiêu chí chấm điểm - {writingTaskMode === "task1" ? "Writing Task 1" : "Writing Task 2"}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {writingTaskMode === "task1" ? (
                      <>
                        {[
                          {
                            id: "w1_ta",
                            name: "Task Achievement (TA)",
                            score: "7.0",
                            details: [
                              { label: "1. Làm theo yêu cầu", value: "4+: Đúng yêu cầu đề bài." },
                              { label: "2. Số lượng ý", value: "5+: Đủ các ý chính." },
                              { label: "3. Chất lượng ý", value: "7: Miêu tả ý chính trọn vẹn." },
                              { label: "4. Hình thức (Format)", value: "6+: Format phù hợp." },
                              { label: "5. Overview", value: "7+: Overview rõ và tả đúng ý nổi bật nhất." },
                            ]
                          },
                          {
                            id: "w1_cc",
                            name: "Coherence & Cohesion (CC)",
                            score: "7.0",
                            details: [
                              { label: "1. Tổ chức & Sắp xếp", value: "6+: Hiểu được logic bài. Thấy được chủ ý mỗi đoạn." },
                              { label: "2. Từ nối & Reference", value: "7: Reference đúng. Dùng khá đúng và đa dạng từ nối." },
                            ]
                          },
                          {
                            id: "w1_lr",
                            name: "Lexical Resource (LR)",
                            score: "7.0",
                            details: [
                              { label: "1. Số lượng & Độ đa dạng", value: "7+: Dùng từ vựng phong phú để không phải lặp từ." },
                              { label: "2. Mức độ đúng & Phù hợp", value: "7: Khá phù hợp. Dùng được collocations." },
                            ]
                          },
                          {
                            id: "w1_gr",
                            name: "Grammatical Range & Accuracy (GR)",
                            score: "7.0",
                            details: [
                              { label: "1. Độ đa dạng & Phức tạp", value: "7+: Dùng đúng nhiều cấu trúc ngữ pháp khác nhau." },
                              { label: "2. Mức độ đúng", value: "7: Dùng ngữ pháp phù hợp. Đôi khi sai punctuation." },
                            ]
                          }
                        ].map((criterion) => {
                          const expanded = expandedRubric === criterion.id;
                          return (
                            <div key={criterion.id} className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-soft transition-all hover:shadow-hover">
                              <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpandedRubric(expanded ? null : criterion.id)}>
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-sm">{criterion.score}</div>
                                  <h5 className="text-sm font-bold text-foreground">{criterion.name}</h5>
                                </div>
                                <svg className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${expanded ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
                              </div>
                              
                              {expanded && (
                                <div className="mt-4 pt-4 border-t border-zinc-50 space-y-3 animate-in slide-in-from-top-2 duration-200">
                                  {criterion.details.map((d, idx) => (
                                    <div key={idx} className="text-xs">
                                      <div className="font-bold text-zinc-500 mb-1">{d.label}</div>
                                      <div className="font-semibold text-foreground bg-zinc-50 p-2 rounded-xl border border-zinc-100">{d.value}</div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </>
                    ) : (
                      <>
                        {[
                          {
                            id: "w2_tr",
                            name: "Task Response (TR)",
                            score: "7.0",
                            details: [
                              { label: "1. Thỏa mãn yêu cầu đề", value: "6+: Thỏa mãn tất cả các yêu cầu đề bài." },
                              { label: "2. Số lượng ý", value: "6+: Viết đủ ý." },
                              { label: "3. Chất lượng ý", value: "7: Ý được triển khai đủ, nhưng đôi khi luận điểm chưa sắc sảo." },
                              { label: "4. Định dạng", value: "6+: Format phù hợp." },
                              { label: "5. Quan điểm (Position)", value: "7+: Có quan điểm xuyên suốt, có câu giới thiệu rõ." }
                            ]
                          },
                          {
                            id: "w2_cc",
                            name: "Coherence & Cohesion (CC)",
                            score: "7.0",
                            details: [
                              { label: "1. Tổ chức đoạn văn", value: "6+: Mỗi đoạn xoay quanh một chủ đề rõ ràng." },
                              { label: "2. Từ nối & Reference", value: "7: Dùng từ nối đa dạng nhưng đôi khi còn hơi lạm dụng." }
                            ]
                          },
                          {
                            id: "w2_lr",
                            name: "Lexical Resource (LR)",
                            score: "7.0",
                            details: [
                              { label: "1. Vốn từ vựng", value: "7+: Dùng từ phong phú, có khả năng paraphrase tốt." },
                              { label: "2. Độ đúng ngữ cảnh", value: "7: Lựa chọn từ vựng đúng ngữ cảnh, thỉnh thoảng lỗi spelling nhẹ." }
                            ]
                          },
                          {
                            id: "w2_gr",
                            name: "Grammatical Range & Accuracy (GR)",
                            score: "7.0",
                            details: [
                              { label: "1. Cấu trúc câu phức", value: "7+: Áp dụng linh hoạt nhiều mẫu câu phức." },
                              { label: "2. Tần suất lỗi", value: "7: Dùng ngữ pháp phù hợp, thỉnh thoảng có vài lỗi nhỏ." }
                            ]
                          }
                        ].map((criterion) => {
                          const expanded = expandedRubric === criterion.id;
                          return (
                            <div key={criterion.id} className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-soft transition-all hover:shadow-hover">
                              <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpandedRubric(expanded ? null : criterion.id)}>
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-sm">{criterion.score}</div>
                                  <h5 className="text-sm font-bold text-foreground">{criterion.name}</h5>
                                </div>
                                <svg className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${expanded ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
                              </div>
                              
                              {expanded && (
                                <div className="mt-4 pt-4 border-t border-zinc-50 space-y-3 animate-in slide-in-from-top-2 duration-200">
                                  {criterion.details.map((d, idx) => (
                                    <div key={idx} className="text-xs">
                                      <div className="font-bold text-zinc-500 mb-1">{d.label}</div>
                                      <div className="font-semibold text-foreground bg-zinc-50 p-2 rounded-xl border border-zinc-100">{d.value}</div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: SPEAKING */}
            {activeDiagTab === "speaking" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="p-5 rounded-2xl border border-zinc-100 bg-zinc-50/50">
                  <div className="text-[10px] font-black text-muted uppercase tracking-widest">Đặc trưng Speaking Band 4.5</div>
                  <p className="text-xs font-medium text-foreground leading-relaxed mt-2">
                    Bạn thường nói với những khoảng dừng đáng kể. Bài nói chậm, hay lặp từ và tự sửa lỗi liên tục. Cấu trúc câu đơn giản chiếm đa số, lỗi ngữ pháp và phát âm thường xuyên xảy ra gây cản trở cho người nghe.
                  </p>
                </div>

                {/* Speaking Criteria breakdown */}
                <div>
                  <div className="text-[10px] font-black text-muted uppercase tracking-widest mb-3">Chi tiết tiêu chí Speaking</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      {
                        name: "Fluency & Coherence (FC)",
                        score: "5.5",
                        details: [
                          { l: "Fluency (Độ trôi chảy)", v: "6: Trả lời dài, kỹ, chưa lưu loát lắm. Hay nói chậm, vấp hoặc lặp từ." },
                          { l: "Coherence (Độ mạch lạc)", v: "5: Lạm dụng hoặc dùng sai từ nối. Không sử dụng đại từ thay thế tốt." }
                        ]
                      },
                      {
                        name: "Lexical Resource (LR)",
                        score: "4.0",
                        details: [
                          { l: "Vốn từ vựng", v: "4: Chỉ tả được ý cơ bản, rất khó tả các ý không quen." },
                          { l: "Độ chính xác", v: "4: Hay chọn sai từ ngữ cảnh, hiếm khi paraphrase thành công." }
                        ]
                      },
                      {
                        name: "Grammar Range & Accuracy (GR)",
                        score: "4.0",
                        details: [
                          { l: "Độ đa dạng câu", v: "4: Dùng đa số câu đơn. Rất hiếm khi kết hợp câu phức." },
                          { l: "Tần suất lỗi", v: "4: Lỗi ngữ pháp thường xuyên xảy ra và làm cản trở việc hiểu ý." }
                        ]
                      },
                      {
                        name: "Pronunciation (PRN)",
                        score: "5.5",
                        details: [
                          { l: "Phát âm chung", v: "5: Giữa 4 và 6. Đôi khi nuốt âm cuối, ngữ điệu còn đều đều." }
                        ]
                      }
                    ].map((c, i) => (
                      <div key={i} className="p-5 rounded-2xl border border-zinc-100 bg-white shadow-soft">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-sm">{c.score}</div>
                          <h5 className="text-sm font-bold text-foreground">{c.name}</h5>
                        </div>
                        <div className="space-y-3">
                          {c.details.map((d, idx) => (
                            <div key={idx} className="text-xs">
                              <div className="font-bold text-zinc-500 mb-1">{d.l}</div>
                              <div className="font-semibold text-foreground bg-zinc-50 p-2.5 rounded-xl border border-zinc-100 leading-relaxed">{d.v}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>
        </section>

        {/* Lead Capture/Booking Form for Guests */}
        <section id="tu-van" className="scroll-mt-24">
          <div className="relative pt-8">
            {/* Folder Tab Shape */}
            <div className="absolute top-0 left-0 h-10 w-fit min-w-[140px] px-6 bg-white border-t border-l border-r border-primary/15 rounded-t-[20px] shadow-[-2px_-4px_12px_rgba(0,0,0,0.03)] flex items-center z-0">
              <div className="w-1.5 h-3.5 bg-gradient-to-b from-secondary to-primary rounded-full mr-2.5"></div>
              <div className="text-[11px] font-black text-foreground uppercase tracking-wider whitespace-nowrap">Đăng Ký Tư Vấn Lộ Trình</div>
            </div>

            {/* Folder Body */}
            <div className="relative z-10 rounded-2xl rounded-tl-none border border-primary/10 bg-white p-6 md:p-8 shadow-soft">
              {bookingSubmitted ? (
                <div className="py-8 text-center space-y-4 animate-in fade-in duration-200">
                  <div className="w-16 h-16 rounded-full bg-success/15 text-success flex items-center justify-center mx-auto text-2xl">
                    ✓
                  </div>
                  <h3 className="text-lg font-black text-foreground">Đăng Ký Thành Công!</h3>
                  <p className="text-sm font-semibold text-zinc-500 max-w-md mx-auto leading-relaxed">
                    Cảm ơn Khôi Nguyên, đội ngũ chuyên môn của Xa Lộ English sẽ liên hệ lại với bạn qua số điện thoại <span className="text-foreground font-bold">{bookingPhone}</span> trong vòng 24 giờ tới để gửi lộ trình học chi tiết từ 6.0 lên 7.5.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-7 space-y-4">
                    <h3 className="text-xl md:text-2xl font-black text-foreground tracking-tight leading-tight">
                      Bạn Muốn Bứt Phá Từ 6.0 Lên {guestCandidate.aim} Trong 4 Tháng?
                    </h3>
                    <p className="text-xs md:text-sm font-medium text-zinc-500 leading-relaxed">
                      Lớp học tại Xa Lộ English được thiết kế may đo riêng cho từng học viên dựa trên chính kết quả chẩn đoán này. Chúng tôi sẽ giúp bạn:
                    </p>
                    <ul className="space-y-2.5">
                      {[
                        "Khắc phục triệt để lỗi S-V Agreement (11 lỗi) và lỗi Noun Phrase (5 lỗi) bằng chuyên đề bổ trợ.",
                        "Luyện tập riêng các dạng bài yếu (Map, Diagram Labelling, Matching Headings) với kho đề thi thực tế.",
                        "Tăng độ trôi chảy (Fluency) và từ vựng nâng cao qua mô hình học 1 kèm 1 với giáo viên 8.5+.",
                      ].map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs font-semibold text-zinc-700">
                          <span className="w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">✓</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      setBookingSubmitted(true);
                    }}
                    className="lg:col-span-5 p-6 rounded-2xl bg-zinc-50 border border-zinc-100 space-y-4"
                  >
                    <div>
                      <label className="text-[10px] font-black text-muted uppercase tracking-widest block mb-2">Họ và Tên</label>
                      <input 
                        type="text" 
                        value={bookingName}
                        onChange={(e) => setBookingName(e.target.value)}
                        required
                        className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-xs font-bold text-foreground outline-none transition-all focus:border-primary/40 focus:ring-2 focus:ring-primary/10" 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-muted uppercase tracking-widest block mb-2">Số điện thoại liên hệ</label>
                      <input 
                        type="tel" 
                        value={bookingPhone}
                        onChange={(e) => setBookingPhone(e.target.value)}
                        required
                        className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-xs font-bold text-foreground outline-none transition-all focus:border-primary/40 focus:ring-2 focus:ring-primary/10" 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-muted uppercase tracking-widest block mb-2">Mục tiêu điểm mong muốn</label>
                      <select className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-xs font-bold text-foreground outline-none transition-all focus:border-primary/40">
                        <option>7.5 IELTS (Lộ trình đề xuất)</option>
                        <option>8.0 IELTS</option>
                        <option>7.0 IELTS</option>
                      </select>
                    </div>
                    <button 
                      type="submit" 
                      className="w-full py-3 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-soft transition-all hover:bg-primary/95 hover:shadow-hover hover:-translate-y-0.5 mt-2"
                    >
                      Nhận Lộ Trình & Tư Vấn Miễn Phí
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </section>

      </main>

      {/* Premium Footer */}
      <footer className="mt-20 border-t border-zinc-100 bg-white py-12 text-center text-xs font-bold text-zinc-400">
        <div className="mx-auto max-w-7xl px-6">
          <p>© 2026 Xa Lộ English. Tất cả quyền được bảo lưu.</p>
          <p className="mt-1.5 text-[10px] text-zinc-300 font-medium">Bản báo cáo kết quả chẩn đoán này là tài sản học thuật của Xa Lộ English.</p>
        </div>
      </footer>

    </div>
  );
}
