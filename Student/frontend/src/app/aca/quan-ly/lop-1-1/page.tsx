"use client";

import { useState, useEffect, useMemo, useCallback, Fragment } from "react";
import { AcaLayout } from "@/components/aca/AcaLayout";
import { AcaTopbar } from "@/components/aca/AcaTopbar";
import {
  fetchAca11Classes,
  createAca11Class,
  updateAca11Class,
  deleteAca11Class,
  Aca11Class,
} from "@/lib/acaManagementApi";

// ─── Utility: parse "dd/mm/yyyy" → Date ──────────────────────────────────────
const parseDDMMYYYY = (s: string): Date | null => {
  if (!s) return null;
  const parts = s.split("/");
  if (parts.length !== 3) return null;
  const d = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const y = parseInt(parts[2], 10);
  if (isNaN(d) || isNaN(m) || isNaN(y)) return null;
  return new Date(y, m, d);
};

const formatDDMMYYYY = (date: Date): string => {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${date.getFullYear()}`;
};

const parseScheduleLines = (scheduleText: string): string[] => {
  if (!scheduleText) return [];
  const rawLines = scheduleText.split(/\r?\n/).map(l => l.trim()).filter(l => l !== "");
  const runSchedules: string[] = [];
  for (const line of rawLines) {
    const match = line.match(/^K\d+:/i);
    if (match) {
      runSchedules.push(line);
    } else {
      if (runSchedules.length > 0) {
        runSchedules[runSchedules.length - 1] += "\n" + line;
      } else {
        runSchedules.push(line);
      }
    }
  }
  return runSchedules;
};

const getRunLabel = (line: string): string => {
  const match = line.match(/^(K\d+):/i);
  if (match) return match[1].toUpperCase();
  return "Khóa";
};

const getCleanSchedule = (line: string): string => {
  return line.replace(/^K\d+:\s*/i, "");
};

const parseStartDates = (startDateStr: string): string[] => {
  if (!startDateStr) return [];
  return startDateStr.split(/\s*•\s*/).map(s => s.trim());
};

const toYYYYMMDD = (ddMMyyyy: string): string => {
  if (!ddMMyyyy) return "";
  const parts = ddMMyyyy.split("/");
  if (parts.length !== 3) return "";
  const d = parts[0].padStart(2, "0");
  const m = parts[1].padStart(2, "0");
  const y = parts[2];
  return `${y}-${m}-${d}`;
};

const toDDMMYYYY = (yyyyMMdd: string): string => {
  if (!yyyyMMdd) return "";
  const parts = yyyyMMdd.split("-");
  if (parts.length !== 3) return yyyyMMdd;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

// ─── Utilities: Unified Standard End Date Calculations ───────────────────────
const countSessionsPerWeek = (scheduleText: string): number => {
  if (!scheduleText) return 2;
  // New structured format: [Xh|Ybuổi|Zb/w]
  const structMatch = scheduleText.match(/\|(\d+)b\/w\]/i);
  if (structMatch) return parseInt(structMatch[1], 10);
  const explicitMatch = scheduleText.match(/(\d+)\s*buổi\s*\/\s*tuần/i);
  if (explicitMatch) return parseInt(explicitMatch[1], 10);
  const lower = scheduleText.toLowerCase();

  // Parse patterns like "T3,5" or "T2,4,6" or "thứ 2,4,6"
  const prefixMatch = lower.match(/(?:t|thứ)\s*([2-7](?:[,/+\s]*[2-7])*)/i);
  if (prefixMatch) {
    const digits = prefixMatch[1].match(/[2-7]/g);
    if (digits && digits.length > 0) {
      const hasSunday = lower.includes("cn") || lower.includes("chủ nhật");
      return digits.length + (hasSunday ? 1 : 0);
    }
  }

  let daysCount = 0;
  const dayPatterns = [
    /thứ\s*2|t2/gi,
    /thứ\s*3|t3/gi,
    /thứ\s*4|t4/gi,
    /thứ\s*5|t5/gi,
    /thứ\s*6|t6/gi,
    /thứ\s*7|t7/gi,
    /chủ\s*nhật|cn/gi
  ];
  dayPatterns.forEach(pattern => {
    if (pattern.test(lower)) daysCount++;
  });
  if (daysCount > 0) return daysCount;
  if (lower.includes("t246") || lower.includes("t2,4,6") || lower.includes("3 buổi")) return 3;
  if (lower.includes("t35") || lower.includes("t3,5") || lower.includes("2 buổi")) return 2;
  return 2;
};

const parseHoursPerSession = (scheduleText: string): number => {
  if (!scheduleText) return 2.0;
  const explicitMatch = scheduleText.match(/(\d+(?:\.\d+)?)\s*(?:h|giờ|tiếng)\s*\/\s*buổi/i);
  if (explicitMatch) return parseFloat(explicitMatch[1]);

  const rangeMatch = scheduleText.match(/(\d{1,2})(?:h|:)(\d{2})?\s*-\s*(\d{1,2})(?:h|:)(\d{2})?/i);
  if (rangeMatch) {
    const sh = parseInt(rangeMatch[1], 10);
    const sm = rangeMatch[2] ? parseInt(rangeMatch[2], 10) : 0;
    const eh = parseInt(rangeMatch[3], 10);
    const em = rangeMatch[4] ? parseInt(rangeMatch[4], 10) : 0;
    const startMinutes = sh * 60 + sm;
    const endMinutes = eh * 60 + em;
    if (endMinutes > startMinutes) {
      return (endMinutes - startMinutes) / 60;
    }
  }
  return 2.0;
};

const getRunTotalSessions = (progressText: string, scheduleLine: string): number => {
  if (progressText) {
    const progressTotalMatch = progressText.match(/\/(\d+)\s*buổi/i);
    const progressOnlyMatch = !progressTotalMatch && progressText.match(/(\d+)\s*buổi/i);
    if (progressTotalMatch) return parseInt(progressTotalMatch[1], 10);
    if (progressOnlyMatch) return parseInt(progressOnlyMatch[1], 10);
  }
  // New structured format: [Xh|Ybuổi|Zb/w] → use Ybuổi directly
  const structMatch = scheduleLine.match(/\[(\d+)h\|(\d+)buổi\|(\d+)b\/w\]/i);
  if (structMatch) return parseInt(structMatch[2], 10);
  // Old format: [36h] → compute from hours / session duration
  const hoursMatch = scheduleLine.match(/\[(\d+)h\]/i);
  if (hoursMatch) {
    const hours = parseInt(hoursMatch[1], 10);
    const hoursPerSession = parseHoursPerSession(scheduleLine);
    return Math.ceil(hours / hoursPerSession);
  }
  return 24; // Default fallback sessions
};

const calcEndDate = (c: Aca11Class): string => {
  if (c.endDate && c.endDate.trim() !== "") return c.endDate;
  const start = parseDDMMYYYY(c.startDate);
  if (!start) return "";
  const totalSessions = getRunTotalSessions(c.progress, c.schedule);
  const sessionsPerWeek = countSessionsPerWeek(c.schedule);
  const weeksNeeded = Math.ceil(totalSessions / sessionsPerWeek);
  const endDate = new Date(start);
  endDate.setDate(endDate.getDate() + weeksNeeded * 7);
  return formatDDMMYYYY(endDate);
};

const calcRunEndDate = (runStartStr: string, runSchedLine: string, progressText: string = ""): string => {
  const start = parseDDMMYYYY(runStartStr);
  if (!start) return "";
  const totalSessions = getRunTotalSessions(progressText, runSchedLine);
  const sessionsPerWeek = countSessionsPerWeek(runSchedLine);
  const weeksNeeded = Math.ceil(totalSessions / sessionsPerWeek);
  const endDate = new Date(start);
  endDate.setDate(endDate.getDate() + weeksNeeded * 7);
  return formatDDMMYYYY(endDate);
};

// ─── Helper: parse specific day times from schedule text ──────────────────────
const parseDayTimesFromText = (
  text: string,
  days: string[]
): Record<string, { startHour: string; startMinute: string; endHour: string; endMinute: string }> => {
  const result: Record<string, { startHour: string; startMinute: string; endHour: string; endMinute: string }> = {};
  const defaultVal = { startHour: "19", startMinute: "00", endHour: "21", endMinute: "00" };

  days.forEach(d => {
    result[d] = { ...defaultVal };
  });

  // Try to find specific day times: e.g. "T2 18h30-20h30" or "T2 (18h-20h)"
  days.forEach(d => {
    const dayPatternStr = d === "CN" ? "(?:CN|Chủ\\s*Nhật)" : `T${d}`;
    const regex = new RegExp(dayPatternStr + `[^a-z0-9]*(?:(\\d{1,2}))(?:h|:)?(\\d{2})?\\s*-\\s*(?:(\\d{1,2}))(?:h|:)?(\\d{2})?`, "i");
    const match = text.match(regex);
    if (match) {
      result[d] = {
        startHour: match[1],
        startMinute: match[2] || "00",
        endHour: match[3],
        endMinute: match[4] || "00"
      };
    }
  });

  // If no day-specific time matches, fallback to the general range for all days
  const generalRange = text.match(/(\d{1,2})(?:h|:)(\d{2})?\s*-\s*(\d{1,2})(?:h|:)(\d{2})?/i);
  if (generalRange) {
    days.forEach(d => {
      const dayPatternStr = d === "CN" ? "(?:CN|Chủ\\s*Nhật)" : `T${d}`;
      const hasSpecific = new RegExp(dayPatternStr + `[^a-z0-9]*(?:\\d{1,2})(?:h|:)?(?:\\d{2})?\\s*-\\s*(?:\\d{1,2})(?:h|:)?(?:\\d{2})?`, "i").test(text);
      if (!hasSpecific) {
        result[d] = {
          startHour: generalRange[1],
          startMinute: generalRange[2] || "00",
          endHour: generalRange[3],
          endMinute: generalRange[4] || "00"
        };
      }
    });
  }

  return result;
};

// ─── Helper: compute run sessions and weeks from structured fields ───────────
const computeRunSessionsAndWeeks = (run: {
  dayTimes: Record<string, { startHour: string; startMinute: string; endHour: string; endMinute: string }>;
  totalHours: string;
  totalSessions?: string;
  sessionsPerWeek: string;
}) => {
  const spw = run.sessionsPerWeek ? parseInt(run.sessionsPerWeek, 10) : 0;
  if (!spw) return { sessions: 0, weeks: 0 };

  let sessions = 0;
  if (run.totalHours) {
    // Sum duration of all selected days to get hours per week
    let hoursPerWeek = 0;
    Object.keys(run.dayTimes).forEach(d => {
      const t = run.dayTimes[d];
      if (t) {
        const sh = parseInt(t.startHour, 10) || 0;
        const sm = parseInt(t.startMinute, 10) || 0;
        const eh = parseInt(t.endHour, 10) || 0;
        const em = parseInt(t.endMinute, 10) || 0;
        const duration = (eh * 60 + em - (sh * 60 + sm)) / 60;
        if (duration > 0) hoursPerWeek += duration;
      }
    });

    // Default to 2 hours per session if no days are selected or all are 0
    if (hoursPerWeek <= 0) {
      hoursPerWeek = spw * 2.0;
    }

    const avgHoursPerSession = hoursPerWeek / spw;
    sessions = Math.ceil(parseFloat(run.totalHours) / avgHoursPerSession);
  } else if (run.totalSessions) {
    sessions = parseInt(run.totalSessions, 10);
  }

  const weeks = spw > 0 ? Math.ceil(sessions / spw) : 0;
  return { sessions, weeks };
};

// ─── Helper: calculate exact end date by day-by-day calendar simulation ──────
const calculateExactEndDate = (startDateStr: string, classDays: string[], sessionsCount: number): string => {
  const start = parseDDMMYYYY(startDateStr);
  if (!start || sessionsCount <= 0) return "";

  // Map classDays ("2", "3", "4", "5", "6", "7", "CN") to JS getDay() values (1, 2, 3, 4, 5, 6, 0)
  const targetDays = classDays.map(d => {
    if (d === "CN") return 0;
    return parseInt(d, 10);
  });

  if (targetDays.length === 0) {
    // Fallback: assume 3 sessions per week (1 session = 2.33 days on average)
    const fallbackDate = new Date(start);
    fallbackDate.setDate(fallbackDate.getDate() + Math.ceil(sessionsCount * 2.33));
    return formatDDMMYYYY(fallbackDate);
  }

  let current = new Date(start);

  // Step 1: Advance to the first valid class day on or after the start date
  // This handles the case where the start date itself is NOT a class day
  while (!targetDays.includes(current.getDay())) {
    current.setDate(current.getDate() + 1);
  }

  // Step 2: Count sessions from the first valid class day (count = 1 already)
  let count = 1;
  while (count < sessionsCount) {
    current.setDate(current.getDate() + 1);
    const dayOfWeek = current.getDay();
    if (targetDays.includes(dayOfWeek)) {
      count++;
    }
  }

  return formatDDMMYYYY(current);
};

// ─── Helper: compute end date from structured run fields ─────────────────────
const computeEndDateFromRun = (run: {
  classDays: string[];
  dayTimes: Record<string, { startHour: string; startMinute: string; endHour: string; endMinute: string }>;
  totalHours: string;
  totalSessions: string;
  sessionsPerWeek: string;
  startDate: string;
}): string => {
  const start = parseDDMMYYYY(run.startDate);
  if (!start) return "";
  const { sessions } = computeRunSessionsAndWeeks(run);
  if (!sessions) return "";
  return calculateExactEndDate(run.startDate, run.classDays, sessions);
};

// ─── Current date ────────────────────────────────────────────────────────────
const _NOW = new Date();
const _NOW_Y = _NOW.getFullYear();
const _NOW_M = _NOW.getMonth() + 1;

export default function Lop11Page() {
  const [classesList, setClassesList] = useState<Aca11Class[]>([]);
  const [expandedClasses, setExpandedClasses] = useState<Record<string, boolean>>({});
  
  const toggleRowExpand = (id: string) => {
    setExpandedClasses(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const [runs, setRuns] = useState<{
    classDays: string[];     // e.g. ["2","4","6"] = T2,T4,T6
    dayTimes: Record<string, { startHour: string; startMinute: string; endHour: string; endMinute: string }>;
    totalHours: string;      // e.g. "36"
    totalSessions: string;   // e.g. "18"
    sessionsPerWeek: string; // auto-synced from classDays.length
    startDate: string;
  }[]>([{ classDays: [], dayTimes: {}, totalHours: "", totalSessions: "", sessionsPerWeek: "", startDate: "" }]);

  // Toggle a day in a run's classDays; auto-syncs sessionsPerWeek & dayTimes
  const toggleClassDay = (runIndex: number, dayVal: string) => {
    setRuns(prev => prev.map((r, idx) => {
      if (idx !== runIndex) return r;
      const exists = r.classDays.includes(dayVal);
      const newDays = exists
        ? r.classDays.filter(d => d !== dayVal)
        : [...r.classDays, dayVal];
      
      const newDayTimes = { ...r.dayTimes };
      if (!exists) {
        if (!newDayTimes[dayVal]) {
          newDayTimes[dayVal] = { startHour: "19", startMinute: "00", endHour: "21", endMinute: "00" };
        }
      } else {
        delete newDayTimes[dayVal];
      }

      return {
        ...r,
        classDays: newDays,
        dayTimes: newDayTimes,
        sessionsPerWeek: newDays.length > 0 ? String(newDays.length) : r.sessionsPerWeek,
      };
    }));
  };

  const handleDateIconClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const container = e.currentTarget.parentElement;
    const dateInput = container?.querySelector('input[type="date"]') as HTMLInputElement;
    if (dateInput) {
      try {
        dateInput.showPicker();
      } catch (err) {
        dateInput.focus();
      }
    }
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Month / year selector state
  const [selectedYear, setSelectedYear] = useState<number>(_NOW_Y);
  const [selectedMonth, setSelectedMonth] = useState<number>(_NOW_M);

  // Derive available years from class data + current + next year
  const availableYears = useMemo(() => {
    const yearSet = new Set<number>([_NOW_Y, _NOW_Y + 1]);
    classesList.forEach((c) => {
      if (c.startDate) {
        const parts = c.startDate.split("/");
        if (parts.length === 3) {
          const y = parseInt(parts[2], 10);
          if (!isNaN(y) && y >= 2024) yearSet.add(y);
        }
      }
    });
    return Array.from(yearSet).sort((a, b) => a - b);
  }, [classesList]);

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

  const filteredClasses = classesList.filter((c) => {
    const query = searchQuery.toLowerCase();
    return (
      c.className.toLowerCase().includes(query) ||
      c.teacher.toLowerCase().includes(query) ||
      c.progress.toLowerCase().includes(query)
    );
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
    setRuns([{ classDays: [], dayTimes: {}, totalHours: "", totalSessions: "", sessionsPerWeek: "", startDate: "" }]);
    setIsFormOpen(true);
  };

  const openEditModal = (c: Aca11Class, e: React.MouseEvent) => {
    e.stopPropagation();
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

    // Parse existing compound runs — decode structured prefix [Xh|Ybuổi|Zb/w] if present
    const lines = parseScheduleLines(c.schedule);
    const startDates = parseStartDates(c.startDate);
    const maxLen = Math.max(lines.length, startDates.length, 1);
    const parsedRuns: typeof runs = [];

    // Helper: extract day values like ["2","4","6"] from schedule text
    const parseDaysFromText = (text: string): string[] => {
      const days: string[] = [];
      const upper = text.toUpperCase();
      
      // 1. Check for CN
      if (/\bCN\b|CHỦ\s*NHẬT/i.test(upper)) {
        days.push("CN");
      }
      
      // 2. Strip all time patterns to avoid digit collision
      const cleanText = upper
        .replace(/\d+\s*[H:]\s*\d*/g, "") // remove "19H30", "19:", "9H"
        .replace(/\d+\s*-\s*\d+\s*H/g, "") // remove "9-11H"
        // remove hours like "9-11", "20-22", "19-21" without lookbehind
        .replace(/(^|[^\d])((?:1\d|2[0-3]|[7-9])\s*-\s*(?:1\d|2[0-3]|[7-9]))(?=$|[^\d])/g, "$1");
         
      // 3. Any remaining digit 2-7 is a class day
      for (let d = 2; d <= 7; d++) {
        if (cleanText.includes(String(d))) {
          days.push(String(d));
        }
      }
      
      return days;
    };

    for (let i = 0; i < maxLen; i++) {
      const cleanSched = getCleanSchedule(lines[i] || "");
      const structMatch = cleanSched.match(/^\[(\d*)h\|(\d*)buổi\|(\d*)b\/w\]\s*(.*)/i);
      const rawDayTime = structMatch ? structMatch[4].trim() : cleanSched;
      // Extract classDays from the day/time portion
      const classDays = parseDaysFromText(rawDayTime);
      const dayTimes = parseDayTimesFromText(rawDayTime, classDays);

      if (structMatch) {
        parsedRuns.push({
          totalHours: structMatch[1],
          totalSessions: structMatch[2],
          sessionsPerWeek: structMatch[3],
          classDays,
          dayTimes,
          startDate: startDates[i] || "",
        });
      } else {
        const spwMatch = cleanSched.match(/(\d+)\s*buổi\s*\/\s*tuần/i);
        parsedRuns.push({
          totalHours: "",
          totalSessions: "",
          sessionsPerWeek: classDays.length > 0 ? String(classDays.length) : (spwMatch ? spwMatch[1] : ""),
          classDays,
          dayTimes,
          startDate: startDates[i] || "",
        });
      }
    }
    setRuns(parsedRuns);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
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

    // Build full schedule string for each run: prefix [Xh|Ybuổi|Zb/w] + day times
    const buildScheduleStr = (r: typeof runs[0]) => {
      const { sessions: computedSessions } = computeRunSessionsAndWeeks(r);

      const hasStructured = r.totalHours || computedSessions || r.sessionsPerWeek;
      const prefix = hasStructured
        ? `[${r.totalHours || "0"}h|${computedSessions}buổi|${r.sessionsPerWeek || "0"}b/w] `
        : "";
      const dayOrder = ["2","3","4","5","6","7","CN"];
      const sorted = [...r.classDays].sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));

      if (sorted.length === 0) return prefix.trim();

      // Check if all selected days have the same time
      const firstDay = sorted[0];
      const firstTime = r.dayTimes[firstDay] || { startHour: "19", startMinute: "00", endHour: "21", endMinute: "00" };
      const allSame = sorted.every(d => {
        const t = r.dayTimes[d];
        return t && t.startHour === firstTime.startHour &&
               t.startMinute === firstTime.startMinute &&
               t.endHour === firstTime.endHour &&
               t.endMinute === firstTime.endMinute;
      });

      const formatTimeStr = (t: typeof firstTime) => {
        const sm = t.startMinute && t.startMinute !== "00" ? `h${t.startMinute}` : "h";
        const em = t.endMinute && t.endMinute !== "00" ? `h${t.endMinute}` : "h";
        return `${t.startHour}${sm}-${t.endHour}${em}`;
      };

      if (allSame) {
        const nums = sorted.filter(d => d !== "CN");
        const hasCN = sorted.includes("CN");
        const dayStr = `T${nums.join("")}${hasCN ? "CN" : ""}`;
        return `${prefix}${dayStr} ${formatTimeStr(firstTime)}`.trim();
      } else {
        const chunks = sorted.map(d => {
          const t = r.dayTimes[d] || { startHour: "19", startMinute: "00", endHour: "21", endMinute: "00" };
          const dayLabel = d === "CN" ? "CN" : `T${d}`;
          return `${dayLabel} ${formatTimeStr(t)}`;
        });
        return `${prefix}${chunks.join(" ")}`.trim();
      }
    };

    const computedSchedule = runs.map((r, i) => `K${i + 1}: ${buildScheduleStr(r)}`).join("\n");
    const computedStartDate = runs.map(r => r.startDate.trim()).join(" • ");
    // Auto-compute end date from structured fields for each run
    const computedEndDate = runs.map(r => computeEndDateFromRun(r)).join(" • ");

    const payload = {
      className: formClassName,
      inputNeed: formInputNeed,
      teacher: formTeacher,
      schedule: computedSchedule,
      startDate: computedStartDate,
      endDate: computedEndDate,
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

  // ─── Calendar: isSameDay helper ──────────────────────────────────────────────
  const isSameDay = useCallback(
    (dateStr: string, day: number, month: number, year: number) => {
      if (!dateStr) return false;
      const parts = dateStr.split("/");
      if (parts.length !== 3) return false;
      return (
        parseInt(parts[0], 10) === day &&
        parseInt(parts[1], 10) === month &&
        parseInt(parts[2], 10) === year
      );
    },
    []
  );

  // ─── Calendar days for selected month ────────────────────────────────────────
  const calendarDays = useMemo(() => {
    const monthIndex = selectedMonth - 1;
    const firstDay = new Date(selectedYear, monthIndex, 1);
    const totalDays = new Date(selectedYear, monthIndex + 1, 0).getDate();
    const startDayOfWeek = firstDay.getDay(); // 0 = Sun

    const days: { day: number | null; events: { class: Aca11Class; type: "start" | "end" }[] }[] = [];

    // Blank cells before first day
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({ day: null, events: [] });
    }

    // Fill each day with matching 1:1 class events (both Start and End dates)
    for (let d = 1; d <= totalDays; d++) {
      const dayEvents: { class: Aca11Class; type: "start" | "end" }[] = [];
      classesList.forEach((c) => {
        // Parse all start dates
        const startDates = parseStartDates(c.startDate);
        startDates.forEach((sd) => {
          if (isSameDay(sd, d, selectedMonth, selectedYear)) {
            dayEvents.push({ class: c, type: "start" });
          }
        });

        // Parse all end dates
        const endDates = parseStartDates(c.endDate);
        const lines = parseScheduleLines(c.schedule);
        lines.forEach((line, lineIdx) => {
          const runStart = startDates[lineIdx];
          if (runStart) {
            const explicitEnd = endDates[lineIdx];
            const runEnd = (explicitEnd && explicitEnd.trim() !== "")
              ? explicitEnd
              : calcRunEndDate(runStart, line, c.progress);

            if (runEnd && isSameDay(runEnd, d, selectedMonth, selectedYear)) {
              dayEvents.push({ class: c, type: "end" });
            }
          }
        });
      });
      days.push({ day: d, events: dayEvents });
    }
    return days;
  }, [classesList, selectedMonth, selectedYear, isSameDay]);

  const monthClasses = useMemo(() => {
    return classesList
      .filter((c) => {
        const startDates = parseStartDates(c.startDate);
        return startDates.some((sd) => {
          const parts = sd.split("/");
          return (
            parts.length === 3 &&
            parseInt(parts[1], 10) === selectedMonth &&
            parseInt(parts[2], 10) === selectedYear
          );
        });
      })
      .sort((a, b) => {
        const aStartDates = parseStartDates(a.startDate);
        const bStartDates = parseStartDates(b.startDate);
        const da = parseDDMMYYYY(aStartDates[aStartDates.length - 1] || a.startDate);
        const db = parseDDMMYYYY(bStartDates[bStartDates.length - 1] || b.startDate);
        return (da?.getTime() ?? 0) - (db?.getTime() ?? 0);
      });
  }, [classesList, selectedMonth, selectedYear]);

  // ─── Status style helper ─────────────────────────────────────────────────────
  const getDisplayStatus = (c: Aca11Class): "Đang diễn ra" | "Bảo lưu" | "Đã kết thúc" => {
    if (c.status === "Đã kết thúc") return "Đã kết thúc";
    if (c.status === "Bảo lưu") return "Bảo lưu";

    const lines = parseScheduleLines(c.schedule);
    const startDates = parseStartDates(c.startDate);
    const endDates = parseStartDates(c.endDate);
    const hasMultiple = lines.length > 1;
    const latestSchedule = hasMultiple ? lines[lines.length - 1] : c.schedule;
    const latestStart = hasMultiple && startDates.length > 0 ? startDates[startDates.length - 1] : c.startDate;

    const latestEnd = hasMultiple && endDates.length > 0 && endDates[endDates.length - 1]?.trim() !== ""
      ? endDates[endDates.length - 1]
      : hasMultiple && startDates.length > 0
      ? calcRunEndDate(latestStart, latestSchedule, c.progress)
      : calcEndDate(c);

    if (latestEnd) {
      const end = parseDDMMYYYY(latestEnd);
      if (end) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const endClean = new Date(end);
        endClean.setHours(0, 0, 0, 0);
        if (endClean < today) {
          return "Đã kết thúc";
        }
      }
    }
    return c.status;
  };

  const statusStyle = (status: string) => {
    if (status === "Đang diễn ra") return "bg-primary/15 text-primary";
    if (status === "Bảo lưu") return "bg-warning/15 text-warning";
    return "bg-success/15 text-success";
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
              {classesList.filter((c) => getDisplayStatus(c) === "Đang diễn ra").length} lớp
            </div>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Lớp Đang Bảo lưu</div>
            <div className="mt-2 text-2xl font-black text-warning">
              {classesList.filter((c) => getDisplayStatus(c) === "Bảo lưu").length} lớp
            </div>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Lớp Đã kết thúc</div>
            <div className="mt-2 text-2xl font-black text-success">
              {classesList.filter((c) => getDisplayStatus(c) === "Đã kết thúc").length} lớp
            </div>
          </div>
        </div>

        {/* ── Month/Year Selector + Add button ─────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-zinc-200/80 shadow-sm">
          <div className="space-y-2">
            {/* Year pills */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase text-zinc-400 w-12 shrink-0">Năm:</span>
              <div className="flex gap-1">
                {availableYears.map((y) => (
                  <button
                    key={y}
                    onClick={() => setSelectedYear(y)}
                    className={`px-3 py-1.5 text-[11px] font-black rounded-lg transition-all ${
                      selectedYear === y
                        ? "bg-primary text-white shadow-sm"
                        : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </div>
            {/* Month pills */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase text-zinc-400 w-12 shrink-0">Tháng:</span>
              <div className="flex gap-1">
                {[1,2,3,4,5,6,7,8,9,10,11,12].map((m) => (
                  <button
                    key={m}
                    onClick={() => setSelectedMonth(m)}
                    className={`w-8 h-8 text-[11px] font-black rounded-lg transition-all ${
                      selectedMonth === m
                        ? "bg-primary text-white shadow-sm"
                        : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <button
            onClick={openAddModal}
            className="h-10 rounded-xl bg-primary text-white px-5 text-xs font-black uppercase shadow-soft hover:shadow-hover hover:-translate-y-0.5 transition-all"
          >
            Thêm lớp 1:1 +
          </button>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center text-sm text-zinc-500">
            Đang tải dữ liệu...
          </div>
        ) : (
          <div className="space-y-6">

            {/* ── Bản đồ lịch khai giảng ──────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm space-y-4 w-full">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                  Bản đồ lịch khai giảng Tháng {selectedMonth} / {selectedYear}
                </h3>
                <span className="text-[10px] font-bold text-zinc-400">Ngày khai giảng của lớp 1:1</span>
              </div>

              <div className="grid grid-cols-7 gap-2 border-t border-zinc-100 pt-4">
                {/* Day headers */}
                {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((h) => (
                  <div key={h} className="text-center text-[10px] font-black uppercase text-zinc-400 py-2">
                    {h}
                  </div>
                ))}

                {/* Day blocks */}
                {calendarDays.map((item, idx) => (
                  <div
                    key={idx}
                    className={`min-h-[110px] border border-zinc-100 rounded-2xl p-2.5 flex flex-col transition-all ${
                      item.day
                        ? item.events.length > 0
                          ? "bg-amber-50/20 border-amber-200/50 hover:border-amber-300 hover:shadow-sm"
                          : "bg-white hover:border-primary/20 hover:shadow-sm"
                        : "bg-zinc-50/50 border-none"
                    }`}
                  >
                    {item.day ? (
                      <>
                        <span className="text-[10px] font-black text-zinc-400">{item.day}</span>
                        <div className="flex flex-col gap-1.5 mt-1.5 flex-1 justify-start overflow-y-auto max-h-[130px] scrollbar-none">
                          {item.events.map((evt, eIdx) => {
                            const c = evt.class;
                            const isStart = evt.type === "start";
                            return (
                              <div
                                key={eIdx}
                                onClick={() => setSelectedClass(c)}
                                className={`p-1.5 border rounded-xl flex flex-col gap-0.5 cursor-pointer hover:shadow-sm transition-all text-[8.5px] font-black leading-tight ${
                                  isStart
                                    ? "bg-amber-50 text-amber-700 border-amber-100/70 hover:bg-amber-100/30"
                                    : "bg-rose-50 text-rose-700 border-rose-100/70 hover:bg-rose-100/30"
                                }`}
                                title={`${c.className} — ${isStart ? "Khai giảng" : "Dự kiến kết thúc"} — GV: ${c.teacher}`}
                              >
                                <div className="flex items-center gap-1">
                                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isStart ? "bg-amber-500" : "bg-rose-500"}`} />
                                  <span className="text-[7.5px] text-zinc-400 uppercase font-black tracking-wide">
                                    {isStart ? "KG Lớp 1:1" : "Dự kiến KT"}
                                  </span>
                                </div>
                                <div className="text-[9px] font-black tracking-tight text-zinc-800 truncate">
                                  {c.className}
                                </div>
                                {c.teacher && (
                                  <div className="text-[8px] font-bold text-zinc-500 truncate mt-0.5">
                                    GV: {c.teacher}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>

            {/* ── Lịch khai giảng trong tháng ─────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm space-y-4 w-full">
              <h3 className="text-xs font-black uppercase tracking-wider text-foreground pb-2 border-b border-zinc-100">
                Lịch khai giảng trong tháng {selectedMonth} / {selectedYear}
              </h3>
              {monthClasses.length === 0 ? (
                <p className="text-xs text-zinc-400 py-6 text-center italic">
                  Không có lớp 1:1 nào khai giảng trong tháng này.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-200 text-[10px] font-black uppercase tracking-wider text-zinc-400">
                        <th className="py-2.5 w-32">Ngày KG</th>
                        <th className="py-2.5 w-56">Tên lớp / Học viên</th>
                        <th className="py-2.5 w-40">Giáo viên</th>
                        <th className="py-2.5 w-40">Lịch học</th>
                        <th className="py-2.5 w-32">Ngày kết thúc</th>
                        <th className="py-2.5 w-28">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 font-semibold text-zinc-700">
                      {monthClasses.map((c) => (
                        <tr
                          key={c.id}
                          onClick={() => setSelectedClass(c)}
                          className="hover:bg-zinc-50/50 cursor-pointer transition-colors align-middle"
                        >
                          <td className="py-3 font-black text-zinc-800 tabular-nums">{c.startDate}</td>
                          <td className="py-3 font-black text-primary hover:underline">{c.className}</td>
                          <td className="py-3 text-zinc-500 font-bold">{c.teacher}</td>
                          <td className="py-3 text-zinc-500 font-medium">{c.schedule}</td>
                          <td className="py-3 text-zinc-500 font-medium">
                            {calcEndDate(c) || <span className="text-zinc-300">—</span>}
                          </td>
                          <td className="py-3">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${statusStyle(getDisplayStatus(c))}`}>
                              {getDisplayStatus(c)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* ── Full Class Table ─────────────────────────────────────────── */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-4 bg-white px-4 py-3 rounded-2xl border border-zinc-200/80 shadow-sm">
                <div className="flex flex-1 min-w-[200px] max-w-md items-center gap-2">
                  <label className="text-xs font-black uppercase text-muted tracking-wider shrink-0">Tìm kiếm:</label>
                  <input
                    type="text"
                    placeholder="Tìm theo tên học viên, GV hoặc tiến độ..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-4 text-xs font-bold text-foreground outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
                  />
                </div>
                <span className="text-[10px] font-bold text-zinc-400">{filteredClasses.length} lớp</span>
              </div>

              <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1600px] border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-zinc-200 bg-zinc-50 text-[10px] font-black uppercase tracking-widest text-muted whitespace-nowrap">
                        <th className="px-4 py-4 text-center w-16">Chi tiết</th>
                        <th className="px-6 py-4 min-w-[150px]">Trạng thái</th>
                        <th className="px-6 py-4 min-w-[320px]">Tên lớp / RLP (Click xem chi tiết)</th>
                        <th className="px-6 py-4 min-w-[150px]">Đầu vào / Nhu cầu</th>
                        <th className="px-6 py-4 min-w-[180px]">Giáo viên phụ trách</th>
                        <th className="px-6 py-4 min-w-[280px]">Lịch học</th>
                        <th className="px-6 py-4 min-w-[180px]">Ngày khai giảng</th>
                        <th className="px-6 py-4 min-w-[180px]">
                          Ngày kết thúc
                          <span className="ml-1 text-[8px] text-zinc-400 normal-case font-bold">(tự tính nếu trống)</span>
                        </th>
                        <th className="px-6 py-4 min-w-[150px]">Đầu ra</th>
                        <th className="px-6 py-4 text-center min-w-[150px]">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 font-semibold text-zinc-700">
                      {filteredClasses.length > 0 ? (
                        filteredClasses.map((item) => {
                          const lines = parseScheduleLines(item.schedule);
                          const startDates = parseStartDates(item.startDate);
                          const endDates = parseStartDates(item.endDate);

                          const hasMultiple = lines.length > 1;

                          // The main row shows the latest course run (last element in the lines array)
                          const latestSchedule = hasMultiple ? lines[lines.length - 1] : item.schedule;
                          const latestStart = hasMultiple && startDates.length > 0 ? startDates[startDates.length - 1] : item.startDate;
                          
                          // End date calculation
                          const latestEnd = hasMultiple && endDates.length > 0 && endDates[endDates.length - 1]?.trim() !== ""
                            ? endDates[endDates.length - 1]
                            : hasMultiple && startDates.length > 0
                            ? calcRunEndDate(latestStart, latestSchedule, item.progress)
                            : calcEndDate(item);

                          const isExpanded = !!expandedClasses[item.id];

                          return (
                            <Fragment key={item.id}>
                              {/* Main Class Row */}
                              <tr
                                className="hover:bg-zinc-50/80 align-middle cursor-pointer transition-colors"
                                onClick={() => setSelectedClass(item)}
                                title="Click xem chi tiết thời khóa biểu, tài liệu Drive và tiến độ chi tiết"
                              >
                                {/* Expanded Toggle Chevron */}
                                <td className="px-4 py-4 text-center">
                                  {hasMultiple ? (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleRowExpand(item.id);
                                      }}
                                      className="p-1 rounded-lg hover:bg-zinc-100 text-zinc-500 hover:text-primary transition-all shrink-0"
                                      title="Xem các khóa học/lần học trước"
                                    >
                                      <svg
                                        className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? "rotate-180 text-primary" : ""}`}
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                        viewBox="0 0 24 24"
                                      >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                      </svg>
                                    </button>
                                  ) : (
                                    <span className="text-zinc-300 font-medium cursor-default">—</span>
                                  )}
                                </td>

                                <td className="px-6 py-4 min-w-[150px]">
                                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-black uppercase ${statusStyle(getDisplayStatus(item))}`}>
                                    {getDisplayStatus(item)}
                                  </span>
                                </td>
                                <td className="px-6 py-4 min-w-[320px]">
                                  <div className="font-black text-primary hover:underline flex items-center gap-1.5">
                                    {item.className}
                                    {hasMultiple && (
                                      <span className="inline-flex items-center rounded-md bg-zinc-100 px-1.5 py-0.5 text-[8.5px] font-bold text-zinc-600">
                                        {lines.length} Khóa
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-zinc-700 min-w-[150px] font-bold whitespace-pre-line">{item.inputNeed}</td>
                                <td className="px-6 py-4 text-zinc-800 min-w-[180px] font-black whitespace-pre-line">{item.teacher}</td>
                                <td className="px-6 py-4 text-zinc-650 min-w-[280px] font-medium leading-relaxed whitespace-pre-line">
                                  {getCleanSchedule(latestSchedule)}
                                </td>
                                <td className="px-6 py-4 text-zinc-500 min-w-[180px] leading-relaxed truncate">{latestStart || "-"}</td>
                                <td className="px-6 py-4 text-zinc-500 min-w-[180px] leading-relaxed truncate">
                                  {latestEnd || <span className="text-zinc-300 text-[10px]">Chưa đủ dữ liệu</span>}
                                </td>
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

                              {/* Expanded Previous Cycles Rows */}
                              {isExpanded &&
                                lines.slice(0, lines.length - 1).map((line, lineIdx) => {
                                   const runStart = startDates[lineIdx] || "—";
                                   const runEnd = (endDates[lineIdx] && endDates[lineIdx].trim() !== "")
                                     ? endDates[lineIdx]
                                     : (calcRunEndDate(runStart, line, item.progress) || "—");
                                  const runLabel = getRunLabel(line);

                                  return (
                                    <tr
                                      key={`${item.id}-sub-${lineIdx}`}
                                      className="bg-zinc-50/45 border-t border-zinc-150/40 align-middle hover:bg-zinc-100/30 transition-all cursor-pointer"
                                      onClick={() => setSelectedClass(item)}
                                    >
                                      {/* Chi tiết */}
                                      <td className="px-4 py-3 text-center text-zinc-300 font-medium">—</td>
                                      {/* Trạng thái */}
                                      <td className="px-6 py-3 min-w-[150px]">
                                        <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-[8.5px] font-black text-zinc-500 uppercase">
                                          {runLabel}
                                        </span>
                                      </td>
                                      {/* Tên lớp / RLP */}
                                      <td className="px-6 py-3 min-w-[320px] font-bold text-zinc-400">
                                        <div className="flex items-center gap-1.5 pl-4 text-zinc-400">
                                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-zinc-300" />
                                          Lịch học cũ của lớp 1:1
                                        </div>
                                      </td>
                                      {/* Đầu vào */}
                                      <td className="px-6 py-3 text-zinc-300 font-medium">—</td>
                                      {/* Giáo viên */}
                                      <td className="px-6 py-3 text-zinc-300 font-medium">—</td>
                                      {/* Lịch học */}
                                      <td className="px-6 py-3 text-zinc-455 font-medium leading-relaxed whitespace-pre-line">
                                        {getCleanSchedule(line)}
                                      </td>
                                      {/* Ngày khai giảng */}
                                      <td className="px-6 py-3 text-zinc-400 font-medium leading-relaxed truncate">{runStart}</td>
                                      {/* Ngày kết thúc */}
                                      <td className="px-6 py-3 text-zinc-400 font-medium leading-relaxed truncate">{runEnd}</td>
                                      {/* Đầu ra */}
                                      <td className="px-6 py-3 text-zinc-300 font-medium">—</td>
                                      {/* Hành động */}
                                      <td className="px-6 py-3 text-zinc-300 font-medium text-center">—</td>
                                    </tr>
                                  );
                                })}
                            </Fragment>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={10} className="px-6 py-8 text-center text-zinc-400 font-medium">
                            Không tìm thấy lớp học 1:1 nào phù hợp.
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

      {/* ── CLASS DETAILS MODAL ────────────────────────────────────────────────── */}
      {selectedClass && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl border border-zinc-200 max-w-2xl w-full p-6 shadow-2xl relative overflow-hidden animate-in zoom-in duration-200 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex justify-between items-start pb-4 border-b border-zinc-100">
              <div>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase mb-1 ${statusStyle(getDisplayStatus(selectedClass))}`}>
                  Lớp 1:1 • {getDisplayStatus(selectedClass)}
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

              {/* Parameters grid */}
              <div className="grid grid-cols-2 gap-4 bg-zinc-50 p-4 rounded-2xl border border-zinc-200/50">
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">THÔNG TIN KHOÁ HỌC</h4>
                  <div className="flex justify-between">
                    <span className="text-zinc-500 font-bold">Giáo viên:</span>
                    <span className="font-black text-zinc-800 whitespace-pre-line text-right">{selectedClass.teacher}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500 font-bold">Đầu vào / Nhu cầu:</span>
                    <span className="font-black text-primary text-right whitespace-pre-line">{selectedClass.inputNeed}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500 font-bold shrink-0">Lịch học:</span>
                    <div className="text-right">
                      {(() => {
                        const lines = parseScheduleLines(selectedClass.schedule);
                        if (lines.length <= 1) {
                          return <span className="font-semibold text-zinc-800 whitespace-pre-line">{selectedClass.schedule || "-"}</span>;
                        }
                        return (
                          <div className="relative inline-block w-full max-w-[200px] text-left">
                            <select
                              className="w-full bg-white border border-zinc-200 text-zinc-800 text-[11px] font-bold rounded-xl px-3 py-1.5 outline-none cursor-pointer transition-all appearance-none pr-8 focus:border-primary/45"
                              defaultValue={lines[lines.length - 1]}
                            >
                              {lines.map((line, lIdx) => (
                                <option key={lIdx} value={line}>
                                  {line}
                                </option>
                              ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-zinc-400">
                              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                              </svg>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
                <div className="space-y-2 border-l border-zinc-200 pl-4">
                  <h4 className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">THỜI GIAN</h4>
                  <div className="flex justify-between">
                    <span className="text-zinc-500 font-bold">Ngày khai giảng:</span>
                    <span className="font-black text-zinc-800">{selectedClass.startDate}</span>
                  </div>
                  {/* <div className="flex justify-between">
                    <span className="text-zinc-500 font-bold">Ngày kết thúc:</span>
                    <span className="font-black text-zinc-800">
                      {calcEndDate(selectedClass) || <span className="text-zinc-400">—</span>}
                      {!selectedClass.endDate && calcEndDate(selectedClass) && (
                        <span className="ml-1 text-[9px] text-amber-500 font-bold">(tự tính)</span>
                      )}
                    </span>
                  </div> */}
                  <div className="flex justify-between">
                    <span className="text-zinc-500 font-bold">Đầu ra / Kết quả:</span>
                    <span className="font-black text-zinc-800 text-right whitespace-pre-line">{selectedClass.output}</span>
                  </div>
                </div>
              </div>

              {/* Progress */}
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 space-y-1">
                <h4 className="text-[10px] font-black uppercase text-primary tracking-wider">TÌNH TRẠNG TIẾN ĐỘ</h4>
                <p className="font-bold text-zinc-800 leading-relaxed whitespace-pre-line">
                  {selectedClass.progress || "Không có ghi chú tiến độ học tập."}
                </p>
              </div>

              {/* Quick links */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-zinc-400">LIÊN KẾT & TÀI NGUYÊN</h4>
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-xl border border-zinc-200 bg-white p-3 space-y-2">
                    <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest block">LINK ZOOM / MEET</span>
                    {selectedClass.zoomLink ? (
                      <div className="flex gap-1">
                        <a href={selectedClass.zoomLink} target="_blank" rel="noreferrer"
                          className="flex-1 text-center bg-primary text-white py-1 rounded-lg font-black text-[10px] hover:opacity-90 block">
                          VÀO HỌC ↗
                        </a>
                        <button onClick={() => handleCopy(selectedClass.zoomLink!, "Link Zoom")}
                          className="px-2 border border-zinc-200 rounded-lg text-zinc-500 hover:bg-zinc-50 font-black text-[9px]">
                          Copy
                        </button>
                      </div>
                    ) : <span className="text-zinc-300 font-black block text-[10px]">-</span>}
                  </div>
                  <div className="rounded-xl border border-zinc-200 bg-white p-3 space-y-2">
                    <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest block">LINK TAB THEO DÕI</span>
                    {selectedClass.successorLink ? (
                      <div className="flex gap-1">
                        <a href={selectedClass.successorLink} target="_blank" rel="noreferrer"
                          className="flex-1 text-center bg-secondary text-white py-1 rounded-lg font-black text-[10px] hover:opacity-90 block">
                          MỞ LINK ↗
                        </a>
                        <button onClick={() => handleCopy(selectedClass.successorLink!, "Link Tab")}
                          className="px-2 border border-zinc-200 rounded-lg text-zinc-500 hover:bg-zinc-50 font-black text-[9px]">
                          Copy
                        </button>
                      </div>
                    ) : <span className="text-zinc-300 font-black block text-[10px]">-</span>}
                  </div>
                  <div className="rounded-xl border border-zinc-200 bg-white p-3 space-y-2">
                    <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest block">TÀI LIỆU (DRIVE)</span>
                    {selectedClass.materials ? (
                      <div className="flex gap-1">
                        <a href={selectedClass.materials} target="_blank" rel="noreferrer"
                          className="flex-1 text-center bg-amber-600 text-white py-1 rounded-lg font-black text-[10px] hover:opacity-90 block">
                          THƯ MỤC ↗
                        </a>
                        <button onClick={() => handleCopy(selectedClass.materials!, "Link Drive")}
                          className="px-2 border border-zinc-200 rounded-lg text-zinc-500 hover:bg-zinc-50 font-black text-[9px]">
                          Copy
                        </button>
                      </div>
                    ) : <span className="text-zinc-300 font-black block text-[10px]">-</span>}
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

      {/* ── CRUD FORM MODAL ────────────────────────────────────────────────────── */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl border border-zinc-200 max-w-lg w-full p-6 shadow-2xl relative overflow-hidden animate-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-sm font-black uppercase tracking-widest text-foreground mb-4">
              {formMode === "add" ? "Thêm lớp học 1:1 mới" : "Chỉnh sửa thông tin lớp 1:1"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-[10px] font-black uppercase text-muted tracking-widest mb-1.5">Tên lớp / RLP</label>
                <input type="text" required value={formClassName} onChange={(e) => setFormClassName(e.target.value)}
                  placeholder="Ví dụ: 2025RLP_ONL 1:1 Dương Bảo Ngọc"
                  className="h-10 w-full rounded-xl border border-zinc-200 px-4 font-bold text-foreground outline-none focus:border-primary/45 focus:ring-2 focus:ring-primary/10" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-muted tracking-widest mb-1.5">Đầu vào / Nhu cầu</label>
                  <input type="text" required value={formInputNeed} onChange={(e) => setFormInputNeed(e.target.value)}
                    placeholder="Ví dụ: 5.5/7.0..."
                    className="h-10 w-full rounded-xl border border-zinc-200 px-4 font-bold text-foreground outline-none focus:border-primary/45 focus:ring-2 focus:ring-primary/10" />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-muted tracking-widest mb-1.5">Giáo viên phụ trách</label>
                  <input type="text" required value={formTeacher} onChange={(e) => setFormTeacher(e.target.value)}
                    placeholder="Tên giáo viên..."
                    className="h-10 w-full rounded-xl border border-zinc-200 px-4 font-bold text-foreground outline-none focus:border-primary/45 focus:ring-2 focus:ring-primary/10" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-muted tracking-widest mb-1.5">Trạng thái</label>
                  <select value={formStatus} onChange={(e) => setFormStatus(e.target.value as any)}
                    className="h-10 w-full rounded-xl border border-zinc-200 px-4 font-bold text-foreground outline-none focus:border-primary/45 focus:ring-2 focus:ring-primary/10 bg-white">
                    <option value="Đang diễn ra">Đang diễn ra</option>
                    <option value="Bảo lưu">Bảo lưu</option>
                    <option value="Đã kết thúc">Đã kết thúc</option>
                  </select>
                </div>
              </div>

              {/* ─── DYNAMIC RUNS EDITOR ─── */}
              <div className="space-y-3.5 border-t border-zinc-150 pt-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Danh sách các khóa học (Runs)</h4>
                  <button
                    type="button"
                     onClick={() => setRuns(prev => [...prev, { classDays: [], dayTimes: {}, totalHours: "", totalSessions: "", sessionsPerWeek: "", startDate: "" }])}
                    className="px-2.5 py-1 text-[9px] font-black uppercase bg-primary/10 hover:bg-primary/15 text-primary rounded-xl transition-all"
                  >
                    + Thêm khóa học
                  </button>
                </div>

                <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                  {runs.map((run, index) => {
                    const computedEnd = computeEndDateFromRun(run);
                    
                    const { sessions: computedSessions } = computeRunSessionsAndWeeks(run);

                    return (
                    <div key={index} className="bg-zinc-50 border border-zinc-200/60 p-3 rounded-2xl relative space-y-3">
                      {/* Run header */}
                      <div className="flex items-center justify-between border-b border-zinc-200/50 pb-1.5">
                        <span className="text-[9.5px] font-black text-zinc-500 uppercase">Khóa K{index + 1}</span>
                        {runs.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setRuns(prev => prev.filter((_, idx) => idx !== index))}
                            className="text-[9px] font-bold text-danger hover:underline"
                          >
                            Xóa khóa này
                          </button>
                        )}
                      </div>

                      {/* Ngày khai giảng */}
                      <div>
                        <label className="block text-[9px] font-black uppercase text-muted tracking-wide mb-1">Ngày khai giảng</label>
                        <div className="relative flex items-center">
                          <input
                            type="text"
                            required
                            value={run.startDate}
                            onChange={(e) => {
                              const val = e.target.value;
                              setRuns(prev => prev.map((r, idx) => idx === index ? { ...r, startDate: val } : r));
                            }}
                            placeholder="dd/mm/yyyy"
                            className="h-8 w-full rounded-lg border border-zinc-200 pl-3 pr-8 font-bold text-foreground outline-none focus:border-primary/45 bg-white text-[11px]"
                          />
                          <input
                            type="date"
                            value={toYYYYMMDD(run.startDate)}
                            onChange={(e) => {
                              const val = toDDMMYYYY(e.target.value);
                              setRuns(prev => prev.map((r, idx) => idx === index ? { ...r, startDate: val } : r));
                            }}
                            className="absolute opacity-0 pointer-events-none w-0 h-0"
                          />
                          <button
                            type="button"
                            onClick={handleDateIconClick}
                            className="absolute right-2 text-zinc-400 hover:text-primary transition-colors flex items-center justify-center p-1 rounded hover:bg-zinc-100"
                            title="Chọn ngày"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* ─── Structured schedule: 2 number inputs ─── */}
                      <div>
                        <label className="block text-[9px] font-black uppercase text-muted tracking-wide mb-1.5">
                          Thông số khóa học
                          <span className="ml-1 text-[7.5px] text-zinc-400 normal-case font-medium">
                            (điền để tự tính số buổi và ngày kết thúc)
                          </span>
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[8px] font-bold text-zinc-400 mb-1">Tổng số giờ</label>
                            <div className="relative">
                              <input
                                type="number"
                                min="0"
                                value={run.totalHours}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setRuns(prev => prev.map((r, idx) => idx === index ? { ...r, totalHours: val } : r));
                                }}
                                placeholder="36"
                                className="h-8 w-full rounded-lg border border-zinc-200 pl-3 pr-1 font-bold text-foreground outline-none focus:border-primary/45 bg-white text-[11px]"
                              />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-zinc-400 font-bold pointer-events-none">h</span>
                            </div>
                          </div>
                          <div>
                            <label className="block text-[8px] font-bold text-zinc-400 mb-1">Số buổi / tuần</label>
                            <div className="relative">
                              <input
                                type="number"
                                min="1"
                                max="7"
                                value={run.sessionsPerWeek}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setRuns(prev => prev.map((r, idx) => idx === index ? { ...r, sessionsPerWeek: val } : r));
                                }}
                                placeholder="3"
                                className="h-8 w-full rounded-lg border border-zinc-200 pl-3 pr-1 font-bold text-foreground outline-none focus:border-primary/45 bg-white text-[11px]"
                              />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-zinc-400 font-bold pointer-events-none">b/t</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Day-of-week pill checkboxes */}
                      <div>
                        <label className="block text-[9px] font-black uppercase text-muted tracking-wide mb-1.5">
                          Ngày học trong tuần
                          {run.classDays.length > 0 && (
                            <span className="ml-1.5 text-[7.5px] text-primary font-black normal-case">
                              → {run.classDays.length} buổi/tuần
                            </span>
                          )}
                        </label>
                        <div className="flex gap-1.5">
                          {(["2","3","4","5","6","7","CN"] as const).map((d) => {
                            const isOn = run.classDays.includes(d);
                            return (
                              <button
                                key={d}
                                type="button"
                                onClick={() => toggleClassDay(index, d)}
                                className={`h-7 min-w-[28px] px-2 rounded-lg text-[10px] font-black transition-all ${
                                  isOn
                                    ? "bg-primary text-white shadow-sm scale-105"
                                    : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-700"
                                }`}
                              >
                                {d === "2" ? "T2" : d === "3" ? "T3" : d === "4" ? "T4"
                                  : d === "5" ? "T5" : d === "6" ? "T6" : d === "7" ? "T7" : "CN"}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Giờ học cho từng thứ được chọn */}
                      {run.classDays.length > 0 && (
                        <div className="space-y-2 border-t border-zinc-200/50 pt-2.5">
                          <label className="block text-[9px] font-black uppercase text-muted tracking-wide">
                            Giờ học tương ứng với thứ
                          </label>
                          <div className="space-y-1.5">
                            {run.classDays.map(d => {
                              const t = run.dayTimes[d] || { startHour: "19", startMinute: "00", endHour: "21", endMinute: "00" };
                              const dayLabel = d === "CN" ? "Chủ Nhật" : `Thứ ${d}`;
                              const sh = parseInt(t.startHour, 10) || 0;
                              const sm = parseInt(t.startMinute, 10) || 0;
                              const eh = parseInt(t.endHour, 10) || 0;
                              const em = parseInt(t.endMinute, 10) || 0;
                              const duration = (eh * 60 + em - (sh * 60 + sm)) / 60;
                              const durationText = duration > 0 ? `${duration}h` : "";

                              return (
                                <div key={d} className="flex items-center justify-between bg-zinc-100/50 px-2.5 py-1.5 rounded-xl border border-zinc-200/40">
                                  <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-zinc-600 w-16">{dayLabel}</span>
                                    {durationText && <span className="text-[8px] text-primary/80 font-black">{durationText}/buổi</span>}
                                  </div>
                                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500">
                                    <span>Từ</span>
                                    <input
                                      type="number"
                                      min="0"
                                      max="23"
                                      value={t.startHour}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setRuns(prev => prev.map((r, idx) => idx === index ? {
                                          ...r,
                                          dayTimes: {
                                            ...r.dayTimes,
                                            [d]: { ...t, startHour: val }
                                          }
                                        } : r));
                                      }}
                                      className="w-10 h-7 rounded border border-zinc-200 text-center font-bold text-foreground text-[10px]"
                                    />
                                    <span>:</span>
                                    <input
                                      type="number"
                                      min="0"
                                      max="59"
                                      step="5"
                                      value={t.startMinute}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setRuns(prev => prev.map((r, idx) => idx === index ? {
                                          ...r,
                                          dayTimes: {
                                            ...r.dayTimes,
                                            [d]: { ...t, startMinute: val.padStart(2, '0') }
                                          }
                                        } : r));
                                      }}
                                      className="w-10 h-7 rounded border border-zinc-200 text-center font-bold text-foreground text-[10px]"
                                    />
                                    <span className="mx-1">đến</span>
                                    <input
                                      type="number"
                                      min="0"
                                      max="23"
                                      value={t.endHour}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setRuns(prev => prev.map((r, idx) => idx === index ? {
                                          ...r,
                                          dayTimes: {
                                            ...r.dayTimes,
                                            [d]: { ...t, endHour: val }
                                          }
                                        } : r));
                                      }}
                                      className="w-10 h-7 rounded border border-zinc-200 text-center font-bold text-foreground text-[10px]"
                                    />
                                    <span>:</span>
                                    <input
                                      type="number"
                                      min="0"
                                      max="59"
                                      step="5"
                                      value={t.endMinute}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setRuns(prev => prev.map((r, idx) => idx === index ? {
                                          ...r,
                                          dayTimes: {
                                            ...r.dayTimes,
                                            [d]: { ...t, endMinute: val.padStart(2, '0') }
                                          }
                                        } : r));
                                      }}
                                      className="w-10 h-7 rounded border border-zinc-200 text-center font-bold text-foreground text-[10px]"
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Live computed end date preview */}
                      <div className={`flex items-center gap-2 rounded-xl px-3 py-2 text-[10px] font-black ${
                        computedEnd
                          ? "bg-primary/8 border border-primary/20 text-primary"
                          : "bg-zinc-100 border border-zinc-200 text-zinc-400"
                      }`}>
                        <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                        </svg>
                        {computedEnd
                          ? <span>Dự kiến: <span className="text-zinc-900 font-bold">{computedSessions} buổi</span> ({run.totalHours || 0}h) • Kết thúc: <span className="tabular-nums font-black">{computedEnd}</span></span>
                          : <span>Nhập Tổng số giờ + Chọn thứ &amp; điền giờ học + Ngày KG để tính ngày KT</span>
                        }
                      </div>
                    </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-muted tracking-widest mb-1.5">Link Zoom</label>
                  <input type="text" value={formZoomLink} onChange={(e) => setFormZoomLink(e.target.value)}
                    placeholder="Link zoom..."
                    className="h-10 w-full rounded-xl border border-zinc-200 px-4 font-bold text-foreground outline-none focus:border-primary/45 focus:ring-2 focus:ring-primary/10" />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-muted tracking-widest mb-1.5">Link Tab</label>
                  <input type="text" value={formSuccessorLink} onChange={(e) => setFormSuccessorLink(e.target.value)}
                    placeholder="Link sheet..."
                    className="h-10 w-full rounded-xl border border-zinc-200 px-4 font-bold text-foreground outline-none focus:border-primary/45 focus:ring-2 focus:ring-primary/10" />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-muted tracking-widest mb-1.5">Drive tài liệu</label>
                  <input type="text" value={formMaterials} onChange={(e) => setFormMaterials(e.target.value)}
                    placeholder="Link drive..."
                    className="h-10 w-full rounded-xl border border-zinc-200 px-4 font-bold text-foreground outline-none focus:border-primary/45 focus:ring-2 focus:ring-primary/10" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-muted tracking-widest mb-1.5">Đầu ra / Kết quả</label>
                <input type="text" value={formOutput} onChange={(e) => setFormOutput(e.target.value)}
                  placeholder="Ví dụ: Final lần 1: 5.5..."
                  className="h-10 w-full rounded-xl border border-zinc-200 px-4 font-bold text-foreground outline-none focus:border-primary/45 focus:ring-2 focus:ring-primary/10" />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-muted tracking-widest mb-1.5">
                  Tình trạng tiến độ
                  <span className="ml-1 text-[8px] text-zinc-400 font-bold normal-case">(Ví dụ: 10/24 buổi — dùng để tự tính ngày KT)</span>
                </label>
                <textarea value={formProgress} onChange={(e) => setFormProgress(e.target.value)}
                  placeholder="Ví dụ: 10/24 buổi. Học viên đang tiến bộ tốt..."
                  className="w-full min-h-[60px] rounded-xl border border-zinc-200 p-3 font-bold text-foreground outline-none focus:border-primary/45 focus:ring-2 focus:ring-primary/10 bg-white" />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-muted tracking-widest mb-1.5">Ghi chú khác</label>
                <textarea value={formOtherNote} onChange={(e) => setFormOtherNote(e.target.value)}
                  placeholder="Lưu ý học viên, yêu cầu đặc biệt..."
                  className="w-full min-h-[50px] rounded-xl border border-zinc-200 p-3 font-bold text-foreground outline-none focus:border-primary/45 focus:ring-2 focus:ring-primary/10 bg-white" />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-100">
                <button type="button" onClick={() => setIsFormOpen(false)}
                  className="h-10 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-5 text-xs font-black uppercase">
                  Hủy
                </button>
                <button type="submit"
                  className="h-10 rounded-xl bg-primary text-white px-5 text-xs font-black uppercase shadow-soft hover:shadow-hover hover:-translate-y-0.5 transition-all">
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
