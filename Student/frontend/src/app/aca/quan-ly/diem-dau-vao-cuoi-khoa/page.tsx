"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AcaLayout } from "@/components/aca/AcaLayout";
import { AcaTopbar } from "@/components/aca/AcaTopbar";
import {
  fetchAcaStudents,
  fetchAcaClasses,
  updateAcaStudent,
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
  l: string;
  r: string;
  w: string;
  s: string;
  o: string;
};

export default function DiemDauVaoCuoiKhoaPage() {
  const [students, setStudents] = useState<AcaStudent[]>([]);
  const [classes, setClasses] = useState<AcaClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Local drafts for inline final scores editing
  const [drafts, setDrafts] = useState<Record<string, ScoreDraft>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

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
        l: String(updated.finalScores?.l ?? "-"),
        r: String(updated.finalScores?.r ?? "-"),
        w: String(updated.finalScores?.w ?? "-"),
        s: String(updated.finalScores?.s ?? "-"),
        o: String(updated.finalScores?.o ?? "-"),
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
          l: String(s.finalScores?.l ?? "-"),
          r: String(s.finalScores?.r ?? "-"),
          w: String(s.finalScores?.w ?? "-"),
          s: String(s.finalScores?.s ?? "-"),
          o: String(s.finalScores?.o ?? "-"),
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

  const handleUpdateDraft = (studentId: string, field: keyof ScoreDraft, value: string) => {
    setDrafts((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value,
      },
    }));
  };

  const handleSaveFinalScores = async (studentId: string) => {
    const draft = drafts[studentId];
    if (!draft) return;

    setSavingId(studentId);
    try {
      const updated = await updateAcaStudent(studentId, {
        finalScores: {
          l: draft.l.trim() || "-",
          r: draft.r.trim() || "-",
          w: draft.w.trim() || "-",
          s: draft.s.trim() || "-",
          o: draft.o.trim() || "-",
        },
      });

      // Update local students state
      setStudents((prev) =>
        prev.map((s) => (s.id === studentId ? { ...s, finalScores: updated.finalScores } : s))
      );

      // Flash success indicators by briefly resetting savingId
      setTimeout(() => {
        setSavingId(null);
      }, 800);
    } catch (err: any) {
      alert("Không lưu được điểm đầu ra: " + err.message);
      setSavingId(null);
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

  // Stats calculation
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

  return (
    <AcaLayout>
      <AcaTopbar
        title="Danh sách điểm đầu vào / cuối khóa"
        subtitle="Quản lý đồng bộ điểm số đầu vào (từ danh sách học viên tổng) và nhập điểm thi cuối khóa của học viên."
      />
      <main className="mx-auto max-w-7xl px-6 py-6 pb-16 md:px-8 space-y-6">
        
        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {/* Highlight Stats */}
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="text-[10px] font-bold uppercase text-zinc-500">Tổng học viên</div>
            <div className="mt-2 text-2xl font-black text-foreground">
              {loading ? "..." : `${students.length} học viên`}
            </div>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="text-[10px] font-bold uppercase text-zinc-500">Đầu vào TB (Overall)</div>
            <div className="mt-2 text-2xl font-black text-primary">
              {loading ? "..." : `${stats.avgEntrance} Band`}
            </div>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="text-[10px] font-bold uppercase text-zinc-500">Đầu ra TB (Overall)</div>
            <div className="mt-2 text-2xl font-black text-secondary">
              {loading ? "..." : `${stats.avgFinal} Band`}
            </div>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="text-[10px] font-bold uppercase text-zinc-500">Mức tăng trưởng TB</div>
            <div className="mt-2 text-2xl font-black text-success">
              {loading ? "..." : stats.avgDelta !== "—" ? `+${stats.avgDelta} Band` : "—"}
            </div>
          </div>
        </div>

        {/* Filter / Action bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="flex flex-1 items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Tìm học viên theo tên, lớp hoặc email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-4 text-xs font-bold text-foreground outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="h-10 rounded-xl border border-success/30 bg-success/10 text-success px-4 text-xs font-black uppercase shadow-soft hover:bg-success/15 hover:-translate-y-0.5 transition-all flex items-center gap-1.5"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Nhập điểm Excel
            </button>
          </div>
        </div>

        {/* Table list */}
        {loading ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center text-sm text-zinc-500">
            Đang tải dữ liệu học viên...
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50 text-[10px] font-black uppercase tracking-widest text-muted">
                    <th className="px-4 py-4 min-w-[150px]">Tên học viên</th>
                    <th className="px-4 py-4 min-w-[150px]">Lớp học</th>
                    
                    {/* Entrance columns */}
                    <th className="px-2 py-4 text-center bg-blue-50/30">Đầu vào (L)</th>
                    <th className="px-2 py-4 text-center bg-blue-50/30">Đầu vào (R)</th>
                    <th className="px-2 py-4 text-center bg-blue-50/30">Đầu vào (W)</th>
                    <th className="px-2 py-4 text-center bg-blue-50/30">Đầu vào (S)</th>
                    <th className="px-2 py-4 text-center bg-blue-50/70 font-black text-primary border-r border-zinc-200">Overall</th>
                    
                    {/* Output columns */}
                    <th className="px-2 py-4 text-center bg-purple-50/30">Đầu ra (L)</th>
                    <th className="px-2 py-4 text-center bg-purple-50/30">Đầu ra (R)</th>
                    <th className="px-2 py-4 text-center bg-purple-50/30">Đầu ra (W)</th>
                    <th className="px-2 py-4 text-center bg-purple-50/30">Đầu ra (S)</th>
                    <th className="px-2 py-4 text-center bg-purple-50/70 font-black text-secondary border-r border-zinc-200">Overall</th>
                    
                    <th className="px-3 py-4 text-center">Tăng (Delta)</th>
                    <th className="px-4 py-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 font-semibold text-zinc-700 bg-white">
                  {filteredStudents.map((st) => {
                    const draft = drafts[st.id] || { l: "-", r: "-", w: "-", s: "-", o: "-" };
                    
                    // Growth overall delta calculation
                    const entO = Number(st.scores?.o);
                    const finO = Number(draft.o);
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
                        <td className="px-4 py-4 font-black text-foreground">{st.name}</td>
                        <td className="px-4 py-4 text-zinc-500 text-[11px]">
                          {classMap.get(st.classId) || "Không rõ lớp"}
                        </td>

                        {/* Entrance stats */}
                        <td className="px-2 py-4 text-center tabular-nums bg-blue-50/10 border-l border-zinc-100">{st.scores?.l}</td>
                        <td className="px-2 py-4 text-center tabular-nums bg-blue-50/10">{st.scores?.r}</td>
                        <td className="px-2 py-4 text-center tabular-nums bg-blue-50/10">{st.scores?.w}</td>
                        <td className="px-2 py-4 text-center tabular-nums bg-blue-50/10">{st.scores?.s}</td>
                        <td className="px-2 py-4 text-center font-bold tabular-nums bg-blue-50/30 text-primary border-r border-zinc-200">
                          {st.scores?.o}
                        </td>

                        {/* Editable output stats */}
                        <td className="px-1 py-2 text-center bg-purple-50/10">
                          <input
                            type="text"
                            value={draft.l}
                            onChange={(e) => handleUpdateDraft(st.id, "l", e.target.value)}
                            className="w-10 text-center rounded-lg border border-zinc-200 px-1 py-1 font-bold text-zinc-800 focus:border-secondary focus:ring-1 focus:ring-secondary/20 outline-none"
                          />
                        </td>
                        <td className="px-1 py-2 text-center bg-purple-50/10">
                          <input
                            type="text"
                            value={draft.r}
                            onChange={(e) => handleUpdateDraft(st.id, "r", e.target.value)}
                            className="w-10 text-center rounded-lg border border-zinc-200 px-1 py-1 font-bold text-zinc-800 focus:border-secondary focus:ring-1 focus:ring-secondary/20 outline-none"
                          />
                        </td>
                        <td className="px-1 py-2 text-center bg-purple-50/10">
                          <input
                            type="text"
                            value={draft.w}
                            onChange={(e) => handleUpdateDraft(st.id, "w", e.target.value)}
                            className="w-10 text-center rounded-lg border border-zinc-200 px-1 py-1 font-bold text-zinc-800 focus:border-secondary focus:ring-1 focus:ring-secondary/20 outline-none"
                          />
                        </td>
                        <td className="px-1 py-2 text-center bg-purple-50/10">
                          <input
                            type="text"
                            value={draft.s}
                            onChange={(e) => handleUpdateDraft(st.id, "s", e.target.value)}
                            className="w-10 text-center rounded-lg border border-zinc-200 px-1 py-1 font-bold text-zinc-800 focus:border-secondary focus:ring-1 focus:ring-secondary/20 outline-none"
                          />
                        </td>
                        <td className="px-1 py-2 text-center bg-purple-50/30 border-r border-zinc-200">
                          <input
                            type="text"
                            value={draft.o}
                            onChange={(e) => handleUpdateDraft(st.id, "o", e.target.value)}
                            className="w-10 text-center rounded-lg border border-secondary/40 bg-purple-50 px-1 py-1 font-black text-secondary focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none"
                          />
                        </td>

                        {/* Delta display */}
                        <td className="px-3 py-4 text-center">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums ${deltaColor}`}
                          >
                            {deltaLabel}
                          </span>
                        </td>

                        {/* Save Action */}
                        <td className="px-4 py-4 text-right">
                          <button
                            type="button"
                            disabled={isSaving}
                            onClick={() => void handleSaveFinalScores(st.id)}
                            className={`rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition-colors ${
                              isSaving
                                ? "bg-emerald-500 text-white"
                                : "bg-secondary text-white hover:bg-secondary/90 shadow-sm"
                            }`}
                          >
                            {isSaving ? "Đã lưu ✓" : "Lưu"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      <AcaXlsxImportModal
        open={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Nhập điểm học viên từ Excel"
        fields={SCORE_IMPORT_FIELDS}
        onImport={handleImportScores}
        templateDescription="Các cột hợp lệ: Email đối chiếu (bắt buộc), Điểm vào L/R/W/S/O (entranceL/entranceR/...), Điểm ra L/R/W/S/O (finalL/finalR/...)"
      />
    </AcaLayout>
  );
}
