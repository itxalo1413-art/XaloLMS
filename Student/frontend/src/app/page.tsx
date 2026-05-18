"use client";

import { StudentLayout } from "@/app/StudentLayout";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  defaultStudyHabitForm,
  studyHabitOptionLists,
} from "@/lib/studentProfileStudyOptions";
import { Panel } from "@/components/student/ui";

const student = {
  name: "Dương Ngọc Khôi Nguyên",
  email: "nguyenduong939705@gmail.com",
  phone: "0947 188 794",
  dob: "20/08/2006",
  zodiac: "Sư Tử",
  examDate: "10/08/2026",
  countdown: "Còn 108 ngày",
  aim: "7.5",
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
  const [habitForm, setHabitForm] = useState({ ...defaultStudyHabitForm });

  const onHabitChange = (key: keyof typeof habitForm, value: string) => {
    setHabitForm((prev) => ({ ...prev, [key]: value }));
  };

  const [examDate, setExamDate] = useState("2026-08-10");

  const [countdown, setCountdown] = useState("—");

  useEffect(() => {
    const target = new Date(examDate);
    const now = new Date();
    const diffTime = target.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    setCountdown(diffDays > 0 ? `Còn ${diffDays} ngày` : "Đã quá ngày");
  }, [examDate]);

  const displayExamDate = useMemo(() => {
    if (!examDate) return "Chưa chọn";
    const [y, m, d] = examDate.split("-");
    return `${d}/${m}/${y}`;
  }, [examDate]);

  const examInputRef = useRef<HTMLInputElement>(null);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<{ name: string; type: string } | null>(null);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  const onPickAvatarFile = (file: File | null) => {
    if (!file) return;
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedAvatar(reader.result as string);
        setSelectedFile(null);
        setShowAvatarPicker(false);
      };
      reader.readAsDataURL(file);
      return;
    }
    setSelectedAvatar(null);
    setSelectedFile({ name: file.name, type: file.type });
    setShowAvatarPicker(false);
  };

  const avatars = [
    "/profile/Screenshot 2026-05-15 at 14.48.19.png",
    "/profile/Screenshot 2026-05-15 at 14.48.25.png",
    "/profile/Screenshot 2026-05-15 at 14.48.32.png",
    "/profile/Screenshot 2026-05-15 at 14.48.38.png",
    "/profile/Screenshot 2026-05-15 at 14.48.45.png",
    "/profile/Screenshot 2026-05-15 at 14.48.51.png",
  ];

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
              <Panel title="Hero Overview">
                <div className="mb-8 flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-10">
                  {/* Large Avatar with Badge */}
                  <div className="relative shrink-0 group">
                    <div className="w-32 h-32 md:w-40 md:h-40 rounded-[32px] bg-gradient-to-br from-zinc-100 to-zinc-200 overflow-hidden shadow-soft border-4 border-white relative cursor-pointer"
                         onClick={() => setShowAvatarPicker(!showAvatarPicker)}>
                       {selectedAvatar ? (
                         <img src={selectedAvatar} alt="Avatar" className="w-full h-full object-cover" />
                       ) : selectedFile ? (
                         <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-primary/5 px-3 text-center">
                           <svg className="h-10 w-10 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                             <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                             <path d="M14 3v6h6" />
                           </svg>
                           <span className="line-clamp-2 text-[10px] font-bold leading-tight text-foreground">{selectedFile.name}</span>
                         </div>
                       ) : (
                         <div className="w-full h-full flex items-center justify-center bg-primary/10 text-4xl font-black text-primary">
                           {student.name.slice(0, 1)}
                         </div>
                       )}
                       {/* Hover Overlay */}
                       <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M3 9a2 2 0 0 1 2-2h.93a2 2 0 0 0 1.664-.89l.812-1.22A2 2 0 0 1 10.07 4h3.86a2 2 0 0 1 1.664.89l.812 1.22A2 2 0 0 0 18.07 7H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z" /><circle cx="12" cy="13" r="3" /></svg>
                       </div>
                    </div>

                    <input
                      ref={avatarFileInputRef}
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        onPickAvatarFile(e.target.files?.[0] ?? null);
                        e.target.value = "";
                      }}
                    />

                    {/* Avatar Picker Popover */}
                    {showAvatarPicker && (
                      <div className="absolute top-full left-0 mt-4 p-4 bg-white rounded-3xl shadow-2xl border border-zinc-100 z-50 w-72 md:w-80 animate-in fade-in slide-in-from-top-2">
                        <div className="text-[10px] font-black text-muted uppercase tracking-widest mb-3 px-1">Ảnh đại diện mẫu</div>
                        <div className="grid grid-cols-3 gap-3">
                          {avatars.map((av, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setSelectedAvatar(av);
                                setSelectedFile(null);
                                setShowAvatarPicker(false);
                              }}
                              className={`aspect-square rounded-2xl overflow-hidden border-2 transition-all hover:scale-105 ${selectedAvatar === av ? 'border-primary ring-2 ring-primary/20' : 'border-zinc-100 hover:border-primary/40'}`}
                            >
                              <img src={av} alt={`Sample ${idx}`} className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>

                        <div className="my-4 border-t border-zinc-100" />

                        <div className="mb-2 px-1 text-[10px] font-black uppercase tracking-widest text-muted">
                          Chọn file từ máy
                        </div>
                        <button
                          type="button"
                          onClick={() => avatarFileInputRef.current?.click()}
                          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-primary/30 bg-primary/5 px-4 py-3 text-xs font-bold text-primary transition-colors hover:bg-primary/10"
                        >
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                          </svg>
                          Tải ảnh hoặc file lên
                        </button>
                        <p className="mt-2 px-1 text-[10px] font-medium text-muted">
                          Hỗ trợ ảnh, PDF, Word và các định dạng khác.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <h1 className="text-3xl md:text-5xl font-black text-foreground tracking-tight leading-[1.1] mb-4">
                      {student.name}
                    </h1>
                    
                    <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
                      <div>
                        <div className="text-[10px] font-black text-muted uppercase tracking-widest mb-0.5">Contact Info</div>
                        <div className="text-xs font-bold text-foreground opacity-80">{student.email} · {student.phone}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-stretch">
                  <div className="space-y-5 lg:col-span-8">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:items-stretch">
                      <div className="flex min-h-[5.25rem] flex-col justify-center rounded-2xl bg-background p-4">
                        <div className="text-[10px] font-black uppercase tracking-widest text-muted">
                          Ngày sinh
                        </div>
                        <div className="mt-1 text-sm font-bold text-foreground">{student.dob}</div>
                      </div>

                      <div className="flex min-h-[5.25rem] flex-col justify-center rounded-2xl bg-background p-4">
                        <div className="text-[10px] font-black uppercase tracking-widest text-muted">
                          Cung hoàng đạo
                        </div>
                        <div className="mt-1 text-sm font-bold text-primary">{student.zodiac}</div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-primary/10 bg-white p-4">
                      <div className="mb-3 text-[10px] font-black uppercase tracking-widest text-muted">
                        Điểm đầu vào từng kỹ năng
                      </div>
                      <div className="mb-3 grid grid-cols-1 gap-4 md:grid-cols-2 md:items-stretch">
                        <div className="flex min-h-[7.5rem] flex-col justify-center rounded-2xl bg-background p-4 md:h-full">
                          <div className="text-[10px] font-black uppercase tracking-widest text-muted">
                            Điểm đầu vào
                          </div>
                          <div className="mt-1 text-sm font-bold text-foreground">
                            {student.scores.overall} Overall
                          </div>
                        </div>
                        <Link
                          href="#bcb-archive"
                          className="group flex min-h-[7.5rem] h-full flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-primary bg-white px-4 py-3 text-center shadow-sm ring-1 ring-primary/10 transition-all hover:bg-primary hover:shadow-md md:h-full"
                        >
                          <svg
                            className="h-5 w-5 shrink-0 text-primary transition-colors group-hover:text-white"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.25"
                            aria-hidden
                          >
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                          </svg>
                          <span className="text-[11px] font-black uppercase tracking-widest text-primary transition-colors group-hover:text-white">
                            BCB Archive
                          </span>
                          <span className="text-[9px] font-semibold leading-tight text-muted transition-colors group-hover:text-white/85">
                            Mở bảng chẩn đoán
                          </span>
                        </Link>
                      </div>

                      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:items-stretch">
                        {[
                          { k: "Listening", v: student.scores.listening, c: "text-primary" },
                          { k: "Reading", v: student.scores.reading, c: "text-info" },
                          { k: "Writing", v: student.scores.writing, c: "text-secondary" },
                          { k: "Speaking", v: student.scores.speaking, c: "text-warning" },
                        ].map((s) => (
                          <div
                            key={s.k}
                            className="flex min-h-[5.25rem] flex-col justify-center rounded-xl bg-background p-3 md:h-full"
                          >
                            <div className="text-[10px] font-black uppercase tracking-widest text-muted">
                              {s.k}
                            </div>
                            <div className={`mt-1 text-lg font-black ${s.c}`}>{s.v}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 lg:col-span-4">
                    <div className="flex flex-1 flex-col rounded-2xl border border-primary/15 bg-primary/5 p-5">
                      <div className="text-center text-[10px] font-black uppercase tracking-widest text-muted">
                        Mục tiêu
                      </div>
                      <div className="mt-4 flex flex-1 flex-col items-center justify-center">
                        <div
                          className="flex h-32 w-32 shrink-0 items-center justify-center rounded-full border-[5px] border-primary bg-white shadow-sm"
                          aria-label={`Điểm overall ${student.scores.overall}`}
                        >
                          <span className="text-4xl font-black tabular-nums leading-none text-primary">
                            {student.aim}
                          </span>
                        </div>

                      </div>
                    </div>
                    <div 
                      className="flex flex-col justify-center rounded-2xl border border-secondary/20 bg-secondary/10 p-5 group relative overflow-hidden cursor-pointer"
                      onClick={() => {
                        try {
                          examInputRef.current?.showPicker();
                        } catch (e) {
                          examInputRef.current?.focus();
                        }
                      }}
                    >
                      <input 
                        ref={examInputRef}
                        type="date" 
                        value={examDate}
                        onChange={(e) => setExamDate(e.target.value)}
                        className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-pointer"
                      />
                      <div className="text-[10px] font-black uppercase tracking-widest text-muted relative z-10">
                        Ngày thi dự kiến & Countdown
                      </div>
                      <div className="mt-2 flex items-center gap-3 relative z-10">
                        <div className="flex-1">
                          <div className="text-sm font-extrabold text-foreground">
                            {displayExamDate}
                          </div>
                          <div className="text-[11px] font-bold text-secondary mt-0.5">
                            {countdown}
                          </div>
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-secondary pointer-events-none">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Panel>
            </section>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Panel title="Study Habits">
                <div className="space-y-4 pt-2">
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
              </Panel>
              <Panel title="Learner's Situation">
                <div className="space-y-4 pt-2">
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
              </Panel>
            </div>

            {/* Section: BCB Grading & Diagnosis */}
            <section id="bcb-archive">
              <Panel title="Bảng Chẩn Bệnh (BCB)">
                <div className="divide-y divide-background">
                  {[
                    { k: "LISTENING", v: "Bạn hiểu phần lớn từ vựng trong nhiều chủ đề, kể cả thuật ngữ học thuật. Bạn nắm được nội dung, liên kết giữa các câu." },
                    { k: "READING", v: "Bạn sử dụng chiến thuật đọc hiệu quả để xác định thông tin chính. Hiểu được các lập luận trong văn bản học thuật." },
                    { k: "WRITING", v: "Nắm được yêu cầu của đề, biết cách phát triển ý. Cần cải thiện chính tả và ngữ pháp để bài mượt mà hơn." },
                    { k: "SPEAKING", v: "Nói tương đối rõ ràng nhưng đôi khi vẫn còn ngắt quãng. Cần mở rộng từ vựng cho các chủ đề học thuật phức tạp hơn." },
                    { k: "OVERALL", v: "Người dùng khá: Sử dụng ngôn ngữ hiệu quả, thỉnh thoảng có lỗi dùng từ chưa phù hợp. Hiểu được ngôn ngữ phức tạp.", primary: true },
                  ].map((item) => (
                    <div key={item.k} className="py-6 flex flex-col md:flex-row gap-6 hover:bg-background transition-colors">
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
              </Panel>
            </section>
        </div>

      </div>
    </StudentLayout>
  );
}
