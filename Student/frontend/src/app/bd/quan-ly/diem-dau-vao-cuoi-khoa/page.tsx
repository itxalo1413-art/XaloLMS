"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BdLayout } from "@/components/bd/BdLayout";
import { BdTopbar } from "@/components/bd/BdTopbar";
import {
  fetchAcaStudents,
  fetchAcaClasses,
  updateAcaStudent,
  createAcaStudent,
  deleteAcaStudent,
  type AcaStudent,
  type AcaClass,
} from "@/lib/acaManagementApi";
import { AcaXlsxImportModal, type ImportField } from "@/components/aca/AcaXlsxImportModal";

const SCORE_IMPORT_FIELDS: ImportField[] = [
  { key: "email", label: "Email đối chiếu", required: true },
  { key: "entranceL", label: "Điểm vào Listening" },
  { key: "entranceR", label: "Điểm vào Reading" },
  { key: "entranceW", label: "Điểm vào Writing" },
  { key: "entranceS", label: "Điểm vào Speaking" },
  { key: "entranceO", label: "Điểm vào Overall" },
  { key: "finalL", label: "Điểm ra Listening" },
  { key: "finalR", label: "Điểm ra Reading" },
  { key: "finalW", label: "Điểm ra Writing" },
  { key: "finalS", label: "Điểm ra Speaking" },
  { key: "finalO", label: "Điểm ra Overall" },
];

type ScoreDraft = {
  entranceL: string;
  entranceR: string;
  entranceW: string;
  entranceS: string;
  entranceO: string;
  finalL: string;
  finalR: string;
  finalW: string;
  finalS: string;
  finalO: string;
};

export default function BdDauVaoCuoiKhoaPage() {
  const [students, setStudents] = useState<AcaStudent[]>([]);
  const [classes, setClasses] = useState<AcaClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Local drafts for inline scores editing
  const [drafts, setDrafts] = useState<Record<string, ScoreDraft>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Add Student Form State
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newClassId, setNewClassId] = useState("");
  const [newEntrance, setNewEntrance] = useState<ScoreDraft>({
    entranceL: "-", entranceR: "-", entranceW: "-", entranceS: "-", entranceO: "-",
    finalL: "-", finalR: "-", finalW: "-", finalS: "-", finalO: "-",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [stList, clList] = await Promise.all([
        fetchAcaStudents(),
        fetchAcaClasses(),
      ]);
      setStudents(stList);
      setClasses(clList);

      // Initialize drafts
      const initialDrafts: Record<string, ScoreDraft> = {};
      stList.forEach((s) => {
        initialDrafts[s.id] = {
          entranceL: String(s.scores?.l ?? "-"),
          entranceR: String(s.scores?.r ?? "-"),
          entranceW: String(s.scores?.w ?? "-"),
          entranceS: String(s.scores?.s ?? "-"),
          entranceO: String(s.scores?.o ?? "-"),
          finalL: String(s.finalScores?.l ?? "-"),
          finalR: String(s.finalScores?.r ?? "-"),
          finalW: String(s.finalScores?.w ?? "-"),
          finalS: String(s.finalScores?.s ?? "-"),
          finalO: String(s.finalScores?.o ?? "-"),
        };
      });
      setDrafts(initialDrafts);
    } catch (err: any) {
      setError(err.message || "Không tải được danh sách điểm.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleImportScores = async (
    mappedRows: any[],
    updateProgress: (current: number, total: number) => void
  ) => {
    let successCount = 0;
    const total = mappedRows.length;
    const updatedStudents: AcaStudent[] = [];
    const nextDrafts = { ...drafts };

    for (let i = 0; i < total; i++) {
      const row = mappedRows[i];
      const email = String(row.email || "").trim().toLowerCase();
      if (!email) {
        successCount++;
        updateProgress(successCount, total);
        continue;
      }

      const match = students.find((s) => s.email.toLowerCase().trim() === email);
      if (!match) {
        throw new Error(`Không tìm thấy học viên có email: ${email}`);
      }

      const scores = {
        l: row.entranceL !== undefined ? String(row.entranceL) : match.scores?.l ?? "-",
        r: row.entranceR !== undefined ? String(row.entranceR) : match.scores?.r ?? "-",
        w: row.entranceW !== undefined ? String(row.entranceW) : match.scores?.w ?? "-",
        s: row.entranceS !== undefined ? String(row.entranceS) : match.scores?.s ?? "-",
        o: row.entranceO !== undefined ? String(row.entranceO) : match.scores?.o ?? "-",
      };

      const finalScores = {
        l: row.finalL !== undefined ? String(row.finalL) : match.finalScores?.l ?? "-",
        r: row.finalR !== undefined ? String(row.finalR) : match.finalScores?.r ?? "-",
        w: row.finalW !== undefined ? String(row.finalW) : match.finalScores?.w ?? "-",
        s: row.finalS !== undefined ? String(row.finalS) : match.finalScores?.s ?? "-",
        o: row.finalO !== undefined ? String(row.finalO) : match.finalScores?.o ?? "-",
      };

      const updated = await updateAcaStudent(match.id, { scores, finalScores });
      updatedStudents.push(updated);

      nextDrafts[match.id] = {
        entranceL: String(updated.scores?.l ?? "-"),
        entranceR: String(updated.scores?.r ?? "-"),
        entranceW: String(updated.scores?.w ?? "-"),
        entranceS: String(updated.scores?.s ?? "-"),
        entranceO: String(updated.scores?.o ?? "-"),
        finalL: String(updated.finalScores?.l ?? "-"),
        finalR: String(updated.finalScores?.r ?? "-"),
        finalW: String(updated.finalScores?.w ?? "-"),
        finalS: String(updated.finalScores?.s ?? "-"),
        finalO: String(updated.finalScores?.o ?? "-"),
      };

      successCount++;
      updateProgress(successCount, total);
    }

    setStudents((prev) =>
      prev.map((s) => {
        const match = updatedStudents.find((u) => u.id === s.id);
        return match ? match : s;
      })
    );
    setDrafts(nextDrafts);
  };

  const handleUpdateDraft = (studentId: string, field: keyof ScoreDraft, value: string) => {
    setDrafts((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value,
      },
    }));
  };

  const handleSaveScores = async (studentId: string) => {
    const draft = drafts[studentId];
    if (!draft) return;

    setSavingId(studentId);
    try {
      const updated = await updateAcaStudent(studentId, {
        scores: {
          l: draft.entranceL.trim() || "-",
          r: draft.entranceR.trim() || "-",
          w: draft.entranceW.trim() || "-",
          s: draft.entranceS.trim() || "-",
          o: draft.entranceO.trim() || "-",
        },
        finalScores: {
          l: draft.finalL.trim() || "-",
          r: draft.finalR.trim() || "-",
          w: draft.finalW.trim() || "-",
          s: draft.finalS.trim() || "-",
          o: draft.finalO.trim() || "-",
        },
      });

      // Update local state
      setStudents((prev) =>
        prev.map((s) => (s.id === studentId ? { ...s, scores: updated.scores, finalScores: updated.finalScores } : s))
      );

      setTimeout(() => {
        setSavingId(null);
      }, 800);
    } catch (err: any) {
      alert("Không lưu được điểm: " + err.message);
      setSavingId(null);
    }
  };

  const handleDelete = async (studentId: string, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa học viên "${name}"?`)) return;

    try {
      await deleteAcaStudent(studentId);
      setStudents((prev) => prev.filter((s) => s.id !== studentId));
      alert("Đã xóa học viên thành công.");
    } catch (err: any) {
      alert("Không xóa được học viên: " + err.message);
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) {
      alert("Tên và Email là bắt buộc.");
      return;
    }

    try {
      const created = await createAcaStudent({
        name: newName.trim(),
        email: newEmail.trim().toLowerCase(),
        phone: newPhone.trim(),
        classId: newClassId || "",
        scores: {
          l: newEntrance.entranceL.trim() || "-",
          r: newEntrance.entranceR.trim() || "-",
          w: newEntrance.entranceW.trim() || "-",
          s: newEntrance.entranceS.trim() || "-",
          o: newEntrance.entranceO.trim() || "-",
        },
        finalScores: {
          l: newEntrance.finalL.trim() || "-",
          r: newEntrance.finalR.trim() || "-",
          w: newEntrance.finalW.trim() || "-",
          s: newEntrance.finalS.trim() || "-",
          o: newEntrance.finalO.trim() || "-",
        },
      });

      setStudents((prev) => [created, ...prev]);
      setDrafts((prev) => ({
        ...prev,
        [created.id]: {
          entranceL: String(created.scores?.l ?? "-"),
          entranceR: String(created.scores?.r ?? "-"),
          entranceW: String(created.scores?.w ?? "-"),
          entranceS: String(created.scores?.s ?? "-"),
          entranceO: String(created.scores?.o ?? "-"),
          finalL: String(created.finalScores?.l ?? "-"),
          finalR: String(created.finalScores?.r ?? "-"),
          finalW: String(created.finalScores?.w ?? "-"),
          finalS: String(created.finalScores?.s ?? "-"),
          finalO: String(created.finalScores?.o ?? "-"),
        },
      }));

      // Reset Form
      setNewName("");
      setNewEmail("");
      setNewPhone("");
      setNewClassId("");
      setNewEntrance({
        entranceL: "-", entranceR: "-", entranceW: "-", entranceS: "-", entranceO: "-",
        finalL: "-", finalR: "-", finalW: "-", finalS: "-", finalO: "-",
      });
      setIsAddModalOpen(false);
      alert("Đã thêm học viên mới thành công.");
    } catch (err: any) {
      alert("Không thêm được học viên: " + err.message);
    }
  };

  // Map classId to name
  const classMap = useMemo(() => {
    return new Map(classes.map((c) => [c.id, c.name]));
  }, [classes]);

  const filteredStudents = useMemo(() => {
    return students.filter((st) => {
      const className = classMap.get(st.classId) || "";
      return (
        st.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        className.toLowerCase().includes(searchQuery.toLowerCase()) ||
        st.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [students, searchQuery, classMap]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE);

  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredStudents.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredStudents, currentPage]);

  const stats = useMemo(() => {
    let totalEntrance = 0;
    let countEntrance = 0;
    let totalFinal = 0;
    let countFinal = 0;

    students.forEach((s) => {
      const ent = Number(s.scores?.o);
      if (!isNaN(ent) && ent > 0) {
        totalEntrance += ent;
        countEntrance++;
      }
      const fin = Number(s.finalScores?.o);
      if (!isNaN(fin) && fin > 0) {
        totalFinal += fin;
        countFinal++;
      }
    });

    const avgEntrance = countEntrance > 0 ? (totalEntrance / countEntrance).toFixed(1) : "—";
    const avgFinal = countFinal > 0 ? (totalFinal / countFinal).toFixed(1) : "—";
    const avgDelta =
      countEntrance > 0 && countFinal > 0
        ? (Number(avgFinal) - Number(avgEntrance)).toFixed(1)
        : "—";

    return { avgEntrance, avgFinal, avgDelta };
  }, [students]);

  const totalLeads = useMemo(() => {
    return students.length;
  }, [students]);

  const totalStudents = useMemo(() => {
    return students.filter(s => s.classId && classes.some(c => c.id === s.classId)).length;
  }, [students, classes]);

  return (
    <BdLayout>
      <BdTopbar
        title="Danh sách điểm đầu vào"
        subtitle="BD / Sale Portal - Quản lý chẩn bệnh năng lực và điểm thi cuối khóa của học viên."
      />
      <main className="mx-auto max-w-7xl px-6 py-6 pb-16 md:px-8 space-y-6">
        
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="text-[10px] font-bold uppercase text-zinc-500">Tổng số Lead</div>
            <div className="mt-2 text-2xl font-black text-foreground">
              {loading ? "..." : `${totalLeads} lead`}
            </div>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="text-[10px] font-bold uppercase text-zinc-500">Tổng số Học viên</div>
            <div className="mt-2 text-2xl font-black text-foreground">
              {loading ? "..." : `${totalStudents} học viên`}
            </div>
          </div>
        </div>

        {/* Search & Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="flex flex-1 items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Tìm hồ sơ theo tên, lớp hoặc email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-4 text-xs font-bold text-foreground outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="h-10 rounded-xl bg-primary text-white px-4 text-xs font-black uppercase shadow-soft hover:bg-primary/90 hover:-translate-y-0.5 transition-all flex items-center gap-1.5"
            >
              Thêm Học Viên
            </button>
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="h-10 rounded-xl border border-success/30 bg-success/10 text-success px-4 text-xs font-black uppercase shadow-soft hover:bg-success/15 hover:-translate-y-0.5 transition-all flex items-center gap-1.5"
            >
              Nhập Excel
            </button>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center text-sm text-zinc-500">
            Đang tải dữ liệu...
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1200px] border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50 text-[10px] font-black uppercase tracking-widest text-muted">
                    <th className="px-4 py-4 min-w-[180px]">Học viên & Email</th>
                    <th className="px-4 py-4 min-w-[150px]">Lớp học</th>
                    
                    {/* Entrance */}
                    <th className="px-1.5 py-4 text-center bg-blue-50/30">Vào (L)</th>
                    <th className="px-1.5 py-4 text-center bg-blue-50/30">Vào (R)</th>
                    <th className="px-1.5 py-4 text-center bg-blue-50/30">Vào (W)</th>
                    <th className="px-1.5 py-4 text-center bg-blue-50/30">Vào (S)</th>
                    <th className="px-2 py-4 text-center bg-blue-50/70 font-black text-primary border-r border-zinc-200">Overall</th>

                    {/* Output */}
                    <th className="px-1.5 py-4 text-center bg-purple-50/30">Ra (L)</th>
                    <th className="px-1.5 py-4 text-center bg-purple-50/30">Ra (R)</th>
                    <th className="px-1.5 py-4 text-center bg-purple-50/30">Ra (W)</th>
                    <th className="px-1.5 py-4 text-center bg-purple-50/30">Ra (S)</th>
                    <th className="px-2 py-4 text-center bg-purple-50/70 font-black text-secondary border-r border-zinc-200">Overall</th>

                    <th className="px-3 py-4 text-center">Tăng</th>
                    <th className="px-4 py-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 font-semibold text-zinc-700 bg-white">
                  {paginatedStudents.map((st) => {
                    const draft = drafts[st.id] || {
                      entranceL: "-", entranceR: "-", entranceW: "-", entranceS: "-", entranceO: "-",
                      finalL: "-", finalR: "-", finalW: "-", finalS: "-", finalO: "-",
                    };

                    const entO = Number(draft.entranceO);
                    const finO = Number(draft.finalO);
                    let deltaLabel = "—";
                    let deltaColor = "text-zinc-400 bg-zinc-50";

                    if (!isNaN(entO) && !isNaN(finO)) {
                      const diff = finO - entO;
                      if (diff > 0) {
                        deltaLabel = `+${diff.toFixed(1)}`;
                        deltaColor = "text-emerald-700 bg-emerald-50 border border-emerald-200/50";
                      } else if (diff < 0) {
                        deltaLabel = `${diff.toFixed(1)}`;
                        deltaColor = "text-rose-700 bg-rose-50 border border-rose-200/50";
                      } else {
                        deltaLabel = "0.0";
                        deltaColor = "text-zinc-600 bg-zinc-100";
                      }
                    }

                    const isSaving = savingId === st.id;

                    return (
                      <tr key={st.id} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-black text-foreground">{st.name}</div>
                          <div className="text-[10px] text-zinc-400 mt-0.5">{st.email}</div>
                        </td>
                        <td className="px-4 py-3 text-zinc-500">
                          {classMap.get(st.classId) || (
                            <span className="inline-flex rounded-full bg-zinc-100 px-2 py-0.5 text-[9px] font-bold text-zinc-500">
                              Không gán lớp
                            </span>
                          )}
                        </td>

                        {/* Editable Entrance scores */}
                        <td className="px-0.5 py-3 bg-blue-50/10 border-l border-zinc-100">
                          <input
                            type="text"
                            value={draft.entranceL}
                            onChange={(e) => handleUpdateDraft(st.id, "entranceL", e.target.value)}
                            className="w-9 h-7 text-center rounded-lg border border-zinc-200 text-xs font-bold focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none"
                          />
                        </td>
                        <td className="px-0.5 py-3 bg-blue-50/10">
                          <input
                            type="text"
                            value={draft.entranceR}
                            onChange={(e) => handleUpdateDraft(st.id, "entranceR", e.target.value)}
                            className="w-9 h-7 text-center rounded-lg border border-zinc-200 text-xs font-bold focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none"
                          />
                        </td>
                        <td className="px-0.5 py-3 bg-blue-50/10">
                          <input
                            type="text"
                            value={draft.entranceW}
                            onChange={(e) => handleUpdateDraft(st.id, "entranceW", e.target.value)}
                            className="w-9 h-7 text-center rounded-lg border border-zinc-200 text-xs font-bold focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none"
                          />
                        </td>
                        <td className="px-0.5 py-3 bg-blue-50/10">
                          <input
                            type="text"
                            value={draft.entranceS}
                            onChange={(e) => handleUpdateDraft(st.id, "entranceS", e.target.value)}
                            className="w-9 h-7 text-center rounded-lg border border-zinc-200 text-xs font-bold focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none"
                          />
                        </td>
                        <td className="px-1 py-3 bg-blue-50/20 text-center border-r border-zinc-200">
                          <input
                            type="text"
                            value={draft.entranceO}
                            onChange={(e) => handleUpdateDraft(st.id, "entranceO", e.target.value)}
                            className="w-9 h-7 text-center rounded-lg border border-primary/40 bg-blue-50/30 text-xs font-black text-primary focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                          />
                        </td>

                        {/* Editable Final scores */}
                        <td className="px-0.5 py-3 bg-purple-50/10">
                          <input
                            type="text"
                            value={draft.finalL}
                            onChange={(e) => handleUpdateDraft(st.id, "finalL", e.target.value)}
                            className="w-9 h-7 text-center rounded-lg border border-zinc-200 text-xs font-bold focus:border-secondary focus:ring-1 focus:ring-secondary/20 outline-none"
                          />
                        </td>
                        <td className="px-0.5 py-3 bg-purple-50/10">
                          <input
                            type="text"
                            value={draft.finalR}
                            onChange={(e) => handleUpdateDraft(st.id, "finalR", e.target.value)}
                            className="w-9 h-7 text-center rounded-lg border border-zinc-200 text-xs font-bold focus:border-secondary focus:ring-1 focus:ring-secondary/20 outline-none"
                          />
                        </td>
                        <td className="px-0.5 py-3 bg-purple-50/10">
                          <input
                            type="text"
                            value={draft.finalW}
                            onChange={(e) => handleUpdateDraft(st.id, "finalW", e.target.value)}
                            className="w-9 h-7 text-center rounded-lg border border-zinc-200 text-xs font-bold focus:border-secondary focus:ring-1 focus:ring-secondary/20 outline-none"
                          />
                        </td>
                        <td className="px-0.5 py-3 bg-purple-50/10">
                          <input
                            type="text"
                            value={draft.finalS}
                            onChange={(e) => handleUpdateDraft(st.id, "finalS", e.target.value)}
                            className="w-9 h-7 text-center rounded-lg border border-zinc-200 text-xs font-bold focus:border-secondary focus:ring-1 focus:ring-secondary/20 outline-none"
                          />
                        </td>
                        <td className="px-1 py-3 bg-purple-50/20 text-center border-r border-zinc-200">
                          <input
                            type="text"
                            value={draft.finalO}
                            onChange={(e) => handleUpdateDraft(st.id, "finalO", e.target.value)}
                            className="w-9 h-7 text-center rounded-lg border border-secondary/40 bg-purple-50/30 text-xs font-black text-secondary focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none"
                          />
                        </td>

                        {/* Delta */}
                        <td className="px-3 py-3 text-center">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums ${deltaColor}`}
                          >
                            {deltaLabel}
                          </span>
                        </td>

                        {/* Action buttons */}
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              disabled={isSaving}
                              onClick={() => void handleSaveScores(st.id)}
                              className={`rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-wider transition-colors ${
                                isSaving
                                  ? "bg-emerald-500 text-white"
                                  : "bg-secondary text-white hover:bg-secondary/90 shadow-sm"
                              }`}
                            >
                              {isSaving ? "Đã lưu" : "Lưu"}
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleDelete(st.id, st.name)}
                              className="rounded-lg border border-red-200 hover:bg-red-50 text-red-600 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider transition-all"
                            >
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm mt-4 text-xs font-semibold">
            <div className="text-zinc-500">
              Đang xem <span className="font-bold text-zinc-800">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> -{" "}
              <span className="font-bold text-zinc-800">
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredStudents.length)}
              </span>{" "}
              trong tổng số <span className="font-bold text-zinc-800">{filteredStudents.length}</span> hồ sơ
            </div>
            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="h-8 rounded-lg border border-zinc-200 bg-white px-3 text-[10px] font-black uppercase tracking-wider text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 transition-colors"
              >
                Trước
              </button>
              {Array.from({ length: totalPages }).map((_, idx) => {
                const p = idx + 1;
                return (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    className={`h-8 w-8 rounded-lg text-[10px] font-black transition-colors ${
                      currentPage === p
                        ? "bg-primary text-white"
                        : "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="h-8 rounded-lg border border-zinc-200 bg-white px-3 text-[10px] font-black uppercase tracking-wider text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 transition-colors"
              >
                Sau
              </button>
            </div>
          </div>
        )}

        {/* Excel Import Modal */}
        <AcaXlsxImportModal
          open={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          fields={SCORE_IMPORT_FIELDS}
          title="Nhập Điểm Học Viên từ Excel"
          onImport={handleImportScores}
        />

        {/* Add Student Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-premium animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-4 mb-4">
                <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
                  Thêm Học Viên Chẩn Bệnh Mới
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddStudent} className="space-y-4 text-xs font-semibold text-zinc-700">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1.5">
                      Họ và Tên
                    </label>
                    <input
                      type="text"
                      required
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Nguyễn Văn A"
                      className="h-10 w-full rounded-xl border border-zinc-200 px-3 outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1.5">
                      Email đối chiếu
                    </label>
                    <input
                      type="email"
                      required
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="email@domain.com"
                      className="h-10 w-full rounded-xl border border-zinc-200 px-3 outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1.5">
                      Số điện thoại
                    </label>
                    <input
                      type="tel"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      placeholder="0912345678"
                      className="h-10 w-full rounded-xl border border-zinc-200 px-3 outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1.5">
                      Lớp học (Nếu có)
                    </label>
                    <select
                      value={newClassId}
                      onChange={(e) => setNewClassId(e.target.value)}
                      className="h-10 w-full rounded-xl border border-zinc-200 px-3 outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
                    >
                      <option value="">Không gán lớp (Tự do)</option>
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="border-t border-zinc-100 pt-4">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-primary mb-3">
                    Nhập điểm đầu vào (Entrance Scores)
                  </h4>
                  <div className="grid grid-cols-5 gap-2">
                    {["entranceL", "entranceR", "entranceW", "entranceS", "entranceO"].map((field) => (
                      <div key={field}>
                        <label className="block text-[9px] font-bold text-zinc-500 text-center mb-1">
                          {field.replace("entrance", "")}
                        </label>
                        <input
                          type="text"
                          value={(newEntrance as any)[field]}
                          onChange={(e) => setNewEntrance({ ...newEntrance, [field]: e.target.value })}
                          className="h-9 w-full text-center rounded-lg border border-zinc-200 outline-none focus:border-primary"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-zinc-100 pt-4">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-secondary mb-3">
                    Nhập điểm đầu ra (Final Scores)
                  </h4>
                  <div className="grid grid-cols-5 gap-2">
                    {["finalL", "finalR", "finalW", "finalS", "finalO"].map((field) => (
                      <div key={field}>
                        <label className="block text-[9px] font-bold text-zinc-500 text-center mb-1">
                          {field.replace("final", "")}
                        </label>
                        <input
                          type="text"
                          value={(newEntrance as any)[field]}
                          onChange={(e) => setNewEntrance({ ...newEntrance, [field]: e.target.value })}
                          className="h-9 w-full text-center rounded-lg border border-zinc-200 outline-none focus:border-secondary"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 border-t border-zinc-100 pt-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="h-10 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-5 text-xs font-black uppercase"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="h-10 rounded-xl bg-primary text-white px-5 text-xs font-black uppercase shadow-soft hover:shadow-hover hover:-translate-y-0.5 transition-all"
                  >
                    Lưu học viên
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>
    </BdLayout>
  );
}
