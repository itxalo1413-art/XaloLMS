"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AcaLayout } from "@/components/aca/AcaLayout";
import { AcaTopbar } from "@/components/aca/AcaTopbar";
import {
  loadMockTestRequests,
  createMockTestRequest,
  removeMockTestRequest,
  updateMockTestRequest,
  MOCK_TEST_UPDATE_EVENT,
  type MockTestRequest,
} from "@/lib/mockTestRequests";
import {
  listFinalTestRecords,
  updateFinalTestRecord,
  FINAL_TEST_UPDATE_EVENT,
  type FinalTestRecord,
} from "@/lib/finalTestArchive";
import { getGraderMeetLink, saveGraderMeetLink } from "@/lib/graderMeetLinks";
import { fetchAcaStudents, type AcaStudent } from "@/lib/acaManagementApi";
import { formatBandScore } from "@/lib/formatBandScore";

const GRADER_OPTIONS = [
  "Gia Phú",
  "Diệu Linh",
  "Ms. Thanh Tâm",
  "Mr. Alex",
  "Lê Nguyễn Khánh Thi",
  "Nghiêm Doãn Quỳnh Châu",
  "Lê Minh Trang",
  "Phạm Hoàng An",
  "Trần Thu Lan",
  "Ms. Lan Anh",
] as const;

export interface SpeakingRegistrationItem {
  id: string;
  source: "mock_test" | "final_test";
  originalId: string;
  studentId: string;
  studentName: string;
  studentPhone: string;
  studentEmail?: string;
  className: string;
  testTypeLabel: string;
  date: string;
  time: string;
  graderName: string;
  meetLink: string;
  status: "scheduled" | "in_progress" | "graded" | "cancelled";
  scoreSpeaking?: string;
  notes?: string;
  createdAt: string;
}

export default function AcaTestSpeakingPage() {
  const [items, setItems] = useState<SpeakingRegistrationItem[]>([]);
  const [students, setStudents] = useState<AcaStudent[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [graderFilter, setGraderFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "mock_test" | "final_test">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "graded">("all");

  // Add / Edit modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SpeakingRegistrationItem | null>(null);

  // Grade Modal
  const [gradingItem, setGradingItem] = useState<SpeakingRegistrationItem | null>(null);
  const [gradeScore, setGradeScore] = useState("");
  const [gradeFeedback, setGradeFeedback] = useState("");

  // Form fields
  const [formStudentName, setFormStudentName] = useState("");
  const [formStudentPhone, setFormStudentPhone] = useState("");
  const [formStudentEmail, setFormStudentEmail] = useState("");
  const [formClassName, setFormClassName] = useState("Solidifying — T357");
  const [formTestType, setFormTestType] = useState<"mock_test" | "final_test">("mock_test");
  const [formDate, setFormDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [formTime, setFormTime] = useState("19:30");
  const [formGrader, setFormGrader] = useState<string>("Gia Phú");
  const [formMeetLink, setFormMeetLink] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Load mock test speaking requests
      const mockReqs = loadMockTestRequests();
      const mockSpeaking: SpeakingRegistrationItem[] = mockReqs
        .filter((r) => r.skill.toLowerCase().includes("speaking") || r.skill.toLowerCase().includes("full"))
        .map((r) => {
          const dStr = `${r.year}-${String(r.month + 1).padStart(2, "0")}-${String(r.day).padStart(2, "0")}`;
          const gName = r.examTeacher || "Gia Phú";
          return {
            id: `mock-${r.id}`,
            source: "mock_test",
            originalId: r.id,
            studentId: r.studentId,
            studentName: r.studentName,
            studentPhone: "0947 188 794",
            studentEmail: undefined,
            className: "Mock Speaking Practice",
            testTypeLabel: "Mock Test Speaking",
            date: dStr,
            time: r.examTime || "19:30",
            graderName: gName,
            meetLink: getGraderMeetLink(gName) || "https://meet.google.com/vdy-dhpa-djj",
            status: r.score ? "graded" : r.status === "approved" ? "scheduled" : "in_progress",
            scoreSpeaking: r.score || undefined,
            notes: r.note || r.notes || undefined,
            createdAt: r.requestedAt || new Date().toISOString(),
          };
        });

      // 2. Load final test records (Speaking or Full 4 skills)
      const finalRecords = await listFinalTestRecords();
      const finalSpeaking: SpeakingRegistrationItem[] = finalRecords
        .filter((r) => r.testType === "speaking" || r.testType === "full_4_skills")
        .map((r) => {
          const gName = r.graderSpeaking || r.examinerName || "Gia Phú";
          return {
            id: `final-${r.id}`,
            source: "final_test",
            originalId: r.id,
            studentId: r.studentId || "std-unknown",
            studentName: r.candidateName,
            studentPhone: r.candidatePhone,
            studentEmail: r.candidateEmail,
            className: r.classCode || r.className || "Final M311025",
            testTypeLabel: "Final Test Speaking",
            date: r.date,
            time: r.time,
            graderName: gName,
            meetLink: r.meetLink || getGraderMeetLink(gName) || "https://meet.google.com/vdy-dhpa-djj",
            status: r.status,
            scoreSpeaking: r.scoreSpeaking || undefined,
            notes: r.note || r.feedback || undefined,
            createdAt: r.createdAt || new Date().toISOString(),
          };
        });

      // Combine & sort by date desc
      const combined = [...finalSpeaking, ...mockSpeaking].sort(
        (a, b) => new Date(`${b.date}T${b.time || "00:00"}`).getTime() - new Date(`${a.date}T${a.time || "00:00"}`).getTime()
      );

      setItems(combined);

      // Load students list for quick selector
      const stList = await fetchAcaStudents().catch(() => []);
      setStudents(stList);
    } catch (err) {
      console.error("Failed to load speaking registrations", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
    window.addEventListener(MOCK_TEST_UPDATE_EVENT, loadData);
    window.addEventListener(FINAL_TEST_UPDATE_EVENT, loadData);
    window.addEventListener("storage", loadData);
    return () => {
      window.removeEventListener(MOCK_TEST_UPDATE_EVENT, loadData);
      window.removeEventListener(FINAL_TEST_UPDATE_EVENT, loadData);
      window.removeEventListener("storage", loadData);
    };
  }, [loadData]);

  // Unique list of Graders in active items + defaults
  const activeGraders = useMemo(() => {
    const set = new Set<string>(GRADER_OPTIONS);
    items.forEach((it) => {
      if (it.graderName) set.add(it.graderName);
    });
    return Array.from(set);
  }, [items]);

  // Filtered List
  const filtered = useMemo(() => {
    return items.filter((it) => {
      if (graderFilter !== "all" && it.graderName !== graderFilter) return false;
      if (typeFilter !== "all" && it.source !== typeFilter) return false;
      if (statusFilter === "pending" && it.status === "graded") return false;
      if (statusFilter === "graded" && it.status !== "graded") return false;

      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchName = it.studentName.toLowerCase().includes(q);
        const matchPhone = it.studentPhone.includes(q);
        const matchClass = it.className.toLowerCase().includes(q);
        const matchGrader = it.graderName.toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchClass && !matchGrader) return false;
      }

      return true;
    });
  }, [items, graderFilter, typeFilter, statusFilter, search]);

  // Stats Metrics
  const stats = useMemo(() => {
    const total = items.length;
    const pending = items.filter((i) => i.status !== "graded").length;
    const graded = items.filter((i) => i.status === "graded").length;
    const graderCount = activeGraders.length;
    return { total, pending, graded, graderCount };
  }, [items, activeGraders]);

  // Quick Change Grader
  const handleAssignGrader = async (item: SpeakingRegistrationItem, nextGrader: string) => {
    try {
      if (item.source === "final_test") {
        await updateFinalTestRecord(item.originalId, {
          graderSpeaking: nextGrader,
          examinerName: nextGrader,
        });
      } else {
        updateMockTestRequest(item.originalId, {
          examTeacher: nextGrader,
        });
      }
      void loadData();
    } catch (err: any) {
      alert("Lỗi khi đổi Grader phụ trách: " + err.message);
    }
  };

  // Grade Submission
  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingItem) return;
    try {
      if (gradingItem.source === "final_test") {
        await updateFinalTestRecord(gradingItem.originalId, {
          scoreSpeaking: gradeScore.trim(),
          status: "graded",
          feedback: gradeFeedback.trim() || undefined,
        });
      } else {
        updateMockTestRequest(gradingItem.originalId, {
          score: gradeScore.trim(),
          status: "approved",
          notes: gradeFeedback.trim() || undefined,
        });
      }
      setGradingItem(null);
      setGradeScore("");
      setGradeFeedback("");
      void loadData();
    } catch (err: any) {
      alert("Lỗi nhập điểm: " + err.message);
    }
  };

  // Save Add / Edit
  const handleSaveAddModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formStudentName.trim()) {
      alert("Vui lòng nhập tên học viên.");
      return;
    }

    try {
      const parts = formDate.split("-");
      const yr = parseInt(parts[0], 10);
      const mo = parseInt(parts[1], 10) - 1;
      const dy = parseInt(parts[2], 10);

      createMockTestRequest({
        studentId: `st-${Date.now()}`,
        studentName: formStudentName.trim(),
        skill: "speaking",
        day: dy,
        month: mo,
        year: yr,
        examTime: formTime,
        examTeacher: formGrader,
        status: "approved",
        note: `Đăng ký ca thi Speaking - Grader ${formGrader} phụ trách`,
      });

      setIsAddModalOpen(false);
      void loadData();
    } catch (err: any) {
      alert("Lỗi khi thêm ca: " + err.message);
    }
  };

  return (
    <AcaLayout>
      <div className="space-y-6 max-w-full pb-16">
        <AcaTopbar title="Danh Sách Học Viên Đăng Ký Speaking (Grader Phụ Trách)" />

        {/* ── Banner ── */}
        <div className="rounded-2xl border border-primary/25 bg-gradient-to-r from-primary/10 via-primary/5 to-white p-5 flex flex-wrap items-center justify-between gap-4 shadow-soft">
          <div className="flex items-center gap-3.5">

            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-primary">
                Học Vụ Khảo Thí & Phân Công Ca Thi Speaking
              </div>
              <h2 className="text-base font-black text-zinc-900 mt-0.5">
                Quản lý học viên đăng ký Speaking, theo dõi và phân công Grader phụ trách ca thi
              </h2>
              <p className="text-xs text-zinc-500 font-medium mt-0.5">
                Tổng hợp toàn bộ lượt đăng ký Mock Test Speaking & Final Test Speaking trên toàn hệ thống.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setFormStudentName("");
              setFormStudentPhone("");
              setFormStudentEmail("");
              setFormClassName("Solidifying — T357");
              setFormTestType("mock_test");
              setFormDate(new Date().toISOString().split("T")[0]);
              setFormTime("19:30");
              setFormGrader("Gia Phú");
              setIsAddModalOpen(true);
            }}
            className="px-5 py-2.5 rounded-xl bg-primary hover:bg-[#6a5acd] text-white text-xs font-black transition-all shadow-md active:scale-95 cursor-pointer"
          >
            + Xếp ca Speaking mới
          </button>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-center shadow-xs">
            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Tổng Đăng Ký Speaking</div>
            <div className="text-xl font-black text-zinc-900 mt-1 tabular-nums">{stats.total}</div>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 text-center shadow-xs">
            <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Chờ Thi / Chờ Chấm</div>
            <div className="text-xl font-black text-amber-600 mt-1 tabular-nums">{stats.pending}</div>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 text-center shadow-xs">
            <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Đã Hoàn Thành & Có Điểm</div>
            <div className="text-xl font-black text-emerald-600 mt-1 tabular-nums">{stats.graded}</div>
          </div>
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-center shadow-xs">
            <div className="text-[10px] font-bold text-primary uppercase tracking-wider">Số Grader Phụ Trách</div>
            <div className="text-xl font-black text-primary mt-1 tabular-nums">{stats.graderCount}</div>
          </div>
        </div>

        {/* ── Filters & Search ── */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-soft">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[240px]">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tên học viên, SĐT, lớp, Grader..."
                className="w-full h-10 rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 text-xs font-medium focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
            </div>

            {/* Filter by Grader */}
            <select
              value={graderFilter}
              onChange={(e) => setGraderFilter(e.target.value)}
              className="h-10 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-xs font-bold text-zinc-700 outline-none"
            >
              <option value="all">Tất cả Grader phụ trách ({activeGraders.length})</option>
              {activeGraders.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>

            {/* Filter by Type */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="h-10 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-xs font-bold text-zinc-700 outline-none"
            >
              <option value="all">Tất cả loại bài thi</option>
              <option value="final_test">Final Test Speaking</option>
              <option value="mock_test">Mock Test Speaking</option>
            </select>

            {/* Filter by Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="h-10 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-xs font-bold text-zinc-700 outline-none"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">Chờ thi / Chờ chấm</option>
              <option value="graded">Đã có điểm</option>
            </select>
          </div>
        </div>

        {/* ── Table Grid ── */}
        <div className="rounded-2xl border border-zinc-200 bg-white shadow-soft overflow-hidden">
          {loading ? (
            <div className="text-center py-16 text-xs text-zinc-400 font-bold">Đang tải danh sách đăng ký Speaking...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-zinc-400 space-y-2">
              <div className="text-sm font-bold text-zinc-600">Không tìm thấy ca thi Speaking nào</div>
              <p className="text-xs text-zinc-400">Bấm &quot;+ Xếp ca Speaking mới&quot; để tạo ca thi cho học viên.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50/80 text-[10px] font-black uppercase tracking-wider text-zinc-500">
                    <th className="px-4 py-3.5">Học Viên & Liên Hệ</th>
                    <th className="px-3.5 py-3.5">Loại Ca Thi</th>
                    <th className="px-3.5 py-3.5">Ngày & Giờ Thi</th>
                    <th className="px-4 py-3.5 bg-primary/5 text-primary border-x border-primary/10">
                      Grader Phụ Trách
                    </th>
                    <th className="px-3.5 py-3.5 text-center">Phòng Google Meet</th>
                    <th className="px-3 py-3.5 text-center">Trạng Thái</th>
                    <th className="px-3 py-3.5 text-center">Điểm Speaking</th>
                    <th className="px-4 py-3.5">Nhận Xét / Ghi Chú</th>
                    <th className="px-3 py-3.5 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 font-medium">
                  {filtered.map((it) => {
                    const isGraded = it.status === "graded" && Boolean(it.scoreSpeaking);

                    return (
                      <tr key={it.id} className="hover:bg-zinc-50/70 transition-colors">
                        {/* 1. Học viên */}
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-zinc-900">{it.studentName}</div>
                          <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                            {it.studentPhone} {it.className ? `• ${it.className}` : ""}
                          </div>
                        </td>

                        {/* 2. Loại ca */}
                        <td className="px-3.5 py-3.5">
                          <span
                            className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold border ${
                              it.source === "final_test"
                                ? "bg-purple-50 text-purple-700 border-purple-200"
                                : "bg-sky-50 text-sky-700 border-sky-200"
                            }`}
                          >
                            {it.testTypeLabel}
                          </span>
                        </td>

                        {/* 3. Ngày giờ thi */}
                        <td className="px-3.5 py-3.5 font-mono text-zinc-800">
                          <div className="font-bold">{it.date}</div>
                          <div className="text-[10px] text-zinc-500">{it.time}</div>
                        </td>

                        {/* 4. GRADER PHỤ TRÁCH (Dropdown nhanh) */}
                        <td className="px-4 py-3.5 bg-primary/5 border-x border-primary/10">
                          <div className="flex items-center gap-1.5">
                            <select
                              value={it.graderName}
                              onChange={(e) => handleAssignGrader(it, e.target.value)}
                              className="text-xs font-black text-primary bg-white rounded-lg border border-primary/30 px-2.5 py-1.5 outline-none hover:border-primary transition-all cursor-pointer shadow-2xs"
                            >
                              {activeGraders.map((g) => (
                                <option key={g} value={g}>
                                  👤 {g}
                                </option>
                              ))}
                            </select>
                          </div>
                        </td>

                        {/* 5. Google Meet */}
                        <td className="px-3.5 py-3.5 text-center">
                          {it.meetLink ? (
                            <a
                              href={it.meetLink}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 text-[11px] font-bold transition-all shadow-2xs"
                            >
                              Meet thi ↗
                            </a>
                          ) : (
                            <span className="text-zinc-400 italic text-xs">—</span>
                          )}
                        </td>

                        {/* 6. Trạng thái */}
                        <td className="px-3 py-3.5 text-center">
                          {isGraded ? (
                            <span className="inline-flex rounded-md bg-emerald-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-700 border border-emerald-200">
                              Đã có điểm
                            </span>
                          ) : (
                            <span className="inline-flex rounded-md bg-amber-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-700 border border-amber-200">
                              Chờ chấm
                            </span>
                          )}
                        </td>

                        {/* 7. Điểm Speaking */}
                        <td className="px-3 py-3.5 text-center">
                          <span className="text-sm font-black text-primary tabular-nums">
                            {it.scoreSpeaking ? formatBandScore(it.scoreSpeaking) : "—"}
                          </span>
                        </td>

                        {/* 8. Ghi chú */}
                        <td className="px-4 py-3.5 max-w-[180px]">
                          <div className="text-xs text-zinc-700 truncate font-medium" title={it.notes || ""}>
                            {it.notes || <span className="text-zinc-400 italic">Chưa có ghi chú</span>}
                          </div>
                        </td>

                        {/* 9. Thao tác */}
                        <td className="px-3 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setGradingItem(it);
                                setGradeScore(it.scoreSpeaking || "");
                                setGradeFeedback(it.notes || "");
                              }}
                              className="px-2.5 py-1 rounded-lg bg-primary text-white text-[10px] font-black hover:bg-[#6a5acd] transition-all shadow-2xs cursor-pointer active:scale-95"
                            >
                              {isGraded ? "Sửa điểm" : "Nhập điểm"}
                            </button>
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
      </div>

      {/* ── Grade Modal ── */}
      {gradingItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Đóng"
            onClick={() => setGradingItem(null)}
            className="absolute inset-0 bg-black/40 backdrop-blur-xs"
          />
          <form
            onSubmit={handleSaveGrade}
            className="relative w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <h3 className="text-base font-black text-zinc-900">
                  Nhập Điểm Ca Thi Speaking
                </h3>
                <div className="text-xs text-zinc-500 font-medium mt-0.5">
                  Học viên: <strong className="text-zinc-900">{gradingItem.studentName}</strong> • Grader: <strong className="text-primary">{gradingItem.graderName}</strong>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setGradingItem(null)}
                className="rounded-lg p-1 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Điểm Band Speaking (IELTS)</label>
              <input
                type="text"
                required
                value={gradeScore}
                onChange={(e) => setGradeScore(e.target.value)}
                placeholder="Ví dụ: 6.5 hoặc 7.0"
                className="w-full rounded-xl border border-zinc-200 px-3.5 py-2 text-sm font-black text-primary outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Nhận xét của Grader</label>
              <textarea
                rows={3}
                value={gradeFeedback}
                onChange={(e) => setGradeFeedback(e.target.value)}
                placeholder="Nhận xét phát âm, độ trôi chảy, ngữ pháp và từ vựng..."
                className="w-full rounded-xl border border-zinc-200 p-3 text-xs outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setGradingItem(null)}
                className="px-4 py-2 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-600 hover:bg-zinc-50 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-black hover:bg-[#6a5acd] transition-colors shadow-md active:scale-95 cursor-pointer"
              >
                Lưu kết quả
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Add New Speaking Registration Modal ── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Đóng"
            onClick={() => setIsAddModalOpen(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-xs"
          />
          <form
            onSubmit={handleSaveAddModal}
            className="relative w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <h3 className="text-base font-black text-zinc-900">
                  Xếp Lịch Thi Speaking & Phân Công Grader
                </h3>
                <p className="text-xs text-zinc-500 font-medium mt-0.5">
                  Tạo ca thi Speaking 1-1 và phân công Grader phụ trách
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-lg p-1 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Quick picker from existing students */}
            {students.length > 0 && (
              <div className="bg-primary/5 p-3 rounded-xl border border-primary/20">
                <label className="block text-xs font-bold text-primary mb-1">
                  Chọn nhanh học viên từ danh sách toàn trường:
                </label>
                <select
                  onChange={(e) => {
                    const st = students.find((s) => s.id === e.target.value);
                    if (st) {
                      setFormStudentName(st.name || "");
                      setFormStudentPhone(st.phone || "");
                      setFormStudentEmail(st.email || "");
                      if (st.l1 && st.l1 !== "-") setFormClassName(st.l1);
                    }
                  }}
                  className="w-full rounded-lg border border-primary/20 bg-white px-3 py-1.5 text-xs text-zinc-900 outline-none"
                >
                  <option value="">-- Chọn học viên --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.phone ? `(${s.phone})` : ""} {s.l1 ? `• ${s.l1}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Tên học viên *</label>
                <input
                  type="text"
                  required
                  value={formStudentName}
                  onChange={(e) => setFormStudentName(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Số điện thoại</label>
                <input
                  type="text"
                  value={formStudentPhone}
                  onChange={(e) => setFormStudentPhone(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Lớp học</label>
                <input
                  type="text"
                  value={formClassName}
                  onChange={(e) => setFormClassName(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Grader / GV Phụ Trách *</label>
                <select
                  value={formGrader}
                  onChange={(e) => setFormGrader(e.target.value)}
                  className="w-full rounded-xl border border-primary/30 bg-primary/5 px-3 py-2 text-xs font-black text-primary outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {GRADER_OPTIONS.map((g) => (
                    <option key={g} value={g}>
                      👤 {g}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Ngày thi</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs font-bold text-zinc-800 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Giờ thi</label>
                <input
                  type="time"
                  value={formTime}
                  onChange={(e) => setFormTime(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs font-bold text-zinc-800 outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-600 hover:bg-zinc-50 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-black hover:bg-[#6a5acd] transition-colors shadow-md active:scale-95 cursor-pointer"
              >
                Xác nhận xếp ca
              </button>
            </div>
          </form>
        </div>
      )}
    </AcaLayout>
  );
}
