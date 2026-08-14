"use client";

import { useState, useEffect, useMemo } from "react";
import { fetchAcaFreeSlots, createAcaFreeSlot, deleteAcaFreeSlot, type AcaFreeSlot } from "@/lib/acaManagementApi";
import { getCachedAuthUser } from "@/lib/auth";
import { loadMockTestRequests, type MockTestRequest } from "@/lib/mockTestRequests";
import { getGraderMeetLink, saveGraderMeetLink } from "@/lib/graderMeetLinks";

// Time slots from 8:00 AM to 11:30 PM (every 30 mins)
const TIME_SLOTS = [
  "8:00 AM", "8:30 AM", "9:00 AM", "9:30 AM",
  "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM",
  "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM",
  "4:00 PM", "4:30 PM", "5:00 PM", "5:30 PM",
  "6:00 PM", "6:30 PM", "7:00 PM", "7:30 PM",
  "8:00 PM", "8:30 PM", "9:00 PM", "9:30 PM",
  "10:00 PM", "10:30 PM", "11:00 PM", "11:30 PM"
];

const WEEKDAYS = [
  { key: "mon", label: "MONDAY", code: "08/06/26" },
  { key: "tue", label: "TUESDAY", code: "09/06/26" },
  { key: "wed", label: "WEDNESDAY", code: "10/06/26" },
  { key: "thu", label: "THURSDAY", code: "11/06/26" },
  { key: "fri", label: "FRIDAY", code: "12/06/26" },
  { key: "sat", label: "SATURDAY", code: "13/06/26" },
  { key: "sun", label: "SUNDAY", code: "14/06/26" },
];

const ACA_GRADERS = [
  "Lê Thị Diệu Linh",
  "Trần Thị Thu Hà",
  "Nguyễn Văn An",
  "Đỗ Hoài Phương",
  "Phạm Đức Anh",
];

const WEEKS_OPTIONS = [
  { value: "week-1", label: "JUNE / Week 1 (01/06 - 07/06/2026)" },
  { value: "week-2", label: "JUNE / Week 2 (08/06 - 14/06/2026)" },
  { value: "week-3", label: "JUNE / Week 3 (15/06 - 21/06/2026)" },
  { value: "week-4", label: "JUNE / Week 4 (22/06 - 28/06/2026)" },
];

export interface SpeakingTestRow {
  id: string;
  type: "ONL" | "OFF";
  date: string;
  time: string;
  name: string;
  bcb: string;
  category: string; // e.g. Support
  testLink: string;
  score: string;
  status: "Tested" | "Canceled" | "Pending";
  note: string;
}

export function AcaDailyScheduleSection() {
  const [selectedGrader, setSelectedGrader] = useState("Lê Thị Diệu Linh");
  const [selectedWeek, setSelectedWeek] = useState("week-2");
  const [activeSlotType, setActiveSlotType] = useState<"online" | "offline" | "task">("online");

  // Default preset checks matching the spreadsheet screenshot:
  // Checked slots state: key = `${dayIdx}_${timeIdx}` -> { checked: boolean, type: "online" | "offline" | "task" }
  const [gridState, setGridState] = useState<Record<string, { checked: boolean; type: "online" | "offline" | "task" }>>(() => {
    const initial: Record<string, { checked: boolean; type: "online" | "offline" | "task" }> = {};
    
    // Preset mock data from spreadsheet image for Demo:
    // Mon: 9:00 - 12:30 (online), 2:00 - 5:00 (task)
    for (let d = 0; d < 7; d++) {
      for (let t = 0; t < TIME_SLOTS.length; t++) {
        const slotName = TIME_SLOTS[t];
        const key = `${d}_${t}`;
        
        // Populate standard schedule pattern:
        // Morning (9:00 AM - 12:30 PM): Mon-Fri checked
        if (t >= 2 && t <= 9 && d < 6) {
          const type = (t >= 2 && t <= 3) ? "online" : (t >= 4 && t <= 7) ? "task" : "offline";
          initial[key] = { checked: true, type };
        }
        // Afternoon (2:00 PM - 5:00 PM): Mon-Fri checked
        else if (t >= 12 && t <= 18 && d < 5) {
          const type = (t === 17) ? "offline" : "task";
          initial[key] = { checked: true, type };
        }
        // Evening weekend
        else if (d === 5 && t >= 22 && t <= 30) {
          initial[key] = { checked: true, type: t % 2 === 0 ? "online" : "task" };
        }
      }
    }
    return initial;
  });

  // Speaking test schedule table rows state with localStorage persistence
  const [speakingRows, setSpeakingRows] = useState<SpeakingTestRow[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem("xalo.aca.speakingSchedule.v2");
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      { id: "st-1", type: "ONL", date: "4/6", time: "9h", name: "Lâm Huỳnh Bảo Ngọc", bcb: "zArloAHHk6WURantA_c", category: "Support", testLink: "Link bài", score: "5", status: "Tested", note: "" },
      { id: "st-2", type: "ONL", date: "11/6", time: "15h30", name: "Đoàn Quỳnh Hương", bcb: "Z8sNnOmEJli4sEOT1rGv6", category: "Support", testLink: "Link bài", score: "6", status: "Tested", note: "" },
      { id: "st-3", type: "ONL", date: "10/6", time: "8h30", name: "Thái Thùy Trang", bcb: "wFGZPntvtBXLOuA11N2y", category: "Support", testLink: "", score: "", status: "Canceled", note: "" },
      { id: "st-4", type: "ONL", date: "12/6", time: "9h30", name: "Thái Thùy Trang", bcb: "wFGZPntvtBXLOuA11N2y", category: "Support", testLink: "", score: "", status: "Canceled", note: "" },
    ];
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("xalo.aca.speakingSchedule.v2", JSON.stringify(speakingRows));
    }
  }, [speakingRows]);

  const [newRowName, setNewRowName] = useState("");
  const [newRowDate, setNewRowDate] = useState("12/6");
  const [newRowTime, setNewRowTime] = useState("10h00");
  const [newRowType, setNewRowType] = useState<"ONL" | "OFF">("ONL");

  // Compute daily hours breakdown
  const dailyHours = useMemo(() => {
    const hours = [0, 0, 0, 0, 0, 0, 0];
    Object.entries(gridState).forEach(([key, val]) => {
      if (val.checked) {
        const d = parseInt(key.split("_")[0], 10);
        if (d >= 0 && d < 7) {
          hours[d] += 0.5; // Each 30-min slot is 0.5h
        }
      }
    });
    return hours;
  }, [gridState]);

  const totalHours = useMemo(() => {
    return dailyHours.reduce((acc, h) => acc + h, 0);
  }, [dailyHours]);

  const toggleSlot = (d: number, t: number) => {
    const key = `${d}_${t}`;
    setGridState((prev) => {
      const existing = prev[key];
      if (existing?.checked && existing.type === activeSlotType) {
        // Uncheck
        const next = { ...prev };
        delete next[key];
        return next;
      } else {
        // Check with active type
        return {
          ...prev,
          [key]: { checked: true, type: activeSlotType },
        };
      }
    });
  };

  const handleAddSpeakingRow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRowName.trim()) return;
    const newRow: SpeakingTestRow = {
      id: `st-${Date.now()}`,
      type: newRowType,
      date: newRowDate,
      time: newRowTime,
      name: newRowName,
      bcb: `z${Math.random().toString(36).substring(2, 10)}`,
      category: "Support",
      testLink: "Link bài",
      score: "-",
      status: "Pending",
      note: "",
    };
    setSpeakingRows((prev) => [...prev, newRow]);
    setNewRowName("");
  };

  // Editable Grader Meet Link
  const [graderMeetLink, setGraderMeetLink] = useState(() => getGraderMeetLink(selectedGrader));

  useEffect(() => {
    setGraderMeetLink(getGraderMeetLink(selectedGrader));
  }, [selectedGrader]);

  const handleSaveMeetLink = (url: string) => {
    setGraderMeetLink(url);
    saveGraderMeetLink(selectedGrader, url);
  };

  const updateRowField = (id: string, field: keyof SpeakingTestRow, value: string) => {
    setSpeakingRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const deleteRow = (id: string) => {
    setSpeakingRows((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Filter Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-xs font-black uppercase text-zinc-500 tracking-wider">Tên Grader:</label>
            <select
              value={selectedGrader}
              onChange={(e) => setSelectedGrader(e.target.value)}
              className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-xs font-black text-emerald-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
            >
              {ACA_GRADERS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-black uppercase text-zinc-500 tracking-wider">Chọn Tuần:</label>
            <select
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
              className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-xs font-bold text-foreground outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
            >
              {WEEKS_OPTIONS.map((w) => (
                <option key={w.value} value={w.value}>
                  {w.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Legend Slot Type Selector */}
        <div className="flex items-center gap-2 bg-zinc-50 p-1.5 rounded-xl border border-zinc-200">
          <span className="text-[10px] font-black uppercase text-zinc-400 px-2">Chế độ tích ca:</span>
          <button
            type="button"
            onClick={() => setActiveSlotType("offline")}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all flex items-center gap-1.5 ${
              activeSlotType === "offline" ? "bg-blue-200 text-blue-900 shadow-2xs ring-2 ring-blue-400" : "bg-blue-100/70 text-blue-800 hover:bg-blue-100"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            Ca Offline
          </button>
          <button
            type="button"
            onClick={() => setActiveSlotType("online")}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all flex items-center gap-1.5 ${
              activeSlotType === "online" ? "bg-pink-200 text-pink-900 shadow-2xs ring-2 ring-pink-400" : "bg-pink-100/70 text-pink-800 hover:bg-pink-100"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-pink-500" />
            Ca Online
          </button>
          <button
            type="button"
            onClick={() => setActiveSlotType("task")}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all flex items-center gap-1.5 ${
              activeSlotType === "task" ? "bg-yellow-200 text-yellow-900 shadow-2xs ring-2 ring-yellow-400" : "bg-yellow-100/70 text-yellow-800 hover:bg-yellow-100"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-yellow-500" />
            Task ACA
          </button>
        </div>
      </div>

      {/* Main Split Grid (Spreadsheet Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left 7 Columns: DAILY SCHEDULE - Grader Dept. */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-zinc-200/90 shadow-sm overflow-hidden flex flex-col">
          {/* Header Bar */}
          <div className="bg-emerald-700 text-white px-5 py-3 flex items-center justify-between">
            <div>
              <h2 className="text-xs font-black uppercase tracking-wider">DAILY SCHEDULE - Grader Dept.</h2>
              <p className="text-[10px] font-medium text-emerald-100">Week of: 08/Jun/2026</p>
            </div>
            <div className="text-base font-black tracking-tight">{selectedGrader}</div>
          </div>

          {/* Schedule Grid Table */}
          <div className="overflow-x-auto max-h-[680px] overflow-y-auto">
            <table className="w-full border-collapse text-left text-[11px]">
              <thead className="sticky top-0 bg-zinc-100 border-b border-zinc-200 z-10">
                <tr className="text-[9px] font-black text-zinc-600 uppercase tracking-wider text-center divide-x divide-zinc-200">
                  <th className="py-2.5 px-2 min-w-[70px] bg-zinc-100">Giờ</th>
                  {WEEKDAYS.map((day) => (
                    <th key={day.key} className="py-2.5 px-1 min-w-[90px] bg-zinc-100">
                      <div>{day.code}</div>
                      <div className="text-zinc-800 font-extrabold">{day.label}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-150">
                {TIME_SLOTS.map((time, tIdx) => (
                  <tr key={time} className="hover:bg-zinc-50/80 divide-x divide-zinc-150">
                    {/* Time Column */}
                    <td className="py-1 px-2 text-[10px] font-bold text-zinc-500 whitespace-nowrap bg-zinc-50 text-center select-none">
                      {time}
                    </td>

                    {/* Day Cells */}
                    {WEEKDAYS.map((day, dIdx) => {
                      const key = `${dIdx}_${tIdx}`;
                      const slot = gridState[key];
                      const isChecked = !!slot?.checked;
                      const slotType = slot?.type || "online";

                      let bgClass = "bg-white";
                      if (isChecked) {
                        if (slotType === "offline") bgClass = "bg-blue-100/90 text-blue-900 border-blue-200";
                        else if (slotType === "online") bgClass = "bg-pink-100/90 text-pink-900 border-pink-200";
                        else bgClass = "bg-yellow-100/90 text-yellow-900 border-yellow-200";
                      }

                      return (
                        <td
                          key={key}
                          onClick={() => toggleSlot(dIdx, tIdx)}
                          className={`py-1 px-1 text-center cursor-pointer transition-colors ${bgClass}`}
                          title={`Bấm để chọn/bỏ ca: ${day.label} (${time})`}
                        >
                          <div className="flex items-center justify-center h-5 w-full">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}} // Handled by cell onClick
                              className="w-3.5 h-3.5 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer pointer-events-none"
                            />
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
              <tfoot className="sticky bottom-0 bg-zinc-50 border-t border-zinc-300 font-bold text-[10px] z-10">
                <tr className="divide-x divide-zinc-200 text-center">
                  <td className="py-2.5 px-2 text-zinc-600 uppercase font-black">Hours/Day</td>
                  {dailyHours.map((h, i) => (
                    <td key={i} className="py-2.5 px-1 font-black text-foreground tabular-nums">
                      {h > 0 ? h : "-"}
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Color Code Legend & Total Hours Footer */}
          <div className="p-4 bg-zinc-50 border-t border-zinc-200 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1 text-[10px] font-bold text-zinc-600">
              <div className="text-[9px] uppercase tracking-wider font-black text-zinc-400">COLOR CODE:</div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-6 rounded bg-blue-100 border border-blue-300 inline-block" />
                <span>Nhận ca Test speaking/ chấm writing offline</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-6 rounded bg-pink-100 border border-pink-300 inline-block" />
                <span>Nhận ca Test speaking/ chấm writing online</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-6 rounded bg-yellow-100 border border-yellow-300 inline-block" />
                <span>Task ACA</span>
              </div>
            </div>

            <div className="text-right bg-white p-3 rounded-xl border border-zinc-200 shadow-2xs">
              <div className="text-[9px] font-black uppercase text-emerald-700 tracking-wider">TOTAL HOURS</div>
              <div className="text-2xl font-black text-emerald-800 tabular-nums">{totalHours}h</div>
            </div>
          </div>
        </div>

        {/* Right 5 Columns: Speaking Test Schedule */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-zinc-200/90 shadow-sm overflow-hidden flex flex-col">
          {/* Header Bar */}
          <div className="bg-emerald-700 text-white px-5 py-3 flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-wider">Speaking Test Schedule</h2>
            <span className="text-[10px] font-semibold text-emerald-100 bg-emerald-800/80 px-2 py-0.5 rounded">Live Schedule</span>
          </div>

          {/* Editable Grader Google Meet Link Banner */}
          <div className="p-3 bg-emerald-50 border-b border-emerald-200/80 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 min-w-0 flex-1">
              <span className="shrink-0 font-black text-[10px] uppercase tracking-wider text-emerald-800">
                Link Meet ({selectedGrader}):
              </span>
              <input
                type="url"
                value={graderMeetLink}
                onChange={(e) => handleSaveMeetLink(e.target.value)}
                placeholder="https://meet.google.com/..."
                className="h-8 flex-1 min-w-[180px] rounded-lg border border-emerald-300 bg-white px-2.5 text-xs font-semibold text-emerald-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200"
              />
            </div>
            <a
              href={graderMeetLink}
              target="_blank"
              rel="noreferrer"
              className="h-8 inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-3 text-xs font-black text-white hover:bg-emerald-800 shadow-2xs shrink-0"
            >
              Link test spk ↗
            </a>
          </div>

          {/* Quick Add Student Form */}
          <form onSubmit={handleAddSpeakingRow} className="p-3 bg-zinc-50 border-b border-zinc-200 flex flex-wrap items-center gap-2">
            <input
              type="text"
              placeholder="Tên học viên..."
              value={newRowName}
              onChange={(e) => setNewRowName(e.target.value)}
              className="h-8 flex-1 min-w-[120px] rounded-lg border border-zinc-300 bg-white px-2.5 text-xs font-semibold outline-none focus:border-emerald-500"
            />
            <input
              type="text"
              placeholder="Ngày (vd: 12/6)"
              value={newRowDate}
              onChange={(e) => setNewRowDate(e.target.value)}
              className="h-8 w-16 rounded-lg border border-zinc-300 bg-white px-2 text-xs font-semibold text-center outline-none focus:border-emerald-500"
            />
            <input
              type="text"
              placeholder="Giờ (vd: 9h30)"
              value={newRowTime}
              onChange={(e) => setNewRowTime(e.target.value)}
              className="h-8 w-16 rounded-lg border border-zinc-300 bg-white px-2 text-xs font-semibold text-center outline-none focus:border-emerald-500"
            />
            <select
              value={newRowType}
              onChange={(e) => setNewRowType(e.target.value as "ONL" | "OFF")}
              className="h-8 rounded-lg border border-zinc-300 bg-white px-2 text-xs font-bold text-foreground outline-none"
            >
              <option value="ONL">ONL</option>
              <option value="OFF">OFF</option>
            </select>
            <button
              type="submit"
              className="h-8 rounded-lg bg-emerald-700 px-3 text-xs font-black uppercase text-white hover:bg-emerald-800 shadow-2xs"
            >
              + Thêm
            </button>
          </form>

          {/* Speaking Schedule Table */}
          <div className="overflow-x-auto max-h-[640px] overflow-y-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="sticky top-0 bg-zinc-100 border-b border-zinc-200 z-10 text-[9px] font-black uppercase tracking-wider text-zinc-600">
                <tr>
                  <th className="py-2.5 px-2 text-center w-8">#</th>
                  <th className="py-2.5 px-2 text-center w-12">HÌNH THỨC</th>
                  <th className="py-2.5 px-2 text-center w-12">NGÀY</th>
                  <th className="py-2.5 px-2 text-center w-12">GIỜ</th>
                  <th className="py-2.5 px-3 min-w-[120px]">TÊN</th>
                  <th className="py-2.5 px-2 text-center min-w-[80px]">BCB</th>
                  <th className="py-2.5 px-2 text-center w-14">DẠNG</th>
                  <th className="py-2.5 px-2 text-center min-w-[70px]">LINK MEET</th>
                  <th className="py-2.5 px-2 text-center w-12">ĐIỂM S</th>
                  <th className="py-2.5 px-2 text-center min-w-[85px]">TÌNH TRẠNG</th>
                  <th className="py-2.5 px-2 text-center w-8">XÓA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-150 font-semibold text-zinc-800">
                {speakingRows.map((r, idx) => (
                  <tr key={r.id} className="hover:bg-zinc-50/90 align-middle">
                    <td className="py-2.5 px-2 text-center text-zinc-400 font-medium tabular-nums">{idx + 1}</td>
                    <td className="py-2.5 px-2 text-center">
                      <select
                        value={r.type}
                        onChange={(e) => updateRowField(r.id, "type", e.target.value)}
                        className="rounded bg-zinc-100 px-1 py-0.5 text-[9.5px] font-black uppercase text-zinc-700 border border-zinc-200 cursor-pointer outline-none"
                      >
                        <option value="ONL">ONL</option>
                        <option value="OFF">OFF</option>
                      </select>
                    </td>
                    <td className="py-2.5 px-1 text-center">
                      <input
                        type="text"
                        value={r.date}
                        onChange={(e) => updateRowField(r.id, "date", e.target.value)}
                        className="w-12 h-7 text-center rounded border border-zinc-200 font-bold text-zinc-700 focus:border-emerald-500 outline-none text-xs"
                      />
                    </td>
                    <td className="py-2.5 px-1 text-center">
                      <input
                        type="text"
                        value={r.time}
                        onChange={(e) => updateRowField(r.id, "time", e.target.value)}
                        className="w-14 h-7 text-center rounded border border-zinc-200 font-bold text-emerald-800 focus:border-emerald-500 outline-none text-xs"
                      />
                    </td>
                    <td className="py-2.5 px-2">
                      <input
                        type="text"
                        value={r.name}
                        onChange={(e) => updateRowField(r.id, "name", e.target.value)}
                        className="w-full h-7 rounded border border-zinc-200 px-2 font-black text-foreground focus:border-emerald-500 outline-none text-xs"
                      />
                    </td>
                    <td className="py-2.5 px-1 text-center">
                      <input
                        type="text"
                        value={r.bcb}
                        onChange={(e) => updateRowField(r.id, "bcb", e.target.value)}
                        className="w-24 h-7 text-center rounded border border-purple-200 bg-purple-50 text-purple-700 font-mono text-[9.5px] focus:border-purple-500 outline-none"
                      />
                    </td>
                    <td className="py-2.5 px-1 text-center">
                      <input
                        type="text"
                        value={r.category}
                        onChange={(e) => updateRowField(r.id, "category", e.target.value)}
                        className="w-16 h-7 text-center rounded border border-purple-200 bg-purple-100 text-purple-800 text-[9.5px] font-black focus:border-purple-500 outline-none"
                      />
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <a
                        href={graderMeetLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-1 text-[9.5px] font-black hover:bg-emerald-100"
                        title={`Link Google Meet cố định của ${selectedGrader}`}
                      >
                        Meet ↗
                      </a>
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <input
                        type="text"
                        value={r.score}
                        onChange={(e) => updateRowField(r.id, "score", e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            (e.target as HTMLInputElement).blur();
                          }
                        }}
                        className="w-10 h-7 text-center rounded border border-zinc-200 font-black text-foreground focus:border-emerald-500 outline-none"
                      />
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <select
                        value={r.status}
                        onChange={(e) => updateRowField(r.id, "status", e.target.value)}
                        className={`h-7 rounded px-1.5 text-[9px] font-black uppercase outline-none cursor-pointer border ${
                          r.status === "Tested"
                            ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                            : r.status === "Canceled"
                            ? "bg-red-100 text-red-800 border-red-300"
                            : "bg-amber-100 text-amber-800 border-amber-300"
                        }`}
                      >
                        <option value="Tested">Tested</option>
                        <option value="Canceled">Canceled</option>
                        <option value="Pending">Pending</option>
                      </select>
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => deleteRow(r.id)}
                        className="text-zinc-400 hover:text-red-600 transition-colors p-1"
                        title="Xóa ca này"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
