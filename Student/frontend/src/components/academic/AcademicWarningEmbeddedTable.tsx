"use client";

import { useMemo, useState } from "react";
import { shortClassLabel } from "@/lib/acaManagementApi";
import {
  listAcademicWarnings,
  sendWarningNotificationToStudent,
  shouldWarnAbsent,
  shouldWarnHomework,
  unfinishedHomeworkCount,
  type AcademicWarningRecord,
} from "@/lib/academicWarningStore";

function warningClassLabel(w: AcademicWarningRecord): string {
  return shortClassLabel(w.className, w.classCode) || w.className || "—";
}

function isActiveWarning(w: AcademicWarningRecord): boolean {
  return (
    (w.warningTypes?.includes("absent_exceeded") ||
      w.warningTypes?.includes("homework_insufficient")) &&
    (w.handledStatus === "pending" || !w.handledStatus)
  );
}

function defaultComposeMessage(w: AcademicWarningRecord): string {
  const parts: string[] = [
    `Chào ${w.studentName}, học vụ XLE ghi nhận tiến độ tại lớp ${warningClassLabel(w)}:`,
  ];
  if (w.warningTypes.includes("absent_exceeded")) {
    parts.push(
      `- Chuyên cần: bạn đã vắng ${w.absentCount} buổi (từ buổi vắng thứ 4 học vụ sẽ theo dõi và hỗ trợ).`,
    );
  }
  if (w.warningTypes.includes("homework_insufficient")) {
    const unfinished = unfinishedHomeworkCount(
      w.homeworkSubmitted,
      w.homeworkTotal,
    );
    parts.push(
      `- Bài tập: còn ${unfinished} deadline đã tới hạn nhưng chưa hoàn thành.`,
    );
  }
  parts.push(
    "Bạn vui lòng cải thiện chuyên cần/BTVN và liên hệ học vụ nếu cần hỗ trợ học bù nhé.",
  );
  return parts.join("\n");
}

export function AcademicWarningEmbeddedTable({
  warnings,
  onChanged,
  showTeacher = true,
  emptyHint,
}: {
  warnings: AcademicWarningRecord[];
  onChanged?: () => void;
  showTeacher?: boolean;
  emptyHint?: string;
}) {
  const rows = useMemo(() => warnings.filter(isActiveWarning), [warnings]);
  const [composeFor, setComposeFor] = useState<AcademicWarningRecord | null>(
    null,
  );
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const openCompose = (w: AcademicWarningRecord) => {
    setComposeFor(w);
    setMessage(w.notificationMessage?.trim() || defaultComposeMessage(w));
  };

  const closeCompose = () => {
    if (sending) return;
    setComposeFor(null);
    setMessage("");
  };

  const handleSend = async () => {
    if (!composeFor) return;
    const text = message.trim();
    if (!text) {
      alert("Vui lòng soạn nội dung thông báo trước khi gửi.");
      return;
    }
    setSending(true);
    try {
      await sendWarningNotificationToStudent(composeFor.id, text);
      setComposeFor(null);
      setMessage("");
      onChanged?.();
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Không gửi được thông báo. Thử lại sau.",
      );
    } finally {
      setSending(false);
    }
  };

  if (rows.length === 0) {
    if (!emptyHint) return null;
    return (
      <div className="rounded-2xl border border-zinc-200 bg-zinc-50/60 px-4 py-3 text-xs text-zinc-500 font-medium">
        {emptyHint}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-rose-200/80 bg-white p-4 shadow-sm space-y-3">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-rose-100 text-rose-700 font-black text-xs">
            🔔
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-black text-foreground uppercase tracking-wider">
                Cảnh báo học tập & Gửi Noti
              </h3>
              <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-black text-rose-700">
                {rows.length}
              </span>
            </div>
            <p className="text-[11px] text-muted font-medium">
              Học viên vắng ≥ 4 buổi hoặc chưa nộp BTVN ≥ 20%. Sau khi gửi noti, dòng sẽ tự ẩn.
            </p>
          </div>
        </div>
      </div>

      {/* Clean Table */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-[10px] font-black uppercase tracking-wider text-muted">
                <th className="px-3.5 py-2.5 text-center w-10">STT</th>
                <th className="px-3.5 py-2.5 min-w-[150px]">Học viên</th>
                <th className="px-3.5 py-2.5 min-w-[130px]">Lớp{showTeacher ? " / GV" : ""}</th>
                <th className="px-3 py-2.5 text-center w-[100px]">Vắng</th>
                <th className="px-3 py-2.5 text-center w-[120px]">BTVN thiếu</th>
                <th className="px-3.5 py-2.5 text-right w-[110px]">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 font-semibold text-zinc-700">
              {rows.map((w, idx) => {
                const unfinished = unfinishedHomeworkCount(
                  w.homeworkSubmitted,
                  w.homeworkTotal,
                );
                const isAbsentCritical = shouldWarnAbsent(w.absentCount);
                const isHwCritical = shouldWarnHomework(
                  unfinished,
                  w.totalClassSessions,
                  w.classCode,
                );

                return (
                  <tr
                    key={w.id}
                    className="hover:bg-rose-50/30 transition-colors align-middle"
                  >
                    <td className="px-3.5 py-3 text-center text-zinc-400 tabular-nums font-bold">
                      {idx + 1}
                    </td>
                    <td className="px-3.5 py-3">
                      <div className="font-black text-foreground">
                        {w.studentName}
                      </div>
                      <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                        {w.studentPhone || w.studentEmail || "—"}
                      </div>
                    </td>
                    <td className="px-3.5 py-3">
                      <div className="font-bold text-zinc-800">
                        {warningClassLabel(w)}
                      </div>
                      {showTeacher && w.teacherName ? (
                        <div className="text-[10px] text-primary font-bold mt-0.5">
                          GV: {w.teacherName}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-black tabular-nums ${
                          isAbsentCritical
                            ? "bg-rose-100 text-rose-700"
                            : "bg-zinc-100 text-zinc-600"
                        }`}
                      >
                        {w.absentCount} buổi
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-black tabular-nums ${
                          isHwCritical
                            ? "bg-amber-100 text-amber-800"
                            : "bg-zinc-100 text-zinc-600"
                        }`}
                      >
                        {unfinished} bài
                      </span>
                    </td>
                    <td className="px-3.5 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openCompose(w)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-[10px] uppercase tracking-wider transition-all cursor-pointer shadow-2xs"
                        title="Soạn và gửi thông báo cho học viên"
                      >
                        Gửi noti
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Compose Notification Modal */}
      {composeFor ? (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">
                  Soạn thông báo
                </span>
                <h4 className="text-base font-black text-foreground">
                  {composeFor.studentName}
                </h4>
                <p className="text-xs font-semibold text-zinc-500">
                  Lớp: {warningClassLabel(composeFor)}
                </p>
              </div>
              <button
                type="button"
                onClick={closeCompose}
                className="h-8 w-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 font-bold flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-700">
                Nội dung noti gửi học viên:
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 p-3.5 text-xs font-medium text-zinc-800 outline-none focus:border-rose-400 focus:bg-white focus:ring-2 focus:ring-rose-100 transition-all leading-relaxed"
                placeholder="Nhập nội dung thông báo..."
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={closeCompose}
                disabled={sending}
                className="px-4 py-2 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => void handleSend()}
                disabled={sending}
                className="px-5 py-2 rounded-xl bg-rose-600 text-white text-xs font-black uppercase tracking-wider hover:bg-rose-700 disabled:opacity-50 cursor-pointer shadow-2xs"
              >
                {sending ? "Đang gửi…" : "Gửi thông báo"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export async function reloadAcademicWarnings(
  setter: (rows: AcademicWarningRecord[]) => void,
) {
  setter(await listAcademicWarnings());
}
