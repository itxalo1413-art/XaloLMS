"use client";

import Link from "next/link";
import { StudentLayout } from "@/app/StudentLayout";
import { AVATAR_IMAGE_ACCEPT, isAllowedAvatarImageFile } from "@/lib/avatarImage";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  defaultStudyHabitForm,
  studyHabitOptionLists,
} from "@/lib/studentProfileStudyOptions";
import { BcbGrammarTable } from "@/components/diagnosis/BcbGrammarTable";
import { BcbQuestionTypeTable } from "@/components/diagnosis/BcbQuestionTypeTable";
import { SkillDiagIntro } from "@/components/diagnosis/SkillDiagIntro";
import { WritingDiagIntro } from "@/components/diagnosis/WritingDiagIntro";
import { WritingScoreFormulaNote } from "@/components/diagnosis/WritingScoreFormulaNote";
import { SpeakingCriteriaPanel } from "@/components/diagnosis/SpeakingCriteriaPanel";
import { WritingTask1CriteriaPanel } from "@/components/diagnosis/WritingTask1CriteriaPanel";
import { WritingTask2CriteriaPanel } from "@/components/diagnosis/WritingTask2CriteriaPanel";
import { FocusSkillsSelfStudyHint } from "@/components/student/FocusSkillsSelfStudyHint";
import { Panel } from "@/components/student/ui";
import type { FocusSkill } from "@/lib/focusSkills";
import { formatBandScore } from "@/lib/formatBandScore";
import { useStudentDiagnosis } from "@/hooks/useStudentDiagnosis";
import { useStudentProfileDisplay } from "@/hooks/useStudentProfileDisplay";
import { saveStudentProfile, type StudentProfile } from "@/lib/studentProfile";

type StudyHabitForm = Pick<
  StudentProfile,
  "method" | "weeklyHours" | "classEnvironment" | "ieltsMeaning" | "previousBand" | "focusSkills"
>;

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
  const profile = useStudentProfileDisplay();
  const { diagnosis, writingBands } = useStudentDiagnosis();
  const [habitForm, setHabitForm] = useState<StudyHabitForm>({ ...defaultStudyHabitForm });

  // Diagnosis interactive states
  const [activeDiagTab, setActiveDiagTab] = useState<"listening" | "reading" | "writing" | "speaking" | "grammar">("listening");
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

  const [examDate, setExamDate] = useState(diagnosis.examDate);

  const [countdown, setCountdown] = useState("—");

  useEffect(() => {
    setExamDate(diagnosis.examDate);
  }, [diagnosis.examDate]);

  useEffect(() => {
    setHabitForm({
      method: profile.method,
      weeklyHours: profile.weeklyHours,
      classEnvironment: profile.classEnvironment,
      ieltsMeaning: profile.ieltsMeaning,
      previousBand: profile.previousBand,
      focusSkills: profile.focusSkills,
    });
  }, [
    profile.method,
    profile.weeklyHours,
    profile.classEnvironment,
    profile.ieltsMeaning,
    profile.previousBand,
    profile.focusSkills,
  ]);

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
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  const persistAvatar = (url: string) => {
    saveStudentProfile({ ...profile, avatarUrl: url });
    setShowAvatarPicker(false);
  };

  const onPickAvatarFile = (file: File | null) => {
    if (!file) return;
    if (!isAllowedAvatarImageFile(file)) {
      window.alert("Chỉ chấp nhận ảnh: JPG, PNG, GIF, WebP, SVG.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      persistAvatar(reader.result as string);
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
                       {profile.avatarUrl ? (
                         <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                       ) : (
                         <div className="w-full h-full flex items-center justify-center bg-primary/10 text-4xl font-black text-primary">
                           {profile.name.slice(0, 1)}
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
                              onClick={() => persistAvatar(av)}
                              className={`aspect-square rounded-2xl overflow-hidden border-2 transition-all hover:scale-105 ${profile.avatarUrl === av ? "border-primary ring-2 ring-primary/20" : "border-zinc-100 hover:border-primary/40"}`}
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
                      {profile.name}
                    </h1>
                    
                    <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
                      <div>
                        <div className="text-[10px] font-black text-muted uppercase tracking-widest mb-0.5">Contact Info</div>
                        <div className="text-xs font-bold text-foreground opacity-80">{profile.email} · {profile.phone}</div>
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
                        <div className="mt-1 text-sm font-bold text-foreground">{profile.dob}</div>
                      </div>

                      <div className="flex min-h-[5.25rem] flex-col justify-center rounded-2xl bg-background p-4">
                        <div className="text-[10px] font-black uppercase tracking-widest text-muted">
                          Cung hoàng đạo
                        </div>
                        <div className="mt-1 text-sm font-bold text-primary">{profile.zodiac}</div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-primary/10 bg-card p-4">
                      <div className="mb-3 text-[10px] font-black uppercase tracking-widest text-muted">
                        Điểm đầu vào từng kỹ năng
                      </div>
                      <div className="mb-3 grid grid-cols-1 gap-4 md:grid-cols-2 md:items-stretch">
                        <div className="flex min-h-[7.5rem] flex-col justify-center items-center rounded-2xl bg-background p-4 md:h-full">
                          <div className="text-[14px] font-black uppercase tracking-widest text-muted">
                            Điểm đầu vào
                          </div>
                          <div className="mt-1 text-md font-bold text-foreground text-warning">
                            {formatBandScore(diagnosis.scores.overall)} Overall
                          </div>
                        </div>
                        {diagnosis.bcbLink ? (
                          <a
                            href={diagnosis.bcbLink}
                            target="_blank"
                            rel="noopener noreferrer"
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
                              Mở Driver Bảng Chẩn Bệnh
                            </span>
                          </a>
                        ) : (
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
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:items-stretch">
                        {[
                          { k: "Listening", v: diagnosis.scores.listening },
                          { k: "Reading", v: diagnosis.scores.reading },
                          { k: "Writing", v: diagnosis.scores.writing },
                          { k: "Speaking", v: diagnosis.scores.speaking },
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
                          aria-label={`Mục tiêu ${diagnosis.aim}`}
                        >
                          <span className="text-4xl font-black tabular-nums leading-none text-primary">
                            {formatBandScore(diagnosis.aim)}
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
                  <FocusSkillsSelfStudyHint
                    focusSkills={habitForm.focusSkills as FocusSkill[]}
                  />
                </div>
              </Panel>
            </div>

            {/* Section: BCB Grading & Diagnosis */}
            <section id="bcb-archive">
              <Panel 
                title="Bảng Chẩn Bệnh Chi Tiết (BCB)"
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
                        <span className="block text-xl font-black leading-none text-primary">
                          {formatBandScore(diagnosis.scores.overall)}
                        </span>
                        <span className="mt-0.5 block text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                          Aim {formatBandScore(diagnosis.aim)}
                        </span>
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] font-black uppercase tracking-widest text-muted">Đánh giá chung</div>
                      <h4 className="text-md mt-0.5 font-bold text-foreground">{diagnosis.bcbOverviewTitle}</h4>
                      <p className="mt-1 w-full text-xs font-medium leading-relaxed text-zinc-500">
                        {diagnosis.bcbOverviewSummary}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex flex-wrap gap-2 mb-6 border-b border-zinc-100 pb-4">
                  {[
                    { id: "listening", label: "Listening", score: formatBandScore(diagnosis.scores.listening) },
                    { id: "reading", label: "Reading", score: formatBandScore(diagnosis.scores.reading) },
                    { id: "writing", label: "Writing", score: formatBandScore(diagnosis.scores.writing) },
                    { id: "speaking", label: "Speaking", score: formatBandScore(diagnosis.scores.speaking) },
                    { id: "grammar", label: "Ngữ pháp", score: null as string | null },
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
                      bandLabel={`Đặc trưng Band ${formatBandScore(diagnosis.scores.listening)}`}
                      summary={diagnosis.skillSummaries.listening}
                      submissionLink={diagnosis.listeningLink}
                      linkLabel="Xem bài Listening"
                    />
                    <BcbQuestionTypeTable rows={diagnosis.bcbListening} showWeakCta />
                  </div>
                )}

                {/* TAB CONTENT: READING */}
                {activeDiagTab === "reading" && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    <SkillDiagIntro
                      bandLabel={`Đặc trưng Band ${formatBandScore(diagnosis.scores.reading)}`}
                      summary={diagnosis.skillSummaries.reading}
                      submissionLink={diagnosis.readingLink}
                      linkLabel="Xem bài Reading"
                    />
                    <BcbQuestionTypeTable rows={diagnosis.bcbReading} showWeakCta />
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
                      summary={diagnosis.writingSummary[writingTaskMode]}
                      submissionLink={diagnosis.writingLinks[writingTaskMode]}
                    />

                    <div>
                      <div className="text-[10px] font-black text-muted uppercase tracking-widest mb-3">
                        Chi tiết tiêu chí chấm điểm - {writingTaskMode === "task1" ? "Writing Task 1" : "Writing Task 2"}
                      </div>
                      {writingTaskMode === "task1" ? (
                        <WritingTask1CriteriaPanel scores={diagnosis.writingCriteria.task1} />
                      ) : (
                        <WritingTask2CriteriaPanel scores={diagnosis.writingCriteria.task2} />
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
                        Đặc trưng Speaking Band {formatBandScore(diagnosis.scores.speaking)}
                      </div>
                      <p className="text-xs font-medium text-foreground leading-relaxed mt-2">
                        {diagnosis.skillSummaries.speaking}
                      </p>
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-muted uppercase tracking-widest mb-3">Chi tiết tiêu chí Speaking</div>
                      <SpeakingCriteriaPanel scores={diagnosis.speakingCriteria} />
                    </div>
                  </div>
                )}

                {activeDiagTab === "grammar" && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    <div className="p-5 rounded-2xl border border-zinc-100 bg-zinc-50/50">
                      <div className="text-[10px] font-black uppercase tracking-widest text-muted">
                        Tổng quan lỗi ngữ pháp (Writing & Speaking)
                      </div>
                      <p className="mt-2 text-xs font-medium leading-relaxed text-foreground">
                        Phát hiện {diagnosis.bcbGrammar.reduce((s, r) => s + r.errorCount, 0)} lỗi ngữ pháp
                        trên {diagnosis.bcbGrammar.length} chuyên đề.
                      </p>
                    </div>
                    <BcbGrammarTable
                      rows={diagnosis.bcbGrammar}
                      filter={grammarFilter}
                      onFilterChange={setGrammarFilter}
                    />
                  </div>
                )}


              </Panel>
            </section>
        </div>

      </div>
    </StudentLayout>
  );
}
