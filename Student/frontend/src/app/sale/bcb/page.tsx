"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { DiagnosisEditorSection } from "@/components/shared/DiagnosisEditorSection";
import { StudentProfileEditorSection } from "@/components/shared/StudentProfileEditorSection";
import {
  fetchAcaStudents,
  fetchAcaClasses,
  updateAcaStudent,
  shortClassLabel,
  type AcaStudent,
  type AcaClass,
} from "@/lib/acaManagementApi";
import { formatBandScore } from "@/lib/formatBandScore";
import {
  GUEST_LEAD_STATUS_LABEL,
  listGuestDiagnosisLeads,
  updateGuestDiagnosisLead,
  type GuestDiagnosisLead,
  type GuestDiagnosisLeadStatus,
} from "@/lib/guestDiagnosisLeads";

function isUserAssignedToClass(student: AcaStudent): boolean {
  const classId = (student.classId || "").trim();
  const l1 = (student.l1 || "").trim().toLowerCase();

  const hasValidClassId = classId.length > 0 && classId !== "cls_placeholder";
  const hasValidL1 = l1.length > 0 && l1 !== "-" && !l1.includes("chưa");

  return hasValidClassId || hasValidL1;
}

function SaleBcbContent() {
  const searchParams = useSearchParams();
  const paramStudentId = searchParams.get("studentId");
  const paramLeadId = searchParams.get("leadId");
  const paramTab = searchParams.get("tab");

  const [rosterMode, setRosterMode] = useState<"aca" | "leads">(
    paramTab === "leads" || paramLeadId ? "leads" : "aca",
  );

  const [students, setStudents] = useState<AcaStudent[]>([]);
  const [classes, setClasses] = useState<AcaClass[]>([]);
  const [leads, setLeads] = useState<GuestDiagnosisLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [leadsLoading, setLeadsLoading] = useState(true);
  const [editorStudentId, setEditorStudentId] = useState<string | null>(null);
  const [editorLeadId, setEditorLeadId] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "student" | "guest">("all");
  const [leadSearch, setLeadSearch] = useState("");
  const [leadStatusFilter, setLeadStatusFilter] = useState<"all" | GuestDiagnosisLeadStatus>("all");

  const reloadLeads = async () => {
    setLeadsLoading(true);
    try {
      const rows = await listGuestDiagnosisLeads();
      setLeads(rows);
    } catch (err) {
      console.error("Failed to load guest diagnosis leads", err);
      setLeads([]);
    } finally {
      setLeadsLoading(false);
    }
  };

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [stList, clList] = await Promise.all([
          fetchAcaStudents(),
          fetchAcaClasses(),
        ]);
        setStudents(stList);
        setClasses(clList);
        if (paramStudentId && stList.some((s) => s.id === paramStudentId)) {
          setRosterMode("aca");
          setEditorStudentId(paramStudentId);
        }
      } catch (err) {
        console.error("Failed to load students for BCB page", err);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [paramStudentId]);

  useEffect(() => {
    void reloadLeads();
  }, []);

  useEffect(() => {
    if (!paramLeadId) return;
    setRosterMode("leads");
    setEditorLeadId(paramLeadId);
  }, [paramLeadId]);

  const handleAssignClass = async (studentId: string, newClassId: string) => {
    const selectedClass = classes.find((c) => c.id === newClassId);
    const className = selectedClass ? selectedClass.name : "-";
    try {
      const updated = await updateAcaStudent(studentId, {
        classId: newClassId,
        l1: className,
      });
      setStudents((prev) =>
        prev.map((s) =>
          s.id === studentId ? { ...s, ...updated, classId: newClassId, l1: className } : s,
        ),
      );
    } catch (err: any) {
      alert("Không gán được lớp: " + err.message);
    }
  };

  const handleLeadStatus = async (id: string, status: GuestDiagnosisLeadStatus) => {
    try {
      const updated = await updateGuestDiagnosisLead(id, { status });
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...updated } : l)));
    } catch (err: any) {
      alert("Không cập nhật được trạng thái: " + err.message);
    }
  };

  const handleLeadNote = async (id: string, note: string) => {
    try {
      const updated = await updateGuestDiagnosisLead(id, { note });
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...updated } : l)));
    } catch (err: any) {
      alert("Không lưu được ghi chú: " + err.message);
    }
  };

  const copyGuestLink = async (leadId: string) => {
    const url = `${window.location.origin}/guest-diagnosis?leadId=${encodeURIComponent(leadId)}`;
    try {
      await navigator.clipboard.writeText(url);
      alert("Đã copy link báo cáo guest:\n" + url);
    } catch {
      prompt("Copy link báo cáo guest:", url);
    }
  };

  const stats = useMemo(() => {
    let studentCount = 0;
    let guestCount = 0;
    students.forEach((s) => {
      if (isUserAssignedToClass(s)) studentCount++;
      else guestCount++;
    });
    return { total: students.length, studentCount, guestCount };
  }, [students]);

  const leadStats = useMemo(() => {
    const total = leads.length;
    const withBcb = leads.filter((l) => l.hasDiagnosis).length;
    const neu = leads.filter((l) => l.status === "new").length;
    return { total, withBcb, neu };
  }, [leads]);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const isAssigned = isUserAssignedToClass(s);
      if (filterType === "student" && !isAssigned) return false;
      if (filterType === "guest" && isAssigned) return false;

      if (searchTerm.trim()) {
        const query = searchTerm.trim().toLowerCase();
        const matchName = s.name.toLowerCase().includes(query);
        const matchEmail = (s.email || "").toLowerCase().includes(query);
        const matchPhone = (s.phone || "").toLowerCase().includes(query);
        const matchClass = (s.l1 || "").toLowerCase().includes(query);
        return matchName || matchEmail || matchPhone || matchClass;
      }
      return true;
    });
  }, [students, filterType, searchTerm]);

  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      if (leadStatusFilter !== "all" && l.status !== leadStatusFilter) return false;
      if (!leadSearch.trim()) return true;
      const q = leadSearch.trim().toLowerCase();
      return (
        l.name.toLowerCase().includes(q) ||
        (l.phone || "").toLowerCase().includes(q) ||
        (l.aim || "").toLowerCase().includes(q) ||
        (l.note || "").toLowerCase().includes(q)
      );
    });
  }, [leads, leadSearch, leadStatusFilter]);

  const activeStudent = useMemo(() => {
    if (!editorStudentId) return null;
    return students.find((s) => s.id === editorStudentId) || null;
  }, [students, editorStudentId]);

  const activeLead = useMemo(() => {
    if (!editorLeadId) return null;
    return leads.find((l) => l.id === editorLeadId) || null;
  }, [leads, editorLeadId]);

  const activeIsAssigned = activeStudent ? isUserAssignedToClass(activeStudent) : false;

  const openEditor = (id: string) => setEditorStudentId(id);
  const closeEditor = () => setEditorStudentId(null);
  const openLeadEditor = (id: string) => setEditorLeadId(id);
  const closeLeadEditor = () => {
    setEditorLeadId(null);
    void reloadLeads();
  };

  useEffect(() => {
    if (!editorStudentId && !editorLeadId) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [editorStudentId, editorLeadId]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200/80 pb-4">
        <div>
          <h1 className="text-xl font-black text-zinc-900">
            Quản Lý & Điền Bảng Chẩn Bệnh Chi Tiết (BCB)
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5 font-medium">
            Sale chỉ nhập Listening & Reading. Writing / Speaking do Grader điền khi chấm Entrance.
          </p>
        </div>
        <div className="flex rounded-xl bg-zinc-100 p-1 border border-zinc-200">
          {[
            ["aca", "HV / Guest ACA"],
            ["leads", "Lead Guest Diagnosis"],
          ].map(([val, label]) => (
            <button
              key={val}
              type="button"
              onClick={() => setRosterMode(val as "aca" | "leads")}
              className={`rounded-lg px-3 py-1.5 text-xs font-extrabold transition-all cursor-pointer ${
                rosterMode === val
                  ? "bg-white text-primary shadow-2xs font-black"
                  : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {rosterMode === "aca" ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xs">
              <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                Tổng số hồ sơ quản lý
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-zinc-900 tabular-nums">{stats.total}</span>
                <span className="text-xs font-bold text-zinc-500">người dùng</span>
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-2xs">
              <div className="text-[10px] font-black uppercase tracking-widest text-emerald-700">
                Đã gán lớp (Học viên)
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-emerald-700 tabular-nums">
                  {stats.studentCount}
                </span>
                <span className="text-xs font-bold text-emerald-600">học viên chính thức</span>
              </div>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 shadow-2xs">
              <div className="text-[10px] font-black uppercase tracking-widest text-amber-800">
                Chưa gán lớp (Guest)
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-amber-800 tabular-nums">
                  {stats.guestCount}
                </span>
                <span className="text-xs font-bold text-amber-700">khách chẩn bệnh</span>
              </div>
            </div>
          </div>

          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-zinc-900">
                  Danh Sách Học Viên & Khách Cần Điền BCB (L &amp; R)
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Bấm &quot;Điền BCB&quot; để nhập Listening &amp; Reading. Writing / Speaking do Grader
                  chấm Entrance.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    placeholder="Tìm tên, SĐT, email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-10 w-48 sm:w-64 rounded-xl border border-zinc-200 bg-white pl-9 pr-3 text-xs font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                  <svg
                    className="absolute left-3 h-4 w-4 text-zinc-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                  >
                    <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>

                <div className="flex rounded-xl bg-zinc-100 p-1 border border-zinc-200">
                  {[
                    ["all", "Tất cả"],
                    ["student", "Học viên"],
                    ["guest", "Guest (Khách)"],
                  ].map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setFilterType(val as any)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-extrabold transition-all cursor-pointer ${
                        filterType === val
                          ? "bg-white text-primary shadow-2xs font-black"
                          : "text-zinc-500 hover:text-zinc-900"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-soft">
              {loading ? (
                <div className="p-12 text-center text-xs font-bold text-zinc-400">
                  Đang tải danh sách người dùng...
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="p-12 text-center text-xs font-bold text-zinc-400">
                  Không tìm thấy người dùng phù hợp.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-zinc-50 border-b border-zinc-200 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                      <tr>
                        <th className="px-5 py-3.5 w-12 text-center">STT</th>
                        <th className="px-5 py-3.5 min-w-[200px]">Họ & Tên</th>
                        <th className="px-5 py-3.5 w-36 text-center">Trạng thái</th>
                        <th className="px-5 py-3.5 min-w-[180px]">Lớp Học</th>
                        <th className="px-5 py-3.5 text-center w-36">Điểm Entrance</th>
                        <th className="px-5 py-3.5 text-right w-32">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 font-semibold text-zinc-700">
                      {filteredStudents.map((st, idx) => {
                        const isAssigned = isUserAssignedToClass(st);
                        const displayClass = st.l1 && st.l1 !== "-" ? shortClassLabel(st.l1) : "Chưa xếp lớp";

                        return (
                          <tr
                            key={st.id}
                            onClick={() => openEditor(st.id)}
                            className="cursor-pointer transition-colors hover:bg-zinc-50/70"
                          >
                            <td className="px-5 py-4 text-center tabular-nums text-zinc-400 font-bold">
                              {idx + 1}
                            </td>

                            <td className="px-5 py-4">
                              <div className="font-bold text-zinc-900 text-xs">
                                <span>{st.name}</span>
                              </div>
                              <div className="text-[10px] text-zinc-400 font-medium">
                                {st.email || st.phone || "Chưa có liên hệ"}
                              </div>
                            </td>

                            <td className="px-5 py-4 text-center">
                              {isAssigned ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-[10px] font-black uppercase text-emerald-700">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                  Học viên
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-[10px] font-black uppercase text-amber-800">
                                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                  Guest (Khách)
                                </span>
                              )}
                            </td>

                            <td className="px-5 py-4">
                              <span
                                className={`text-xs font-bold ${
                                  isAssigned ? "text-zinc-800" : "text-zinc-400 italic"
                                }`}
                              >
                                {displayClass}
                              </span>
                            </td>

                            <td className="px-5 py-4 text-center">
                              <span className="inline-block rounded-xl bg-zinc-100 px-3 py-1 text-xs font-black text-amber-700 tabular-nums">
                                {st.scores?.o && st.scores.o !== "-"
                                  ? `${formatBandScore(st.scores.o)} Overall`
                                  : "—"}
                              </span>
                            </td>

                            <td className="px-5 py-4 text-right">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditor(st.id);
                                }}
                                className="rounded-xl bg-primary/10 px-3 py-1.5 text-xs font-black text-primary transition-all hover:bg-primary hover:text-white cursor-pointer"
                              >
                                Điền L &amp; R
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xs">
              <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                Lead từ /guest-diagnosis
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-zinc-900 tabular-nums">
                  {leadStats.total}
                </span>
                <span className="text-xs font-bold text-zinc-500">lead</span>
              </div>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 shadow-2xs">
              <div className="text-[10px] font-black uppercase tracking-widest text-amber-800">
                Lead mới
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-amber-800 tabular-nums">{leadStats.neu}</span>
                <span className="text-xs font-bold text-amber-700">chưa xử lý</span>
              </div>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-2xs">
              <div className="text-[10px] font-black uppercase tracking-widest text-emerald-700">
                Đã có BCB
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-emerald-700 tabular-nums">
                  {leadStats.withBcb}
                </span>
                <span className="text-xs font-bold text-emerald-600">đã sync guest</span>
              </div>
            </div>
          </div>

          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-zinc-900">
                  Lead đăng ký tư vấn (Guest Diagnosis)
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Form trên trang guest tạo lead. Sale điền BCB tại đây — khách xem lại qua link{" "}
                  <code className="text-[10px] bg-zinc-100 px-1 rounded">?leadId=...</code>.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="text"
                  placeholder="Tìm tên, SĐT, aim..."
                  value={leadSearch}
                  onChange={(e) => setLeadSearch(e.target.value)}
                  className="h-10 w-48 sm:w-64 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
                <select
                  value={leadStatusFilter}
                  onChange={(e) =>
                    setLeadStatusFilter(e.target.value as "all" | GuestDiagnosisLeadStatus)
                  }
                  className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-bold outline-none focus:border-primary cursor-pointer"
                >
                  <option value="all">Mọi trạng thái</option>
                  {(Object.keys(GUEST_LEAD_STATUS_LABEL) as GuestDiagnosisLeadStatus[]).map(
                    (st) => (
                      <option key={st} value={st}>
                        {GUEST_LEAD_STATUS_LABEL[st]}
                      </option>
                    ),
                  )}
                </select>
                <button
                  type="button"
                  onClick={() => void reloadLeads()}
                  className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-black text-zinc-700 hover:bg-zinc-50"
                >
                  Tải lại
                </button>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-soft">
              {leadsLoading ? (
                <div className="p-12 text-center text-xs font-bold text-zinc-400">
                  Đang tải lead guest diagnosis...
                </div>
              ) : filteredLeads.length === 0 ? (
                <div className="p-12 text-center text-xs font-bold text-zinc-400">
                  Chưa có lead nào từ trang guest-diagnosis.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-zinc-50 border-b border-zinc-200 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                      <tr>
                        <th className="px-5 py-3.5 w-12 text-center">STT</th>
                        <th className="px-5 py-3.5 min-w-[180px]">Họ & Tên</th>
                        <th className="px-5 py-3.5 w-32">SĐT</th>
                        <th className="px-5 py-3.5 w-28">Aim</th>
                        <th className="px-5 py-3.5 w-40">Trạng thái</th>
                        <th className="px-5 py-3.5 w-28 text-center">BCB</th>
                        <th className="px-5 py-3.5 min-w-[160px]">Ghi chú</th>
                        <th className="px-5 py-3.5 text-right w-48">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 font-semibold text-zinc-700">
                      {filteredLeads.map((lead, idx) => (
                        <tr key={lead.id} className="hover:bg-zinc-50/70">
                          <td className="px-5 py-4 text-center tabular-nums text-zinc-400 font-bold">
                            {idx + 1}
                          </td>
                          <td className="px-5 py-4">
                            <div className="font-bold text-zinc-900 text-xs">{lead.name}</div>
                            <div className="text-[10px] text-zinc-400 font-medium">
                              {lead.submittedAt
                                ? new Date(lead.submittedAt).toLocaleString("vi-VN")
                                : "—"}
                            </div>
                          </td>
                          <td className="px-5 py-4 text-xs font-bold">{lead.phone || "—"}</td>
                          <td className="px-5 py-4 text-xs font-bold text-amber-700">
                            {lead.aim || "—"}
                          </td>
                          <td className="px-5 py-4">
                            <select
                              value={lead.status}
                              onChange={(e) =>
                                void handleLeadStatus(
                                  lead.id,
                                  e.target.value as GuestDiagnosisLeadStatus,
                                )
                              }
                              className="h-9 w-full rounded-xl border border-zinc-200 bg-white px-2 text-[11px] font-bold outline-none focus:border-primary cursor-pointer"
                            >
                              {(
                                Object.keys(GUEST_LEAD_STATUS_LABEL) as GuestDiagnosisLeadStatus[]
                              ).map((st) => (
                                <option key={st} value={st}>
                                  {GUEST_LEAD_STATUS_LABEL[st]}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-5 py-4 text-center">
                            {lead.hasDiagnosis ? (
                              <span className="inline-flex rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[10px] font-black uppercase text-emerald-700">
                                Đã điền
                              </span>
                            ) : (
                              <span className="inline-flex rounded-full bg-zinc-100 border border-zinc-200 px-2.5 py-1 text-[10px] font-black uppercase text-zinc-500">
                                Trống
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <input
                              defaultValue={lead.note || ""}
                              key={`${lead.id}-${lead.note || ""}`}
                              onBlur={(e) => {
                                const next = e.target.value.trim();
                                if (next !== (lead.note || "").trim()) {
                                  void handleLeadNote(lead.id, next);
                                }
                              }}
                              placeholder="Ghi chú Sale..."
                              className="h-9 w-full rounded-xl border border-zinc-200 bg-white px-2 text-[11px] font-semibold outline-none focus:border-primary"
                            />
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="inline-flex flex-wrap justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => void copyGuestLink(lead.id)}
                                className="rounded-xl border border-zinc-200 bg-white px-2.5 py-1.5 text-[11px] font-black text-zinc-600 hover:bg-zinc-50"
                              >
                                Copy link
                              </button>
                              <button
                                type="button"
                                onClick={() => openLeadEditor(lead.id)}
                                className="rounded-xl bg-primary/10 px-3 py-1.5 text-[11px] font-black text-primary transition-all hover:bg-primary hover:text-white cursor-pointer"
                              >
                                Điền L &amp; R
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </>
      )}

      {activeStudent && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-0 sm:p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-xs"
            onClick={closeEditor}
            aria-hidden
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="bcb-editor-title"
            className="relative z-10 flex h-[100dvh] w-full max-w-6xl flex-col overflow-hidden rounded-none bg-white shadow-2xl sm:h-[min(92vh,920px)] sm:rounded-3xl"
          >
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-zinc-100 px-5 py-4 sm:px-6">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h2
                    id="bcb-editor-title"
                    className="text-xl font-black text-zinc-900 tracking-tight truncate"
                  >
                    {activeStudent.name}
                  </h2>
                  {activeIsAssigned ? (
                    <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-[10px] font-black uppercase text-emerald-700">
                      Học viên ({activeStudent.l1 || "Đã xếp lớp"})
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-[10px] font-black uppercase text-amber-800">
                      Guest (Khách chưa xếp lớp)
                    </span>
                  )}
                </div>
                <p className="text-xs font-semibold text-zinc-500 mt-1">
                  Email: {activeStudent.email || "—"} · SĐT: {activeStudent.phone || "—"} · Lớp:{" "}
                  {activeStudent.l1 || "Chưa gán"}
                </p>
              </div>
              <button
                type="button"
                onClick={closeEditor}
                className="shrink-0 rounded-xl border border-zinc-200 px-3 py-2 text-xs font-black text-zinc-600 hover:bg-zinc-50"
              >
                Đóng
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-100 pb-5">
                <div className="text-xs font-semibold text-zinc-500">
                  Sale điền Listening &amp; Reading · Writing / Speaking do Grader chấm Entrance
                </div>
                <div className="flex items-center gap-2 bg-zinc-50 p-2.5 rounded-2xl border border-zinc-200 shadow-2xs">
                  <label className="text-[10px] font-black uppercase text-zinc-500 whitespace-nowrap">
                    Gán Lớp:
                  </label>
                  <select
                    value={activeStudent.classId || ""}
                    onChange={(e) => void handleAssignClass(activeStudent.id, e.target.value)}
                    className="h-9 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-bold text-zinc-900 outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="">-- Chưa xếp lớp (Guest) --</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.classCode ? `(${c.classCode})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <StudentProfileEditorSection
                portalLabel="Sale & Tuyển Sinh"
                studentId={activeStudent.id}
                studentData={{
                  name: activeStudent.name,
                  email: activeStudent.email,
                  phone: activeStudent.phone,
                  dob: activeStudent.dob,
                  zodiac: activeStudent.zodiac,
                  avatarUrl: activeStudent.avatarUrl,
                  examDate: activeStudent.examDate,
                }}
              />

              <DiagnosisEditorSection
                variant="student"
                portalLabel="Sale & Tuyển Sinh"
                skillScope="lr-only"
                studentId={activeStudent.id}
                studentEmail={activeStudent.email}
                studentName={activeStudent.name}
                initialScores={activeStudent.scores}
              />
            </div>
          </div>
        </div>
      )}

      {editorLeadId && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-0 sm:p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-xs"
            onClick={closeLeadEditor}
            aria-hidden
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="lead-bcb-editor-title"
            className="relative z-10 flex h-[100dvh] w-full max-w-6xl flex-col overflow-hidden rounded-none bg-white shadow-2xl sm:h-[min(92vh,920px)] sm:rounded-3xl"
          >
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-zinc-100 px-5 py-4 sm:px-6">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h2
                    id="lead-bcb-editor-title"
                    className="text-xl font-black text-zinc-900 tracking-tight truncate"
                  >
                    {activeLead?.name || "Lead Guest Diagnosis"}
                  </h2>
                  <span className="rounded-full bg-violet-50 border border-violet-200 px-3 py-1 text-[10px] font-black uppercase text-violet-700">
                    Lead form /guest-diagnosis
                  </span>
                </div>
                <p className="text-xs font-semibold text-zinc-500 mt-1">
                  SĐT: {activeLead?.phone || "—"} · Aim: {activeLead?.aim || "—"} ·{" "}
                  <button
                    type="button"
                    onClick={() => void copyGuestLink(editorLeadId)}
                    className="underline hover:text-primary"
                  >
                    Copy link khách xem
                  </button>
                </p>
              </div>
              <button
                type="button"
                onClick={closeLeadEditor}
                className="shrink-0 rounded-xl border border-zinc-200 px-3 py-2 text-xs font-black text-zinc-600 hover:bg-zinc-50"
              >
                Đóng
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6 space-y-6">
              <p className="text-xs font-semibold text-zinc-500">
                Lưu BCB gắn với lead này. Khách mở{" "}
                <code className="text-[10px] bg-zinc-100 px-1 rounded">
                  /guest-diagnosis?leadId={editorLeadId}
                </code>{" "}
                sẽ thấy cùng dữ liệu.
              </p>
              <DiagnosisEditorSection
                key={editorLeadId}
                variant="guest"
                portalLabel="Sale & Tuyển Sinh"
                skillScope="lr-only"
                leadId={editorLeadId}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SaleBcbPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs font-bold text-zinc-400">
          Đang tải trang chẩn đoán BCB...
        </div>
      }
    >
      <SaleBcbContent />
    </Suspense>
  );
}
