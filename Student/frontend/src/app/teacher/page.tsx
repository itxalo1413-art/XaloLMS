"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { TeacherLayout } from "@/components/teacher/TeacherLayout";
import { TeacherTopbar } from "@/components/teacher/TeacherTopbar";
import { NativeSelectChevron } from "@/components/student/ui";
import {
  fetchAcaClasses,
  fetchAca11Classes,
  fetchAcaStudents,
  updateAcaStudent,
  type AcaStudent,
  type AcaClass,
  type Aca11Class,
} from "@/lib/acaManagementApi";
import { DEFAULT_COURSE_RLP_SESSIONS, type RlpSession, type Attendance, type HomeworkStatus } from "@/lib/courseSchedule";

const TEACHER_NAME_FILTER = "Quỳnh Châu";

export default function TeacherClassesPage() {
  const [classes, setClasses] = useState<AcaClass[]>([]);
  const [classes11, setClasses11] = useState<Aca11Class[]>([]);
  const [students, setStudents] = useState<AcaStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Drilldown navigation states
  const [selectedClass, setSelectedClass] = useState<{ id: string; name: string; type: string } | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<AcaStudent | null>(null);

  // RLP sessions state for the active student
  const [studentRlp, setStudentRlp] = useState<RlpSession[]>([]);
  const [activeSessionNo, setActiveSessionNo] = useState<number | null>(null);
  
  // Edit modal draft states
  const [editStatus, setEditStatus] = useState<HomeworkStatus>("in_progress");
  const [editAttendance, setEditAttendance] = useState<Attendance>("present");
  const [editLessonFile, setEditLessonFile] = useState("");
  const [editTeacherNote, setEditTeacherNote] = useState("");
  const [savingRlp, setSavingRlp] = useState(false);

  // Fetch all database records
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [clsList, cls11List, stList] = await Promise.all([
        fetchAcaClasses(),
        fetchAca11Classes(),
        fetchAcaStudents(),
      ]);
      setClasses(clsList);
      setClasses11(cls11List);
      setStudents(stList);
    } catch (err: any) {
      setError(err.message || "Không tải được danh sách lớp học.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Load RLP sessions for the selected student
  useEffect(() => {
    if (selectedStudent) {
      const savedKey = `xalo.course.rlpSessions.${selectedStudent.id}.v1`;
      const saved = window.localStorage.getItem(savedKey);
      if (saved) {
        try {
          setStudentRlp(JSON.parse(saved));
        } catch {
          setStudentRlp(DEFAULT_COURSE_RLP_SESSIONS);
        }
      } else {
        setStudentRlp(DEFAULT_COURSE_RLP_SESSIONS);
      }
    } else {
      setStudentRlp([]);
    }
  }, [selectedStudent]);

  // Save RLP sessions to student specific key in localStorage
  const saveStudentRlp = (sessions: RlpSession[]) => {
    if (!selectedStudent) return;
    const savedKey = `xalo.course.rlpSessions.${selectedStudent.id}.v1`;
    window.localStorage.setItem(savedKey, JSON.stringify(sessions));
    setStudentRlp(sessions);
  };

  // Filter classes taught by active teacher ("Quỳnh Châu")
  const teacherClasses = useMemo(() => {
    return classes
      .filter((c) => (c.teacher || "").toLowerCase().includes(TEACHER_NAME_FILTER.toLowerCase()))
      .map((c) => ({ id: c.id, name: c.name, type: "Lớp học theo tháng" }));
  }, [classes]);

  const teacher11Classes = useMemo(() => {
    return classes11
      .filter((c) => (c.teacher || "").toLowerCase().includes(TEACHER_NAME_FILTER.toLowerCase()))
      .map((c) => ({ id: c.id, name: c.className, type: `Lớp 1:1 (${c.status})` }));
  }, [classes11]);

  const myClasses = useMemo(() => {
    return [...teacherClasses, ...teacher11Classes];
  }, [teacherClasses, teacher11Classes]);

  // Filter students belonging to selected class
  const classStudents = useMemo(() => {
    if (!selectedClass) return [];
    return students.filter(
      (s) => s.classId === selectedClass.id || s.classId === selectedClass.name
    );
  }, [students, selectedClass]);

  // Deadline check function: true if lesson date >7 days ago and still "Chưa chấm"
  const checkIsOverdue = (dateStr: string, status: HomeworkStatus) => {
    if (status === "submitted") return false; // Graded, not overdue

    const parts = dateStr.split("/");
    if (parts.length !== 3) return false;
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    const sessionDate = new Date(year, month, day);

    // Context current date: June 19, 2026
    const CURRENT_DATE = new Date(2026, 5, 19);
    const diffTime = CURRENT_DATE.getTime() - sessionDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    return diffDays > 7;
  };

  // Attendance summary metrics
  const attendanceMetrics = useMemo(() => {
    if (studentRlp.length === 0) return { present: 0, absent: 0, rate: 0 };
    const present = studentRlp.filter((s) => s.attendance === "present").length;
    const absent = studentRlp.filter((s) => s.attendance === "absent").length;
    const rate = Math.round((present / studentRlp.length) * 100);
    return { present, absent, rate };
  }, [studentRlp]);

  // Handle open RLP edit modal
  const handleOpenEdit = (session: RlpSession) => {
    setActiveSessionNo(session.no);
    setEditStatus(session.homeworkStatus);
    setEditAttendance(session.attendance);
    setEditLessonFile(session.lessonFileUrl || "");
    setEditTeacherNote(session.teacherNote === "—" ? "" : session.teacherNote);
  };

  // Handle save RLP edits
  const handleSaveRlp = () => {
    if (activeSessionNo === null) return;
    setSavingRlp(true);

    const updated = studentRlp.map((s) => {
      if (s.no !== activeSessionNo) return s;
      return {
        ...s,
        homeworkStatus: editStatus,
        attendance: editAttendance,
        lessonFileUrl: editLessonFile.trim(),
        teacherNote: editTeacherNote.trim() || "—",
      };
    });

    saveStudentRlp(updated);
    setSavingRlp(false);
    setActiveSessionNo(null);
  };

  return (
    <TeacherLayout>
      <TeacherTopbar
        title="Danh sách lớp học"
        subtitle={`Giáo viên: Nghiêm Doãn Quỳnh Châu · Quản lý lớp học, điểm danh và chấm tiến trình RLP học viên.`}
      />
      <main className="mx-auto max-w-6xl px-6 py-6 pb-16 md:px-8 space-y-6">
        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center text-sm text-zinc-500 shadow-sm">
            Đang tải dữ liệu giảng dạy...
          </div>
        ) : !selectedClass ? (
          /* Step 1: Class List Grid */
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Lớp học bạn phụ trách ({myClasses.length})</h3>
            {myClasses.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-10 text-center text-sm text-zinc-500">
                Bạn chưa được gán phụ trách lớp học nào.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {myClasses.map((cls) => {
                  const studentCount = students.filter(
                    (s) => s.classId === cls.id || s.classId === cls.name
                  ).length;
                  
                  return (
                    <div
                      key={cls.id}
                      onClick={() => setSelectedClass(cls)}
                      className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm hover:border-primary/45 hover:shadow-soft transition-all cursor-pointer group"
                    >
                      <div className="flex justify-between items-start">
                        <span className="inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-black uppercase text-primary">
                          {cls.type}
                        </span>
                      </div>
                      <h4 className="text-sm font-extrabold text-zinc-950 mt-3 group-hover:text-primary transition-colors">
                        {cls.name}
                      </h4>
                      <div className="mt-4 flex items-center justify-between border-t border-zinc-50 pt-4 text-xs font-semibold text-zinc-500">
                        <span>Sĩ số lớp:</span>
                        <span className="font-bold text-zinc-800">{studentCount} học viên</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : !selectedStudent ? (
          /* Step 2: Class Students List */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSelectedClass(null)}
                className="text-xs font-bold text-[#6a5acd] hover:underline"
              >
                ← Trở lại danh sách lớp
              </button>
              <h3 className="text-sm font-extrabold text-zinc-900">{selectedClass.name}</h3>
            </div>

            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
              <div className="p-5 border-b border-zinc-100">
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-500">Danh sách học viên lớp</h4>
              </div>
              {classStudents.length === 0 ? (
                <div className="p-8 text-center text-sm text-zinc-500">Lớp học chưa có học viên nào.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50 border-b border-zinc-200 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                      <tr>
                        <th className="px-6 py-4">STT</th>
                        <th className="px-6 py-4">Họ và tên</th>
                        <th className="px-6 py-4">Số điện thoại</th>
                        <th className="px-6 py-4">Email</th>
                        <th className="px-6 py-4">Target Band</th>
                        <th className="px-6 py-4 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 font-semibold text-zinc-700">
                      {classStudents.map((st, index) => (
                        <tr
                          key={st.id}
                          onClick={() => setSelectedStudent(st)}
                          className="hover:bg-zinc-50/70 transition-colors cursor-pointer"
                        >
                          <td className="px-6 py-4 tabular-nums text-zinc-400">{index + 1}</td>
                          <td className="px-6 py-4 font-bold text-zinc-950">{st.name}</td>
                          <td className="px-6 py-4 text-zinc-500">{st.phone || "—"}</td>
                          <td className="px-6 py-4 text-zinc-500">{st.email || "—"}</td>
                          <td className="px-6 py-4">
                            <span className="rounded-full bg-secondary/10 px-2 py-0.5 text-[10px] font-bold text-secondary">
                              {st.classification || "—"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-primary underline underline-offset-2 hover:text-primary-hover">Chi tiết RLP</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Step 3: Student Details + BCB + Attendance + RLP Table */
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="text-xs font-bold text-[#6a5acd] hover:underline"
              >
                ← Quay lại danh sách học viên
              </button>
              <h3 className="text-sm font-extrabold text-zinc-900">{selectedStudent.name}</h3>
            </div>

            {/* Profile Info & BCB Entrance Scores */}
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Profile Card */}
              <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm space-y-4">
                <h3 className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Thông tin học viên</h3>
                <div className="space-y-3 text-xs font-semibold">
                  <div>
                    <div className="text-[9px] text-zinc-400 font-bold uppercase">Họ và tên</div>
                    <div className="text-sm font-bold text-zinc-900 mt-0.5">{selectedStudent.name}</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-zinc-400 font-bold uppercase">Số điện thoại</div>
                    <div className="text-zinc-700 mt-0.5">{selectedStudent.phone || "—"}</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-zinc-400 font-bold uppercase">Email</div>
                    <div className="text-zinc-700 break-all mt-0.5">{selectedStudent.email || "—"}</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-zinc-400 font-bold uppercase">Target Band</div>
                    <div className="text-secondary font-bold mt-0.5">{selectedStudent.classification || "—"}</div>
                  </div>
                </div>
              </div>

              {/* BCB Entrance scores */}
              <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm lg:col-span-2 space-y-4">
                <h3 className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">BCB Điểm đầu vào (Entrance Test)</h3>
                <div className="grid grid-cols-5 gap-2">
                  {(
                    [
                      ["Listening", selectedStudent.scores?.l],
                      ["Reading", selectedStudent.scores?.r],
                      ["Writing", selectedStudent.scores?.w],
                      ["Speaking", selectedStudent.scores?.s],
                    ] as const
                  ).map(([label, val]) => (
                    <div key={label} className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-3 text-center">
                      <div className="text-[9px] font-bold uppercase text-zinc-400">{label}</div>
                      <div className="text-base font-black text-zinc-800 mt-1">{val}</div>
                    </div>
                  ))}
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-center">
                    <div className="text-[9px] font-black uppercase text-primary">Overall</div>
                    <div className="text-base font-black text-primary mt-1">{selectedStudent.scores?.o}</div>
                  </div>
                </div>
                {selectedStudent.note && (
                  <div className="pt-2 border-t border-zinc-50 text-xs font-semibold text-zinc-500 leading-relaxed">
                    <span className="font-bold text-zinc-700">Ghi chú đầu vào:</span> {selectedStudent.note}
                  </div>
                )}
              </div>
            </div>

            {/* Attendance table */}
            <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <h3 className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Bảng điểm danh học sinh</h3>
                <span className="text-xs font-bold text-zinc-700 bg-zinc-100 px-3 py-1 rounded-lg">
                  Tỷ lệ chuyên cần: {attendanceMetrics.rate}% ({attendanceMetrics.present}/{studentRlp.length} buổi)
                </span>
              </div>
              
              <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-2">
                {studentRlp.map((s) => (
                  <div
                    key={s.no}
                    className={`rounded-lg p-2 text-center border text-xs font-bold transition-all ${
                      s.attendance === "present"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-rose-50 text-rose-700 border-rose-200"
                    }`}
                    title={`Buổi ${s.no}: ${s.attendance === "present" ? "Đi học" : "Vắng học"}`}
                  >
                    <div>B{s.no}</div>
                    <div className="text-[8px] opacity-75 mt-0.5">{s.date.slice(0, 5)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* RLP progress table (No attendance column, Graded status, 7 days check) */}
            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm space-y-4">
              <div className="p-5 border-b border-zinc-100">
                <h3 className="text-xs font-black uppercase tracking-wider text-zinc-950">Bảng tiến trình học tập RLP</h3>
                <p className="text-[11px] text-zinc-500 mt-1">Cập nhật tài liệu, chấm bài tập và ghi chú kết quả giảng dạy buổi học.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[750px] text-left text-xs">
                  <thead className="bg-zinc-50 border-b border-zinc-200 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                    <tr>
                      <th className="px-4 py-3.5">Buổi</th>
                      <th className="px-4 py-3.5">Ngày</th>
                      <th className="px-4 py-3.5">Kỹ năng</th>
                      <th className="px-4 py-3.5 min-w-[150px]">Nội dung học tập</th>
                      <th className="px-4 py-3.5">Bài tập về nhà</th>
                      <th className="px-4 py-3.5">Tài liệu học</th>
                      <th className="px-4 py-3.5">Ghi chú giáo viên</th>
                      <th className="px-4 py-3.5 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 font-semibold text-zinc-700">
                    {studentRlp.map((row) => {
                      const isGraded = row.homeworkStatus === "submitted";
                      const isOverdue = checkIsOverdue(row.date, row.homeworkStatus);

                      return (
                        <tr key={row.no} className="hover:bg-zinc-50/50 transition-colors">
                          <td className="px-4 py-4 tabular-nums text-zinc-950 font-bold">{row.no}</td>
                          <td className="px-4 py-4 tabular-nums text-zinc-500">{row.date}</td>
                          <td className="px-4 py-4">
                            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[9px] font-black text-zinc-700">
                              {row.skill}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-zinc-600 max-w-[200px] truncate" title={row.contents}>
                            {row.contents}
                          </td>
                          
                          {/* Graded/Not graded status with 7-day ACA warning */}
                          <td className="px-4 py-4">
                            {isOverdue ? (
                              <span className="inline-flex items-center gap-1.5 rounded-md bg-red-50 border border-red-200/60 px-2 py-1 text-[9px] font-black uppercase text-red-700 animate-pulse">
                                <span className="h-1.5 w-1.5 rounded-full bg-red-600" />
                                QUÁ HẠN - BÁO ACA
                              </span>
                            ) : isGraded ? (
                              <span className="rounded-md bg-emerald-50 border border-emerald-200/50 px-2 py-1 text-[9px] font-black uppercase text-emerald-800">
                                Đã chấm
                              </span>
                            ) : (
                              <span className="rounded-md bg-zinc-100 px-2 py-1 text-[9px] font-black uppercase text-zinc-500">
                                Chưa chấm
                              </span>
                            )}
                          </td>
                          
                          <td className="px-4 py-4">
                            {row.lessonFileUrl ? (
                              <a
                                href={row.lessonFileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline font-bold"
                              >
                                Tải bài học
                              </a>
                            ) : (
                              <span className="text-zinc-400 font-medium">—</span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-zinc-500 max-w-[150px] truncate" title={row.teacherNote}>
                            {row.teacherNote}
                          </td>
                          <td className="px-4 py-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(row)}
                              className="rounded-lg bg-primary/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-primary hover:bg-primary/15 transition-colors"
                            >
                              Sửa
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* RLP Edit Modal */}
        {activeSessionNo !== null && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-premium space-y-4">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-zinc-950">
                  Buổi học số {activeSessionNo}
                </h3>
                <p className="text-xs text-zinc-500 mt-1">Cập nhật chi tiết kết quả buổi giảng dạy RLP.</p>
              </div>

              <div className="space-y-4">
                {/* Grading Status */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Trạng thái bài tập</label>
                  <NativeSelectChevron
                    value={editStatus === "submitted" ? "graded" : "pending"}
                    onChange={(e) => setEditStatus(e.target.value === "graded" ? "submitted" : "in_progress")}
                    className="mt-2 h-11 rounded-xl border border-zinc-200 bg-white text-xs font-semibold text-foreground shadow-sm"
                  >
                    <option value="graded">Đã chấm</option>
                    <option value="pending">Chưa chấm</option>
                  </NativeSelectChevron>
                </div>

                {/* Attendance */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Điểm danh học sinh</label>
                  <NativeSelectChevron
                    value={editAttendance}
                    onChange={(e) => setEditAttendance(e.target.value as Attendance)}
                    className="mt-2 h-11 rounded-xl border border-zinc-200 bg-white text-xs font-semibold text-foreground shadow-sm"
                  >
                    <option value="present">Đi học</option>
                    <option value="absent">Vắng học</option>
                  </NativeSelectChevron>
                </div>

                {/* Lesson file link */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Link tài liệu buổi học</label>
                  <input
                    type="url"
                    value={editLessonFile}
                    onChange={(e) => setEditLessonFile(e.target.value)}
                    placeholder="https://drive.google.com/..."
                    className="mt-2 block w-full h-11 rounded-xl border border-zinc-200 px-3 text-xs outline-none focus:border-primary shadow-sm"
                  />
                </div>

                {/* Teacher notes */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Ghi chú giáo viên</label>
                  <textarea
                    rows={3}
                    value={editTeacherNote}
                    onChange={(e) => setEditTeacherNote(e.target.value)}
                    placeholder="Ghi chú nhận xét tiến bộ của học viên..."
                    className="mt-2 block w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs outline-none focus:border-primary shadow-sm resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveSessionNo(null)}
                  className="rounded-xl bg-zinc-50 text-zinc-600 hover:bg-zinc-100 px-4 py-2 text-xs font-bold transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={savingRlp}
                  onClick={handleSaveRlp}
                  className="rounded-xl bg-primary text-white hover:bg-primary/95 px-5 py-2 text-xs font-black uppercase tracking-wider transition-colors shadow-sm disabled:opacity-60"
                >
                  {savingRlp ? "Đang lưu..." : "Cập nhật"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </TeacherLayout>
  );
}
