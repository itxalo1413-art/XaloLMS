"use client";

import { useEffect, useMemo, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AcaLayout } from "@/components/aca/AcaLayout";
import { AcaTopbar } from "@/components/aca/AcaTopbar";
import { DiagnosisEditorSection } from "@/components/shared/DiagnosisEditorSection";
import { StudentProfileEditorSection } from "@/components/shared/StudentProfileEditorSection";
import { fetchAcaStudents, fetchAcaClasses, updateAcaStudent, type AcaStudent, type AcaClass } from "@/lib/acaManagementApi";
import { DEFAULT_STUDENT_ID } from "@/lib/studentRoster";
import { formatBandScore } from "@/lib/formatBandScore";
import Link from "next/link";

function isUserAssignedToClass(student: AcaStudent): boolean {
  const classId = (student.classId || "").trim();
  const l1 = (student.l1 || "").trim().toLowerCase();

  const hasValidClassId = classId.length > 0 && classId !== "cls_placeholder";
  const hasValidL1 = l1.length > 0 && l1 !== "-" && !l1.includes("chưa");

  return hasValidClassId || hasValidL1;
}

function AcaBcbContent() {
  const searchParams = useSearchParams();
  const paramStudentId = searchParams.get("studentId");

  const [students, setStudents] = useState<AcaStudent[]>([]);
  const [classes, setClasses] = useState<AcaClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(paramStudentId || DEFAULT_STUDENT_ID);
  
  // Filter & search states
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "student" | "guest">("all");

  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [stList, clList] = await Promise.all([
          fetchAcaStudents(),
          fetchAcaClasses(),
        ]);
        setStudents(stList);
        setClasses(clList);
        if (paramStudentId && stList.some(s => s.id === paramStudentId)) {
          setSelectedStudentId(paramStudentId);
        } else if (stList.length > 0 && !paramStudentId) {
          setSelectedStudentId(stList[0].id);
        }
      } catch (err) {
        console.error("Failed to load students for BCB page", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [paramStudentId]);

  const handleAssignClass = async (studentId: string, newClassId: string) => {
    const selectedClass = classes.find((c) => c.id === newClassId);
    const className = selectedClass ? selectedClass.name : "-";
    try {
      const updated = await updateAcaStudent(studentId, {
        classId: newClassId,
        l1: className,
      });
      setStudents((prev) =>
        prev.map((s) => (s.id === studentId ? { ...s, ...updated, classId: newClassId, l1: className } : s))
      );
    } catch (err: any) {
      alert("Không gán được lớp: " + err.message);
    }
  };

  // Derived statistics
  const stats = useMemo(() => {
    let studentCount = 0;
    let guestCount = 0;
    students.forEach((s) => {
      if (isUserAssignedToClass(s)) studentCount++;
      else guestCount++;
    });
    return { total: students.length, studentCount, guestCount };
  }, [students]);

  // Filtered student list
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const isAssigned = isUserAssignedToClass(s);
      if (filterType === "student" && !isAssigned) return false;
      if (filterType === "guest" && isAssigned) return false;

      if (searchTerm.trim()) {
        const query = searchTerm.trim().toLowerCase();
        const matchName = s.name.toLowerCase().includes(query);
        const matchEmail = (s.email || "").toLowerCase().includes(query);
        const matchPhone = (s.phone || "").toLowerCase().includes(query);
        const matchClass = (s.l1 || "").toLowerCase().includes(query);
        return matchName || matchEmail || matchPhone || matchClass;
      }
      return true;
    });
  }, [students, filterType, searchTerm]);

  const activeStudent = useMemo(() => {
    return students.find((s) => s.id === selectedStudentId) || students[0];
  }, [students, selectedStudentId]);

  const activeIsAssigned = activeStudent ? isUserAssignedToClass(activeStudent) : false;

  const handleSelectStudent = (id: string) => {
    setSelectedStudentId(id);
    if (editorRef.current) {
      editorRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <AcaLayout>
      <AcaTopbar
        title="Bảng Chẩn Bệnh Chi Tiết (BCB)"
        subtitle="Quản lý danh sách người dùng từ Điểm Entrance/Final & Cập nhật nội dung BCB."
      />

      <main className="mx-auto max-w-6xl space-y-8 px-6 py-6 pb-20 md:px-8">
        
        {/* Banner Quick Navigation */}
        <div className="rounded-3xl border border-primary/15 bg-gradient-to-r from-primary/5 via-white to-primary/5 p-6 shadow-soft">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-wider">
                Quy trình Chẩn bệnh ACA Khánh Thi
              </span>
              <h2 className="text-lg font-black text-foreground tracking-tight mt-1">
                Quản lý & Thiết lập Nội dung Chẩn đoán BCB
              </h2>
              <p className="text-xs font-semibold text-muted mt-0.5 max-w-2xl leading-relaxed">
                Thêm danh sách User ở tab <Link href="/aca/quan-ly/diem-dau-vao-cuoi-khoa" className="text-primary font-bold underline hover:text-primary-hover">Điểm Entrance/Final</Link>. Khi User chưa xếp lớp, status hiển thị là <span className="font-extrabold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">Guest</span>. Sau khi được xếp lớp, status tự động chuyển thành <span className="font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">Học viên</span>.
              </p>
            </div>

            <Link
              href="/aca/quan-ly/diem-dau-vao-cuoi-khoa"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-xs font-black uppercase text-white shadow-soft transition-all hover:bg-primary/95 hover:shadow-hover"
            >
              + Thêm User ở điểm Entrance/Final
            </Link>
          </div>
        </div>

        {/* Status Metrics Overview */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xs">
            <div className="text-[10px] font-black uppercase tracking-widest text-muted">Tổng số User hệ thống</div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-foreground tabular-nums">{stats.total}</span>
              <span className="text-xs font-bold text-muted">người dùng</span>
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-2xs">
            <div className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Đã gán lớp (Học viên)</div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-emerald-700 tabular-nums">{stats.studentCount}</span>
              <span className="text-xs font-bold text-emerald-600">học viên chính thức</span>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 shadow-2xs">
            <div className="text-[10px] font-black uppercase tracking-widest text-amber-800">Chưa gán lớp (Guest)</div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-amber-800 tabular-nums">{stats.guestCount}</span>
              <span className="text-xs font-bold text-amber-700">khách chẩn bệnh</span>
            </div>
          </div>
        </div>

        {/* SECTION 1: USER LIST TABLE FROM ENTRANCE/FINAL DATABASE */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
                Danh Sách User & Phân Loại Trạng Thái
              </h3>
              <p className="text-xs text-muted mt-0.5">
                Bấm nút "Sửa BCB" hoặc bấm trực tiếp dòng user để mở bộ chỉnh sửa nội dung BCB chi tiết.
              </p>
            </div>

            {/* Filter Tabs & Search Bar */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder="Tìm tên, SĐT, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-10 w-48 sm:w-64 rounded-xl border border-zinc-200 bg-white pl-9 pr-3 text-xs font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
                <svg className="absolute left-3 h-4 w-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              <div className="flex rounded-xl bg-zinc-100 p-1">
                {[
                  ["all", "Tất cả"],
                  ["student", "Học viên"],
                  ["guest", "Guest (Khách)"],
                ].map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setFilterType(val as any)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-extrabold transition-all ${
                      filterType === val
                        ? "bg-white text-primary shadow-2xs"
                        : "text-zinc-500 hover:text-zinc-900"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* User Roster Table */}
          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-soft">
            {loading ? (
              <div className="p-12 text-center text-xs font-bold text-muted">Đang tải danh sách người dùng...</div>
            ) : filteredStudents.length === 0 ? (
              <div className="p-12 text-center text-xs font-bold text-muted">Không tìm thấy người dùng phù hợp.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-zinc-50 border-b border-zinc-200 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                    <tr>
                      <th className="px-5 py-3.5 w-12 text-center">STT</th>
                      <th className="px-5 py-3.5 min-w-[200px]">Họ & Tên User</th>
                      <th className="px-5 py-3.5 w-36 text-center">Phân loại Status</th>
                      <th className="px-5 py-3.5 min-w-[180px]">Lớp Học Đang Gán</th>
                      <th className="px-5 py-3.5 text-center w-36">Điểm Entrance</th>
                      <th className="px-5 py-3.5 text-right w-32">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 font-semibold text-zinc-700">
                    {filteredStudents.map((st, idx) => {
                      const isSelected = st.id === selectedStudentId;
                      const isAssigned = isUserAssignedToClass(st);
                      const displayClass = st.l1 && st.l1 !== "-" ? st.l1 : "Chưa xếp lớp";

                      return (
                        <tr
                          key={st.id}
                          onClick={() => handleSelectStudent(st.id)}
                          className={`cursor-pointer transition-colors ${
                            isSelected ? "bg-primary/5" : "hover:bg-zinc-50/70"
                          }`}
                        >
                          <td className="px-5 py-4 text-center tabular-nums text-zinc-400 font-bold">
                            {st.stt || idx + 1}
                          </td>

                          <td className="px-5 py-4">
                            <div className="font-bold text-zinc-900 text-xs flex items-center gap-2">
                              <span>{st.name}</span>
                              {isSelected && (
                                <span className="h-2 w-2 rounded-full bg-primary animate-pulse" title="Đang chọn chỉnh sửa" />
                              )}
                            </div>
                            <div className="text-[10px] text-zinc-400 font-medium">{st.email || st.phone || "Chưa có liên hệ"}</div>
                          </td>

                          <td className="px-5 py-4 text-center">
                            {isAssigned ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-[10px] font-black uppercase text-emerald-700">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                Học viên
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-[10px] font-black uppercase text-amber-800">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                Guest (Khách)
                              </span>
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <span className={`text-xs font-bold ${isAssigned ? "text-zinc-800" : "text-zinc-400 italic"}`}>
                              {displayClass}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-center">
                            <span className="inline-block rounded-xl bg-zinc-100 px-3 py-1 text-xs font-black text-warning tabular-nums">
                              {st.scores?.o && st.scores.o !== "-" ? `${formatBandScore(st.scores.o)} Overall` : "—"}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectStudent(st.id);
                              }}
                              className={`rounded-xl px-3 py-1.5 text-xs font-black transition-all ${
                                isSelected
                                  ? "bg-primary text-white shadow-2xs"
                                  : "bg-primary/10 text-primary hover:bg-primary hover:text-white"
                              }`}
                            >
                              {isSelected ? "Đang chọn ✓" : "Sửa BCB"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* SECTION 2: ACTIVE SELECTED USER BCB EDITOR */}
        <div ref={editorRef} className="scroll-mt-24 space-y-6">
          {activeStudent && (
            <div className="rounded-3xl border border-primary/20 bg-white p-6 shadow-premium space-y-6">
              {/* Active User Header Banner */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-100 pb-5">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-black text-foreground tracking-tight">
                      {activeStudent.name}
                    </h2>
                    {activeIsAssigned ? (
                      <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-[10px] font-black uppercase text-emerald-700">
                        Học viên ({activeStudent.l1 || "Đã xếp lớp"})
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-[10px] font-black uppercase text-amber-800">
                        Guest (Khách chưa xếp lớp)
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-muted mt-1">
                    Email: {activeStudent.email || "—"} · SĐT: {activeStudent.phone || "—"} · Lớp: {activeStudent.l1 || "Chưa gán"}
                  </p>
                </div>

                {/* Gán Lớp cho Học viên / Guest */}
                <div className="flex items-center gap-2 bg-zinc-50 p-2.5 rounded-2xl border border-zinc-200 shadow-2xs">
                  <label className="text-[10px] font-black uppercase text-zinc-500 whitespace-nowrap">
                    Gán Lớp Học Viên:
                  </label>
                  <select
                    value={activeStudent.classId || ""}
                    onChange={(e) => void handleAssignClass(activeStudent.id, e.target.value)}
                    className="h-9 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-bold text-foreground outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="">-- Chưa xếp lớp (Guest) --</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.classCode ? `(${c.classCode})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Student Profile Options Editor (Thói quen & Hoàn cảnh học) */}
              <StudentProfileEditorSection
                portalLabel="ACA Khánh Thi"
                studentId={activeStudent.id}
                studentData={{
                  name: activeStudent.name,
                  email: activeStudent.email,
                  phone: activeStudent.phone,
                }}
              />

              {/* Comprehensive Diagnosis BCB Editor Section */}
              <DiagnosisEditorSection
                variant="student"
                portalLabel="ACA Khánh Thi"
                studentId={activeStudent.id}
                studentEmail={activeStudent.email}
                studentName={activeStudent.name}
                initialScores={activeStudent.scores}
              />
            </div>
          )}
        </div>

      </main>
    </AcaLayout>
  );
}

export default function AcaBcbPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs font-bold text-muted">Đang tải trang chẩn đoán...</div>}>
      <AcaBcbContent />
    </Suspense>
  );
}
