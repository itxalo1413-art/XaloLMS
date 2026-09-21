"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AcaLayout } from "@/components/aca/AcaLayout";
import { AcaTopbar } from "@/components/aca/AcaTopbar";
import {
  fetchRlpTemplates,
  createRlpTemplate,
  updateRlpTemplate,
  deleteRlpTemplate,
  type RlpTemplate,
  type RlpTemplateSessionItem,
} from "@/lib/rlpTemplateApi";
import { confirmDialog } from "@/components/shared/ConfirmDialog";

const LEVEL_OPTIONS = [
  "Foundation",
  "Pre-IELTS",
  "IELTS Core 1",
  "IELTS Core 2",
  "Intensive",
  "Luyện đề",
  "Lớp 1:1",
  "Khác",
];

const SKILL_OPTIONS = [
  "Speaking",
  "Writing",
  "Listening",
  "Reading",
  "Grammar & Vocab",
  "Mock Test",
  "Revision & Feedback",
];

export default function RlpMauPage() {
  // Data: Templates (Các lớp mẫu RLP)
  const [templates, setTemplates] = useState<RlpTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters for Templates Table
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");

  // ── Selected Template Popup State ──
  const [selectedTemplate, setSelectedTemplate] = useState<RlpTemplate | null>(null);
  const [popupPhaseFilter, setPopupPhaseFilter] = useState<"all" | "phase1" | "phase2">("all");
  const [popupSkillFilter, setPopupSkillFilter] = useState<string>("all");

  // ── Edit Single Session in Template State ("Chỗ Edit") ──
  const [editingSession, setEditingSession] = useState<RlpTemplateSessionItem | null>(null);
  const [sessionDraft, setSessionDraft] = useState<RlpTemplateSessionItem | null>(null);
  const [savingSession, setSavingSession] = useState(false);

  // ── Create New Template Modal State ──
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createKey, setCreateKey] = useState("");
  const [createLevel, setCreateLevel] = useState("Foundation");
  const [createDesc, setCreateDesc] = useState("");
  const [creatingTemplate, setCreatingTemplate] = useState(false);

  const showToast = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  // Load Templates
  const loadTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchRlpTemplates();
      setTemplates(list || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được danh sách mẫu RLP.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTemplates();
  }, [loadTemplates]);

  // Filtered Templates for Table
  const filteredTemplates = useMemo(() => {
    return templates.filter((tpl) => {
      // Level filter
      if (levelFilter !== "all" && tpl.level !== levelFilter) {
        return false;
      }
      // Search filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchTitle = tpl.title?.toLowerCase().includes(q);
        const matchKey = tpl.key?.toLowerCase().includes(q);
        const matchLevel = tpl.level?.toLowerCase().includes(q);
        const matchDesc = tpl.description?.toLowerCase().includes(q);
        if (!matchTitle && !matchKey && !matchLevel && !matchDesc) {
          return false;
        }
      }
      return true;
    });
  }, [templates, searchTerm, levelFilter]);

  // Open Template RLP Popup
  const handleOpenTemplatePopup = (tpl: RlpTemplate) => {
    setSelectedTemplate(tpl);
    setPopupPhaseFilter("all");
    setPopupSkillFilter("all");
    setEditingSession(null);
    setSessionDraft(null);
  };

  // Close Template RLP Popup
  const handleCloseTemplatePopup = () => {
    setSelectedTemplate(null);
    setEditingSession(null);
    setSessionDraft(null);
  };

  // Filtered Sessions inside Template Popup
  const filteredPopupSessions = useMemo(() => {
    if (!selectedTemplate?.sessions) return [];
    return [...selectedTemplate.sessions]
      .filter((s) => {
        if (popupPhaseFilter === "phase1" && s.no > 18) return false;
        if (popupPhaseFilter === "phase2" && (s.no <= 18 || s.no > 36)) return false;
        if (popupSkillFilter === "all") return true;
        return s.skill?.toLowerCase().includes(popupSkillFilter.toLowerCase());
      })
      .sort((a, b) => a.no - b.no);
  }, [selectedTemplate, popupPhaseFilter, popupSkillFilter]);

  // Open Edit Session
  const handleOpenEditSession = (session: RlpTemplateSessionItem) => {
    setEditingSession(session);
    setSessionDraft({ ...session });
  };

  // Save Edit Session ("Chỗ Edit")
  const handleSaveSession = async () => {
    if (!sessionDraft || !editingSession || !selectedTemplate) return;
    setSavingSession(true);
    try {
      const nextSessions = selectedTemplate.sessions.map((s) =>
        s.no === sessionDraft.no ? { ...sessionDraft } : s,
      );

      await updateRlpTemplate(selectedTemplate.key, {
        sessions: nextSessions,
        totalSessions: nextSessions.length,
      });

      const updatedTemplate: RlpTemplate = {
        ...selectedTemplate,
        sessions: nextSessions,
        totalSessions: nextSessions.length,
      };

      // Update both current selected popup and main templates list
      setSelectedTemplate(updatedTemplate);
      setTemplates((prev) =>
        prev.map((t) => (t.key === selectedTemplate.key ? updatedTemplate : t)),
      );

      setEditingSession(null);
      setSessionDraft(null);
      showToast(`Đã lưu nội dung Buổi ${sessionDraft.no} của lớp mẫu "${selectedTemplate.title}".`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lưu buổi học thất bại.");
    } finally {
      setSavingSession(false);
    }
  };

  // Add Session to Template
  const handleAddSession = async () => {
    if (!selectedTemplate) return;
    const nextNo = (selectedTemplate.sessions?.length || 0) + 1;
    const newSession: RlpTemplateSessionItem = {
      no: nextNo,
      skill: "Speaking",
      contents: "",
      teacherNote: "",
      lessonFileUrl: "",
      recordingUrl: "",
      homeworkFileUrl: "",
    };

    const nextSessions = [...(selectedTemplate.sessions || []), newSession];
    try {
      await updateRlpTemplate(selectedTemplate.key, {
        sessions: nextSessions,
        totalSessions: nextSessions.length,
      });

      const updatedTemplate: RlpTemplate = {
        ...selectedTemplate,
        sessions: nextSessions,
        totalSessions: nextSessions.length,
      };

      setSelectedTemplate(updatedTemplate);
      setTemplates((prev) =>
        prev.map((t) => (t.key === selectedTemplate.key ? updatedTemplate : t)),
      );

      showToast(`Đã thêm Buổi ${nextNo} vào lớp mẫu.`);
      handleOpenEditSession(newSession);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Thêm buổi học thất bại.");
    }
  };

  // Delete Session from Template
  const handleDeleteSession = async (no: number) => {
    if (!selectedTemplate) return;
    const ok = await confirmDialog({
      title: `Xóa Buổi ${no}`,
      message: `Bạn có chắc chắn muốn xóa Buổi ${no} khỏi lớp mẫu "${selectedTemplate.title}" không?`,
      confirmText: "Xóa",
      cancelText: "Hủy",
      variant: "danger",
    });
    if (!ok) return;

    const nextSessions = selectedTemplate.sessions
      .filter((s) => s.no !== no)
      .map((s, idx) => ({ ...s, no: idx + 1 }));

    try {
      await updateRlpTemplate(selectedTemplate.key, {
        sessions: nextSessions,
        totalSessions: nextSessions.length,
      });

      const updatedTemplate: RlpTemplate = {
        ...selectedTemplate,
        sessions: nextSessions,
        totalSessions: nextSessions.length,
      };

      setSelectedTemplate(updatedTemplate);
      setTemplates((prev) =>
        prev.map((t) => (t.key === selectedTemplate.key ? updatedTemplate : t)),
      );

      showToast(`Đã xóa Buổi ${no}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xóa buổi học thất bại.");
    }
  };

  // Create New Template
  const handleCreateTemplate = async () => {
    if (!createTitle.trim() || !createKey.trim()) return;
    setCreatingTemplate(true);
    try {
      const standard36: RlpTemplateSessionItem[] = Array.from({ length: 36 }, (_, idx) => {
        const no = idx + 1;
        const skills = ["Speaking", "Reading", "Writing", "Listening"];
        return {
          no,
          skill: no === 18 || no === 36 ? "Mock Test" : skills[idx % 4],
          contents: "",
          teacherNote: "",
          lessonFileUrl: "",
          homeworkFileUrl: "",
          recordingUrl: "",
        };
      });

      const newTpl = await createRlpTemplate({
        key: createKey.trim().toLowerCase(),
        title: createTitle.trim(),
        level: createLevel,
        description: createDesc.trim(),
        totalSessions: 36,
        sessions: standard36,
        isDefault: false,
      });

      setTemplates((prev) => [...prev, newTpl]);
      setIsCreateModalOpen(false);
      showToast(`Đã tạo lớp mẫu mới: "${newTpl.title}" (36 buổi).`);
      handleOpenTemplatePopup(newTpl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tạo lớp mẫu thất bại.");
    } finally {
      setCreatingTemplate(false);
    }
  };

  // Delete Template
  const handleDeleteTemplate = async (key: string, title: string) => {
    const ok = await confirmDialog({
      title: "Xóa Lớp Mẫu RLP",
      message: `Bạn có chắc chắn muốn xóa lớp mẫu "${title}" không? Hành động này không thể hoàn tác.`,
      confirmText: "Xóa",
      cancelText: "Hủy",
      variant: "danger",
    });
    if (!ok) return;

    try {
      await deleteRlpTemplate(key);
      setTemplates((prev) => prev.filter((t) => t.key !== key));
      if (selectedTemplate?.key === key) {
        setSelectedTemplate(null);
      }
      showToast(`Đã xóa lớp mẫu "${title}".`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xóa lớp mẫu thất bại.");
    }
  };

  return (
    <AcaLayout>
      <div className="space-y-5 pb-20 max-w-7xl mx-auto">
        <AcaTopbar
          title="Mẫu RLP (36 Buổi)"
          subtitle="Danh sách các lớp mẫu RLP. Bấm vào một lớp để mở popup xem và chỉnh sửa chi tiết 36 buổi giáo án."
        />

        {/* Alerts / Toasts */}
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800 flex items-center justify-between">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError(null)}
              className="font-bold text-rose-600 hover:underline cursor-pointer ml-4"
            >
              Đóng
            </button>
          </div>
        )}

        {successMsg && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800 flex items-center justify-between">
            <span className="font-semibold flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {successMsg}
            </span>
            <button
              type="button"
              onClick={() => setSuccessMsg(null)}
              className="font-bold text-emerald-600 hover:underline cursor-pointer ml-4"
            >
              Đóng
            </button>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            BẢNG DANH SÁCH CÁC LỚP MẪU RLP (DẠNG BẢNG CHỨ KHÔNG ĐỂ 1 HÀNG NGANG)
            ════════════════════════════════════════════════════════════ */}
        <div className="space-y-4">
          {/* Thanh tìm kiếm và bộ lọc */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3.5 rounded-2xl border border-zinc-200">
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Search */}
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm lớp mẫu (Foundation, Pre-IELTS, Core 1...)"
                className="rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 py-1.5 text-xs font-medium text-zinc-800 outline-none focus:border-primary focus:bg-white w-64 sm:w-80"
              />

              {/* Level Filter */}
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 outline-none focus:border-primary cursor-pointer"
              >
                <option value="all">Tất cả lớp mẫu</option>
                {LEVEL_OPTIONS.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-center">
              <span className="text-xs text-zinc-500 font-medium">
                Hiển thị <strong>{filteredTemplates.length}</strong> lớp mẫu
              </span>

              <button
                type="button"
                onClick={() => {
                  setCreateTitle("");
                  setCreateKey(`mau-${Date.now().toString(36)}`);
                  setCreateLevel("Foundation");
                  setCreateDesc("");
                  setIsCreateModalOpen(true);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <span className="text-base leading-none font-bold">+</span>
                <span>Thêm Lớp Mẫu Mới</span>
              </button>
            </div>
          </div>

          {/* Bảng Các Lớp Mẫu */}
          {loading ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-zinc-200 text-zinc-400 font-medium text-xs">
              Đang tải danh sách lớp mẫu RLP...
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-zinc-200 text-zinc-500 text-xs">
              Không tìm thấy lớp mẫu nào phù hợp.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-zinc-50 border-b border-zinc-200 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  <tr>
                    <th className="px-5 py-3 w-14 text-center">STT</th>
                    <th className="px-5 py-3 w-48 whitespace-nowrap">Mã mẫu</th>
                    <th className="px-5 py-3 min-w-[220px]">Tên lớp mẫu</th>
                    <th className="px-5 py-3 w-28 text-center">Thời lượng</th>
                    <th className="px-5 py-3 min-w-[280px]">Mô tả giáo án</th>
                    <th className="px-5 py-3 w-36 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 font-medium text-xs text-zinc-700">
                  {filteredTemplates.map((tpl, index) => {
                    const cleanTitle = tpl.title.replace("RLP Mẫu: ", "").replace(" (36 buổi)", "");
                    return (
                      <tr
                        key={tpl.key}
                        onClick={() => handleOpenTemplatePopup(tpl)}
                        className="hover:bg-zinc-50/70 transition-colors cursor-pointer group"
                      >
                        {/* STT */}
                        <td className="px-5 py-3.5 text-center font-bold text-zinc-400 tabular-nums">
                          {index + 1}
                        </td>

                        {/* Mã mẫu */}
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className="inline-flex items-center px-3 py-1 rounded-lg bg-zinc-100 border border-zinc-200 font-mono text-xs font-semibold text-zinc-800 tracking-tight">
                            {tpl.key}
                          </span>
                        </td>

                        {/* Tên lớp mẫu */}
                        <td className="px-5 py-3.5 text-zinc-950 font-bold group-hover:text-primary transition-colors text-[13px]">
                          {cleanTitle}
                        </td>

                        {/* Thời lượng */}
                        <td className="px-5 py-3.5 text-center">
                          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-zinc-100 text-zinc-800">
                            {tpl.totalSessions || tpl.sessions?.length || 36} buổi
                          </span>
                        </td>

                        {/* Mô tả giáo án */}
                        <td className="px-5 py-3.5 text-zinc-500 leading-snug line-clamp-2 max-w-sm">
                          {tpl.description || <span className="italic text-zinc-300">Chưa có mô tả giáo án.</span>}
                        </td>

                        {/* Hành động */}
                        <td className="px-5 py-3.5 text-right">
                          <div className="inline-flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => handleOpenTemplatePopup(tpl)}
                              className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-primary text-white font-bold text-xs transition-all cursor-pointer shadow-2xs"
                            >
                              Xem / Sửa RLP
                            </button>
                            {!tpl.isDefault && (
                              <button
                                type="button"
                                onClick={() => handleDeleteTemplate(tpl.key, tpl.title)}
                                className="px-2 py-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold text-xs transition-all cursor-pointer"
                                title="Xóa lớp mẫu này"
                              >
                                Xóa
                              </button>
                            )}
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

        {/* ════════════════════════════════════════════════════════════
            POPUP BẢNG RLP CỦA LỚP MẪU ĐƯỢC CHỌN (36 BUỔI)
            ════════════════════════════════════════════════════════════ */}
        {selectedTemplate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/50 backdrop-blur-2xs animate-in fade-in duration-150">
            <div className="relative w-full max-w-6xl max-h-[92vh] flex flex-col rounded-3xl bg-white shadow-2xl overflow-hidden border border-zinc-200">
              {/* Header Popup */}
              <div className="p-5 border-b border-zinc-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-zinc-50/80">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-zinc-900 text-white font-mono text-[11px] font-bold">
                      {selectedTemplate.key}
                    </span>
                    <h3 className="text-base font-bold text-zinc-950">
                      {selectedTemplate.title.replace("RLP Mẫu: ", "").replace(" (36 buổi)", "")}
                    </h3>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-zinc-100 text-zinc-700">
                      {selectedTemplate.sessions?.length || 36} buổi chuẩn
                    </span>
                  </div>
                  {selectedTemplate.description && (
                    <p className="text-xs text-zinc-500 pt-0.5 max-w-3xl">
                      {selectedTemplate.description}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleCloseTemplatePopup}
                  className="rounded-full p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/60 transition-colors cursor-pointer self-end sm:self-auto"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Body: Toolbar & Sessions Table */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {/* Thanh Chặng, Kỹ Năng & Thêm Buổi */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1 rounded-xl bg-zinc-100 p-1">
                      <button
                        type="button"
                        onClick={() => setPopupPhaseFilter("all")}
                        className={`rounded-lg px-3 py-1 text-[11px] font-bold cursor-pointer transition-all ${
                          popupPhaseFilter === "all" ? "bg-white text-zinc-950 shadow-2xs" : "text-zinc-500 hover:text-zinc-900"
                        }`}
                      >
                        Tất cả ({selectedTemplate.sessions?.length || 36} buổi)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPopupPhaseFilter("phase1")}
                        className={`rounded-lg px-3 py-1 text-[11px] font-bold cursor-pointer transition-all ${
                          popupPhaseFilter === "phase1" ? "bg-white text-zinc-950 shadow-2xs" : "text-zinc-500 hover:text-zinc-900"
                        }`}
                      >
                        Chặng 1 (1 - 18)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPopupPhaseFilter("phase2")}
                        className={`rounded-lg px-3 py-1 text-[11px] font-bold cursor-pointer transition-all ${
                          popupPhaseFilter === "phase2" ? "bg-white text-zinc-950 shadow-2xs" : "text-zinc-500 hover:text-zinc-900"
                        }`}
                      >
                        Chặng 2 (19 - 36)
                      </button>
                    </div>

                    <select
                      value={popupSkillFilter}
                      onChange={(e) => setPopupSkillFilter(e.target.value)}
                      className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 outline-none focus:border-primary cursor-pointer"
                    >
                      <option value="all">Tất cả kỹ năng</option>
                      {SKILL_OPTIONS.map((sk) => (
                        <option key={sk} value={sk}>
                          {sk}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddSession}
                    className="px-3.5 py-1.5 rounded-xl border border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-100 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 self-start sm:self-auto shrink-0"
                  >
                    <span className="text-primary font-bold text-sm leading-none">+</span> Thêm buổi
                  </button>
                </div>

                {/* Bảng RLP 36 Buổi của Lớp Mẫu */}
                <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-xs">
                  <table className="w-full min-w-[850px] text-left text-xs border-collapse">
                    <thead className="bg-zinc-50 border-b border-zinc-200 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      <tr>
                        <th className="px-5 py-3 w-16 text-center">Buổi</th>
                        <th className="px-5 py-3 w-28 text-center">Skill</th>
                        <th className="px-5 py-3 min-w-[220px]">Nội dung bài học chuẩn</th>
                        <th className="px-5 py-3 min-w-[180px]">Tiến độ (Ghi chú GV)</th>
                        <th className="px-5 py-3 w-24 text-center">File bài học</th>
                        <th className="px-5 py-3 w-24 text-center">Record</th>
                        <th className="px-5 py-3 w-24 text-center">Homework</th>
                        <th className="px-5 py-3 text-right w-24">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 font-medium text-xs text-zinc-700">
                      {filteredPopupSessions.map((row) => (
                        <tr key={row.no} className="hover:bg-zinc-50/50 transition-colors">
                          {/* Buổi */}
                          <td className="px-5 py-3.5 text-center font-bold text-zinc-950 tabular-nums">
                            Buổi {row.no}
                          </td>

                          {/* Skill */}
                          <td className="px-5 py-3.5 text-center">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                                row.skill === "Speaking"
                                  ? "bg-primary/10 text-primary"
                                  : row.skill === "Reading"
                                  ? "bg-info/10 text-info"
                                  : row.skill === "Writing"
                                  ? "bg-purple-100 text-purple-700"
                                  : row.skill === "Listening"
                                  ? "bg-amber-100 text-amber-800"
                                  : row.skill === "Mock Test"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-indigo-100 text-indigo-800"
                              }`}
                            >
                              {row.skill}
                            </span>
                          </td>

                          {/* Nội dung */}
                          <td className="px-5 py-3.5 text-zinc-900 leading-snug font-medium max-w-xs break-words">
                            {row.contents?.trim() ? (
                              row.contents
                            ) : (
                              <span className="text-zinc-300 italic">Chưa có nội dung</span>
                            )}
                          </td>

                          {/* Tiến độ (Ghi chú GV) */}
                          <td className="px-5 py-3.5 text-zinc-500 text-[11px] break-words">
                            {row.teacherNote && row.teacherNote.trim() !== "—" ? (
                              <span className="italic text-zinc-700">&quot;{row.teacherNote}&quot;</span>
                            ) : (
                              "—"
                            )}
                          </td>

                          {/* File bài học */}
                          <td className="px-5 py-3.5 text-center">
                            {row.lessonFileUrl?.trim() ? (
                              <a
                                href={row.lessonFileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-success/20 bg-success/10 text-success hover:bg-success/20 transition-all"
                                title="Mở file bài học"
                              >
                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                                  <polyline points="14 2 14 8 20 8" />
                                </svg>
                              </a>
                            ) : (
                              <span className="text-zinc-400">—</span>
                            )}
                          </td>

                          {/* Record */}
                          <td className="px-5 py-3.5 text-center">
                            {row.recordingUrl?.trim() ? (
                              <a
                                href={row.recordingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-purple-200 bg-purple-100 text-purple-700 hover:bg-purple-200 transition-all"
                                title="Xem Record"
                              >
                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <polygon points="23 7 16 12 23 17 23 7" />
                                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                                </svg>
                              </a>
                            ) : (
                              <span className="text-zinc-400">—</span>
                            )}
                          </td>

                          {/* Homework */}
                          <td className="px-5 py-3.5 text-center">
                            {row.homeworkFileUrl?.trim() ? (
                              <a
                                href={row.homeworkFileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary hover:bg-primary/20 transition-all"
                                title="Mở bài tập Docs"
                              >
                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <path d="M14 2H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V8z" />
                                  <polyline points="14 2 14 8 20 8" />
                                  <line x1="9" y1="13" x2="15" y2="13" />
                                </svg>
                              </a>
                            ) : (
                              <span className="text-zinc-400">—</span>
                            )}
                          </td>

                          {/* Thao tác (Sửa / Xóa) */}
                          <td className="px-5 py-3.5 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEditSession(row)}
                                className="px-2.5 py-1 rounded-md text-xs font-bold text-primary hover:bg-primary/10 cursor-pointer"
                              >
                                Sửa
                              </button>
                              {selectedTemplate.sessions.length > 36 && (
                                <button
                                  type="button"
                                  onClick={() => void handleDeleteSession(row.no)}
                                  className="px-2 py-1 rounded-md text-xs font-bold text-rose-600 hover:bg-rose-50 cursor-pointer"
                                >
                                  Xóa
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Footer Popup */}
              <div className="p-4 border-t border-zinc-200 bg-zinc-50/80 flex items-center justify-between">
                <span className="text-xs text-zinc-500 font-medium">
                  Tổng cộng: <strong className="text-zinc-900">{selectedTemplate.sessions?.length || 36} buổi học</strong>
                </span>
                <button
                  type="button"
                  onClick={handleCloseTemplatePopup}
                  className="px-4 py-2 rounded-xl bg-zinc-900 text-white text-xs font-bold hover:bg-zinc-800 transition-all cursor-pointer shadow-xs"
                >
                  Đóng lại
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Modal Chỉnh Sửa 1 Buổi Của Lớp Mẫu ("Chỗ Edit") ── */}
        {editingSession && sessionDraft && selectedTemplate && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs">
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl border border-zinc-200 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <h4 className="text-sm font-bold text-zinc-900">
                  Chỉnh sửa Buổi {editingSession.no} - {selectedTemplate.title}
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    setEditingSession(null);
                    setSessionDraft(null);
                  }}
                  className="text-zinc-400 hover:text-zinc-700 text-xs font-bold cursor-pointer"
                >
                  Đóng
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-zinc-700 block mb-1">Kỹ năng</label>
                  <select
                    value={sessionDraft.skill}
                    onChange={(e) => setSessionDraft({ ...sessionDraft, skill: e.target.value })}
                    className="w-full rounded-lg border border-zinc-200 bg-white p-2 text-xs font-medium outline-none focus:border-primary cursor-pointer"
                  >
                    {SKILL_OPTIONS.map((sk) => (
                      <option key={sk} value={sk}>
                        {sk}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-zinc-700 block mb-1">Nội dung bài học chuẩn</label>
                  <textarea
                    rows={3}
                    value={sessionDraft.contents}
                    onChange={(e) => setSessionDraft({ ...sessionDraft, contents: e.target.value })}
                    placeholder="Mô tả nội dung bài học theo khung chương trình..."
                    className="w-full rounded-lg border border-zinc-200 bg-white p-2 text-xs font-medium outline-none focus:border-primary resize-y"
                  />
                </div>

                <div>
                  <label className="font-semibold text-zinc-700 block mb-1">Ghi chú hướng dẫn cho GV</label>
                  <input
                    type="text"
                    value={sessionDraft.teacherNote || ""}
                    onChange={(e) => setSessionDraft({ ...sessionDraft, teacherNote: e.target.value })}
                    placeholder="Ghi chú hướng dẫn, dặn dò giáo viên..."
                    className="w-full rounded-lg border border-zinc-200 bg-white p-2 text-xs font-medium outline-none focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="font-semibold text-zinc-700 block mb-1">File bài học (URL)</label>
                    <input
                      type="url"
                      value={sessionDraft.lessonFileUrl || ""}
                      onChange={(e) => setSessionDraft({ ...sessionDraft, lessonFileUrl: e.target.value })}
                      placeholder="https://drive..."
                      className="w-full rounded-lg border border-zinc-200 bg-white p-2 text-[11px] outline-none focus:border-primary font-mono"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-zinc-700 block mb-1">Record (URL)</label>
                    <input
                      type="url"
                      value={sessionDraft.recordingUrl || ""}
                      onChange={(e) => setSessionDraft({ ...sessionDraft, recordingUrl: e.target.value })}
                      placeholder="https://youtube..."
                      className="w-full rounded-lg border border-zinc-200 bg-white p-2 text-[11px] outline-none focus:border-primary font-mono"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-zinc-700 block mb-1">BTVN Docs (URL)</label>
                    <input
                      type="url"
                      value={sessionDraft.homeworkFileUrl || ""}
                      onChange={(e) => setSessionDraft({ ...sessionDraft, homeworkFileUrl: e.target.value })}
                      placeholder="https://docs..."
                      className="w-full rounded-lg border border-zinc-200 bg-white p-2 text-[11px] outline-none focus:border-primary font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingSession(null);
                    setSessionDraft(null);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50 text-xs font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleSaveSession}
                  disabled={savingSession}
                  className="px-4 py-1.5 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-all cursor-pointer disabled:opacity-50"
                >
                  {savingSession ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Modal Tạo Lớp Mẫu Mới ── */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-zinc-200 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <h4 className="text-sm font-bold text-zinc-900">Thêm lớp mẫu RLP mới</h4>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-zinc-400 hover:text-zinc-700 text-xs font-bold cursor-pointer"
                >
                  Đóng
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-zinc-700 block mb-1">Tên lớp mẫu *</label>
                  <input
                    type="text"
                    value={createTitle}
                    onChange={(e) => setCreateTitle(e.target.value)}
                    placeholder="VD: IELTS Core 1 Nâng Cao"
                    className="w-full rounded-lg border border-zinc-200 bg-white p-2 text-xs font-medium outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="font-semibold text-zinc-700 block mb-1">Cấp độ *</label>
                  <select
                    value={createLevel}
                    onChange={(e) => setCreateLevel(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 bg-white p-2 text-xs font-medium outline-none focus:border-primary cursor-pointer"
                  >
                    {LEVEL_OPTIONS.map((lvl) => (
                      <option key={lvl} value={lvl}>
                        {lvl}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-zinc-700 block mb-1">Mã định danh (Key) *</label>
                  <input
                    type="text"
                    value={createKey}
                    onChange={(e) => setCreateKey(e.target.value)}
                    placeholder="VD: ielts-core-1-nc"
                    className="w-full rounded-lg border border-zinc-200 bg-white p-2 text-xs font-mono outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="font-semibold text-zinc-700 block mb-1">Mô tả giáo án</label>
                  <input
                    type="text"
                    value={createDesc}
                    onChange={(e) => setCreateDesc(e.target.value)}
                    placeholder="Mô tả mục tiêu đầu ra và đối tượng..."
                    className="w-full rounded-lg border border-zinc-200 bg-white p-2 text-xs font-medium outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50 text-xs font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleCreateTemplate}
                  disabled={creatingTemplate}
                  className="px-4 py-1.5 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-all cursor-pointer disabled:opacity-50"
                >
                  {creatingTemplate ? "Đang tạo..." : "Tạo lớp mẫu (36 buổi)"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AcaLayout>
  );
}
