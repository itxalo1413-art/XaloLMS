"use client";

import { useState, useEffect } from "react";
import { AcaLayout } from "@/components/aca/AcaLayout";
import { AcaTopbar } from "@/components/aca/AcaTopbar";
import {
  fetchAcaClasses,
  fetchAcaStudents,
  createAcaStudent,
  updateAcaStudent,
  deleteAcaStudent,
  AcaClass,
  AcaStudent,
} from "@/lib/acaManagementApi";
import { AcaXlsxImportModal, type ImportField } from "@/components/aca/AcaXlsxImportModal";

const STUDENT_IMPORT_FIELDS: ImportField[] = [
  { key: "name", label: "Tên học viên", required: true },
  { key: "email", label: "Email", required: true },
  { key: "phone", label: "Số điện thoại" },
  { key: "className", label: "Tên lớp học" },
  { key: "classification", label: "Hệ học viên" },
  { key: "scoreL", label: "Điểm Listening" },
  { key: "scoreR", label: "Điểm Reading" },
  { key: "scoreW", label: "Điểm Writing" },
  { key: "scoreS", label: "Điểm Speaking" },
  { key: "scoreO", label: "Overall" },
  { key: "bcbLink", label: "Link BCB" },
  { key: "note", label: "Ghi chú" },
];

export default function HocVienLopPage() {
  const [studentsList, setStudentsList] = useState<AcaStudent[]>([]);
  const [classesList, setClassesList] = useState<AcaClass[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [currentStudentId, setCurrentStudentId] = useState<string | null>(null);

  // Form Field States
  const [formName, setFormName] = useState("");
  const [formClassId, setFormClassId] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formClassification, setFormClassification] = useState("");
  const [scoreL, setScoreL] = useState<string>("-");
  const [scoreR, setScoreR] = useState<string>("-");
  const [scoreW, setScoreW] = useState<string>("-");
  const [scoreS, setScoreS] = useState<string>("-");
  const [scoreO, setScoreO] = useState<string>("-");
  const [formBcbLink, setFormBcbLink] = useState("");
  const [formNote, setFormNote] = useState("");
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const handleImportStudents = async (
    mappedRows: any[],
    updateProgress: (current: number, total: number) => void
  ) => {
    const created: AcaStudent[] = [];
    const total = mappedRows.length;

    for (let i = 0; i < total; i++) {
      const row = mappedRows[i];

      // Find classId
      let classId = "";
      if (row.className) {
        const found = classesList.find(
          (c) => c.name.toLowerCase().trim() === String(row.className).toLowerCase().trim()
        );
        if (found) classId = found.id;
      }

      if (!classId) {
        classId = selectedClassId !== "all" ? selectedClassId : (classesList[0]?.id || "");
      }

      const lScore = row.scoreL !== undefined ? String(row.scoreL) : "-";
      const rScore = row.scoreR !== undefined ? String(row.scoreR) : "-";
      const wScore = row.scoreW !== undefined ? String(row.scoreW) : "-";
      const sScore = row.scoreS !== undefined ? String(row.scoreS) : "-";
      const oScore = row.scoreO !== undefined ? String(row.scoreO) : "-";

      const payload = {
        classId,
        stt: studentsList.length + created.length + 1,
        name: String(row.name || "").trim(),
        phone: String(row.phone || "").trim(),
        email: String(row.email || "").trim(),
        classification: String(row.classification || "").trim() || "CC1",
        scores: {
          l: lScore,
          r: rScore,
          w: wScore,
          s: sScore,
          o: oScore,
        },
        bcbLink: String(row.bcbLink || "").trim(),
        note: String(row.note || "").trim(),
      };

      const newStudent = await createAcaStudent(payload);
      created.push(newStudent);
      updateProgress(created.length, total);
    }

    setStudentsList((prev) => [...prev, ...created]);
  };

  useEffect(() => {
    async function loadData() {
      try {
        const [clsData, stData] = await Promise.all([
          fetchAcaClasses(),
          fetchAcaStudents(),
        ]);
        setClassesList(clsData);
        setStudentsList(stData);
        if (clsData.length > 0) {
          setFormClassId(clsData[0].id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredStudents = studentsList.filter((st) => {
    const matchesClass = selectedClassId === "all" || st.classId === selectedClassId;
    const matchesSearch = st.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          st.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          st.phone.includes(searchQuery) ||
                          (st.note && st.note.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesClass && matchesSearch;
  });

  const getClassName = (classId: string) => {
    return classesList.find((c) => c.id === classId)?.name || "Chưa gán";
  };

  const openAddModal = () => {
    setModalMode("add");
    setCurrentStudentId(null);
    setFormName("");
    setFormClassId(classesList[0]?.id || "");
    setFormPhone("");
    setFormEmail("");
    setFormClassification("");
    setScoreL("-");
    setScoreR("-");
    setScoreW("-");
    setScoreS("-");
    setScoreO("-");
    setFormBcbLink("");
    setFormNote("");
    setIsModalOpen(true);
  };

  const openEditModal = (student: AcaStudent) => {
    setModalMode("edit");
    setCurrentStudentId(student.id);
    setFormName(student.name);
    setFormClassId(student.classId);
    setFormPhone(student.phone);
    setFormEmail(student.email);
    setFormClassification(student.classification);
    setScoreL(String(student.scores.l));
    setScoreR(String(student.scores.r));
    setScoreW(String(student.scores.w));
    setScoreS(String(student.scores.s));
    setScoreO(String(student.scores.o));
    setFormBcbLink(student.bcbLink);
    setFormNote(student.note || "");
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa học viên này ra khỏi danh sách?")) {
      try {
        await deleteAcaStudent(id);
        setStudentsList((prev) => prev.filter((s) => s.id !== id));
      } catch (err: any) {
        alert("Xóa thất bại: " + err.message);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      classId: formClassId,
      name: formName,
      phone: formPhone,
      email: formEmail,
      classification: formClassification,
      scores: {
        l: scoreL,
        r: scoreR,
        w: scoreW,
        s: scoreS,
        o: scoreO,
      },
      bcbLink: formBcbLink,
      note: formNote,
    };

    try {
      if (modalMode === "add") {
        const newStudent = await createAcaStudent({
          ...payload,
          stt: studentsList.length + 1,
        });
        setStudentsList((prev) => [...prev, newStudent]);
      } else if (modalMode === "edit" && currentStudentId) {
        const updated = await updateAcaStudent(currentStudentId, payload);
        setStudentsList((prev) =>
          prev.map((s) => (s.id === currentStudentId ? updated : s))
        );
      }
      setIsModalOpen(false);
    } catch (err: any) {
      alert("Lưu thất bại: " + err.message);
    }
  };

  return (
    <AcaLayout>
      <AcaTopbar
        title="Danh sách học viên đầy đủ"
        subtitle="Quản lý toàn bộ danh sách học viên hệ thống, tra cứu thông tin liên lạc, điểm số và hồ sơ BCB."
      />
      <main className="mx-auto w-full px-6 py-6 pb-16 md:px-8 space-y-6">

        {/* Filters Panel */}
        <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-2xl border border-zinc-200/80 shadow-sm justify-between">
          <div className="flex flex-wrap items-center gap-4 flex-1">
            <div className="flex items-center gap-2">
              <label className="text-xs font-black uppercase text-muted tracking-wider">Lọc lớp học:</label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-xs font-bold text-foreground outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
              >
                <option value="all">Tất cả các lớp</option>
                {classesList.map((cls) => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-1 min-w-[200px] max-w-md items-center gap-2">
              <label className="text-xs font-black uppercase text-muted tracking-wider">Tìm kiếm:</label>
              <input
                type="text"
                placeholder="Nhập tên, email hoặc SĐT học viên..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-4 text-xs font-bold text-foreground outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
              />
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="text-xs font-black text-primary uppercase bg-primary/10 px-3 py-2 rounded-xl">
              Tổng cộng: {filteredStudents.length} học viên
            </div>
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="h-10 rounded-xl border border-success/30 bg-success/10 text-success px-4 text-xs font-black uppercase shadow-soft hover:bg-success/15 hover:-translate-y-0.5 transition-all flex items-center gap-1.5"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Nhập Excel
            </button>
            <button
              onClick={openAddModal}
              className="h-10 rounded-xl bg-primary text-white px-4 text-xs font-black uppercase shadow-premium hover:shadow-hover hover:-translate-y-0.5 transition-all"
            >
              Thêm học viên +
            </button>
          </div>
        </div>

        {/* Student List Table */}
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-[10px] font-black uppercase tracking-widest text-muted">
                  <th className="px-6 py-4 text-center">STT</th>
                  <th className="px-6 py-4 min-w-[180px]">Tên học viên</th>
                  <th className="px-6 py-4">Lớp hiện tại</th>
                  <th className="px-6 py-4">SĐT</th>
                  <th className="px-6 py-4">Gmail</th>
                  <th className="px-6 py-4 min-w-[250px]">Phân loại học viên</th>
                  <th className="px-6 py-4 text-center">L</th>
                  <th className="px-6 py-4 text-center">R</th>
                  <th className="px-6 py-4 text-center">W</th>
                  <th className="px-6 py-4 text-center">S</th>
                  <th className="px-6 py-4 text-center">Overall</th>
                  <th className="px-6 py-4">BCB</th>
                  <th className="px-6 py-4 min-w-[150px]">Ghi chú</th>
                  <th className="px-6 py-4 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-semibold text-zinc-700">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((st, idx) => (
                    <tr key={st.id} className="hover:bg-zinc-50/55 align-middle">
                      <td className="px-6 py-4 text-center tabular-nums text-zinc-400">{idx + 1}</td>
                      <td className="px-6 py-4 font-black text-foreground min-w-[180px]">{st.name}</td>
                      <td className="px-6 py-4 text-zinc-500 max-w-[200px] truncate" title={getClassName(st.classId)}>
                        {getClassName(st.classId)}
                      </td>
                      <td className="px-6 py-4 tabular-nums text-zinc-500">{st.phone}</td>
                      <td className="px-6 py-4 text-zinc-500">{st.email}</td>
                      <td className="px-6 py-4 text-zinc-600 font-medium min-w-[250px]">{st.classification || "-"}</td>
                      <td className="px-6 py-4 text-center font-bold tabular-nums">{st.scores.l}</td>
                      <td className="px-6 py-4 text-center font-bold tabular-nums">{st.scores.r}</td>
                      <td className="px-6 py-4 text-center font-bold tabular-nums">{st.scores.w}</td>
                      <td className="px-6 py-4 text-center font-bold tabular-nums">{st.scores.s}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="rounded-lg bg-primary/10 px-2 py-0.5 font-black text-primary tabular-nums">
                          {st.scores.o}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {st.bcbLink ? (
                          <a
                            href={st.bcbLink}
                            target="_blank"
                            rel="noreferrer"
                            className="text-secondary hover:underline font-black"
                          >
                            Link BCB ↗
                          </a>
                        ) : (
                          <span className="text-zinc-300 font-medium">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-zinc-500 font-medium min-w-[150px]">{st.note || "-"}</td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => openEditModal(st)}
                          className="text-primary hover:text-primary-soft mr-3 font-black"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDelete(st.id)}
                          className="text-danger hover:text-red-400 font-black"
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={14} className="px-6 py-8 text-center text-zinc-400 font-medium">
                      Không tìm thấy học viên nào phù hợp với bộ lọc.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* CRUD MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl border border-zinc-200 max-w-lg w-full p-6 shadow-2xl relative overflow-hidden animate-in zoom-in duration-200">
            <h3 className="text-sm font-black uppercase tracking-widest text-foreground mb-4">
              {modalMode === "add" ? "Thêm học viên mới" : "Chỉnh sửa thông tin học viên"}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-[10px] font-black uppercase text-muted tracking-widest mb-1.5">Họ và Tên</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Nhập tên học viên..."
                  className="h-10 w-full rounded-xl border border-zinc-200 px-4 font-bold text-foreground outline-none focus:border-primary/45 focus:ring-2 focus:ring-primary/10"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-muted tracking-widest mb-1.5">Số điện thoại</label>
                  <input
                    type="text"
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="SĐT..."
                    className="h-10 w-full rounded-xl border border-zinc-200 px-4 font-bold text-foreground outline-none focus:border-primary/45 focus:ring-2 focus:ring-primary/10"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-muted tracking-widest mb-1.5">Gmail</label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="Gmail..."
                    className="h-10 w-full rounded-xl border border-zinc-200 px-4 font-bold text-foreground outline-none focus:border-primary/45 focus:ring-2 focus:ring-primary/10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-muted tracking-widest mb-1.5">Lớp học</label>
                  <select
                    value={formClassId}
                    onChange={(e) => setFormClassId(e.target.value)}
                    className="h-10 w-full rounded-xl border border-zinc-200 px-4 font-bold text-foreground outline-none focus:border-primary/45 focus:ring-2 focus:ring-primary/10 bg-white"
                  >
                    {classesList.map((cls) => (
                      <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-muted tracking-widest mb-1.5">Phân loại học viên</label>
                  <input
                    type="text"
                    value={formClassification}
                    onChange={(e) => setFormClassification(e.target.value)}
                    placeholder="Phân loại..."
                    className="h-10 w-full rounded-xl border border-zinc-200 px-4 font-bold text-foreground outline-none focus:border-primary/45 focus:ring-2 focus:ring-primary/10"
                  />
                </div>
              </div>

              {/* Band Scores */}
              <div>
                <label className="block text-[10px] font-black uppercase text-muted tracking-widest mb-1.5">Điểm số (L - R - W - S - Overall)</label>
                <div className="grid grid-cols-5 gap-2">
                  {["L", "R", "W", "S", "Overall"].map((skill, index) => {
                    const value = [scoreL, scoreR, scoreW, scoreS, scoreO][index];
                    const setter = [setScoreL, setScoreR, setScoreW, setScoreS, setScoreO][index];
                    return (
                      <input
                        key={skill}
                        type="text"
                        placeholder={skill}
                        value={value}
                        onChange={(e) => setter!(e.target.value)}
                        className="h-10 w-full rounded-xl border border-zinc-200 text-center font-bold text-foreground outline-none focus:border-primary/45 focus:ring-2 focus:ring-primary/10"
                      />
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-muted tracking-widest mb-1.5">Link bảng điểm chẩn đoán BCB</label>
                <input
                  type="text"
                  value={formBcbLink}
                  onChange={(e) => setFormBcbLink(e.target.value)}
                  placeholder="Đường dẫn Google Sheets..."
                  className="h-10 w-full rounded-xl border border-zinc-200 px-4 font-bold text-foreground outline-none focus:border-primary/45 focus:ring-2 focus:ring-primary/10"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-muted tracking-widest mb-1.5">Ghi chú</label>
                <input
                  type="text"
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  placeholder="Ghi chú thêm (ví dụ: Học bổng, Lịch thi final...)"
                  className="h-10 w-full rounded-xl border border-zinc-200 px-4 font-bold text-foreground outline-none focus:border-primary/45 focus:ring-2 focus:ring-primary/10"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="h-10 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-5 text-xs font-black uppercase"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="h-10 rounded-xl bg-primary text-white px-5 text-xs font-black uppercase shadow-soft hover:shadow-hover hover:-translate-y-0.5 transition-all"
                >
                  Lưu lại
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AcaXlsxImportModal
        open={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Nhập danh sách học viên từ Excel"
        fields={STUDENT_IMPORT_FIELDS}
        onImport={handleImportStudents}
        templateDescription="Các cột hợp lệ: Tên học viên (bắt buộc), Email (bắt buộc), Số điện thoại, Tên lớp học, Hệ học viên, Điểm Listening/Reading/Writing/Speaking/Overall, Link BCB, Ghi chú."
      />
    </AcaLayout>
  );
}
