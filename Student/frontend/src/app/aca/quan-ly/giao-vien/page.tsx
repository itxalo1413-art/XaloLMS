"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AcaLayout } from "@/components/aca/AcaLayout";
import { AcaTopbar } from "@/components/aca/AcaTopbar";
import {
  fetchAcaClasses,
  fetchAcaStudents,
  type AcaClass,
  type AcaStudent,
} from "@/lib/acaManagementApi";
import {
  refreshWritingSubmissionsForTeacher,
  type WritingSubmission,
} from "@/lib/writingSubmissions";
import {
  fetchTeacherProfilesAsync,
  addTeacherProfileAsync,
  updateTeacherProfileAsync,
  deleteTeacherProfileAsync,
  type TeacherProfile,
} from "@/lib/acaTeacherStore";

import {
  refreshMockTestRequestsForAca,
  type MockTestRequest,
} from "@/lib/mockTestRequests";
import { isSpeakingMockTest } from "@/lib/selfStudyFormat";

// Mock Current Date Context for LMS calculation: June 19, 2026
const CURRENT_DATE = new Date(2026, 5, 19);

const AVAILABLE_SKILLS = ["Writing", "Speaking", "Reading", "Listening", "Quản lý", "Chăm sóc học viên"];

interface TeacherFullStats {
  profile: TeacherProfile;
  classes: AcaClass[];
  totalSubmissions: number;
  gradedCount: number;
  speakingDoneCount: number;
  lateCount: number;
  onTimeRate: number;
  submissions: Array<{
    sub: WritingSubmission;
    studentName: string;
    classCode: string;
    className: string;
    daysTaken: number;
    isLate: boolean;
  }>;
}

export default function AcaTeacherManagementPage() {
  const [profiles, setProfiles] = useState<TeacherProfile[]>([]);
  const [classes, setClasses] = useState<AcaClass[]>([]);
  const [students, setStudents] = useState<AcaStudent[]>([]);
  const [mockTests, setMockTests] = useState<MockTestRequest[]>([]);
  const [submissions, setSubmissions] = useState<WritingSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const [detailSubFilter, setDetailSubFilter] = useState<"all" | "late">("all");

  // Modal State for Add / Edit
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<TeacherProfile | null>(null);
  const [formFields, setFormFields] = useState({
    name: "",
    email: "",
    phone: "",
    skills: [] as string[],
    status: "active" as "active" | "inactive",
    joinDate: "01/01/2024",
    notes: "",
  });
  const [formError, setFormError] = useState<string | null>(null);

  // Delete Confirmation State
  const [deleteConfirmTeacher, setDeleteConfirmTeacher] = useState<TeacherProfile | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Read teacher profiles from database (or local fallback)
      const profs = await fetchTeacherProfilesAsync();
      setProfiles(profs);

      const [clsList, stList, mtList] = await Promise.all([
        fetchAcaClasses(),
        fetchAcaStudents(),
        refreshMockTestRequestsForAca(),
      ]);
      setClasses(clsList);
      setStudents(stList);
      setMockTests(mtList);

      // Load Writing submissions
      const subList = await refreshWritingSubmissionsForTeacher("all");
      setSubmissions(subList);
    } catch (err) {
      console.error(err);
      setError("Không thể tải dữ liệu giáo viên. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Map student ID to student details & their teacher/class
  const studentMap = useMemo(() => {
    const map: Record<string, { student: AcaStudent; classObj?: AcaClass }> = {};
    for (const st of students) {
      const classObj = classes.find((c) => c.id === st.classId);
      map[st.id] = { student: st, classObj };
    }
    return map;
  }, [students, classes]);

  // Combine teacher profiles with classes and grading statistics
  const fullStatsList = useMemo((): TeacherFullStats[] => {
    if (profiles.length === 0) return [];

    const map: Record<string, TeacherFullStats> = {};

    for (const prof of profiles) {
      map[prof.name.trim().toLowerCase()] = {
        profile: prof,
        classes: [],
        totalSubmissions: 0,
        gradedCount: 0,
        speakingDoneCount: 0,
        lateCount: 0,
        onTimeRate: 100,
        submissions: [],
      };
    }

    // Match classes with teachers by name
    for (const c of classes) {
      const tName = (c.teacher || "").trim().toLowerCase();
      if (tName && map[tName]) {
        map[tName].classes.push(c);
      }
    }

    // Process Speaking mock test completions
    for (const mt of mockTests) {
      if (isSpeakingMockTest(mt.skill) && mt.score?.trim()) {
        const tName = (mt.examTeacher || "").trim().toLowerCase();
        if (tName && map[tName]) {
          map[tName].speakingDoneCount++;
        }
      }
    }

    // Process submissions and attribute to teachers / graders
    for (const sub of submissions) {
      let tName = (sub.assignedGrader || "").trim().toLowerCase();
      if (!tName || !map[tName]) {
        const studentInfo = studentMap[sub.studentId];
        if (studentInfo && studentInfo.classObj) {
          tName = (studentInfo.classObj.teacher || "").trim().toLowerCase();
        }
      }
      if (!tName || !map[tName]) continue;

      const subDate = new Date(sub.submittedAt);
      let daysTaken = 0;
      let isLate = false;

      if (sub.status === "graded") {
        const gradeDate = sub.gradedAt ? new Date(sub.gradedAt) : CURRENT_DATE;
        const diffTime = gradeDate.getTime() - subDate.getTime();
        daysTaken = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
        isLate = daysTaken > 10;
      } else {
        const diffTime = CURRENT_DATE.getTime() - subDate.getTime();
        daysTaken = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
        isLate = daysTaken > 10;
      }

      map[tName].totalSubmissions++;
      if (sub.status === "graded") {
        map[tName].gradedCount++;
      }
      if (isLate) {
        map[tName].lateCount++;
      }

      const studentName = studentMap[sub.studentId]?.student.name || sub.studentName || "Học viên";
      const classCode = studentMap[sub.studentId]?.classObj?.classCode || "W-SUB";
      const className = studentMap[sub.studentId]?.classObj?.name || "Bài nộp W";

      map[tName].submissions.push({
        sub,
        studentName,
        classCode,
        className,
        daysTaken,
        isLate,
      });
    }

    return Object.values(map).map((stat) => {
      const onTimeRate =
        stat.totalSubmissions > 0
          ? Math.round(
              ((stat.totalSubmissions - stat.lateCount) / stat.totalSubmissions) * 100
            )
          : 100;

      stat.submissions.sort(
        (a, b) =>
          new Date(b.sub.submittedAt).getTime() - new Date(a.sub.submittedAt).getTime()
      );

      return {
        ...stat,
        onTimeRate,
      };
    });
  }, [profiles, classes, submissions, studentMap]);

  // Filtered teachers list based on search and status filter
  const filteredTeachers = useMemo(() => {
    let list = fullStatsList;

    if (statusFilter !== "all") {
      list = list.filter((item) => item.profile.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (item) =>
          item.profile.name.toLowerCase().includes(q) ||
          item.profile.email.toLowerCase().includes(q) ||
          item.profile.phone.toLowerCase().includes(q) ||
          item.profile.skills.some((s) => s.toLowerCase().includes(q))
      );
    }

    // Sort: Late count desc, then active first, then name
    return [...list].sort((a, b) => {
      if (b.lateCount !== a.lateCount) return b.lateCount - a.lateCount;
      if (a.profile.status !== b.profile.status) return a.profile.status === "active" ? -1 : 1;
      return a.profile.name.localeCompare(b.profile.name, "vi");
    });
  }, [fullStatsList, searchQuery, statusFilter]);

  // Selected teacher stats detail
  const selectedTeacher = useMemo(() => {
    if (!selectedTeacherId) return null;
    return fullStatsList.find((t) => t.profile.id === selectedTeacherId) || null;
  }, [fullStatsList, selectedTeacherId]);

  // Filtered submissions for selected teacher
  const filteredSubmissions = useMemo(() => {
    if (!selectedTeacher) return [];
    let list = selectedTeacher.submissions;
    if (detailSubFilter === "late") {
      list = list.filter((s) => s.isLate);
    }
    return list;
  }, [selectedTeacher, detailSubFilter]);

  // Overall KPI Summary
  const kpiSummary = useMemo(() => {
    const totalTeachers = profiles.length;
    const activeTeachers = profiles.filter((p) => p.status === "active").length;
    const totalLate = fullStatsList.reduce((acc, curr) => acc + curr.lateCount, 0);
    const avgOnTime =
      fullStatsList.length > 0
        ? Math.round(
            fullStatsList.reduce((acc, curr) => acc + curr.onTimeRate, 0) /
              fullStatsList.length
          )
        : 100;

    return { totalTeachers, activeTeachers, totalLate, avgOnTime };
  }, [profiles, fullStatsList]);

  // Modal Handlers
  const handleOpenAdd = () => {
    setEditingTeacher(null);
    setFormFields({
      name: "",
      email: "",
      phone: "",
      skills: ["Writing", "Speaking"],
      status: "active",
      joinDate: new Date().toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
      notes: "",
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (profile: TeacherProfile, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingTeacher(profile);
    setFormFields({
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      skills: profile.skills || [],
      status: profile.status,
      joinDate: profile.joinDate || "01/01/2024",
      notes: profile.notes || "",
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleToggleSkill = (skill: string) => {
    setFormFields((prev) => {
      const has = prev.skills.includes(skill);
      const nextSkills = has
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill];
      return { ...prev, skills: nextSkills };
    });
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFields.name.trim()) {
      setFormError("Vui lòng nhập họ và tên giáo viên.");
      return;
    }
    if (!formFields.email.trim()) {
      setFormError("Vui lòng nhập email giáo viên.");
      return;
    }

    if (editingTeacher) {
      // Edit mode
      await updateTeacherProfileAsync(editingTeacher.id, {
        name: formFields.name.trim(),
        email: formFields.email.trim(),
        phone: formFields.phone.trim(),
        skills: formFields.skills,
        status: formFields.status,
        joinDate: formFields.joinDate,
        notes: formFields.notes.trim(),
      });
    } else {
      // Add mode
      await addTeacherProfileAsync({
        name: formFields.name.trim(),
        email: formFields.email.trim(),
        phone: formFields.phone.trim(),
        skills: formFields.skills,
        status: formFields.status,
        joinDate: formFields.joinDate,
        notes: formFields.notes.trim(),
      });
    }

    setIsFormOpen(false);
    void loadData();
  };

  const handleConfirmDelete = (profile: TeacherProfile, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDeleteConfirmTeacher(profile);
  };

  const executeDelete = async () => {
    if (!deleteConfirmTeacher) return;
    await deleteTeacherProfileAsync(deleteConfirmTeacher.id);
    if (selectedTeacherId === deleteConfirmTeacher.id) {
      setSelectedTeacherId(null);
    }
    setDeleteConfirmTeacher(null);
    void loadData();
  };

  return (
    <AcaLayout>
      <AcaTopbar
        title="Quản lý Giáo viên & Hiệu suất"
        subtitle="Danh sách giáo viên, thông tin chuyên môn, lịch giảng dạy và theo dõi thời hạn chấm bài (Tối đa 10 ngày)."
      />
      <main className="mx-auto w-full px-6 py-6 pb-16 md:px-8 space-y-6">
        {error && (
          <div className="rounded-xl bg-rose-50 border border-rose-100 p-4 text-xs font-semibold text-rose-600">
            {error}
          </div>
        )}

        {/* Top Summary Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Tổng giáo viên</span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-black text-zinc-900">{kpiSummary.totalTeachers}</span>
              <span className="text-xs font-bold text-zinc-500">Giảng viên</span>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Đang hoạt động</span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-black text-emerald-600">{kpiSummary.activeTeachers}</span>
              <span className="text-xs font-bold text-emerald-600/80">Đang dạy</span>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Tỷ lệ đúng hạn TB</span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-black text-primary">{kpiSummary.avgOnTime}%</span>
              <span className="text-xs font-bold text-primary/80">Hoàn thành</span>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Bài trễ hạn (&gt;10n)</span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className={`text-2xl font-black ${kpiSummary.totalLate > 0 ? "text-rose-600 animate-pulse" : "text-zinc-400"}`}>
                {kpiSummary.totalLate}
              </span>
              <span className="text-xs font-bold text-rose-600/80">Bài trễ</span>
            </div>
          </div>
        </div>

        {/* Main Workspace Layout */}
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3 items-start">
            {/* Left list: Teachers Table */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm">
                {/* Search box */}
                <div className="relative flex-1 min-w-[200px]">
                  <input
                    type="text"
                    placeholder="Tìm tên, email, sđt, kỹ năng..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 px-4 py-2 text-xs font-semibold outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>

                {/* Status filter tabs */}
                <div className="flex bg-zinc-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setStatusFilter("all")}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${
                      statusFilter === "all" ? "bg-white text-zinc-950 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
                    }`}
                  >
                    Tất cả
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter("active")}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${
                      statusFilter === "active" ? "bg-white text-emerald-700 shadow-sm" : "text-zinc-500 hover:text-emerald-600"
                    }`}
                  >
                    Đang dạy
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter("inactive")}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${
                      statusFilter === "inactive" ? "bg-white text-zinc-700 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
                    }`}
                  >
                    Tạm nghỉ
                  </button>
                </div>

                {/* Add Teacher Button */}
                <button
                  type="button"
                  onClick={handleOpenAdd}
                  className="rounded-xl bg-primary text-white hover:bg-primary/90 px-4 py-2 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Thêm giáo viên
                </button>
              </div>

              {/* Teachers Table */}
              <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50 border-b border-zinc-200 text-[10px] font-black uppercase tracking-wider text-zinc-400">
                      <tr>
                        <th className="px-5 py-4">Giáo viên</th>
                        <th className="px-5 py-4">Kỹ năng</th>
                        <th className="px-5 py-4">Lớp dạy</th>
                        <th className="px-4 py-4 text-center">Chấm W</th>
                        <th className="px-4 py-4 text-center">Test S</th>
                        <th className="px-4 py-4 text-center">Trễ hạn</th>
                        <th className="px-4 py-4 text-center">Tỷ lệ</th>
                        <th className="px-5 py-4 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 font-semibold text-zinc-700">
                      {filteredTeachers.length > 0 ? (
                        filteredTeachers.map((t) => {
                          const isSelected = selectedTeacherId === t.profile.id;
                          return (
                            <tr
                              key={t.profile.id}
                              onClick={() => {
                                setSelectedTeacherId(t.profile.id);
                                setDetailSubFilter("all");
                              }}
                              className={`hover:bg-zinc-50/60 transition-colors cursor-pointer ${
                                isSelected ? "bg-primary-soft/35 hover:bg-primary-soft/50" : ""
                              }`}
                            >
                              {/* Teacher info */}
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="h-9 w-9 rounded-full bg-primary/10 text-primary font-black text-xs flex items-center justify-center shrink-0">
                                    {t.profile.name.charAt(0)}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-zinc-950 text-xs">{t.profile.name}</span>
                                      <span
                                        className={`inline-block h-2 w-2 rounded-full ${
                                          t.profile.status === "active" ? "bg-emerald-500" : "bg-zinc-300"
                                        }`}
                                        title={t.profile.status === "active" ? "Đang dạy" : "Tạm nghỉ"}
                                      />
                                    </div>
                                    <div className="text-[10px] text-zinc-400 font-medium mt-0.5">{t.profile.email}</div>
                                  </div>
                                </div>
                              </td>

                              {/* Skills */}
                              <td className="px-5 py-4">
                                <div className="flex flex-wrap gap-1">
                                  {t.profile.skills && t.profile.skills.length > 0 ? (
                                    t.profile.skills.map((sk) => (
                                      <span
                                        key={sk}
                                        className="rounded bg-primary/10 text-primary px-1.5 py-0.5 text-[9px] font-bold"
                                      >
                                        {sk}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-zinc-400">—</span>
                                  )}
                                </div>
                              </td>

                              {/* Classes */}
                              <td className="px-5 py-4 max-w-[140px]">
                                <div className="flex flex-wrap gap-1">
                                  {t.classes.slice(0, 2).map((c) => (
                                    <span
                                      key={c.id}
                                      className="rounded bg-zinc-100 px-1.5 py-0.5 text-[9px] text-zinc-600 font-bold"
                                    >
                                      {c.classCode}
                                    </span>
                                  ))}
                                  {t.classes.length > 2 && (
                                    <span className="rounded bg-zinc-100 px-1 py-0.5 text-[9px] text-zinc-400 font-bold">
                                      +{t.classes.length - 2}
                                    </span>
                                  )}
                                  {t.classes.length === 0 && <span className="text-zinc-400">—</span>}
                                </div>
                              </td>

                              {/* Graded W */}
                              <td className="px-4 py-4 text-center tabular-nums text-purple-700 font-bold">
                                {t.gradedCount}
                              </td>

                              {/* Test S */}
                              <td className="px-4 py-4 text-center tabular-nums text-emerald-600 font-bold">
                                {t.speakingDoneCount}
                              </td>

                              {/* Late */}
                              <td className="px-4 py-4 text-center tabular-nums">
                                {t.lateCount > 0 ? (
                                  <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-black text-rose-700">
                                    {t.lateCount}
                                  </span>
                                ) : (
                                  <span className="text-zinc-400">0</span>
                                )}
                              </td>

                              {/* On time rate */}
                              <td className="px-4 py-4 text-center">
                                <span
                                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                    t.onTimeRate >= 90
                                      ? "bg-emerald-50 text-emerald-700"
                                      : t.onTimeRate >= 70
                                      ? "bg-amber-50 text-amber-700"
                                      : "bg-rose-50 text-rose-700"
                                  }`}
                                >
                                  {t.onTimeRate}%
                                </span>
                              </td>

                              {/* Actions */}
                              <td className="px-5 py-4 text-right">
                                <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    type="button"
                                    onClick={(e) => handleOpenEdit(t.profile, e)}
                                    className="rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 p-1.5 text-zinc-600 transition-colors"
                                    title="Chỉnh sửa giáo viên"
                                  >
                                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                                    </svg>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => handleConfirmDelete(t.profile, e)}
                                    className="rounded-lg border border-rose-200 bg-rose-50/50 hover:bg-rose-100 p-1.5 text-rose-600 transition-colors"
                                    title="Xóa giáo viên"
                                  >
                                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <polyline points="3 6 5 6 21 6" />
                                      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                                    </svg>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={7} className="px-5 py-8 text-center text-zinc-400 font-medium">
                            Không tìm thấy giáo viên nào phù hợp.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right sidebar: Teacher Detailed Profile & Submission History */}
            <div className="space-y-4">
              {selectedTeacher ? (
                <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm space-y-4">
                  {/* Top Header info */}
                  <div className="flex items-start justify-between border-b border-zinc-100 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-2xl bg-primary text-white font-black text-sm flex items-center justify-center shadow-soft shrink-0">
                        {selectedTeacher.profile.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-black text-zinc-900">{selectedTeacher.profile.name}</h3>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${
                              selectedTeacher.profile.status === "active"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-zinc-100 text-zinc-500"
                            }`}
                          >
                            {selectedTeacher.profile.status === "active" ? "Đang dạy" : "Tạm nghỉ"}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-500 font-medium mt-0.5">{selectedTeacher.profile.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(selectedTeacher.profile)}
                        className="rounded-lg bg-zinc-100 hover:bg-zinc-200 px-2.5 py-1 text-[10px] font-bold text-zinc-700 transition-colors"
                      >
                        Sửa
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedTeacherId(null)}
                        className="rounded-lg p-1 text-zinc-400 hover:text-zinc-600 transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* Profile Key Details Grid */}
                  <div className="grid grid-cols-2 gap-3 bg-zinc-50/70 p-3 rounded-xl text-xs space-y-1">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Số điện thoại</span>
                      <p className="font-bold text-zinc-800 mt-0.5">{selectedTeacher.profile.phone || "Chưa cập nhật"}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Ngày bắt đầu</span>
                      <p className="font-bold text-zinc-800 mt-0.5">{selectedTeacher.profile.joinDate || "—"}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Kỹ năng giảng dạy</span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {selectedTeacher.profile.skills.map((sk) => (
                          <span key={sk} className="rounded bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-bold">
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>
                    {selectedTeacher.profile.notes && (
                      <div className="col-span-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Ghi chú chuyên môn</span>
                        <p className="font-medium text-zinc-600 text-[11px] italic mt-0.5">"{selectedTeacher.profile.notes}"</p>
                      </div>
                    )}
                  </div>

                  {/* Teaching Classes */}
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1.5">Lớp giảng dạy</div>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedTeacher.classes.length > 0 ? (
                        selectedTeacher.classes.map((c) => (
                          <div key={c.id} className="rounded-lg bg-white border border-zinc-200 px-2.5 py-1 text-xs font-bold text-zinc-800 shadow-2xs">
                            {c.classCode} <span className="text-zinc-400 font-normal">({c.name})</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-xs text-zinc-400 font-medium">Chưa được gán lớp học nào.</span>
                      )}
                    </div>
                  </div>

                  {/* Submission filter switches */}
                  <div className="pt-2 border-t border-zinc-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black uppercase text-zinc-900">Chi tiết lịch sử chấm bài</h4>
                      <span className="text-[10px] font-bold text-zinc-400">Tỷ lệ đúng hạn: {selectedTeacher.onTimeRate}%</span>
                    </div>

                    <div className="flex bg-zinc-100 p-1 rounded-xl w-full">
                      <button
                        type="button"
                        onClick={() => setDetailSubFilter("all")}
                        className={`flex-1 text-center py-1.5 rounded-lg text-[10px] font-black uppercase transition-all duration-200 ${
                          detailSubFilter === "all" ? "bg-white text-zinc-950 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
                        }`}
                      >
                        Tất cả ({selectedTeacher.totalSubmissions})
                      </button>
                      <button
                        type="button"
                        onClick={() => setDetailSubFilter("late")}
                        className={`flex-1 text-center py-1.5 rounded-lg text-[10px] font-black uppercase transition-all duration-200 ${
                          detailSubFilter === "late" ? "bg-white text-rose-700 shadow-sm" : "text-zinc-500 hover:text-rose-600"
                        }`}
                      >
                        Chấm chậm ({selectedTeacher.lateCount})
                      </button>
                    </div>
                  </div>

                  {/* Submissions List */}
                  <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                    {filteredSubmissions.length > 0 ? (
                      filteredSubmissions.map((item) => {
                        const subDate = new Date(item.sub.submittedAt);
                        const formattedSubDate = subDate.toLocaleDateString("vi-VN", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        });

                        return (
                          <div
                            key={item.sub.id}
                            className={`p-3 rounded-xl border transition-all ${
                              item.isLate
                                ? "bg-rose-50/40 border-rose-100 hover:bg-rose-50/60"
                                : "bg-zinc-50/40 border-zinc-100 hover:bg-zinc-50/60"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-black text-zinc-900">{item.studentName}</span>
                              <span
                                className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${
                                  item.isLate
                                    ? "bg-rose-100 text-rose-700"
                                    : item.sub.status === "graded"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-amber-100 text-amber-700"
                                }`}
                              >
                                {item.isLate
                                  ? `Trễ hạn ${item.daysTaken - 10} ngày`
                                  : item.sub.status === "graded"
                                  ? "Đúng hạn"
                                  : "Đang chờ"}
                              </span>
                            </div>

                            <div className="mt-1.5 space-y-1 text-[10px] text-zinc-500 font-semibold leading-relaxed">
                              <div>
                                <span className="text-zinc-400">Lớp:</span> {item.classCode} — {item.className}
                              </div>
                              <div>
                                <span className="text-zinc-400">Ngày nộp:</span> {formattedSubDate}
                              </div>
                              {item.sub.status === "graded" && item.sub.gradedAt && (
                                <div>
                                  <span className="text-zinc-400">Ngày chấm:</span>{" "}
                                  {new Date(item.sub.gradedAt).toLocaleDateString("vi-VN", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                  })}
                                </div>
                              )}
                              <div>
                                <span className="text-zinc-400">Thời gian phản hồi:</span> {item.daysTaken} ngày
                              </div>
                              {item.sub.score && (
                                <div>
                                  <span className="text-zinc-400">Điểm số:</span>{" "}
                                  <span className="font-bold text-primary">{item.sub.score}</span>
                                </div>
                              )}
                            </div>

                            <div className="mt-2.5 pt-2 border-t border-zinc-100 flex items-center justify-between">
                              <a
                                href={item.sub.examLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[9px] font-bold text-primary hover:underline"
                              >
                                Xem bài làm học viên ↗
                              </a>
                              <span className="text-[9px] text-zinc-400 font-bold uppercase">{item.sub.type || "Writing"}</span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center text-zinc-400 py-8 font-medium text-xs">
                        Không có bài nộp nào thuộc bộ lọc này.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-zinc-50 border border-dashed border-zinc-200 rounded-2xl p-8 text-center text-zinc-400 text-xs font-semibold">
                  Chọn một giáo viên từ danh sách bên trái để xem đầy đủ thông tin cá nhân, danh sách lớp và lịch sử chấm bài.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Add / Edit Teacher Modal */}
        {isFormOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-premium space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <h3 className="text-sm font-black uppercase tracking-wider text-zinc-950">
                  {editingTeacher ? "Chỉnh sửa thông tin Giáo viên" : "Thêm Giáo viên mới"}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="text-zinc-400 hover:text-zinc-600 text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              {formError && (
                <div className="rounded-xl bg-rose-50 border border-rose-100 p-3 text-xs font-semibold text-rose-600">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSaveForm} className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500">
                    Họ và tên giáo viên <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formFields.name}
                    onChange={(e) => setFormFields({ ...formFields, name: e.target.value })}
                    placeholder="VD: Lê Nguyễn Khánh Thi"
                    className="mt-1 block w-full h-11 rounded-xl border border-zinc-200 px-3.5 text-xs font-semibold outline-none focus:border-primary shadow-sm"
                  />
                </div>

                {/* Email & Phone */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500">
                      Email liên hệ <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={formFields.email}
                      onChange={(e) => setFormFields({ ...formFields, email: e.target.value })}
                      placeholder="teacher@xalo.edu.vn"
                      className="mt-1 block w-full h-11 rounded-xl border border-zinc-200 px-3.5 text-xs font-semibold outline-none focus:border-primary shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Số điện thoại</label>
                    <input
                      type="text"
                      value={formFields.phone}
                      onChange={(e) => setFormFields({ ...formFields, phone: e.target.value })}
                      placeholder="0901 234 567"
                      className="mt-1 block w-full h-11 rounded-xl border border-zinc-200 px-3.5 text-xs font-semibold outline-none focus:border-primary shadow-sm"
                    />
                  </div>
                </div>

                {/* Status & Join Date */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Trạng thái hoạt động</label>
                    <select
                      value={formFields.status}
                      onChange={(e) => setFormFields({ ...formFields, status: e.target.value as "active" | "inactive" })}
                      className="mt-1 block w-full h-11 rounded-xl border border-zinc-200 px-3 text-xs font-semibold outline-none focus:border-primary bg-white shadow-sm"
                    >
                      <option value="active">Đang dạy (Hoạt động)</option>
                      <option value="inactive">Tạm nghỉ</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Ngày bắt đầu dạy</label>
                    <input
                      type="text"
                      value={formFields.joinDate}
                      onChange={(e) => setFormFields({ ...formFields, joinDate: e.target.value })}
                      placeholder="dd/mm/yyyy"
                      className="mt-1 block w-full h-11 rounded-xl border border-zinc-200 px-3.5 text-xs font-semibold outline-none focus:border-primary shadow-sm"
                    />
                  </div>
                </div>

                {/* Skills Checkboxes */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Kỹ năng &amp; Chuyên môn</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {AVAILABLE_SKILLS.map((sk) => {
                      const isChecked = formFields.skills.includes(sk);
                      return (
                        <button
                          key={sk}
                          type="button"
                          onClick={() => handleToggleSkill(sk)}
                          className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all border ${
                            isChecked
                              ? "bg-primary text-white border-primary shadow-2xs"
                              : "bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100"
                          }`}
                        >
                          {isChecked ? "✓ " : "+ "}{sk}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Ghi chú chuyên môn</label>
                  <textarea
                    rows={3}
                    value={formFields.notes}
                    onChange={(e) => setFormFields({ ...formFields, notes: e.target.value })}
                    placeholder="Ghi chú về giảng dạy, kinh nghiệm..."
                    className="mt-1 block w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs outline-none focus:border-primary shadow-sm resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="rounded-xl bg-zinc-50 text-zinc-600 hover:bg-zinc-100 px-4 py-2 text-xs font-bold transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-primary text-white hover:bg-primary/90 px-5 py-2 text-xs font-black uppercase tracking-wider transition-colors shadow-sm"
                  >
                    {editingTeacher ? "Lưu thay đổi" : "Tạo giáo viên"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirmTeacher && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-premium space-y-4">
              <div className="flex items-center gap-3 text-rose-600">
                <div className="h-10 w-10 rounded-xl bg-rose-50 flex items-center justify-center font-bold">
                  ⚠️
                </div>
                <div>
                  <h3 className="text-sm font-black text-zinc-950 uppercase">Xác nhận xóa</h3>
                  <p className="text-xs text-zinc-500">Thao tác này không thể hoàn tác.</p>
                </div>
              </div>

              <p className="text-xs text-zinc-600 leading-relaxed">
                Bạn có chắc chắn muốn xóa giáo viên <strong className="text-zinc-900">{deleteConfirmTeacher.name}</strong> khỏi danh sách quản lý ACA?
              </p>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmTeacher(null)}
                  className="rounded-xl bg-zinc-100 text-zinc-700 hover:bg-zinc-200 px-4 py-2 text-xs font-bold transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={executeDelete}
                  className="rounded-xl bg-rose-600 text-white hover:bg-rose-700 px-4 py-2 text-xs font-black uppercase tracking-wider transition-colors shadow-sm"
                >
                  Xóa giáo viên
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </AcaLayout>
  );
}
