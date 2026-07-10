"use client";

import { useState, useEffect } from "react";
import { AcaLayout } from "@/components/aca/AcaLayout";
import { AcaTopbar } from "@/components/aca/AcaTopbar";
import { 
  fetchAcaPracticeWeeks,
  fetchAcaPracticeStudents,
  AcaPracticeWeek,
  AcaPracticeStudent
} from "@/lib/acaManagementApi";

export default function ThongKeLuyenDePage() {
  const [weeksList, setWeeksList] = useState<AcaPracticeWeek[]>([]);
  const [selectedWeekRange, setSelectedWeekRange] = useState<string>("");
  const [studentsList, setStudentsList] = useState<AcaPracticeStudent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [wData, sData] = await Promise.all([
          fetchAcaPracticeWeeks(),
          fetchAcaPracticeStudents(),
        ]);
        setWeeksList(wData);
        setStudentsList(sData);
        if (wData.length > 0) {
          const defaultWeek = wData[2]?.weekRange || wData[0]?.weekRange || "";
          setSelectedWeekRange(defaultWeek);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Helper to get students for a week range.
  // If the week range doesn't have students, we clone and slightly adapt the mock data for demonstration.
  const getStudentsForWeek = (range: string): AcaPracticeStudent[] => {
    const directMatches = studentsList.filter(s => s.weekRange === range);
    if (directMatches.length > 0) return directMatches;

    // Otherwise adapt Week 3 data to populate Week 1 & 2
    return studentsList.map((s, idx) => {
      // Shift statuses randomly based on index to create variation
      let testScheduleSunday = "Có tham gia";
      if (idx % 4 === 1) testScheduleSunday = "Gửi đề vào CN";
      else if (idx % 4 === 2) testScheduleSunday = "Đăng ký lịch khác";
      else if (idx % 5 === 0) testScheduleSunday = "";

      let participateLd28 = idx % 7 === 0 || idx % 9 === 0;

      return {
        ...s,
        id: `clone_${range}_${s.id}`,
        testScheduleSunday,
        participateLd28,
        weekRange: range,
      };
    });
  };

  const currentStudents = getStudentsForWeek(selectedWeekRange);

  // Computations
  const totalCount = currentStudents.length;
  const directTestCount = currentStudents.filter(s => s.testScheduleSunday === "Có tham gia").length;
  const selfTestCount = currentStudents.filter(s => s.testScheduleSunday === "Gửi đề vào CN").length;
  const otherTestCount = currentStudents.filter(s => s.testScheduleSunday === "Đăng ký lịch khác").length;
  const noResponseCount = currentStudents.filter(s => !s.testScheduleSunday).length;
  const participateLd28Count = currentStudents.filter(s => s.participateLd28).length;

  const directTestPct = totalCount > 0 ? Math.round((directTestCount / totalCount) * 100) : 0;
  const selfTestPct = totalCount > 0 ? Math.round((selfTestCount / totalCount) * 100) : 0;
  const otherTestPct = totalCount > 0 ? Math.round((otherTestCount / totalCount) * 100) : 0;
  const noResponsePct = totalCount > 0 ? Math.round((noResponseCount / totalCount) * 100) : 0;
  const participateLd28Pct = totalCount > 0 ? Math.round((participateLd28Count / totalCount) * 100) : 0;

  // RLP Classes involved
  const rlpClassesMap: Record<string, number> = {};
  currentStudents.forEach(s => {
    // extract prefix class like "CC4", "CC2", "CC1" or class name base
    let cleanRlp = "Lớp 1:1 / Khác";
    if (s.rlp.includes("CC")) {
      const match = s.rlp.match(/CC\d+/);
      if (match) cleanRlp = `Học viên hệ ${match[0]}`;
    } else if (s.rlp.includes("1:1")) {
      cleanRlp = "Lớp 1:1";
    }
    rlpClassesMap[cleanRlp] = (rlpClassesMap[cleanRlp] || 0) + 1;
  });

  return (
    <AcaLayout>
      <AcaTopbar
        title="Thống kê dữ liệu luyện đề theo tuần"
        subtitle="Phân tích tình hình đăng ký thi thử chủ nhật, tỷ lệ nộp bài tự làm và phân chia học viên."
      />
      <main className="mx-auto w-full px-6 py-6 pb-16 md:px-8 space-y-6">

        {/* Week Selector */}
        <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-zinc-200/80 shadow-sm">
          <label className="text-xs font-black uppercase text-muted tracking-wider">Chọn tuần thống kê:</label>
          <select
            value={selectedWeekRange}
            onChange={(e) => setSelectedWeekRange(e.target.value)}
            className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-xs font-bold text-foreground outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
          >
            {weeksList.map((w, idx) => (
              <option key={idx} value={w.weekRange}>{w.weekRange}</option>
            ))}
          </select>
        </div>

        {/* Highlight Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Tổng học viên</div>
            <div className="mt-2 text-3xl font-black text-foreground">{totalCount} học viên</div>
            <div className="mt-1 text-[10px] text-zinc-400 font-bold">Đăng ký tham gia tuần học</div>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Học trực tiếp (Thứ 5)</div>
            <div className="mt-2 text-3xl font-black text-success">{directTestCount} học viên</div>
            <div className="mt-1 text-[10px] text-zinc-400 font-bold">Tỷ lệ: {directTestPct}% tổng số</div>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Gửi đề tự làm</div>
            <div className="mt-2 text-3xl font-black text-blue-600">{selfTestCount} học viên</div>
            <div className="mt-1 text-[10px] text-zinc-400 font-bold">Tỷ lệ: {selfTestPct}% tổng số</div>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Đăng ký LĐ 28</div>
            <div className="mt-2 text-3xl font-black text-amber-600">{participateLd28Count} học viên</div>
            <div className="mt-1 text-[10px] text-zinc-400 font-bold">Tỷ lệ: {participateLd28Pct}% tổng số</div>
          </div>
        </div>

        {/* Graphs and distribution lists */}
        <div className="grid gap-6 md:grid-cols-1">
          
          {/* Thursday Test Registration Progress Breakdown */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm space-y-6">
            <h3 className="text-xs font-black uppercase tracking-wider text-foreground pb-2 border-b border-zinc-100">
              Phân tích trạng thái học Thứ 5 (Chữa đề L-R-W)
            </h3>
            
            <div className="space-y-4">
              {/* Progress 1: Có tham gia */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-zinc-700">
                  <span>Có tham gia trực tiếp (19h45-21h45)</span>
                  <span className="text-success font-black">{directTestCount} ({directTestPct}%)</span>
                </div>
                <div className="h-3 w-full bg-zinc-100 rounded-full overflow-hidden">
                  <div className="h-full bg-success transition-all duration-500" style={{ width: `${directTestPct}%` }}></div>
                </div>
              </div>

              {/* Progress 2: Gửi đề vào T5 */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-zinc-700">
                  <span>Nhận đề tự làm tại nhà</span>
                  <span className="text-blue-600 font-black">{selfTestCount} ({selfTestPct}%)</span>
                </div>
                <div className="h-3 w-full bg-zinc-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${selfTestPct}%` }}></div>
                </div>
              </div>

              {/* Progress 3: Đăng ký lịch khác */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-zinc-700">
                  <span>Hẹn lịch học bù / Lịch khác</span>
                  <span className="text-amber-600 font-black">{otherTestCount} ({otherTestPct}%)</span>
                </div>
                <div className="h-3 w-full bg-zinc-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 transition-all duration-500" style={{ width: `${otherTestPct}%` }}></div>
                </div>
              </div>

            </div>
          </div>



        </div>

        {/* LĐ 28 Registration Checklist */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-zinc-100">
            <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
              Danh sách học viên đăng ký test LĐ 28 ({participateLd28Count} học viên)
            </h3>
            <span className="text-[10px] font-black text-amber-600 uppercase bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
              Lập lịch chấm Speaking/Writing ưu tiên
            </span>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
            {currentStudents
              .filter(s => s.participateLd28)
              .map((student, idx) => (
                <div key={student.id} className="flex items-center gap-2 p-2.5 rounded-xl border border-zinc-100 bg-zinc-50/50">
                  <span className="text-[10px] font-black text-zinc-400 tabular-nums">#{idx + 1}</span>
                  <div>
                    <div className="text-xs font-black text-foreground">{student.name}</div>
                    <div className="text-[9px] text-zinc-400 font-semibold truncate max-w-[180px]">{student.rlp}</div>
                  </div>
                </div>
              ))}
          </div>
        </div>

      </main>
    </AcaLayout>
  );
}
