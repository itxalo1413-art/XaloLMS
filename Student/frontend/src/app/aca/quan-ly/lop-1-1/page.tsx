"use client";

import { useState, useEffect } from "react";
import { AcaLayout } from "@/components/aca/AcaLayout";
import { AcaTopbar } from "@/components/aca/AcaTopbar";
import {
  fetchAca11Classes,
  createAca11Class,
  updateAca11Class,
  deleteAca11Class,
  Aca11Class,
} from "@/lib/acaManagementApi";

export default function Lop11Page() {
  const [classesList, setClassesList] = useState<Aca11Class[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await fetchAca11Classes();
        setClassesList(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);
  
  // Details Modal State
  const [selectedClass, setSelectedClass] = useState<Aca11Class | null>(null);

  // CRUD Form Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [currentId, setCurrentId] = useState<string | null>(null);

  // Form Fields State
  const [formClassName, setFormClassName] = useState("");
  const [formInputNeed, setFormInputNeed] = useState("");
  const [formTeacher, setFormTeacher] = useState("");
  const [formSchedule, setFormSchedule] = useState("");
  const [formStartDate, setFormStartDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");
  const [formProgress, setFormProgress] = useState("");
  const [formOutput, setFormOutput] = useState("");
  const [formOtherNote, setFormOtherNote] = useState("");
  const [formZoomLink, setFormZoomLink] = useState("");
  const [formSuccessorLink, setFormSuccessorLink] = useState("");
  const [formMaterials, setFormMaterials] = useState("");
  const [formStatus, setFormStatus] = useState<"Đang diễn ra" | "Bảo lưu" | "Đã kết thúc">("Đang diễn ra");

  const filteredClasses = classesList.filter((c) => {
    const query = searchQuery.toLowerCase();
    return c.className.toLowerCase().includes(query) || 
           c.teacher.toLowerCase().includes(query) ||
           c.progress.toLowerCase().includes(query);
  });

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    alert(`Đã sao chép ${label}!`);
  };

  const openAddModal = () => {
    setFormMode("add");
    setCurrentId(null);
    setFormClassName("");
    setFormInputNeed("");
    setFormTeacher("");
    setFormSchedule("");
    setFormStartDate("");
    setFormEndDate("");
    setFormProgress("");
    setFormOutput("");
    setFormOtherNote("");
    setFormZoomLink("");
    setFormSuccessorLink("");
    setFormMaterials("");
    setFormStatus("Đang diễn ra");
    setIsFormOpen(true);
  };

  const openEditModal = (c: Aca11Class, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent details modal
    setFormMode("edit");
    setCurrentId(c.id);
    setFormClassName(c.className);
    setFormInputNeed(c.inputNeed);
    setFormTeacher(c.teacher);
    setFormSchedule(c.schedule);
    setFormStartDate(c.startDate);
    setFormEndDate(c.endDate);
    setFormProgress(c.progress);
    setFormOutput(c.output);
    setFormOtherNote(c.otherNote);
    setFormZoomLink(c.zoomLink || "");
    setFormSuccessorLink(c.successorLink || "");
    setFormMaterials(c.materials || "");
    setFormStatus(c.status);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent details modal
    if (confirm("Bạn có chắc chắn muốn xóa lớp 1:1 này?")) {
      try {
        await deleteAca11Class(id);
        setClassesList((prev) => prev.filter((c) => c.id !== id));
        if (selectedClass?.id === id) setSelectedClass(null);
      } catch (err: any) {
        alert("Xóa thất bại: " + err.message);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      className: formClassName,
      inputNeed: formInputNeed,
      teacher: formTeacher,
      schedule: formSchedule,
      startDate: formStartDate,
      endDate: formEndDate,
      progress: formProgress,
      output: formOutput,
      otherNote: formOtherNote,
      zoomLink: formZoomLink,
      successorLink: formSuccessorLink,
      materials: formMaterials,
      status: formStatus,
    };

    try {
      if (formMode === "add") {
        const newClass = await createAca11Class(payload);
        setClassesList((prev) => [...prev, newClass]);
      } else if (formMode === "edit" && currentId) {
        const updated = await updateAca11Class(currentId, payload);
        setClassesList((prev) =>
          prev.map((c) => (c.id === currentId ? updated : c))
        );
      }
      setIsFormOpen(false);
    } catch (err: any) {
      alert("Lưu thất bại: " + err.message);
    }
  };

  return (
    <AcaLayout>
      <AcaTopbar
        title="Danh sách lớp 1:1 (Riêng)"
        subtitle="Quản lý chi tiết trạng thái, đầu vào/nhu cầu, giáo viên, lịch học và tiến độ của lớp 1 kèm 1."
      />
      <main className="mx-auto w-full px-6 py-6 pb-16 md:px-8 space-y-6">

        {/* Highlight Metrics */}
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Tổng số lớp 1:1</div>
            <div className="mt-2 text-2xl font-black text-foreground">{classesList.length} lớp</div>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Lớp Đang diễn ra</div>
            <div className="mt-2 text-2xl font-black text-primary">
              {classesList.filter(c => c.status === "Đang diễn ra").length} lớp
            </div>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Lớp Đang Bảo lưu</div>
            <div className="mt-2 text-2xl font-black text-warning">
              {classesList.filter(c => c.status === "Bảo lưu").length} lớp
            </div>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Lớp Đã kết thúc</div>
            <div className="mt-2 text-2xl font-black text-success">
              {classesList.filter(c => c.status === "Đã kết thúc").length} lớp
            </div>
          </div>
        </div>

        {/* Filter and action header */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-zinc-200/80 shadow-sm">
          <div className="flex flex-1 min-w-[200px] max-w-md items-center gap-2">
            <label className="text-xs font-black uppercase text-muted tracking-wider">Tìm kiếm:</label>
            <input
              type="text"
              placeholder="Tìm theo tên học viên, GV hoặc tiến độ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-4 text-xs font-bold text-foreground outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
            />
          </div>

          <button
            onClick={openAddModal}
            className="h-10 rounded-xl bg-primary text-white px-5 text-xs font-black uppercase shadow-soft hover:shadow-hover hover:-translate-y-0.5 transition-all"
          >
            Thêm lớp 1:1 +
          </button>
        </div>

        {/* Classes Table */}
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1600px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-[10px] font-black uppercase tracking-widest text-muted whitespace-nowrap">
                  <th className="px-6 py-4 min-w-[150px]">Trạng thái</th>
                  <th className="px-6 py-4 min-w-[320px]">Tên lớp / RLP (Click xem chi tiết)</th>
                  <th className="px-6 py-4 min-w-[150px]">Đầu vào / Nhu cầu</th>
                  <th className="px-6 py-4 min-w-[180px]">Giáo viên phụ trách</th>
                  <th className="px-6 py-4 min-w-[280px]">Lịch học</th>
                  <th className="px-6 py-4 min-w-[180px]">Ngày khai giảng</th>
                  <th className="px-6 py-4 min-w-[180px]">Ngày kết thúc</th>
                  <th className="px-6 py-4 min-w-[150px]">Đầu ra</th>
                  <th className="px-6 py-4 text-center min-w-[150px]">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-semibold text-zinc-700">
                {filteredClasses.length > 0 ? (
                  filteredClasses.map((item) => (
                    <tr 
                      key={item.id} 
                      className="hover:bg-zinc-50/80 align-middle cursor-pointer transition-colors"
                      onClick={() => setSelectedClass(item)}
                      title="Click xem chi tiết thời khóa biểu, tài liệu Drive và tiến độ chi tiết"
                    >
                      <td className="px-6 py-4 min-w-[150px]">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-black uppercase ${
                          item.status === "Đang diễn ra"
                            ? "bg-primary/15 text-primary"
                            : item.status === "Bảo lưu"
                            ? "bg-warning/15 text-warning"
                            : "bg-success/15 text-success"
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 min-w-[320px]">
                        <div className="font-black text-primary hover:underline">{item.className}</div>
                      </td>
                      <td className="px-6 py-4 text-zinc-700 min-w-[150px] font-bold whitespace-pre-line">{item.inputNeed}</td>
                      <td className="px-6 py-4 text-zinc-800 min-w-[180px] font-black whitespace-pre-line">{item.teacher}</td>
                      <td className="px-6 py-4 text-zinc-600 min-w-[280px] font-medium whitespace-pre-line leading-relaxed">{item.schedule}</td>
                      <td className="px-6 py-4 text-zinc-500 min-w-[180px] whitespace-pre-line leading-relaxed">{item.startDate}</td>
                      <td className="px-6 py-4 text-zinc-500 min-w-[180px] whitespace-pre-line leading-relaxed">{item.endDate}</td>
                      <td className="px-6 py-4 text-zinc-700 min-w-[150px] font-bold whitespace-pre-line">{item.output}</td>
                      <td className="px-6 py-4 text-center whitespace-nowrap min-w-[150px]">
                        <button
                          onClick={(e) => openEditModal(item, e)}
                          className="text-primary hover:text-primary-soft mr-3 font-black"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={(e) => handleDelete(item.id, e)}
                          className="text-danger hover:text-red-400 font-black"
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="px-6 py-8 text-center text-zinc-400 font-medium">
                      Không tìm thấy lớp học 1:1 nào phù hợp.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>

      {/* CLASS DETAILS MODAL */}
      {selectedClass && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl border border-zinc-200 max-w-2xl w-full p-6 shadow-2xl relative overflow-hidden animate-in zoom-in duration-200 max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start pb-4 border-b border-zinc-100">
              <div>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase mb-1 ${
                  selectedClass.status === "Đang diễn ra"
                    ? "bg-primary/10 text-primary"
                    : selectedClass.status === "Bảo lưu"
                    ? "bg-warning/10 text-warning"
                    : "bg-success/10 text-success"
                }`}>
                  Lớp 1:1 • {selectedClass.status}
                </span>
                <h3 className="text-base font-black text-foreground">{selectedClass.className}</h3>
              </div>
              <button
                onClick={() => setSelectedClass(null)}
                className="text-zinc-400 hover:text-zinc-700 text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto py-4 space-y-5 text-xs">
              
              {/* Parameters details */}
              <div className="grid grid-cols-2 gap-4 bg-zinc-50 p-4 rounded-2xl border border-zinc-200/50">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-zinc-500 font-bold">Giáo viên phụ trách:</span>
                    <span className="font-black text-zinc-800 whitespace-pre-line text-right">{selectedClass.teacher}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500 font-bold">Đầu vào / Nhu cầu:</span>
                    <span className="font-black text-primary text-right whitespace-pre-line">{selectedClass.inputNeed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500 font-bold">Lịch học chi tiết:</span>
                    <span className="font-semibold text-zinc-800 text-right whitespace-pre-line">{selectedClass.schedule}</span>
                  </div>
                </div>
                <div className="space-y-2 border-l border-zinc-200 pl-4">
                  <div className="flex justify-between">
                    <span className="text-zinc-500 font-bold">Ngày khai giảng:</span>
                    <span className="font-black text-zinc-800 text-right whitespace-pre-line">{selectedClass.startDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500 font-bold">Ngày kết thúc:</span>
                    <span className="font-black text-zinc-800 text-right whitespace-pre-line">{selectedClass.endDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500 font-bold">Đầu ra / Kết quả:</span>
                    <span className="font-black text-zinc-800 text-right whitespace-pre-line">{selectedClass.output}</span>
                  </div>
                </div>
              </div>

              {/* Progress Description Banner */}
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 space-y-1">
                <h4 className="text-[10px] font-black uppercase text-primary tracking-wider">TÌNH TRẠNG TIẾN ĐỘ</h4>
                <p className="font-bold text-zinc-800 leading-relaxed whitespace-pre-line">
                  {selectedClass.progress || "Không có ghi chú tiến độ học tập."}
                </p>
              </div>

              {/* Quick links & Resources */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-zinc-400">LIÊN KẾT & TÀI NGUYÊN LỚP HỌC</h4>
                <div className="grid grid-cols-3 gap-2">
                  
                  {/* Zoom meet link */}
                  <div className="rounded-xl border border-zinc-200 bg-white p-3 space-y-2">
                    <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest block">LINK ZOOM / MEET</span>
                    {selectedClass.zoomLink ? (
                      <div className="flex gap-1">
                        <a
                          href={selectedClass.zoomLink}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 text-center bg-primary text-white py-1 rounded-lg font-black text-[10px] hover:opacity-90 block"
                        >
                          VÀO HỌC ↗
                        </a>
                        <button
                          onClick={() => handleCopy(selectedClass.zoomLink!, "Link Zoom")}
                          className="px-2 border border-zinc-200 rounded-lg text-zinc-500 hover:bg-zinc-50 font-black text-[9px]"
                        >
                          Copy
                        </button>
                      </div>
                    ) : (
                      <span className="text-zinc-300 font-black block text-[10px]">-</span>
                    )}
                  </div>

                  {/* Successor Link */}
                  <div className="rounded-xl border border-zinc-200 bg-white p-3 space-y-2">
                    <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest block">LINK TAB THEO DÕI</span>
                    {selectedClass.successorLink ? (
                      <div className="flex gap-1">
                        <a
                          href={selectedClass.successorLink}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 text-center bg-secondary text-white py-1 rounded-lg font-black text-[10px] hover:opacity-90 block"
                        >
                          MỞ LINK ↗
                        </a>
                        <button
                          onClick={() => handleCopy(selectedClass.successorLink!, "Link Tab")}
                          className="px-2 border border-zinc-200 rounded-lg text-zinc-500 hover:bg-zinc-50 font-black text-[9px]"
                        >
                          Copy
                        </button>
                      </div>
                    ) : (
                      <span className="text-zinc-300 font-black block text-[10px]">-</span>
                    )}
                  </div>

                  {/* Teaching Materials link */}
                  <div className="rounded-xl border border-zinc-200 bg-white p-3 space-y-2">
                    <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest block">TÀI LIỆU (DRIVE)</span>
                    {selectedClass.materials ? (
                      <div className="flex gap-1">
                        <a
                          href={selectedClass.materials}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 text-center bg-amber-600 text-white py-1 rounded-lg font-black text-[10px] hover:opacity-90 block"
                        >
                          THƯ MỤC ↗
                        </a>
                        <button
                          onClick={() => handleCopy(selectedClass.materials!, "Link Drive")}
                          className="px-2 border border-zinc-200 rounded-lg text-zinc-500 hover:bg-zinc-50 font-black text-[9px]"
                        >
                          Copy
                        </button>
                      </div>
                    ) : (
                      <span className="text-zinc-300 font-black block text-[10px]">-</span>
                    )}
                  </div>

                </div>
              </div>

              {/* Other Notes */}
              <div className="bg-zinc-50 rounded-2xl border border-zinc-200/60 p-4 space-y-2">
                <h4 className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">ACADEMIC NOTES & OTHER NOTES</h4>
                <p className="font-sans text-xs font-semibold text-zinc-700 leading-relaxed whitespace-pre-wrap">
                  {selectedClass.otherNote || "Không có ghi chú hoặc hướng dẫn thêm."}
                </p>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-zinc-100 flex justify-end">
              <button
                onClick={() => setSelectedClass(null)}
                className="h-9 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-5 text-xs font-black uppercase"
              >
                Đóng lại
              </button>
            </div>

          </div>
        </div>
      )}

      {/* CRUD FORM MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl border border-zinc-200 max-w-lg w-full p-6 shadow-2xl relative overflow-hidden animate-in zoom-in duration-200">
            <h3 className="text-sm font-black uppercase tracking-widest text-foreground mb-4">
              {formMode === "add" ? "Thêm lớp học 1:1 mới" : "Chỉnh sửa thông tin lớp 1:1"}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-[10px] font-black uppercase text-muted tracking-widest mb-1.5">Tên lớp / RLP</label>
                <input
                  type="text"
                  required
                  value={formClassName}
                  onChange={(e) => setFormClassName(e.target.value)}
                  placeholder="Ví dụ: 2025RLP_ONL 1:1 Dương Bảo Ngọc"
                  className="h-10 w-full rounded-xl border border-zinc-200 px-4 font-bold text-foreground outline-none focus:border-primary/45 focus:ring-2 focus:ring-primary/10"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-muted tracking-widest mb-1.5">Đầu vào / Nhu cầu</label>
                  <input
                    type="text"
                    required
                    value={formInputNeed}
                    onChange={(e) => setFormInputNeed(e.target.value)}
                    placeholder="Ví dụ: 5.5/7.0..."
                    className="h-10 w-full rounded-xl border border-zinc-200 px-4 font-bold text-foreground outline-none focus:border-primary/45 focus:ring-2 focus:ring-primary/10"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-muted tracking-widest mb-1.5">Giáo viên phụ trách</label>
                  <input
                    type="text"
                    required
                    value={formTeacher}
                    onChange={(e) => setFormTeacher(e.target.value)}
                    placeholder="Tên giáo viên..."
                    className="h-10 w-full rounded-xl border border-zinc-200 px-4 font-bold text-foreground outline-none focus:border-primary/45 focus:ring-2 focus:ring-primary/10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-muted tracking-widest mb-1.5">Ngày khai giảng</label>
                  <input
                    type="text"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    placeholder="Ngày khai giảng..."
                    className="h-10 w-full rounded-xl border border-zinc-200 px-4 font-bold text-foreground outline-none focus:border-primary/45 focus:ring-2 focus:ring-primary/10"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-muted tracking-widest mb-1.5">Ngày kết thúc</label>
                  <input
                    type="text"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    placeholder="Ngày kết thúc..."
                    className="h-10 w-full rounded-xl border border-zinc-200 px-4 font-bold text-foreground outline-none focus:border-primary/45 focus:ring-2 focus:ring-primary/10"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-muted tracking-widest mb-1.5">Trạng thái</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="h-10 w-full rounded-xl border border-zinc-200 px-4 font-bold text-foreground outline-none focus:border-primary/45 focus:ring-2 focus:ring-primary/10 bg-white"
                  >
                    <option value="Đang diễn ra">Đang diễn ra</option>
                    <option value="Bảo lưu">Bảo lưu</option>
                    <option value="Đã kết thúc">Đã kết thúc</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-muted tracking-widest mb-1.5">Lịch học</label>
                <textarea
                  value={formSchedule}
                  onChange={(e) => setFormSchedule(e.target.value)}
                  placeholder="Ví dụ: T3,5 14h-16h..."
                  className="w-full min-h-[60px] rounded-xl border border-zinc-200 p-3 font-bold text-foreground outline-none focus:border-primary/45 focus:ring-2 focus:ring-primary/10 bg-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-muted tracking-widest mb-1.5">Link Zoom</label>
                  <input
                    type="text"
                    value={formZoomLink}
                    onChange={(e) => setFormZoomLink(e.target.value)}
                    placeholder="Link zoom..."
                    className="h-10 w-full rounded-xl border border-zinc-200 px-4 font-bold text-foreground outline-none focus:border-primary/45 focus:ring-2 focus:ring-primary/10"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-muted tracking-widest mb-1.5">Link Tab</label>
                  <input
                    type="text"
                    value={formSuccessorLink}
                    onChange={(e) => setFormSuccessorLink(e.target.value)}
                    placeholder="Link sheet..."
                    className="h-10 w-full rounded-xl border border-zinc-200 px-4 font-bold text-foreground outline-none focus:border-primary/45 focus:ring-2 focus:ring-primary/10"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-muted tracking-widest mb-1.5">Drive tài liệu</label>
                  <input
                    type="text"
                    value={formMaterials}
                    onChange={(e) => setFormMaterials(e.target.value)}
                    placeholder="Link drive..."
                    className="h-10 w-full rounded-xl border border-zinc-200 px-4 font-bold text-foreground outline-none focus:border-primary/45 focus:ring-2 focus:ring-primary/10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-muted tracking-widest mb-1.5">Đầu ra / Kết quả</label>
                <input
                  type="text"
                  value={formOutput}
                  onChange={(e) => setFormOutput(e.target.value)}
                  placeholder="Ví dụ: Final lần 1: 5.5..."
                  className="h-10 w-full rounded-xl border border-zinc-200 px-4 font-bold text-foreground outline-none focus:border-primary/45 focus:ring-2 focus:ring-primary/10"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-muted tracking-widest mb-1.5">Tình trạng tiến độ</label>
                <textarea
                  value={formProgress}
                  onChange={(e) => setFormProgress(e.target.value)}
                  placeholder="Ghi chú về tiến độ học của bạn..."
                  className="w-full min-h-[60px] rounded-xl border border-zinc-200 p-3 font-bold text-foreground outline-none focus:border-primary/45 focus:ring-2 focus:ring-primary/10 bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-muted tracking-widest mb-1.5">Ghi chú khác</label>
                <textarea
                  value={formOtherNote}
                  onChange={(e) => setFormOtherNote(e.target.value)}
                  placeholder="Lưu ý học viên, yêu cầu đặc biệt..."
                  className="w-full min-h-[50px] rounded-xl border border-zinc-200 p-3 font-bold text-foreground outline-none focus:border-primary/45 focus:ring-2 focus:ring-primary/10 bg-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
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
    </AcaLayout>
  );
}
