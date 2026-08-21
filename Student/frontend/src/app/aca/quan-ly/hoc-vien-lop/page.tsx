"use client";

import { Fragment, useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { AcaLayout } from "@/components/aca/AcaLayout";
import { AcaTopbar } from "@/components/aca/AcaTopbar";
import {
  fetchAcaClasses,
  fetchAcaStudents,
  createAcaStudent,
  updateAcaStudent,
  deleteAcaStudent,
  canUseAcaApi,
  AcaClass,
  AcaStudent,
  AcaStudentCycle,
  displayClassCode,
  classCodesMatch,
} from "@/lib/acaManagementApi";
import {
  listAcademicWarnings,
  ACADEMIC_WARNING_UPDATE_EVENT,
  type AcademicWarningRecord,
} from "@/lib/academicWarningStore";
import { AcademicWarningEmbeddedTable } from "@/components/academic/AcademicWarningEmbeddedTable";
import { AcaXlsxImportModal, type ImportField } from "@/components/aca/AcaXlsxImportModal";

const STUDENT_IMPORT_FIELDS: ImportField[] = [
  { key: "name", label: "Tên học viên", required: true },
  { key: "email", label: "Email", required: true },
  { key: "phone", label: "Số điện thoại" },
  { key: "className", label: "Tên lớp học" },
  { key: "classification", label: "Phân loại (Lớp lẻ mới/Combo/Học lại/Chuyển lớp)" },
  { key: "entrance", label: "Entrance" },
  
  // Cycle 1
  { key: "l1", label: "L1" },
  { key: "f1", label: "F1" },
  { key: "registeredWriting", label: "Chấm Writing L1 (x hoặc có)" },
  { key: "registeredMocktest", label: "Mocktest L1 (x hoặc có)" },
  { key: "registeredLuyenDe", label: "Lớp luyện đề L1 (x hoặc có)" },
  { key: "homeworkPercent", label: "Homework L1 (%)" },
  { key: "attendanceCount", label: "Chuyên cần L1" },

  // Cycle 2
  { key: "l2", label: "L2" },
  { key: "f2", label: "F2" },
  { key: "registeredWriting2", label: "Chấm Writing L2 (x hoặc có)" },
  { key: "registeredMocktest2", label: "Mocktest L2 (x hoặc có)" },
  { key: "registeredLuyenDe2", label: "Lớp luyện đề L2 (x hoặc có)" },
  { key: "homeworkPercent2", label: "Homework L2 (%)" },
  { key: "attendanceCount2", label: "Chuyên cần L2" },

  // Cycle 3
  { key: "l3", label: "L3" },
  { key: "f3", label: "F3" },
  { key: "registeredWriting3", label: "Chấm Writing L3 (x hoặc có)" },
  { key: "registeredMocktest3", label: "Mocktest L3 (x hoặc có)" },
  { key: "registeredLuyenDe3", label: "Lớp luyện đề L3 (x hoặc có)" },
  { key: "homeworkPercent3", label: "Homework L3 (%)" },
  { key: "attendanceCount3", label: "Chuyên cần L3" },

  { key: "bcbLink", label: "Link BCB" },
  { key: "note", label: "Ghi chú" },
];

function hasRecordedScore(value: unknown): boolean {
  const s = String(value ?? "").trim();
  return s !== "" && s !== "-";
}

export default function HocVienLopPage() {
  const [studentsList, setStudentsList] = useState<AcaStudent[]>([]);
  const [classesList, setClassesList] = useState<AcaClass[]>([]);
  const [warnings, setWarnings] = useState<AcademicWarningRecord[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterYear, setFilterYear] = useState<number | "all">("all");
  const [filterMonth, setFilterMonth] = useState<number | "all">("all");
  const [filterClassification, setFilterClassification] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Derived available years from loaded class data
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    classesList.forEach((c: AcaClass) => {
      if (c.openDate) {
        const parts = c.openDate.split("/");
        if (parts.length === 3) {
          const y = parseInt(parts[2], 10);
          if (!isNaN(y)) years.add(y);
        }
      }
    });
    // Add current and next year as default options
    const currentYear = new Date().getFullYear();
    years.add(currentYear);
    years.add(currentYear + 1);
    return Array.from(years).sort((a, b) => a - b);
  }, [classesList]);

  // Filtered classes dropdown based on selected Year and Month
  const filteredClassesDropdown = useMemo((): AcaClass[] => {
    return classesList.filter((c: AcaClass) => {
      if (filterMonth === "all") {
        if (filterYear !== "all" && c.openDate) {
          const parts = c.openDate.split("/");
          if (parts.length === 3) {
            return parseInt(parts[2], 10) === filterYear;
          }
        }
        return true;
      }
      
      // Strict month match
      if (c.month === filterMonth) return true;
      
      // Ongoing class check
      if (c.openDate) {
        const openParts = c.openDate.split("/");
        if (openParts.length === 3) {
          const openM = parseInt(openParts[1], 10);
          const openY = parseInt(openParts[2], 10);
          
          const start = new Date(openY, openM - 1, 1);
          const targetY = filterYear === "all" ? new Date().getFullYear() : filterYear;
          const target = new Date(targetY, filterMonth - 1, 1);
          
          if (target >= start) {
            if (c.endDate) {
              const endParts = c.endDate.split("/");
              if (endParts.length === 3) {
                const endM = parseInt(endParts[1], 10);
                const endY = parseInt(endParts[2], 10);
                const end = new Date(endY, endM - 1, 28);
                return target <= end;
              }
            }
            return c.type === "Lớp đang diễn ra" || c.type === "Lớp mới";
          }
        }
      }
      return false;
    });
  }, [classesList, filterYear, filterMonth]);

  // Reset selectedClassId if it is not in the filtered dropdown list
  useEffect(() => {
    if (selectedClassId !== "all") {
      const stillExists = filteredClassesDropdown.some((c: AcaClass) => c.id === selectedClassId);
      if (!stillExists) {
        setSelectedClassId("all");
      }
    }
  }, [filteredClassesDropdown, selectedClassId]);

  // Expanded rows state
  const [expandedStudents, setExpandedStudents] = useState<Record<string, boolean>>({});

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [currentStudentId, setCurrentStudentId] = useState<string | null>(null);

  // Form Field States
  const [formName, setFormName] = useState("");
  const [formClassId, setFormClassId] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formClassification, setFormClassification] = useState("Lớp lẻ mới");
  const [formEntrance, setFormEntrance] = useState("");
  
  // Cycle 1
  const [formRegisteredWriting, setFormRegisteredWriting] = useState(false);
  const [formRegisteredMocktest, setFormRegisteredMocktest] = useState(false);
  const [formRegisteredLuyenDe, setFormRegisteredLuyenDe] = useState(false);
  const [formHomeworkPercent, setFormHomeworkPercent] = useState("");
  const [formAttendanceCount, setFormAttendanceCount] = useState("");
  
  // Cycle 2
  const [formRegisteredWriting2, setFormRegisteredWriting2] = useState(false);
  const [formRegisteredMocktest2, setFormRegisteredMocktest2] = useState(false);
  const [formRegisteredLuyenDe2, setFormRegisteredLuyenDe2] = useState(false);
  const [formHomeworkPercent2, setFormHomeworkPercent2] = useState("");
  const [formAttendanceCount2, setFormAttendanceCount2] = useState("");
  
  // Cycle 3
  const [formRegisteredWriting3, setFormRegisteredWriting3] = useState(false);
  const [formRegisteredMocktest3, setFormRegisteredMocktest3] = useState(false);
  const [formRegisteredLuyenDe3, setFormRegisteredLuyenDe3] = useState(false);
  const [formHomeworkPercent3, setFormHomeworkPercent3] = useState("");
  const [formAttendanceCount3, setFormAttendanceCount3] = useState("");

  const [formL1, setFormL1] = useState("");
  const [formF1, setFormF1] = useState("");
  const [formL2, setFormL2] = useState("");
  const [formF2, setFormF2] = useState("");
  const [formL3, setFormL3] = useState("");
  const [formF3, setFormF3] = useState("");
  const [formBcbLink, setFormBcbLink] = useState("");
  const [formNote, setFormNote] = useState("");
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [formCycles, setFormCycles] = useState<AcaStudentCycle[]>([]);

  const calculateIeltsOverall = (l: string, r: string, w: string, s: string): string => {
    const scoreL = parseFloat(l);
    const scoreR = parseFloat(r);
    const scoreW = parseFloat(w);
    const scoreS = parseFloat(s);
    
    const validScores: number[] = [];
    if (!isNaN(scoreL)) validScores.push(scoreL);
    if (!isNaN(scoreR)) validScores.push(scoreR);
    if (!isNaN(scoreW)) validScores.push(scoreW);
    if (!isNaN(scoreS)) validScores.push(scoreS);
    
    if (validScores.length === 0) return "";
    
    const sum = validScores.reduce((a, b) => a + b, 0);
    const avg = sum / validScores.length;
    
    const integerPart = Math.floor(avg);
    const decimalPart = avg - integerPart;
    
    let roundedDecimal = 0;
    if (decimalPart >= 0.25 && decimalPart < 0.75) {
      roundedDecimal = 0.5;
    } else if (decimalPart >= 0.75) {
      roundedDecimal = 1.0;
    }
    
    const finalScore = integerPart + roundedDecimal;
    return finalScore.toFixed(1);
  };

  const updateCycleComponentScore = (
    cycleIndex: number,
    type: "scores" | "finalScores",
    field: "l" | "r" | "w" | "s" | "o",
    value: string
  ) => {
    setFormCycles((prev) => {
      const updated = [...prev];
      if (updated[cycleIndex]) {
        const cycle = { ...updated[cycleIndex] };
        const group = { ...(cycle[type] || { l: "-", r: "-", w: "-", s: "-", o: "-" }) };
        group[field] = value;
        
        // Auto-calculate overall if updating a sub-score
        if (field !== "o") {
          const l = field === "l" ? value : String(group.l || "");
          const r = field === "r" ? value : String(group.r || "");
          const w = field === "w" ? value : String(group.w || "");
          const s = field === "s" ? value : String(group.s || "");
          const overall = calculateIeltsOverall(l, r, w, s);
          if (overall) {
            group.o = overall;
            
            // Link cycle 1 Entrance overall to formEntrance
            if (type === "scores" && cycleIndex === 0) {
              setFormEntrance(overall);
            }
            // Link Final overall to cycle.finalScore and formF1/F2/F3
            cycle.finalScore = overall;
            if (cycleIndex === 0) setFormF1(overall);
            else if (cycleIndex === 1) setFormF2(overall);
            else if (cycleIndex === 2) setFormF3(overall);
          }
        } else {
          // Link overall directly if updated manually
          if (type === "scores" && cycleIndex === 0) {
            setFormEntrance(value);
          }
          cycle.finalScore = value;
          if (cycleIndex === 0) setFormF1(value);
          else if (cycleIndex === 1) setFormF2(value);
          else if (cycleIndex === 2) setFormF3(value);
        }
        
        cycle[type] = group;
        updated[cycleIndex] = cycle;
      }
      return updated;
    });
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

  const checkIsHocLai = (cycles: AcaStudentCycle[]): boolean => {
    const getLevelPrefix = (code: string): string => {
      const p = code.split("-")[0].trim().toUpperCase();
      if (p.startsWith("F") && !p.startsWith("FOA")) return "FOUND";
      if (p.startsWith("M")) return "MMNT";
      if (p.startsWith("U")) return "UPSTR";
      if (p.startsWith("S")) return "SOAR";
      if (p.startsWith("A")) return "ADV";
      return p;
    };

    for (let j = 1; j < cycles.length; j++) {
      const classCodeJ = cycles[j].classCode;
      if (!classCodeJ) continue;
      const prefixJ = getLevelPrefix(classCodeJ);
      
      // Compare with all previous cycles
      for (let i = 0; i < j; i++) {
        const classCodeI = cycles[i].classCode;
        if (!classCodeI) continue;
        const prefixI = getLevelPrefix(classCodeI);
        
        if (prefixI && prefixI === prefixJ) {
          return true;
        }
      }
    }
    return false;
  };

  useEffect(() => {
    if (formClassification === "Lớp lẻ mới" && formCycles.length > 1 && checkIsHocLai(formCycles)) {
      setFormClassification("Học lại");
    }
  }, [formCycles, formClassification]);

  const toggleRowExpand = (studentId: string) => {
    setExpandedStudents((prev) => ({
      ...prev,
      [studentId]: !prev[studentId],
    }));
  };

  const handleImportStudents = async (
    mappedRows: any[],
    updateProgress: (current: number, total: number) => void
  ) => {
    const created: AcaStudent[] = [];
    const total = mappedRows.length;

    const parseBool = (val: any) => {
      if (val === undefined || val === null) return false;
      const s = String(val).toLowerCase().trim();
      return s === "x" || s === "có" || s === "co" || s === "yes" || s === "true" || s === "1";
    };

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

      const cycles: AcaStudentCycle[] = [];
      cycles.push({
        classCode: String(row.l1 || "").trim() || getClassInfo(classId).code || "",
        finalScore: String(row.f1 || "").trim(),
        registeredWriting: parseBool(row.registeredWriting),
        registeredMocktest: parseBool(row.registeredMocktest),
        registeredLuyenDe: parseBool(row.registeredLuyenDe),
        homeworkPercent: String(row.homeworkPercent || "").trim(),
        attendanceCount: String(row.attendanceCount || "").trim(),
      });
      if (row.l2 || row.f2 || row.homeworkPercent2 || row.attendanceCount2) {
        cycles.push({
          classCode: String(row.l2 || "").trim(),
          finalScore: String(row.f2 || "").trim(),
          registeredWriting: parseBool(row.registeredWriting2),
          registeredMocktest: parseBool(row.registeredMocktest2),
          registeredLuyenDe: parseBool(row.registeredLuyenDe2),
          homeworkPercent: String(row.homeworkPercent2 || "").trim(),
          attendanceCount: String(row.attendanceCount2 || "").trim(),
        });
      }
      if (row.l3 || row.f3 || row.homeworkPercent3 || row.attendanceCount3) {
        cycles.push({
          classCode: String(row.l3 || "").trim(),
          finalScore: String(row.f3 || "").trim(),
          registeredWriting: parseBool(row.registeredWriting3),
          registeredMocktest: parseBool(row.registeredMocktest3),
          registeredLuyenDe: parseBool(row.registeredLuyenDe3),
          homeworkPercent: String(row.homeworkPercent3 || "").trim(),
          attendanceCount: String(row.attendanceCount3 || "").trim(),
        });
      }

      let finalClassification = String(row.classification || "").trim();
      
      // Standardize values
      if (!finalClassification) {
        finalClassification = "Lớp lẻ mới";
      } else if (finalClassification === "Lớp lẻ") {
        finalClassification = "Lớp lẻ mới";
      } else if (finalClassification === "Lớp combo") {
        finalClassification = "Combo";
      }

      // Auto-detect retake status only for Lớp lẻ mới
      if (finalClassification === "Lớp lẻ mới" && cycles.length > 1 && checkIsHocLai(cycles)) {
        finalClassification = "Học lại";
      }

      const payload = {
        classId,
        stt: studentsList.length + created.length + 1,
        name: String(row.name || "").trim(),
        phone: String(row.phone || "").trim(),
        email: String(row.email || "").trim(),
        classification: finalClassification,
        scores: { l: "-", r: "-", w: "-", s: "-", o: "-" },
        entrance: String(row.entrance || "").trim(),
        
        registeredWriting: parseBool(row.registeredWriting),
        registeredMocktest: parseBool(row.registeredMocktest),
        registeredLuyenDe: parseBool(row.registeredLuyenDe),
        homeworkPercent: String(row.homeworkPercent || "").trim(),
        attendanceCount: String(row.attendanceCount || "").trim(),

        registeredWriting2: parseBool(row.registeredWriting2),
        registeredMocktest2: parseBool(row.registeredMocktest2),
        registeredLuyenDe2: parseBool(row.registeredLuyenDe2),
        homeworkPercent2: String(row.homeworkPercent2 || "").trim(),
        attendanceCount2: String(row.attendanceCount2 || "").trim(),

        registeredWriting3: parseBool(row.registeredWriting3),
        registeredMocktest3: parseBool(row.registeredMocktest3),
        registeredLuyenDe3: parseBool(row.registeredLuyenDe3),
        homeworkPercent3: String(row.homeworkPercent3 || "").trim(),
        attendanceCount3: String(row.attendanceCount3 || "").trim(),

        l1: String(row.l1 || "").trim(),
        f1: String(row.f1 || "").trim(),
        l2: String(row.l2 || "").trim(),
        f2: String(row.f2 || "").trim(),
        l3: String(row.l3 || "").trim(),
        f3: String(row.f3 || "").trim(),
        bcbLink: String(row.bcbLink || "").trim(),
        note: String(row.note || "").trim(),
        cycles,
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
        if (!canUseAcaApi()) {
          setLoadError("Chưa có phiên đăng nhập ACA hoặc API backend chưa sẵn sàng.");
          setClassesList([]);
          setStudentsList([]);
          return;
        }
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
        const message =
          err instanceof Error ? err.message : "Không tải được danh sách lớp và học viên.";
        setLoadError(message);
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();

    // Sync academic warnings
    const loadWrn = () => {
      void listAcademicWarnings().then(setWarnings);
    };
    loadWrn();
    window.addEventListener(ACADEMIC_WARNING_UPDATE_EVENT, loadWrn);
    window.addEventListener("storage", loadWrn);
    return () => {
      window.removeEventListener(ACADEMIC_WARNING_UPDATE_EVENT, loadWrn);
      window.removeEventListener("storage", loadWrn);
    };
  }, []);

  const filteredStudents = studentsList.filter((st) => {
    // Lọc các bạn có cột lớp không trống
    if (!st.classId || !classesList.some(c => c.id === st.classId)) {
      return false;
    }

    let matchesClass = false;
    if (selectedClassId !== "all") {
      matchesClass = st.classId === selectedClassId;
    } else {
      const studentClass = classesList.find(c => c.id === st.classId);
      if (studentClass) {
        const matchMonth = filterMonth === "all" || studentClass.month === filterMonth;
        let matchYear = true;
        if (filterYear !== "all" && studentClass.openDate) {
          const parts = studentClass.openDate.split("/");
          if (parts.length === 3) {
            matchYear = parseInt(parts[2], 10) === filterYear;
          }
        }
        matchesClass = matchMonth && matchYear;
      } else {
        // If student has no class assigned, only include them if we are not filtering by year/month
        matchesClass = filterMonth === "all" && filterYear === "all";
      }
    }
    
    // If filtering by a specific class, exclude students who have completed both phases (2 chặng) in this class
    if (selectedClassId !== "all" && matchesClass) {
      const selectedClass = classesList.find(c => c.id === selectedClassId);
      if (selectedClass) {
        if (isStudentFinishedClass(st, selectedClass.classCode)) {
          return false; // Completed -> remove from list!
        }
      }
    }
    
    const matchesSearch = st.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          st.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          st.phone.includes(searchQuery) ||
                          (st.note && st.note.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesClassification = filterClassification === "all" || st.classification === filterClassification;
    return matchesClass && matchesSearch && matchesClassification;
  });

  // Reset current page when filtering changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterYear, filterMonth, selectedClassId, filterClassification]);

  const displayedWarnings = useMemo(() => {
    if (selectedClassId === "all") return warnings;
    const cls = classesList.find((c) => c.id === selectedClassId);
    if (!cls) return [];
    return warnings.filter(
      (w) =>
        w.classId === cls.id ||
        w.classId === cls.name ||
        w.className === cls.name ||
        (cls.classCode && classCodesMatch(w.classId, cls.classCode)),
    );
  }, [warnings, selectedClassId, classesList]);

  const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE);

  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredStudents.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredStudents, currentPage]);

  const getClassInfo = (classId: string) => {
    const cls = classesList.find((c) => c.id === classId);
    return { name: cls?.name || "Chưa gán", code: cls?.classCode || "" };
  };

  const getClassInfoByCode = (classCode: string) => {
    const cls = classesList.find((c) => classCodesMatch(c.classCode, classCode));
    return { name: cls?.name || "", code: classCode, teacher: cls?.teacher || "" };
  };

  const getCycleData = (st: AcaStudent, index: number): AcaStudentCycle => {
    if (st.cycles && st.cycles[index]) {
      return st.cycles[index];
    }
    // Fallback to legacy fields for indices 0, 1, 2
    if (index === 0) {
      return {
        classCode: st.l1 || getClassInfo(st.classId).code || "",
        finalScore: st.f1 || "",
        registeredWriting: !!st.registeredWriting,
        registeredMocktest: !!st.registeredMocktest,
        registeredLuyenDe: !!st.registeredLuyenDe,
        homeworkPercent: st.homeworkPercent || "",
        attendanceCount: st.attendanceCount || "",
      };
    }
    if (index === 1) {
      return {
        classCode: st.l2 || "",
        finalScore: st.f2 || "",
        registeredWriting: !!st.registeredWriting2,
        registeredMocktest: !!st.registeredMocktest2,
        registeredLuyenDe: !!st.registeredLuyenDe2,
        homeworkPercent: st.homeworkPercent2 || "",
        attendanceCount: st.attendanceCount2 || "",
      };
    }
    if (index === 2) {
      return {
        classCode: st.l3 || "",
        finalScore: st.f3 || "",
        registeredWriting: !!st.registeredWriting3,
        registeredMocktest: !!st.registeredMocktest3,
        registeredLuyenDe: !!st.registeredLuyenDe3,
        homeworkPercent: st.homeworkPercent3 || "",
        attendanceCount: st.attendanceCount3 || "",
      };
    }
    return {
      classCode: "",
      finalScore: "",
      registeredWriting: false,
      registeredMocktest: false,
      registeredLuyenDe: false,
      homeworkPercent: "",
      attendanceCount: "",
    };
  };

  const handleToggleCycleField = async (
    studentId: string,
    cycleIndex: number,
    field: "registeredWriting" | "registeredMocktest" | "registeredLuyenDe",
    currentValue: boolean
  ) => {
    try {
      const student = studentsList.find((s) => s.id === studentId);
      if (!student) return;

      const updatedCycles = [...(student.cycles || [])];
      
      // Pad cycles array if needed to ensure cycleIndex exists
      for (let i = 0; i <= cycleIndex; i++) {
        if (!updatedCycles[i]) {
          updatedCycles[i] = getCycleData(student, i);
        }
      }

      updatedCycles[cycleIndex] = {
        ...updatedCycles[cycleIndex],
        [field]: !currentValue,
      };

      const payload: Partial<AcaStudent> = {
        cycles: updatedCycles,
      };

      // For backward compatibility, if cycleIndex is 0, 1, or 2, we also sync the flat fields!
      if (cycleIndex === 0) {
        const keyMap = {
          registeredWriting: "registeredWriting",
          registeredMocktest: "registeredMocktest",
          registeredLuyenDe: "registeredLuyenDe",
        } as const;
        payload[keyMap[field]] = !currentValue;
      } else if (cycleIndex === 1) {
        const keyMap = {
          registeredWriting: "registeredWriting2",
          registeredMocktest: "registeredMocktest2",
          registeredLuyenDe: "registeredLuyenDe2",
        } as const;
        payload[keyMap[field]] = !currentValue;
      } else if (cycleIndex === 2) {
        const keyMap = {
          registeredWriting: "registeredWriting3",
          registeredMocktest: "registeredMocktest3",
          registeredLuyenDe: "registeredLuyenDe3",
        } as const;
        payload[keyMap[field]] = !currentValue;
      }

      const updated = await updateAcaStudent(studentId, payload);
      setStudentsList((prev) =>
        prev.map((s) => (s.id === studentId ? updated : s))
      );
    } catch (err: any) {
      alert("Cập nhật thất bại: " + err.message);
    }
  };

  const LEVEL_SEQUENCE = ["FOUND", "MMNT", "UPSTR", "SOAR", "ADV"];

  const getNextLevelClassCode = (currentClassCode: string): string => {
    if (!currentClassCode) return "";
    let prefix = currentClassCode.split("-")[0].toUpperCase();
    if (prefix.startsWith("F") && !prefix.startsWith("FOA")) prefix = "FOUND";
    else if (prefix.startsWith("M")) prefix = "MMNT";
    else if (prefix.startsWith("U")) prefix = "UPSTR";
    else if (prefix.startsWith("S")) prefix = "SOAR";
    else if (prefix.startsWith("A")) prefix = "ADV";

    const currentIndex = LEVEL_SEQUENCE.indexOf(prefix);
    if (currentIndex === -1 || currentIndex === LEVEL_SEQUENCE.length - 1) {
      return "";
    }
    const nextPrefix = LEVEL_SEQUENCE[currentIndex + 1];
    const nextClass = classesList.find((c) => {
      if (!c.classCode) return false;
      const cUpper = c.classCode.toUpperCase();
      if (cUpper.startsWith(nextPrefix)) return true;
      return cUpper.startsWith(nextPrefix[0]);
    });
    return nextClass ? nextClass.classCode : "";
  };

  const handleClassificationChange = (newVal: string) => {
    setFormClassification(newVal);
    if (newVal === "Combo") {
      // If we only have 1 cycle (L1) and it has a classCode
      if (formCycles.length === 1 && formCycles[0].classCode) {
        const c1 = formCycles[0].classCode;
        const c2Class = getNextLevelClassCode(c1);
        if (c2Class) {
          const c3Class = getNextLevelClassCode(c2Class);
          const nextCycles = [...formCycles];
          nextCycles.push({
            classCode: c2Class,
            finalScore: "",
            registeredWriting: false,
            registeredMocktest: false,
            registeredLuyenDe: false,
            homeworkPercent: "",
            attendanceCount: "",
          });
          if (c3Class) {
            nextCycles.push({
              classCode: c3Class,
              finalScore: "",
              registeredWriting: false,
              registeredMocktest: false,
              registeredLuyenDe: false,
              homeworkPercent: "",
              attendanceCount: "",
            });
          }
          setFormCycles(nextCycles);
        }
      }
    }
  };

  const updateFormCycleField = (index: number, field: keyof AcaStudentCycle, value: any) => {
    setFormCycles((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        [field]: value,
      };

      // If it is a combo and we just updated classCode, auto-suggest for subsequent cycles
      if (field === "classCode" && formClassification === "Combo") {
        let currentClassCode = value;
        for (let i = index + 1; i < next.length; i++) {
          const suggested = getNextLevelClassCode(currentClassCode);
          if (suggested) {
            next[i] = {
              ...next[i],
              classCode: suggested,
            };
            currentClassCode = suggested;
          } else {
            break;
          }
        }
      }
      return next;
    });
  };

  const handleToggleField = async (
    studentId: string, 
    field: "registeredWriting" | "registeredMocktest" | "registeredLuyenDe" |
           "registeredWriting2" | "registeredMocktest2" | "registeredLuyenDe2" |
           "registeredWriting3" | "registeredMocktest3" | "registeredLuyenDe3", 
    currentValue: boolean
  ) => {
    try {
      const updated = await updateAcaStudent(studentId, {
        [field]: !currentValue,
      });
      setStudentsList((prev) =>
        prev.map((s) => (s.id === studentId ? updated : s))
      );
    } catch (err: any) {
      alert("Cập nhật thất bại: " + err.message);
    }
  };

  const handleUpdateClassification = async (studentId: string, newClassification: string) => {
    try {
      const student = studentsList.find(s => s.id === studentId);
      if (newClassification === "Combo") {
        const cycles = student?.cycles || [];
        const validCycles = cycles.filter(cyc => cyc.classCode && cyc.classCode.trim() !== "");
        if (validCycles.length < 2) {
          alert("Học viên phân loại 'Combo' bắt buộc phải có từ 2 lần học (chặng học) với mã lớp hợp lệ trở lên.");
          return;
        }
      }
      const updated = await updateAcaStudent(studentId, {
        classification: newClassification,
      });
      setStudentsList((prev) =>
        prev.map((s) => (s.id === studentId ? updated : s))
      );
    } catch (err: any) {
      alert("Cập nhật phân loại thất bại: " + err.message);
    }
  };

  const openAddModal = () => {
    setModalMode("add");
    setCurrentStudentId(null);
    setFormName("");
    setFormClassId(classesList[0]?.id || "");
    setFormPhone("");
    setFormEmail("");
    setFormClassification("Lớp lẻ mới");
    setFormEntrance("");
    
    setFormRegisteredWriting(false);
    setFormRegisteredMocktest(false);
    setFormRegisteredLuyenDe(false);
    setFormHomeworkPercent("");
    setFormAttendanceCount("");

    setFormRegisteredWriting2(false);
    setFormRegisteredMocktest2(false);
    setFormRegisteredLuyenDe2(false);
    setFormHomeworkPercent2("");
    setFormAttendanceCount2("");

    setFormRegisteredWriting3(false);
    setFormRegisteredMocktest3(false);
    setFormRegisteredLuyenDe3(false);
    setFormHomeworkPercent3("");
    setFormAttendanceCount3("");

    setFormL1("");
    setFormF1("");
    setFormL2("");
    setFormF2("");
    setFormL3("");
    setFormF3("");
    setFormBcbLink("");
    setFormNote("");
    setFormCycles([
      {
        classCode: "",
        finalScore: "",
        registeredWriting: false,
        registeredMocktest: false,
        registeredLuyenDe: false,
        homeworkPercent: "",
        attendanceCount: "",
        scores: { l: "-", r: "-", w: "-", s: "-", o: "-" },
        finalScores: { l: "-", r: "-", w: "-", s: "-", o: "-" },
      }
    ]);
    setIsModalOpen(true);
  };

  const openEditModal = (student: AcaStudent) => {
    setModalMode("edit");
    setCurrentStudentId(student.id);
    setFormName(student.name);
    setFormClassId(student.classId);
    setFormPhone(student.phone);
    setFormEmail(student.email);
    setFormClassification(student.classification || "Lớp lẻ mới");
    setFormEntrance(
      student.scores?.o && student.scores.o !== "-"
        ? String(student.scores.o)
        : student.entrance || ""
    );
    
    setFormRegisteredWriting(!!student.registeredWriting);
    setFormRegisteredMocktest(!!student.registeredMocktest);
    setFormRegisteredLuyenDe(!!student.registeredLuyenDe);
    setFormHomeworkPercent(student.homeworkPercent || "");
    setFormAttendanceCount(student.attendanceCount || "");

    setFormRegisteredWriting2(!!student.registeredWriting2);
    setFormRegisteredMocktest2(!!student.registeredMocktest2);
    setFormRegisteredLuyenDe2(!!student.registeredLuyenDe2);
    setFormHomeworkPercent2(student.homeworkPercent2 || "");
    setFormAttendanceCount2(student.attendanceCount2 || "");

    setFormRegisteredWriting3(!!student.registeredWriting3);
    setFormRegisteredMocktest3(!!student.registeredMocktest3);
    setFormRegisteredLuyenDe3(!!student.registeredLuyenDe3);
    setFormHomeworkPercent3(student.homeworkPercent3 || "");
    setFormAttendanceCount3(student.attendanceCount3 || "");

    setFormL1(student.l1 || getClassInfo(student.classId).code || "");
    setFormF1(student.f1 || "");
    setFormL2(student.l2 || "");
    setFormF2(student.f2 || "");
    setFormL3(student.l3 || "");
    setFormF3(student.f3 || "");
    setFormBcbLink(student.bcbLink);
    setFormNote(student.note || "");

    // Populate formCycles with fallback logic
    let initialCycles: AcaStudentCycle[] = [];
    if (student.cycles && student.cycles.length > 0) {
      initialCycles = student.cycles.map(cyc => ({
        ...cyc,
        scores: cyc.scores || { l: "-", r: "-", w: "-", s: "-", o: "-" },
        finalScores: cyc.finalScores || { l: "-", r: "-", w: "-", s: "-", o: "-" }
      }));
    } else {
      // Reconstruct first 3 cycles from flat fields
      initialCycles.push({
        classCode: student.l1 || getClassInfo(student.classId).code || "",
        finalScore: student.f1 || "",
        registeredWriting: !!student.registeredWriting,
        registeredMocktest: !!student.registeredMocktest,
        registeredLuyenDe: !!student.registeredLuyenDe,
        homeworkPercent: student.homeworkPercent || "",
        attendanceCount: student.attendanceCount || "",
        scores: student.scores || { l: "-", r: "-", w: "-", s: "-", o: "-" },
        finalScores: student.finalScores || { l: "-", r: "-", w: "-", s: "-", o: "-" }
      });
      if (student.l2 || student.f2 || student.homeworkPercent2 || student.attendanceCount2) {
        initialCycles.push({
          classCode: student.l2 || "",
          finalScore: student.f2 || "",
          registeredWriting: !!student.registeredWriting2,
          registeredMocktest: !!student.registeredMocktest2,
          registeredLuyenDe: !!student.registeredLuyenDe2,
          homeworkPercent: student.homeworkPercent2 || "",
          attendanceCount: student.attendanceCount2 || "",
          scores: { l: "-", r: "-", w: "-", s: "-", o: "-" },
          finalScores: { l: "-", r: "-", w: "-", s: "-", o: "-" }
        });
      }
      if (student.l3 || student.f3 || student.homeworkPercent3 || student.attendanceCount3) {
        initialCycles.push({
          classCode: student.l3 || "",
          finalScore: student.f3 || "",
          registeredWriting: !!student.registeredWriting3,
          registeredMocktest: !!student.registeredMocktest3,
          registeredLuyenDe: !!student.registeredLuyenDe3,
          homeworkPercent: student.homeworkPercent3 || "",
          attendanceCount: student.attendanceCount3 || "",
          scores: { l: "-", r: "-", w: "-", s: "-", o: "-" },
          finalScores: { l: "-", r: "-", w: "-", s: "-", o: "-" }
        });
      }
    }
    setFormCycles(initialCycles);
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

    // Validate combo class requirement: must have at least 2 cycles with valid class code
    if (formClassification === "Combo") {
      const validCycles = formCycles.filter(cyc => cyc.classCode && cyc.classCode.trim() !== "");
      if (validCycles.length < 2) {
        alert("Học viên phân loại 'Combo' bắt buộc phải có từ 2 lần học (chặng học) với mã lớp hợp lệ trở lên.");
        return;
      }
    }

    const existing = currentStudentId ? studentsList.find((s) => s.id === currentStudentId) : null;
    
    // Extract first 3 cycles for legacy flat fields compatibility
    const c1 = formCycles[0] || {};
    const c2 = formCycles[1] || {};
    const c3 = formCycles[2] || {};

    const activeClass = classesList.find(c => c.id === formClassId);
    const activeClassCode = activeClass?.classCode || "";
    const activeIndex = formCycles.findIndex(cyc => cyc.classCode === activeClassCode);
    const activeIdx = activeIndex !== -1 ? activeIndex : 0;

    const activeCycle = formCycles[activeIdx] || {};
    const activeScores = activeCycle.scores || { l: "-", r: "-", w: "-", s: "-", o: "-" };
    const activeFinalScores = activeCycle.finalScores || { l: "-", r: "-", w: "-", s: "-", o: "-" };

    const payload = {
      classId: formClassId,
      name: formName,
      phone: formPhone,
      email: formEmail,
      classification: formClassification,
      scores: {
        l: activeScores.l || "-",
        r: activeScores.r || "-",
        w: activeScores.w || "-",
        s: activeScores.s || "-",
        o: activeScores.o || "-"
      },
      finalScores: {
        l: activeFinalScores.l || "-",
        r: activeFinalScores.r || "-",
        w: activeFinalScores.w || "-",
        s: activeFinalScores.s || "-",
        o: activeFinalScores.o || "-"
      },
      entrance: formEntrance,
      
      // Legacy Cycle 1 flat fields
      registeredWriting: !!c1.registeredWriting,
      registeredMocktest: !!c1.registeredMocktest,
      registeredLuyenDe: !!c1.registeredLuyenDe,
      homeworkPercent: c1.homeworkPercent || "",
      attendanceCount: c1.attendanceCount || "",
      l1: c1.classCode || "",
      f1: c1.finalScore || "",

      // Legacy Cycle 2 flat fields
      registeredWriting2: !!c2.registeredWriting,
      registeredMocktest2: !!c2.registeredMocktest,
      registeredLuyenDe2: !!c2.registeredLuyenDe,
      homeworkPercent2: c2.homeworkPercent || "",
      attendanceCount2: c2.attendanceCount || "",
      l2: c2.classCode || "",
      f2: c2.finalScore || "",

      // Legacy Cycle 3 flat fields
      registeredWriting3: !!c3.registeredWriting,
      registeredMocktest3: !!c3.registeredMocktest,
      registeredLuyenDe3: !!c3.registeredLuyenDe,
      homeworkPercent3: c3.homeworkPercent || "",
      attendanceCount3: c3.attendanceCount || "",
      l3: c3.classCode || "",
      f3: c3.finalScore || "",

      bcbLink: formBcbLink,
      note: formNote,
      cycles: formCycles,
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
        {loadError ? (
          <div className="rounded-2xl border border-warning/30 bg-warning/10 p-4 text-xs font-semibold text-warning">
            {loadError}
          </div>
        ) : null}

        {/* Filters Panel */}
        <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-2xl border border-zinc-200/80 shadow-sm justify-between">
          <div className="flex flex-wrap items-center gap-4 flex-1">
            {/* Year selector */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-black uppercase text-muted tracking-wider">Năm:</label>
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value === "all" ? "all" : Number(e.target.value))}
                className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-xs font-bold text-foreground outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
              >
                <option value="all">Tất cả</option>
                {availableYears.map((y: number) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Month selector */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-black uppercase text-muted tracking-wider">Tháng:</label>
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value === "all" ? "all" : Number(e.target.value))}
                className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-xs font-bold text-foreground outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
              >
                <option value="all">Tất cả</option>
                {Array.from({ length: 12 }).map((_, idx) => (
                  <option key={idx + 1} value={idx + 1}>
                    Tháng {idx + 1}
                  </option>
                ))}
              </select>
            </div>

            {/* Class selector (filtered by Year and Month) */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-black uppercase text-muted tracking-wider">Lớp học:</label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-xs font-bold text-foreground outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 max-w-[240px]"
              >
                <option value="all">Tất cả các lớp</option>
                {filteredClassesDropdown.map((cls: AcaClass) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.classCode
                      ? `[${displayClassCode(cls.classCode)}] ${cls.name}`
                      : cls.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Classification selector */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-black uppercase text-muted tracking-wider">Phân loại:</label>
              <select
                value={filterClassification}
                onChange={(e) => setFilterClassification(e.target.value)}
                className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-xs font-bold text-foreground outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
              >
                <option value="all">Tất cả phân loại</option>
                <option value="Lớp lẻ mới">Lớp lẻ mới</option>
                <option value="Combo">Combo</option>
                <option value="Học lại">Học lại</option>
                <option value="Chuyển lớp">Chuyển lớp</option>
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

        <AcademicWarningEmbeddedTable
          warnings={displayedWarnings}
          onChanged={() => {
            void listAcademicWarnings().then(setWarnings);
          }}
        />

        {/* Student List Table */}
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1500px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-[10px] font-black uppercase tracking-widest text-muted">
                  <th className="px-4 py-4 text-center w-12">STT</th>
                  <th className="px-4 py-4 text-center w-12">Chi tiết</th>
                  <th className="px-4 py-4 min-w-[150px]">Họ và tên</th>
                  <th className="px-4 py-4 min-w-[150px]">Phân loại</th>
                  <th className="px-4 py-4 min-w-[120px]">SĐT</th>
                  <th className="px-4 py-4 min-w-[185px]">Gmail</th>
                  <th className="px-4 py-4 text-center w-20">Entrance</th>
                  <th className="px-4 py-4 text-center min-w-[200px]">L1</th>
                  <th className="px-4 py-4 text-center w-28">Chấm Writing</th>
                  <th className="px-4 py-4 text-center w-24">Mocktest</th>
                  <th className="px-4 py-4 text-center w-28">Lớp luyện đề</th>
                  <th className="px-4 py-4 text-center w-24">Homework</th>
                  <th className="px-4 py-4 text-center w-24">Chuyên cần</th>
                  <th className="px-4 py-4 text-center w-16">F1</th>
                  <th className="px-4 py-4 min-w-[90px]">BCB</th>
                  <th className="px-4 py-4 min-w-[150px]">Ghi chú</th>
                  <th className="px-4 py-4 text-center min-w-[110px]">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-semibold text-zinc-700">
                {paginatedStudents.length > 0 ? (
                  paginatedStudents.map((st, idx) => (
                    <Fragment key={st.id || `student-row-${idx}`}>
                      <tr className="hover:bg-zinc-50/55 align-middle">
                        <td className="px-4 py-4 text-center tabular-nums text-zinc-400">
                          {(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                        </td>
                        
                        {/* Expand Toggle Chevron */}
                        <td className="px-4 py-4 text-center">
                          {(() => {
                            const totalCycles = Math.max(st.cycles?.length || 0, st.l3 ? 3 : (st.l2 ? 2 : 1));
                            return totalCycles > 1 ? (
                              <button
                                type="button"
                                onClick={() => toggleRowExpand(st.id)}
                                className="p-1 rounded-lg hover:bg-zinc-100 text-zinc-500 hover:text-primary transition-all shrink-0"
                                title="Xem các lần đăng ký tiếp theo"
                              >
                                <svg
                                  className={`w-4 h-4 transition-transform duration-200 ${expandedStudents[st.id] ? "rotate-180 text-primary" : ""}`}
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
                            );
                          })()}
                        </td>

                        <td className="px-4 py-4 font-black text-foreground">{st.name}</td>

                        <td className="px-4 py-4">
                          <select
                            value={st.classification || "Lớp lẻ mới"}
                            onChange={(e) => handleUpdateClassification(st.id, e.target.value)}
                            className={`h-8 rounded-xl px-3 text-[10px] font-black uppercase outline-none border border-transparent transition-all cursor-pointer ${
                              st.classification === "Combo"
                                ? "bg-purple-100 text-purple-700 focus:border-purple-300 focus:ring-2 focus:ring-purple-200/40"
                                : st.classification === "Lớp lẻ mới"
                                ? "bg-emerald-100 text-emerald-700 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-200/40"
                                : st.classification === "Học lại"
                                ? "bg-blue-100 text-blue-700 focus:border-blue-300 focus:ring-2 focus:ring-blue-200/40"
                                : "bg-orange-100 text-orange-700 focus:border-orange-300 focus:ring-2 focus:ring-orange-200/40"
                            }`}
                          >
                            <option value="Lớp lẻ mới">Lớp lẻ mới</option>
                            <option value="Combo">Combo</option>
                            <option value="Học lại">Học lại</option>
                            <option value="Chuyển lớp">Chuyển lớp</option>
                          </select>
                        </td>
                        <td className="px-4 py-4 tabular-nums text-zinc-500">{st.phone || "-"}</td>
                        <td className="px-4 py-4 text-zinc-500 truncate max-w-[180px]" title={st.email}>{st.email || "-"}</td>
                        <td className="px-4 py-4 text-center text-foreground font-black tabular-nums">
                          {st.scores?.o && st.scores.o !== "-" ? String(st.scores.o) : (st.entrance || "-")}
                        </td>
                        
                        {/* L1 Class Badge */}
                        <td className="px-4 py-4 text-center">
                          {(() => {
                            const c1 = getCycleData(st, 0);
                            const displayL1 = c1.classCode;
                            if (displayL1) {
                              const { name, teacher } = getClassInfoByCode(displayL1);
                              return (
                                <div className="flex flex-col items-center gap-0.5">
                                  <span
                                    className="inline-flex items-center gap-1 rounded-lg bg-secondary/10 px-2.5 py-0.5 font-black text-[10px] text-secondary cursor-default whitespace-nowrap"
                                    title={name || displayL1}
                                  >
                                    {displayClassCode(displayL1)}
                                  </span>
                                  {teacher && (
                                    <span className="text-[9.5px] text-zinc-400 font-bold" title={`Giáo viên: ${teacher}`}>
                                      GV: {teacher}
                                    </span>
                                  )}
                                </div>
                              );
                            }
                            return <span className="text-zinc-400">—</span>;
                          })()}
                        </td>
                        
                        {/* Interactive checkboxes L1 */}
                        <td className="px-4 py-4 text-center">
                          {(() => {
                            const c1 = getCycleData(st, 0);
                            return (
                              <input
                                type="checkbox"
                                checked={!!c1.registeredWriting}
                                onChange={() => handleToggleCycleField(st.id, 0, "registeredWriting", !!c1.registeredWriting)}
                                className="w-4.5 h-4.5 rounded text-primary border-zinc-300 focus:ring-primary cursor-pointer transition-all"
                              />
                            );
                          })()}
                        </td>
                        <td className="px-4 py-4 text-center">
                          {(() => {
                            const c1 = getCycleData(st, 0);
                            return (
                              <input
                                type="checkbox"
                                checked={!!c1.registeredMocktest}
                                onChange={() => handleToggleCycleField(st.id, 0, "registeredMocktest", !!c1.registeredMocktest)}
                                className="w-4.5 h-4.5 rounded text-primary border-zinc-300 focus:ring-primary cursor-pointer transition-all"
                              />
                            );
                          })()}
                        </td>
                        <td className="px-4 py-4 text-center">
                          {(() => {
                            const c1 = getCycleData(st, 0);
                            return (
                              <input
                                type="checkbox"
                                checked={!!c1.registeredLuyenDe}
                                onChange={() => handleToggleCycleField(st.id, 0, "registeredLuyenDe", !!c1.registeredLuyenDe)}
                                className="w-4.5 h-4.5 rounded text-primary border-zinc-300 focus:ring-primary cursor-pointer transition-all"
                              />
                            );
                          })()}
                        </td>

                        <td className="px-4 py-4 text-center tabular-nums text-zinc-500">
                          {(() => {
                            const c1 = getCycleData(st, 0);
                            return c1.homeworkPercent || "-";
                          })()}
                        </td>
                        <td className="px-4 py-4 text-center tabular-nums text-zinc-500">
                          {(() => {
                            const c1 = getCycleData(st, 0);
                            return c1.attendanceCount ? (
                              <span className="inline-flex items-center gap-1 rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-bold text-zinc-600">
                                {c1.attendanceCount}
                              </span>
                            ) : (
                              "-"
                            );
                          })()}
                        </td>
                        <td className="px-4 py-4 text-center font-bold text-foreground tabular-nums">
                          {(() => {
                            const c1 = getCycleData(st, 0);
                            return c1.finalScore || "-";
                          })()}
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <a
                              href={st.bcbLink || "/student#bcb-archive"}
                              target="_blank"
                              rel="noreferrer"
                              className="text-secondary hover:underline font-black"
                              title="Mở Bảng Chẩn Bệnh Chi Tiết (BCB)"
                            >
                              Xem ↗
                            </a>
                            <Link
                              href={`/aca/quan-ly/bcb?studentId=${st.id}`}
                              className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                              title="Chỉnh sửa chi tiết BCB cho học viên này"
                            >
                              Sửa BCB
                            </Link>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-zinc-500 font-medium max-w-[150px] truncate" title={st.note}>{st.note || "-"}</td>
                        <td className="px-4 py-4 text-center whitespace-nowrap">
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

                      {/* Expanded rows for L2+ dynamically in the main table grid */}
                      {(() => {
                        const totalCycles = Math.max(st.cycles?.length || 0, st.l3 ? 3 : (st.l2 ? 2 : 1));
                        if (!expandedStudents[st.id] || totalCycles <= 1) return null;

                        return Array.from({ length: totalCycles - 1 }).map((_, subIdx) => {
                          const cycleIdx = subIdx + 1;
                          const cyc = getCycleData(st, cycleIdx);
                          const prevCyc = getCycleData(st, cycleIdx - 1);
                          const entranceScore = prevCyc.finalScore || "-";

                          return (
                            <tr
                              key={`expanded-${st.id}-${cycleIdx}`}
                              className="bg-zinc-50/45 border-t border-zinc-150/60 align-middle hover:bg-zinc-100/30 transition-all"
                            >
                              {/* STT */}
                              <td className="px-4 py-3 text-center tabular-nums text-zinc-400"></td>
                              {/* Chi tiết / Chevron */}
                              <td className="px-4 py-3 text-center text-zinc-300 font-medium">—</td>
                              {/* Họ và tên */}
                              <td className="px-4 py-3 text-zinc-300 font-medium">—</td>
                              {/* Phân loại */}
                              <td className="px-4 py-3">
                                <span className="inline-flex items-center rounded-full bg-secondary/10 px-2.5 py-0.5 text-[10px] font-black uppercase text-secondary">
                                  Lần {cycleIdx + 1}
                                </span>
                              </td>
                              {/* SĐT */}
                              <td className="px-4 py-3 text-zinc-300 font-medium">—</td>
                              {/* Gmail */}
                              <td className="px-4 py-3 text-zinc-300 font-medium">—</td>
                              {/* Entrance of cycle (dynamic linkage!) */}
                              <td className="px-4 py-3 text-center text-zinc-600 font-black bg-zinc-50/25 tabular-nums">
                                {entranceScore}
                              </td>
                              {/* Class Code */}
                              <td className="px-4 py-3 text-center bg-secondary/5">
                                {cyc.classCode ? (
                                  (() => {
                                    const { name, teacher } = getClassInfoByCode(cyc.classCode);
                                    return (
                                      <div className="flex flex-col items-center gap-1">
                                        {cyc.classCode.split('\n').map((line, lIdx) => (
                                          <span
                                            key={lIdx}
                                            className="inline-flex items-center gap-1 rounded bg-secondary/10 px-2.5 py-0.5 font-black text-[10px] text-secondary cursor-default text-center break-words"
                                            title={name || line}
                                          >
                                            {line.trim()}
                                          </span>
                                        ))}
                                        {teacher && (
                                          <span className="text-[9.5px] text-zinc-400 font-bold" title={`Giáo viên: ${teacher}`}>
                                            GV: {teacher}
                                          </span>
                                        )}
                                      </div>
                                    );
                                  })()
                                ) : (
                                  <span className="text-zinc-400">—</span>
                                )}
                              </td>
                              
                              {/* Interactive checkboxes */}
                              <td className="px-4 py-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={!!cyc.registeredWriting}
                                  onChange={() => handleToggleCycleField(st.id, cycleIdx, "registeredWriting", !!cyc.registeredWriting)}
                                  className="w-4.5 h-4.5 rounded text-primary border-zinc-300 focus:ring-primary cursor-pointer transition-all"
                                />
                              </td>
                              <td className="px-4 py-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={!!cyc.registeredMocktest}
                                  onChange={() => handleToggleCycleField(st.id, cycleIdx, "registeredMocktest", !!cyc.registeredMocktest)}
                                  className="w-4.5 h-4.5 rounded text-primary border-zinc-300 focus:ring-primary cursor-pointer transition-all"
                                />
                              </td>
                              <td className="px-4 py-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={!!cyc.registeredLuyenDe}
                                  onChange={() => handleToggleCycleField(st.id, cycleIdx, "registeredLuyenDe", !!cyc.registeredLuyenDe)}
                                  className="w-4.5 h-4.5 rounded text-primary border-zinc-300 focus:ring-primary cursor-pointer transition-all"
                                />
                              </td>
                              
                              {/* Homework */}
                              <td className="px-4 py-3 text-center tabular-nums text-zinc-500">
                                {cyc.homeworkPercent || "-"}
                              </td>
                              {/* Chuyên cần */}
                              <td className="px-4 py-3 text-center tabular-nums text-zinc-500">
                                {cyc.attendanceCount ? (
                                  <span className="inline-flex items-center gap-1 rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-bold text-zinc-600">
                                    {cyc.attendanceCount}
                                  </span>
                                ) : (
                                  "-"
                                )}
                              </td>
                              {/* F_i score */}
                              <td className="px-4 py-3 text-center font-black text-foreground bg-zinc-50/25 tabular-nums">
                                {cyc.finalScore || "-"}
                              </td>
                              {/* BCB */}
                              <td className="px-4 py-3 text-zinc-300 font-medium">—</td>
                              {/* Ghi chú */}
                              <td className="px-4 py-3 text-zinc-300 font-medium">—</td>
                              {/* Hành động */}
                              <td className="px-4 py-3 text-zinc-300 font-medium">—</td>
                            </tr>
                          );
                        });
                      })()}
                    </Fragment>
                  ))
                ) : (
                  <tr>
                    <td colSpan={16} className="px-6 py-8 text-center text-zinc-400 font-medium">
                      Không tìm thấy học viên nào phù hợp với bộ lọc.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm mt-4 text-xs font-semibold">
            <div className="text-zinc-500">
              Đang xem <span className="font-bold text-zinc-800">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> -{" "}
              <span className="font-bold text-zinc-800">
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredStudents.length)}
              </span>{" "}
              trong tổng số <span className="font-bold text-zinc-800">{filteredStudents.length}</span> học viên
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
      </main>

      {/* CRUD MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl border border-zinc-200 max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in duration-200">
            <h3 className="text-sm font-black uppercase tracking-widest text-foreground mb-4 shrink-0">
              {modalMode === "add" ? "Thêm học viên mới" : "Chỉnh sửa thông tin học viên"}
            </h3>
            
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden text-xs font-semibold">
              <div className="overflow-y-auto pr-1 flex-1 space-y-6 py-1">
                
                {/* SECTION 1: BASIC INFORMATION */}
                <div className="bg-zinc-50/30 p-4 rounded-2xl border border-zinc-200 space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-primary border-b border-zinc-200/60 pb-2 flex items-center gap-1.5">
                    <span className="w-1.5 h-3.5 bg-primary rounded-full" />
                    Thông tin cơ bản
                  </h4>
                  
                  <div>
                    <label className="block text-[10px] font-black uppercase text-muted tracking-widest mb-1.5">Họ và Tên</label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Nhập tên học viên..."
                      className="h-10 w-full rounded-xl border border-zinc-200 px-4 font-bold text-foreground outline-none focus:border-primary/45 focus:ring-2 focus:ring-primary/10 bg-white"
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
                        className="h-10 w-full rounded-xl border border-zinc-200 px-4 font-bold text-foreground outline-none focus:border-primary/45 focus:ring-2 focus:ring-primary/10 bg-white"
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
                        className="h-10 w-full rounded-xl border border-zinc-200 px-4 font-bold text-foreground outline-none focus:border-primary/45 focus:ring-2 focus:ring-primary/10 bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-muted tracking-widest mb-1.5">Lớp học hiện tại</label>
                      <select
                        value={formClassId}
                        onChange={(e) => setFormClassId(e.target.value)}
                        className="h-10 w-full rounded-xl border border-zinc-200 px-4 font-bold text-foreground outline-none focus:border-primary/45 focus:ring-2 focus:ring-primary/10 bg-white"
                      >
                        {classesList.map((cls) => (
                          <option key={cls.id} value={cls.id}>
                            {cls.classCode
                              ? `[${displayClassCode(cls.classCode)}] ${cls.name}`
                              : cls.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-muted tracking-widest mb-1.5">Phân loại học viên</label>
                      <select
                        value={formClassification}
                        onChange={(e) => handleClassificationChange(e.target.value)}
                        className="h-10 w-full rounded-xl border border-zinc-200 px-4 font-bold text-foreground outline-none focus:border-primary/45 focus:ring-2 focus:ring-primary/10 bg-white"
                      >
                        <option value="Lớp lẻ mới">Lớp lẻ mới</option>
                        <option value="Combo">Combo</option>
                        <option value="Học lại">Học lại</option>
                        <option value="Chuyển lớp">Chuyển lớp</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* DYNAMIC CYCLE CARDS */}
                <div className="space-y-4">
                  {formCycles.map((cycle, index) => {
                    const isL1 = index === 0;
                    const prevCycle = !isL1 ? formCycles[index - 1] : null;
                    const activeClass = classesList.find(c => c.id === formClassId);
                    const activeClassCode = activeClass?.classCode || "";
                    const activeIdx = formCycles.findIndex(cyc => cyc.classCode === activeClassCode);
                    const isTodayActive = index === (activeIdx !== -1 ? activeIdx : 0);
                    const entranceVal = isL1 
                      ? formEntrance 
                      : (prevCycle?.finalScore ? `${prevCycle.finalScore} (Tự động từ F${index})` : "—");

                    return (
                      <div 
                        key={`form-cycle-${index}`}
                        className={`p-4 rounded-2xl border space-y-4 relative ${
                          isL1 
                            ? "bg-zinc-50/30 border-zinc-200" 
                            : "bg-secondary/5 border-secondary/20 shadow-sm"
                        }`}
                      >
                        <h4 className={`text-[10px] font-black uppercase tracking-wider border-b pb-2 flex items-center gap-1.5 ${
                          isL1 
                            ? "text-primary border-zinc-200/60" 
                            : "text-secondary border-secondary/15"
                        }`}>
                          <span className={`w-1.5 h-3.5 rounded-full ${isL1 ? "bg-primary" : "bg-secondary"}`} />
                          {isL1 ? "Học lần đầu (Lần 1 - L1)" : `Học lần thứ ${index + 1} (L${index + 1})`}
                        </h4>

                        {!isL1 && (
                          <button
                            type="button"
                            onClick={() => {
                              setFormCycles((prev) => prev.filter((_, idx) => idx !== index));
                            }}
                            className="absolute top-3 right-3 text-danger hover:text-red-500 text-[10px] font-black uppercase flex items-center gap-1 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg transition-all border border-red-200/40"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Xóa lần học
                          </button>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-black uppercase text-muted tracking-widest mb-1.5">Mã lớp L{index + 1}</label>
                            <select
                              value={cycle.classCode}
                              onChange={(e) => updateFormCycleField(index, "classCode", e.target.value)}
                              className="h-10 w-full rounded-xl border border-zinc-200 px-4 font-bold text-foreground outline-none focus:border-primary/45 focus:ring-2 focus:ring-primary/10 bg-white"
                            >
                              <option value="">-- Chọn mã lớp (Trống) --</option>
                              {classesList.map((cls) => (
                                <option key={cls.id} value={cls.classCode || ""}>
                                  {cls.classCode
                                    ? `[${displayClassCode(cls.classCode)}] ${cls.name}`
                                    : cls.name}
                                </option>
                              ))}
                              {cycle.classCode && !classesList.some((cls) => cls.classCode === cycle.classCode) && (
                                <option value={cycle.classCode}>
                                  {displayClassCode(cycle.classCode)} (Lớp hiện tại)
                                </option>
                              )}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-black uppercase text-muted tracking-widest mb-1.5">
                              {isL1 ? "Entrance L1 (Đầu vào gốc)" : `Điểm Entrance L${index + 1}`}
                            </label>
                            <div className="space-y-2">
                              {isL1 ? (
                                <input
                                  type="text"
                                  value={formEntrance}
                                  onChange={(e) => {
                                    setFormEntrance(e.target.value);
                                    updateCycleComponentScore(index, "scores", "o", e.target.value);
                                  }}
                                  placeholder="Điểm đầu vào (Overall)..."
                                  className="h-10 w-full rounded-xl border border-zinc-200 px-4 font-bold text-foreground outline-none focus:border-primary/45 focus:ring-2 focus:ring-primary/10 bg-white"
                                />
                              ) : (
                                <input
                                  type="text"
                                  disabled
                                  value={entranceVal}
                                  className="h-10 w-full rounded-xl border border-zinc-200 px-4 font-bold text-zinc-450 bg-zinc-100 outline-none cursor-not-allowed border-zinc-200/70"
                                />
                              )}
                              {isL1 && (
                                <div className="grid grid-cols-4 gap-2">
                                  <div>
                                    <label className="block text-[9px] font-black uppercase text-zinc-400 mb-0.5 text-center">L</label>
                                    <input
                                      type="text"
                                      value={cycle.scores?.l && cycle.scores.l !== "-" ? String(cycle.scores.l) : ""}
                                      onChange={(e) => updateCycleComponentScore(index, "scores", "l", e.target.value)}
                                      placeholder="-"
                                      className="h-8 w-full text-center rounded-lg border border-zinc-200 font-bold text-xs outline-none focus:border-primary/45 bg-white"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[9px] font-black uppercase text-zinc-400 mb-0.5 text-center">R</label>
                                    <input
                                      type="text"
                                      value={cycle.scores?.r && cycle.scores.r !== "-" ? String(cycle.scores.r) : ""}
                                      onChange={(e) => updateCycleComponentScore(index, "scores", "r", e.target.value)}
                                      placeholder="-"
                                      className="h-8 w-full text-center rounded-lg border border-zinc-200 font-bold text-xs outline-none focus:border-primary/45 bg-white"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[9px] font-black uppercase text-zinc-400 mb-0.5 text-center">W</label>
                                    <input
                                      type="text"
                                      value={cycle.scores?.w && cycle.scores.w !== "-" ? String(cycle.scores.w) : ""}
                                      onChange={(e) => updateCycleComponentScore(index, "scores", "w", e.target.value)}
                                      placeholder="-"
                                      className="h-8 w-full text-center rounded-lg border border-zinc-200 font-bold text-xs outline-none focus:border-primary/45 bg-white"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[9px] font-black uppercase text-zinc-400 mb-0.5 text-center">S</label>
                                    <input
                                      type="text"
                                      value={cycle.scores?.s && cycle.scores.s !== "-" ? String(cycle.scores.s) : ""}
                                      onChange={(e) => updateCycleComponentScore(index, "scores", "s", e.target.value)}
                                      placeholder="-"
                                      className="h-8 w-full text-center rounded-lg border border-zinc-200 font-bold text-xs outline-none focus:border-primary/45 bg-white"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="block text-[10px] font-black uppercase text-muted tracking-widest mb-1.5">Homework L{index + 1} (%)</label>
                            <input
                              type="text"
                              value={cycle.homeworkPercent}
                              onChange={(e) => updateFormCycleField(index, "homeworkPercent", e.target.value)}
                              placeholder="Ví dụ: 80%..."
                              className="h-10 w-full rounded-xl border border-zinc-200 px-4 font-bold text-foreground outline-none focus:border-primary/45 focus:ring-2 focus:ring-primary/10 bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black uppercase text-muted tracking-widest mb-1.5">Chuyên cần L{index + 1}</label>
                            <input
                              type="text"
                              value={cycle.attendanceCount}
                              onChange={(e) => updateFormCycleField(index, "attendanceCount", e.target.value)}
                              placeholder="Ví dụ: 15/18..."
                              className="h-10 w-full rounded-xl border border-zinc-200 px-4 font-bold text-foreground outline-none focus:border-primary/45 focus:ring-2 focus:ring-primary/10 bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black uppercase text-muted tracking-widest mb-1.5">Final L{index + 1} (F{index + 1})</label>
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={cycle.finalScore}
                                onChange={(e) => {
                                  updateFormCycleField(index, "finalScore", e.target.value);
                                  if (index === 0) setFormF1(e.target.value);
                                  else if (index === 1) setFormF2(e.target.value);
                                  else if (index === 2) setFormF3(e.target.value);
                                  updateCycleComponentScore(index, "finalScores", "o", e.target.value);
                                }}
                                placeholder="Điểm thi final (Overall)..."
                                className="h-10 w-full rounded-xl border border-zinc-200 px-4 font-bold text-foreground outline-none focus:border-primary/45 focus:ring-2 focus:ring-primary/10 bg-white"
                              />
                              <div className="grid grid-cols-4 gap-2">
                                <div>
                                  <label className="block text-[9px] font-black uppercase text-zinc-400 mb-0.5 text-center">L</label>
                                  <input
                                    type="text"
                                    value={cycle.finalScores?.l && cycle.finalScores.l !== "-" ? String(cycle.finalScores.l) : ""}
                                    onChange={(e) => updateCycleComponentScore(index, "finalScores", "l", e.target.value)}
                                    placeholder="-"
                                    className="h-8 w-full text-center rounded-lg border border-zinc-200 font-bold text-xs outline-none focus:border-primary/45 bg-white"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[9px] font-black uppercase text-zinc-400 mb-0.5 text-center">R</label>
                                  <input
                                    type="text"
                                    value={cycle.finalScores?.r && cycle.finalScores.r !== "-" ? String(cycle.finalScores.r) : ""}
                                    onChange={(e) => updateCycleComponentScore(index, "finalScores", "r", e.target.value)}
                                    placeholder="-"
                                    className="h-8 w-full text-center rounded-lg border border-zinc-200 font-bold text-xs outline-none focus:border-primary/45 bg-white"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[9px] font-black uppercase text-zinc-400 mb-0.5 text-center">W</label>
                                  <input
                                    type="text"
                                    value={cycle.finalScores?.w && cycle.finalScores.w !== "-" ? String(cycle.finalScores.w) : ""}
                                    onChange={(e) => updateCycleComponentScore(index, "finalScores", "w", e.target.value)}
                                    placeholder="-"
                                    className="h-8 w-full text-center rounded-lg border border-zinc-200 font-bold text-xs outline-none focus:border-primary/45 bg-white"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[9px] font-black uppercase text-zinc-400 mb-0.5 text-center">S</label>
                                  <input
                                    type="text"
                                    value={cycle.finalScores?.s && cycle.finalScores.s !== "-" ? String(cycle.finalScores.s) : ""}
                                    onChange={(e) => updateCycleComponentScore(index, "finalScores", "s", e.target.value)}
                                    placeholder="-"
                                    className="h-8 w-full text-center rounded-lg border border-zinc-200 font-bold text-xs outline-none focus:border-primary/45 bg-white"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-black uppercase text-muted tracking-widest mb-1.5">Dịch vụ Lần {index + 1}</label>
                          <div className="flex gap-6 items-center bg-white p-3 rounded-xl border border-zinc-200">
                            <label className="flex items-center gap-2 font-bold cursor-pointer text-zinc-700">
                              <input
                                type="checkbox"
                                checked={!!cycle.registeredWriting}
                                onChange={(e) => updateFormCycleField(index, "registeredWriting", e.target.checked)}
                                className="w-4.5 h-4.5 rounded text-primary border-zinc-300 focus:ring-primary cursor-pointer"
                              />
                              <span>Chấm Writing</span>
                            </label>
                            <label className="flex items-center gap-2 font-bold cursor-pointer text-zinc-700">
                              <input
                                type="checkbox"
                                checked={!!cycle.registeredMocktest}
                                onChange={(e) => updateFormCycleField(index, "registeredMocktest", e.target.checked)}
                                className="w-4.5 h-4.5 rounded text-primary border-zinc-300 focus:ring-primary cursor-pointer"
                              />
                              <span>Mocktest</span>
                            </label>
                            <label className="flex items-center gap-2 font-bold cursor-pointer text-zinc-700">
                              <input
                                type="checkbox"
                                checked={!!cycle.registeredLuyenDe}
                                onChange={(e) => updateFormCycleField(index, "registeredLuyenDe", e.target.checked)}
                                className="w-4.5 h-4.5 rounded text-primary border-zinc-300 focus:ring-primary cursor-pointer"
                              />
                              <span>Lớp luyện đề</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => {
                      setFormCycles((prev) => {
                        const lastCycle = prev[prev.length - 1];
                        const suggestedClass = formClassification === "Combo" && lastCycle
                          ? getNextLevelClassCode(lastCycle.classCode)
                          : "";
                        return [
                          ...prev,
                          {
                            classCode: suggestedClass,
                            finalScore: "",
                            registeredWriting: false,
                            registeredMocktest: false,
                            registeredLuyenDe: false,
                            homeworkPercent: "",
                            attendanceCount: "",
                          },
                        ];
                      });
                    }}
                    className="w-full py-3.5 rounded-2xl border-2 border-dashed border-primary/30 text-primary hover:border-primary hover:bg-primary/5 text-xs font-black uppercase transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Thêm lần học mới (L{formCycles.length + 1}) +
                  </button>
                </div>

                {/* SECTION 4: EXTRA INFO */}
                <div className="bg-zinc-50/30 p-4 rounded-2xl border border-zinc-200 space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-zinc-700 border-b border-zinc-200/60 pb-2 flex items-center gap-1.5">
                    <span className="w-1.5 h-3.5 bg-zinc-350 rounded-full" />
                    Hồ sơ chẩn đoán & Ghi chú bổ sung
                  </h4>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-muted tracking-widest mb-1.5">Link bảng điểm chẩn đoán BCB</label>
                    <input
                      type="text"
                      value={formBcbLink}
                      onChange={(e) => setFormBcbLink(e.target.value)}
                      placeholder="Đường dẫn Google Sheets..."
                      className="h-10 w-full rounded-xl border border-zinc-200 px-4 font-bold text-foreground outline-none focus:border-primary/45 focus:ring-2 focus:ring-primary/10 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-muted tracking-widest mb-1.5">Ghi chú thêm</label>
                    <input
                      type="text"
                      value={formNote}
                      onChange={(e) => setFormNote(e.target.value)}
                      placeholder="Nhập ghi chú (học bổng, lịch học đặc biệt...)"
                      className="h-10 w-full rounded-xl border border-zinc-200 px-4 font-bold text-foreground outline-none focus:border-primary/45 focus:ring-2 focus:ring-primary/10 bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-150 shrink-0 mt-4">
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
        templateDescription="Các cột hợp lệ: Tên học viên (bắt buộc), Email (bắt buộc), Số điện thoại, Tên lớp học, Phân loại (Lớp lẻ mới/Combo/Học lại/Chuyển lớp), Entrance, L1, F1, L2, F2, L3, F3, Chấm Writing, Mocktest, Lớp luyện đề, Homework (%), Chuyên cần, Link BCB, Ghi chú."
      />
    </AcaLayout>
  );
}
