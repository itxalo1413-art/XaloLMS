"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AcaLayout } from "@/components/aca/AcaLayout";
import { AcaTopbar } from "@/components/aca/AcaTopbar";
import {
  cancelFinalTestRecord,
  FINAL_TEST_STATUS_LABELS,
  FINAL_TEST_TYPE_LABELS,
  FINAL_TEST_UPDATE_EVENT,
  listFinalTestRecords,
  updateFinalTestRecord,
  type FinalTestRecord,
  type FinalTestStatus,
  type FinalTestType,
} from "@/lib/finalTestArchive";
import {
  listEntranceTestBookings,
  ENTRANCE_STATUS_LABELS,
  ENTRANCE_TYPE_LABELS,
  ENTRANCE_BOOKINGS_UPDATE_EVENT,
  type EntranceTestBooking,
} from "@/lib/entranceTestBookings";
import { fetchAcaStudents, type AcaStudent } from "@/lib/acaManagementApi";
import { FinalTestBookingModal } from "@/components/sale/FinalTestBookingModal";
import { FinalTestBcbDrawer } from "@/components/sale/FinalTestBcbDrawer";
import {
  getMockTestTeacherOptions,
  MOCK_TEST_TEACHER_OPTIONS_EVENT,
  syncMockTestTeacherOptions,
} from "@/lib/mockTestTeacherNames";
import { getGraderMeetLink } from "@/lib/graderMeetLinks";

function formatDateDisplay(isoDate: string, time: string) {
  try {
    const [y, m, d] = isoDate.split("-");
    return `${d}/${m}/${y} • ${time}`;
  } catch {
    return `${isoDate} ${time}`;
  }
}

function statusBadge(status: FinalTestStatus) {
  return {
    scheduled: "bg-sky-50 text-sky-700 border-sky-200",
    in_progress: "bg-amber-50 text-amber-700 border-amber-200",
    graded: "bg-emerald-50 text-emerald-700 border-emerald-200",
    cancelled: "bg-zinc-100 text-zinc-600 border-zinc-200",
  }[status];
}

export default function AcaLuuTruTestPage() {
  const [records, setRecords] = useState<FinalTestRecord[]>([]);
  const [entranceBookings, setEntranceBookings] = useState<EntranceTestBooking[]>([]);
  const [students, setStudents] = useState<AcaStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [teacherOptions, setTeacherOptions] = useState<string[]>(() => getMockTestTeacherOptions());

  // Mode: "all" | "final" | "entrance"
  const [activeTab, setActiveTab] = useState<"final" | "entrance">("final");

  // Filters
  const [typeFilter, setTypeFilter] = useState<"all" | FinalTestType>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | FinalTestStatus>("all");
  const [examinerFilter, setExaminerFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  // Modal / Drawer
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activeBcbRecord, setActiveBcbRecord] = useState<FinalTestRecord | null>(null);

  // Quick grading modal
  const [gradingRecord, setGradingRecord] = useState<FinalTestRecord | null>(null);
  const [gradeS, setGradeS] = useState("");
  const [gradeW, setGradeW] = useState("");
  const [gradeL, setGradeL] = useState("");
  const [gradeR, setGradeR] = useState("");
  const [gradeOverall, setGradeOverall] = useState("");
  const [savingGrade, setSavingGrade] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [finalData, entranceData, studentData] = await Promise.all([
        listFinalTestRecords().catch(() => []),
        listEntranceTestBookings().catch(() => []),
        fetchAcaStudents().catch(() => []),
      ]);
      setRecords(finalData);
      setEntranceBookings(entranceData);
      setStudents(studentData);
    } catch (err) {
      console.error("Failed to load tests", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();

    const handleUpdate = () => {
      void loadData();
    };

    window.addEventListener(FINAL_TEST_UPDATE_EVENT, handleUpdate);
    window.addEventListener(ENTRANCE_BOOKINGS_UPDATE_EVENT, handleUpdate);
    return () => {
      window.removeEventListener(FINAL_TEST_UPDATE_EVENT, handleUpdate);
      window.removeEventListener(ENTRANCE_BOOKINGS_UPDATE_EVENT, handleUpdate);
    };
  }, [loadData]);

  useEffect(() => {
    void syncMockTestTeacherOptions().then(setTeacherOptions);
    const onTeachers = () => setTeacherOptions(getMockTestTeacherOptions());
    window.addEventListener(MOCK_TEST_TEACHER_OPTIONS_EVENT, onTeachers);
    return () => window.removeEventListener(MOCK_TEST_TEACHER_OPTIONS_EVENT, onTeachers);
  }, []);

  // Map student entrance scores by student name or phone or ID
  const studentEntranceMap = useMemo(() => {
    const map = new Map<
      string,
      { l?: string | number; r?: string | number; w?: string | number; s?: string | number; o?: string | number }
    >();
    students.forEach((st) => {
      if (st.scores) {
        if (st.id) map.set(st.id, st.scores);
        if (st.name) map.set(st.name.trim().toLowerCase(), st.scores);
        if (st.phone) map.set(st.phone.trim(), st.scores);
      }
    });
    return map;
  }, [students]);

  // Metrics
  const metrics = useMemo(() => {
    const totalFinal = records.length;
    const totalEntrance = entranceBookings.length;
    const scheduled = records.filter((r) => r.status === "scheduled").length;
    const inProgress = records.filter((r) => r.status === "in_progress").length;
    const graded = records.filter((r) => r.status === "graded").length;
    const passCount = records.filter(
      (r) => r.bcbData?.targetAchieved || parseFloat(r.scoreOverall || "0") >= 6.5
    ).length;

    return { totalFinal, totalEntrance, scheduled, inProgress, graded, passCount };
  }, [records, entranceBookings]);

  // Filtered Final Records
  const filteredFinalRecords = useMemo(() => {
    return records.filter((r) => {
      if (typeFilter !== "all" && r.testType !== typeFilter) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (examinerFilter !== "all" && r.examinerName !== examinerFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = r.candidateName.toLowerCase().includes(q);
        const matchPhone = r.candidatePhone.includes(q);
        const matchClass = (r.className || r.classCode || "").toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchClass) return false;
      }
      return true;
    });
  }, [records, typeFilter, statusFilter, examinerFilter, search]);

  // Filtered Entrance Bookings
  const filteredEntranceBookings = useMemo(() => {
    return entranceBookings.filter((b) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = b.candidateName.toLowerCase().includes(q);
        const matchPhone = b.candidatePhone.includes(q);
        if (!matchName && !matchPhone) return false;
      }
      return true;
    });
  }, [entranceBookings, search]);

  const handleCancel = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc muốn hủy ca Final Test của "${name}"?`)) return;
    try {
      await cancelFinalTestRecord(id);
      void loadData();
    } catch (err: any) {
      alert(err?.message || "Hủy ca thi thất bại");
    }
  };

  const openGradingModal = (r: FinalTestRecord) => {
    setGradingRecord(r);
    setGradeS(r.scoreSpeaking || "");
    setGradeW(r.scoreWriting || "");
    setGradeL(r.scoreListening || "");
    setGradeR(r.scoreReading || "");
    setGradeOverall(r.scoreOverall || "");
  };

  const handleSaveQuickGrade = async () => {
    if (!gradingRecord) return;
    setSavingGrade(true);
    try {
      let finalOverall = gradeOverall;
      if (!finalOverall && (gradeS || gradeW || gradeL || gradeR)) {
        const scores = [gradeS, gradeW, gradeL, gradeR]
          .map((s) => parseFloat(s))
          .filter((n) => !isNaN(n));
        if (scores.length > 0) {
          const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
          finalOverall = (Math.round(avg * 2) / 2).toFixed(1);
        }
      }

      const target = parseFloat(gradingRecord.targetBand || "6.5");
      const overallNum = parseFloat(finalOverall || "0");
      const targetAchieved = overallNum >= target;

      await updateFinalTestRecord(gradingRecord.id, {
        scoreSpeaking: gradeS || undefined,
        scoreWriting: gradeW || undefined,
        scoreListening: gradeL || undefined,
        scoreReading: gradeR || undefined,
        scoreOverall: finalOverall || undefined,
        status: "graded",
        bcbData: {
          ...(gradingRecord.bcbData || {
            strengths: "",
            weaknesses: "",
            solution: "",
          }),
          targetAchieved,
        },
      });

      setGradingRecord(null);
      void loadData();
    } catch (err: any) {
      alert(err?.message || "Lưu điểm thất bại");
    } finally {
      setSavingGrade(false);
    }
  };

  return (
    <AcaLayout>
      <div className="space-y-6">
        <AcaTopbar title="Lưu Trữ Bài Test" subtitle="Theo dõi điểm Entrance & xếp lịch Final Test" />

        {/* ── Banner ── */}
        <div className="rounded-2xl border border-primary/25 bg-gradient-to-r from-primary/10 via-primary/5 to-white p-5 flex flex-wrap items-center justify-between gap-4 shadow-soft">
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-primary">
              Phòng Học Vụ & Khảo Thí (ACA)
            </div>
            <h1 className="text-xl font-black text-zinc-900 mt-0.5">
              Lưu Trữ Bài Test (Entrance & Final Test)
            </h1>
            <p className="text-xs text-zinc-500 font-medium mt-1">
              Theo dõi điểm số đầu vào (Entrance), kết quả cuối khóa (Final Test), đánh giá mức tăng Band điểm và duyệt trả Bảng Chẩn Bệnh (BCB).
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-primary hover:bg-[#6a5acd] px-5 py-3 text-xs font-black text-white transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            + Tạo Ca Final Test Mới
          </button>
        </div>

        {/* ── Metric Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-2xs">
            <div className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Final Test</div>
            <div className="text-2xl font-black text-zinc-900 mt-1">{metrics.totalFinal}</div>
          </div>
          <div className="rounded-2xl border border-primary/20 bg-primary-soft/15 p-4 shadow-2xs">
            <div className="text-[10px] font-black uppercase tracking-wider text-primary">Entrance Test</div>
            <div className="text-2xl font-black text-primary mt-1">{metrics.totalEntrance}</div>
          </div>
          <div className="rounded-2xl border border-sky-200/80 bg-sky-50/50 p-4 shadow-2xs">
            <div className="text-[10px] font-black uppercase tracking-wider text-sky-600">Đã xếp lịch</div>
            <div className="text-2xl font-black text-sky-700 mt-1">{metrics.scheduled}</div>
          </div>
          <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-4 shadow-2xs">
            <div className="text-[10px] font-black uppercase tracking-wider text-emerald-600">Đã có điểm</div>
            <div className="text-2xl font-black text-emerald-700 mt-1">{metrics.graded}</div>
          </div>
          <div className="rounded-2xl border border-purple-200/80 bg-purple-50/50 p-4 shadow-2xs">
            <div className="text-[10px] font-black uppercase tracking-wider text-purple-600">Đạt Chuẩn Đầu Ra</div>
            <div className="text-2xl font-black text-purple-700 mt-1">{metrics.passCount}</div>
          </div>
        </div>

        {/* ── Main Tab Switcher (Final Test vs Entrance Test) ── */}
        <div className="flex items-center gap-2 border-b border-zinc-200 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab("final")}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === "final"
                ? "bg-primary text-white shadow-sm"
                : "text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            🎓 Final Test & Đối Chiếu Entrance ({records.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("entrance")}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === "entrance"
                ? "bg-primary text-white shadow-sm"
                : "text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            📝 Danh Sách Ca Thi Entrance Test ({entranceBookings.length})
          </button>
        </div>

        {/* ── Filters Bar ── */}
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {activeTab === "final" && (
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-100 border border-zinc-200/80 text-xs font-bold flex-wrap">
              {[
                { key: "all", label: "Tất cả" },
                { key: "full_4_skills", label: "Full 4 Kỹ Năng" },
                { key: "speaking", label: "Speaking" },
                { key: "writing", label: "Writing" },
                { key: "lr", label: "L & R" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setTypeFilter(tab.key as any)}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    typeFilter === tab.key
                      ? "bg-primary text-white font-black shadow-sm"
                      : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên, SĐT, lớp..."
              className="h-9 w-52 rounded-xl border border-zinc-200 bg-white px-3 text-xs text-zinc-900 placeholder-zinc-400 outline-none focus:border-primary shadow-xs"
            />
            {activeTab === "final" && (
              <>
                <select
                  value={examinerFilter}
                  onChange={(e) => setExaminerFilter(e.target.value)}
                  className="h-9 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-bold text-zinc-700 outline-none focus:border-primary cursor-pointer shadow-xs"
                >
                  <option value="all">Tất cả Giám khảo</option>
                  {teacherOptions.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="h-9 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-bold text-zinc-700 outline-none focus:border-primary cursor-pointer shadow-xs"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="scheduled">Đã xếp lịch</option>
                  <option value="in_progress">Đang chấm</option>
                  <option value="graded">Đã có điểm</option>
                  <option value="cancelled">Đã hủy</option>
                </select>
              </>
            )}
          </div>
        </div>

        {/* ── Table: FINAL TEST WITH ENTRANCE COMPARISON ── */}
        {activeTab === "final" ? (
          <div className="rounded-2xl border border-zinc-200 bg-white shadow-soft overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-xs font-semibold text-zinc-400">
                Đang tải danh sách bài test...
              </div>
            ) : filteredFinalRecords.length === 0 ? (
              <div className="p-12 text-center text-zinc-400 space-y-2">
                <div className="text-sm font-bold text-zinc-800">Không tìm thấy bài test nào</div>
                <p className="text-xs text-zinc-400">
                  Nhấn &quot;+ Tạo Ca Final Test Mới&quot; để xếp lịch thi cho học viên.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-200 bg-zinc-50/80 text-[10px] font-black uppercase tracking-wider text-zinc-500">
                      <th className="px-4 py-3.5">Thí sinh / Lớp</th>
                      <th className="px-4 py-3.5">Loại bài</th>
                      <th className="px-4 py-3.5">Giám khảo</th>
                      <th className="px-4 py-3.5">Thời gian thi</th>
                      <th className="px-4 py-3.5 bg-amber-50/60 border-l border-r border-amber-100 text-amber-900 text-center">
                        Điểm Entrance (Đầu Vào)
                      </th>
                      <th className="px-4 py-3.5 text-center">L</th>
                      <th className="px-4 py-3.5 text-center">R</th>
                      <th className="px-4 py-3.5 text-center">W</th>
                      <th className="px-4 py-3.5 text-center">S</th>
                      <th className="px-4 py-3.5 text-center bg-primary/5 text-primary">FINAL OVERALL</th>
                      <th className="px-4 py-3.5">Tăng Trưởng</th>
                      <th className="px-4 py-3.5 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 font-medium">
                    {filteredFinalRecords.map((r) => {
                      const ent =
                        (r.studentId && studentEntranceMap.get(r.studentId)) ||
                        studentEntranceMap.get(r.candidateName.trim().toLowerCase()) ||
                        studentEntranceMap.get(r.candidatePhone.trim()) ||
                        { l: 5.5, r: 5.0, w: 5.0, s: 5.5, o: 5.0 };

                      const entranceOverall = ent?.o ? Number(ent.o) : 5.0;
                      const finalOverall = parseFloat(r.scoreOverall || "0");
                      const growth = finalOverall > 0 ? (finalOverall - entranceOverall).toFixed(1) : null;

                      return (
                        <tr key={r.id} className="hover:bg-zinc-50/60 transition-colors">
                          <td className="px-4 py-3.5">
                            <div className="font-black text-zinc-900 text-sm">{r.candidateName}</div>
                            <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
                              {r.candidatePhone} • {r.className || r.classCode || "Chưa gán lớp"}
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="font-bold text-zinc-800">
                              {FINAL_TEST_TYPE_LABELS[r.testType]}
                            </span>
                            <div className="text-[10px] text-zinc-500 font-medium mt-0.5">
                              Target: {r.targetBand || "6.5"} Band
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="font-bold text-primary">{r.examinerName}</span>
                          </td>
                          <td className="px-4 py-3.5 font-mono text-zinc-700">
                            {formatDateDisplay(r.date, r.time)}
                          </td>

                          {/* Entrance Column */}
                          <td className="px-4 py-3.5 bg-amber-50/30 border-l border-r border-amber-100/60 text-center">
                            <div className="font-black text-amber-800 text-xs tabular-nums">
                              Overall: {entranceOverall.toFixed(1)}
                            </div>
                            <div className="text-[10px] font-mono text-amber-700/80 mt-0.5">
                              L:{ent.l || "—"} R:{ent.r || "—"} W:{ent.w || "—"} S:{ent.s || "—"}
                            </div>
                          </td>

                          {/* Final Test Scores */}
                          <td className="px-4 py-3.5 text-center font-bold text-zinc-800 tabular-nums">
                            {r.scoreListening || "—"}
                          </td>
                          <td className="px-4 py-3.5 text-center font-bold text-zinc-800 tabular-nums">
                            {r.scoreReading || "—"}
                          </td>
                          <td className="px-4 py-3.5 text-center font-bold text-zinc-800 tabular-nums">
                            {r.scoreWriting || "—"}
                          </td>
                          <td className="px-4 py-3.5 text-center font-bold text-zinc-800 tabular-nums">
                            {r.scoreSpeaking || "—"}
                          </td>
                          <td className="px-4 py-3.5 text-center bg-primary/5">
                            <span className="font-black text-primary text-sm tabular-nums">
                              {r.scoreOverall || "—"}
                            </span>
                          </td>

                          {/* Growth comparison */}
                          <td className="px-4 py-3.5">
                            {growth !== null ? (
                              <span
                                className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-black ${
                                  parseFloat(growth) >= 0
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : "bg-rose-50 text-rose-700 border border-rose-200"
                                }`}
                              >
                                {parseFloat(growth) >= 0 ? `+${growth}` : growth} Band
                              </span>
                            ) : (
                              <span className="text-zinc-400 text-xs italic">Chờ điểm Final</span>
                            )}
                          </td>

                          <td className="px-4 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => openGradingModal(r)}
                                className="rounded-lg border border-primary/30 bg-primary/10 text-primary hover:bg-primary hover:text-white px-2.5 py-1 text-[11px] font-black transition-all cursor-pointer shadow-xs"
                              >
                                Nhập điểm
                              </button>
                              <button
                                type="button"
                                onClick={() => setActiveBcbRecord(r)}
                                className="rounded-lg border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 px-2.5 py-1 text-[11px] font-black transition-all cursor-pointer shadow-xs"
                              >
                                BCB
                              </button>
                              {r.status !== "cancelled" && (
                                <button
                                  type="button"
                                  onClick={() => handleCancel(r.id, r.candidateName)}
                                  className="rounded-lg p-1 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                  title="Hủy ca thi"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          /* ── Table: ENTRANCE TEST BOOKINGS ── */
          <div className="rounded-2xl border border-zinc-200 bg-white shadow-soft overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-xs font-semibold text-zinc-400">
                Đang tải danh sách Entrance Test...
              </div>
            ) : filteredEntranceBookings.length === 0 ? (
              <div className="p-12 text-center text-zinc-400 space-y-2">
                <div className="text-sm font-bold text-zinc-800">Chưa có ca Entrance Test nào</div>
                <p className="text-xs text-zinc-400">
                  Các ca thi đánh giá năng lực đầu vào từ Sale / Lead BCB sẽ hiển thị tại đây.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-200 bg-zinc-50/80 text-[10px] font-black uppercase tracking-wider text-zinc-500">
                      <th className="px-4 py-3.5">Ứng viên / SĐT</th>
                      <th className="px-4 py-3.5">Kỹ năng Test</th>
                      <th className="px-4 py-3.5">Hình thức</th>
                      <th className="px-4 py-3.5">Grader chấm</th>
                      <th className="px-4 py-3.5">Thời gian thi</th>
                      <th className="px-4 py-3.5">Trạng thái</th>
                      <th className="px-4 py-3.5 text-center">Speaking</th>
                      <th className="px-4 py-3.5 text-center">Writing</th>
                      <th className="px-4 py-3.5 text-center">OVERALL</th>
                      <th className="px-4 py-3.5">Meet / Bài làm</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 font-medium">
                    {filteredEntranceBookings.map((b) => {
                      const meetUrl = b.meetLink || getGraderMeetLink(b.graderName);
                      return (
                        <tr key={b.id} className="hover:bg-zinc-50/60 transition-colors">
                          <td className="px-4 py-3.5">
                            <div className="font-black text-zinc-900 text-sm">{b.candidateName}</div>
                            <div className="text-[11px] text-zinc-500 font-mono mt-0.5">{b.candidatePhone}</div>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="font-bold text-zinc-800">
                              {ENTRANCE_TYPE_LABELS[b.type] || b.type}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="inline-flex rounded-md px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-zinc-100 text-zinc-700">
                              {b.format === "online" ? "🌐 Online (Meet)" : "🏫 Offline (TT)"}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 font-bold text-primary">{b.graderName}</td>
                          <td className="px-4 py-3.5 font-mono text-zinc-700">
                            {formatDateDisplay(b.date, b.time)}
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="inline-flex rounded-md px-2 py-0.5 text-[9px] font-black uppercase tracking-wider border bg-emerald-50 text-emerald-700 border-emerald-200">
                              {ENTRANCE_STATUS_LABELS[b.status] || "Đã xếp lịch"}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-center font-bold text-zinc-800 tabular-nums">
                            {b.scoreSpeaking || "—"}
                          </td>
                          <td className="px-4 py-3.5 text-center font-bold text-zinc-800 tabular-nums">
                            {b.scoreWriting || "—"}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <span className="font-black text-primary text-sm tabular-nums">
                              {b.scoreSpeaking || b.scoreWriting || "—"}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex flex-col gap-1">
                              {b.format === "online" && meetUrl && (
                                <a
                                  href={meetUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[11px] font-bold text-primary hover:underline"
                                >
                                  Link Meet ↗
                                </a>
                              )}
                              {b.submissionLink && (
                                <a
                                  href={b.submissionLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[11px] font-bold text-secondary hover:underline truncate max-w-[120px]"
                                >
                                  Bài nộp Docs ↗
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Quick Grade Modal ── */}
        {gradingRecord && (
          <div className="fixed inset-0 z-[120] flex items-start justify-center pt-16 sm:pt-20 p-4 overflow-y-auto">
            <button
              type="button"
              onClick={() => setGradingRecord(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md transition-all"
            />
            <div className="relative w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl space-y-4 animate-in fade-in slide-in-from-top-4 duration-200">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <div>
                  <h3 className="text-sm font-black text-zinc-900">Nhập Điểm Nhanh Final Test</h3>
                  <p className="text-xs text-zinc-500 font-medium">{gradingRecord.candidateName}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setGradingRecord(null)}
                  className="rounded-lg p-1 text-zinc-400 hover:text-zinc-700"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">Listening</label>
                  <input
                    type="text"
                    value={gradeL}
                    onChange={(e) => setGradeL(e.target.value)}
                    placeholder="VD: 6.5"
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 font-bold text-zinc-900 outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">Reading</label>
                  <input
                    type="text"
                    value={gradeR}
                    onChange={(e) => setGradeR(e.target.value)}
                    placeholder="VD: 7.0"
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 font-bold text-zinc-900 outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">Writing</label>
                  <input
                    type="text"
                    value={gradeW}
                    onChange={(e) => setGradeW(e.target.value)}
                    placeholder="VD: 6.0"
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 font-bold text-zinc-900 outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">Speaking</label>
                  <input
                    type="text"
                    value={gradeS}
                    onChange={(e) => setGradeS(e.target.value)}
                    placeholder="VD: 6.5"
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 font-bold text-zinc-900 outline-none focus:border-primary"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[11px] font-bold text-primary mb-1">
                    Overall Band (Tự động tính nếu để trống)
                  </label>
                  <input
                    type="text"
                    value={gradeOverall}
                    onChange={(e) => setGradeOverall(e.target.value)}
                    placeholder="Tự động tính từ 4 kỹ năng"
                    className="w-full rounded-xl border-2 border-primary/30 px-3 py-2 font-black text-primary text-sm outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setGradingRecord(null)}
                  className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-bold text-zinc-600 hover:bg-zinc-50"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={savingGrade}
                  onClick={handleSaveQuickGrade}
                  className="rounded-xl bg-primary hover:bg-[#6a5acd] text-white px-5 py-2 text-xs font-black transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {savingGrade ? "Đang lưu..." : "Lưu Điểm"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Booking Modal ── */}
        {isCreateOpen && (
          <FinalTestBookingModal
            onClose={() => setIsCreateOpen(false)}
            onSuccess={() => {
              void loadData();
            }}
          />
        )}

        {/* ── BCB Full Drawer ── */}
        {activeBcbRecord && (
          <FinalTestBcbDrawer
            record={activeBcbRecord}
            onClose={() => setActiveBcbRecord(null)}
            onSaved={() => {
              void loadData();
            }}
          />
        )}
      </div>
    </AcaLayout>
  );
}
