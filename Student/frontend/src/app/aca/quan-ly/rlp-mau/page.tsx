"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AcaLayout } from "@/components/aca/AcaLayout";
import { AcaTopbar } from "@/components/aca/AcaTopbar";
import {
  applyRlpTemplate,
  createRlpTemplate,
  deleteRlpTemplate,
  fetchRlpTemplates,
  updateRlpTemplate,
  type RlpTemplate,
  type RlpTemplateSessionItem,
} from "@/lib/rlpTemplateApi";
import { fetchAcaClasses, type AcaClass } from "@/lib/acaManagementApi";
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
  "Full Test",
  "Revision & Feedback",
];

export default function RlpMauPage() {
  const [templates, setTemplates] = useState<RlpTemplate[]>([]);
  const [classes, setClasses] = useState<AcaClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");

  // Template Editor Modal State
  const [editingTemplate, setEditingTemplate] = useState<RlpTemplate | null>(null);
  const [templateFormTitle, setTemplateFormTitle] = useState("");
  const [templateFormKey, setTemplateFormKey] = useState("");
  const [templateFormLevel, setTemplateFormLevel] = useState("Foundation");
  const [templateFormDesc, setTemplateFormDesc] = useState("");
  const [templateSessions, setTemplateSessions] = useState<RlpTemplateSessionItem[]>([]);
  const [sessionSkillFilter, setSessionSkillFilter] = useState("all");
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Single Session Edit inside Template
  const [editingSessionNo, setEditingSessionNo] = useState<number | null>(null);
  const [sessionDraft, setSessionDraft] = useState<RlpTemplateSessionItem | null>(null);

  // Apply Template to Class Modal State
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [applyingTemplateKey, setApplyingTemplateKey] = useState<string>("");
  const [applyTargetClassId, setApplyTargetClassId] = useState("");
  const [applyStartDate, setApplyStartDate] = useState("");
  const [applyScheduleMode, setApplyScheduleMode] = useState<"auto" | "keep_dates">("auto");
  const [applying, setApplying] = useState(false);

  const showToast = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [tplList, classList] = await Promise.all([
        fetchRlpTemplates(),
        fetchAcaClasses().catch(() => [] as AcaClass[]),
      ]);
      setTemplates(tplList);
      setClasses(classList);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được danh sách RLP Mẫu.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      const matchLevel = levelFilter === "all" || t.level === levelFilter;
      if (!searchQuery.trim()) return matchLevel;
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        t.title.toLowerCase().includes(q) ||
        t.key.toLowerCase().includes(q) ||
        (t.description || "").toLowerCase().includes(q) ||
        t.level.toLowerCase().includes(q);
      return matchLevel && matchSearch;
    });
  }, [templates, searchQuery, levelFilter]);

  // Open Template for Editing
  const handleOpenEditTemplate = (tpl: RlpTemplate) => {
    setIsCreatingNew(false);
    setEditingTemplate(tpl);
    setTemplateFormTitle(tpl.title);
    setTemplateFormKey(tpl.key);
    setTemplateFormLevel(tpl.level || "Foundation");
    setTemplateFormDesc(tpl.description || "");
    setTemplateSessions(
      (tpl.sessions || []).map((s, idx) => ({
        no: s.no || idx + 1,
        skill: s.skill || "Speaking",
        contents: s.contents || "",
        teacherNote: s.teacherNote || "",
        lessonFileUrl: s.lessonFileUrl || "",
        homeworkFileUrl: s.homeworkFileUrl || "",
        recordingUrl: s.recordingUrl || "",
      }))
    );
    setSessionSkillFilter("all");
    setEditingSessionNo(null);
    setSessionDraft(null);
  };

  // Open New Template Creation
  const handleOpenCreateNewTemplate = () => {
    setIsCreatingNew(true);
    setEditingTemplate({
      key: `mau-${Date.now().toString(36)}`,
      title: "RLP Mẫu Mới - Học vụ Khánh Thi",
      level: "Foundation",
      description: "Khuôn mẫu giáo án chuẩn cho lớp học.",
      totalSessions: 18,
      isDefault: false,
      sessions: Array.from({ length: 18 }, (_, idx) => ({
        no: idx + 1,
        skill: idx % 4 === 0 ? "Speaking" : idx % 4 === 1 ? "Listening" : idx % 4 === 2 ? "Reading" : "Writing",
        contents: `Nội dung giáo án buổi ${idx + 1}...`,
        teacherNote: "Ghi chú hướng dẫn giảng dạy của Học vụ",
        lessonFileUrl: "",
        homeworkFileUrl: "",
      })),
    });
    setTemplateFormTitle("RLP Mẫu Mới - Học vụ Khánh Thi");
    setTemplateFormKey(`mau-${Date.now().toString(36)}`);
    setTemplateFormLevel("Foundation");
    setTemplateFormDesc("Khuôn mẫu giáo án chuẩn cho lớp học.");
    setTemplateSessions(
      Array.from({ length: 18 }, (_, idx) => ({
        no: idx + 1,
        skill: idx % 4 === 0 ? "Speaking" : idx % 4 === 1 ? "Listening" : idx % 4 === 2 ? "Reading" : "Writing",
        contents: `Nội dung giáo án buổi ${idx + 1}...`,
        teacherNote: "Ghi chú hướng dẫn giảng dạy của Học vụ",
        lessonFileUrl: "",
        homeworkFileUrl: "",
      }))
    );
    setSessionSkillFilter("all");
    setEditingSessionNo(null);
    setSessionDraft(null);
  };

  // Save Template (Create or Update)
  const handleSaveTemplate = async () => {
    if (!templateFormTitle.trim()) {
      setError("Vui lòng nhập tên khuôn mẫu RLP.");
      return;
    }
    if (!templateFormKey.trim()) {
      setError("Vui lòng nhập mã định danh cho khuôn mẫu.");
      return;
    }

    setSavingTemplate(true);
    setError(null);
    try {
      const cleanSessions = templateSessions.map((s, idx) => ({
        no: idx + 1,
        skill: s.skill || "Speaking",
        contents: s.contents || "",
        teacherNote: s.teacherNote || "—",
        lessonFileUrl: s.lessonFileUrl || "",
        homeworkFileUrl: s.homeworkFileUrl || "",
        recordingUrl: s.recordingUrl || "",
      }));

      if (isCreatingNew) {
        await createRlpTemplate({
          key: templateFormKey.trim(),
          title: templateFormTitle.trim(),
          level: templateFormLevel,
          description: templateFormDesc.trim(),
          totalSessions: cleanSessions.length,
          sessions: cleanSessions,
          isDefault: false,
        });
        showToast(`Đã tạo thành công khuôn mẫu "${templateFormTitle}".`);
      } else if (editingTemplate) {
        await updateRlpTemplate(editingTemplate.key, {
          title: templateFormTitle.trim(),
          level: templateFormLevel,
          description: templateFormDesc.trim(),
          totalSessions: cleanSessions.length,
          sessions: cleanSessions,
        });
        showToast(`Đã lưu thay đổi khuôn mẫu "${templateFormTitle}".`);
      }

      setEditingTemplate(null);
      void loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lưu khuôn mẫu RLP thất bại.");
    } finally {
      setSavingTemplate(false);
    }
  };

  // Delete Template
  const handleDeleteTemplate = async (tpl: RlpTemplate, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const ok = await confirmDialog({
      title: "Xóa khuôn mẫu RLP",
      message: `Bạn có chắc chắn muốn xóa khuôn mẫu "${tpl.title}" không? Giáo viên sẽ không thể lấy mẫu này nữa.`,
      confirmText: "Đồng ý xóa",
      cancelText: "Giữ lại",
      variant: "danger",
    });
    if (!ok) return;

    try {
      await deleteRlpTemplate(tpl.key);
      showToast(`Đã xóa khuôn mẫu "${tpl.title}".`);
      void loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không xóa được khuôn mẫu.");
    }
  };

  // Add Session to Template
  const handleAddSessionToTemplate = () => {
    const nextNo = templateSessions.length + 1;
    const newSession: RlpTemplateSessionItem = {
      no: nextNo,
      skill: "Speaking",
      contents: `Nội dung giáo án buổi ${nextNo}...`,
      teacherNote: "Ghi chú hướng dẫn giảng dạy của Học vụ",
      lessonFileUrl: "",
      homeworkFileUrl: "",
    };
    setTemplateSessions((prev) => [...prev, newSession]);
    setEditingSessionNo(nextNo);
    setSessionDraft(newSession);
  };

  // Remove Session from Template
  const handleRemoveSessionFromTemplate = (no: number) => {
    const next = templateSessions.filter((s) => s.no !== no).map((s, idx) => ({ ...s, no: idx + 1 }));
    setTemplateSessions(next);
    if (editingSessionNo === no) {
      setEditingSessionNo(null);
      setSessionDraft(null);
    }
  };

  // Open Single Session Editor
  const handleOpenEditSession = (session: RlpTemplateSessionItem) => {
    setEditingSessionNo(session.no);
    setSessionDraft({ ...session });
  };

  // Save Single Session Edit
  const handleSaveSessionDraft = () => {
    if (!sessionDraft || editingSessionNo == null) return;
    setTemplateSessions((prev) =>
      prev.map((s) => (s.no === editingSessionNo ? { ...sessionDraft, no: editingSessionNo } : s))
    );
    setEditingSessionNo(null);
    setSessionDraft(null);
  };

  // Open Apply Modal for a Template
  const handleOpenApplyModal = (tpl: RlpTemplate, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setApplyingTemplateKey(tpl.key);
    setIsApplyModalOpen(true);
    if (classes.length > 0) {
      setApplyTargetClassId(classes[0].id);
      setApplyStartDate(classes[0].openDate || classes[0].phaseStartDate || "");
    }
  };

  // Handle Apply Template to Class
  const handleApplyTemplateToClass = async () => {
    if (!applyingTemplateKey || !applyTargetClassId) return;
    setApplying(true);
    setError(null);
    try {
      const res = await applyRlpTemplate(applyingTemplateKey, {
        classId: applyTargetClassId,
        startDate: applyStartDate,
        scheduleMode: applyScheduleMode,
      });
      setIsApplyModalOpen(false);
      showToast(`Đã áp dụng thành công ${res.templateTitle} (${res.totalSessions} buổi) cho lớp học!`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Áp dụng khuôn mẫu RLP thất bại.");
    } finally {
      setApplying(false);
    }
  };

  const filteredSessions = useMemo(() => {
    return [...templateSessions]
      .filter((s) => {
        if (sessionSkillFilter === "all") return true;
        return s.skill.toLowerCase().includes(sessionSkillFilter.toLowerCase());
      })
      .sort((a, b) => a.no - b.no);
  }, [templateSessions, sessionSkillFilter]);

  return (
    <AcaLayout>
      <div className="space-y-6 pb-20 max-w-7xl mx-auto">
        <AcaTopbar
          title="Khuôn Mẫu RLP Chuẩn (Học vụ Khánh Thi)"
          subtitle="Biên soạn và quản lý các bộ khung giáo án RLP chuẩn để giáo viên các lớp tự động lấy mẫu khi giảng dạy."
        />

        {/* Alerts & Toasts */}
        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 flex items-center justify-between shadow-xs">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
            >
              Đóng
            </button>
          </div>
        )}

        {successMsg && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 flex items-center justify-between shadow-xs">
            <span className="font-bold flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {successMsg}
            </span>
            <button
              type="button"
              onClick={() => setSuccessMsg(null)}
              className="text-xs font-bold text-emerald-600 hover:underline cursor-pointer"
            >
              Đóng
            </button>
          </div>
        )}

        {/* Header Action Bar */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 rounded-3xl border border-zinc-200/80 bg-white p-5 shadow-soft">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Search */}
            <div className="relative flex-1 md:w-72">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm khuôn mẫu RLP..."
                className="w-full rounded-2xl border border-zinc-200 bg-zinc-50/50 px-4 py-2.5 text-xs font-medium text-zinc-900 outline-none focus:border-primary focus:bg-white"
              />
            </div>

            {/* Level Filter */}
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="rounded-2xl border border-zinc-200 bg-zinc-50/50 px-3 py-2.5 text-xs font-bold text-zinc-700 outline-none focus:border-primary focus:bg-white cursor-pointer"
            >
              <option value="all">Tất cả cấp độ</option>
              {LEVEL_OPTIONS.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleOpenCreateNewTemplate}
            className="inline-flex items-center gap-2 rounded-2xl bg-primary hover:bg-primary/90 text-white px-5 py-3 text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-[0.98] cursor-pointer whitespace-nowrap"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Tạo Khuôn Mẫu RLP Mới
          </button>
        </div>

        {/* Template Cards Grid */}
        {loading ? (
          <div className="text-center py-20 text-zinc-400 font-bold text-sm bg-white rounded-3xl border border-zinc-200 shadow-soft">
            Đang tải danh sách khuôn mẫu RLP...
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-zinc-200 shadow-soft space-y-3">
            <div className="text-base font-bold text-zinc-700">Chưa có khuôn mẫu RLP nào phù hợp.</div>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              Bấm nút &quot;Tạo Khuôn Mẫu RLP Mới&quot; để biên soạn giáo án chuẩn cho giáo viên các lớp lấy mẫu.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((tpl) => {
              const sessionCount = tpl.sessions?.length || tpl.totalSessions || 18;
              const hasContentCount = (tpl.sessions || []).filter((s) => s.contents && s.contents.trim().length > 5).length;
              const isDefault = !!tpl.isDefault;

              return (
                <div
                  key={tpl.key}
                  className="rounded-3xl border border-zinc-200/90 bg-white p-6 shadow-soft hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-4">
                    {/* Level Badge & Badges */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                        {tpl.level || "Chung"}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {isDefault && (
                          <span className="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase bg-amber-50 text-amber-700 border border-amber-200">
                            Chuẩn Hệ Thống
                          </span>
                        )}
                        <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold bg-zinc-100 text-zinc-600">
                          {sessionCount} buổi
                        </span>
                      </div>
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h3 className="text-base font-black text-zinc-900 leading-snug group-hover:text-primary transition-colors">
                        {tpl.title}
                      </h3>
                      <p className="text-xs font-medium text-zinc-500 mt-1.5 line-clamp-3 leading-relaxed">
                        {tpl.description || "Khuôn mẫu giáo án do Học vụ Khánh Thi chuẩn hóa."}
                      </p>
                    </div>

                    {/* Meta info */}
                    <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-400">
                      <span className="font-semibold text-zinc-600">
                        Biên soạn: <span className="text-zinc-900 font-bold">{tpl.createdBy || "Học vụ Khánh Thi"}</span>
                      </span>
                      <span className="font-bold text-emerald-600">
                        {hasContentCount}/{sessionCount} buổi đã soạn
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-5 mt-4 border-t border-zinc-100 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEditTemplate(tpl)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-2xl bg-primary text-white hover:bg-primary/90 px-4 py-2.5 text-xs font-black uppercase tracking-wider transition-all shadow-xs cursor-pointer active:scale-[0.98]"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Sửa Giáo Án Mẫu
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleOpenApplyModal(tpl, e)}
                      title="Áp dụng vào lớp..."
                      className="rounded-2xl border border-zinc-200 hover:bg-zinc-100 p-2.5 text-zinc-600 transition-all cursor-pointer shadow-2xs"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                      </svg>
                    </button>

                    {!isDefault && (
                      <button
                        type="button"
                        onClick={(e) => handleDeleteTemplate(tpl, e)}
                        title="Xóa khuôn mẫu"
                        className="rounded-2xl border border-rose-200 bg-rose-50/50 hover:bg-rose-100 p-2.5 text-rose-600 transition-all cursor-pointer shadow-2xs"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Modal Soạn / Chỉnh Sửa Khuôn Mẫu RLP (Học vụ Khánh Thi) ── */}
        {editingTemplate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-3xl bg-white shadow-2xl overflow-hidden border border-zinc-200">
              {/* Header */}
              <div className="p-6 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/60">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                    Học Vụ Khánh Thi · Biên Soạn Khuôn Mẫu RLP
                  </span>
                  <h3 className="text-lg font-black text-zinc-900 mt-0.5">
                    {isCreatingNew ? "Tạo Khuôn Mẫu RLP Mới" : `Chỉnh Sửa: ${templateFormTitle}`}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingTemplate(null)}
                  className="rounded-full p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Meta Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-zinc-50/60 p-4 rounded-2xl border border-zinc-200/60">
                  <div>
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider block mb-1">
                      Tên khuôn mẫu RLP *
                    </label>
                    <input
                      type="text"
                      value={templateFormTitle}
                      onChange={(e) => setTemplateFormTitle(e.target.value)}
                      placeholder="VD: RLP Mẫu: Pre-IELTS Cốt lõi"
                      className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-bold text-zinc-900 outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider block mb-1">
                      Cấp độ chương trình *
                    </label>
                    <select
                      value={templateFormLevel}
                      onChange={(e) => setTemplateFormLevel(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-bold text-zinc-900 outline-none focus:border-primary cursor-pointer"
                    >
                      {LEVEL_OPTIONS.map((lvl) => (
                        <option key={lvl} value={lvl}>
                          {lvl}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider block mb-1">
                      Mã định danh (Key) *
                    </label>
                    <input
                      type="text"
                      value={templateFormKey}
                      disabled={!isCreatingNew}
                      onChange={(e) => setTemplateFormKey(e.target.value)}
                      placeholder="VD: pre-ielts-m357"
                      className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-mono font-bold text-zinc-900 outline-none focus:border-primary disabled:bg-zinc-100 disabled:text-zinc-500"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider block mb-1">
                      Mô tả hướng dẫn giáo án
                    </label>
                    <input
                      type="text"
                      value={templateFormDesc}
                      onChange={(e) => setTemplateFormDesc(e.target.value)}
                      placeholder="Mô tả mục tiêu, trọng tâm kiến thức và lưu ý cho giáo viên khi sử dụng khuôn mẫu này..."
                      className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-800 outline-none focus:border-primary"
                    />
                  </div>
                </div>

                {/* Session List Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-3">
                    <h4 className="text-xs font-black uppercase tracking-wider text-zinc-800">
                      Danh Sách Buổi Học Giáo Án ({templateSessions.length} buổi)
                    </h4>
                    <select
                      value={sessionSkillFilter}
                      onChange={(e) => setSessionSkillFilter(e.target.value)}
                      className="rounded-xl border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-bold text-zinc-700 outline-none focus:border-primary"
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
                    onClick={handleAddSessionToTemplate}
                    className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 text-xs font-black uppercase tracking-wider transition-all shadow-xs cursor-pointer active:scale-[0.98]"
                  >
                    + Thêm Buổi Mới
                  </button>
                </div>

                {/* Session Table */}
                <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-soft">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-200 bg-zinc-50 text-[10px] font-black uppercase tracking-wider text-zinc-500">
                        <th className="px-3 py-2.5 w-14 text-center">Buổi</th>
                        <th className="px-3 py-2.5 w-28">Kỹ năng</th>
                        <th className="px-4 py-2.5">Nội dung bài học chuẩn</th>
                        <th className="px-3 py-2.5 w-28 text-center">Tài liệu & BTVN</th>
                        <th className="px-3 py-2.5 w-24 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 font-medium">
                      {filteredSessions.map((s) => {
                        const hasLesson = Boolean(s.lessonFileUrl?.trim());
                        const hasHw = Boolean(s.homeworkFileUrl?.trim());

                        return (
                          <tr key={s.no} className="hover:bg-zinc-50/60 transition-colors">
                            <td className="px-3 py-3 text-center font-black text-primary text-sm tabular-nums">
                              #{s.no}
                            </td>
                            <td className="px-3 py-3">
                              <span className="inline-flex rounded-lg px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                                {s.skill}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-bold text-zinc-900 line-clamp-2">{s.contents || "—"}</div>
                              {s.teacherNote && s.teacherNote !== "—" && (
                                <div className="text-[10px] text-zinc-500 mt-1 italic font-medium">
                                  💡 Ghi chú: {s.teacherNote}
                                </div>
                              )}
                            </td>
                            <td className="px-3 py-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <span
                                  title={hasLesson ? s.lessonFileUrl : "Chưa có slide bài giảng"}
                                  className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                                    hasLesson ? "bg-sky-100 text-sky-800" : "bg-zinc-100 text-zinc-400"
                                  }`}
                                >
                                  Slide
                                </span>
                                <span
                                  title={hasHw ? s.homeworkFileUrl : "Chưa có link BTVN"}
                                  className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                                    hasHw ? "bg-emerald-100 text-emerald-800" : "bg-zinc-100 text-zinc-400"
                                  }`}
                                >
                                  BTVN
                                </span>
                              </div>
                            </td>
                            <td className="px-3 py-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditSession(s)}
                                  className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
                                >
                                  Sửa
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSessionFromTemplate(s.no)}
                                  className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer ml-1"
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

              {/* Footer Actions */}
              <div className="p-5 border-t border-zinc-200 bg-zinc-50/80 flex items-center justify-between">
                <div className="text-xs font-semibold text-zinc-500">
                  Tổng cộng: <span className="font-bold text-zinc-900">{templateSessions.length} buổi</span> trong khuôn mẫu
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingTemplate(null)}
                    className="rounded-2xl border border-zinc-200 bg-white hover:bg-zinc-100 px-4 py-2 text-xs font-bold text-zinc-700 transition-all cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveTemplate}
                    disabled={savingTemplate}
                    className="rounded-2xl bg-primary text-white hover:bg-primary/90 px-6 py-2 text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-[0.98] cursor-pointer disabled:opacity-50"
                  >
                    {savingTemplate ? "Đang lưu..." : "Lưu Khuôn Mẫu RLP"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Modal Con Sửa 1 Buổi Của Khuôn Mẫu ── */}
        {editingSessionNo != null && sessionDraft && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-2xs animate-in fade-in duration-150">
            <div className="w-full max-w-xl rounded-3xl bg-white shadow-2xl p-6 border border-zinc-200 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <h4 className="text-sm font-black text-zinc-900">
                  Chỉnh Sửa Giáo Án Buổi #{editingSessionNo}
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    setEditingSessionNo(null);
                    setSessionDraft(null);
                  }}
                  className="text-zinc-400 hover:text-zinc-600 text-xs font-bold cursor-pointer"
                >
                  Đóng
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-zinc-700 block mb-1">Kỹ năng *</label>
                  <select
                    value={sessionDraft.skill}
                    onChange={(e) => setSessionDraft({ ...sessionDraft, skill: e.target.value })}
                    className="w-full rounded-xl border border-zinc-200 bg-white p-2.5 font-bold outline-none focus:border-primary"
                  >
                    {SKILL_OPTIONS.map((sk) => (
                      <option key={sk} value={sk}>
                        {sk}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-zinc-700 block mb-1">Nội dung bài học chuẩn *</label>
                  <textarea
                    rows={3}
                    value={sessionDraft.contents}
                    onChange={(e) => setSessionDraft({ ...sessionDraft, contents: e.target.value })}
                    placeholder="Mô tả chi tiết nội dung kiến thức, chủ đề, dạng bài giảng dạy trong buổi này..."
                    className="w-full rounded-xl border border-zinc-200 bg-white p-2.5 font-medium outline-none focus:border-primary resize-y"
                  />
                </div>

                <div>
                  <label className="font-bold text-zinc-700 block mb-1">Ghi chú hướng dẫn cho Giáo viên</label>
                  <input
                    type="text"
                    value={sessionDraft.teacherNote || ""}
                    onChange={(e) => setSessionDraft({ ...sessionDraft, teacherNote: e.target.value })}
                    placeholder="Lưu ý giảng dạy, chỉnh sửa phát âm, nhấn mạnh bẫy, v.v."
                    className="w-full rounded-xl border border-zinc-200 bg-white p-2.5 font-medium outline-none focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-zinc-700 block mb-1">Link Slide / Bài giảng (URL)</label>
                    <input
                      type="url"
                      value={sessionDraft.lessonFileUrl || ""}
                      onChange={(e) => setSessionDraft({ ...sessionDraft, lessonFileUrl: e.target.value })}
                      placeholder="https://drive.google.com/..."
                      className="w-full rounded-xl border border-zinc-200 bg-white p-2.5 font-mono text-[11px] outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-zinc-700 block mb-1">Link Bài tập về nhà (Google Docs)</label>
                    <input
                      type="url"
                      value={sessionDraft.homeworkFileUrl || ""}
                      onChange={(e) => setSessionDraft({ ...sessionDraft, homeworkFileUrl: e.target.value })}
                      placeholder="https://docs.google.com/..."
                      className="w-full rounded-xl border border-zinc-200 bg-white p-2.5 font-mono text-[11px] outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingSessionNo(null);
                    setSessionDraft(null);
                  }}
                  className="rounded-xl border border-zinc-200 px-3 py-1.5 font-bold text-zinc-600 hover:bg-zinc-100 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleSaveSessionDraft}
                  className="rounded-xl bg-primary text-white px-4 py-1.5 font-bold hover:bg-primary/90 cursor-pointer shadow-xs"
                >
                  Cập nhật buổi
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Modal Áp Dụng Khuôn Mẫu RLP Sang Lớp Học ── */}
        {isApplyModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl p-6 border border-zinc-200 space-y-5">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <h3 className="text-base font-black text-zinc-900">
                  Áp Dụng Khuôn Mẫu RLP Sang Lớp Học
                </h3>
                <button
                  type="button"
                  onClick={() => setIsApplyModalOpen(false)}
                  className="text-zinc-400 hover:text-zinc-600 font-bold text-xs cursor-pointer"
                >
                  Đóng
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-zinc-700 block mb-1">Khuôn mẫu nguồn:</label>
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-primary font-bold">
                    {templates.find((t) => t.key === applyingTemplateKey)?.title || applyingTemplateKey}
                  </div>
                </div>

                <div>
                  <label className="font-bold text-zinc-700 block mb-1">Chọn lớp học áp dụng *</label>
                  <select
                    value={applyTargetClassId}
                    onChange={(e) => {
                      setApplyTargetClassId(e.target.value);
                      const found = classes.find((c) => c.id === e.target.value);
                      if (found) {
                        setApplyStartDate(found.openDate || found.phaseStartDate || "");
                      }
                    }}
                    className="w-full rounded-xl border border-zinc-200 bg-white p-2.5 font-bold outline-none focus:border-primary cursor-pointer"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.classCode ? `[${c.classCode}] ` : ""}{c.name} — GV: {c.teacher || "Chưa có"}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-zinc-700 block mb-1">Ngày bắt đầu buổi 1 (DD/MM/YYYY hoặc YYYY-MM-DD)</label>
                  <input
                    type="text"
                    value={applyStartDate}
                    onChange={(e) => setApplyStartDate(e.target.value)}
                    placeholder="VD: 15/09/2026"
                    className="w-full rounded-xl border border-zinc-200 bg-white p-2.5 font-bold outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="font-bold text-zinc-700 block mb-1">Chế độ tạo lịch:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setApplyScheduleMode("auto")}
                      className={`p-2.5 rounded-xl border text-center font-bold cursor-pointer transition-all ${
                        applyScheduleMode === "auto"
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                      }`}
                    >
                      Tự động theo thứ học
                    </button>
                    <button
                      type="button"
                      onClick={() => setApplyScheduleMode("keep_dates")}
                      className={`p-2.5 rounded-xl border text-center font-bold cursor-pointer transition-all ${
                        applyScheduleMode === "keep_dates"
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                      }`}
                    >
                      Giữ ngày hiện tại của lớp
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsApplyModalOpen(false)}
                  className="rounded-2xl border border-zinc-200 px-4 py-2 font-bold text-zinc-600 hover:bg-zinc-100 cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleApplyTemplateToClass}
                  disabled={applying || !applyTargetClassId}
                  className="rounded-2xl bg-primary text-white hover:bg-primary/90 px-5 py-2 font-black uppercase tracking-wider cursor-pointer shadow-md active:scale-[0.98] disabled:opacity-50"
                >
                  {applying ? "Đang áp dụng..." : "Xác Nhận Áp Dụng"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AcaLayout>
  );
}
