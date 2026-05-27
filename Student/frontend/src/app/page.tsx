"use client";

import Link from "next/link";
import { StudentLayout } from "@/app/StudentLayout";
import { AVATAR_IMAGE_ACCEPT, isAllowedAvatarImageFile } from "@/lib/avatarImage";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  defaultStudyHabitForm,
  studyHabitOptionLists,
} from "@/lib/studentProfileStudyOptions";
import { Panel } from "@/components/student/ui";
import { formatBandScore } from "@/lib/formatBandScore";

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

function HabitMultiSelect({
  label,
  values,
  onValuesChange,
  options,
}: {
  label: string;
  values: string[];
  onValuesChange: (next: string[]) => void;
  options: readonly string[];
}) {
  const [draft, setDraft] = useState<string[]>(values);
  const [confirmed, setConfirmed] = useState(true);

  useEffect(() => {
    setDraft(values);
    setConfirmed(true);
  }, [values]);

  const draftMatchesConfirmed =
    confirmed &&
    draft.length === values.length &&
    draft.every((v) => values.includes(v));

  const toggle = (option: string) => {
    setConfirmed(false);
    setDraft((prev) =>
      prev.includes(option) ? prev.filter((v) => v !== option) : [...prev, option],
    );
  };

  const onConfirm = () => {
    if (draft.length === 0) return;
    onValuesChange(draft);
    setConfirmed(true);
  };

  return (
    <div>
      <label className="text-xs font-semibold text-zinc-600">{label}</label>
      <p className="mt-1 text-[10px] font-medium text-muted">Có thể chọn nhiều kỹ năng, sau đó bấm Xác nhận</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = draft.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => toggle(option)}
              aria-pressed={selected}
              className={`rounded-2xl border px-3 py-2 text-xs font-bold transition-all ${
                selected
                  ? "border-primary bg-primary text-white shadow-sm"
                  : "border-zinc-200 bg-white text-foreground hover:border-primary/30"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>

      <div
        className={`mt-3 rounded-2xl border px-4 py-3 ${
          draftMatchesConfirmed
            ? "border-primary/20 bg-primary/5"
            : "border-amber-200 bg-amber-50/80"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-muted">
              {draftMatchesConfirmed ? "Đã xác nhận" : "Đang chọn"}
            </div>
            <div className="mt-0.5 text-sm font-bold text-foreground">
              {draft.length > 0
                ? `${draft.length}/${options.length} kỹ năng`
                : "Chưa chọn kỹ năng nào"}
            </div>
            {draft.length > 0 ? (
              <p className="mt-1 text-[11px] font-medium text-muted">{draft.join(", ")}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onConfirm}
            disabled={draft.length === 0}
            className="shrink-0 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Xác nhận ({draft.length})
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [habitForm, setHabitForm] = useState({ ...defaultStudyHabitForm });

  // Diagnosis interactive states
  const [activeDiagTab, setActiveDiagTab] = useState<"listening" | "reading" | "writing" | "speaking" | "grammar">("listening");
  const [expandedRubric, setExpandedRubric] = useState<string | null>(null);
  const [grammarFilter, setGrammarFilter] = useState<"all" | "red" | "yellow">("all");
  const [expandedGrammarId, setExpandedGrammarId] = useState<string | null>(null);
  
  // Speaking mock player state
  const [isPlayingSpeaking, setIsPlayingSpeaking] = useState(false);
  const [speakingPlaybackProgress, setSpeakingPlaybackProgress] = useState(35); // percent
  const [writingTaskMode, setWritingTaskMode] = useState<"task1" | "task2">("task1");

  const onHabitChange = (
    key: Exclude<keyof typeof habitForm, "focusSkills">,
    value: string,
  ) => {
    setHabitForm((prev) => ({
      ...prev,
      [key]: value as (typeof prev)[typeof key],
    }));
  };

  const onFocusSkillsChange = (values: string[]) => {
    const allowed = studyHabitOptions.focusSkills;
    setHabitForm((prev) => ({
      ...prev,
      focusSkills: values.filter((v): v is (typeof prev.focusSkills)[number] =>
        (allowed as readonly string[]).includes(v),
      ),
    }));
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
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  const onPickAvatarFile = (file: File | null) => {
    if (!file) return;
    if (!isAllowedAvatarImageFile(file)) {
      window.alert("Chỉ chấp nhận ảnh: JPG, PNG, GIF, WebP, SVG.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedAvatar(reader.result as string);
      setShowAvatarPicker(false);
    };
    reader.readAsDataURL(file);
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
                      accept={AVATAR_IMAGE_ACCEPT}
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
                          Tải ảnh từ máy
                        </button>
                        <p className="mt-2 px-1 text-[10px] font-medium text-muted">
                          JPG, PNG, GIF, WebP hoặc SVG.
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
                        <div className="flex min-h-[7.5rem] flex-col justify-center items-center rounded-2xl bg-background p-4 md:h-full">
                          <div className="text-[14px] font-black uppercase tracking-widest text-muted">
                            Điểm đầu vào
                          </div>
                          <div className="mt-1 text-md font-bold text-foreground text-warning">
                            {formatBandScore(student.scores.overall)} Overall
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
                          { k: "Listening", v: student.scores.listening },
                          { k: "Reading", v: student.scores.reading },
                          { k: "Writing", v: student.scores.writing },
                          { k: "Speaking", v: student.scores.speaking },
                        ].map((s) => (
                          <div
                            key={s.k}
                            className="flex min-h-[5.25rem] flex-col justify-center rounded-xl bg-background p-3 md:h-full"
                          >
                            <div className="text-[10px] font-black uppercase tracking-widest text-muted">
                              {s.k}
                            </div>
                            <div className="mt-1 text-lg font-black tabular-nums text-warning">
                              {formatBandScore(s.v)}
                            </div>
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
                            {formatBandScore(student.aim)}
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
                      <div className="relative z-10 flex flex-col items-center text-center">
                        <div className="text-[10px] font-black uppercase tracking-widest text-muted">
                          Ngày thi dự kiến & Countdown
                        </div>
                        <div className="mt-2 flex items-center justify-center gap-3">
                          <div>
                            <div className="text-sm font-extrabold text-foreground">
                              {displayExamDate}
                            </div>
                            <div className="mt-0.5 text-[11px] font-bold text-secondary">
                              {countdown}
                            </div>
                          </div>
                          <div className="pointer-events-none flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-secondary shadow-sm">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          </div>
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
                  <HabitMultiSelect
                    label="Kỹ năng muốn được học tập trung"
                    values={habitForm.focusSkills}
                    onValuesChange={onFocusSkillsChange}
                    options={studyHabitOptions.focusSkills}
                  />
                </div>
              </Panel>
            </div>

            {/* Section: BCB Grading & Diagnosis */}
            <section id="bcb-archive">
              <Panel 
                title="Bảng Chẩn Bệnh Chi Tiết (BCB)"
                right={
                  <span className="text-[10px] font-black text-primary px-3 py-1 bg-primary/10 rounded-full border border-primary/10">
                    Mã Hồ Sơ: XL_KN_2006
                  </span>
                }
              >
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
                      <div className="text-[10px] font-black uppercase tracking-widest text-muted">Đánh giá chung</div>
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
                            <button className="mt-4 w-full py-2 bg-secondary text-white rounded-xl text-xs font-bold transition-all hover:bg-secondary/90 shadow-sm">
                              Luyện tập Dạng bài ngay
                            </button>
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
                            <button className="mt-4 w-full py-2 bg-secondary text-white rounded-xl text-xs font-bold transition-all hover:bg-secondary/90 shadow-sm">
                              Luyện tập Dạng bài ngay
                            </button>
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
                                      <div className="mt-4 p-3 rounded-xl bg-primary/5 text-[11px] font-bold text-primary flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                        Mục tiêu lên Band 8: Tăng độ chính xác khi dùng cấu trúc phức và collocations hiếm.
                                      </div>
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

                    {/* Speaking Premium Player Mock */}


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


              </Panel>
            </section>
        </div>

      </div>
    </StudentLayout>
  );
}
