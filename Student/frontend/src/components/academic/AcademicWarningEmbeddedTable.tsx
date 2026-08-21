"use client";

import { useMemo, useState } from "react";
import {
  listAcademicWarnings,
  sendWarningNotificationToStudent,
  shouldWarnAbsent,
  shouldWarnHomework,
  unfinishedHomeworkCount,
  type AcademicWarningRecord,
} from "@/lib/academicWarningStore";

function isActiveWarning(w: AcademicWarningRecord): boolean {
  return (
    (w.warningTypes?.includes("absent_exceeded") ||
      w.warningTypes?.includes("homework_insufficient")) &&
    (w.handledStatus === "pending" || !w.handledStatus)
  );
}

function defaultComposeMessage(w: AcademicWarningRecord): string {
  const parts: string[] = [
    `Chào ${w.studentName}, học vụ XLE ghi nhận tiến độ tại lớp ${w.className}:`,
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

  return (
    <div className="rounded-2xl border-2 border-rose-300/80 bg-white p-5 shadow-soft space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rose-100 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-600 text-white font-black text-sm shadow-xs">
            !
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-zinc-900 tracking-tight">
                Cảnh báo học tập
              </h3>
              <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-[10px] font-black text-rose-700 border border-rose-200">
                {rows.length} học viên
              </span>
            </div>
            <p className="text-xs text-zinc-500 font-medium mt-0.5">
              Vắng 3 buổi: hệ thống tự gửi noti học viên. Vắng ≥ 4 buổi hoặc BTVN ≥ 4
              deadline chưa nộp: hiện trên bảng. Sau khi soạn & gửi noti, dòng sẽ biến
              mất.
            </p>
          </div>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="text-xs text-zinc-500 font-medium py-2">
          {emptyHint || "Chưa có học viên nào cần học vụ xử lý cảnh báo."}
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-rose-100 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-rose-100 bg-rose-50/60 text-[10px] font-black uppercase tracking-wider text-rose-900">
                  <th className="px-4 py-3 text-center w-12">STT</th>
                  <th className="px-4 py-3">Học viên</th>
                  <th className="px-4 py-3">
                    Lớp học{showTeacher ? " & GV" : ""}
                  </th>
                  <th className="px-3 py-3 text-center">Tiến độ</th>
                  <th className="px-3 py-3 text-center">Số buổi vắng (≥4)</th>
                  <th className="px-3 py-3 text-center">BTVN chưa nộp (≥4)</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-medium">
                {rows.map((w, idx) => {
                  const stageDone = w.firstStageCompleted === true;
                  const unfinished = unfinishedHomeworkCount(
                    w.homeworkSubmitted,
                    w.homeworkTotal,
                  );
                  const isAbsentCritical = shouldWarnAbsent(w.absentCount);
                  const isHwCritical = shouldWarnHomework(unfinished);

                  return (
                    <tr
                      key={w.id}
                      className="hover:bg-rose-50/30 transition-colors"
                    >
                      <td className="px-4 py-3 text-center font-bold text-zinc-500 tabular-nums">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-zinc-900">
                          {w.studentName}
                        </div>
                        <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                          {w.studentPhone}{" "}
                          {w.studentEmail ? `• ${w.studentEmail}` : ""}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-zinc-900">
                          {w.className}
                        </div>
                        {showTeacher ? (
                          <div className="text-[10px] text-primary font-bold mt-0.5">
                            GV: {w.teacherName}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className="inline-flex rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-700">
                          {w.checkpointPhase}
                        </span>
                        <div className="mt-1 text-[9px] font-bold text-zinc-500">
                          {stageDone ? "Đã đủ 1 chặng" : "Chưa đủ 1 chặng"}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <div
                          className={`inline-flex flex-col items-center justify-center px-2.5 py-1 rounded-xl border ${
                            isAbsentCritical
                              ? "bg-rose-50 text-rose-700 border-rose-300"
                              : "bg-zinc-50 text-zinc-700 border-zinc-200"
                          }`}
                        >
                          <span className="text-xs font-black tabular-nums">
                            {w.absentCount} buổi
                          </span>
                          <span className="text-[9px] font-bold opacity-80">
                            {w.attendanceRate}% CC
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <div
                          className={`inline-flex flex-col items-center justify-center px-2.5 py-1 rounded-xl border ${
                            isHwCritical
                              ? "bg-amber-50 text-amber-700 border-amber-300"
                              : "bg-zinc-50 text-zinc-700 border-zinc-200"
                          }`}
                        >
                          <span className="text-xs font-black tabular-nums">
                            {unfinished} deadline chưa nộp
                          </span>
                          <span className="text-[9px] font-bold opacity-80">
                            {w.homeworkSubmitted}/{w.homeworkTotal} đã nộp
                            (deadline ≤ hôm nay)
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => openCompose(w)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 hover:bg-rose-600 hover:text-white transition-all cursor-pointer shadow-2xs"
                          title="Soạn và gửi thông báo cho học viên"
                        >
                          Soạn & gửi noti
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

      {composeFor ? (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl space-y-4">
            <div>
              <h4 className="text-sm font-black text-zinc-900">
                Soạn thông báo cảnh báo
              </h4>
              <p className="text-xs text-zinc-500 mt-1">
                Gửi tới <strong>{composeFor.studentName}</strong> — lớp{" "}
                <strong>{composeFor.className}</strong>. Sau khi gửi, dòng này sẽ
                biến mất khỏi bảng.
              </p>
            </div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={8}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-xs font-medium text-zinc-800 outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
              placeholder="Nội dung thông báo gửi học viên..."
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeCompose}
                disabled={sending}
                className="px-3 py-2 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-600 hover:bg-zinc-50 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => void handleSend()}
                disabled={sending}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-black hover:bg-rose-700 disabled:opacity-50"
              >
                {sending ? "Đang gửi..." : "Gửi noti"}
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
