"use client";

import { useCallback, useEffect, useState } from "react";
import { PracticeClassRlpTable } from "@/components/student/PracticeClassRlpTable";
import { getCachedAuthUser } from "@/lib/auth";
import {
  addPracticeRlpSession,
  canEditPracticeClassRlp,
  canUsePracticeRlpApi,
  deletePracticeRlpSession,
  fetchPracticeRlpForTeacher,
  fetchPracticeRlpStudentsForTeacher,
  updatePracticeRlpSession,
  type CreatePracticeRlpPayload,
  type PracticeRlpSession,
  type PracticeRlpStudentOption,
  type UpdatePracticeRlpPayload,
} from "@/lib/practiceRlpApi";

/**
 * Chỉnh RLP lớp luyện đề — dùng trên portal Teacher (Minh Tâm) / ACA.
 */
export function PracticeRlpEditorSection() {
  const canEdit = canEditPracticeClassRlp(getCachedAuthUser());
  const [students, setStudents] = useState<PracticeRlpStudentOption[]>([]);
  const [studentId, setStudentId] = useState("");
  const [sessions, setSessions] = useState<PracticeRlpSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadStudents = useCallback(async () => {
    if (!canUsePracticeRlpApi() || !canEdit) return;
    try {
      const list = await fetchPracticeRlpStudentsForTeacher();
      setStudents(list);
      setStudentId((prev) => {
        if (prev && list.some((s) => s.id === prev)) return prev;
        return list[0]?.id ?? "";
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được danh sách HV");
    }
  }, [canEdit]);

  const loadSessions = useCallback(async (id: string) => {
    if (!id || !canUsePracticeRlpApi() || !canEdit) {
      setSessions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const rows = await fetchPracticeRlpForTeacher(id);
      setSessions(rows);
    } catch (err) {
      setSessions([]);
      setError(err instanceof Error ? err.message : "Không tải được RLP");
    } finally {
      setLoading(false);
    }
  }, [canEdit]);

  useEffect(() => {
    void loadStudents();
  }, [loadStudents]);

  useEffect(() => {
    void loadSessions(studentId);
  }, [studentId, loadSessions]);

  const handleAdd = async (payload: CreatePracticeRlpPayload) => {
    if (!studentId) return;
    await addPracticeRlpSession(studentId, payload);
    await loadSessions(studentId);
  };

  const handleUpdate = async (no: number, payload: UpdatePracticeRlpPayload) => {
    if (!studentId) return;
    await updatePracticeRlpSession(studentId, no, payload);
    await loadSessions(studentId);
  };

  const handleDelete = async (no: number) => {
    if (!studentId) return;
    await deletePracticeRlpSession(studentId, no);
    await loadSessions(studentId);
  };

  const handleToggleHomework = async (row: PracticeRlpSession) => {
    if (!studentId) return;
    const isWaiting = row.homeworkStatus === "submitted_waiting";
    const next = isWaiting ? "in_progress" : "submitted_waiting";
    await updatePracticeRlpSession(studentId, row.no, { homeworkStatus: next });
    await loadSessions(studentId);
  };

  if (!canEdit) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50/70 px-5 py-6 text-sm font-medium text-amber-900">
        Chỉ <span className="font-black">Học vụ</span> hoặc{" "}
        <span className="font-black">GV Minh Tâm</span> được chỉnh RLP lớp luyện đề.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-primary/20 bg-primary-soft/40 px-4 py-3 flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-black uppercase tracking-widest text-primary">
            RLP lớp luyện đề
          </div>
          <p className="text-[11px] font-medium text-muted mt-0.5">
            Chọn học viên đã đăng ký / có session để cập nhật điểm danh, BTVN và ghi chú.
          </p>
        </div>
        <select
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          className="h-10 min-w-[220px] max-w-full rounded-xl border border-primary/25 bg-white px-3 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/15"
        >
          {students.length === 0 ? (
            <option value="">Chưa có HV đăng ký / RLP</option>
          ) : (
            students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
                {s.email ? ` · ${s.email}` : ""}
              </option>
            ))
          )}
        </select>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-2xl border border-zinc-100 bg-white px-5 py-10 text-center text-sm text-muted">
          Đang tải RLP…
        </div>
      ) : studentId ? (
        <PracticeClassRlpTable
          studentId={studentId}
          sessions={sessions}
          canEdit
          onAdd={handleAdd}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onToggleHomework={handleToggleHomework}
        />
      ) : (
        <div className="rounded-2xl border border-zinc-100 bg-white px-5 py-10 text-center text-sm text-muted">
          Chưa có học viên để chỉnh RLP.
        </div>
      )}
    </div>
  );
}
