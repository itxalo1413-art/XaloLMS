"use client";

import { useState, useEffect } from "react";
import { AcaLayout } from "@/components/aca/AcaLayout";
import { AcaTopbar } from "@/components/aca/AcaTopbar";
import {
  fetchAcaPracticeWeeks,
  updateAcaPracticeWeek,
  findCurrentOrLatestPracticeWeekRange,
  ensureCurrentRealtimeWeekExists,
  AcaPracticeWeek,
} from "@/lib/acaManagementApi";
import { setPracticeZoomInfo, savePracticeScheduleFromAca } from "@/lib/practiceClass";
import { fetchPracticeRegistrationsForAca, type PracticeRegistrationAcaRow } from "@/lib/practiceClassApi";

export default function LopLuyenDeTuanPage() {
  const [weeksList, setWeeksList] = useState<AcaPracticeWeek[]>([]);
  const [selectedWeekRange, setSelectedWeekRange] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Week Metadata Edit States
  const [isEditingMeetingInfo, setIsEditingMeetingInfo] = useState(false);
  const [editZoomId, setEditZoomId] = useState("842 1963 4521");
  const [editZoomPassword, setEditZoomPassword] = useState("XaloLrw26");
  const [editLinkMeet, setEditLinkMeet] = useState("");
  const [editLinkTab, setEditLinkTab] = useState("");

  const [isEditingAnnouncement, setIsEditingAnnouncement] = useState(false);
  const [editAnnouncementText, setEditAnnouncementText] = useState("");

  const [isEditingTemplateMessage, setIsEditingTemplateMessage] = useState(false);
  const [editTemplateMessageText, setEditTemplateMessageText] = useState("");

  // Full Slot Title, Time, and Description Detail States
  const [isEditingScheduleDetails, setIsEditingScheduleDetails] = useState(false);
  const [editTueTitle, setEditTueTitle] = useState("Luyện tập Speaking theo chuyên đề");
  const [editTueTime, setEditTueTime] = useState("19h45 – 21h45");
  const [editTueDetail, setEditTueDetail] = useState(
    "Tham gia bằng Zoom, học với Giáo viên, phân tích bộ đề Speaking 3 part, được cung cấp từ vựng/phương pháp tiếp cận và luyện tập trực tiếp với Giáo viên."
  );

  const [editThuTitle, setEditThuTitle] = useState("Chữa đề L-R-W");
  const [editThuTime, setEditThuTime] = useState("19h45 – 21h45");
  const [editThuDetail, setEditThuDetail] = useState(
    "Tham gia bằng Zoom, học với Giáo viên, tập trung chữa đề Writing và các thắc mắc về Listening – Reading."
  );

  const [editSatTitle, setEditSatTitle] = useState("Làm đề L-R-W tập trung");
  const [editSatTime, setEditSatTime] = useState("19h – 21h30");
  const [editSatDetail, setEditSatDetail] = useState(
    "Tham gia bằng Zoom, làm bài trên Google Docs, có nhân viên canh thời gian làm bài và các bạn học viên khác tham gia."
  );

  // Registrations from student side
  const [registrationsList, setRegistrationsList] = useState<PracticeRegistrationAcaRow[]>([]);

  // Link folder bài tập cá nhân
  const [editLinkFolder, setEditLinkFolder] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const wData = await fetchAcaPracticeWeeks();
        const sortedWeeks = await ensureCurrentRealtimeWeekExists(wData);
        setWeeksList(sortedWeeks);
        if (sortedWeeks.length > 0) {
          const defaultWeek = findCurrentOrLatestPracticeWeekRange(sortedWeeks);
          setSelectedWeekRange(defaultWeek);
        }
        // Load student registrations from practice class system
        try {
          const regs = await fetchPracticeRegistrationsForAca();
          setRegistrationsList(regs);
        } catch (regErr) {
          console.warn("Could not load student registrations:", regErr);
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

  useEffect(() => {
    if (activeWeekInfo) {
      const zid = activeWeekInfo.zoomId || "842 1963 4521";
      const zpass = activeWeekInfo.zoomPassword || "XaloLrw26";
      setEditZoomId(zid);
      setEditZoomPassword(zpass);
      setEditLinkMeet(activeWeekInfo.linkMeet || "");
      setEditLinkTab(activeWeekInfo.linkTab || "");
      setEditLinkFolder(activeWeekInfo.linkFolder || "");
      setEditAnnouncementText(activeWeekInfo.announcement || "");
      setEditTemplateMessageText(activeWeekInfo.templateMessage || "");

      if (activeWeekInfo.scheduleTueTitle) setEditTueTitle(activeWeekInfo.scheduleTueTitle);
      if (activeWeekInfo.scheduleTueTime) setEditTueTime(activeWeekInfo.scheduleTueTime);
      if (activeWeekInfo.scheduleTueInfo) setEditTueDetail(activeWeekInfo.scheduleTueInfo);

      if (activeWeekInfo.scheduleThuTitle) setEditThuTitle(activeWeekInfo.scheduleThuTitle);
      if (activeWeekInfo.scheduleThuTime) setEditThuTime(activeWeekInfo.scheduleThuTime);
      if (activeWeekInfo.scheduleThuInfo) setEditThuDetail(activeWeekInfo.scheduleThuInfo);

      if (activeWeekInfo.scheduleSatTitle) setEditSatTitle(activeWeekInfo.scheduleSatTitle);
      if (activeWeekInfo.scheduleSatTime) setEditSatTime(activeWeekInfo.scheduleSatTime);
      if (activeWeekInfo.scheduleSatInfo) setEditSatDetail(activeWeekInfo.scheduleSatInfo);

      setPracticeZoomInfo({ zoomId: zid, zoomPassword: zpass });
    }
  }, [activeWeekInfo]);

  const saveWeekPartial = async (partial: Partial<AcaPracticeWeek>) => {
    if (!activeWeekInfo) return;
    try {
      const updated = await updateAcaPracticeWeek(activeWeekInfo.id, partial);
      setWeeksList((prev) => prev.map((w) => (w.id === activeWeekInfo.id ? { ...w, ...updated } : w)));
      if (partial.zoomId || partial.zoomPassword) {
        setPracticeZoomInfo({
          zoomId: partial.zoomId || editZoomId,
          zoomPassword: partial.zoomPassword || editZoomPassword,
        });
      }
      alert("Đã cập nhật thông tin thành công!");
    } catch (err: any) {
      alert("Lưu thất bại: " + err.message);
    }
  };

  // Filter registrations by search query
  const filteredRegistrations = registrationsList.filter((reg) =>
    reg.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    reg.slotTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    alert(`Đã sao chép ${label} vào clipboard!`);
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
              Đã đăng ký: {filteredRegistrations.length} học viên
            </div>
          </div>
        </div>

        {/* Dashboard grid for metadata & announcement templates */}
        {activeWeekInfo && (
          <div className="grid gap-6 md:grid-cols-3">
            
            {/* Left metadata panel */}
            <div className="space-y-6 md:col-span-1">
              
              {/* Quick links & Zoom credentials */}
              <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                  <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                    Phòng học & Tab theo dõi
                  </h3>
                  <button
                    onClick={() => {
                      if (isEditingMeetingInfo) {
                        saveWeekPartial({
                          zoomId: editZoomId,
                          zoomPassword: editZoomPassword,
                          linkMeet: editLinkMeet,
                          linkTab: editLinkTab,
                          linkFolder: editLinkFolder,
                        });
                        setIsEditingMeetingInfo(false);
                      } else {
                        setIsEditingMeetingInfo(true);
                      }
                    }}
                    className="text-[10px] font-black uppercase text-primary hover:underline"
                  >
                    {isEditingMeetingInfo ? "Lưu phòng" : "Chỉnh sửa"}
                  </button>
                </div>

                <div className="space-y-3">
                  {/* Zoom ID */}
                  <div>
                    <div className="text-[10px] font-black uppercase text-muted tracking-wider mb-1">ID PHÒNG ZOOM</div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        disabled={!isEditingMeetingInfo}
                        value={editZoomId}
                        onChange={(e) => setEditZoomId(e.target.value)}
                        placeholder="842 1963 4521"
                        className={`flex-1 h-9 rounded-xl border px-3 text-xs font-black outline-none ${
                          isEditingMeetingInfo ? "border-primary bg-white text-zinc-900" : "border-zinc-200 bg-zinc-50 text-indigo-900"
                        }`}
                      />
                      <button
                        onClick={() => handleCopy(editZoomId, "ID phòng Zoom")}
                        className="px-3 rounded-xl border border-zinc-200 text-zinc-600 hover:bg-zinc-50 text-xs font-bold shrink-0"
                      >
                        Copy
                      </button>
                    </div>
                  </div>

                  {/* Zoom Password */}
                  <div>
                    <div className="text-[10px] font-black uppercase text-muted tracking-wider mb-1">MẬT KHẨU ZOOM</div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        disabled={!isEditingMeetingInfo}
                        value={editZoomPassword}
                        onChange={(e) => setEditZoomPassword(e.target.value)}
                        placeholder="XaloLrw26"
                        className={`flex-1 h-9 rounded-xl border px-3 text-xs font-black outline-none ${
                          isEditingMeetingInfo ? "border-primary bg-white text-zinc-900" : "border-zinc-200 bg-zinc-50 text-indigo-900"
                        }`}
                      />
                      <button
                        onClick={() => handleCopy(editZoomPassword, "Mật khẩu Zoom")}
                        className="px-3 rounded-xl border border-zinc-200 text-zinc-600 hover:bg-zinc-50 text-xs font-bold shrink-0"
                      >
                        Copy
                      </button>
                    </div>
                  </div>

                  {/* Link Meet */}
                  <div>
                    <div className="text-[10px] font-black uppercase text-muted tracking-wider mb-1">LINK MEET / ZOOM (MAIL ACA)</div>
                    <div className="flex gap-2">
                      {isEditingMeetingInfo ? (
                        <input
                          type="text"
                          value={editLinkMeet}
                          onChange={(e) => setEditLinkMeet(e.target.value)}
                          placeholder="https://meet.google.com/..."
                          className="flex-1 h-9 rounded-xl border border-primary bg-white px-3 text-xs font-bold outline-none"
                        />
                      ) : (
                        <a
                          href={activeWeekInfo.linkMeet}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 h-9 rounded-xl bg-primary text-white flex items-center justify-center text-xs font-black hover:opacity-90 truncate px-2"
                        >
                          Vào phòng học ↗
                        </a>
                      )}
                      <button
                        onClick={() => handleCopy(editLinkMeet || activeWeekInfo.linkMeet, "Link Meet")}
                        className="px-3 rounded-xl border border-zinc-200 text-zinc-500 hover:bg-zinc-50 text-xs font-bold shrink-0"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  
                  {/* Link Tab */}
                  <div>
                    <div className="text-[10px] font-black uppercase text-muted tracking-wider mb-1">LINK TAB THEO DÕI (GOOGLE SHEET)</div>
                    <div className="flex gap-2">
                      {isEditingMeetingInfo ? (
                        <input
                          type="text"
                          value={editLinkTab}
                          onChange={(e) => setEditLinkTab(e.target.value)}
                          placeholder="https://docs.google.com/spreadsheets/..."
                          className="flex-1 h-9 rounded-xl border border-primary bg-white px-3 text-xs font-bold outline-none"
                        />
                      ) : (
                        <a
                          href={activeWeekInfo.linkTab}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 h-9 rounded-xl bg-secondary text-white flex items-center justify-center text-xs font-black hover:opacity-90 truncate px-2"
                        >
                          Mở link sheet ↗
                        </a>
                      )}
                      <button
                        onClick={() => handleCopy(editLinkTab || activeWeekInfo.linkTab, "Link Tab")}
                        className="px-3 rounded-xl border border-zinc-200 text-zinc-500 hover:bg-zinc-50 text-xs font-bold shrink-0"
                      >
                        Copy
                      </button>
                    </div>
                  </div>

                  {/* Link Folder Bài Tập Cá Nhân */}
                  <div>
                    <div className="text-[10px] font-black uppercase text-muted tracking-wider mb-1">FOLDER BÀI TẬP CÁ NHÂN & ĐIỂM TUẦN</div>
                    <div className="flex gap-2">
                      {isEditingMeetingInfo ? (
                        <input
                          type="text"
                          value={editLinkFolder}
                          onChange={(e) => setEditLinkFolder(e.target.value)}
                          placeholder="https://drive.google.com/drive/folders/..."
                          className="flex-1 h-9 rounded-xl border border-primary bg-white px-3 text-xs font-bold outline-none"
                        />
                      ) : editLinkFolder ? (
                        <a
                          href={editLinkFolder}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center text-xs font-black hover:opacity-90 truncate px-2"
                        >
                          📁 Mở Folder Bài Tập ↗
                        </a>
                      ) : (
                        <div className="flex-1 h-9 rounded-xl bg-zinc-100 flex items-center px-3 text-xs text-zinc-400 font-medium">
                          Chưa có link folder
                        </div>
                      )}
                      <button
                        onClick={() => handleCopy(editLinkFolder, "Link Folder Bài Tập")}
                        className="px-3 rounded-xl border border-zinc-200 text-zinc-500 hover:bg-zinc-50 text-xs font-bold shrink-0"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lịch Các Ca Trong Tuần */}
              <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-zinc-100">
                  <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                    Lịch ca học tuần (T3 - T5 - T7)
                  </h3>
                  <button
                    type="button"
                    onClick={async () => {
                      if (isEditingScheduleDetails) {
                        try {
                          await savePracticeScheduleFromAca(selectedWeekRange, {
                            "tue-lrw": {
                              dayLabel: "Thứ 3",
                              time: editTueTime,
                              title: editTueTitle,
                              detail: editTueDetail,
                              platform: "Zoom",
                            },
                            "sun-lrw": {
                              dayLabel: "Thứ 5",
                              time: editThuTime,
                              title: editThuTitle,
                              detail: editThuDetail,
                              platform: "Zoom",
                            },
                            "sat-speaking": {
                              dayLabel: "Thứ 7",
                              time: editSatTime,
                              title: editSatTitle,
                              detail: editSatDetail,
                              platform: "Zoom",
                            },
                          });
                          await saveWeekPartial({
                            scheduleTueTitle: editTueTitle,
                            scheduleTueTime: editTueTime,
                            scheduleTueInfo: editTueDetail,
                            scheduleThuTitle: editThuTitle,
                            scheduleThuTime: editThuTime,
                            scheduleThuInfo: editThuDetail,
                            scheduleSatTitle: editSatTitle,
                            scheduleSatTime: editSatTime,
                            scheduleSatInfo: editSatDetail,
                          });
                          setIsEditingScheduleDetails(false);
                          alert("Đã lưu thông tin chi tiết ca học thành công!");
                        } catch (err: any) {
                          alert("Lưu ca thất bại: " + err.message);
                        }
                      } else {
                        setIsEditingScheduleDetails(true);
                      }
                    }}
                    className="text-[10px] font-black uppercase text-primary hover:underline cursor-pointer"
                  >
                    {isEditingScheduleDetails ? "Lưu ca" : "Chỉnh sửa"}
                  </button>
                </div>

                <div className="space-y-4 text-xs">
                  {/* Slot 1: Thứ 3 */}
                  <div className="p-3 rounded-xl border border-zinc-100 bg-zinc-50/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-primary block text-[10px] uppercase">[Thứ 3]</span>
                      {!isEditingScheduleDetails && (
                        <span className="text-[10px] font-bold text-muted">{editTueTime}</span>
                      )}
                    </div>
                    {isEditingScheduleDetails ? (
                      <div className="space-y-2">
                        <div>
                          <label className="text-[9px] font-bold uppercase text-muted block mb-0.5">Tên ca học (Title):</label>
                          <input
                            type="text"
                            value={editTueTitle}
                            onChange={(e) => setEditTueTitle(e.target.value)}
                            placeholder="Luyện tập Speaking theo chuyên đề..."
                            className="w-full rounded-lg border border-primary px-2.5 py-1 text-xs font-bold outline-none bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold uppercase text-muted block mb-0.5">Thời gian học (Time):</label>
                          <input
                            type="text"
                            value={editTueTime}
                            onChange={(e) => setEditTueTime(e.target.value)}
                            placeholder="19h45 – 21h45..."
                            className="w-full rounded-lg border border-primary px-2.5 py-1 text-xs font-semibold outline-none bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold uppercase text-muted block mb-0.5">Mô tả chi tiết nội dung (Detail):</label>
                          <textarea
                            rows={3}
                            value={editTueDetail}
                            onChange={(e) => setEditTueDetail(e.target.value)}
                            placeholder="Mô tả nội dung bài học..."
                            className="w-full rounded-lg border border-primary p-2 text-xs font-medium outline-none bg-white"
                          />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="font-bold text-foreground">{editTueTitle}</div>
                        <div className="text-[11px] font-medium text-muted mt-0.5 leading-relaxed">{editTueDetail}</div>
                      </div>
                    )}
                  </div>

                  {/* Slot 2: Thứ 5 */}
                  <div className="p-3 rounded-xl border border-zinc-100 bg-zinc-50/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-primary block text-[10px] uppercase">[Thứ 5]</span>
                      {!isEditingScheduleDetails && (
                        <span className="text-[10px] font-bold text-muted">{editThuTime}</span>
                      )}
                    </div>
                    {isEditingScheduleDetails ? (
                      <div className="space-y-2">
                        <div>
                          <label className="text-[9px] font-bold uppercase text-muted block mb-0.5">Tên ca học (Title):</label>
                          <input
                            type="text"
                            value={editThuTitle}
                            onChange={(e) => setEditThuTitle(e.target.value)}
                            placeholder="Chữa đề L-R-W..."
                            className="w-full rounded-lg border border-primary px-2.5 py-1 text-xs font-bold outline-none bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold uppercase text-muted block mb-0.5">Thời gian học (Time):</label>
                          <input
                            type="text"
                            value={editThuTime}
                            onChange={(e) => setEditThuTime(e.target.value)}
                            placeholder="19h45 – 21h45..."
                            className="w-full rounded-lg border border-primary px-2.5 py-1 text-xs font-semibold outline-none bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold uppercase text-muted block mb-0.5">Mô tả chi tiết nội dung (Detail):</label>
                          <textarea
                            rows={3}
                            value={editThuDetail}
                            onChange={(e) => setEditThuDetail(e.target.value)}
                            placeholder="Mô tả nội dung bài học..."
                            className="w-full rounded-lg border border-primary p-2 text-xs font-medium outline-none bg-white"
                          />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="font-bold text-foreground">{editThuTitle}</div>
                        <div className="text-[11px] font-medium text-muted mt-0.5 leading-relaxed">{editThuDetail}</div>
                      </div>
                    )}
                  </div>

                  {/* Slot 3: Thứ 7 */}
                  <div className="p-3 rounded-xl border border-zinc-100 bg-zinc-50/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-primary block text-[10px] uppercase">[Thứ 7]</span>
                      {!isEditingScheduleDetails && (
                        <span className="text-[10px] font-bold text-muted">{editSatTime}</span>
                      )}
                    </div>
                    {isEditingScheduleDetails ? (
                      <div className="space-y-2">
                        <div>
                          <label className="text-[9px] font-bold uppercase text-muted block mb-0.5">Tên ca học (Title):</label>
                          <input
                            type="text"
                            value={editSatTitle}
                            onChange={(e) => setEditSatTitle(e.target.value)}
                            placeholder="Làm đề L-R-W tập trung..."
                            className="w-full rounded-lg border border-primary px-2.5 py-1 text-xs font-bold outline-none bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold uppercase text-muted block mb-0.5">Thời gian học (Time):</label>
                          <input
                            type="text"
                            value={editSatTime}
                            onChange={(e) => setEditSatTime(e.target.value)}
                            placeholder="19h – 21h30..."
                            className="w-full rounded-lg border border-primary px-2.5 py-1 text-xs font-semibold outline-none bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold uppercase text-muted block mb-0.5">Mô tả chi tiết nội dung (Detail):</label>
                          <textarea
                            rows={3}
                            value={editSatDetail}
                            onChange={(e) => setEditSatDetail(e.target.value)}
                            placeholder="Mô tả nội dung bài học..."
                            className="w-full rounded-lg border border-primary p-2 text-xs font-medium outline-none bg-white"
                          />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="font-bold text-foreground">{editSatTitle}</div>
                        <div className="text-[11px] font-medium text-muted mt-0.5 leading-relaxed">{editSatDetail}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Announcement template */}
              <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-zinc-100">
                  <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                    Thông báo chung
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (isEditingAnnouncement) {
                          saveWeekPartial({ announcement: editAnnouncementText });
                          setIsEditingAnnouncement(false);
                        } else {
                          setIsEditingAnnouncement(true);
                        }
                      }}
                      className="text-[10px] font-black uppercase text-primary hover:underline"
                    >
                      {isEditingAnnouncement ? "Lưu tin" : "Chỉnh sửa"}
                    </button>
                    <span className="text-zinc-300">|</span>
                    <button
                      onClick={() => handleCopy(editAnnouncementText || activeWeekInfo.announcement, "Thông báo chung")}
                      className="text-[10px] font-black uppercase text-primary hover:underline"
                    >
                      Copy tin nhắn
                    </button>
                  </div>
                </div>
                {isEditingAnnouncement ? (
                  <textarea
                    rows={6}
                    value={editAnnouncementText}
                    onChange={(e) => setEditAnnouncementText(e.target.value)}
                    className="w-full rounded-xl border border-primary p-3 text-xs font-semibold outline-none focus:ring-2 focus:ring-primary/10"
                  />
                ) : (
                  <pre className="text-xs font-semibold text-zinc-600 bg-zinc-50 p-3 rounded-xl overflow-x-auto whitespace-pre-wrap leading-relaxed font-sans max-h-[180px] overflow-y-auto">
                    {editAnnouncementText || activeWeekInfo.announcement}
                  </pre>
                )}
              </div>

              {/* Individual Student notification message */}
              <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-zinc-100">
                  <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                    Tin nhắn gửi HV
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (isEditingTemplateMessage) {
                          saveWeekPartial({ templateMessage: editTemplateMessageText });
                          setIsEditingTemplateMessage(false);
                        } else {
                          setIsEditingTemplateMessage(true);
                        }
                      }}
                      className="text-[10px] font-black uppercase text-primary hover:underline"
                    >
                      {isEditingTemplateMessage ? "Lưu tin" : "Chỉnh sửa"}
                    </button>
                    <span className="text-zinc-300">|</span>
                    <button
                      onClick={() => handleCopy(editTemplateMessageText || activeWeekInfo.templateMessage, "Tin nhắn gửi học viên")}
                      className="text-[10px] font-black uppercase text-primary hover:underline"
                    >
                      Copy tin nhắn
                    </button>
                  </div>
                </div>
                {isEditingTemplateMessage ? (
                  <textarea
                    rows={4}
                    value={editTemplateMessageText}
                    onChange={(e) => setEditTemplateMessageText(e.target.value)}
                    className="w-full rounded-xl border border-primary p-3 text-xs font-semibold outline-none focus:ring-2 focus:ring-primary/10"
                  />
                ) : (
                  <div className="text-xs font-semibold text-zinc-600 bg-zinc-50 p-3 rounded-xl leading-relaxed max-h-[120px] overflow-y-auto">
                    {editTemplateMessageText || activeWeekInfo.templateMessage}
                  </div>
                )}
              </div>

            </div>

            {/* Right main registrations panel */}
            <div className="md:col-span-2">

              {/* Student Registrations from practice class system */}
              <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
                <div className="px-5 py-3 border-b border-zinc-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-foreground">Đăng ký lớp luyện đề từ học viên</h3>
                    <p className="text-[10px] text-zinc-400 mt-0.5">Học viên tự đăng ký qua trang Hỗ Trợ Tự Học. Hiển thị tất cả đăng ký hiện tại trong hệ thống.</p>
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        const regs = await fetchPracticeRegistrationsForAca();
                        setRegistrationsList(regs);
                      } catch (err) {
                        console.warn("Refresh failed:", err);
                      }
                    }}
                    className="text-[10px] font-black text-primary hover:underline shrink-0"
                  >
                    ↻ Tải lại
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px] border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-zinc-200 bg-zinc-50 text-[10px] font-black uppercase tracking-widest text-muted whitespace-nowrap">
                        <th className="px-6 py-3 text-center min-w-[50px]">STT</th>
                        <th className="px-6 py-3 min-w-[200px]">Tên học viên</th>
                        <th className="px-6 py-3 min-w-[180px]">Ca đăng ký</th>
                        <th className="px-6 py-3 min-w-[200px]">Lịch học</th>
                        <th className="px-6 py-3 min-w-[180px]">Thời gian đăng ký</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 font-semibold text-zinc-700">
                      {filteredRegistrations.length > 0 ? (
                        filteredRegistrations.map((reg, idx) => (
                          <tr key={`${reg.studentId}-${reg.slotId}`} className="hover:bg-zinc-50/55 align-middle">
                            <td className="px-6 py-3.5 text-center tabular-nums text-zinc-400">{idx + 1}</td>
                            <td className="px-6 py-3.5 font-black text-foreground">{reg.studentName}</td>
                            <td className="px-6 py-3.5">
                              <span className="px-2 py-0.5 rounded-lg font-black text-[10px] bg-primary/10 text-primary">
                                {reg.slotTitle}
                              </span>
                            </td>
                            <td className="px-6 py-3.5 text-zinc-500">{reg.slotSchedule}</td>
                            <td className="px-6 py-3.5 tabular-nums text-zinc-400 text-[10px]">
                              {new Date(reg.registeredAt).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-zinc-400 font-medium">
                            Chưa có học viên nào đăng ký qua hệ thống.
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

    </AcaLayout>
  );
}



