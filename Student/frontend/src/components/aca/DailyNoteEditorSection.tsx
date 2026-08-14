"use client";

import { useCallback, useEffect, useState } from "react";
import { DailyNoteDisplay } from "@/components/student/DailyNoteDisplay";
import {
  addQuote,
  DEFAULT_QUOTES_LIST,
  DEFAULT_STUDENT_DAILY_NOTE,
  deleteQuote,
  getQuoteMode,
  getQuotesList,
  getRandomQuote,
  getStudentDailyNote,
  saveQuoteMode,
  saveStudentDailyNote,
  STUDENT_DAILY_NOTE_UPDATE_EVENT,
  toggleQuoteActive,
  updateQuote,
  type QuoteItem,
  type QuoteMode,
  type StudentDailyNote,
} from "@/lib/studentDailyNote";

export function DailyNoteEditorSection() {
  const [mode, setMode] = useState<QuoteMode>("random");
  const [quotes, setQuotes] = useState<QuoteItem[]>([]);
  const [pinnedForm, setPinnedForm] = useState<StudentDailyNote>(DEFAULT_STUDENT_DAILY_NOTE);
  const [previewNote, setPreviewNote] = useState<StudentDailyNote>(DEFAULT_STUDENT_DAILY_NOTE);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  // New quote form state
  const [newWord, setNewWord] = useState("");
  const [newMeaning, setNewMeaning] = useState("");
  const [newAuthor, setNewAuthor] = useState("");

  // Edit quote modal/form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editWord, setEditWord] = useState("");
  const [editMeaning, setEditMeaning] = useState("");
  const [editAuthor, setEditAuthor] = useState("");

  const sync = useCallback(() => {
    setMode(getQuoteMode());
    setQuotes(getQuotesList());
    setPinnedForm(getStudentDailyNote());
    setPreviewNote(getRandomQuote());
  }, []);

  useEffect(() => {
    sync();
    const onUpdate = () => sync();
    window.addEventListener(STUDENT_DAILY_NOTE_UPDATE_EVENT, onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener(STUDENT_DAILY_NOTE_UPDATE_EVENT, onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, [sync]);

  const showNotification = (msg: string) => {
    setSavedMessage(msg);
    window.setTimeout(() => setSavedMessage(null), 3000);
  };

  const handleModeChange = (nextMode: QuoteMode) => {
    saveQuoteMode(nextMode);
    setMode(nextMode);
    showNotification(
      nextMode === "random"
        ? "Đã chuyển sang chế độ: Chạy Random từ kho Quote"
        : "Đã chuyển sang chế độ: Ghim 1 note cố định"
    );
  };

  const handleAddQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWord.trim() || !newMeaning.trim()) return;
    const updated = addQuote({
      word: newWord,
      meaning: newMeaning,
      author: newAuthor,
    });
    setQuotes(updated);
    setNewWord("");
    setNewMeaning("");
    setNewAuthor("");
    setPreviewNote(getRandomQuote());
    showNotification("Thêm câu quote mới thành công!");
  };

  const handleStartEdit = (q: QuoteItem) => {
    setEditingId(q.id);
    setEditWord(q.word);
    setEditMeaning(q.meaning);
    setEditAuthor(q.author || "");
  };

  const handleSaveEdit = (id: string) => {
    if (!editWord.trim() || !editMeaning.trim()) return;
    const updated = updateQuote(id, {
      word: editWord.trim(),
      meaning: editMeaning.trim(),
      author: editAuthor.trim() || undefined,
    });
    setQuotes(updated);
    setEditingId(null);
    showNotification("Đã cập nhật câu quote!");
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa câu quote này?")) return;
    const updated = deleteQuote(id);
    setQuotes(updated);
    showNotification("Đã xóa câu quote!");
  };

  const handleToggleActive = (id: string) => {
    const updated = toggleQuoteActive(id);
    setQuotes(updated);
  };

  const handleSavePinnedNote = () => {
    saveStudentDailyNote({ word: pinnedForm.word, meaning: pinnedForm.meaning });
    showNotification("Đã lưu note ghim cố định thành công!");
  };

  const activeCount = quotes.filter((q) => q.active).length;

  return (
    <div className="space-y-8">
      {/* Top Banner / Description */}
      <div className="rounded-3xl border border-primary/15 bg-gradient-to-br from-primary/5 via-white to-secondary/5 p-6 shadow-soft">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-black uppercase text-primary tracking-wider">
              <span>Bộ phận Học vụ ACA</span>
            </div>
            <h3 className="mt-2 text-xl font-extrabold text-foreground tracking-tight">
              Quản lý Quotes & Note hiển thị Học viên
            </h3>
            <p className="mt-1 text-xs text-muted font-medium max-w-xl">
              Học vụ chỉ cần nạp kho Quote 1 lần. Hệ thống sẽ <b>tự động xoay ngẫu nhiên 1 câu Quote mỗi ngày</b> cho toàn bộ học viên mà Học vụ không cần phải vào cập nhật thủ công hàng ngày.
            </p>
          </div>

          {/* Saved notification badge */}
          {savedMessage && (
            <div className="animate-bounce rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-2 text-xs font-bold text-emerald-700 shadow-sm">
              {savedMessage}
            </div>
          )}
        </div>
      </div>

      {/* Mode Selection Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => handleModeChange("random")}
          className={`text-left p-5 rounded-2xl border transition-all cursor-pointer ${
            mode === "random"
              ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm"
              : "border-zinc-200 bg-white hover:border-primary/40 hover:bg-zinc-50"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-black text-foreground">
              Tự động xoay Random theo ngày
            </div>
            {mode === "random" && (
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            )}
          </div>
          <p className="mt-2 text-xs text-muted font-medium leading-relaxed">
            Hệ thống <b>tự động đổi ngẫu nhiên 1 câu Quote mới mỗi ngày</b> từ kho <b>{activeCount} câu Quote</b> đang bật. Học vụ không cần phải vào thao tác hàng ngày.
          </p>
        </button>

        <button
          type="button"
          onClick={() => handleModeChange("pinned")}
          className={`text-left p-5 rounded-2xl border transition-all cursor-pointer ${
            mode === "pinned"
              ? "border-secondary bg-secondary/5 ring-2 ring-secondary/20 shadow-sm"
              : "border-zinc-200 bg-white hover:border-secondary/40 hover:bg-zinc-50"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-black text-foreground">
              Ghim 1 Note cố định
            </div>
            {mode === "pinned" && (
              <span className="h-2 w-2 rounded-full bg-secondary animate-pulse" />
            )}
          </div>
          <p className="mt-2 text-xs text-muted font-medium leading-relaxed">
            Luôn luôn hiển thị duy nhất câu note được ghim cố định ở bên dưới cho tất cả học viên.
          </p>
        </button>
      </div>

      {/* Live Preview Box */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black text-muted uppercase tracking-widest flex items-center gap-2">
            <span>Live Preview</span>
            <span className="text-[10px] font-bold text-primary">
              ({mode === "random" ? `Đang chạy Random — ${activeCount} Quote` : "Đang ghim cố định"})
            </span>
          </h4>

          {mode === "random" && (
            <button
              type="button"
              onClick={() => setPreviewNote(getRandomQuote())}
              className="inline-flex items-center gap-1.5 rounded-xl border border-primary/20 bg-primary/5 px-3 py-1.5 text-[11px] font-black uppercase text-primary hover:bg-primary/10 transition-all cursor-pointer"
            >
              <span>Quay Random thử</span>
            </button>
          )}
        </div>

        <div className="overflow-hidden rounded-2xl border border-primary/10 shadow-soft">
          <DailyNoteDisplay note={mode === "random" ? previewNote : pinnedForm} />
        </div>
      </div>

      {/* Main Content Sections based on mode */}
      {mode === "random" ? (
        <div className="space-y-6">
          {/* Add New Quote Form */}
          <form
            onSubmit={handleAddQuote}
            className="rounded-2xl border border-primary/15 bg-white p-6 shadow-soft space-y-4"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-extrabold text-foreground flex items-center gap-2">
                Thêm câu Quote ngẫu nhiên mới
              </h4>
              <span className="text-[10px] font-black text-muted uppercase tracking-wider">
                Kho quote ({quotes.length} câu)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase text-muted tracking-wider mb-1">
                  Word / Tiêu đề ngắn <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newWord}
                  onChange={(e) => setNewWord(e.target.value)}
                  placeholder="VD: Never Give Up, Stay Focused..."
                  className="w-full rounded-xl border border-primary/15 bg-background px-3.5 py-2.5 text-xs font-bold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-muted tracking-wider mb-1">
                  Tác giả / Ghi chú nguồn (không bắt buộc)
                </label>
                <input
                  type="text"
                  value={newAuthor}
                  onChange={(e) => setNewAuthor(e.target.value)}
                  placeholder="VD: Steve Jobs, Albert Einstein, Xalo English..."
                  className="w-full rounded-xl border border-primary/15 bg-background px-3.5 py-2.5 text-xs font-bold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-muted tracking-wider mb-1">
                Nội dung câu quote / Giải nghĩa truyền cảm hứng <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={2}
                value={newMeaning}
                onChange={(e) => setNewMeaning(e.target.value)}
                placeholder="VD: Con đường vạn dặm bắt đầu bằng một bước chân nhỏ. Hãy cố gắng 1% mỗi ngày!"
                className="w-full resize-y rounded-xl border border-primary/15 bg-background px-3.5 py-2.5 text-xs font-medium text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
            </div>

            <button
              type="submit"
              className="rounded-xl bg-primary px-6 py-2.5 text-xs font-black uppercase tracking-widest text-white shadow-sm hover:bg-primary/90 transition-all cursor-pointer"
            >
              + Thêm vào kho Quote
            </button>
          </form>

          {/* Quotes List Table */}
          <div className="rounded-2xl border border-primary/15 bg-white shadow-soft overflow-hidden">
            <div className="p-5 border-b border-primary/10 flex items-center justify-between flex-wrap gap-2">
              <h4 className="text-sm font-extrabold text-foreground">
                Danh sách các câu Quote trong hệ thống ({quotes.length})
              </h4>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                Đang bật: {activeCount} / {quotes.length}
              </span>
            </div>

            <div className="divide-y divide-primary/5">
              {quotes.map((q, idx) => (
                <div
                  key={q.id}
                  className={`p-5 transition-colors ${
                    q.active ? "bg-white" : "bg-zinc-50/70 opacity-60"
                  }`}
                >
                  {editingId === q.id ? (
                    /* Edit mode */
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={editWord}
                          onChange={(e) => setEditWord(e.target.value)}
                          className="rounded-xl border border-primary/30 bg-white px-3 py-2 text-xs font-bold text-foreground outline-none"
                          placeholder="Word / Tiêu đề"
                        />
                        <input
                          type="text"
                          value={editAuthor}
                          onChange={(e) => setEditAuthor(e.target.value)}
                          className="rounded-xl border border-primary/30 bg-white px-3 py-2 text-xs font-bold text-foreground outline-none"
                          placeholder="Tác giả"
                        />
                      </div>
                      <textarea
                        rows={2}
                        value={editMeaning}
                        onChange={(e) => setEditMeaning(e.target.value)}
                        className="w-full rounded-xl border border-primary/30 bg-white px-3 py-2 text-xs font-medium text-foreground outline-none"
                        placeholder="Nội dung câu quote"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(q.id)}
                          className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-black text-white hover:bg-emerald-700"
                        >
                          Lưu
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="rounded-lg bg-zinc-200 px-4 py-1.5 text-xs font-bold text-zinc-700 hover:bg-zinc-300"
                        >
                          Hủy
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Display mode */
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="space-y-1 max-w-xl">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-zinc-400 font-mono">
                            #{idx + 1}
                          </span>
                          <span className="text-sm font-black text-primary">{q.word}</span>
                          {q.author && (
                            <span className="text-[10px] font-bold text-muted uppercase bg-zinc-100 px-2 py-0.5 rounded-md">
                              {q.author}
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-medium text-foreground leading-relaxed">
                          "{q.meaning}"
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Toggle active button */}
                        <button
                          type="button"
                          onClick={() => handleToggleActive(q.id)}
                          className={`px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                            q.active
                              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                              : "bg-zinc-200 text-zinc-500 hover:bg-zinc-300"
                          }`}
                        >
                          {q.active ? "✓ Đang bật" : "✕ Đã tắt"}
                        </button>

                        {/* Edit button */}
                        <button
                          type="button"
                          onClick={() => handleStartEdit(q)}
                          className="px-3 py-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer"
                        >
                          Sửa
                        </button>

                        {/* Delete button */}
                        <button
                          type="button"
                          onClick={() => handleDelete(q.id)}
                          className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Pinned Note Editor Form */
        <div className="rounded-2xl border border-secondary/15 bg-white p-6 shadow-soft space-y-4">
          <h4 className="text-sm font-extrabold text-foreground flex items-center gap-2">
            Chỉnh sửa Note ghim cố định
          </h4>

          <div>
            <label className="block text-[11px] font-bold uppercase text-muted tracking-wider mb-1">
              Word of the day / Tiêu đề ghim
            </label>
            <input
              value={pinnedForm.word}
              onChange={(e) => setPinnedForm((f) => ({ ...f, word: e.target.value }))}
              placeholder="Clouds."
              className="w-full rounded-xl border border-primary/15 bg-background px-3.5 py-2.5 text-xs font-bold text-foreground outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/10"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-muted tracking-wider mb-1">
              Giải nghĩa / Ghi chú ghim
            </label>
            <textarea
              value={pinnedForm.meaning}
              onChange={(e) => setPinnedForm((f) => ({ ...f, meaning: e.target.value }))}
              rows={3}
              placeholder="there's divinity in the clouds."
              className="w-full resize-y rounded-xl border border-primary/15 bg-background px-3.5 py-2.5 text-xs font-medium text-foreground outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/10"
            />
          </div>

          <button
            type="button"
            onClick={handleSavePinnedNote}
            className="rounded-xl bg-secondary px-6 py-2.5 text-xs font-black uppercase tracking-widest text-white shadow-sm hover:bg-secondary/90 transition-all cursor-pointer"
          >
            Lưu note ghim cố định
          </button>
        </div>
      )}
    </div>
  );
}
