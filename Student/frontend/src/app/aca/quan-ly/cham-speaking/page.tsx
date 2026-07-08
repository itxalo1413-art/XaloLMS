"use client";

import { useState } from "react";
import { AcaLayout } from "@/components/aca/AcaLayout";
import { AcaTopbar } from "@/components/aca/AcaTopbar";

type SpeakingSubmission = {
  id: string;
  student: string;
  type: string;
  date: string;
  grader: string;
  meetLink: string;
  status: "Chờ chấm" | "Đang chấm" | "Đã chấm";
};

type EntranceFinalTest = {
  id: string;
  student: string;
  type: "Entrance Test" | "Final Test";
  aim: string;
  date: string;
  grader: string;
  meetLink: string;
  status: "Chưa thi" | "Đang thi" | "Đã thi";
};

const INITIAL_SUBMISSIONS: SpeakingSubmission[] = [
  { id: "ss1", student: "Nguyễn Khôi Nguyên", type: "Speaking Practice 2", date: "15/06 10:30", grader: "Mr. Jay", meetLink: "https://meet.google.com/abc-defg-hij", status: "Chờ chấm" },
  { id: "ss2", student: "Trần Thị Bình", type: "Speaking Practice 1", date: "12/06 09:15", grader: "Ms. Hoa", meetLink: "https://meet.google.com/xyz-pdqr-wxy", status: "Đã chấm" },
  { id: "ss3", student: "Vũ Thảo Vy", type: "Speaking Practice 3", date: "16/06 14:00", grader: "Mr. Paul", meetLink: "", status: "Đang chấm" },
];

const INITIAL_ENTRANCE_FINAL: EntranceFinalTest[] = [
  { id: "ef1", student: "Lê Hoàng Châu", type: "Entrance Test", aim: "IELTS 6.5", date: "18/06 08:30", grader: "Ms. Hoa", meetLink: "https://meet.google.com/lhc-entr-test", status: "Chưa thi" },
  { id: "ef2", student: "Phạm Minh Đức", type: "Final Test", aim: "IELTS 7.0", date: "20/06 14:00", grader: "Mr. Jay", meetLink: "https://meet.google.com/pmd-final-test", status: "Chưa thi" },
  { id: "ef3", student: "Vũ Hải Yến", type: "Entrance Test", aim: "IELTS 5.5", date: "21/06 09:00", grader: "Ms. Linh", meetLink: "", status: "Chưa thi" },
];

const GRADER_OPTIONS = ["Ms. Hoa", "Mr. Jay", "Mr. Paul", "Ms. Linh", "Unassigned"];

export default function AcaSpeakingGradingPage() {
  const [activeTab, setActiveTab] = useState<"tests" | "practices">("tests");
  const [submissions, setSubmissions] = useState<SpeakingSubmission[]>(INITIAL_SUBMISSIONS);
  const [tests, setTests] = useState<EntranceFinalTest[]>(INITIAL_ENTRANCE_FINAL);
  const [successMsg, setSuccessMsg] = useState("");

  const triggerAlert = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  const handleSubmissionMeetLinkChange = (id: string, meetLink: string) => {
    setSubmissions(prev => prev.map(s => s.id === id ? { ...s, meetLink } : s));
  };

  const handleTestMeetLinkChange = (id: string, meetLink: string) => {
    setTests(prev => prev.map(t => t.id === id ? { ...t, meetLink } : t));
  };

  const handleSubmissionGraderChange = (id: string, grader: string) => {
    setSubmissions(prev => prev.map(s => s.id === id ? { ...s, grader } : s));
  };

  const handleTestGraderChange = (id: string, grader: string) => {
    setTests(prev => prev.map(t => t.id === id ? { ...t, grader } : t));
  };

  const handleSubmissionStatusChange = (id: string, status: SpeakingSubmission["status"]) => {
    setSubmissions(prev => prev.map(s => s.id === id ? { ...s, status } : s));
    triggerAlert("Đã cập nhật trạng thái bài luyện!");
  };

  const handleTestStatusChange = (id: string, status: EntranceFinalTest["status"]) => {
    setTests(prev => prev.map(t => t.id === id ? { ...t, status } : t));
    triggerAlert("Đã cập nhật trạng thái lịch thi!");
  };

  const handleSendLink = (student: string, meetLink: string, grader: string) => {
    if (!meetLink.trim()) {
      alert("Vui lòng nhập link Zoom/Meet trước khi gửi!");
      return;
    }
    if (grader === "Unassigned") {
      alert("Vui lòng gán giáo viên test/chấm trước khi gửi!");
      return;
    }
    triggerAlert(`Đã gửi thông tin phòng thi cho ${student} & giáo viên ${grader}! Link: ${meetLink}`);
  };

  return (
    <AcaLayout>
      <AcaTopbar
        title="Chấm Speaking & Entrance / Final"
        subtitle="Quản lý lịch thi speaking trực tuyến, phân công giáo viên và cập nhật link Zoom/Meet học viên."
      />
      <main className="mx-auto w-full px-6 py-6 pb-16 md:px-8 space-y-6">
        {successMsg && (
          <div className="rounded-xl bg-success/10 border border-success/20 p-4 text-xs font-bold text-success animate-in fade-in duration-300">
            {successMsg}
          </div>
        )}

        {/* Tab Controls */}
        <div className="flex gap-2 border-b border-zinc-200 pb-2">
          <button
            onClick={() => setActiveTab("tests")}
            className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
              activeTab === "tests" ? "bg-primary text-white shadow-sm" : "bg-zinc-100 hover:bg-zinc-200 text-zinc-600"
            }`}
          >
            Lịch thi Speaking (Entrance / Final)
          </button>
          <button
            onClick={() => setActiveTab("practices")}
            className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
              activeTab === "practices" ? "bg-primary text-white shadow-sm" : "bg-zinc-100 hover:bg-zinc-200 text-zinc-600"
            }`}
          >
            Bài luyện Speaking (Practice / Homework)
          </button>
        </div>

        {/* Tab 1: Lịch thi Speaking */}
        {activeTab === "tests" && (
          <div className="space-y-4">
            <div className="text-[10px] font-black text-muted uppercase tracking-widest">
              Danh sách đánh giá năng lực Speaking đầu vào &amp; cuối khóa
            </div>
            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-zinc-200 bg-zinc-50 text-[10px] font-black uppercase tracking-widest text-muted">
                      <th className="px-6 py-4">Thí sinh</th>
                      <th className="px-6 py-4 text-center">Phân loại</th>
                      <th className="px-6 py-4">Mục tiêu (Aim)</th>
                      <th className="px-6 py-4">Thời gian thi</th>
                      <th className="px-6 py-4">Giáo viên gác/test</th>
                      <th className="px-6 py-4">Link Zoom / Meet</th>
                      <th className="px-6 py-4 text-center">Trạng thái</th>
                      <th className="px-6 py-4 text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 font-semibold text-zinc-700">
                    {tests.map((t) => (
                      <tr key={t.id} className="hover:bg-zinc-50/55 align-middle">
                        <td className="px-6 py-4 font-black text-foreground">{t.student}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`rounded-lg px-2 py-0.5 font-black uppercase text-[9px] ${
                            t.type === "Entrance Test" ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary"
                          }`}>
                            {t.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold text-zinc-800">{t.aim}</td>
                        <td className="px-6 py-4 text-zinc-500 tabular-nums">{t.date}</td>
                        <td className="px-6 py-4">
                          <select
                            value={t.grader}
                            onChange={(e) => handleTestGraderChange(t.id, e.target.value)}
                            className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs font-bold text-foreground outline-none focus:border-primary/45"
                          >
                            {GRADER_OPTIONS.map((g) => (
                              <option key={g} value={g}>{g}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            placeholder="Nhập link Zoom / Meet..."
                            value={t.meetLink}
                            onChange={(e) => handleTestMeetLinkChange(t.id, e.target.value)}
                            className="w-full min-w-[200px] rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs outline-none focus:border-primary/45"
                          />
                        </td>
                        <td className="px-6 py-4 text-center">
                          <select
                            value={t.status}
                            onChange={(e) => handleTestStatusChange(t.id, e.target.value as any)}
                            className={`rounded-lg border px-2 py-0.5 text-[9px] font-black uppercase outline-none bg-white ${
                              t.status === "Chưa thi" ? "border-zinc-300 text-zinc-500" :
                              t.status === "Đang thi" ? "border-warning/30 text-warning" : "border-success/30 text-success"
                            }`}
                          >
                            <option value="Chưa thi">Chưa thi</option>
                            <option value="Đang thi">Đang thi</option>
                            <option value="Đã thi">Đã thi</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleSendLink(t.student, t.meetLink, t.grader)}
                            className="rounded-lg bg-primary hover:bg-primary/95 text-white px-3 py-1.5 text-xs font-bold shadow-sm"
                          >
                            Gửi link
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

        {/* Tab 2: Bài luyện Speaking */}
        {activeTab === "practices" && (
          <div className="space-y-4">
            <div className="text-[10px] font-black text-muted uppercase tracking-widest">
              Bài nộp luyện tập Speaking (Chạy thử &amp; Bài làm hàng tuần)
            </div>
            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-zinc-200 bg-zinc-50 text-[10px] font-black uppercase tracking-widest text-muted">
                      <th className="px-6 py-4">Học viên</th>
                      <th className="px-6 py-4">Bài luyện tập</th>
                      <th className="px-6 py-4">Ngày nộp</th>
                      <th className="px-6 py-4">Giáo viên chấm</th>
                      <th className="px-6 py-4">Link phòng thi Zoom/Meet</th>
                      <th className="px-6 py-4 text-center">Trạng thái</th>
                      <th className="px-6 py-4 text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 font-semibold text-zinc-700">
                    {submissions.map((s) => (
                      <tr key={s.id} className="hover:bg-zinc-50/55 align-middle">
                        <td className="px-6 py-4 font-black text-foreground">{s.student}</td>
                        <td className="px-6 py-4 font-bold text-zinc-800">{s.type}</td>
                        <td className="px-6 py-4 text-zinc-500 tabular-nums">{s.date}</td>
                        <td className="px-6 py-4">
                          <select
                            value={s.grader}
                            onChange={(e) => handleSubmissionGraderChange(s.id, e.target.value)}
                            className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs font-bold text-foreground outline-none focus:border-primary/45"
                          >
                            {GRADER_OPTIONS.map((g) => (
                              <option key={g} value={g}>{g}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            placeholder="Nhập link Zoom / Meet..."
                            value={s.meetLink}
                            onChange={(e) => handleSubmissionMeetLinkChange(s.id, e.target.value)}
                            className="w-full min-w-[200px] rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs outline-none focus:border-primary/45"
                          />
                        </td>
                        <td className="px-6 py-4 text-center">
                          <select
                            value={s.status}
                            onChange={(e) => handleSubmissionStatusChange(s.id, e.target.value as any)}
                            className={`rounded-lg border px-2 py-0.5 text-[9px] font-black uppercase outline-none bg-white ${
                              s.status === "Chờ chấm" ? "border-zinc-300 text-zinc-500" :
                              s.status === "Đang chấm" ? "border-warning/30 text-warning" : "border-success/30 text-success"
                            }`}
                          >
                            <option value="Chờ chấm">Chờ chấm</option>
                            <option value="Đang chấm">Đang chấm</option>
                            <option value="Đã chấm">Đã chấm</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleSendLink(s.student, s.meetLink, s.grader)}
                            className="rounded-lg bg-primary hover:bg-primary/95 text-white px-3 py-1.5 text-xs font-bold shadow-sm"
                          >
                            Gửi link
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
