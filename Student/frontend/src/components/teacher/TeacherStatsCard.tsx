"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { loadMockTestRequests, refreshMockTestRequestsForTeacher } from "@/lib/mockTestRequests";
import { isSpeakingMockTest } from "@/lib/selfStudyFormat";
import { refreshWritingSubmissionsForTeacher, loadWritingSubmissions } from "@/lib/writingSubmissions";
import { getLoggedInTeacherName } from "@/lib/teacherIdentity";

export function TeacherStatsCard() {
  const [speakingCount, setSpeakingCount] = useState(0);
  const [writingCount, setWritingCount] = useState(0);
  const [trialCount, setTrialCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const teacherName = getLoggedInTeacherName();

  const syncStats = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch Speaking Mock Tests
      await refreshMockTestRequestsForTeacher(teacherName);
      const mockTests = loadMockTestRequests();
      const completedSpeaking = mockTests.filter(
        (r) =>
          r.status === "approved" &&
          isSpeakingMockTest(r.skill) &&
          (r.examTeacher ?? "").trim() === teacherName.trim() &&
          Boolean(r.score?.trim())
      );
      setSpeakingCount(completedSpeaking.length);

      // Fetch Graded Writing Submissions
      await refreshWritingSubmissionsForTeacher("graded");
      const writingSubmissions = loadWritingSubmissions();
      const gradedWriting = writingSubmissions.filter((r) => r.status === "graded");
      setWritingCount(gradedWriting.length);
    } catch (err) {
      console.error("Failed to sync teacher stats:", err);
    } finally {
      setLoading(false);
    }
  }, [teacherName]);

  useEffect(() => {
    void syncStats();
    // Refresh stats when mock tests or writing submissions change
    window.addEventListener("lms-mock-test-updated", syncStats);
    window.addEventListener("xalo-writing-submissions-updated", syncStats);
    return () => {
      window.removeEventListener("lms-mock-test-updated", syncStats);
      window.removeEventListener("xalo-writing-submissions-updated", syncStats);
    };
  }, [syncStats]);

  const updateTrialCount = (val: number) => {
    setTrialCount(Math.max(0, val));
  };

  const totals = useMemo(() => {
    const totalMinutes = (speakingCount * 30) + (writingCount * 60) + (trialCount * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return { hours, minutes, totalMinutes };
  }, [speakingCount, writingCount, trialCount]);

  return (
    <div className="rounded-2xl border border-primary/10 bg-white p-6 shadow-soft space-y-6">
      <div>
        <h3 className="text-base font-bold text-zinc-950">Quy đổi thời lượng dạy</h3>
        <p className="text-xs text-zinc-500 mt-1">
          Hệ thống tự động quy đổi thời gian giảng dạy dựa trên các ca đã hoàn thành.
        </p>
      </div>

      {/* Main total display with gradient block */}
      <div className="rounded-xl bg-gradient-to-r from-primary to-[#7a6ad4] p-5 text-white shadow-sm flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider opacity-85">Tổng thời lượng giảng dạy</span>
          <div className="text-2xl font-black mt-1">
            {totals.hours} giờ {totals.minutes} phút
          </div>
        </div>
        <div className="h-10 w-10 bg-white/10 rounded-lg flex items-center justify-center font-bold text-xs uppercase tracking-widest">
          {totals.totalMinutes}p
        </div>
      </div>

      {/* Detail breakdowns */}
      <div className="space-y-3">
        {/* Speaking breakdown */}
        <div className="flex items-center justify-between p-3 rounded-xl border border-zinc-100 bg-[#fae8ff]/30 hover:bg-[#fae8ff]/50 transition-colors">
          <div>
            <div className="text-xs font-bold text-zinc-900">Speaking Mock Test</div>
            <div className="text-[10px] text-zinc-500 mt-0.5">Mỗi ca đã chấm = 30 phút</div>
          </div>
          <div className="text-right">
            <span className="inline-flex rounded-full bg-[#fae8ff] px-2 py-0.5 text-[11px] font-bold text-[#86198f]">
              {speakingCount} ca
            </span>
            <div className="text-[10px] text-zinc-500 font-semibold mt-0.5">{speakingCount * 30} phút</div>
          </div>
        </div>

        {/* Writing breakdown */}
        <div className="flex items-center justify-between p-3 rounded-xl border border-zinc-100 bg-[#dbeafe]/30 hover:bg-[#dbeafe]/50 transition-colors">
          <div>
            <div className="text-xs font-bold text-zinc-900">Chấm bài Writing</div>
            <div className="text-[10px] text-zinc-500 mt-0.5">Mỗi bài hoàn tất = 60 phút</div>
          </div>
          <div className="text-right">
            <span className="inline-flex rounded-full bg-[#dbeafe] px-2 py-0.5 text-[11px] font-bold text-[#1e40af]">
              {writingCount} bài
            </span>
            <div className="text-[10px] text-zinc-500 font-semibold mt-0.5">{writingCount * 60} phút</div>
          </div>
        </div>

        {/* Trial class breakdown (Input editable) */}
        <div className="flex items-center justify-between p-3 rounded-xl border border-zinc-100 bg-[#dcfce7]/30 hover:bg-[#dcfce7]/50 transition-colors">
          <div>
            <div className="text-xs font-bold text-zinc-900">Ca Học thử (Trial Class)</div>
            <div className="text-[10px] text-zinc-500 mt-0.5">Mỗi ca giảng dạy = 60 phút</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center border border-zinc-200 rounded-lg overflow-hidden bg-white">
              <button
                type="button"
                onClick={() => updateTrialCount(trialCount - 1)}
                className="px-2 py-1 bg-zinc-50 hover:bg-zinc-100 text-xs font-bold text-zinc-600 border-r border-zinc-200"
              >
                -
              </button>
              <input
                type="number"
                min="0"
                value={trialCount}
                onChange={(e) => updateTrialCount(parseInt(e.target.value, 10) || 0)}
                className="w-10 text-center text-xs font-bold outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button
                type="button"
                onClick={() => updateTrialCount(trialCount + 1)}
                className="px-2 py-1 bg-zinc-50 hover:bg-zinc-100 text-xs font-bold text-zinc-600 border-l border-zinc-200"
              >
                +
              </button>
            </div>
            <div className="text-right min-w-[50px]">
              <span className="inline-flex rounded-full bg-[#dcfce7] px-2 py-0.5 text-[11px] font-bold text-[#166534]">
                {trialCount} ca
              </span>
              <div className="text-[10px] text-zinc-500 font-semibold mt-0.5">{trialCount * 60} phút</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quy đổi rule note */}
      <div className="text-[10px] font-bold text-zinc-400 bg-zinc-50 p-2.5 rounded-lg text-center leading-relaxed">
        * Quy đổi: 1 ca Speaking = 30p // 1 bài Writing = 60p // 1 ca Học thử = 60p
      </div>
    </div>
  );
}
