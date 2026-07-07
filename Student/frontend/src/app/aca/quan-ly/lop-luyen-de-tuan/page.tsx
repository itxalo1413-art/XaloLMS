"use client";

import { useState, useEffect } from "react";
import { AcaLayout } from "@/components/aca/AcaLayout";
import { AcaTopbar } from "@/components/aca/AcaTopbar";
import {
  fetchAcaPracticeWeeks,
  fetchAcaPracticeStudents,
  createAcaPracticeStudent,
  updateAcaPracticeStudent,
  deleteAcaPracticeStudent,
  AcaPracticeWeek,
  AcaPracticeStudent,
} from "@/lib/acaManagementApi";

export default function LopLuyenDeTuanPage() {
  const [weeksList, setWeeksList] = useState<AcaPracticeWeek[]>([]);
  const [selectedWeekRange, setSelectedWeekRange] = useState<string>("");
  const [studentsList, setStudentsList] = useState<AcaPracticeStudent[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [currentId, setCurrentId] = useState<string | null>(null);

  // Form Field States
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formRlp, setFormRlp] = useState("");
  const [formScheduleTue, setFormScheduleTue] = useState("Không học");
  const [formScheduleSat, setFormScheduleSat] = useState("Không học");
  const [formScheduleSun, setFormScheduleSun] = useState("Có tham gia");
  const [formParticipateLd28, setFormParticipateLd28] = useState(false);
  const [formNote, setFormNote] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const [wData, sData] = await Promise.all([
          fetchAcaPracticeWeeks(),
          fetchAcaPracticeStudents(),
        ]);
        setWeeksList(wData);
        setStudentsList(sData);
        if (wData.length > 0) {
          // Default to the last week range (usually the most recent one) or index 2
          const defaultWeek = wData[2]?.weekRange || wData[0]?.weekRange || "";
          setSelectedWeekRange(defaultWeek);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Get active week info
  const activeWeekInfo = weeksList.find(w => w.weekRange === selectedWeekRange) || weeksList[0];

  // Filter students based on week range and search query
  const filteredStudents = studentsList.filter((st) => {
    const matchesWeek = st.weekRange === selectedWeekRange;
    const matchesSearch = st.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          st.rlp.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          st.phone.includes(searchQuery);
    return matchesWeek && matchesSearch;
  });

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    alert(`Đã sao chép ${label} vào clipboard!`);
  };

  const openAddModal = () => {
    setModalMode("add");
    setCurrentId(null);
    setFormName("");
    setFormPhone("");
    setFormRlp("");
    setFormScheduleTue("Không học");
    setFormScheduleSat("Không học");
    setFormScheduleSun("Có tham gia");
    setFormParticipateLd28(false);
    setFormNote("");
    setIsModalOpen(true);
  };

  const openEditModal = (st: AcaPracticeStudent) => {
    setModalMode("edit");
    setCurrentId(st.id);
    setFormName(st.name);
    setFormPhone(st.phone);
    setFormRlp(st.rlp);
    setFormScheduleTue(st.scheduleTue || (st.scheduleTueSat?.toLowerCase().includes("t3") ? "Ca 1 (18h-20h)" : "Không học"));
    setFormScheduleSat(st.scheduleSat || (st.scheduleTueSat?.toLowerCase().includes("t7") ? "Ca 1 (18h-20h)" : "Không học"));
    setFormScheduleSun(st.scheduleSun || st.testScheduleSunday || "Có tham gia");
    setFormParticipateLd28(st.participateLd28);
    setFormNote(st.note);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa học viên luyện đề này?")) {
      try {
        await deleteAcaPracticeStudent(id);
        setStudentsList((prev) => prev.filter((s) => s.id !== id));
      } catch (err: any) {
        alert("Xóa thất bại: " + err.message);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: formName,
      phone: formPhone,
      rlp: formRlp,
      testScheduleSunday: formScheduleSun,
      scheduleTueSat: `${formScheduleTue !== "Không học" ? `T3: ${formScheduleTue}` : ""}${formScheduleTue !== "Không học" && formScheduleSat !== "Không học" ? ", " : ""}${formScheduleSat !== "Không học" ? `T7: ${formScheduleSat}` : ""}`,
      scheduleTue: formScheduleTue,
      scheduleSat: formScheduleSat,
      scheduleSun: formScheduleSun,
      participateLd28: formParticipateLd28,
      note: formNote,
      weekRange: selectedWeekRange,
    };

    try {
      if (modalMode === "add") {
        const newStudent = await createAcaPracticeStudent({
          ...payload,
          stt: studentsList.length + 1,
        });
        setStudentsList((prev) => [...prev, newStudent]);
      } else if (modalMode === "edit" && currentId) {
        const updated = await updateAcaPracticeStudent(currentId, payload);
        setStudentsList((prev) =>
          prev.map((s) => (s.id === currentId ? updated : s))
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
        title="Quản lý lớp luyện đề (Theo tuần)"
        subtitle="Theo dõi chi tiết lịch học luyện đề, lịch test chủ nhật, link meet phòng học và thông tin tham gia của học viên."
      />
      <main className="mx-auto w-full px-6 py-6 pb-16 md:px-8 space-y-6">

        {/* Filters and Week selector */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-zinc-200/80 shadow-sm">
          <div className="flex flex-wrap items-center gap-4 flex-1">
            <div className="flex items-center gap-2">
              <label className="text-xs font-black uppercase text-muted tracking-wider">Chọn tuần học:</label>
              <select
                value={selectedWeekRange}
                onChange={(e) => setSelectedWeekRange(e.target.value)}
                className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-xs font-bold text-foreground outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
              >
                {weeksList.map((w, idx) => (
                  <option key={idx} value={w.weekRange}>{w.weekRange}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-1 min-w-[200px] max-w-md items-center gap-2">
              <label className="text-xs font-black uppercase text-muted tracking-wider">Tìm kiếm:</label>
              <input
                type="text"
                placeholder="Nhập tên học viên hoặc mã lớp RLP..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-4 text-xs font-bold text-foreground outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-xs font-black text-primary uppercase bg-primary/10 px-3 py-2 rounded-xl">
              Sỉ số: {filteredStudents.length} học viên
            </div>
            <button
              onClick={openAddModal}
              className="h-10 rounded-xl bg-primary text-white px-5 text-xs font-black uppercase shadow-soft hover:shadow-hover hover:-translate-y-0.5 transition-all"
            >
              Thêm học viên +
            </button>
          </div>
        </div>

        {/* Dashboard grid for metadata & announcement templates */}
        {activeWeekInfo && (
          <div className="grid gap-6 md:grid-cols-3">
            
            {/* Left metadata panel */}
            <div className="space-y-6 md:col-span-1">
              
              {/* Quick links */}
              <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-foreground pb-2 border-b border-zinc-100">
                  Phòng học & Tab theo dõi
                </h3>
                <div className="space-y-3">
                  <div>
                    <div className="text-[10px] font-black uppercase text-muted tracking-wider mb-1">LINK MEET (Mail ACA)</div>
                    <div className="flex gap-2">
                      <a
                        href={activeWeekInfo.linkMeet}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 h-9 rounded-xl bg-primary text-white flex items-center justify-center text-xs font-black hover:opacity-90"
                      >
                        Vào phòng học ↗
                      </a>
                      <button
                        onClick={() => handleCopy(activeWeekInfo.linkMeet, "Link Meet")}
                        className="px-3 rounded-xl border border-zinc-200 text-zinc-500 hover:bg-zinc-50 text-xs font-bold"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-[10px] font-black uppercase text-muted tracking-wider mb-1">LINK TAB THEO DÕI</div>
                    <div className="flex gap-2">
                      <a
                        href={activeWeekInfo.linkTab}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 h-9 rounded-xl bg-secondary text-white flex items-center justify-center text-xs font-black hover:opacity-90"
                      >
                        Mở link sheet ↗
                      </a>
                      <button
                        onClick={() => handleCopy(activeWeekInfo.linkTab, "Link Tab")}
                        className="px-3 rounded-xl border border-zinc-200 text-zinc-500 hover:bg-zinc-50 text-xs font-bold"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Announcement template */}
              <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-zinc-100">
                  <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                    Thông báo chung
                  </h3>
                  <button
                    onClick={() => handleCopy(activeWeekInfo.announcement, "Thông báo chung")}
                    className="text-[10px] font-black uppercase text-primary hover:underline"
                  >
                    Copy tin nhắn
                  </button>
                </div>
                <pre className="text-xs font-semibold text-zinc-600 bg-zinc-50 p-3 rounded-xl overflow-x-auto whitespace-pre-wrap leading-relaxed font-sans max-h-[180px] overflow-y-auto">
                  {activeWeekInfo.announcement}
                </pre>
              </div>

              {/* Individual Student notification message */}
              <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-zinc-100">
                  <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                    Tin nhắn gửi HV
                  </h3>
                  <button
                    onClick={() => handleCopy(activeWeekInfo.templateMessage, "Tin nhắn gửi học viên")}
                    className="text-[10px] font-black uppercase text-primary hover:underline"
                  >
                    Copy tin nhắn
                  </button>
                </div>
                <div className="text-xs font-semibold text-zinc-600 bg-zinc-50 p-3 rounded-xl leading-relaxed max-h-[120px] overflow-y-auto">
                  {activeWeekInfo.templateMessage}
                </div>
              </div>

            </div>

            {/* Right main student list panel */}
            <div className="md:col-span-2">
              <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1500px] border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-zinc-200 bg-zinc-50 text-[10px] font-black uppercase tracking-widest text-muted whitespace-nowrap">
                        <th className="px-6 py-4 text-center min-w-[70px]">STT</th>
                        <th className="px-6 py-4 min-w-[180px]">Tên học viên</th>
                        <th className="px-6 py-4 min-w-[120px]">Số điện thoại</th>
                        <th className="px-6 py-4 min-w-[240px]">Lớp RLP</th>
                        <th className="px-6 py-4 min-w-[180px]">Thứ 3 (T3)</th>
                        <th className="px-6 py-4 min-w-[180px]">Thứ 7 (T7)</th>
                        <th className="px-6 py-4 min-w-[180px]">Chủ Nhật (CN)</th>
                        <th className="px-6 py-4 text-center min-w-[150px]">Tham gia test LĐ 28</th>
                        <th className="px-6 py-4 min-w-[200px]">Ghi chú (Note)</th>
                        <th className="px-6 py-4 text-center min-w-[140px]">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 font-semibold text-zinc-700">
                      {filteredStudents.length > 0 ? (
                        filteredStudents.map((st, idx) => (
                          <tr key={st.id} className="hover:bg-zinc-50/55 align-middle">
                            <td className="px-6 py-4 text-center tabular-nums text-zinc-400">{idx + 1}</td>
                            <td className="px-6 py-4 font-black text-foreground min-w-[180px]">{st.name}</td>
                            <td className="px-6 py-4 tabular-nums text-zinc-500 min-w-[120px]">{st.phone}</td>
                            <td className="px-6 py-4 font-medium text-zinc-800 min-w-[240px]">{st.rlp}</td>
                            {/* T3 Schedule */}
                            <td className="px-6 py-4 min-w-[180px]">
                              <span className={`px-2 py-0.5 rounded-lg font-black text-[10px] ${
                                st.scheduleTue === "Không học" || !st.scheduleTue
                                  ? "bg-zinc-100 text-zinc-400"
                                  : "bg-primary/10 text-primary"
                              }`}>
                                {st.scheduleTue || (st.scheduleTueSat?.toLowerCase().includes("t3") ? "Ca 1 (18h-20h)" : "Không học")}
                              </span>
                            </td>
                            {/* T7 Schedule */}
                            <td className="px-6 py-4 min-w-[180px]">
                              <span className={`px-2 py-0.5 rounded-lg font-black text-[10px] ${
                                st.scheduleSat === "Không học" || !st.scheduleSat
                                  ? "bg-zinc-100 text-zinc-400"
                                  : "bg-primary/10 text-primary"
                              }`}>
                                {st.scheduleSat || (st.scheduleTueSat?.toLowerCase().includes("t7") ? "Ca 1 (18h-20h)" : "Không học")}
                              </span>
                            </td>
                            {/* CN Schedule */}
                            <td className="px-6 py-4 min-w-[180px]">
                              <span className={`px-2 py-0.5 rounded-lg font-black text-[10px] ${
                                st.scheduleSun === "Không học" || st.testScheduleSunday === "Không tham gia" || st.testScheduleSunday === "Không có/Chưa chọn"
                                  ? "bg-zinc-100 text-zinc-400"
                                  : st.scheduleSun === "Gửi đề vào CN" || st.testScheduleSunday === "Gửi đề vào CN"
                                  ? "bg-blue-100 text-blue-700"
                                  : st.scheduleSun === "Đăng ký lịch khác" || st.testScheduleSunday === "Đăng ký lịch khác"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-success/10 text-success"
                              }`}>
                                {st.scheduleSun || st.testScheduleSunday || "Có tham gia"}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center min-w-[150px]">
                              {st.participateLd28 ? (
                                <span className="rounded-full bg-success/15 px-2.5 py-1 text-[9px] font-black uppercase text-success">
                                  TRUE
                                </span>
                              ) : (
                                <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[9px] font-black uppercase text-zinc-400">
                                  FALSE
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-zinc-500 min-w-[200px] font-medium">{st.note || "-"}</td>
                            <td className="px-6 py-4 text-center whitespace-nowrap min-w-[140px]">
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
                          <td colSpan={9} className="px-6 py-8 text-center text-zinc-400 font-medium">
                            Không tìm thấy học viên nào trong tuần này.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* CRUD MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl border border-zinc-200 max-w-lg w-full p-6 shadow-2xl relative overflow-hidden animate-in zoom-in duration-200">
            <h3 className="text-sm font-black uppercase tracking-widest text-foreground mb-4">
              {modalMode === "add" ? "Thêm học viên vào lớp LĐ" : "Chỉnh sửa đăng ký lớp LĐ"}
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
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="SĐT..."
                    className="h-10 w-full rounded-xl border border-zinc-200 px-4 font-bold text-foreground outline-none focus:border-primary/45 focus:ring-2 focus:ring-primary/10"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-muted tracking-widest mb-1.5">Mã lớp RLP</label>
                  <input
                    type="text"
                    value={formRlp}
                    onChange={(e) => setFormRlp(e.target.value)}
                    placeholder="RLP..."
                    className="h-10 w-full rounded-xl border border-zinc-200 px-4 font-bold text-foreground outline-none focus:border-primary/45 focus:ring-2 focus:ring-primary/10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-muted tracking-widest mb-1.5">Lịch học Thứ 3 (T3)</label>
                  <select
                    value={formScheduleTue}
                    onChange={(e) => setFormScheduleTue(e.target.value)}
                    className="h-10 w-full rounded-xl border border-zinc-200 px-4 font-bold text-foreground outline-none focus:border-primary/45 focus:ring-2 focus:ring-primary/10 bg-white"
                  >
                    <option value="Không học">Không học</option>
                    <option value="Ca 1 (18h-20h)">Ca 1 (18h-20h)</option>
                    <option value="Ca 2 (20h-22h)">Ca 2 (20h-22h)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-muted tracking-widest mb-1.5">Lịch học Thứ 7 (T7)</label>
                  <select
                    value={formScheduleSat}
                    onChange={(e) => setFormScheduleSat(e.target.value)}
                    className="h-10 w-full rounded-xl border border-zinc-200 px-4 font-bold text-foreground outline-none focus:border-primary/45 focus:ring-2 focus:ring-primary/10 bg-white"
                  >
                    <option value="Không học">Không học</option>
                    <option value="Ca 1 (18h-20h)">Ca 1 (18h-20h)</option>
                    <option value="Ca 2 (20h-22h)">Ca 2 (20h-22h)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-muted tracking-widest mb-1.5">Lịch test Chủ Nhật (CN)</label>
                  <select
                    value={formScheduleSun}
                    onChange={(e) => setFormScheduleSun(e.target.value)}
                    className="h-10 w-full rounded-xl border border-zinc-200 px-4 font-bold text-foreground outline-none focus:border-primary/45 focus:ring-2 focus:ring-primary/10 bg-white"
                  >
                    <option value="Có tham gia">Có tham gia (9h-11h)</option>
                    <option value="Gửi đề vào CN">Gửi đề vào CN</option>
                    <option value="Đăng ký lịch khác">Đăng ký lịch khác</option>
                    <option value="Không học">Không học</option>
                  </select>
                </div>
                <div className="flex items-center pt-5 pl-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formParticipateLd28}
                      onChange={(e) => setFormParticipateLd28(e.target.checked)}
                      className="w-4 h-4 rounded text-primary border-zinc-300 focus:ring-primary"
                    />
                    <span className="text-[10px] font-black uppercase text-muted tracking-wider">Tham gia test LĐ 28</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-muted tracking-widest mb-1.5">Ghi chú (Note)</label>
                <input
                  type="text"
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  placeholder="Ghi chú thêm..."
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
    </AcaLayout>
  );
}
