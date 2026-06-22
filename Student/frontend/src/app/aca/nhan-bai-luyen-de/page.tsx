"use client";

import { useState, useEffect } from "react";
import { AcaLayout } from "@/components/aca/AcaLayout";
import { AcaTopbar } from "@/components/aca/AcaTopbar";
import {
  fetchWeeklyDocs,
  fetchTeacherAssignments,
  updateTeacherAssignment,
  WeeklyDoc,
  TeacherAssignment,
} from "@/lib/acaManagementApi";

export default function NhanBaiLuyenDePage() {
  const [activeTab, setActiveTab] = useState<"receive-docs" | "assign-level">("receive-docs");
  const [docs, setDocs] = useState<WeeklyDoc[]>([]);
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [docsData, assignmentsData] = await Promise.all([
          fetchWeeklyDocs(),
          fetchTeacherAssignments(),
        ]);
        setDocs(docsData);
        setAssignments(assignmentsData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleLevelChange = async (id: string, assignedLevel: string) => {
    try {
      const updated = await updateTeacherAssignment(id, { assignedLevel });
      setAssignments((prev) =>
        prev.map((as) => (as.id === id ? updated : as))
      );
    } catch (err: any) {
      alert("Cập nhật thất bại: " + err.message);
    }
  };

  return (
    <AcaLayout>
      <AcaTopbar
        title="Nhận bài luyện đề & Phân cấp độ giáo viên"
        subtitle="Thu nhận link bài làm luyện đề theo tuần và phân phối cấp độ lớp tương ứng cho giáo viên."
      />
      <main className="mx-auto max-w-7xl px-6 py-6 pb-16 md:px-8 space-y-6">

        {/* Tab Controls */}
        <div className="flex gap-2 border-b border-zinc-200 pb-2">
          <button
            onClick={() => setActiveTab("receive-docs")}
            className={[
              "px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all",
              activeTab === "receive-docs" ? "bg-primary text-white shadow-sm" : "bg-zinc-100 hover:bg-zinc-200 text-zinc-600"
            ].join(" ")}
          >
            Nhận bài làm / Link (Theo tuần)
          </button>
          <button
            onClick={() => setActiveTab("assign-level")}
            className={[
              "px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all",
              activeTab === "assign-level" ? "bg-primary text-white shadow-sm" : "bg-zinc-100 hover:bg-zinc-200 text-zinc-600"
            ].join(" ")}
          >
            Assign level lớp cho Giáo viên
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "receive-docs" ? (
          <div className="space-y-4">
            <div className="text-[10px] font-black text-muted uppercase tracking-widest">
              Thu thập link Google Docs / Drive bài làm luyện đề theo từng tuần
            </div>
            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-zinc-200 bg-zinc-50 text-[10px] font-black uppercase tracking-widest text-muted">
                      <th className="px-6 py-4">Học viên</th>
                      <th className="px-6 py-4">Lớp học</th>
                      <th className="px-6 py-4">Tuần học</th>
                      <th className="px-6 py-4">Link bài làm</th>
                      <th className="px-6 py-4">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 font-semibold text-zinc-700">
                    {docs.map((doc) => (
                      <tr key={doc.id} className="hover:bg-zinc-50/55">
                        <td className="px-6 py-4 font-black text-foreground">{doc.student}</td>
                        <td className="px-6 py-4 text-zinc-500">{doc.className}</td>
                        <td className="px-6 py-4 font-bold text-zinc-700">{doc.week}</td>
                        <td className="px-6 py-4">
                          {doc.link ? (
                            <a
                              href={doc.link}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary hover:underline font-black"
                            >
                              Link bài làm ↗
                            </a>
                          ) : (
                            <span className="text-zinc-400 font-medium italic">Chưa cập nhật</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={[
                            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-black uppercase",
                            doc.status === "Đã nhận" ? "bg-success/15 text-success" :
                            doc.status === "Đang chấm" ? "bg-warning/15 text-warning" : "bg-zinc-100 text-zinc-500"
                          ].join(" ")}>
                            {doc.status}
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
              Phân công/Giao trình độ (IELTS Band target) của lớp học cho Giáo viên giảng dạy
            </div>
            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-zinc-200 bg-zinc-50 text-[10px] font-black uppercase tracking-widest text-muted">
                      <th className="px-6 py-4">Giáo viên</th>
                      <th className="px-6 py-4">Lớp phụ trách</th>
                      <th className="px-6 py-4">Cấp độ được giao (Level)</th>
                      <th className="px-6 py-4">Thay đổi phân công</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 font-semibold text-zinc-700">
                    {assignments.map((as) => (
                      <tr key={as.id} className="hover:bg-zinc-50/55 align-middle">
                        <td className="px-6 py-4 font-black text-foreground">{as.teacher}</td>
                        <td className="px-6 py-4 text-zinc-500">{as.className}</td>
                        <td className="px-6 py-4">
                          <span className="rounded-lg bg-secondary/10 px-2.5 py-1 text-[10px] font-black text-secondary uppercase">
                            {as.assignedLevel}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={as.assignedLevel}
                            onChange={(e) => handleLevelChange(as.id, e.target.value)}
                            className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs font-bold text-foreground outline-none focus:border-primary/45"
                          >
                            <option value="IELTS 5.5">IELTS 5.5</option>
                            <option value="IELTS 6.0">IELTS 6.0</option>
                            <option value="IELTS 6.5">IELTS 6.5</option>
                            <option value="IELTS 7.0">IELTS 7.0</option>
                            <option value="IELTS 7.5">IELTS 7.5</option>
                          </select>
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
