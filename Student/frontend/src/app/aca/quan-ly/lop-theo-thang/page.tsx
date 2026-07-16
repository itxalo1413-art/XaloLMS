"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { getCachedAuthUser } from "@/lib/auth";
import { AcaLayout } from "@/components/aca/AcaLayout";
import { AcaTopbar } from "@/components/aca/AcaTopbar";
import { NativeSelectChevron } from "@/components/student/ui";
import {
  fetchAcaClasses,
  fetchAcaStudents,
  fetchAca11Classes,
  createAcaClass,
  updateAcaClass,
  deleteAcaClass,
  canUseAcaApi,
  type AcaClass,
  type AcaStudent,
  type Aca11Class,
  displayClassCode,
  classCodesMatch,
} from "@/lib/acaManagementApi";

function hasRecordedScore(value: unknown): boolean {
  const s = String(value ?? "").trim();
  return s !== "" && s !== "-";
}

const countDaysInMonth = (year: number, monthIndex: number, daysOfWeek: number[]) => {
  let count = 0;
  const totalDays = new Date(year, monthIndex + 1, 0).getDate();
  for (let d = 1; d <= totalDays; d++) {
    const dayOfWeek = new Date(year, monthIndex, d).getDay();
    if (daysOfWeek.includes(dayOfWeek)) {
      count++;
    }
  }
  return count;
};

const parseDuration = (timeRange: string) => {
  const parts = timeRange.split("-");
  if (parts.length < 2) return 1.75;
  const start = parts[0].trim();
  const end = parts[1].trim();
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  if (!isNaN(sh) && !isNaN(eh)) {
    const diff = (eh * 60 + (em || 0)) - (sh * 60 + (sm || 0));
    return diff / 60;
  }
  return 1.75;
};

interface ClassSchedule {
  days: number[];
  daysLabel: string;
  timeRange: string;
  duration: number;
  cleanName: string;
}

const parseClassSchedule = (name: string, classCode?: string): ClassSchedule => {
  const nameLower = `${name || ""} ${classCode || ""}`.toLowerCase();
  
  // 1. Parse days — support both Vietnamese numeric (246/357) and English alpha (MWF/TTS) abbreviations
  let days: number[] = [];
  let daysLabel = "";
  if (nameLower.includes("246") || nameLower.includes("mwf") || nameLower.includes("m/w/f")) {
    // Monday / Wednesday / Friday
    days = [1, 3, 5];
    daysLabel = "T2-T4-T6";
  } else if (nameLower.includes("357") || nameLower.includes("tts") || nameLower.includes("t/t/s")) {
    // Tuesday / Thursday / Saturday
    days = [2, 4, 6];
    daysLabel = "T3-T5-T7";
  } else if (nameLower.includes("s/s") || nameLower.includes("t7cn") || nameLower.includes("t7 cn")) {
    days = [6, 0];
    daysLabel = "T7-CN";
  }
  
  // 2. Parse time range and duration
  let timeRange = "18:00 - 19:45";
  let duration = 1.75;
  
  if (nameLower.includes("c2")) {
    timeRange = "19:45 - 21:30";
    duration = 1.75;
  } else if (nameLower.includes("c1")) {
    timeRange = "18:00 - 19:45";
    duration = 1.75;
  } else if (nameLower.includes("18002000")) {
    timeRange = "18:00 - 20:00";
    duration = 2.0;
  } else if (nameLower.includes("20002200")) {
    timeRange = "20:00 - 22:00";
    duration = 2.0;
  }
  
  // 3. Extract clean class type/name
  let cleanName = "LỚP";
  if (nameLower.includes("momentum")) cleanName = "MOMENTUM";
  else if (nameLower.includes("upstream")) cleanName = "UPSTREAM";
  else if (nameLower.includes("soar")) cleanName = "SOAR";
  else if (nameLower.includes("advanced")) cleanName = "ADVANCED";
  else if (nameLower.includes("foundation")) cleanName = "FOUNDATION";
  else if (nameLower.includes("pre core")) cleanName = "PRE CORE";
  else {
    const parts = name.split(" - ");
    if (parts[0]) {
      cleanName = parts[0].replace("XLE RLP_", "").trim().toUpperCase();
    }
  }
  
  return { days, daysLabel, timeRange, duration, cleanName };
};

interface ResolvedPhases {
  wlDate: string;
  srDate: string;
  activePhase: "W-L" | "S-R" | "OTHER";
}

const isAcaClass = (value: AcaClass | Aca11Class | null | undefined): value is AcaClass => {
  return !!value && "classCode" in value;
};

const LEVEL_SEQUENCE = ["FOUND", "MMNT", "UPSTR", "SOAR", "ADV"];

const resolvePhaseDates = (cls: AcaClass): ResolvedPhases => {
  let wlDate = "";
  let srDate = "";
  let activePhase: "W-L" | "S-R" | "OTHER" = "OTHER";

  const curr = (cls.currentPhase || "").toUpperCase().trim();
  const next = (cls.nextPhase || "").toUpperCase().trim();

  // Resolve active phase
  if (curr.includes("W") || curr.includes("L")) {
    activePhase = "W-L";
  } else if (curr.includes("S") || curr.includes("R")) {
    activePhase = "S-R";
  }

  // Resolve W-L Date
  if (curr.includes("W") || curr.includes("L")) {
    wlDate = cls.phaseStartDate || cls.openDate || "";
  } else if (next.includes("W") || next.includes("L")) {
    wlDate = cls.nextPhaseStartDate || "";
  }

  // Resolve S-R Date
  if (curr.includes("S") || curr.includes("R")) {
    srDate = cls.phaseStartDate || "";
  } else if (next.includes("S") || next.includes("R")) {
    srDate = cls.nextPhaseStartDate || "";
  }

  // Fallbacks if empty
  if (!wlDate && cls.openDate) {
    wlDate = cls.openDate;
  }
  if (!srDate && wlDate) {
    // Calculate rolling date after wlDate
    const parts = wlDate.split("/");
    if (parts.length === 3) {
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const y = parseInt(parts[2], 10);
      const date = new Date(y, m, d);
      if (!isNaN(date.getTime())) {
        const offsetDays = getPhaseDurationDays(cls.name, cls.classCode, cls.phaseDurationDays);
        date.setDate(date.getDate() + offsetDays);
        const schedule = parseClassSchedule(cls.name, cls.classCode);
        const adjusted = adjustToClassDay(date, schedule.days);
        const dd = String(adjusted.getDate()).padStart(2, "0");
        const mm = String(adjusted.getMonth() + 1).padStart(2, "0");
        const yyyy = adjusted.getFullYear();
        srDate = `${dd}/${mm}/${yyyy}`;
      }
    }
  }

  // If still empty
  if (!wlDate) wlDate = "Chưa xếp";
  if (!srDate) srDate = "Chưa xếp";

  return { wlDate, srDate, activePhase };
};

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

const handleDateIconClick = (e: React.MouseEvent<HTMLButtonElement>) => {
  const container = e.currentTarget.parentElement;
  const dateInput = container?.querySelector('input[type="date"]') as HTMLInputElement;
  if (dateInput) {
    if (typeof dateInput.showPicker === 'function') {
      dateInput.showPicker();
    } else {
      dateInput.focus();
      dateInput.click();
    }
  }
};

const getClassPhaseIndex = (classCode: string): number => {
  if (!classCode) return 0;
  const upper = classCode.toUpperCase();
  if (upper.includes("-C2-") || upper.includes("C2")) return 1;
  if (upper.includes("-C3-") || upper.includes("C3")) return 2;
  return 0;
};

const getPhaseDurationDays = (name: string, code: string, customDuration?: number): number => {
  if (customDuration !== undefined && customDuration > 0) {
    return customDuration;
  }
  const nameUpper = (name || "").toUpperCase();
  const codeUpper = (code || "").toUpperCase();
  
  if (nameUpper.includes("FOU") || nameUpper.includes("FOUND") || codeUpper.includes("FOU") || codeUpper.includes("FOUND")) {
    return 105; // 3.5 months
  }
  if (nameUpper.includes("PRE CORE") || nameUpper.includes("PCORE") || nameUpper.includes("PRECORE") || 
      nameUpper.includes("PRE IELTS") || nameUpper.includes("PREIELTS") || nameUpper.includes("CORE") ||
      codeUpper.includes("PRE CORE") || codeUpper.includes("PCORE") || codeUpper.includes("PRECORE") || 
      codeUpper.includes("PRE IELTS") || codeUpper.includes("PREIELTS") || codeUpper.includes("CORE") ||
      codeUpper.startsWith("PC")) {
    return 60; // 2 months
  }
  // 42 days = exactly 6 weeks. Since 42 is a multiple of 7, adding 42 days to any
  // class start date always lands on the SAME day of the week — so chặng kế will
  // always be on the correct class day (e.g. Thứ Ba stays Thứ Ba) without any
  // extra snap adjustment needed. Previously 45 days caused a 3-day drift.
  return 42; // 6 weeks (1.5 months)
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

const parseStartDates = (startDateStr: string): string[] => {
  if (!startDateStr) return [];
  return startDateStr.split(/\s*•\s*/).map(s => s.trim());
};

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

const isStudentFinishedClass = (st: AcaStudent, classCode: string): boolean => {
  if (!classCode) return false;
  const cyclesForClass = st.cycles?.filter((cyc) => classCodesMatch(cyc.classCode, classCode)) || [];
  const lFields: { code: string; score: string }[] = [];
  if (classCodesMatch(st.l1, classCode)) lFields.push({ code: st.l1!, score: st.f1 || "" });
  if (classCodesMatch(st.l2, classCode)) lFields.push({ code: st.l2!, score: st.f2 || "" });
  if (classCodesMatch(st.l3, classCode)) lFields.push({ code: st.l3!, score: st.f3 || "" });
  
  let completedCount = 0;
  let hasUnfinished = false;

  if (cyclesForClass.length > 0) {
    completedCount = cyclesForClass.filter((cyc) => hasRecordedScore(cyc.finalScore)).length;
    hasUnfinished = cyclesForClass.some((cyc) => !hasRecordedScore(cyc.finalScore));
  } else if (lFields.length > 0) {
    completedCount = lFields.filter((lf) => hasRecordedScore(lf.score)).length;
    hasUnfinished = lFields.some((lf) => !hasRecordedScore(lf.score));
  }

  const codeUpper = classCode.toUpperCase();
  const isFoundation = codeUpper.includes("FOU") || codeUpper.includes("FOUND");
  const requiredPhases = isFoundation ? 1 : 2;

  return completedCount >= requiredPhases && !hasUnfinished;
};



const adjustToClassDay = (date: Date, classDays: number[]) => {
  if (classDays.length === 0) return date;
  const result = new Date(date.getTime());
  for (let i = 0; i < 7; i++) {
    if (classDays.includes(result.getDay())) {
      return result;
    }
    result.setDate(result.getDate() + 1);
  }
  return date;
};

interface ProjectedEvent {
  dateStr: string;
  type: "open" | "wl" | "sr";
  label: string;
  day: number;
}

const getProjectedEventsForMonth = (
  cls: AcaClass,
  targetMonth: number,
  targetYear: number,
  stopAt?: Date // if set, do not generate events on or after this date
): ProjectedEvent[] => {
  const events: ProjectedEvent[] = [];
  
  const parseDate = (dStr: string): Date | null => {
    if (!dStr || dStr === "Chưa xếp" || dStr === "-") return null;
    const parts = dStr.split("/");
    if (parts.length !== 3) return null;
    const d = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const y = parseInt(parts[2], 10);
    const date = new Date(y, m, d);
    return isNaN(date.getTime()) ? null : date;
  };

  const nameUpper = (cls.name || "").toUpperCase();
  const codeUpper = (cls.classCode || "").toUpperCase();

  const isFoundation = nameUpper.includes("FOU") || nameUpper.includes("FOUND") || codeUpper.includes("FOU") || codeUpper.includes("FOUND");
  const isPreCore = nameUpper.includes("PRE CORE") || nameUpper.includes("PCORE") || nameUpper.includes("PRECORE") || 
                    nameUpper.includes("PRE IELTS") || nameUpper.includes("PREIELTS") || nameUpper.includes("CORE") ||
                    codeUpper.includes("PRE CORE") || codeUpper.includes("PCORE") || codeUpper.includes("PRECORE") || 
                    codeUpper.includes("PRE IELTS") || codeUpper.includes("PREIELTS") || codeUpper.includes("CORE");

  // 1. Foundation: No phases, only show opening event
  if (isFoundation) {
    const dOpen = parseDate(cls.openDate);
    if (dOpen && dOpen.getFullYear() === targetYear && (dOpen.getMonth() + 1) === targetMonth) {
      events.push({
        dateStr: cls.openDate,
        type: "open",
        label: `KG: ${displayClassCode(cls.classCode) || cls.name}`,
        day: dOpen.getDate()
      });
    }
    return events;
  }

  // 2. PreCore: Has specific phase starts but no infinite rollover
  if (isPreCore) {
    const dOpen = parseDate(cls.openDate);
    const dCurr = parseDate(cls.phaseStartDate);
    const dNext = parseDate(cls.nextPhaseStartDate);
    
    if (dOpen && dOpen.getFullYear() === targetYear && (dOpen.getMonth() + 1) === targetMonth) {
      events.push({
        dateStr: cls.openDate,
        type: "open",
        label: `KG: ${displayClassCode(cls.classCode) || cls.name}`,
        day: dOpen.getDate()
      });
    }
    if (dCurr && cls.currentPhase && cls.currentPhase !== "-" && cls.currentPhase !== "") {
      if (dCurr.getFullYear() === targetYear && (dCurr.getMonth() + 1) === targetMonth) {
        const isSR = (cls.currentPhase || "").toUpperCase().includes("CORE");
        events.push({
          dateStr: cls.phaseStartDate,
          type: isSR ? "sr" : "wl",
          label: `${cls.currentPhase}: ${displayClassCode(cls.classCode) || cls.name}`,
          day: dCurr.getDate()
        });
      }
    }
    if (dNext && cls.nextPhase && cls.nextPhase !== "-" && cls.nextPhase !== "") {
      if (dNext.getFullYear() === targetYear && (dNext.getMonth() + 1) === targetMonth) {
        const isSR = (cls.nextPhase || "").toUpperCase().includes("CORE");
        events.push({
          dateStr: cls.nextPhaseStartDate,
          type: isSR ? "sr" : "wl",
          label: `${cls.nextPhase}: ${displayClassCode(cls.classCode) || cls.name}`,
          day: dNext.getDate()
        });
      }
    }
    return events;
  }

  // 3. Regular Rolling classes: alternates W-L and S-R every 45 days infinitely
  const dOpen = parseDate(cls.openDate);
  const dCurr = parseDate(cls.phaseStartDate);
  const dNext = parseDate(cls.nextPhaseStartDate);

  const schedule = parseClassSchedule(cls.name, cls.classCode);
  const classDays = schedule.days;

  // Fix: targetEnd = last ms of last day of the target month
  const targetEnd = new Date(targetYear, targetMonth - 1 + 1, 0, 23, 59, 59);

  // Find the best anchor: the LATEST known phase date that is still <= targetEnd
  // We prefer the most recent anchor so projections are accurate.
  let baseDate: Date | null = null;
  let basePhaseType: "open" | "wl" | "sr" = "open";

  // Start from the earliest known point (openDate) and walk forward to find
  // the anchor closest-but-not-past targetEnd.
  if (dOpen) {
    baseDate = dOpen;
    basePhaseType = "open";
  }

  // If phaseStartDate is defined and not in the future past target, prefer it
  if (dCurr && dCurr <= targetEnd) {
    // Only override openDate if phaseStartDate is more recent
    if (!baseDate || dCurr >= baseDate) {
      baseDate = dCurr;
      const currPhaseLower = (cls.currentPhase || "").toLowerCase();
      basePhaseType = (currPhaseLower.includes("w") || currPhaseLower.includes("l")) ? "wl" : "sr";
    }
  }

  // If nextPhaseStartDate is defined and not in the future past target, prefer it
  if (dNext && dNext <= targetEnd) {
    if (!baseDate || dNext >= baseDate) {
      baseDate = dNext;
      const nextPhaseLower = (cls.nextPhase || "").toLowerCase();
      basePhaseType = (nextPhaseLower.includes("w") || nextPhaseLower.includes("l")) ? "wl" : "sr";
    }
  }

  if (!baseDate) return events;

  // Determine the phase identity of step 0 so we can alternate correctly
  let step0isWL = false; // if false -> step 0 is S-R (or open)
  if (basePhaseType === "wl") {
    step0isWL = true;
  } else if (basePhaseType === "open") {
    // Determine which phase the class opens with
    const firstPhaseIsWL = !(cls.currentPhase && (cls.currentPhase.toUpperCase().includes("S") || cls.currentPhase.toUpperCase().includes("R")));
    step0isWL = firstPhaseIsWL;
  }

  let currentDate = new Date(baseDate.getTime());
  currentDate = adjustToClassDay(currentDate, classDays);

  let step = 0;
  const maxSteps = 150;

  while (step < maxSteps) {
    if (stopAt && currentDate >= stopAt) {
      break;
    }
    if (currentDate > targetEnd) {
      break;
    }

    if (
      currentDate.getFullYear() === targetYear &&
      (currentDate.getMonth() + 1) === targetMonth
    ) {
      const day = currentDate.getDate();
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();
      const dateStr = `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;

      if (step === 0 && basePhaseType === "open") {
        events.push({
          dateStr,
          type: "open",
          label: `KG: ${displayClassCode(cls.classCode) || cls.name}`,
          day
        });
      } else {
        // Alternate: step 0 phase is known, each +1 step flips phase
        // step 0 = basePhaseType (unless open), step 1 = opposite, step 2 = same as 0...
        const effectiveStep = basePhaseType === "open" ? step - 1 : step;
        const isWL = effectiveStep < 0 ? step0isWL : (step0isWL ? (effectiveStep % 2 === 0) : (effectiveStep % 2 !== 0));
        events.push({
          dateStr,
          type: isWL ? "wl" : "sr",
          label: isWL ? `W-L: ${displayClassCode(cls.classCode) || cls.name}` : `S-R: ${displayClassCode(cls.classCode) || cls.name}`,
          day
        });
      }
    }

    let nextDate = new Date(currentDate.getTime());
    const offsetDays = getPhaseDurationDays(cls.name, cls.classCode, cls.phaseDurationDays);
    nextDate.setDate(nextDate.getDate() + offsetDays);
    currentDate = adjustToClassDay(nextDate, classDays);
    step++;
  }

  return events;
};

interface ProjectedPhase {
  phaseName: string;
  startDateStr: string;
  phaseIndex: number;
  isCurrent: boolean;
}

const getProjectedPhasesForYear = (
  cls: AcaClass,
  selectedYear: number
): ProjectedPhase[] => {
  const parseDate = (dStr: string): Date | null => {
    if (!dStr || dStr === "Chưa xếp" || dStr === "-") return null;
    const parts = dStr.split("/");
    if (parts.length !== 3) return null;
    const d = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const y = parseInt(parts[2], 10);
    const date = new Date(y, m, d);
    return isNaN(date.getTime()) ? null : date;
  };

  const formatDDMMYYYY = (date: Date): string => {
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    return `${dd}/${mm}/${date.getFullYear()}`;
  };

  const nameUpper = (cls.name || "").toUpperCase();
  const codeUpper = (cls.classCode || "").toUpperCase();
  const isFoundation = nameUpper.includes("FOU") || nameUpper.includes("FOUND") || codeUpper.includes("FOU") || codeUpper.includes("FOUND");
  const isPreCore = nameUpper.includes("PRE CORE") || nameUpper.includes("PCORE") || nameUpper.includes("PRECORE") || 
                    nameUpper.includes("PRE IELTS") || nameUpper.includes("PREIELTS") || nameUpper.includes("CORE") ||
                    codeUpper.includes("PRE CORE") || codeUpper.includes("PCORE") || codeUpper.includes("PRECORE") || 
                    codeUpper.includes("PRE IELTS") || codeUpper.includes("PREIELTS") || codeUpper.includes("CORE");

  const dOpen = parseDate(cls.openDate);
  if (!dOpen) return [];

  const phases: ProjectedPhase[] = [];

  // 1. Foundation: Only 1 phase
  if (isFoundation) {
    phases.push({
      phaseName: "Foundation",
      startDateStr: cls.openDate,
      phaseIndex: 0,
      isCurrent: true
    });
    return phases;
  }

  // 2. PreCore: Specific L1/L2 phases
  if (isPreCore) {
    phases.push({
      phaseName: cls.currentPhase || "S-R",
      startDateStr: cls.phaseStartDate || cls.openDate,
      phaseIndex: 0,
      isCurrent: (cls.currentPhase || "").toUpperCase().includes("CORE") || !(cls.nextPhase || "").toUpperCase().includes("CORE")
    });
    if (cls.nextPhase && cls.nextPhase !== "-") {
      phases.push({
        phaseName: cls.nextPhase,
        startDateStr: cls.nextPhaseStartDate || "",
        phaseIndex: 1,
        isCurrent: !phases[0].isCurrent
      });
    }
    return phases;
  }

  // 3. Regular rolling class
  const firstPhaseIsWL = !(cls.currentPhase && (cls.currentPhase.toUpperCase().includes("S") || cls.currentPhase.toUpperCase().includes("R")));
  const step0isWL = firstPhaseIsWL;

  const schedule = parseClassSchedule(cls.name, cls.classCode);
  const classDays = schedule.days;

  let currentDate = new Date(dOpen.getTime());
  currentDate = adjustToClassDay(currentDate, classDays);

  const targetEnd = new Date(selectedYear, 11, 31, 23, 59, 59);

  let step = 0;
  while (currentDate <= targetEnd && step < 100) {
    const isWL = step % 2 === 0 ? step0isWL : !step0isWL;
    const phaseName = isWL ? "W-L" : "S-R";
    const startDateStr = formatDDMMYYYY(currentDate);

    phases.push({
      phaseName,
      startDateStr,
      phaseIndex: step,
      isCurrent: false
    });

    const nextDate = new Date(currentDate.getTime());
    const offsetDays = getPhaseDurationDays(cls.name, cls.classCode, cls.phaseDurationDays);
    nextDate.setDate(nextDate.getDate() + offsetDays);
    currentDate = adjustToClassDay(nextDate, classDays);
    step++;
  }

  // Dynamic today-based check to identify the current running phase
  if (phases.length > 0) {
    const today = new Date();
    const todayTime = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

    const mapped = phases.map((p) => {
      const d = parseDate(p.startDateStr) || new Date(2000, 0, 1);
      return {
        phase: p,
        time: new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
      };
    }).sort((a, b) => a.time - b.time);

    let activeIndex = 0;
    // Find if today falls inside any phase's interval
    let foundToday = false;
    for (let i = 0; i < mapped.length; i++) {
      const start = mapped[i].time;
      const end = i < mapped.length - 1 ? mapped[i + 1].time : Infinity;
      if (todayTime >= start && todayTime < end) {
        activeIndex = mapped[i].phase.phaseIndex;
        foundToday = true;
        break;
      }
    }

    // If today is before the first phase or after the last, fall back to matching class's phaseStartDate or currentPhase
    if (!foundToday) {
      const currName = (cls.currentPhase || "").toUpperCase();
      const matchByName = phases.find(p => p.phaseName.toUpperCase() === currName);
      if (matchByName) {
        activeIndex = matchByName.phaseIndex;
      } else {
        activeIndex = phases[0].phaseIndex;
      }
    }

    phases.forEach((p) => {
      p.isCurrent = p.phaseIndex === activeIndex;
    });
  }

  return phases;
};

const isStudentInPhase = (
  st: AcaStudent,
  pIndex: number,
  isCurrent: boolean,
  classCode: string
): boolean => {
  if (!classCode) return false;
  
  const classCycles = st.cycles || [];
  const matchesCycle = (classCycles.length > 0 && classCodesMatch(classCycles[pIndex]?.classCode, classCode)) ||
                       (pIndex === 0 && classCodesMatch(st.l1, classCode)) ||
                       (pIndex === 1 && classCodesMatch(st.l2, classCode)) ||
                       (pIndex === 2 && classCodesMatch(st.l3, classCode));
                       
  if (matchesCycle) return true;
  
  if (isCurrent && !isStudentFinishedClass(st, classCode)) {
    return true;
  }
  
  return false;
};

const isRecruitedForNextPhase = (st: AcaStudent, c: AcaClass, selectedYear: number): boolean => {
  if (st.classId !== c.id) return false;
  if (isStudentFinishedClass(st, c.classCode)) return false;
  
  const cls = (st.classification || "").trim();
  const isLopLeMoi = cls === "Lớp lẻ mới" || cls.toLowerCase().includes("mới") || cls.toLowerCase().includes("tuyển") || cls.toLowerCase().includes("học bổng") || cls.toLowerCase().includes("new");
  const isCombo = cls === "Combo" || cls.toLowerCase().includes("combo");
  if (!isLopLeMoi && !isCombo) return false;
  
  const projected = getProjectedPhasesForYear(c, selectedYear);
  const currentPhase = projected.find(p => p.isCurrent);
  if (!currentPhase) return false;
  
  const nextPhaseIndex = currentPhase.phaseIndex + 1;
  const classCycles = st.cycles || [];
  const matchesNextCycle = (classCycles.length > 0 && classCodesMatch(classCycles[nextPhaseIndex]?.classCode, c.classCode)) ||
                           (nextPhaseIndex === 0 && classCodesMatch(st.l1, c.classCode)) ||
                           (nextPhaseIndex === 1 && classCodesMatch(st.l2, c.classCode)) ||
                           (nextPhaseIndex === 2 && classCodesMatch(st.l3, c.classCode));
  return matchesNextCycle;
};

const getDefaultSlotsToEnroll = (className: string): number => {
  const name = className.toLowerCase();
  if (
    name.includes("upstream") ||
    name.includes("soar") ||
    name.includes("precore") ||
    name.includes("pre core") ||
    (name.includes("core") && !name.includes("precore") && !name.includes("pre core"))
  ) {
    return 12;
  }
  if (
    name.includes("momentum") ||
    name.includes("advanced") ||
    name.includes("foundation")
  ) {
    return 10;
  }
  return 0;
};

const getDefaultSlotsToEnrollFromCode = (classCode: string): number => {
  if (!classCode) return 0;
  const firstChar = classCode.trim().charAt(0).toUpperCase();
  if (firstChar === "U" || firstChar === "S" || firstChar === "C") {
    return 12;
  }
  if (firstChar === "M" || firstChar === "A" || firstChar === "F") {
    return 10;
  }
  return 0;
};

export default function LopTheoThangPage() {
  const [ready, setReady] = useState(false);
  const [isKhanhThi, setIsKhanhThi] = useState(false);

  useEffect(() => {
    const user = getCachedAuthUser();
    const name = (user?.name || "").trim().toLowerCase();
    const email = (user?.email || "").trim().toLowerCase();
    
    setIsKhanhThi(
      name === "lê nguyễn khánh thi" ||
        name === "aca_1" ||
        name === "aca 1" ||
        email === "aca@xaloenglish.vn" ||
        email === "aca_1@gmail.com",
    );
    setReady(true);
  }, []);

  const NOW_Y = new Date().getFullYear();
  const NOW_M = new Date().getMonth() + 1;
  const [selectedYear, setSelectedYear] = useState<number>(NOW_Y);
  const [selectedMonth, setSelectedMonth] = useState<number>(NOW_M);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    if (ready && isKhanhThi) {
      setCurrentPage(1);
    }
  }, [selectedMonth, selectedYear, ready, isKhanhThi]);

  const [activeTab, setActiveTab] = useState<"calendar" | "list">("calendar");
  const [selectedClass, setSelectedClass] = useState<AcaClass | Aca11Class | null>(null);
  const [showHistoryInTimeline, setShowHistoryInTimeline] = useState(false);
  // Context of the clicked calendar event (which phase/date in the target month was selected)
  const [selectedEventContext, setSelectedEventContext] = useState<{
    phaseType: "open" | "wl" | "sr";
    dateStr: string;
    nextPhaseType: "wl" | "sr";
    nextDateStr: string;
  } | null>(null);
  
  const [selectedPhaseIndex, setSelectedPhaseIndex] = useState<number | null>(null);

  useEffect(() => {
    if (ready && isKhanhThi) {
      setShowHistoryInTimeline(false);
      if (selectedClass && !("className" in selectedClass)) {
        const projected = getProjectedPhasesForYear(selectedClass as AcaClass, selectedYear);
        const active = projected.find(p => p.isCurrent);
        if (active) {
          setSelectedPhaseIndex(active.phaseIndex);
        } else {
          setSelectedPhaseIndex(0);
        }
      } else {
        setSelectedPhaseIndex(null);
      }
    }
  }, [selectedClass, selectedYear, ready, isKhanhThi]);

  const [classes, setClasses] = useState<AcaClass[]>([]);
  const [classes11, setClasses11] = useState<Aca11Class[]>([]);
  const [students, setStudents] = useState<AcaStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Derive available years from loaded class data + current + next year
  const availableYears = useMemo(() => {
    const yearSet = new Set<number>([NOW_Y, NOW_Y + 1]);
    classes.forEach((c) => {
      if (c.openDate) {
        const parts = c.openDate.split("/");
        if (parts.length === 3) yearSet.add(parseInt(parts[2], 10));
      }
      if (c.phaseStartDate) {
        const parts = c.phaseStartDate.split("/");
        if (parts.length === 3) yearSet.add(parseInt(parts[2], 10));
      }
    });
    classes11.forEach((c) => {
      const startDates = parseStartDates(c.startDate);
      startDates.forEach((sd) => {
        const parts = sd.split("/");
        if (parts.length === 3) yearSet.add(parseInt(parts[2], 10));
      });
    });
    return Array.from(yearSet).filter(y => !isNaN(y) && y >= 2024).sort((a, b) => a - b);
  }, [classes, classes11]);

  // CRUD modal state
  const [isCrudModalOpen, setIsCrudModalOpen] = useState(false);
  const [crudMode, setCrudMode] = useState<"add" | "edit">("add");
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  // CRUD form fields
  const [fClassCode, setFClassCode] = useState("");
  const [fName, setFName] = useState("");
  const [fMonth, setFMonth] = useState<number>(selectedMonth);
  const [fType, setFType] = useState("Lớp đang diễn ra");
  const [fOpenDate, setFOpenDate] = useState("");
  const [fEndDate, setFEndDate] = useState("");
  const [fTeacher, setFTeacher] = useState("");
  const [fCurrentPhase, setFCurrentPhase] = useState("");
  const [fPhaseStartDate, setFPhaseStartDate] = useState("");
  const [fPhaseStudents, setFPhaseStudents] = useState(0);
  const [fNextPhaseStartDate, setFNextPhaseStartDate] = useState("");
  const [fNextPhase, setFNextPhase] = useState("");
  const [fSlotsToEnroll, setFSlotsToEnroll] = useState(0);
  const [fProgressNote, setFProgressNote] = useState("");
  const [fOpenDateHistory, setFOpenDateHistory] = useState<string[]>([]);

  useEffect(() => {
    if (!ready || !isKhanhThi) return;
    async function loadData() {
      try {
        if (!canUseAcaApi()) {
          setLoadError("Chưa có phiên đăng nhập ACA hoặc API chưa sẵn sàng.");
          setClasses([]);
          setClasses11([]);
          setStudents([]);
          return;
        }
        const [clsData, stData] = await Promise.all([
          fetchAcaClasses(),
          fetchAcaStudents(),
        ]);
        setClasses(clsData);
        setClasses11([]);
        setStudents(stData);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Không tải được dữ liệu lớp.";
        setLoadError(message);
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [ready, isKhanhThi]);

  // Open add class modal
  const openAddModal = () => {
    setCrudMode("add");
    setEditingClassId(null);
    setFClassCode("");
    setFName("");
    setFMonth(selectedMonth);
    setFType("Lớp đang diễn ra");
    setFOpenDate("");
    setFEndDate("");
    setFTeacher("");
    setFCurrentPhase("");
    setFPhaseStartDate("");
    setFPhaseStudents(0);
    setFNextPhaseStartDate("");
    setFNextPhase("");
    setFSlotsToEnroll(0);
    setFProgressNote("");
    setFOpenDateHistory([]);
    setIsCrudModalOpen(true);
  };

  // Open edit class modal
  const openEditModal = (cls: AcaClass) => {
    setCrudMode("edit");
    setEditingClassId(cls.id);
    setFClassCode(cls.classCode || "");
    setFName(cls.name);
    setFMonth(cls.month);
    setFType(cls.type);
    setFOpenDate(cls.openDate);
    setFEndDate(cls.endDate || "");
    setFTeacher(cls.teacher);
    setFCurrentPhase(cls.currentPhase);
    setFPhaseStartDate(cls.phaseStartDate);
    setFPhaseStudents(cls.phaseStudents);
    setFNextPhaseStartDate(cls.nextPhaseStartDate);
    setFNextPhase(cls.nextPhase);
    setFSlotsToEnroll(cls.slotsToEnroll);
    setFProgressNote(cls.progressNote || "");
    setFOpenDateHistory(cls.openDateHistory || []);
    setIsCrudModalOpen(true);
  };

  const handleOpenDateChange = (val: string) => {
    // In edit mode: if the current openDate is non-empty and different from the new value,
    // push the old openDate into history before replacing it.
    if (crudMode === "edit" && fOpenDate.trim() && fOpenDate.trim() !== val.trim()) {
      setFOpenDateHistory(prev => {
        const already = prev.includes(fOpenDate.trim());
        return already ? prev : [...prev, fOpenDate.trim()];
      });
    }

    setFOpenDate(val);

    // Only auto-calculate phase/end dates in ADD mode.
    // In EDIT mode the existing phaseStartDate and nextPhaseStartDate are kept as-is.
    if (crudMode === "add") {
      const openD = parseDDMMYYYY(val);
      if (openD) {
        const offsetDays = getPhaseDurationDays(fName, fClassCode);
        const pIndex = getClassPhaseIndex(fClassCode);
        const daysOffset = pIndex * offsetDays;
        const sched = parseClassSchedule(fName, fClassCode);
        const targetPhaseStart = new Date(openD.getTime());
        targetPhaseStart.setDate(targetPhaseStart.getDate() + daysOffset);
        const adjustedPhaseStart = adjustToClassDay(targetPhaseStart, sched.days);
        setFPhaseStartDate(formatDDMMYYYY(adjustedPhaseStart));
        const targetNextPhaseStart = new Date(adjustedPhaseStart.getTime());
        targetNextPhaseStart.setDate(targetNextPhaseStart.getDate() + offsetDays);
        const adjustedNextPhaseStart = adjustToClassDay(targetNextPhaseStart, sched.days);
        setFNextPhaseStartDate(formatDDMMYYYY(adjustedNextPhaseStart));
        const nameUpper = fName.toUpperCase();
        const codeUpper = fClassCode.toUpperCase();
        const isFoundation = nameUpper.includes("FOU") || nameUpper.includes("FOUND") || codeUpper.includes("FOU") || codeUpper.includes("FOUND");
        const isPreCore = nameUpper.includes("PRE CORE") || nameUpper.includes("PCORE") || nameUpper.includes("PRECORE") ||
                          nameUpper.includes("PRE IELTS") || nameUpper.includes("PREIELTS") || nameUpper.includes("CORE") ||
                          codeUpper.includes("PRE CORE") || codeUpper.includes("PCORE") || codeUpper.includes("PRECORE") ||
                          codeUpper.includes("PRE IELTS") || codeUpper.includes("PREIELTS") || codeUpper.includes("CORE") ||
                          codeUpper.startsWith("PC");
        const totalDays = isFoundation ? 105 : (isPreCore ? 120 : 90);
        const endD = new Date(openD.getTime());
        endD.setDate(endD.getDate() + totalDays);
        setFEndDate(formatDDMMYYYY(endD));
      }
    }
  };

  // Submit class CRUD
  const handleCrudSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      classCode: fClassCode.trim().toUpperCase(),
      name: fName.trim(),
      month: fMonth,
      type: fType,
      openDate: fOpenDate.trim(),
      openDateHistory: fOpenDateHistory.length > 0 ? fOpenDateHistory : undefined,
      endDate: fEndDate.trim(),
      teacher: fTeacher.trim(),
      currentPhase: fCurrentPhase.trim(),
      phaseStartDate: fPhaseStartDate.trim(),
      phaseStudents: fPhaseStudents,
      nextPhaseStartDate: fNextPhaseStartDate.trim(),
      nextPhase: fNextPhase.trim(),
      slotsToEnroll: fSlotsToEnroll,
      progressNote: fProgressNote.trim(),
    };
    try {
      if (crudMode === "add") {
        await createAcaClass(payload);
      } else if (crudMode === "edit" && editingClassId) {
        await updateAcaClass(editingClassId, payload);
      }
      const updatedClasses = await fetchAcaClasses();
      setClasses(updatedClasses);
      setIsCrudModalOpen(false);
    } catch (err: any) {
      alert("Lưu thất bại: " + err.message);
    }
  };

  const calculateNextPhaseDate = (startDateStr: string, name: string) => {
    if (!startDateStr) return "";
    const parts = startDateStr.split("/");
    if (parts.length !== 3) return "";
    const d = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const y = parseInt(parts[2], 10);
    const date = new Date(y, m, d);
    if (isNaN(date.getTime())) return "";
    const offsetDays = getPhaseDurationDays(
      name,
      fClassCode,
      isAcaClass(selectedClass) ? selectedClass.phaseDurationDays : undefined,
    );
    date.setDate(date.getDate() + offsetDays);
    const schedule = parseClassSchedule(name, fClassCode);
    const adjusted = adjustToClassDay(date, schedule.days);
    const dd = String(adjusted.getDate()).padStart(2, "0");
    const mm = String(adjusted.getMonth() + 1).padStart(2, "0");
    return `${dd}/${mm}/${adjusted.getFullYear()}`;
  };

  const handleTransitionToNextPhase = () => {
    const newCurrent = fNextPhase || "";
    const newStartDate = fNextPhaseStartDate || "";
    
    let newNext = "";
    if (newCurrent.toUpperCase().includes("W") || newCurrent.toUpperCase().includes("L")) {
      newNext = "S-R";
    } else if (newCurrent.toUpperCase().includes("S") || newCurrent.toUpperCase().includes("R")) {
      newNext = "W-L";
    }

    const newNextDate = calculateNextPhaseDate(newStartDate, fName);

    // Calculate continuing and recruited students count for the next phase
    const classSts = students.filter(st => st.classId === editingClassId);
    const mockClass: AcaClass = {
      id: editingClassId || "",
      classCode: fClassCode,
      currentPhase: fCurrentPhase,
      nextPhase: fNextPhase,
    } as any;

    const continuingCount = classSts.filter(st => {
      const isCombo = (st.classification || "").toLowerCase().includes("combo");
      return isCombo && !isStudentFinishedClass(st, fClassCode);
    }).length;

    const recruitedCount = classSts.filter(st => isRecruitedForNextPhase(st, mockClass, selectedYear)).length;
    const newPhaseStudents = continuingCount + recruitedCount;

    setFCurrentPhase(newCurrent);
    setFPhaseStartDate(newStartDate);
    setFPhaseStudents(newPhaseStudents);
    setFNextPhase(newNext);
    setFNextPhaseStartDate(newNextDate);
    setFSlotsToEnroll(0); // Reset slots to enroll for the new phase
  };

  // Delete class
  const handleDeleteClass = async (id: string) => {
    if (confirm("Xóa lớp này? Hành động không thể hoàn tác.")) {
      try {
        await deleteAcaClass(id);
        setClasses((prev) => prev.filter((c) => c.id !== id));
      } catch (err: any) {
        alert("Xóa thất bại: " + err.message);
      }
    }
  };

  // Compute successor stop dates: if KHAI-5 exists and KHAI-6 also exists,
  // KHAI-5 should stop rolling at KHAI-6's start date.
  const stopAtMap = useMemo(() => {
    const map = new Map<string, Date>();
    classes.forEach((c) => {
      if (!c.classCode) return;
      const base = displayClassCode(c.classCode);
      const predecessor = classes.find(
        (other) =>
          other.classCode &&
          displayClassCode(other.classCode) === base &&
          other.month === c.month - 1
      );
      if (predecessor) {
        const cStart = c.phaseStartDate || c.openDate;
        if (cStart) {
          const parts = cStart.split("/");
          if (parts.length === 3) {
            const sd = parseInt(parts[0], 10);
            const sm = parseInt(parts[1], 10) - 1;
            const sy = parseInt(parts[2], 10);
            const stopDate = new Date(sy, sm, sd);
            if (!isNaN(stopDate.getTime())) {
              map.set(predecessor.id, stopDate);
            }
          }
        }
      }
    });
    return map;
  }, [classes]);

  const filteredClasses = useMemo(() => {
    return classes.filter((c) => {
      // 1. Strict month match
      if (c.month === selectedMonth) return true;
      
      // 2. Has projected events in the target month/year
      const stopAt = stopAtMap.get(c.id) || undefined;
      const events = getProjectedEventsForMonth(c, selectedMonth, selectedYear, stopAt);
      if (events.length > 0) return true;
      
      // 3. Or if it's "Đang diễn ra" and selected date falls within the class duration
      const openParts = c.openDate?.split("/");
      if (openParts && openParts.length === 3) {
        const openD = parseInt(openParts[0], 10);
        const openM = parseInt(openParts[1], 10);
        const openY = parseInt(openParts[2], 10);
        
        const start = new Date(openY, openM - 1, 1);
        const target = new Date(selectedYear, selectedMonth - 1, 1);
        
        if (target >= start) {
          if (c.endDate) {
            const endParts = c.endDate.split("/");
            if (endParts.length === 3) {
              const endD = parseInt(endParts[0], 10);
              const endM = parseInt(endParts[1], 10);
              const endY = parseInt(endParts[2], 10);
              const end = new Date(endY, endM - 1, 28); // rough end of month
              return target <= end;
            }
          }
          // If no end date and class is ongoing/active, it is still running
          return c.type === "Lớp đang diễn ra" || c.type === "Lớp mới";
        }
      }
      
      return false;
    });
  }, [classes, selectedMonth, selectedYear]);

  const totalPages = Math.ceil(filteredClasses.length / ITEMS_PER_PAGE);

  const paginatedClasses = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredClasses.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredClasses, currentPage]);

  // Helper helper function to compare dates in dd/mm/yyyy format
  const isSameDay = useCallback((dateStr: string, day: number, month: number, year: number = 2026) => {
    if (!dateStr) return false;
    const parts = dateStr.split("/");
    if (parts.length !== 3) return false;
    const d = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const y = parseInt(parts[2], 10);
    return d === day && m === month && y === year;
  }, []);

  interface DayEvent {
    classId: string;
    className: string;
    classCode: string;
    type: "open" | "wl" | "sr" | "open11" | "end11";
    label: string;
    is11: boolean;
    teacher?: string;
    dateStr?: string; // full dd/mm/yyyy for this event
  }

  // Dynamic calendar calculator populated with start date events
  const calendarDays = useMemo(() => {
    const year = selectedYear;
    const monthIndex = selectedMonth - 1; // 5 -> index 4, 6 -> index 5
    
    const firstDay = new Date(year, monthIndex, 1);
    const totalDays = new Date(year, monthIndex + 1, 0).getDate();
    
    // Sunday is 0, Monday is 1, ..., Saturday is 6
    const startDayOfWeek = firstDay.getDay(); 
    
    const days: { day: number | null; events: DayEvent[] }[] = [];
    
    // Empty blocks before the first day of the month
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({ day: null, events: [] });
    }
    
    // Populating month dates with events
    for (let d = 1; d <= totalDays; d++) {
      const dayEvents: DayEvent[] = [];
      
      // 1. Regular classes events
      // Build a map of successor start dates — reuse the shared stopAtMap memo.
      classes.forEach((c) => {
        // Ẩn lớp chưa gán GV khỏi lịch
        if (!c.teacher || c.teacher.trim() === "" || c.teacher.trim() === "Chưa gán") return;
        const stopAt = stopAtMap.get(c.id) || undefined;
        const projected = getProjectedEventsForMonth(c, selectedMonth, year, stopAt);
        projected.forEach((evt) => {
          if (evt.day === d) {
            dayEvents.push({
              classId: c.id,
              className: c.name,
              classCode: c.classCode,
              type: evt.type,
              label: `${evt.type === "open" ? "🔵" : evt.type === "wl" ? "🟢" : "🟣"} ${evt.label} (GV: ${c.teacher || "Chưa gán"})`,
              is11: false,
              teacher: c.teacher || "Chưa gán",
              dateStr: evt.dateStr,
            });
          }
        });
      });
      
      // 2. 1:1 classes events
      classes11.forEach((c11) => {
        // Parse all start dates
        const startDates = parseStartDates(c11.startDate);
        startDates.forEach((sd) => {
          if (isSameDay(sd, d, selectedMonth, year)) {
            dayEvents.push({
              classId: c11.id,
              className: c11.className,
              classCode: "1:1",
              type: "open11",
              label: `🟡 1:1 KG: ${c11.className} (GV: ${c11.teacher || "Chưa gán"})`,
              is11: true,
              teacher: c11.teacher || "Chưa gán",
              dateStr: sd
            });
          }
        });

        // Parse all end dates
        const endDates = parseStartDates(c11.endDate);
        const lines = parseScheduleLines(c11.schedule);
        lines.forEach((line, lineIdx) => {
          const runStart = startDates[lineIdx];
          if (runStart) {
            const explicitEnd = endDates[lineIdx];
            const runEnd = (explicitEnd && explicitEnd.trim() !== "")
              ? explicitEnd
              : calcRunEndDate(runStart, line, c11.progress);

            if (runEnd && isSameDay(runEnd, d, selectedMonth, year)) {
              dayEvents.push({
                classId: c11.id,
                className: c11.className,
                classCode: "1:1",
                type: "end11",
                label: `🔴 1:1 KT: ${c11.className} (GV: ${c11.teacher || "Chưa gán"})`,
                is11: true,
                teacher: c11.teacher || "Chưa gán",
                dateStr: runEnd
              });
            }
          }
        });
      });
      
      days.push({ day: d, events: dayEvents });
    }
    
    return days;
  }, [selectedMonth, selectedYear, classes, classes11, isSameDay]);

  const classStudents = useMemo(() => {
    if (!selectedClass || "className" in selectedClass) return [];
    const allClassStudents = students.filter(st => st.classId === selectedClass.id);
    
    if (selectedPhaseIndex !== null) {
      const projected = getProjectedPhasesForYear(selectedClass as AcaClass, selectedYear);
      const selPhase = projected.find(p => p.phaseIndex === selectedPhaseIndex);
      const isCurrent = selPhase ? selPhase.isCurrent : false;
      
      return allClassStudents.filter(st => 
        isStudentInPhase(st, selectedPhaseIndex, isCurrent, selectedClass.classCode)
      );
    }
    
    return allClassStudents.filter(st => !isStudentFinishedClass(st, selectedClass.classCode));
  }, [selectedClass, students, selectedPhaseIndex, selectedYear]);

  const selectedClassRecruitedCount = useMemo(() => {
    if (!selectedClass || "className" in selectedClass) return 0;
    return students.filter(st => isRecruitedForNextPhase(st, selectedClass, selectedYear)).length;
  }, [selectedClass, students, selectedYear]);

  // Chronological timeline events in the selected month
  const startDatesSummary = useMemo(() => {
    const summaryList: { 
      classId: string; 
      classCode: string; 
      name: string; 
      phase: string; 
      startDate: string;
      teacher: string;
      type: "open" | "wl" | "sr" | "open11" | "end11";
      is11: boolean;
    }[] = [];

    // 1. Regular classes
    classes.forEach((c) => {
      // Ẩn lớp chưa gán GV khỏi lịch khai giảng
      if (!c.teacher || c.teacher.trim() === "" || c.teacher.trim() === "Chưa gán") return;
      const stopAt = stopAtMap.get(c.id) || undefined;
      const projected = getProjectedEventsForMonth(c, selectedMonth, selectedYear, stopAt);
      projected.forEach((evt) => {
        summaryList.push({
          classId: c.id,
          classCode: c.classCode,
          name: c.name,
          phase: evt.type === "open" ? "Khai giảng lớp học" : evt.type === "wl" ? "Khai giảng chặng W-L" : "Khai giảng chặng S-R",
          startDate: evt.dateStr,
          teacher: c.teacher || "Chưa gán",
          type: evt.type,
          is11: false
        });
      });
    });

    // 2. 1:1 classes
    classes11.forEach((c11) => {
      const startDates = parseStartDates(c11.startDate);
      startDates.forEach((sd) => {
        const parts = sd.split("/");
        if (
          parts.length === 3 && 
          parseInt(parts[1], 10) === selectedMonth && 
          parseInt(parts[2], 10) === selectedYear
        ) {
          summaryList.push({
            classId: c11.id,
            classCode: "1:1",
            name: c11.className,
            phase: "Khai giảng lớp 1:1",
            startDate: sd,
            teacher: c11.teacher || "Chưa gán",
            type: "open11",
            is11: true
          });
        }
      });

      const endDates = parseStartDates(c11.endDate);
      const lines = parseScheduleLines(c11.schedule);
      lines.forEach((line, lineIdx) => {
        const runStart = startDates[lineIdx];
        if (runStart) {
          const explicitEnd = endDates[lineIdx];
          const runEnd = (explicitEnd && explicitEnd.trim() !== "")
            ? explicitEnd
            : calcRunEndDate(runStart, line, c11.progress);

          if (runEnd) {
            const parts = runEnd.split("/");
            if (
              parts.length === 3 &&
              parseInt(parts[1], 10) === selectedMonth &&
              parseInt(parts[2], 10) === selectedYear
            ) {
              summaryList.push({
                classId: c11.id,
                classCode: "1:1",
                name: c11.className,
                phase: "Dự kiến kết thúc lớp 1:1",
                startDate: runEnd,
                teacher: c11.teacher || "Chưa gán",
                type: "end11",
                is11: true
              });
            }
          }
        }
      });
    });

    // Sort chronologically (format: dd/mm/yyyy)
    return summaryList.sort((a, b) => {
      const parseDate = (dStr: string) => {
        const parts = dStr.split("/");
        if (parts.length === 3) {
          return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10)).getTime();
        }
        return 0;
      };
      return parseDate(a.startDate) - parseDate(b.startDate);
    });
  }, [classes, classes11, selectedMonth, selectedYear]);

  if (!ready) {
    return (
      <AcaLayout>
        <AcaTopbar title="Lớp theo tháng" subtitle="Đang tải quyền truy cập..." />
        <main className="mx-auto max-w-7xl px-6 py-12 md:px-8 text-center text-sm text-zinc-500">
          Đang kiểm tra quyền truy cập...
        </main>
      </AcaLayout>
    );
  }

  if (!isKhanhThi) {
    return (
      <AcaLayout>
        <AcaTopbar
          title="Không có quyền truy cập"
          subtitle="Trang web giới hạn quyền hạn truy cập của nhân viên."
        />
        <main className="mx-auto max-w-7xl px-6 py-12 md:px-8 text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-zinc-900">Quyền truy cập bị từ chối</h2>
          <p className="text-sm text-zinc-500 max-w-md mx-auto">
            Chỉ tài khoản của **Lê Nguyễn Khánh Thi** mới được quyền xem và thực hiện thao tác trên trang này.
          </p>
        </main>
      </AcaLayout>
    );
  }

  return (
    <AcaLayout>
      <AcaTopbar
        title="Danh sách & Lịch các lớp theo tháng"
        subtitle="Quản lý thời khóa biểu chi tiết, thống kê số giờ dạy dự kiến và quản lý lớp học."
      />
      <main className="mx-auto w-full px-6 py-6 pb-16 md:px-8 space-y-6">
        {loadError ? (
          <div className="rounded-2xl border border-warning/30 bg-warning/10 p-4 text-xs font-semibold text-warning">
            {loadError}
          </div>
        ) : null}
        
        {/* Month + Year Selector and Tab Navigation */}
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

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab("calendar")}
                className={`px-4 py-2 text-xs font-black uppercase rounded-lg transition-all ${
                  activeTab === "calendar"
                    ? "bg-white text-primary shadow-sm"
                    : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                Lịch khai giảng
              </button>
              <button
                onClick={() => setActiveTab("list")}
                className={`px-4 py-2 text-xs font-black uppercase rounded-lg transition-all ${
                  activeTab === "list"
                    ? "bg-white text-primary shadow-sm"
                    : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                Danh sách lớp học
              </button>
            </div>
            <button
              onClick={openAddModal}
              className="h-10 rounded-xl bg-primary text-white px-4 text-xs font-black uppercase shadow-premium hover:shadow-hover hover:-translate-y-0.5 transition-all"
            >
              + Thêm lớp
            </button>
          </div>
        </div>

        {/* Dynamic content rendering workspace */}
        {loading ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center text-sm text-zinc-500">
            Đang tải dữ liệu lịch học...
          </div>
        ) : (
          <div className="space-y-6">
            {activeTab === "calendar" ? (
              <>
                {/* 1. Full-width Calendar Grid */}
                <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm space-y-4 w-full">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                      Bản đồ lịch khai giảng Tháng {selectedMonth} / {selectedYear}
                    </h3>
                    <span className="text-[10px] font-bold text-zinc-400">Xem theo ngày trong tháng</span>
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-2 border-t border-zinc-100 pt-4">
                    {/* Days Headers */}
                    {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((h) => (
                      <div key={h} className="text-center text-[10px] font-black uppercase text-zinc-400 py-2">
                        {h}
                      </div>
                    ))}

                    {/* Days Blocks */}
                    {calendarDays.map((item, idx) => (
                      <div
                        key={idx}
                        className={`min-h-[120px] border border-zinc-100 rounded-2xl p-2.5 flex flex-col justify-between transition-all ${
                          item.day ? "bg-white hover:border-primary/20 hover:shadow-sm" : "bg-zinc-50/50 border-none"
                        }`}
                      >
                        {item.day ? (
                          <>
                            <span className="text-[10px] font-black text-zinc-400">{item.day}</span>
                            <div className="flex flex-col gap-1.5 mt-1.5 flex-1 justify-start overflow-y-auto max-h-[150px] scrollbar-none">
                              {item.events.map((evt, eIdx) => {
                                // Extract a clean, highly recognizable short name
                                let shortCode = evt.classCode;
                                if (!evt.is11) {
                                  if (shortCode && shortCode.includes("-")) {
                                    const parts = shortCode.split("-");
                                    if (parts.length >= 3) {
                                      // E.g. UPSTR-246-C2
                                      shortCode = `${parts[0]}-${parts[1]}-${parts[2]}`;
                                    }
                                  } else {
                                    shortCode = evt.className;
                                  }
                                } else {
                                  shortCode = evt.className;
                                }
                                if (shortCode && shortCode !== "1:1") {
                                  shortCode = displayClassCode(shortCode);
                                }

                                return (
                                  <div
                                    key={eIdx}
                                    onClick={() => {
                                      const found = evt.is11
                                        ? classes11.find(c => c.id === evt.classId)
                                        : classes.find(c => c.id === evt.classId);
                                      if (found) {
                                        setSelectedClass(found);
                                        if (!evt.is11 && isAcaClass(found)) {
                                          // Compute next phase from clicked event
                                          const isWL = evt.type === "wl";
                                          const nextType: "wl" | "sr" = isWL ? "sr" : "wl";
                                          // nextPhaseDate = evt date + 45 days adjusted to class days
                                          const evtDateStr = evt.dateStr ?? "";
                                          const parts = evtDateStr.split("/");
                                          let nextDateStr = "";
                                          if (parts.length === 3) {
                                            const d = parseInt(parts[0], 10);
                                            const m = parseInt(parts[1], 10) - 1;
                                            const y = parseInt(parts[2], 10);
                                            const base = new Date(y, m, d);
                                            const offsetDays = getPhaseDurationDays(
                                              found.name,
                                              found.classCode,
                                              found.phaseDurationDays,
                                            );
                                            base.setDate(base.getDate() + offsetDays);
                                            const schedule = parseClassSchedule(found.name || "", found.classCode || "");
                                            const adj = adjustToClassDay(base, schedule.days);
                                            nextDateStr = `${String(adj.getDate()).padStart(2, "0")}/${String(adj.getMonth() + 1).padStart(2, "0")}/${adj.getFullYear()}`;
                                          }
                                          setSelectedEventContext({
                                            phaseType: evt.type as "open" | "wl" | "sr",
                                            dateStr: evtDateStr,
                                            nextPhaseType: nextType,
                                            nextDateStr,
                                          });
                                        } else {
                                          setSelectedEventContext(null);
                                        }
                                      }
                                    }}
                                    className={`p-1.5 border rounded-xl flex flex-col gap-0.5 cursor-pointer hover:shadow-sm transition-all text-[8.5px] font-black leading-tight ${
                                      evt.type === "open"
                                        ? "bg-indigo-50 text-indigo-700 border-indigo-100/70 hover:bg-indigo-100/30"
                                        : evt.type === "wl"
                                        ? "bg-emerald-50 text-emerald-750 border-emerald-100/70 hover:bg-emerald-100/30"
                                        : evt.type === "sr"
                                        ? "bg-purple-50 text-purple-700 border-purple-100/70 hover:bg-purple-100/30"
                                        : evt.type === "end11"
                                        ? "bg-rose-50 text-rose-700 border-rose-100/70 hover:bg-rose-100/30"
                                        : "bg-amber-50 text-amber-700 border-amber-100/70 hover:bg-amber-100/30"
                                    }`}
                                    title={`Xem chi tiết: ${evt.label}`}
                                  >
                                    <div className="flex items-center gap-1 justify-between">
                                      <div className="flex items-center gap-1">
                                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                          evt.type === "open"
                                            ? "bg-indigo-500"
                                            : evt.type === "wl"
                                            ? "bg-emerald-500"
                                            : evt.type === "sr"
                                            ? "bg-purple-500"
                                            : evt.type === "end11"
                                            ? "bg-rose-500"
                                            : "bg-amber-500"
                                        }`} />
                                        <span className="text-[7.5px] text-zinc-400 uppercase font-black tracking-wide">
                                          {evt.type === "open"
                                            ? "Khai giảng"
                                            : evt.type === "wl"
                                            ? "Chặng W-L"
                                            : evt.type === "sr"
                                            ? "Chặng S-R"
                                            : evt.type === "end11"
                                            ? "KT Dự kiến 1:1"
                                            : "Khai giảng 1:1"}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="text-[9px] font-black tracking-tight text-zinc-800 truncate">
                                      {shortCode}
                                    </div>
                                    {evt.teacher && (
                                      <div className="text-[8px] font-bold text-zinc-550 truncate mt-0.5">
                                        GV: {evt.teacher}
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

                {/* 2. Minimalist Chronological List Table */}
                <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm space-y-4 w-full">
                  <h3 className="text-xs font-black uppercase tracking-wider text-foreground pb-2 border-b border-zinc-150">
                    Lịch khai giảng trong tháng {selectedMonth} / {selectedYear}
                  </h3>
                  {startDatesSummary.length === 0 ? (
                    <p className="text-xs text-zinc-400 py-6 text-center italic">Không có lịch khai giảng nào chốt trong tháng.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-zinc-200 text-[10px] font-black uppercase tracking-wider text-zinc-400">
                            <th className="py-2.5 w-36">Ngày khai giảng</th>
                            <th className="py-2.5 w-56">Lớp / Mã lớp</th>
                            <th className="py-2.5 w-48">Giáo viên</th>
                            <th className="py-2.5">Sự kiện chặng học</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 font-semibold text-zinc-700">
                          {startDatesSummary.map((item, idx) => (
                            <tr 
                              key={idx} 
                              onClick={() => {
                                const found = item.is11
                                  ? classes11.find(c => c.id === item.classId)
                                  : classes.find(c => c.id === item.classId);
                                if (found) setSelectedClass(found);
                              }}
                              className="hover:bg-zinc-50/50 cursor-pointer transition-colors align-middle"
                            >
                              <td className="py-3 font-black text-zinc-800 tabular-nums">{item.startDate}</td>
                              <td className="py-3 font-black text-primary hover:underline">
                                {item.classCode && item.classCode !== "1:1"
                                  ? displayClassCode(item.classCode)
                                  : item.name}
                              </td>
                              <td className="py-3 text-zinc-500 font-bold">{item.teacher}</td>
                              <td className="py-3 text-zinc-500 font-medium">{item.phase}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Table list */
              <>
                <ClassTableList
                  classes={paginatedClasses}
                  students={students}
                  selectedYear={selectedYear}
                  onSelectClass={setSelectedClass}
                  onEditClass={openEditModal}
                  onDeleteClass={handleDeleteClass}
                />
                
                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm mt-4 text-xs font-semibold">
                    <div className="text-zinc-500">
                      Đang xem <span className="font-bold text-zinc-800">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> -{" "}
                      <span className="font-bold text-zinc-800">
                        {Math.min(currentPage * ITEMS_PER_PAGE, filteredClasses.length)}
                      </span>{" "}
                      trong tổng số <span className="font-bold text-zinc-800">{filteredClasses.length}</span> lớp học
                    </div>
                    
                    <div className="flex items-center gap-1">
                      {/* First Page Button */}
                      <button
                        type="button"
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className="h-8 w-8 rounded-lg border border-zinc-200 flex items-center justify-center text-zinc-500 hover:bg-zinc-50 disabled:opacity-40 disabled:hover:bg-transparent transition-all"
                        title="Trang đầu"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5" />
                        </svg>
                      </button>

                      {/* Previous Page Button */}
                      <button
                        type="button"
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="h-8 rounded-lg border border-zinc-200 px-2.5 flex items-center justify-center gap-1 text-zinc-650 hover:bg-zinc-50 disabled:opacity-40 disabled:hover:bg-transparent transition-all"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                        Trước
                      </button>

                      {/* Page numbers */}
                      {(() => {
                        const pages = [];
                        const maxVisiblePages = 5;
                        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

                        if (endPage - startPage + 1 < maxVisiblePages) {
                          startPage = Math.max(1, endPage - maxVisiblePages + 1);
                        }

                        for (let p = startPage; p <= endPage; p++) {
                          pages.push(
                            <button
                              key={p}
                              type="button"
                              onClick={() => setCurrentPage(p)}
                              className={`h-8 w-8 rounded-lg text-xs font-black uppercase transition-all ${
                                currentPage === p
                                  ? "bg-primary text-white shadow-premium"
                                  : "border border-zinc-200 text-zinc-650 hover:bg-zinc-50"
                              }`}
                            >
                              {p}
                            </button>
                          );
                        }
                        return pages;
                      })()}

                      {/* Next Page Button */}
                      <button
                        type="button"
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="h-8 rounded-lg border border-zinc-200 px-2.5 flex items-center justify-center gap-1 text-zinc-650 hover:bg-zinc-50 disabled:opacity-40 disabled:hover:bg-transparent transition-all"
                      >
                        Sau
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                      </button>

                      {/* Last Page Button */}
                      <button
                        type="button"
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                        className="h-8 w-8 rounded-lg border border-zinc-200 flex items-center justify-center text-zinc-500 hover:bg-zinc-50 disabled:opacity-40 disabled:hover:bg-transparent transition-all"
                        title="Trang cuối"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 4.5l7.5 7.5-7.5 7.5m-6-15l7.5 7.5-7.5 7.5" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

      </main>

      {/* CLASS DETAILS MODAL */}
      {selectedClass && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl border border-zinc-200 max-w-3xl w-full p-6 shadow-2xl relative overflow-hidden animate-in zoom-in duration-200 max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start pb-4 border-b border-zinc-100">
              <div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-primary/10 text-primary mb-1">
                  {"className" in selectedClass ? "Lớp kèm 1:1" : selectedClass.type}
                </span>
                <h3 className="text-base font-black text-foreground">
                  {"className" in selectedClass ? selectedClass.className : selectedClass.name}
                </h3>
                {!("className" in selectedClass) && selectedClass.classCode && (
                  <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-lg bg-secondary/10 text-secondary text-[11px] font-black">
                    {displayClassCode(selectedClass.classCode)}
                  </span>
                )}
              </div>
              <button
                onClick={() => { setSelectedClass(null); setSelectedEventContext(null); }}
                className="text-zinc-400 hover:text-zinc-700 text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto py-4 space-y-6 text-xs">
              
              {/* Detailed parameters grid */}
              {"className" in selectedClass ? (
                <div className="grid grid-cols-2 gap-6 bg-zinc-50 p-4 rounded-2xl border border-zinc-200/50">
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">THÔNG TIN LỚP 1:1</h4>
                    <div className="flex justify-between">
                      <span className="text-zinc-500 font-bold">Giáo viên:</span>
                      <span className="font-black text-zinc-800">{selectedClass.teacher}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-500 font-bold shrink-0">Lịch học:</span>
                      <div className="text-right">
                        {(() => {
                          const lines = parseScheduleLines(selectedClass.schedule);
                          if (lines.length <= 1) {
                            return <span className="font-black text-primary bg-primary/5 px-2 py-0.5 rounded">{selectedClass.schedule || "-"}</span>;
                          }
                          return (
                            <div className="relative inline-block w-full max-w-[180px] text-left">
                              <select
                                className="w-full bg-white border border-zinc-200 text-zinc-800 text-[10px] font-bold rounded-xl px-3 py-1 outline-none cursor-pointer transition-all appearance-none pr-8 focus:border-primary/45"
                                defaultValue={lines[lines.length - 1]}
                              >
                                {lines.map((line, lIdx) => (
                                  <option key={lIdx} value={line}>
                                    {line}
                                  </option>
                                ))}
                              </select>
                              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-zinc-400">
                                <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                                </svg>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500 font-bold">Ngày bắt đầu:</span>
                      <span className="font-black text-zinc-800">{selectedClass.startDate}</span>
                    </div>
                    {/* <div className="flex justify-between">
                      <span className="text-zinc-500 font-bold">Ngày kết thúc:</span>
                      <span className="font-black text-zinc-800">{selectedClass.endDate}</span>
                    </div> */}
                  </div>
                  <div className="space-y-2 border-l border-zinc-200/80 pl-6">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">TIẾN ĐỘ & KẾT QUẢ</h4>
                    <div className="flex justify-between">
                      <span className="text-zinc-500 font-bold">Trạng thái:</span>
                      <span className={`font-black px-2 py-0.5 rounded ${
                        getDisplayStatus(selectedClass as Aca11Class) === "Đang diễn ra"
                          ? "text-emerald-800 bg-emerald-50"
                          : getDisplayStatus(selectedClass as Aca11Class) === "Bảo lưu"
                          ? "text-amber-800 bg-amber-50"
                          : "text-rose-800 bg-rose-50"
                      }`}>
                        {getDisplayStatus(selectedClass as Aca11Class)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500 font-bold">Tiến độ buổi:</span>
                      <span className="font-black text-zinc-800">{selectedClass.progress}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500 font-bold">Đầu ra dự kiến:</span>
                      <span className="font-black text-zinc-800">{selectedClass.output}</span>
                    </div>
                    {selectedClass.zoomLink ? (
                      <div className="flex justify-between">
                        <span className="text-zinc-500 font-bold">Link Zoom:</span>
                        <a href={selectedClass.zoomLink} target="_blank" rel="noreferrer" className="font-black text-primary underline">Vào phòng</a>
                      </div>
                    ) : null}
                  </div>
                  {selectedClass.otherNote ? (
                    <div className="col-span-2 pt-2 border-t border-zinc-200/50">
                      <span className="text-zinc-500 font-bold block mb-1">Ghi chú khác:</span>
                      <p className="font-semibold text-zinc-700 bg-white p-2.5 rounded-xl border border-zinc-200">{selectedClass.otherNote}</p>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="grid grid-cols-5 gap-6">
                  {/* Column 1: Class general info (2/5) */}
                  <div className="col-span-2 bg-zinc-50/50 p-4 rounded-2xl border border-zinc-200/60 space-y-4 h-fit">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 border-b border-zinc-200/60 pb-2">THÔNG TIN LỚP</h4>
                    <div className="space-y-2.5">
                      <div className="flex justify-between">
                        <span className="text-zinc-500 font-bold">Giáo viên phụ trách:</span>
                        <span className="font-black text-zinc-800">{selectedClass.teacher}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500 font-bold">Ngày mở lớp:</span>
                        <button
                          type="button"
                          onClick={() => setShowHistoryInTimeline(prev => !prev)}
                          className="font-black text-primary hover:underline transition-colors flex items-center gap-1"
                          title="Click để xem lịch sử khai giảng trong lộ trình"
                        >
                          {selectedClass.openDate}
                          <svg className={`w-3 h-3 shrink-0 transition-transform duration-200 ${showHistoryInTimeline ? "rotate-90 text-primary" : "text-zinc-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                          </svg>
                        </button>
                      </div>

                      {selectedClass.openDateHistory && selectedClass.openDateHistory.length > 0 ? (
                        <div className="space-y-1">
                          <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Lịch sử ngày KG cũ</span>
                          <div className="flex flex-wrap gap-1">
                            {selectedClass.openDateHistory.map((d, i) => (
                              <span key={i} className="rounded bg-zinc-100 px-1.5 py-0.5 text-[9px] font-bold text-zinc-500">
                                {d}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between">
                          <span className="text-zinc-500 font-bold">Lịch sử ngày KG:</span>
                          <span className="text-[10px] text-zinc-400 italic">Chưa có</span>
                        </div>
                      )}

                      {selectedClass.progressNote && (
                        <div className="flex justify-between">
                          <span className="text-zinc-500 font-bold">Tiến độ lớp:</span>
                          <span className="font-black text-zinc-800 text-right">{selectedClass.progressNote}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Column 2: Phases vertical timeline (3/5) */}
                  <div className="col-span-3 bg-zinc-50/30 p-4 rounded-2xl border border-zinc-200/60 space-y-3">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 border-b border-zinc-200/60 pb-2">LỘ TRÌNH CHẶNG HỌC & TIẾN ĐỘ</h4>
                    <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                      {(() => {
                        const allPhases = getProjectedPhasesForYear(selectedClass as AcaClass, selectedYear);
                        const currentPhase = allPhases.find(p => p.isCurrent);
                        const currentActiveIndex = currentPhase ? currentPhase.phaseIndex : 0;
                        const visiblePhases = allPhases.filter(p => {
                          const parts = p.startDateStr.split("/");
                          const y = parts.length === 3 ? parseInt(parts[2], 10) : 0;
                          return y === selectedYear;
                        });
                        const historyItems = selectedClass.openDateHistory || [];
                        const renderHistory = showHistoryInTimeline && (
                          <div className="space-y-1.5 border-l-2 border-dashed border-zinc-200 pl-4 py-1.5 mb-2 bg-zinc-100/30 p-2.5 rounded-xl">
                            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 block">Lịch sử ngày mở lớp cũ</span>
                            {historyItems.length > 0 ? (
                              <div className="space-y-1">
                                {historyItems.map((hDate, idx) => (
                                  <div key={idx} className="flex items-center gap-2 text-[10px] text-zinc-500 font-bold">
                                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 shrink-0" />
                                    <span>Khởi chạy: <span className="text-zinc-700 font-black">{hDate}</span></span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-[10px] text-zinc-400 italic">Chưa ghi nhận ngày cũ</div>
                            )}
                          </div>
                        );

                        return (
                          <>
                            {renderHistory}
                            {visiblePhases.map((p) => {
                              const isSelected = selectedPhaseIndex === p.phaseIndex;
                          const studentsCount = students.filter(st => {
                            if (st.classId !== selectedClass.id) return false;
                            return isStudentInPhase(st, p.phaseIndex, p.isCurrent, selectedClass.classCode);
                          }).length;

                          return (
                            <div
                              key={p.phaseIndex}
                              onClick={() => setSelectedPhaseIndex(p.phaseIndex)}
                              className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                                isSelected
                                  ? "bg-primary/10 border-primary text-primary shadow-sm scale-[1.01]"
                                  : p.isCurrent
                                  ? "bg-zinc-50 border-zinc-300 text-zinc-800 hover:bg-zinc-100"
                                  : "bg-white border-zinc-200 text-zinc-650 hover:bg-zinc-50"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full shrink-0 ${
                                  p.isCurrent ? "bg-primary animate-pulse" : isSelected ? "bg-primary" : "bg-zinc-400"
                                }`} />
                                <div>
                                  <div className="font-black flex items-center gap-1.5 text-xs">
                                    Chặng {p.phaseName}
                                    {p.isCurrent && (
                                      <span className="inline-flex rounded-full bg-emerald-100 px-1.5 py-0.5 text-[8px] font-black text-emerald-800 uppercase tracking-wide">
                                        Hiện tại
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-zinc-400 font-bold mt-0.5">Khai giảng: {p.startDateStr}</div>
                                </div>
                              </div>
                              
                              <div className="text-right">
                                <span className="text-[9px] font-black uppercase text-zinc-400 block">Sĩ số</span>
                                <span className="font-black text-zinc-800 text-[11px] tabular-nums">{studentsCount} HV</span>
                              </div>
                            </div>
                          );
                        })}
                      </>
                    )})()}
                    </div>
                  </div>
                </div>
              )}

              {/* Class roster section (only for regular classes) */}
              {selectedClass && !("className" in selectedClass) && (
                <div className="space-y-3">
                  {(() => {
                    const projected = getProjectedPhasesForYear(selectedClass as AcaClass, selectedYear);
                    const currentPhaseObj = projected.find(p => p.phaseIndex === selectedPhaseIndex);
                    const phaseNameText = currentPhaseObj ? `Chặng ${currentPhaseObj.phaseName} (${currentPhaseObj.startDateStr})` : "Tất cả chặng";
                    return (
                      <div className="flex justify-between items-center">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                          DANH SÁCH HỌC VIÊN - {phaseNameText} ({classStudents.length} HỌC VIÊN)
                        </h4>
                        {selectedPhaseIndex !== null && (
                          <button
                            onClick={() => setSelectedPhaseIndex(null)}
                            className="text-[10px] font-black text-primary hover:underline uppercase tracking-wider"
                          >
                            Xem tất cả học viên active
                          </button>
                        )}
                      </div>
                    );
                  })()}
                  <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-zinc-200 bg-zinc-50 text-[9px] font-black uppercase tracking-wider text-muted whitespace-nowrap">
                          <th className="px-4 py-2.5 text-center">STT</th>
                          <th className="px-4 py-2.5">Họ và tên</th>
                          <th className="px-4 py-2.5">SĐT</th>
                          <th className="px-4 py-2.5">Gmail</th>
                          <th className="px-4 py-2.5">Phân loại học viên</th>
                          <th className="px-4 py-2.5 text-center">L/R/W/S/O</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 font-semibold text-zinc-700">
                        {classStudents.length > 0 ? (
                          classStudents.map((st, sIdx) => (
                            <tr key={st.id} className="hover:bg-zinc-50/50 align-middle">
                              <td className="px-4 py-2 text-center text-zinc-400 font-bold tabular-nums">{sIdx + 1}</td>
                              <td className="px-4 py-2 font-black text-foreground">{st.name}</td>
                              <td className="px-4 py-2 text-zinc-500 tabular-nums">{st.phone}</td>
                              <td className="px-4 py-2 text-zinc-500 font-medium">{st.email}</td>
                              <td className="px-4 py-2 text-zinc-600 font-medium">{st.classification || "-"}</td>
                              <td className="px-4 py-2 text-center font-bold tabular-nums text-zinc-800">
                                {st.scores.l}/{st.scores.r}/{st.scores.w}/{st.scores.s}/
                                <span className="font-black text-primary ml-0.5">{st.scores.o}</span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="px-4 py-6 text-center text-zinc-400 font-medium">
                              Chưa có học viên nào được gán cho lớp này.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-zinc-100 flex justify-end gap-3">
              {selectedClass && !("className" in selectedClass) && (
                <button
                  onClick={() => {
                    const classToEdit = selectedClass as AcaClass;
                    setSelectedClass(null);
                    openEditModal(classToEdit);
                  }}
                  className="h-9 rounded-xl bg-primary text-white px-5 text-xs font-black uppercase shadow-soft hover:shadow-hover hover:-translate-y-0.5 transition-all"
                >
                  Chỉnh sửa lớp
                </button>
              )}
              <button
                onClick={() => { setSelectedClass(null); setSelectedEventContext(null); }}
                className="h-9 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-5 text-xs font-black uppercase"
              >
                Đóng lại
              </button>
            </div>

          </div>
        </div>
      )}

      {/* CLASS CRUD MODAL */}
      {isCrudModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl border border-zinc-200 max-w-2xl w-full p-6 shadow-2xl relative overflow-hidden animate-in zoom-in duration-200 max-h-[90vh] flex flex-col">
            <h3 className="text-sm font-black uppercase tracking-widest text-foreground mb-4">
              {crudMode === "add" ? "Thêm lớp học mới" : "Chỉnh sửa thông tin lớp"}
            </h3>
            <form onSubmit={handleCrudSubmit} className="space-y-4 text-xs font-semibold overflow-y-auto flex-1">
              {/* Transition chặng banner */}
              {crudMode === "edit" && (
                <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="font-black text-primary text-xs uppercase tracking-wider">Chuyển sang chặng kế tiếp?</div>
                    <p className="text-[10px] text-zinc-500 font-medium leading-relaxed">
                      Nâng cấp lớp lên chặng **{fNextPhase || "chặng mới"}** bắt đầu ngày **{fNextPhaseStartDate || "chưa xếp"}**. Hệ thống tự động cập nhật sĩ số chặng hiện tại dựa trên logic học viên và reset sĩ số cần tuyển về 0.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleTransitionToNextPhase}
                    className="px-4 py-2.5 bg-primary hover:bg-primary-soft text-white font-black uppercase tracking-wider rounded-xl shadow-soft hover:shadow-hover hover:-translate-y-0.5 transition-all text-[9px] shrink-0"
                  >
                    Qua chặng mới ➔
                  </button>
                </div>
              )}

              {/* Row 1: classCode + month */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-muted tracking-widest mb-1.5">Mã lớp (classCode)</label>
                  <input
                    type="text"
                    required
                    value={fClassCode}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      setFClassCode(val);
                      const def = getDefaultSlotsToEnrollFromCode(val);
                      if (def > 0) {
                        setFSlotsToEnroll(def);
                      }
                    }}
                    placeholder="Ví dụ: U246C2 (hoặc F246C1_070926 cho Foundation)"
                    className="h-10 w-full rounded-xl border border-zinc-200 px-4 font-black text-foreground outline-none focus:border-primary/45 focus:ring-2 focus:ring-primary/10 tracking-wide"
                  />
                  <p className="text-[10px] text-zinc-400 mt-1">Lớp thường: U246C2. Foundation: F + thứ + ca + _ngày khai giảng (DDMMYY).</p>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-muted tracking-widest mb-1.5">Tháng hoạt động</label>
                  <select
                    value={fMonth}
                    onChange={(e) => setFMonth(Number(e.target.value))}
                    className="h-10 w-full rounded-xl border border-zinc-200 px-4 font-bold text-foreground outline-none focus:border-primary/45 focus:ring-2 focus:ring-primary/10 bg-white"
                  >
                    {Array.from({ length: 12 }).map((_, mIdx) => (
                      <option key={mIdx + 1} value={mIdx + 1}>
                        Tháng {mIdx + 1}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Name */}
              <div>
                <label className="block text-[10px] font-black uppercase text-muted tracking-widest mb-1.5">Tên lớp đầy đủ</label>
                <input
                  type="text"
                  required
                  value={fName}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFName(val);
                    const def = getDefaultSlotsToEnroll(val);
                    if (def > 0) {
                      setFSlotsToEnroll(def);
                    }
                  }}
                  placeholder="XLE RLP_Upstream - 246 - C2 - GV ..."
                  className="h-10 w-full rounded-xl border border-zinc-200 px-4 font-bold text-foreground outline-none focus:border-primary/45 focus:ring-2 focus:ring-primary/10"
                />
              </div>

              {/* Row 3: teacher + type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-muted tracking-widest mb-1.5">Giáo viên</label>
                  <input
                    type="text"
                    value={fTeacher}
                    onChange={(e) => setFTeacher(e.target.value)}
                    placeholder="Tên giáo viên..."
                    className="h-10 w-full rounded-xl border border-zinc-200 px-4 font-bold text-foreground outline-none focus:border-primary/45 focus:ring-2 focus:ring-primary/10"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-muted tracking-widest mb-1.5">Trạng thái lớp</label>
                  <select
                    value={fType}
                    onChange={(e) => setFType(e.target.value)}
                    className="h-10 w-full rounded-xl border border-zinc-200 px-4 font-bold text-foreground outline-none focus:border-primary/45 focus:ring-2 focus:ring-primary/10 bg-white"
                  >
                    <option>Lớp đang diễn ra</option>
                    <option>Lớp mới</option>
                    <option>Lớp sắp mở</option>
                    <option>Lớp đã kết thúc</option>
                  </select>
                </div>
              </div>

              {/* Row 4: openDate + currentPhase */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-muted tracking-widest mb-1.5">Ngày mở lớp</label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={fOpenDate}
                      onChange={(e) => handleOpenDateChange(e.target.value)}
                      placeholder="dd/mm/yyyy"
                      className="h-10 w-full rounded-xl border border-zinc-200 pl-4 pr-10 font-bold text-foreground outline-none focus:border-primary/45 focus:ring-2 focus:ring-primary/10"
                    />
                    <input
                      type="date"
                      value={toYYYYMMDD(fOpenDate)}
                      onChange={(e) => handleOpenDateChange(toDDMMYYYY(e.target.value))}
                      className="absolute opacity-0 pointer-events-none w-0 h-0"
                    />
                    <button
                      type="button"
                      onClick={handleDateIconClick}
                      className="absolute right-3 text-zinc-400 hover:text-primary transition-colors flex items-center justify-center p-1.5 rounded-lg hover:bg-zinc-100"
                      title="Chọn ngày"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-muted tracking-widest mb-1.5">Chặng hiện tại</label>
                  <input
                    type="text"
                    value={fCurrentPhase}
                    onChange={(e) => setFCurrentPhase(e.target.value)}
                    placeholder="S-R / W-L / Pre IELTS..."
                    className="h-10 w-full rounded-xl border border-zinc-200 px-4 font-bold text-foreground outline-none focus:border-primary/45 focus:ring-2 focus:ring-primary/10"
                  />
                </div>
              </div>

              {/* Lịch sử ngày mở lớp — chỉ hiện khi edit và có lịch sử */}
              {crudMode === "edit" && fOpenDateHistory.length > 0 && (
                <div className="rounded-xl border border-zinc-200/60 bg-zinc-50/50 px-4 py-3 space-y-2">
                  <div className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Lịch sử ngày mở lớp</div>
                  <div className="flex flex-wrap gap-1.5">
                    {fOpenDateHistory.map((d, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-200/60 px-2.5 py-1 text-[10px] font-bold text-zinc-600"
                      >
                        {d}
                        <button
                          type="button"
                          title="Xóa khỏi lịch sử"
                          onClick={() => setFOpenDateHistory(prev => prev.filter((_, idx) => idx !== i))}
                          className="text-zinc-400 hover:text-danger transition-colors leading-none"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Row 5: phaseStartDate + phaseStudents */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-muted tracking-widest mb-1.5">Khai giảng chặng hiện tại</label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={fPhaseStartDate}
                      onChange={(e) => setFPhaseStartDate(e.target.value)}
                      placeholder="dd/mm/yyyy"
                      className="h-10 w-full rounded-xl border border-zinc-200 pl-4 pr-10 font-bold text-foreground outline-none focus:border-primary/45 focus:ring-2 focus:ring-primary/10"
                    />
                    <input
                      type="date"
                      value={toYYYYMMDD(fPhaseStartDate)}
                      onChange={(e) => setFPhaseStartDate(toDDMMYYYY(e.target.value))}
                      className="absolute opacity-0 pointer-events-none w-0 h-0"
                    />
                    <button
                      type="button"
                      onClick={handleDateIconClick}
                      className="absolute right-3 text-zinc-400 hover:text-primary transition-colors flex items-center justify-center p-1.5 rounded-lg hover:bg-zinc-100"
                      title="Chọn ngày"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-muted tracking-widest mb-1.5">Sĩ số chặng hiện tại</label>
                  <input
                    type="number"
                    min={0}
                    value={fPhaseStudents}
                    onChange={(e) => setFPhaseStudents(Number(e.target.value))}
                    className="h-10 w-full rounded-xl border border-zinc-200 px-4 font-bold text-foreground outline-none focus:border-primary/45 focus:ring-2 focus:ring-primary/10"
                  />
                </div>
              </div>

              {/* Row 6: nextPhase + nextPhaseStartDate + slotsToEnroll */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-muted tracking-widest mb-1.5">Chặng tiếp theo</label>
                  <input
                    type="text"
                    value={fNextPhase}
                    onChange={(e) => setFNextPhase(e.target.value)}
                    placeholder="W-L / S-R / CORE 2..."
                    className="h-10 w-full rounded-xl border border-zinc-200 px-4 font-bold text-foreground outline-none focus:border-primary/45 focus:ring-2 focus:ring-primary/10"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-muted tracking-widest mb-1.5">Khai giảng chặng kế</label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={fNextPhaseStartDate}
                      onChange={(e) => setFNextPhaseStartDate(e.target.value)}
                      placeholder="dd/mm/yyyy"
                      className="h-10 w-full rounded-xl border border-zinc-200 pl-4 pr-10 font-bold text-foreground outline-none focus:border-primary/45 focus:ring-2 focus:ring-primary/10"
                    />
                    <input
                      type="date"
                      value={toYYYYMMDD(fNextPhaseStartDate)}
                      onChange={(e) => setFNextPhaseStartDate(toDDMMYYYY(e.target.value))}
                      className="absolute opacity-0 pointer-events-none w-0 h-0"
                    />
                    <button
                      type="button"
                      onClick={handleDateIconClick}
                      className="absolute right-3 text-zinc-400 hover:text-primary transition-colors flex items-center justify-center p-1.5 rounded-lg hover:bg-zinc-100"
                      title="Chọn ngày"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-muted tracking-widest mb-1.5">Cần tuyển (slot)</label>
                  <input
                    type="number"
                    min={0}
                    value={fSlotsToEnroll}
                    onChange={(e) => setFSlotsToEnroll(Number(e.target.value))}
                    className="h-10 w-full rounded-xl border border-zinc-200 px-4 font-bold text-foreground outline-none focus:border-primary/45 focus:ring-2 focus:ring-primary/10"
                  />
                </div>
              </div>

              {/* Row 7: progressNote */}
              <div>
                <label className="block text-[10px] font-black uppercase text-muted tracking-widest mb-1.5">Ghi chú tình trạng tiến độ</label>
                <input
                  type="text"
                  value={fProgressNote}
                  onChange={(e) => setFProgressNote(e.target.value)}
                  placeholder="Đúng tiến độ, GV nhận xét tốt..."
                  className="h-10 w-full rounded-xl border border-zinc-200 px-4 font-bold text-foreground outline-none focus:border-primary/45 focus:ring-2 focus:ring-primary/10"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsCrudModalOpen(false)}
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

function ClassTableList({ 
  classes, 
  students,
  selectedYear,
  onSelectClass,
  onEditClass,
  onDeleteClass,
}: { 
  classes: AcaClass[];
  students: AcaStudent[];
  selectedYear: number;
  onSelectClass: (cls: AcaClass) => void;
  onEditClass: (cls: AcaClass) => void;
  onDeleteClass: (id: string) => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1300px] border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 text-[10px] font-black uppercase tracking-widest text-muted whitespace-nowrap">
              <th className="px-6 py-4 min-w-[340px]">Tên lớp / Mã lớp</th>
              <th className="px-6 py-4 min-w-[160px]">Ngày mở lớp</th>
              <th className="px-6 py-4 min-w-[160px]">Chặng hiện tại</th>
              <th className="px-6 py-4 min-w-[180px]">Khai giảng chặng</th>
              <th className="px-6 py-4 text-center min-w-[140px]">Sĩ số chặng</th>
              <th className="px-6 py-4 min-w-[220px]">Chặng tiếp theo</th>
              <th className="px-6 py-4 text-center min-w-[120px]">Cần tuyển</th>
              <th className="px-6 py-4 min-w-[160px]">Trạng thái</th>
              <th className="px-6 py-4 text-center min-w-[120px]">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 font-semibold text-zinc-700">
            {classes.length > 0 ? (
              classes.map((c) => {
                const recruitedCount = students.filter(st => isRecruitedForNextPhase(st, c, selectedYear)).length;
                return (
                  <tr 
                    key={c.id} 
                    className="hover:bg-zinc-50/80 align-middle transition-colors"
                  >
                    <td
                      className="px-6 py-4 min-w-[340px] cursor-pointer"
                      onClick={() => onSelectClass(c)}
                      title="Click để xem chi tiết và danh sách học viên"
                    >
                      <div className="font-black text-primary hover:underline">{c.name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        {c.classCode && (
                          <span className="inline-flex items-center rounded-md bg-secondary/10 px-1.5 py-0.5 text-[9px] font-black text-secondary tracking-wide">
                            {displayClassCode(c.classCode)}
                          </span>
                        )}
                        <span className="text-[10px] text-zinc-400 font-bold">GV: {c.teacher}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-zinc-500 min-w-[160px]">{c.openDate}</td>
                    <td className="px-6 py-4 min-w-[160px]">
                      <span className="rounded-lg bg-primary/10 px-2 py-0.5 text-[9px] font-black text-primary uppercase">
                        {c.currentPhase}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-500 min-w-[180px]">{c.phaseStartDate}</td>
                    <td className="px-6 py-4 text-center font-bold tabular-nums text-foreground min-w-[140px]">{c.phaseStudents}</td>
                    <td className="px-6 py-4 min-w-[220px]">
                      <div className="text-zinc-800 font-black">{c.nextPhase}</div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">Khai giảng: {c.nextPhaseStartDate}</div>
                    </td>
                    <td className="px-6 py-4 text-center font-bold tabular-nums text-warning min-w-[120px]">{recruitedCount}/{c.slotsToEnroll}</td>
                    <td className="px-6 py-4 min-w-[160px]">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-2.5 py-1 text-[9px] font-black uppercase text-success">
                        {c.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap min-w-[120px]">
                      <button
                        onClick={(e) => { e.stopPropagation(); onEditClass(c); }}
                        className="text-primary hover:text-primary-soft mr-3 font-black"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onDeleteClass(c.id); }}
                        className="text-danger hover:text-red-400 font-black"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={9} className="px-6 py-8 text-center text-zinc-400 font-medium">
                  Không có lớp nào bắt đầu hoặc hoạt động trong tháng này.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
