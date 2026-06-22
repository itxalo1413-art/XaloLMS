"use client";

import { useState } from "react";
import { AcaLayout } from "@/components/aca/AcaLayout";
import { AcaTopbar } from "@/components/aca/AcaTopbar";

const MOCK_SUBMISSIONS = [
  { id: "ms1", student: "Nguyễn Khôi Nguyên", type: "Speaking Practice 2", date: "15/06 10:30", fileLink: "https://drive.google.com/speaking-file-1", status: "Hiển thị ở Support" },
  { id: "ms2", student: "Nguyễn Khôi Nguyên", type: "Writing Practice 1", date: "14/06 16:45", fileLink: "https://docs.google.com/document-1", status: "Hiển thị ở Support" },
  { id: "ms3", student: "Trần Thị Bình", type: "Speaking Practice 1", date: "12/06 09:15", fileLink: "https://drive.google.com/speaking-file-2", status: "Đã duyệt" },
];

const MOCK_ENTRANCE_FINAL = [
  { id: "ef1", student: "Lê Hoàng Châu", type: "Entrance Test", aim: "IELTS 6.5", date: "18/06 08:30", grader: "Ms. Hoa" },
  { id: "ef2", student: "Phạm Minh Đức", type: "Final Test", aim: "IELTS 7.0", date: "20/06 14:00", grader: "Mr. Jay" },
  { id: "ef3", student: "Vũ Hải Yến", type: "Entrance Test", aim: "IELTS 5.5", date: "21/06 09:00", grader: "Ms. Linh" },
];

export default function MockTestSwPage() {
  const [activeSubTab, setActiveSubTab] = useState<"sw-submission" | "entrance-final">("sw-submission");

  return (
    <AcaLayout>
      <AcaTopbar
        title="Mock Test S-W & Entrance / Final"
        subtitle="Duyệt bài làm Speaking - Writing của học viên đẩy lên hệ thống và lên lịch thi Entrance / Final."
      />
      <main className="mx-auto max-w-7xl px-6 py-6 pb-16 md:px-8 space-y-6">

        {/* Tab Controls */}
        <div className="flex gap-2 border-b border-zinc-200 pb-2">
          <button
            onClick={() => setActiveSubTab("sw-submission")}
            className={[
              "px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all",
              activeSubTab === "sw-submission" ? "bg-primary text-white shadow-sm" : "bg-zinc-100 hover:bg-zinc-200 text-zinc-600"
            ].join(" ")}
          >
            Mock Test S-W (Từ Student → Support)
          </button>
          <button
            onClick={() => setActiveSubTab("entrance-final")}
            className={[
              "px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all",
              activeSubTab === "entrance-final" ? "bg-primary text-white shadow-sm" : "bg-zinc-100 hover:bg-zinc-200 text-zinc-600"
            ].join(" ")}
          >
            Entrance / Final → DS
          </button>
        </div>

        {/* Tab content */}
        {activeSubTab === "sw-submission" ? (
          <div className="space-y-4">
            <div className="text-[10px] font-black text-muted uppercase tracking-widest">
              Bài nộp luyện đề Speaking/Writing từ học viên (Đồng bộ qua Module Test)
            </div>
            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-zinc-200 bg-zinc-50 text-[10px] font-black uppercase tracking-widest text-muted">
                      <th className="px-6 py-4">Học viên</th>
                      <th className="px-6 py-4">Dạng bài luyện</th>
                      <th className="px-6 py-4">Ngày nộp bài</th>
                      <th className="px-6 py-4">Link bài làm</th>
                      <th className="px-6 py-4">Trạng thái Support</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 font-semibold text-zinc-700">
                    {MOCK_SUBMISSIONS.map((sub) => (
                      <tr key={sub.id} className="hover:bg-zinc-50/55">
                        <td className="px-6 py-4 font-black text-foreground">{sub.student}</td>
                        <td className="px-6 py-4 font-bold text-zinc-800">{sub.type}</td>
                        <td className="px-6 py-4 text-zinc-500">{sub.date}</td>
                        <td className="px-6 py-4">
                          <a
                            href={sub.fileLink}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:underline font-black"
                          >
                            Xem bài làm Drive/Doc ↗
                          </a>
                        </td>
                        <td className="px-6 py-4">
                          <span className={[
                            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-black uppercase",
                            sub.status.includes("Support") ? "bg-warning/15 text-warning" : "bg-success/15 text-success"
                          ].join(" ")}>
                            {sub.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-[10px] font-black text-muted uppercase tracking-widest">
              Lịch thi thử đánh giá năng lực đầu vào & cuối khóa
            </div>
            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-zinc-200 bg-zinc-50 text-[10px] font-black uppercase tracking-widest text-muted">
                      <th className="px-6 py-4">Thí sinh</th>
                      <th className="px-6 py-4">Phân loại</th>
                      <th className="px-6 py-4">Mục tiêu (Aim)</th>
                      <th className="px-6 py-4">Thời gian thi</th>
                      <th className="px-6 py-4">Giáo viên gác/chấm</th>
                      <th className="px-6 py-4">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 font-semibold text-zinc-700">
                    {MOCK_ENTRANCE_FINAL.map((ef) => (
                      <tr key={ef.id} className="hover:bg-zinc-50/55">
                        <td className="px-6 py-4 font-black text-foreground">{ef.student}</td>
                        <td className="px-6 py-4">
                          <span className={[
                            "rounded-lg px-2 py-0.5 font-black uppercase text-[9px]",
                            ef.type === "Entrance Test" ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary"
                          ].join(" ")}>
                            {ef.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold text-zinc-800">{ef.aim}</td>
                        <td className="px-6 py-4 text-zinc-500 tabular-nums">{ef.date}</td>
                        <td className="px-6 py-4">{ef.grader}</td>
                        <td className="px-6 py-4">
                          <button className="rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-3 py-1.5 text-xs font-bold shadow-sm">
                            Đổi lịch thi
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </main>
    </AcaLayout>
  );
}
