"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BcbQuestionTypeTable } from "@/components/diagnosis/BcbQuestionTypeTable";
import { SkillDiagIntro } from "@/components/diagnosis/SkillDiagIntro";
import { SpeakingCriteriaPanel } from "@/components/diagnosis/SpeakingCriteriaPanel";
import { WritingDiagIntro } from "@/components/diagnosis/WritingDiagIntro";
import { WritingScoreFormulaNote } from "@/components/diagnosis/WritingScoreFormulaNote";
import { WritingTask1CriteriaPanel } from "@/components/diagnosis/WritingTask1CriteriaPanel";
import { WritingTask2CriteriaPanel } from "@/components/diagnosis/WritingTask2CriteriaPanel";
import { formatBandScore } from "@/lib/formatBandScore";
import { submitGuestDiagnosisLead } from "@/lib/guestDiagnosisLeads";
import { useGuestDiagnosis } from "@/hooks/useGuestDiagnosis";

function GuestDiagnosisContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const leadId = searchParams.get("leadId");
  const { diagnosis: guest, writingBands, loading, loadError } = useGuestDiagnosis(leadId);
  const [activeDiagTab, setActiveDiagTab] = useState<"listening" | "reading" | "writing" | "speaking">("listening");
  const [writingTaskMode, setWritingTaskMode] = useState<"task1" | "task2">("task1");

  const [bookingName, setBookingName] = useState("");
  const [bookingPhone, setBookingPhone] = useState("");
  const [bookingAim, setBookingAim] = useState("7.5 IELTS");
  const [bookingSubmitted, setBookingSubmitted] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [bookingSaving, setBookingSaving] = useState(false);

  const displayAim = guest.aim || bookingAim || "7.5 IELTS";
  const displayAimLabel = displayAim.toLowerCase().startsWith("aim") ? displayAim : `Aim ${displayAim}`;
  const overallScore = guest.scores.overall || 0;
  const strokeDashoffset = Math.max(0, 201 - (Math.min(9, overallScore) / 9) * 201);

  const personalizedInsights = useMemo(() => {
    const insights: string[] = [];

    // 1. Weak question types from Listening & Reading
    const allRows = [...(guest.bcbListening || []), ...(guest.bcbReading || [])];
    const weakRows = allRows.filter(
      (r) =>
        Boolean((r.errorRate && r.errorRate > 0) ||
        ((r.total ?? 0) > 0 && (r.correct ?? 0) < (r.total ?? 0))),
    );
    if (weakRows.length > 0) {
      const sorted = [...weakRows].sort((a, b) => (b.errorRate || 0) - (a.errorRate || 0));
      const topWeak = sorted.slice(0, 3).map((r) => r.title).filter(Boolean).join(", ");
      if (topWeak) {
        insights.push(`Luyện tập chuyên sâu và khắc phục các dạng bài có tỷ lệ lỗi cao (${topWeak}) với kho đề thi thực tế.`);
      }
    }
    if (insights.length === 0) {
      insights.push("Luyện tập riêng các dạng bài trọng tâm và bẫy đề thi thực chiến theo tiêu chuẩn IELTS mới nhất.");
    }

    // 2. Writing & Speaking insights
    const spkScores = guest.speakingCriteria;
    const lowestSpk = Math.min(
      spkScores?.fluencyCoherence || 9,
      spkScores?.lexicalResource || 9,
      spkScores?.grammaticalRangeAccuracy || 9,
      spkScores?.pronunciation || 9,
    );
    if (lowestSpk < 6.0 && lowestSpk > 0) {
      insights.push("Tăng cường độ trôi chảy (Fluency) và phát âm chuẩn quốc tế qua mô hình luyện phản xạ 1 kèm 1.");
    } else {
      insights.push("Nâng cao cấu trúc câu phức, từ vựng học thuật nâng cao cho Writing & Speaking theo tiêu chuẩn chấm 8.0+.");
    }

    // 3. Aim & timeline
    insights.push(`Thiết kế phác đồ cá nhân hóa may đo riêng để bứt phá đạt ${displayAimLabel} trong thời gian tối ưu.`);

    return insights;
  }, [guest.bcbListening, guest.bcbReading, guest.speakingCriteria, displayAimLabel]);

  useEffect(() => {
    if (guest.name) setBookingName(guest.name);
    if (guest.phone) setBookingPhone(guest.phone);
    if (guest.aim) setBookingAim(guest.aim);
  }, [guest.name, guest.phone, guest.aim]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm font-bold text-zinc-500">
        Đang tải báo cáo chẩn đoán...
      </div>
    );
  }

  return (
    <div className="guest-card-scope relative min-h-screen bg-transparent font-sans text-[#2f2b46] antialiased">
      {/* Premium Top Navbar */}
      <header className="sticky top-0 z-50 border-b border-zinc-100 bg-white/80 shadow-sm backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <Link href="/guest-diagnosis" className="flex items-center gap-3 transition-opacity hover:opacity-90">
            <img
              src="/Logo_XLE.svg"
              alt="Logo Xa Lộ English"
              className="h-10 w-10 shrink-0 object-contain"
            />
            <div>
              <img
                src="/XALO.ENGLISH.svg"
                alt="Xalo English"
                className="h-5 w-auto object-contain"
              />
              <span className="mt-2 block text-[10px] font-bold uppercase tracking-widest text-primary">
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
      <main className="relative z-10 mx-auto max-w-7xl space-y-10 px-4 py-8 md:px-8">
        {loadError && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-800">
            {loadError}
          </div>
        )}
        {leadId && !loadError && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800">
            Đang xem báo cáo đã sync từ Sale (lead {leadId.slice(-6)}).
          </div>
        )}
        
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
                Hồ sơ thí sinh: <span className="underline font-black">{guest.name || "Khách"}</span>
                {guest.testDate ? ` · Ngày kiểm tra: ${guest.testDate}` : ""}
              </p>
            </div>

          </div>
        </div>

        {/* Scoreboard Cards Grid */}
        <section className="grid grid-cols-1 gap-4 md:grid-cols-5">
          <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-3xl border-2 border-primary/40 bg-card/95 p-5 text-center shadow-soft backdrop-blur-sm">
            <div className="mb-1.5 text-[11px] font-black uppercase tracking-widest text-primary">Overall Band</div>
            <div className="text-5xl font-black tabular-nums text-primary">
              {formatBandScore(guest.scores.overall)}
            </div>
            <span className="mt-1.5 text-[10px] font-black uppercase tracking-wide text-foreground/70">
              Người dùng Khá
            </span>
          </div>

          {[
            { label: "Listening", val: guest.scores.listening },
            { label: "Reading", val: guest.scores.reading },
            { label: "Writing", val: guest.scores.writing },
            { label: "Speaking", val: guest.scores.speaking },
          ].map((s) => (
            <div
              key={s.label}
              className="flex flex-col items-center justify-center rounded-3xl border-2 border-warning/40 bg-card/95 p-5 text-center shadow-soft backdrop-blur-sm"
            >
              <div className="mb-1 text-[11px] font-black uppercase tracking-widest text-warning">{s.label}</div>
              <div className="text-4xl font-black tabular-nums text-warning">{formatBandScore(s.val)}</div>
            </div>
          ))}
        </section>

        {/* Core Diagnosis Panel */}
        <section className="relative">
          <div className="absolute top-0 left-0 z-0 h-10 w-fit min-w-[140px] overflow-hidden rounded-t-2xl shadow-[-2px_-4px_12px_rgba(0,0,0,0.03)]">
            <div
              className="flex h-full w-full items-center border border-b-0 border-primary/15 bg-card px-6"
              style={{
                clipPath: "polygon(16px 0, calc(100% - 16px) 0, 100% 100%, 0 100%)",
              }}
            >
              <div className="mr-2.5 h-3.5 w-1.5 rounded-full bg-gradient-to-b from-primary to-secondary" />
              <div className="whitespace-nowrap text-[11px] font-black uppercase tracking-wider text-foreground">
                Bảng Chẩn Bệnh (BCB)
              </div>
            </div>
          </div>

          <div className="relative z-10 flex h-full flex-col overflow-hidden rounded-2xl rounded-tl-none rounded-tr-2xl rounded-br-2xl rounded-bl-2xl border border-primary/10 bg-card shadow-soft p-6">
            
            {/* Visual Overall Health Row */}
            <div className="mb-8 rounded-3xl border border-zinc-100 bg-gradient-to-br from-zinc-50 to-white p-6 shadow-soft">
              <div className="flex w-full flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
                <div className="relative flex shrink-0 items-center justify-center self-center sm:self-start">
                  <svg className="h-24 w-24 -rotate-90 transform">
                  </svg>
                  <svg className="absolute h-20 w-20 -rotate-90 transform">
                    <circle cx="40" cy="40" r="32" stroke="#eeebff" strokeWidth="6" fill="transparent" />
                    <circle
                      cx="40"
                      cy="40"
                      r="32"
                      stroke="#6a5acd"
                      strokeWidth="6"
                      fill="transparent"
                      strokeDasharray="201"
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute text-center">
                    <span className="block text-xl font-black leading-none text-primary">
                      {overallScore ? formatBandScore(overallScore) : "0.0"}
                    </span>
                    <span className="mt-0.5 block text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                      {displayAimLabel}
                    </span>
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-black uppercase tracking-widest text-muted">Đánh giá tổng quan</div>
                  <h4 className="text-md mt-0.5 font-bold text-foreground">{guest.bcbOverviewTitle}</h4>
                  <p className="mt-1 w-full text-xs font-medium leading-relaxed text-zinc-500">
                    {guest.bcbOverviewSummary}
                  </p>
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex flex-wrap gap-2 mb-6 border-b border-zinc-100 pb-4">
              {[
                { id: "listening", label: "Listening", score: formatBandScore(guest.scores.listening) },
                { id: "reading", label: "Reading", score: formatBandScore(guest.scores.reading) },
                { id: "writing", label: "Writing", score: formatBandScore(guest.scores.writing) },
                { id: "speaking", label: "Speaking", score: formatBandScore(guest.scores.speaking) },
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
                <SkillDiagIntro
                  bandLabel={`Đặc trưng Band ${formatBandScore(guest.scores.listening)}`}
                  summary={guest.skillSummaries.listening}
                />

                <BcbQuestionTypeTable rows={guest.bcbListening} showWeakCta />
              </div>
            )}

            {/* TAB CONTENT: READING */}
            {activeDiagTab === "reading" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <SkillDiagIntro
                  bandLabel={`Đặc trưng Band ${formatBandScore(guest.scores.reading)}`}
                  summary={guest.skillSummaries.reading}
                />

                <BcbQuestionTypeTable rows={guest.bcbReading} showWeakCta />
              </div>
            )}

            {/* TAB CONTENT: WRITING */}
            {activeDiagTab === "writing" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <WritingDiagIntro
                  taskMode={writingTaskMode}
                  onTaskModeChange={setWritingTaskMode}
                  task1Band={writingBands.task1Band}
                  task2Band={writingBands.task2Band}
                  summary={guest.writingSummary[writingTaskMode]}
                  submissionLink={guest.writingLinks[writingTaskMode]}
                />

                <div>
                  <div className="text-[10px] font-black text-muted uppercase tracking-widest mb-3">
                    Chi tiết tiêu chí chấm điểm - {writingTaskMode === "task1" ? "Writing Task 1" : "Writing Task 2"}
                  </div>
                  {writingTaskMode === "task1" ? (
                    <WritingTask1CriteriaPanel scores={guest.writingCriteria.task1} />
                  ) : (
                    <WritingTask2CriteriaPanel scores={guest.writingCriteria.task2} />
                  )}
                </div>

                <WritingScoreFormulaNote
                  task1Band={writingBands.task1Band}
                  task2Band={writingBands.task2Band}
                  writingOverall={writingBands.writingOverall}
                />
              </div>
            )}

            {/* TAB CONTENT: SPEAKING */}
            {activeDiagTab === "speaking" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="p-5 rounded-2xl border border-zinc-100 bg-zinc-50/50">
                  <div className="text-[10px] font-black text-muted uppercase tracking-widest">
                    Đặc trưng Speaking Band {formatBandScore(guest.scores.speaking)}
                  </div>
                  <p className="text-xs font-medium text-foreground leading-relaxed mt-2">
                    {guest.skillSummaries.speaking}
                  </p>
                </div>
                <div>
                  <div className="text-[10px] font-black text-muted uppercase tracking-widest mb-3">Chi tiết tiêu chí Speaking</div>
                  <SpeakingCriteriaPanel scores={guest.speakingCriteria} />
                </div>
              </div>
            )}

          </div>
        </section>

        {/* Lead Capture/Booking Form for Guests */}
        <section id="tu-van" className="scroll-mt-24">
          <div className="relative pt-8">
            {/* Folder Tab Shape */}
            <div className="absolute top-0 left-0 z-0 h-10 w-fit min-w-[140px] overflow-hidden rounded-t-2xl shadow-[-2px_-4px_12px_rgba(0,0,0,0.03)]">
              <div
                className="flex h-full w-full items-center border border-b-0 border-primary/15 bg-card px-6"
                style={{
                  clipPath: "polygon(16px 0, calc(100% - 16px) 0, 100% 100%, 0 100%)",
                }}
              >
                <div className="mr-2.5 h-3.5 w-1.5 rounded-full bg-gradient-to-b from-primary to-secondary" />
                <div className="whitespace-nowrap text-[11px] font-black uppercase tracking-wider text-foreground">
                  Đăng Ký Tư Vấn Lộ Trình
                </div>
              </div>
            </div>

            {/* Folder Body */}
            <div className="relative z-10 rounded-2xl rounded-tl-none rounded-tr-2xl rounded-br-2xl rounded-bl-2xl border border-primary/10 bg-card p-6 shadow-soft md:p-8">
              {bookingSubmitted ? (
                <div className="py-8 text-center space-y-4 animate-in fade-in duration-200">
                  <div className="w-16 h-16 rounded-full bg-success/15 text-success flex items-center justify-center mx-auto text-2xl">
                    ✓
                  </div>
                  <h3 className="text-lg font-black text-foreground">Đăng Ký Thành Công!</h3>
                  <p className="text-sm font-semibold text-zinc-500 max-w-md mx-auto leading-relaxed">
                    Cảm ơn {bookingName || "bạn"}, đội ngũ Xa Lộ English sẽ liên hệ qua số{" "}
                    <span className="text-foreground font-bold">{bookingPhone}</span> trong vòng 24 giờ
                    để gửi lộ trình học chi tiết.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-7 space-y-4">
                    <h3 className="text-xl md:text-2xl font-black text-foreground tracking-tight leading-tight">
                      Bạn Muốn Bứt Phá Từ {overallScore ? formatBandScore(overallScore) : "Band hiện tại"} Lên {displayAimLabel}?
                    </h3>
                    <p className="text-xs md:text-sm font-medium text-zinc-500 leading-relaxed">
                      Lớp học tại Xa Lộ English được thiết kế may đo riêng cho từng học viên dựa trên chính kết quả chẩn đoán này. Chúng tôi sẽ giúp bạn:
                    </p>
                    <ul className="space-y-2.5">
                      {personalizedInsights.map((item, idx) => (
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
                      setBookingError("");
                      setBookingSaving(true);
                      void submitGuestDiagnosisLead({
                        name: bookingName,
                        phone: bookingPhone,
                        aim: bookingAim,
                      })
                        .then((lead) => {
                          setBookingSubmitted(true);
                          router.replace(
                            `/guest-diagnosis?leadId=${encodeURIComponent(lead.id)}`,
                            { scroll: false },
                          );
                        })
                        .catch((err: unknown) => {
                          setBookingError(
                            err instanceof Error
                              ? err.message
                              : "Không gửi được đăng ký. Thử lại.",
                          );
                        })
                        .finally(() => setBookingSaving(false));
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
                      <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-muted">Mục tiêu điểm mong muốn</label>
                      <div className="group relative">
                        <select
                          value={bookingAim}
                          onChange={(e) => setBookingAim(e.target.value)}
                          className="h-11 w-full cursor-pointer appearance-none rounded-xl border border-zinc-200 bg-white pl-4 pr-10 text-xs font-bold text-foreground outline-none transition-all focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
                        >
                          <option>5.0 IELTS</option>
                          <option>5.5 IELTS</option>
                          <option>6.0 IELTS</option>
                          <option>6.5 IELTS</option>
                          <option>7.0 IELTS</option>
                          <option>7.5 IELTS</option>
                          <option>8.0 IELTS</option>
                        </select>
                        <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted">
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden>
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    {bookingError && (
                      <p className="text-xs font-bold text-red-600">{bookingError}</p>
                    )}
                    <button 
                      type="submit"
                      disabled={bookingSaving}
                      className="w-full py-3 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-soft transition-all hover:bg-primary/95 hover:shadow-hover hover:-translate-y-0.5 mt-2 disabled:opacity-60"
                    >
                      {bookingSaving ? "Đang gửi..." : "Nhận Lộ Trình & Tư Vấn Miễn Phí"}
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

export default function GuestDiagnosisPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-sm font-bold text-zinc-500">
          Đang tải...
        </div>
      }
    >
      <GuestDiagnosisContent />
    </Suspense>
  );
}
