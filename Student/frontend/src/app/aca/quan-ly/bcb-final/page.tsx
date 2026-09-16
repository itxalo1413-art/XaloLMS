"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AcaLayout } from "@/components/aca/AcaLayout";
import { AcaTopbar } from "@/components/aca/AcaTopbar";
import {
  createFinalTestRecord,
  deleteFinalTestRecord,
  FINAL_TEST_UPDATE_EVENT,
  listFinalTestRecords,
  confirmFinalTestRecord,
  updateFinalTestRecord,
  type FinalTestRecord,
} from "@/lib/finalTestArchive";
import { fetchAcaStudents, fetchAcaClasses, shortClassLabel, type AcaStudent, type AcaClass } from "@/lib/acaManagementApi";
import {
  getGraderOptions,
  syncGraderOptions,
  GRADER_OPTIONS_EVENT,
} from "@/lib/mockTestTeacherNames";
import { FinalTestBcbEditorSection } from "@/components/shared/FinalTestBcbEditorSection";
import { confirmDialog } from "@/components/shared/ConfirmDialog";
import { getCachedAuthUser } from "@/lib/auth";

const ACA_MEET_LINK = "https://meet.google.com/vdy-dhpa-djj";

function calculateOverall(l?: string, r?: string, w?: string, s?: string): string {
  const nl = parseFloat(l || "0");
  const nr = parseFloat(r || "0");
  const nw = parseFloat(w || "0");
  const ns = parseFloat(s || "0");
  if (!nl && !nr && !nw && !ns) return "0.0";
  const avg = (nl + nr + nw + ns) / 4;
  // Round to nearest 0.5 in IELTS scoring
  const rounded = Math.round(avg * 2) / 2;
  return rounded.toFixed(1);
}

export default function AcaBcbFinalPage() {
  const [records, setRecords] = useState<FinalTestRecord[]>([]);
  const [students, setStudents] = useState<AcaStudent[]>([]);
  const [classes, setClasses] = useState<AcaClass[]>([]);
  const [loading, setLoading] = useState(true);

  // Popup BCB Final Editor modal (Chỉ điền L & R, Writing & Speaking do Grader chấm)
  const [popupBcbRecord, setPopupBcbRecord] = useState<FinalTestRecord | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [checkFilter, setCheckFilter] = useState<"all" | "checked" | "unchecked">("all");
  const [resultFilter, setResultFilter] = useState<"all" | "Đạt" | "Không đạt">("all");

  // Selected for Add/Edit basic candidate modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<FinalTestRecord | null>(null);

  // Copied meet toast
  const [copiedMeet, setCopiedMeet] = useState(false);

  // Form states for Add / Edit
  const [candidateName, setCandidateName] = useState("");
  const [candidatePhone, setCandidatePhone] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");
  const [classCode, setClassCode] = useState("");
  const [classification, setClassification] = useState("M/U");
  const [examDate, setExamDate] = useState("");
  const [speakingDate, setSpeakingDate] = useState("");
  const [speakingTime, setSpeakingTime] = useState("18:00");
  const [submissionFolderLink, setSubmissionFolderLink] = useState("");
  const [examFolderLink, setExamFolderLink] = useState("");
  const [scoreListening, setScoreListening] = useState("");
  const [scoreReading, setScoreReading] = useState("");
  const [scoreWriting, setScoreWriting] = useState("");
  const [scoreSpeaking, setScoreSpeaking] = useState("");
  const [scoreOverall, setScoreOverall] = useState("");
  const [bcbSpreadsheetLink, setBcbSpreadsheetLink] = useState("");
  const [graderW, setGraderW] = useState("Bộ phận Grader 1");
  const [hasTakenTest, setHasTakenTest] = useState(true);
  const [isChecked, setIsChecked] = useState(false);
  const [resultStatus, setResultStatus] = useState<"Đạt" | "Không đạt">("Không đạt");
  const [isDone, setIsDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [graderOptions, setGraderOptions] = useState<string[]>(() => getGraderOptions());

  useEffect(() => {
    void syncGraderOptions().then(setGraderOptions);
    const onGraders = () => setGraderOptions(getGraderOptions());
    window.addEventListener(GRADER_OPTIONS_EVENT, onGraders);
    return () => window.removeEventListener(GRADER_OPTIONS_EVENT, onGraders);
  }, []);

  const loadData = useCallback(() => {
    setLoading(true);
    void Promise.all([
      listFinalTestRecords(),
      fetchAcaStudents().catch(() => []),
      fetchAcaClasses().catch(() => []),
    ])
      .then(([recs, stList, clList]) => {
        setRecords(recs);
        setStudents(stList);
        setClasses(clList);
      })
      .finally(() => setLoading(false));
  }, []);

  // Chỉ học viên đã đăng ký Final Test; ẩn khi đã DONE + đã trả điểm
  const combinedRecords = useMemo(() => {
    // 1. Group records by student
    const studentGroupMap = new Map<string, FinalTestRecord[]>();

    for (const r of records) {
      if (r.status === "cancelled") continue;
      // Đã đánh dấu xong và đã trả điểm → không còn trên bảng quản lý BCB
      if (r.isDone && r.isChecked) continue;

      const st = students.find(
        (s) =>
          (r.studentId && r.studentId === s.id) ||
          (r.candidateEmail &&
            s.email &&
            r.candidateEmail.trim().toLowerCase() === s.email.trim().toLowerCase()) ||
          (r.candidateName &&
            s.name &&
            r.candidateName.trim().toLowerCase() === s.name.trim().toLowerCase() &&
            r.candidatePhone &&
            s.phone &&
            r.candidatePhone.replace(/\D/g, "") === s.phone.replace(/\D/g, "")),
      );

      const rawClass =
        st?.l1 && st.l1 !== "-"
          ? st.l1
          : r.classCode || r.className || "Chưa xếp lớp";
      const realClass = rawClass !== "Chưa xếp lớp" ? shortClassLabel(rawClass) : rawClass;

      const studentKey =
        st?.id ||
        (r.studentId && r.studentId.trim()) ||
        (r.candidateEmail && r.candidateEmail.trim().toLowerCase()) ||
        (r.candidateName && r.candidatePhone
          ? `${r.candidateName.trim().toLowerCase()}_${r.candidatePhone.replace(/\D/g, "")}`
          : r.id);

      const existing = studentGroupMap.get(studentKey) || [];
      existing.push({
        ...r,
        studentId: st?.id || r.studentId,
        candidateName: st?.name || r.candidateName,
        candidatePhone: st?.phone || r.candidatePhone,
        candidateEmail: st?.email || r.candidateEmail,
        classCode: realClass,
        className: realClass,
      });
      studentGroupMap.set(studentKey, existing);
    }

    // 2. Merge each student's records into 1 unified row
    const list: FinalTestRecord[] = [];
    for (const group of studentGroupMap.values()) {
      if (group.length === 1) {
        list.push(group[0]);
        continue;
      }

      // Find LR entry (has date for LR or testType lr/full)
      const lrEntry =
        group.find((g) => g.testType === "lr" || (g.testType === "full_4_skills" && g.date)) ||
        group[0];
      // Find Speaking entry
      const spkEntry = group.find(
        (g) =>
          g.testType === "speaking" ||
          g.speakingDate ||
          (g.testType === "full_4_skills" && g.speakingDate),
      );

      const unified: FinalTestRecord = {
        ...lrEntry,
        speakingDate:
          spkEntry?.speakingDate ||
          (spkEntry?.testType === "speaking" ? spkEntry.date : lrEntry.speakingDate),
        speakingTime:
          spkEntry?.speakingTime ||
          (spkEntry?.testType === "speaking" ? spkEntry.time : lrEntry.speakingTime),
        graderSpeaking:
          spkEntry?.graderSpeaking ||
          (spkEntry?.testType === "speaking" ? spkEntry.examinerName : lrEntry.graderSpeaking),
        examinerName:
          lrEntry.examinerName || spkEntry?.examinerName || "ACA / Hội đồng khảo thí",
        meetLink: spkEntry?.meetLink || lrEntry.meetLink,
        scoreListening:
          lrEntry.scoreListening || group.find((g) => g.scoreListening)?.scoreListening,
        scoreReading:
          lrEntry.scoreReading || group.find((g) => g.scoreReading)?.scoreReading,
        scoreWriting:
          lrEntry.scoreWriting || group.find((g) => g.scoreWriting)?.scoreWriting,
        scoreSpeaking:
          spkEntry?.scoreSpeaking || group.find((g) => g.scoreSpeaking)?.scoreSpeaking,
        scoreOverall:
          lrEntry.scoreOverall || group.find((g) => g.scoreOverall)?.scoreOverall,
        graderWTask1:
          lrEntry.graderWTask1 || group.find((g) => g.graderWTask1)?.graderWTask1,
        graderWTask2:
          lrEntry.graderWTask2 || group.find((g) => g.graderWTask2)?.graderWTask2,
        submissionFolderLink:
          lrEntry.submissionFolderLink ||
          group.find((g) => g.submissionFolderLink)?.submissionFolderLink,
        examFolderLink:
          lrEntry.examFolderLink ||
          group.find((g) => g.examFolderLink)?.examFolderLink,
        bcbSpreadsheetLink:
          lrEntry.bcbSpreadsheetLink ||
          group.find((g) => g.bcbSpreadsheetLink)?.bcbSpreadsheetLink,
        isChecked: group.some((g) => g.isChecked),
        hasTakenTest: group.some((g) => g.hasTakenTest),
        resultStatus:
          lrEntry.resultStatus || group.find((g) => g.resultStatus)?.resultStatus,
        isDone: group.every((g) => g.isDone),
        testType: "full_4_skills",
      };
      list.push(unified);
    }

    return list;
  }, [students, records]);

  // Sync popupBcbRecord when records update
  useEffect(() => {
    if (popupBcbRecord) {
      const found = combinedRecords.find((r) => r.id === popupBcbRecord.id);
      if (found) setPopupBcbRecord(found);
    }
  }, [combinedRecords]);

  // Lock body scroll when popup is open
  useEffect(() => {
    if (!popupBcbRecord && !isAddModalOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [popupBcbRecord, isAddModalOpen]);

  useEffect(() => {
    loadData();
    window.addEventListener(FINAL_TEST_UPDATE_EVENT, loadData);
    window.addEventListener("storage", loadData);
    return () => {
      window.removeEventListener(FINAL_TEST_UPDATE_EVENT, loadData);
      window.removeEventListener("storage", loadData);
    };
  }, [loadData]);



  // Speaking test date mapping by student
  const speakingDateMap = useMemo(() => {
    const map = new Map<string, { date: string; time: string; teacher?: string }>();
    for (const r of combinedRecords) {
      if (r.testType === "speaking" || r.testType === "full_4_skills") {
        const keys = [r.studentId, r.candidateName, r.candidatePhone, r.candidateEmail].filter(Boolean) as string[];
        for (const k of keys) {
          if (!map.has(k)) {
            map.set(k, {
              date: r.speakingDate || r.date,
              time: r.speakingTime || r.time,
              teacher: r.examinerName || r.graderSpeaking,
            });
          }
        }
      }
    }
    return map;
  }, [combinedRecords]);

  // Unique Classes list for filtering based on real classes
  const classOptions = useMemo(() => {
    const set = new Set<string>();
    classes.forEach((c) => {
      const code = shortClassLabel(c.classCode, c.name);
      if (code) set.add(code);
    });
    combinedRecords.forEach((r) => {
      const code = shortClassLabel(r.classCode, r.className);
      if (code && code !== "Chưa xếp lớp") set.add(code);
    });
    return Array.from(set).sort();
  }, [classes, combinedRecords]);

  // Filtered List
  const filtered = useMemo(() => {
    let list = combinedRecords;

    if (classFilter !== "all") {
      list = list.filter((r) => r.classCode === classFilter || r.className === classFilter);
    }

    if (checkFilter === "checked") {
      list = list.filter((r) => r.isChecked === true);
    } else if (checkFilter === "unchecked") {
      list = list.filter((r) => !r.isChecked);
    }

    if (resultFilter !== "all") {
      list = list.filter((r) => r.resultStatus === resultFilter);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.candidateName.toLowerCase().includes(q) ||
          r.candidatePhone.includes(q) ||
          (r.candidateEmail && r.candidateEmail.toLowerCase().includes(q)) ||
          (r.classCode && r.classCode.toLowerCase().includes(q)) ||
          (r.className && r.className.toLowerCase().includes(q)) ||
          (r.classification && r.classification.toLowerCase().includes(q)) ||
          (r.graderSpeaking && r.graderSpeaking.toLowerCase().includes(q)) ||
          (r.graderWTask1 && r.graderWTask1.toLowerCase().includes(q)) ||
          (r.graderWTask2 && r.graderWTask2.toLowerCase().includes(q))
      );
    }

    return list;
  }, [combinedRecords, classFilter, checkFilter, resultFilter, search]);

  // Summary Metrics: Tổng số học viên
  const stats = useMemo(() => {
    const total = combinedRecords.length;
    const taken = combinedRecords.filter((r) => r.hasTakenTest).length;
    const checked = combinedRecords.filter((r) => r.isChecked).length;
    const passed = combinedRecords.filter((r) => r.resultStatus === "Đạt").length;
    const failed = combinedRecords.filter((r) => r.resultStatus === "Không đạt").length;
    return { total, taken, checked, passed, failed };
  }, [combinedRecords]);

  // Handle fast toggle for "Check" (Trả kết quả về học viên)
  const handleToggleCheck = async (record: FinalTestRecord) => {
    const nextVal = !record.isChecked;
    try {
      await confirmFinalTestRecord(record.id, nextVal, getCachedAuthUser()?.name);
      loadData();
    } catch (err: any) {
      alert("Xác nhận trả kết quả thất bại: " + err.message);
    }
  };

  // Handle fast toggle for "Đã thi"
  const handleToggleTaken = async (record: FinalTestRecord) => {
    const nextVal = !record.hasTakenTest;
    try {
      await updateFinalTestRecord(record.id, { hasTakenTest: nextVal });
      loadData();
    } catch (err: any) {
      alert("Cập nhật Đã thi thất bại: " + err.message);
    }
  };

  // Handle fast toggle for "DONE"
  const handleToggleDone = async (record: FinalTestRecord) => {
    const nextVal = !record.isDone;
    try {
      await updateFinalTestRecord(record.id, { isDone: nextVal });
      loadData();
    } catch (err: any) {
      alert("Cập nhật DONE thất bại: " + err.message);
    }
  };

  // Handle fast toggle for "Đạt / Không đạt"
  const handleToggleResult = async (record: FinalTestRecord) => {
    const nextVal: "Đạt" | "Không đạt" = record.resultStatus === "Đạt" ? "Không đạt" : "Đạt";
    try {
      await updateFinalTestRecord(record.id, { resultStatus: nextVal });
      loadData();
    } catch (err: any) {
      alert("Cập nhật Đạt/Không đạt thất bại: " + err.message);
    }
  };

  // Học viên tự đăng ký người chấm S; ACA chỉ phân công Grader Writing (1 cột W).
  const handleUpdateGraderW = async (recordId: string, value: string) => {
    try {
      const updates = { graderWTask1: value, graderWTask2: value };
      await updateFinalTestRecord(recordId, updates);
      setRecords((prev) =>
        prev.map((r) => (r.id === recordId ? { ...r, ...updates } : r))
      );
    } catch (err: any) {
      alert("Cập nhật Grader chấm W thất bại: " + err.message);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const ok = await confirmDialog({
      title: "Xóa bản ghi BCB Final",
      message: `Bạn có chắc chắn muốn xóa bản ghi BCB Final của học viên "${name}" không?\nThao tác này sẽ xóa vĩnh viễn trên hệ thống.`,
      confirmText: "Đồng ý xóa",
      cancelText: "Giữ lại",
      variant: "danger",
    });
    if (!ok) return;
    try {
      await deleteFinalTestRecord(id);
      loadData();
    } catch (err: any) {
      alert("Xóa thất bại: " + err.message);
    }
  };

  const openAddModal = () => {
    setEditingRecord(null);
    setCandidateName("");
    setCandidatePhone("");
    setCandidateEmail("");
    setClassCode("Final M311025");
    setClassification("M/U");
    setExamDate(new Date().toISOString().split("T")[0]);
    setSpeakingDate("");
    setSpeakingTime("18:00");
    setSubmissionFolderLink("");
    setExamFolderLink("");
    setScoreListening("");
    setScoreReading("");
    setScoreWriting("");
    setScoreSpeaking("");
    setScoreOverall("");
    setBcbSpreadsheetLink("");
    setGraderW("Bộ phận Grader 1");
    setHasTakenTest(true);
    setIsChecked(false);
    setResultStatus("Không đạt");
    setIsDone(false);
    setIsAddModalOpen(true);
  };

  const openEditModal = (r: FinalTestRecord) => {
    setEditingRecord(r);
    setCandidateName(r.candidateName || "");
    setCandidatePhone(r.candidatePhone || "");
    setCandidateEmail(r.candidateEmail || "");
    setClassCode(r.classCode || r.className || "Final M311025");
    setClassification(r.classification || "M/U");
    setExamDate(r.examDate || r.date || "");
    setSpeakingDate(r.speakingDate || (r.testType === "speaking" ? r.date : ""));
    setSpeakingTime(r.speakingTime || (r.testType === "speaking" ? r.time : "18:00"));
    setSubmissionFolderLink(r.submissionFolderLink || "");
    setExamFolderLink(r.examFolderLink || "");
    setScoreListening(r.scoreListening || "");
    setScoreReading(r.scoreReading || "");
    setScoreWriting(r.scoreWriting || "");
    setScoreSpeaking(r.scoreSpeaking || "");
    setScoreOverall(r.scoreOverall || "");
    setBcbSpreadsheetLink(r.bcbSpreadsheetLink || "");
    setGraderW(r.graderWTask1 || r.graderWTask2 || "Bộ phận Grader 1");
    setHasTakenTest(r.hasTakenTest ?? false);
    setIsChecked(r.isChecked ?? false);
    setResultStatus(r.resultStatus || "Không đạt");
    setIsDone(r.isDone ?? false);
    setIsAddModalOpen(true);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateName.trim()) {
      alert("Vui lòng nhập Tên học viên.");
      return;
    }
    setSaving(true);
    try {
      const computedO = scoreOverall.trim() || calculateOverall(scoreListening, scoreReading, scoreWriting, scoreSpeaking);
      const payload = {
        candidateName: candidateName.trim(),
        candidatePhone: candidatePhone.trim(),
        candidateEmail: candidateEmail.trim() || undefined,
        classCode: classCode.trim(),
        className: classCode.trim(),
        classification: classification.trim(),
        testType: "full_4_skills" as const,
        format: "online" as const,
        // Không ghi đè examinerName / graderSpeaking — học viên tự đăng ký người chấm S
        date: examDate.trim() || new Date().toISOString().split("T")[0],
        examDate: examDate.trim() || undefined,
        speakingDate: speakingDate.trim() || undefined,
        speakingTime: speakingTime.trim() || undefined,
        time: editingRecord?.time || "18:00",
        meetLink: editingRecord?.meetLink || ACA_MEET_LINK,
        submissionFolderLink: submissionFolderLink.trim() || undefined,
        examFolderLink: examFolderLink.trim() || undefined,
        scoreListening: scoreListening.trim() || undefined,
        scoreReading: scoreReading.trim() || undefined,
        scoreWriting: scoreWriting.trim() || undefined,
        scoreSpeaking: scoreSpeaking.trim() || undefined,
        scoreOverall: computedO || undefined,
        bcbSpreadsheetLink: bcbSpreadsheetLink.trim() || undefined,
        graderWTask1: graderW.trim() || undefined,
        graderWTask2: graderW.trim() || undefined,
        hasTakenTest,
        isChecked,
        resultStatus,
        isDone,
        status: (scoreOverall || scoreSpeaking || scoreWriting) ? ("graded" as const) : ("scheduled" as const),
      };

      if (editingRecord) {
        await updateFinalTestRecord(editingRecord.id, payload);
      } else {
        await createFinalTestRecord(payload);
      }
      setIsAddModalOpen(false);
      loadData();
    } catch (err: any) {
      alert("Lỗi khi lưu: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AcaLayout>
      <div className="space-y-6 max-w-full pb-16">
        <AcaTopbar title="Quản Lý Bảng Chẩn Bệnh (BCB) Final" />

        {/* ── Summary Stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-center shadow-xs">
            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Tổng Thí Sinh Final</div>
            <div className="text-xl font-black text-zinc-900 mt-1 tabular-nums">{stats.total}</div>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-center shadow-xs">
            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Đã Thi</div>
            <div className="text-xl font-black text-sky-700 mt-1 tabular-nums">{stats.taken}</div>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 text-center shadow-xs">
            <div className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">Đã Check (Trả KQ)</div>
            <div className="text-xl font-black text-emerald-700 mt-1 tabular-nums">{stats.checked}</div>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-center shadow-xs">
            <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Đạt Chuẩn</div>
            <div className="text-xl font-black text-emerald-600 mt-1 tabular-nums">{stats.passed}</div>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-center shadow-xs">
            <div className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">Không Đạt</div>
            <div className="text-xl font-black text-rose-600 mt-1 tabular-nums">{stats.failed}</div>
          </div>
        </div>

        {/* ── Filter Toolbar ── */}
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            {/* Search */}
            <div className="relative min-w-[220px] flex-1 sm:flex-initial">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm tên, SĐT, lớp, grader..."
                className="h-9 w-full rounded-xl border border-zinc-200 bg-white px-3 pl-8 text-xs text-zinc-900 placeholder-zinc-400 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all shadow-xs"
              />
              <svg
                className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 pointer-events-none"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Class Filter */}
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="h-9 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-bold text-zinc-700 outline-none focus:border-primary cursor-pointer shadow-xs"
            >
              <option value="all">Tất cả lớp học</option>
              {classOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Check Filter */}
            <select
              value={checkFilter}
              onChange={(e) => setCheckFilter(e.target.value as any)}
              className="h-9 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-bold text-zinc-700 outline-none focus:border-primary cursor-pointer shadow-xs"
            >
              <option value="all">Tất cả trạng thái Check</option>
              <option value="checked">Đã Check (Đã trả kết quả cho học viên)</option>
              <option value="unchecked">Chưa Check (Chưa công bố)</option>
            </select>

            {/* Result Filter */}
            <select
              value={resultFilter}
              onChange={(e) => setResultFilter(e.target.value as any)}
              className="h-9 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-bold text-zinc-700 outline-none focus:border-primary cursor-pointer shadow-xs"
            >
              <option value="all">Tất cả kết quả</option>
              <option value="Đạt">Đạt</option>
              <option value="Không đạt">Không đạt</option>
            </select>
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-[#6a5acd] px-4 py-2 text-xs font-black text-white transition-all shadow-md hover:shadow-primary/20 shrink-0 cursor-pointer"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            + Thêm Thí Sinh Final Test
          </button>
        </div>

        {/* ── Main BCB Final Spreadsheet Table ── */}
        <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-soft">
          {loading ? (
            <div className="p-12 text-center text-zinc-400 text-xs font-bold">Đang tải bảng BCB Final...</div>
          ) : filtered.length === 0 ? (
            <div className="p-16 text-center space-y-2">
              <div className="text-sm font-bold text-zinc-800">Chưa có ca Final cần xử lý BCB</div>
              <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
                Bảng chỉ hiện học viên đã đăng ký thi và chưa hoàn tất (DONE + trả điểm). Khi đã xong và trả điểm, dòng sẽ tự ẩn khỏi đây.
              </p>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                Nhấn &quot;+ Thêm Thí Sinh Final Test&quot; để nhập thông tin hoặc chỉnh sửa dữ liệu thi.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse whitespace-nowrap">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50/90 text-[10px] font-black uppercase tracking-wider text-zinc-600">
                    <th className="px-3 py-3.5 text-center">Đã thi</th>
                    <th className="px-4 py-3.5">Tên</th>
                    <th className="px-3 py-3.5">SĐT</th>
                    <th className="px-4 py-3.5">Email</th>
                    <th className="px-4 py-3.5">Lớp học</th>
                    <th className="px-3.5 py-3.5">Ngày thi</th>
                    <th className="px-3.5 py-3.5">Ngày thi Speaking</th>
                    <th className="px-3 py-3.5 text-center">FOLDER BÀI LÀM</th>
                    <th className="px-3 py-3.5 text-center">FOLDER ĐỀ GỐC</th>
                    <th className="px-2.5 py-3.5 text-center">L</th>
                    <th className="px-2.5 py-3.5 text-center">R</th>
                    <th className="px-2.5 py-3.5 text-center">W</th>
                    <th className="px-2.5 py-3.5 text-center">S</th>
                    <th className="px-3 py-3.5 text-center">O</th>
                    <th className="px-3 py-3.5">Chấm W</th>
                    <th className="px-4 py-3.5 text-center bg-amber-50/80 text-amber-900 border-x border-amber-200/60">
                      Check (Duyệt Trả KQ)
                    </th>
                    <th className="px-3 py-3.5 text-center">Đạt/Không đạt</th>
                    <th className="px-3 py-3.5 text-center">DONE</th>
                    <th className="px-3 py-3.5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 font-medium">
                  {filtered.map((r) => {
                    const isCheckActive = !!r.isChecked;
                    return (
                      <tr
                        key={r.id}
                        onClick={() => setPopupBcbRecord(r)}
                        className="cursor-pointer transition-colors hover:bg-zinc-50/70"
                      >
                        {/* 1. Đã thi */}
                        <td className="px-3 py-3.5 text-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleTaken(r);
                            }}
                            className={`inline-flex items-center justify-center h-5 w-5 rounded border transition-colors cursor-pointer ${
                              r.hasTakenTest
                                ? "bg-sky-600 text-white border-sky-600"
                                : "bg-white border-zinc-300 text-transparent"
                            }`}
                            title="Bấm để đổi trạng thái Đã thi"
                          >
                            ✓
                          </button>
                        </td>

                        {/* 2. Tên */}
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-zinc-900 flex items-center gap-1.5">
                            <span>{r.candidateName}</span>
                          </div>
                        </td>

                        {/* 3. SĐT */}
                        <td className="px-3 py-3.5 font-mono text-zinc-600 tabular-nums">
                          {r.candidatePhone || "—"}
                        </td>

                        {/* 4. Email */}
                        <td className="px-4 py-3.5 text-zinc-500 font-mono text-[11px]">
                          {r.candidateEmail || "—"}
                        </td>

                        {/* 5. Lớp học */}
                        <td className="px-4 py-3.5">
                          <span className="font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                            {shortClassLabel(r.classCode || r.className) || "Final M311025"}
                          </span>
                        </td>

                        {/* Ngày thi (Final) */}
                        <td className="px-3.5 py-3.5 font-mono text-zinc-700 text-xs">
                          {r.examDate || r.date || "—"}
                        </td>

                        {/* Ngày thi Speaking (Final Speaking) */}
                        <td className="px-3.5 py-3.5">
                          {(() => {
                            const sDate = r.speakingDate || (r.testType === "speaking" ? r.date : "");
                            const sTime = r.speakingTime || (r.testType === "speaking" ? r.time : "");
                            const sTeacher = r.graderSpeaking || (r.testType === "speaking" ? r.examinerName : "");
                            const spk = sDate
                              ? { date: sDate, time: sTime, teacher: sTeacher }
                              : (r.studentId && speakingDateMap.get(r.studentId)) ||
                                (r.candidateName && speakingDateMap.get(r.candidateName)) ||
                                (r.candidatePhone && speakingDateMap.get(r.candidatePhone.replace(/\D/g, ""))) ||
                                null;
                            if (!spk || !spk.date) {
                              return <span className="text-zinc-400 text-xs">—</span>;
                            }
                            return (
                              <div>
                                <div className="font-mono text-xs text-zinc-700 font-medium">
                                  {spk.date} {spk.time ? `• ${spk.time}` : ""}
                                </div>
                                {spk.teacher && (
                                  <div className="text-[10px] text-primary font-bold mt-0.5">
                                    {spk.teacher}
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </td>

                        {/* 7. FOLDER BÀI LÀM */}
                        <td className="px-3 py-3.5 text-center">
                          {r.submissionFolderLink ? (
                            <a
                              href={r.submissionFolderLink}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 text-primary font-bold hover:underline"
                            >
                              FINAL ↗
                            </a>
                          ) : (
                            <span className="text-zinc-300">—</span>
                          )}
                        </td>

                        {/* 8. FOLDER ĐỀ GỐC */}
                        <td className="px-3 py-3.5 text-center">
                          {r.examFolderLink ? (
                            <a
                              href={r.examFolderLink}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 text-sky-600 font-bold hover:underline"
                            >
                              MOM_Test ↗
                            </a>
                          ) : (
                            <span className="text-zinc-300">—</span>
                          )}
                        </td>

                        {/* 9. L */}
                        <td className="px-2.5 py-3.5 text-center font-bold text-zinc-900 tabular-nums">
                          {r.scoreListening || "—"}
                        </td>

                        {/* 10. R */}
                        <td className="px-2.5 py-3.5 text-center font-bold text-zinc-900 tabular-nums">
                          {r.scoreReading || "—"}
                        </td>

                        {/* 11. W */}
                        <td className="px-2.5 py-3.5 text-center font-bold text-zinc-900 tabular-nums">
                          {r.scoreWriting || "—"}
                        </td>

                        {/* 12. S */}
                        <td className="px-2.5 py-3.5 text-center font-bold text-zinc-900 tabular-nums">
                          {r.scoreSpeaking || "—"}
                        </td>

                        {/* 13. O */}
                        <td className="px-3 py-3.5 text-center">
                          <span className="font-black text-primary text-sm tabular-nums">
                            {r.scoreOverall || calculateOverall(r.scoreListening, r.scoreReading, r.scoreWriting, r.scoreSpeaking)}
                          </span>
                        </td>

                        {/* 15. Chấm W */}
                        <td className="px-2 py-2.5" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={r.graderWTask1 || r.graderWTask2 || ""}
                            onChange={(e) => handleUpdateGraderW(r.id, e.target.value)}
                            className="h-8 rounded-lg border border-zinc-200 bg-white px-2 text-xs font-bold text-zinc-800 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 cursor-pointer shadow-2xs hover:border-primary/40 transition-all max-w-[130px] truncate"
                            title="Chọn Giáo viên / Grader chấm Writing"
                          >
                            <option value="">— Chọn Grader —</option>
                            {graderOptions.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* 16. Check (DUYỆT TRẢ KẾT QUẢ CHO HỌC VIÊN) */}
                        <td className="px-4 py-3.5 text-center bg-amber-50/50 border-x border-amber-200/50" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => handleToggleCheck(r)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wide border transition-all cursor-pointer shadow-xs ${
                              isCheckActive
                                ? "bg-emerald-600 text-white border-emerald-700 shadow-emerald-600/20"
                                : "bg-zinc-100 text-zinc-600 border-zinc-300 hover:bg-zinc-200"
                            }`}
                            title="Xác nhận: học viên mới thấy điểm Final. Tắt: ẩn kết quả khỏi học viên."
                          >
                            <span className={`h-2 w-2 rounded-full ${isCheckActive ? "bg-white" : "bg-zinc-400"}`} />
                            {isCheckActive ? "Đã xác nhận" : "Xác nhận"}
                          </button>
                        </td>

                        {/* 19. Đạt/Không đạt */}
                        <td className="px-3 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => handleToggleResult(r)}
                            className={`inline-flex rounded-md px-2 py-0.5 text-[9px] font-black uppercase tracking-wider border cursor-pointer ${
                              r.resultStatus === "Đạt"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-rose-50 text-rose-700 border-rose-200"
                            }`}
                          >
                            {r.resultStatus || "Không đạt"}
                          </button>
                        </td>

                        {/* 20. DONE */}
                        <td className="px-3 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => handleToggleDone(r)}
                            className={`inline-flex items-center justify-center h-5 w-5 rounded border transition-colors cursor-pointer ${
                              r.isDone
                                ? "bg-emerald-600 text-white border-emerald-600"
                                : "bg-white border-zinc-300 text-transparent"
                            }`}
                            title="Đánh dấu hoàn thành toàn bộ"
                          >
                            ✓
                          </button>
                        </td>

                        {/* 21. Thao tác */}
                        <td className="px-3 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPopupBcbRecord(r);
                              }}
                              className="rounded-xl bg-primary/10 px-3 py-1.5 text-xs font-black text-primary transition-all hover:bg-primary hover:text-white cursor-pointer shadow-2xs whitespace-nowrap"
                              title="Điền và chỉnh sửa Listening & Reading BCB Final"
                            >
                              Điền L &amp; R
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditModal(r);
                              }}
                              className="rounded-lg p-1.5 text-zinc-400 hover:text-primary hover:bg-zinc-100 transition-colors cursor-pointer"
                              title="Sửa thông tin dòng"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(r.id, r.candidateName);
                              }}
                              className="rounded-lg p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Xóa bản ghi"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Popup BCB Final Editor (Chỉ điền L & R, Writing & Speaking do Grader chấm) ── */}
      {popupBcbRecord && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-0 sm:p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setPopupBcbRecord(null)}
            aria-hidden
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative z-10 flex h-[100dvh] w-full max-w-6xl flex-col overflow-hidden rounded-none bg-white shadow-2xl sm:h-[min(92vh,920px)] sm:rounded-3xl"
          >
            {/* Modal Top Header */}
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-zinc-100 px-5 py-4 sm:px-6 bg-zinc-50/80">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-xl font-black text-zinc-900 tracking-tight truncate">
                    {popupBcbRecord.candidateName}
                  </h2>
                  <span className="rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-[10px] font-black uppercase text-primary">
                    Lớp: {shortClassLabel(popupBcbRecord.classCode || popupBcbRecord.className) || "Final M311025"}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-[10px] font-black uppercase border ${
                      popupBcbRecord.resultStatus === "Đạt"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-rose-50 text-rose-700 border-rose-200"
                    }`}
                  >
                    {popupBcbRecord.resultStatus || "Không đạt"}
                  </span>
                  {popupBcbRecord.isChecked && (
                    <span className="rounded-full bg-emerald-600 text-white px-2.5 py-0.5 text-[9px] font-black uppercase">
                      Đã duyệt trả KQ ✓
                    </span>
                  )}
                </div>
                <p className="text-xs font-semibold text-zinc-500 mt-1">
                  SĐT: {popupBcbRecord.candidatePhone || "—"} · Email: {popupBcbRecord.candidateEmail || "—"} · Ngày thi: {popupBcbRecord.examDate || popupBcbRecord.date || "—"}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => openEditModal(popupBcbRecord)}
                  className="rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 px-3 py-1.5 text-xs font-bold text-zinc-700 transition-all shadow-2xs cursor-pointer"
                >
                  Sửa thông tin cơ bản
                </button>
                <button
                  type="button"
                  onClick={() => setPopupBcbRecord(null)}
                  className="rounded-xl border border-zinc-200 px-3 py-1.5 text-xs font-black text-zinc-600 hover:bg-zinc-100 transition-colors cursor-pointer"
                >
                  ✕ Đóng
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6 space-y-6">
              <FinalTestBcbEditorSection
                record={popupBcbRecord}
                skillScope="lr-only"
                portalLabel="Học Vụ Khảo Thí"
                onSaved={() => {
                  loadData();
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Add / Edit Modal ── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Đóng"
            onClick={() => setIsAddModalOpen(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-xs"
          />
          <form
            onSubmit={handleSaveModal}
            className="relative w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <h3 className="text-base font-black text-zinc-900">
                  {editingRecord ? "Chỉnh Sửa Thông Tin Thí Sinh Final" : "Thêm Thí Sinh Final Test Mới"}
                </h3>
                <p className="text-xs text-zinc-500 font-medium mt-0.5">
                  Cập nhật điểm L &amp; R, link đề/bài nộp và trạng thái check trả kết quả
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-lg p-1 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Quick Student Selector */}
            {!editingRecord && students.length > 0 && (
              <div className="bg-primary/5 p-3 rounded-xl border border-primary/20">
                <label className="block text-xs font-bold text-primary mb-1">
                  Chọn nhanh từ danh sách học viên ({students.length} học viên)
                </label>
                <select
                  onChange={(e) => {
                    const st = students.find((s) => s.id === e.target.value);
                    if (st) {
                      setCandidateName(st.name || "");
                      setCandidatePhone(st.phone || "");
                      setCandidateEmail(st.email || "");
                      if (st.l1 && st.l1 !== "-") {
                        setClassCode(st.l1);
                      }
                    }
                  }}
                  className="w-full rounded-lg border border-primary/20 bg-white px-3 py-1.5 text-xs text-zinc-900 outline-none"
                >
                  <option value="">-- Chọn học viên để điền nhanh thông tin --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.phone ? `(${s.phone})` : ""} {s.l1 ? `• ${s.l1}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Tên */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Tên học viên *</label>
                <input
                  type="text"
                  required
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  placeholder="VD: Nguyễn Thảo Hiền"
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2 text-xs font-bold text-zinc-900 outline-none focus:border-primary focus:bg-white"
                />
              </div>

              {/* SĐT */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">SĐT</label>
                <input
                  type="text"
                  value={candidatePhone}
                  onChange={(e) => setCandidatePhone(e.target.value)}
                  placeholder="VD: 0912 345 678"
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2 text-xs font-mono text-zinc-900 outline-none focus:border-primary focus:bg-white"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Email</label>
                <input
                  type="email"
                  value={candidateEmail}
                  onChange={(e) => setCandidateEmail(e.target.value)}
                  placeholder="VD: thaohien@gmail.com"
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2 text-xs text-zinc-900 outline-none focus:border-primary focus:bg-white"
                />
              </div>

              {/* Lớp */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Lớp (final test)</label>
                <input
                  type="text"
                  value={classCode}
                  onChange={(e) => setClassCode(e.target.value)}
                  placeholder="VD: Final M311025"
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2 text-xs font-bold text-primary outline-none focus:border-primary focus:bg-white"
                />
              </div>

              {/* Phân loại */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Phân loại</label>
                <input
                  type="text"
                  value={classification}
                  onChange={(e) => setClassification(e.target.value)}
                  placeholder="VD: M/U"
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2 text-xs font-bold text-zinc-900 outline-none focus:border-primary focus:bg-white"
                />
              </div>

              {/* Ngày thi Final */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Ngày thi Final (Chung)</label>
                <input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2 text-xs font-bold text-zinc-900 outline-none focus:border-primary focus:bg-white cursor-pointer"
                />
              </div>

              {/* Ngày thi Speaking Final */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Ngày thi Speaking Final (1-1)</label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={speakingDate}
                    onChange={(e) => setSpeakingDate(e.target.value)}
                    className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2 text-xs font-bold text-zinc-900 outline-none focus:border-primary focus:bg-white cursor-pointer"
                  />
                  <input
                    type="time"
                    value={speakingTime}
                    onChange={(e) => setSpeakingTime(e.target.value)}
                    className="w-24 rounded-xl border border-zinc-200 bg-zinc-50/50 px-2 py-2 text-xs font-mono font-bold text-zinc-900 outline-none focus:border-primary focus:bg-white cursor-pointer"
                  />
                </div>
              </div>

              {/* BCB Spreadsheet link */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Link Sheet BCB</label>
                <input
                  type="url"
                  value={bcbSpreadsheetLink}
                  onChange={(e) => setBcbSpreadsheetLink(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2 text-xs text-primary outline-none focus:border-primary focus:bg-white"
                />
              </div>

              {/* FOLDER BÀI LÀM */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">FOLDER BÀI LÀM (Drive link)</label>
                <input
                  type="url"
                  value={submissionFolderLink}
                  onChange={(e) => setSubmissionFolderLink(e.target.value)}
                  placeholder="https://drive.google.com/drive/folders/..."
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2 text-xs text-primary outline-none focus:border-primary focus:bg-white"
                />
              </div>

              {/* FOLDER ĐỀ GỐC */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">FOLDER ĐỀ GỐC (Drive link)</label>
                <input
                  type="url"
                  value={examFolderLink}
                  onChange={(e) => setExamFolderLink(e.target.value)}
                  placeholder="https://drive.google.com/drive/folders/..."
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2 text-xs text-sky-600 outline-none focus:border-primary focus:bg-white"
                />
              </div>
            </div>

            {/* 4 Skills Scores (L & R do Học vụ điền, W & S do Grader chấm) */}
            <div className="pt-2 border-t border-zinc-100">
              <label className="block text-xs font-black uppercase text-zinc-600 mb-1">Điểm số 4 Kỹ Năng &amp; Overall</label>
              <p className="text-[11px] text-zinc-400 mb-2">Điểm W &amp; S do Grader điền khi chấm.</p>
              <div className="grid grid-cols-5 gap-2.5 text-center">
                <div>
                  <span className="text-[10px] font-bold text-zinc-700">L (Học vụ)</span>
                  <input
                    type="text"
                    value={scoreListening}
                    onChange={(e) => setScoreListening(e.target.value)}
                    placeholder="4.5"
                    className="w-full mt-1 text-center rounded-lg border border-primary/30 py-1 text-xs font-bold text-zinc-900 bg-white focus:border-primary"
                  />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-zinc-700">R (Học vụ)</span>
                  <input
                    type="text"
                    value={scoreReading}
                    onChange={(e) => setScoreReading(e.target.value)}
                    placeholder="5.5"
                    className="w-full mt-1 text-center rounded-lg border border-primary/30 py-1 text-xs font-bold text-zinc-900 bg-white focus:border-primary"
                  />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-zinc-400">W (Grader)</span>
                  <input
                    type="text"
                    value={scoreWriting}
                    onChange={(e) => setScoreWriting(e.target.value)}
                    placeholder="4.5"
                    className="w-full mt-1 text-center rounded-lg border border-zinc-200 py-1 text-xs font-bold bg-zinc-50 text-zinc-600"
                  />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-zinc-400">S (Grader)</span>
                  <input
                    type="text"
                    value={scoreSpeaking}
                    onChange={(e) => setScoreSpeaking(e.target.value)}
                    placeholder="0.0"
                    className="w-full mt-1 text-center rounded-lg border border-zinc-200 py-1 text-xs font-bold bg-zinc-50 text-zinc-600"
                  />
                </div>
                <div>
                  <span className="text-[10px] font-black text-primary">OVERALL</span>
                  <input
                    type="text"
                    value={scoreOverall}
                    onChange={(e) => setScoreOverall(e.target.value)}
                    placeholder={calculateOverall(scoreListening, scoreReading, scoreWriting, scoreSpeaking)}
                    className="w-full mt-1 text-center rounded-lg border border-primary/40 bg-primary/5 py-1 text-xs font-black text-primary"
                  />
                </div>
              </div>
            </div>

            {/* Grader Writing — Speaking do học viên tự đăng ký */}
            <div className="pt-2 border-t border-zinc-100">
              <label className="block text-xs font-black uppercase text-zinc-600 mb-2">Phân công Grader chấm Writing</label>
              <div className="max-w-sm">
                <label className="block text-[11px] font-bold text-zinc-600 mb-1">Chấm W</label>
                <select
                  value={graderW}
                  onChange={(e) => setGraderW(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 py-2 text-xs font-bold text-zinc-900 outline-none focus:border-primary focus:bg-white cursor-pointer"
                >
                  <option value="">-- Chọn Grader --</option>
                  {graderOptions.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                {editingRecord && (editingRecord.graderSpeaking || editingRecord.examinerName) && (
                  <p className="mt-2 text-[11px] text-zinc-500">
                    Giám khảo Speaking (học viên đăng ký):{" "}
                    <span className="font-bold text-zinc-700">
                      {editingRecord.graderSpeaking || editingRecord.examinerName}
                    </span>
                  </p>
                )}
              </div>
            </div>

            {/* Flags (Check, Đạt, DONE, Đã thi) */}
            <div className="pt-3 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-4 bg-zinc-50/60 p-3.5 rounded-xl border border-zinc-200">
              <label className="flex items-center gap-2 text-xs font-bold text-zinc-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasTakenTest}
                  onChange={(e) => setHasTakenTest(e.target.checked)}
                  className="rounded text-primary focus:ring-primary h-4 w-4"
                />
                Đã thi
              </label>

              {/* Check flag (Highlight) */}
              <label className="flex items-center gap-2 text-xs font-black text-amber-900 bg-amber-100/80 px-3 py-1.5 rounded-lg border border-amber-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => setIsChecked(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500 h-4 w-4"
                />
                Check (Trả kết quả về học viên)
              </label>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-700">Đạt/Không đạt:</span>
                <select
                  value={resultStatus}
                  onChange={(e) => setResultStatus(e.target.value as any)}
                  className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-bold text-zinc-900"
                >
                  <option value="Đạt">Đạt</option>
                  <option value="Không đạt">Không đạt</option>
                </select>
              </div>

              <label className="flex items-center gap-2 text-xs font-bold text-emerald-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDone}
                  onChange={(e) => setIsDone(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                />
                DONE
              </label>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-bold text-zinc-600 hover:bg-zinc-100 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-primary hover:bg-[#6a5acd] px-6 py-2 text-xs font-black text-white transition-all disabled:opacity-50 shadow-sm"
              >
                {saving ? "Đang lưu..." : editingRecord ? "Cập Nhật" : "Thêm Thí Sinh"}
              </button>
            </div>
          </form>
        </div>
      )}
    </AcaLayout>
  );
}
