"use client";

import { useState, useEffect, useMemo } from "react";
import { AcaLayout } from "@/components/aca/AcaLayout";
import { AcaTopbar } from "@/components/aca/AcaTopbar";
import {
  fetchAcaPracticeWeeks,
  updateAcaPracticeWeek,
  findCurrentOrLatestPracticeWeekRange,
  ensureCurrentRealtimeWeekExists,
  AcaPracticeWeek,
} from "@/lib/acaManagementApi";
import { savePracticeZoom, savePracticeScheduleFromAca } from "@/lib/practiceClass";
import {
  fetchPracticeRegistrationsForAca,
  updateRegistrationDetailsApi,
  type PracticeRegistrationAcaRow,
} from "@/lib/practiceClassApi";

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

  // General week link folder
  const [editLinkFolder, setEditLinkFolder] = useState("");
  const [savingWeekFolder, setSavingWeekFolder] = useState(false);

  // Registration edit modal state
  const [editingReg, setEditingReg] = useState<PracticeRegistrationAcaRow | null>(null);
  const [editRegFolder, setEditRegFolder] = useState("");
  const [editRegScoreR, setEditRegScoreR] = useState("");
  const [editRegScoreL, setEditRegScoreL] = useState("");
  const [editRegScoreW, setEditRegScoreW] = useState("");
  const [savingReg, setSavingReg] = useState(false);

  const openEditRegModal = (
    reg: PracticeRegistrationAcaRow,
    scores?: { linkFolder?: string; scoreR?: string; scoreL?: string; scoreW?: string },
  ) => {
    setEditingReg({
      ...reg,
      weekRange: reg.weekRange || selectedWeekRange,
      linkFolder: scores?.linkFolder ?? reg.linkFolder,
      scoreR: scores?.scoreR ?? reg.scoreR,
      scoreL: scores?.scoreL ?? reg.scoreL,
      scoreW: scores?.scoreW ?? reg.scoreW,
    });
    setEditRegFolder(scores?.linkFolder ?? reg.linkFolder ?? "");
    setEditRegScoreR(scores?.scoreR ?? reg.scoreR ?? "");
    setEditRegScoreL(scores?.scoreL ?? reg.scoreL ?? "");
    setEditRegScoreW(scores?.scoreW ?? reg.scoreW ?? "");
  };

  const handleSaveRegDetails = async () => {
    if (!editingReg) return;
    const weekRange = (editingReg.weekRange || selectedWeekRange || "").trim();
    if (!weekRange) {
      alert("Thiếu tuần đang chọn — không thể lưu điểm.");
      return;
    }
    setSavingReg(true);
    try {
      const updated = await updateRegistrationDetailsApi(editingReg.id, {
        linkFolder: editRegFolder,
        scoreR: editRegScoreR,
        scoreL: editRegScoreL,
        scoreW: editRegScoreW,
        weekRange,
      });
      // Đồng bộ điểm lên mọi slot cùng học viên trong tuần (khớp BE sibling update)
      setRegistrationsList((prev) =>
        prev.map((item) => {
          const sameStudentWeek =
            item.studentId === updated.studentId &&
            (item.weekRange || weekRange) === (updated.weekRange || weekRange);
          if (!sameStudentWeek && item.id !== editingReg.id) return item;
          if (item.id === editingReg.id) return { ...item, ...updated };
          return {
            ...item,
            linkFolder: updated.linkFolder,
            scoreR: updated.scoreR,
            scoreL: updated.scoreL,
            scoreW: updated.scoreW,
            weekRange: updated.weekRange || weekRange,
          };
        }),
      );
      setEditingReg(null);
    } catch (err) {
      console.error("Save registration details failed:", err);
      alert(err instanceof Error ? err.message : "Lỗi khi lưu thông tin.");
    } finally {
      setSavingReg(false);
    }
  };

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
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Sync danh sách đăng ký theo tuần đang chọn
  useEffect(() => {
    if (!selectedWeekRange) return;
    let cancelled = false;
    void (async () => {
      try {
        const regs = await fetchPracticeRegistrationsForAca(selectedWeekRange);
        if (!cancelled) setRegistrationsList(regs);
      } catch (regErr) {
        console.warn("Could not load student registrations:", regErr);
        if (!cancelled) setRegistrationsList([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedWeekRange]);

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
    }
  }, [activeWeekInfo]);

  const saveWeekPartial = async (partial: Partial<AcaPracticeWeek>) => {
    if (!activeWeekInfo) return;
    try {
      const updated = await updateAcaPracticeWeek(activeWeekInfo.id, partial);
      setWeeksList((prev) => prev.map((w) => (w.id === activeWeekInfo.id ? { ...w, ...updated } : w)));
      if (partial.zoomId || partial.zoomPassword) {
        await savePracticeZoom({
          zoomId: partial.zoomId || editZoomId,
          zoomPassword: partial.zoomPassword || editZoomPassword,
        });
      }
      alert("Đã cập nhật thông tin thành công!");
    } catch (err: unknown) {
      alert("Lưu thất bại: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleSaveWeekLinkFolder = async () => {
    if (!activeWeekInfo) return;
    setSavingWeekFolder(true);
    try {
      const updated = await updateAcaPracticeWeek(activeWeekInfo.id, {
        linkFolder: editLinkFolder.trim(),
      });
      setWeeksList((prev) =>
        prev.map((w) => (w.id === activeWeekInfo.id ? { ...w, ...updated } : w)),
      );
    } catch (err: unknown) {
      alert("Lưu link folder tuần thất bại: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSavingWeekFolder(false);
    }
  };

  const weekFolderUrl = (activeWeekInfo?.linkFolder || editLinkFolder || "").trim();

  // Filter registrations by search query
  const filteredRegistrations = useMemo(() => {
    return registrationsList.filter(
      (reg) =>
        reg.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reg.slotTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (reg.studentId && reg.studentId.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [registrationsList, searchQuery]);

  // Group registrations by student so each student appears on only 1 row with 3 check columns (T3, T5, T7)
  const groupedStudents = useMemo(() => {
    const map = new Map<
      string,
      {
        studentId: string;
        studentName: string;
        hasT3: boolean;
        hasT5: boolean;
        hasT7: boolean;
        linkFolder: string;
        scoreR: string;
        scoreL: string;
        scoreW: string;
        registeredAt: string;
        primaryReg: PracticeRegistrationAcaRow;
        allRegs: PracticeRegistrationAcaRow[];
      }
    >();

    filteredRegistrations.forEach((reg) => {
      const key = (reg.studentId || reg.studentName).trim().toLowerCase();
      const slotId = reg.slotId || "";
      const slotSchedule = (reg.slotSchedule || "").toLowerCase();
      const slotTitle = (reg.slotTitle || "").toLowerCase();

      const isT3 =
        slotId === "tue-lrw" ||
        slotSchedule.includes("thứ 3") ||
        slotSchedule.includes("t3") ||
        slotTitle.includes("thứ 3");

      const isT5 =
        slotId === "sun-lrw" ||
        slotSchedule.includes("thứ 4") ||
        slotSchedule.includes("thứ 5") ||
        slotSchedule.includes("t4") ||
        slotSchedule.includes("t5") ||
        slotTitle.includes("thứ 4") ||
        slotTitle.includes("thứ 5");

      const isT7 =
        slotId === "sat-speaking" ||
        slotSchedule.includes("thứ 6") ||
        slotSchedule.includes("thứ 7") ||
        slotSchedule.includes("t6") ||
        slotSchedule.includes("t7") ||
        slotTitle.includes("thứ 6") ||
        slotTitle.includes("thứ 7") ||
        slotTitle.includes("speaking");

      if (!map.has(key)) {
        map.set(key, {
          studentId: reg.studentId,
          studentName: reg.studentName,
          hasT3: isT3,
          hasT5: isT5,
          hasT7: isT7,
          linkFolder: reg.linkFolder || "",
          scoreR: reg.scoreR || "",
          scoreL: reg.scoreL || "",
          scoreW: reg.scoreW || "",
          registeredAt: reg.registeredAt,
          primaryReg: reg,
          allRegs: [reg],
        });
      } else {
        const item = map.get(key)!;
        if (isT3) item.hasT3 = true;
        if (isT5) item.hasT5 = true;
        if (isT7) item.hasT7 = true;
        if (!item.linkFolder && reg.linkFolder) item.linkFolder = reg.linkFolder;
        if (!item.scoreR && reg.scoreR) item.scoreR = reg.scoreR;
        if (!item.scoreL && reg.scoreL) item.scoreL = reg.scoreL;
        if (!item.scoreW && reg.scoreW) item.scoreW = reg.scoreW;
        if (new Date(reg.registeredAt) > new Date(item.registeredAt)) {
          item.registeredAt = reg.registeredAt;
        }
        item.allRegs.push(reg);
      }
    });

    return Array.from(map.values());
  }, [filteredRegistrations]);

  const sessionRosterCounts = useMemo(
    () => ({
      t3: groupedStudents.filter((s) => s.hasT3).length,
      t5: groupedStudents.filter((s) => s.hasT5).length,
      t7: groupedStudents.filter((s) => s.hasT7).length,
    }),
    [groupedStudents],
  );

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    alert(`Đã sao chép ${label} vào clipboard!`);
  };

  return (
    <AcaLayout>
      <AcaTopbar
        title="Quản lý lớp luyện đề (Theo tuần)"
        subtitle="Lịch học, link Meet/Tab và gắn link folder tuần ngay trên bảng đăng ký (thay Weekly Docs)."
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
              Đã đăng ký: {groupedStudents.length} học viên
            </div>
          </div>
        </div>

        {/* Dashboard grid for metadata & announcement templates */}
        {/* Dashboard grid for metadata & announcement templates (Horizontal 3-column row) */}
        {activeWeekInfo && (
          <div className="space-y-6">
            
            {/* Top 3 Info & Config Cards */}
            <div className="grid gap-5 grid-cols-1 lg:grid-cols-3 items-stretch">
              
              {/* Card 1: Quick links & Zoom credentials */}
              <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-xs flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100">
                    <h3 className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-primary" />
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
                          });
                          setIsEditingMeetingInfo(false);
                        } else {
                          setIsEditingMeetingInfo(true);
                        }
                      }}
                      className="text-[10px] font-black uppercase text-primary hover:underline cursor-pointer"
                    >
                      {isEditingMeetingInfo ? "✓ Lưu phòng" : "✎ Chỉnh sửa"}
                    </button>
                  </div>

                  <div className="space-y-3 pt-3">
                    {/* Zoom ID */}
                    <div>
                      <div className="text-[9px] font-black uppercase text-muted tracking-wider mb-1">ID PHÒNG ZOOM</div>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          disabled={!isEditingMeetingInfo}
                          value={editZoomId}
                          onChange={(e) => setEditZoomId(e.target.value)}
                          placeholder="842 1963 4521"
                          className={`flex-1 min-w-0 h-8 rounded-xl border px-3 text-xs font-black outline-none ${
                            isEditingMeetingInfo ? "border-primary bg-white text-zinc-900" : "border-zinc-200 bg-zinc-50 text-indigo-900"
                          }`}
                        />
                        <button
                          onClick={() => handleCopy(editZoomId, "ID phòng Zoom")}
                          className="px-3 h-8 rounded-xl border border-zinc-200 text-zinc-600 hover:bg-zinc-50 text-xs font-bold shrink-0 cursor-pointer"
                        >
                          Copy
                        </button>
                      </div>
                    </div>

                    {/* Zoom Password */}
                    <div>
                      <div className="text-[9px] font-black uppercase text-muted tracking-wider mb-1">MẬT KHẨU ZOOM</div>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          disabled={!isEditingMeetingInfo}
                          value={editZoomPassword}
                          onChange={(e) => setEditZoomPassword(e.target.value)}
                          placeholder="XaloLrw26"
                          className={`flex-1 min-w-0 h-8 rounded-xl border px-3 text-xs font-black outline-none ${
                            isEditingMeetingInfo ? "border-primary bg-white text-zinc-900" : "border-zinc-200 bg-zinc-50 text-indigo-900"
                          }`}
                        />
                        <button
                          onClick={() => handleCopy(editZoomPassword, "Mật khẩu Zoom")}
                          className="px-3 h-8 rounded-xl border border-zinc-200 text-zinc-600 hover:bg-zinc-50 text-xs font-bold shrink-0 cursor-pointer"
                        >
                          Copy
                        </button>
                      </div>
                    </div>

                    {/* Link Meet */}
                    <div>
                      <div className="text-[9px] font-black uppercase text-muted tracking-wider mb-1">LINK MEET / ZOOM (MAIL ACA)</div>
                      <div className="flex gap-1.5">
                        {isEditingMeetingInfo ? (
                          <input
                            type="text"
                            value={editLinkMeet}
                            onChange={(e) => setEditLinkMeet(e.target.value)}
                            placeholder="https://meet.google.com/..."
                            className="flex-1 h-8 rounded-xl border border-primary bg-white px-2.5 text-xs font-bold outline-none"
                          />
                        ) : (
                          <a
                            href={activeWeekInfo.linkMeet}
                            target="_blank"
                            rel="noreferrer"
                            className="flex-1 h-8 rounded-xl bg-primary text-white flex items-center justify-center text-xs font-black hover:opacity-90 truncate px-2"
                          >
                            Vào phòng học
                          </a>
                        )}
                        <button
                          onClick={() => handleCopy(editLinkMeet || activeWeekInfo.linkMeet, "Link Meet")}
                          className="px-2.5 h-8 rounded-xl border border-zinc-200 text-zinc-500 hover:bg-zinc-50 text-xs font-bold shrink-0 cursor-pointer"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                    
                    {/* Link Tab */}
                    <div>
                      <div className="text-[9px] font-black uppercase text-muted tracking-wider mb-1">LINK TAB THEO DÕI (GOOGLE SHEET)</div>
                      <div className="flex gap-1.5">
                        {isEditingMeetingInfo ? (
                          <input
                            type="text"
                            value={editLinkTab}
                            onChange={(e) => setEditLinkTab(e.target.value)}
                            placeholder="https://docs.google.com/spreadsheets/..."
                            className="flex-1 h-8 rounded-xl border border-primary bg-white px-2.5 text-xs font-bold outline-none"
                          />
                        ) : (
                          <a
                            href={activeWeekInfo.linkTab}
                            target="_blank"
                            rel="noreferrer"
                            className="flex-1 h-8 rounded-xl bg-secondary text-white flex items-center justify-center text-xs font-black hover:opacity-90 truncate px-2"
                          >
                            Mở link sheet
                          </a>
                        )}
                        <button
                          onClick={() => handleCopy(editLinkTab || activeWeekInfo.linkTab, "Link Tab")}
                          className="px-2.5 h-8 rounded-xl border border-zinc-200 text-zinc-500 hover:bg-zinc-50 text-xs font-bold shrink-0 cursor-pointer"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Link Folder tuần info */}
                <div className="pt-2 border-t border-zinc-100">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold text-zinc-500 uppercase">Folder tuần:</span>
                    {weekFolderUrl ? (
                      <a
                        href={weekFolderUrl.startsWith("http") ? weekFolderUrl : `https://${weekFolderUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-bold text-amber-600 hover:underline truncate max-w-[180px]"
                      >
                        📁 Mở folder tuần
                      </a>
                    ) : (
                      <span className="text-zinc-400 italic">Chưa gắn</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Card 2: Lịch Các Ca Trong Tuần */}
              <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-xs flex flex-col justify-between space-y-3">
                <div className="flex justify-between items-center pb-2.5 border-b border-zinc-100">
                  <h3 className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Lịch ca học tuần (T3 - T5 - T7)
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-zinc-500">
                      Roster: T3 {sessionRosterCounts.t3} · T5 {sessionRosterCounts.t5} · T7 {sessionRosterCounts.t7}
                    </span>
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
                    {isEditingScheduleDetails ? "✓ Lưu ca" : "✎ Chỉnh sửa"}
                  </button>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs overflow-y-auto max-h-[260px] pr-1">
                  {/* Slot 1: Thứ 3 */}
                  <div className="p-2.5 rounded-xl border border-zinc-100 bg-zinc-50/60 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-black text-primary block text-[10px] uppercase">[Thứ 3]</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                          {sessionRosterCounts.t3} HV
                        </span>
                        {!isEditingScheduleDetails && (
                          <span className="text-[10px] font-bold text-zinc-500 bg-white px-2 py-0.5 rounded-md border border-zinc-200/60">{editTueTime}</span>
                        )}
                      </div>
                    </div>
                    {isEditingScheduleDetails ? (
                      <div className="space-y-1.5">
                        <input
                          type="text"
                          value={editTueTitle}
                          onChange={(e) => setEditTueTitle(e.target.value)}
                          placeholder="Tên ca..."
                          className="w-full rounded-lg border border-primary px-2 py-1 text-xs font-bold outline-none bg-white"
                        />
                        <input
                          type="text"
                          value={editTueTime}
                          onChange={(e) => setEditTueTime(e.target.value)}
                          placeholder="19h45 – 21h45..."
                          className="w-full rounded-lg border border-primary px-2 py-1 text-xs font-semibold outline-none bg-white"
                        />
                        <textarea
                          rows={2}
                          value={editTueDetail}
                          onChange={(e) => setEditTueDetail(e.target.value)}
                          placeholder="Mô tả nội dung..."
                          className="w-full rounded-lg border border-primary p-1.5 text-xs font-medium outline-none bg-white"
                        />
                      </div>
                    ) : (
                      <div>
                        <div className="font-bold text-foreground text-xs">{editTueTitle}</div>
                        <div className="text-[11px] font-medium text-zinc-500 line-clamp-2 leading-relaxed">{editTueDetail}</div>
                      </div>
                    )}
                  </div>

                  {/* Slot 2: Thứ 5 */}
                  <div className="p-2.5 rounded-xl border border-zinc-100 bg-zinc-50/60 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-black text-primary block text-[10px] uppercase">[Thứ 5]</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                          {sessionRosterCounts.t5} HV
                        </span>
                        {!isEditingScheduleDetails && (
                          <span className="text-[10px] font-bold text-zinc-500 bg-white px-2 py-0.5 rounded-md border border-zinc-200/60">{editThuTime}</span>
                        )}
                      </div>
                    </div>
                    {isEditingScheduleDetails ? (
                      <div className="space-y-1.5">
                        <input
                          type="text"
                          value={editThuTitle}
                          onChange={(e) => setEditThuTitle(e.target.value)}
                          placeholder="Tên ca..."
                          className="w-full rounded-lg border border-primary px-2 py-1 text-xs font-bold outline-none bg-white"
                        />
                        <input
                          type="text"
                          value={editThuTime}
                          onChange={(e) => setEditThuTime(e.target.value)}
                          placeholder="19h45 – 21h45..."
                          className="w-full rounded-lg border border-primary px-2 py-1 text-xs font-semibold outline-none bg-white"
                        />
                        <textarea
                          rows={2}
                          value={editThuDetail}
                          onChange={(e) => setEditThuDetail(e.target.value)}
                          placeholder="Mô tả nội dung..."
                          className="w-full rounded-lg border border-primary p-1.5 text-xs font-medium outline-none bg-white"
                        />
                      </div>
                    ) : (
                      <div>
                        <div className="font-bold text-foreground text-xs">{editThuTitle}</div>
                        <div className="text-[11px] font-medium text-zinc-500 line-clamp-2 leading-relaxed">{editThuDetail}</div>
                      </div>
                    )}
                  </div>

                  {/* Slot 3: Thứ 7 */}
                  <div className="p-2.5 rounded-xl border border-zinc-100 bg-zinc-50/60 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-black text-primary block text-[10px] uppercase">[Thứ 7]</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                          {sessionRosterCounts.t7} HV
                        </span>
                        {!isEditingScheduleDetails && (
                          <span className="text-[10px] font-bold text-zinc-500 bg-white px-2 py-0.5 rounded-md border border-zinc-200/60">{editSatTime}</span>
                        )}
                      </div>
                    </div>
                    {isEditingScheduleDetails ? (
                      <div className="space-y-1.5">
                        <input
                          type="text"
                          value={editSatTitle}
                          onChange={(e) => setEditSatTitle(e.target.value)}
                          placeholder="Tên ca..."
                          className="w-full rounded-lg border border-primary px-2 py-1 text-xs font-bold outline-none bg-white"
                        />
                        <input
                          type="text"
                          value={editSatTime}
                          onChange={(e) => setEditSatTime(e.target.value)}
                          placeholder="19h – 21h30..."
                          className="w-full rounded-lg border border-primary px-2 py-1 text-xs font-semibold outline-none bg-white"
                        />
                        <textarea
                          rows={2}
                          value={editSatDetail}
                          onChange={(e) => setEditSatDetail(e.target.value)}
                          placeholder="Mô tả nội dung..."
                          className="w-full rounded-lg border border-primary p-1.5 text-xs font-medium outline-none bg-white"
                        />
                      </div>
                    ) : (
                      <div>
                        <div className="font-bold text-foreground text-xs">{editSatTitle}</div>
                        <div className="text-[11px] font-medium text-zinc-500 line-clamp-2 leading-relaxed">{editSatDetail}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Card 3: Announcement template */}
              <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-xs flex flex-col justify-between space-y-3">
                <div className="flex justify-between items-center pb-2.5 border-b border-zinc-100">
                  <h3 className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
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
                      className="text-[10px] font-black uppercase text-primary hover:underline cursor-pointer"
                    >
                      {isEditingAnnouncement ? "✓ Lưu tin" : "✎ Chỉnh sửa"}
                    </button>
                    <span className="text-zinc-300">|</span>
                    <button
                      onClick={() => handleCopy(editAnnouncementText || activeWeekInfo.announcement, "Thông báo chung")}
                      className="text-[10px] font-black uppercase text-primary hover:underline cursor-pointer"
                    >
                      Copy tin
                    </button>
                  </div>
                </div>
                {isEditingAnnouncement ? (
                  <textarea
                    rows={8}
                    value={editAnnouncementText}
                    onChange={(e) => setEditAnnouncementText(e.target.value)}
                    className="w-full rounded-xl border border-primary p-3 text-xs font-semibold outline-none focus:ring-2 focus:ring-primary/10 flex-1"
                  />
                ) : (
                  <pre className="text-xs font-semibold text-zinc-600 bg-zinc-50/80 p-3 rounded-xl overflow-x-auto whitespace-pre-wrap leading-relaxed font-sans max-h-[250px] overflow-y-auto flex-1 border border-zinc-100">
                    {editAnnouncementText || activeWeekInfo.announcement}
                  </pre>
                )}
              </div>

            </div>

            {/* Bottom Full-Width Student Registrations Panel */}
            <div className="w-full">
              <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
                <div className="px-5 py-3.5 border-b border-zinc-100 flex items-center justify-between gap-3 flex-wrap bg-zinc-50/40">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                      Danh sách đăng ký tuần {selectedWeekRange || "—"} ({groupedStudents.length} học viên)
                    </h3>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      Roster theo ca tuần đang chọn (ai đăng ký T3/T5/T7) — đồng bộ với học viên. Folder cá nhân theo từng tuần (reset mỗi tuần).
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        const regs = await fetchPracticeRegistrationsForAca(selectedWeekRange);
                        setRegistrationsList(regs);
                      } catch (err) {
                        console.warn("Refresh failed:", err);
                      }
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-black text-primary hover:underline shrink-0 bg-white border border-primary/20 px-3 py-1.5 rounded-xl shadow-2xs cursor-pointer"
                  >
                    ↻ Tải lại danh sách
                  </button>
                </div>

                {/* Link folder tuần — thay Weekly Docs */}
                <div className="px-5 py-3 border-b border-amber-100 bg-amber-50/40 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-amber-900">
                      Link folder tuần ({selectedWeekRange || "—"}):
                    </label>
                    {weekFolderUrl ? (
                      <a
                        href={weekFolderUrl.startsWith("http") ? weekFolderUrl : `https://${weekFolderUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-black text-amber-700 hover:underline inline-flex items-center gap-1"
                      >
                        📁 Mở folder
                      </a>
                    ) : null}
                  </div>
                  <div className="flex flex-1 max-w-xl gap-2">
                    <input
                      type="url"
                      value={editLinkFolder}
                      onChange={(e) => setEditLinkFolder(e.target.value)}
                      placeholder="https://drive.google.com/drive/folders/..."
                      className="h-9 flex-1 rounded-xl border border-amber-200 bg-white px-3 text-xs font-semibold outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200/50"
                    />
                    <button
                      type="button"
                      disabled={savingWeekFolder || !activeWeekInfo}
                      onClick={() => void handleSaveWeekLinkFolder()}
                      className="h-9 shrink-0 rounded-xl bg-amber-600 px-4 text-[10px] font-black uppercase tracking-wider text-white hover:bg-amber-700 disabled:opacity-50 cursor-pointer shadow-2xs"
                    >
                      {savingWeekFolder ? "Đang lưu…" : "Lưu link folder"}
                    </button>
                  </div>
                </div>

                {/* Full-Width Table */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-zinc-200 bg-zinc-50 text-[10px] font-black uppercase tracking-widest text-muted whitespace-nowrap">
                        <th className="px-4 py-3 text-center w-[50px]">STT</th>
                        <th className="px-4 py-3 min-w-[170px]">Tên học viên</th>
                        <th className="px-3 py-3 text-center w-[60px]">T3</th>
                        <th className="px-3 py-3 text-center w-[60px]">T5</th>
                        <th className="px-3 py-3 text-center w-[60px]">T7</th>
                        <th className="px-4 py-3 min-w-[170px]">Link folder cá nhân</th>
                        <th className="px-3 py-3 text-center w-[70px]">R</th>
                        <th className="px-3 py-3 text-center w-[70px]">L</th>
                        <th className="px-3 py-3 text-center w-[70px]">W</th>
                        <th className="px-4 py-3 min-w-[150px]">Thời gian đăng ký</th>
                        <th className="px-4 py-3 text-center w-[130px]">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 font-semibold text-zinc-700">
                      {groupedStudents.length > 0 ? (
                        groupedStudents.map((st, idx) => {
                          const rowFolder = (st.linkFolder || "").trim();
                          return (
                          <tr key={st.studentId || st.studentName} className="hover:bg-zinc-50/60 transition-colors align-middle">
                            <td className="px-4 py-3.5 text-center tabular-nums text-zinc-400 font-bold">{idx + 1}</td>
                            <td className="px-4 py-3.5 font-black text-foreground">{st.studentName}</td>
                            <td className="px-3 py-3.5 text-center">
                              <div className="flex items-center justify-center">
                                <span
                                  className={`inline-flex items-center justify-center h-5 w-5 rounded-md font-black text-xs transition-all ${
                                    st.hasT3
                                      ? "bg-primary text-white shadow-2xs"
                                      : "border border-zinc-200 bg-zinc-50 text-zinc-300"
                                  }`}
                                  title={st.hasT3 ? "Đã đăng ký T3" : "Chưa đăng ký T3"}
                                >
                                  {st.hasT3 ? "✓" : ""}
                                </span>
                              </div>
                            </td>
                            <td className="px-3 py-3.5 text-center">
                              <div className="flex items-center justify-center">
                                <span
                                  className={`inline-flex items-center justify-center h-5 w-5 rounded-md font-black text-xs transition-all ${
                                    st.hasT5
                                      ? "bg-primary text-white shadow-2xs"
                                      : "border border-zinc-200 bg-zinc-50 text-zinc-300"
                                  }`}
                                  title={st.hasT5 ? "Đã đăng ký T5" : "Chưa đăng ký T5"}
                                >
                                  {st.hasT5 ? "✓" : ""}
                                </span>
                              </div>
                            </td>
                            <td className="px-3 py-3.5 text-center">
                              <div className="flex items-center justify-center">
                                <span
                                  className={`inline-flex items-center justify-center h-5 w-5 rounded-md font-black text-xs transition-all ${
                                    st.hasT7
                                      ? "bg-primary text-white shadow-2xs"
                                      : "border border-zinc-200 bg-zinc-50 text-zinc-300"
                                  }`}
                                  title={st.hasT7 ? "Đã đăng ký T7" : "Chưa đăng ký T7"}
                                >
                                  {st.hasT7 ? "✓" : ""}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3.5">
                              {rowFolder ? (
                                <a
                                  href={rowFolder.startsWith("http") ? rowFolder : `https://${rowFolder}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 font-bold text-[10px] border border-amber-200 hover:bg-amber-100 transition-all truncate max-w-[180px]"
                                  title={rowFolder}
                                >
                                  📁 Mở folder
                                </a>
                              ) : (
                                <span className="text-zinc-400 text-[10px] italic">Chưa gắn</span>
                              )}
                            </td>
                            <td className="px-3 py-3.5 text-center">
                              {st.scoreR ? (
                                <span className="px-2.5 py-1 rounded-lg bg-primary/10 font-black text-primary text-xs">{st.scoreR}</span>
                              ) : (
                                <span className="text-zinc-300">—</span>
                              )}
                            </td>
                            <td className="px-3 py-3.5 text-center">
                              {st.scoreL ? (
                                <span className="px-2.5 py-1 rounded-lg bg-primary/10 font-black text-primary text-xs">{st.scoreL}</span>
                              ) : (
                                <span className="text-zinc-300">—</span>
                              )}
                            </td>
                            <td className="px-3 py-3.5 text-center">
                              {st.scoreW ? (
                                <span className="px-2.5 py-1 rounded-lg bg-secondary/10 font-black text-secondary text-xs">{st.scoreW}</span>
                              ) : (
                                <span className="text-zinc-300">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3.5 tabular-nums text-zinc-400 text-[11px]">
                              {new Date(st.registeredAt).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <button
                                type="button"
                                onClick={() =>
                                  openEditRegModal(st.primaryReg, {
                                    linkFolder: st.linkFolder,
                                    scoreR: st.scoreR,
                                    scoreL: st.scoreL,
                                    scoreW: st.scoreW,
                                  })
                                }
                                className="h-8 px-3 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary font-black text-[10px] uppercase tracking-wider transition-all cursor-pointer shadow-2xs"
                              >
                                Sửa / Nhập điểm
                              </button>
                            </td>
                          </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={11} className="px-6 py-10 text-center text-zinc-400 font-medium">
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

        {/* ── Edit Registration Details Modal ── */}
        {editingReg && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <div>
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest">Cập nhật thông tin học viên</span>
                  <h3 className="text-base font-black text-foreground">{editingReg.studentName}</h3>
                  <p className="text-xs font-semibold text-zinc-500">
                    {editingReg.slotTitle} ({editingReg.slotSchedule})
                  </p>
                  <p className="text-[10px] font-bold text-muted mt-0.5">
                    Điểm gắn tuần: {editingReg.weekRange || selectedWeekRange || "—"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingReg(null)}
                  className="h-8 w-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 font-bold flex items-center justify-center cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                {/* Link Folder */}
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                      📁 Link Folder cá nhân (tuần này)
                    </label>
                    <p className="text-[10px] text-zinc-400 font-medium">
                      Mỗi tuần một folder — không dùng lại link tuần trước.
                    </p>
                  <input
                    type="text"
                    value={editRegFolder}
                    onChange={(e) => setEditRegFolder(e.target.value)}
                    placeholder="https://drive.google.com/drive/folders/..."
                    className="w-full h-10 rounded-xl border border-zinc-200 px-3.5 text-xs font-medium focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>

                {/* 3 Skill Scores R - L - W */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-primary uppercase tracking-widest">
                      Reading (R)
                    </label>
                    <input
                      type="text"
                      value={editRegScoreR}
                      onChange={(e) => setEditRegScoreR(e.target.value)}
                      placeholder="e.g. 7.5"
                      className="w-full h-10 rounded-xl border border-zinc-200 px-3 text-center text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-primary uppercase tracking-widest">
                      Listening (L)
                    </label>
                    <input
                      type="text"
                      value={editRegScoreL}
                      onChange={(e) => setEditRegScoreL(e.target.value)}
                      placeholder="e.g. 8.0"
                      className="w-full h-10 rounded-xl border border-zinc-200 px-3 text-center text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-secondary uppercase tracking-widest">
                      Writing (W)
                    </label>
                    <input
                      type="text"
                      value={editRegScoreW}
                      onChange={(e) => setEditRegScoreW(e.target.value)}
                      placeholder="e.g. 6.5"
                      className="w-full h-10 rounded-xl border border-zinc-200 px-3 text-center text-xs font-bold focus:ring-2 focus:ring-secondary/20 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setEditingReg(null)}
                  className="h-10 rounded-xl bg-zinc-100 px-4 text-xs font-bold text-zinc-600 hover:bg-zinc-200 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleSaveRegDetails}
                  disabled={savingReg}
                  className="h-10 rounded-xl bg-primary px-6 text-xs font-black uppercase text-white hover:bg-primary/90 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {savingReg ? "Đang lưu..." : "Lưu cập nhật"}
                </button>
              </div>
            </div>
          </div>
        )}

      </main>

    </AcaLayout>
  );
}



