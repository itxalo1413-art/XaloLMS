"use client";

import { StudentLayout } from "@/app/StudentLayout";
import Link from "next/link";
import { useState } from "react";
import {
  contentTypeLabel,
  getRecentlyViewedDocuments,
  statusLabel,
} from "@/components/student/mockLearning";
import {
  defaultStudyHabitForm,
  studyHabitOptionLists,
} from "@/lib/studentProfileStudyOptions";

const student = {
  name: "Dương Ngọc Khôi Nguyên",
  email: "nguyenduong939705@gmail.com",
  phone: "0947 188 794",
  dob: "20/08/2006",
  zodiac: "Sư Tử",
  examDate: "10/08/2026",
  countdown: "Còn 108 ngày",
  aim: "7.5 Overall",
  bcb: "BCB",
  scores: {
    listening: 7.5,
    reading: 5.5,
    writing: 6.0,
    speaking: 4.5,
    overall: 6.0,
  },
};

const studyHabitOptions = studyHabitOptionLists;

/** Same pattern as `tai-lieu-them/page.tsx`: wrapper + `appearance-none` + overlay chevron. */
function HabitSelect({
  label,
  value,
  onValueChange,
  options,
}: {
  label: string;
  value: string;
  onValueChange: (next: string) => void;
  options: readonly string[];
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-zinc-600">{label}</label>
      <div className="relative group mt-2">
        <select
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          className="h-11 w-full cursor-pointer appearance-none rounded-2xl border border-zinc-200 bg-white px-4 pr-10 text-sm font-bold text-foreground shadow-sm outline-none transition-all focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
        >
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const recentlyViewed = getRecentlyViewedDocuments(4);
  const [habitForm, setHabitForm] = useState({ ...defaultStudyHabitForm });

  const onHabitChange = (key: keyof typeof habitForm, value: string) => {
    setHabitForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <StudentLayout>
      <div className="space-y-10 pb-20">
        
        {/* Welcome Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-foreground tracking-tight">Thông tin học viên</h2>
            <p className="text-muted text-sm mt-1 font-medium">
              Lộ trình học tập, mục tiêu và tài liệu học của bạn trong thời gian đăng ký.
            </p>
          </div>
          <div className="flex gap-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-success/10 text-success px-3 py-1 text-xs font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></span> Đang hoạt động
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-bold">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
              IELTS Scholar
            </div>
          </div>
        </header>

        <div className="space-y-10">
            
            <section>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-1.5 h-6 bg-primary rounded-full"></div>
                <h3 className="text-sm font-black text-muted uppercase  ">
                  Hero Overview
                </h3>
              </div>

              <div className="rounded-3xl bg-white p-6 md:p-8 shadow-soft border border-primary/10">
                <div className="mb-6 flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-xl font-black text-primary">
                    {student.name.slice(0, 1)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-lg font-extrabold tracking-tight text-foreground">
                      {student.name}
                    </div>
                    <div className="mt-1 text-xs font-semibold text-muted">
                      {student.email} · {student.phone}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
                  <div className="lg:col-span-12">
                    <Link
                      href="#bcb-archive"
                      className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-primary bg-primary/5 px-4 py-3.5 text-center text-xs font-black uppercase tracking-widest text-primary shadow-sm transition-colors hover:bg-primary hover:text-white"
                    >
                      <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                      </svg>
                      BCB Archive
                    </Link>
                  </div>
                  <div className="space-y-5 lg:col-span-8">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="rounded-2xl bg-background p-4">
                        <div className="text-[10px] font-black uppercase tracking-widest text-muted">
                          Ngày sinh
                        </div>
                        <div className="mt-1 text-sm font-bold text-foreground">{student.dob}</div>
                      </div>
                      <div className="rounded-2xl bg-background p-4">
                        <div className="text-[10px] font-black uppercase tracking-widest text-muted">
                          Cung hoàng đạo
                        </div>
                        <div className="mt-1 text-sm font-bold text-foreground">{student.zodiac}</div>
                      </div>
                      <div className="rounded-2xl bg-background p-4">
                        <div className="text-[10px] font-black uppercase tracking-widest text-muted">
                          Điểm đầu vào
                        </div>
                        <div className="mt-1 text-sm font-bold text-foreground">
                          {student.scores.overall} Overall
                        </div>
                      </div>
                      <div className="rounded-2xl bg-background p-4">
                        <div className="text-[10px] font-black uppercase tracking-widest text-muted">
                          Mục tiêu
                        </div>
                        <div className="mt-1 text-sm font-bold text-primary">{student.aim}</div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-primary/10 bg-white p-4">
                      <div className="mb-3 text-[10px] font-black uppercase tracking-widest text-muted">
                        Điểm đầu vào từng kỹ năng
                      </div>
                      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                        {[
                          { k: "Listening", v: student.scores.listening, c: "text-primary" },
                          { k: "Reading", v: student.scores.reading, c: "text-info" },
                          { k: "Writing", v: student.scores.writing, c: "text-secondary" },
                          { k: "Speaking", v: student.scores.speaking, c: "text-warning" },
                        ].map((s) => (
                          <div key={s.k} className="rounded-xl bg-background p-3">
                            <div className="text-[10px] font-black uppercase tracking-widest text-muted">
                              {s.k}
                            </div>
                            <div className={`mt-1 text-lg font-black ${s.c}`}>{s.v}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 lg:col-span-4">
                    <div className="rounded-2xl border border-primary/15 bg-primary/5 p-5">
                      <div className="text-center text-[10px] font-black uppercase tracking-widest text-muted">
                        Current Overall
                      </div>
                      <div className="mt-4 flex justify-center">
                        <div
                          className="flex h-32 w-32 shrink-0 items-center justify-center rounded-full border-[5px] border-primary bg-white shadow-sm"
                          aria-label={`Điểm overall ${student.scores.overall}`}
                        >
                          <span className="text-4xl font-black tabular-nums leading-none text-primary">
                            {student.scores.overall}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-secondary/20 bg-secondary/10 p-5">
                      <div className="text-[10px] font-black uppercase tracking-widest text-muted">
                        Countdown ngày thi
                      </div>
                      <div className="mt-1 text-sm font-bold text-foreground">
                        {student.examDate} · {student.countdown}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-1.5 h-6 bg-primary rounded-full"></div>
                <h3 className="text-sm font-black text-muted uppercase  ">
                  Study Habits & Learner&apos;s Situation
                </h3>
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="rounded-2xl bg-white p-6 shadow-soft">
                  <div className="text-[10px] font-black uppercase tracking-widest text-muted">
                    Study Habits
                  </div>
                  <div className="mt-4 space-y-4">
                    <HabitSelect
                      label="Phương pháp học hiệu quả nhất đối với bạn"
                      value={habitForm.method}
                      onValueChange={(v) => onHabitChange("method", v)}
                      options={studyHabitOptions.method}
                    />
                    <HabitSelect
                      label="Thời gian dành ra trong 1 tuần cho việc học IELTS"
                      value={habitForm.weeklyHours}
                      onValueChange={(v) => onHabitChange("weeklyHours", v)}
                      options={studyHabitOptions.weeklyHours}
                    />
                    <HabitSelect
                      label="Môi trường lớp học phù hợp với bạn"
                      value={habitForm.classEnvironment}
                      onValueChange={(v) => onHabitChange("classEnvironment", v)}
                      options={studyHabitOptions.classEnvironment}
                    />
                  </div>
                </div>
                <div className="rounded-2xl bg-white p-6 shadow-soft">
                  <div className="text-[10px] font-black uppercase tracking-widest text-muted">
                    Learner&apos;s Situation
                  </div>
                  <div className="mt-4 space-y-4">
                    <HabitSelect
                      label="IELTS với bạn là..."
                      value={habitForm.ieltsMeaning}
                      onValueChange={(v) => onHabitChange("ieltsMeaning", v)}
                      options={studyHabitOptions.ieltsMeaning}
                    />
                    <HabitSelect
                      label="Band điểm trước đây (nếu đã từng thi)"
                      value={habitForm.previousBand}
                      onValueChange={(v) => onHabitChange("previousBand", v)}
                      options={studyHabitOptions.previousBand}
                    />
                    <HabitSelect
                      label="Kỹ năng muốn được học tập trung"
                      value={habitForm.focusSkills}
                      onValueChange={(v) => onHabitChange("focusSkills", v)}
                      options={studyHabitOptions.focusSkills}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Section: RECENTLY VIEWED */}
            <section>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-1.5 h-6 bg-secondary rounded-full"></div>
                <h3 className="text-sm font-black text-muted uppercase  ">Đã xem gần đây</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {recentlyViewed.map((item) => (
                  <article
                    key={item.id}
                    className="bg-white rounded-2xl shadow-soft p-5 hover:shadow-hover transition-all duration-300 cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="text-sm font-extrabold text-foreground group-hover:text-primary transition-colors">
                          {item.title}
                        </div>
                        <div className="mt-1.5 text-xs font-medium text-muted flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded bg-background">{contentTypeLabel(item.type)}</span>
                          <span>•</span>
                          <span>{item.subject}</span>
                        </div>
                      </div>
                      <span
                        className={[
                          "inline-flex items-center rounded-lg px-2.5 py-1 text-[10px] font-black uppercase  ",
                          item.status === "completed"
                            ? "bg-success/10 text-success"
                            : item.status === "in_progress"
                              ? "bg-warning/10 text-warning"
                              : "bg-background text-muted",
                        ].join(" ")}
                      >
                        {statusLabel(item.status)}
                      </span>
                    </div>
                    <div className="mt-4 pt-4 border-t border-background flex items-center justify-between">
                      <div className="text-[10px] font-bold text-muted uppercase tracking-widest">
                        Vị trí đọc: <span className="text-foreground ml-1">{item.position}</span>
                      </div>
                      <div className="w-6 h-6 rounded-full bg-background flex items-center justify-center text-muted group-hover:bg-primary group-hover:text-white transition-all">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14M12 5l7 7-7 7"></path></svg>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            

            {/* Section: BCB Grading & Diagnosis */}
            <section id="bcb-archive">
              <div className="mb-6 flex items-center gap-2">
                <div className="h-6 w-1.5 rounded-full bg-primary"></div>
                <h3 className="text-sm font-black uppercase text-muted">
                  Bảng Chẩn Bệnh (BCB)
                </h3>
              </div>

              <div className="overflow-hidden rounded-2xl bg-white shadow-soft">
                <div className="divide-y divide-background">
                  {[
                    { k: "LISTENING", v: "Bạn hiểu phần lớn từ vựng trong nhiều chủ đề, kể cả thuật ngữ học thuật. Bạn nắm được nội dung, liên kết giữa các câu." },
                    { k: "READING", v: "Bạn sử dụng chiến thuật đọc hiệu quả để xác định thông tin chính. Hiểu được các lập luận trong văn bản học thuật." },
                    { k: "WRITING", v: "Nắm được yêu cầu của đề, biết cách phát triển ý. Cần cải thiện chính tả và ngữ pháp để bài mượt mà hơn." },
                    { k: "SPEAKING", v: "Nói tương đối rõ ràng nhưng đôi khi vẫn còn ngắt quãng. Cần mở rộng từ vựng cho các chủ đề học thuật phức tạp hơn." },
                    { k: "OVERALL", v: "Người dùng khá: Sử dụng ngôn ngữ hiệu quả, thỉnh thoảng có lỗi dùng từ chưa phù hợp. Hiểu được ngôn ngữ phức tạp.", primary: true },
                  ].map((item) => (
                    <div key={item.k} className="p-6 flex flex-col md:flex-row gap-6 hover:bg-background transition-colors">
                      <div className="w-24 shrink-0">
                        <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase   ${
                          item.primary ? 'bg-primary text-white shadow-premium' : 'bg-background text-muted'
                        }`}>
                          {item.k}
                        </span>
                      </div>
                      <div className="text-sm font-medium text-muted leading-relaxed">
                        {item.v}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
        </div>

      </div>
    </StudentLayout>
  );
}
