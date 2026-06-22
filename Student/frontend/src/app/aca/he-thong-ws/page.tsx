"use client";

import { useState } from "react";
import { AcaLayout } from "@/components/aca/AcaLayout";
import { AcaTopbar } from "@/components/aca/AcaTopbar";

type Submission = {
  id: string;
  student: string;
  skill: "Writing" | "Speaking";
  time: string;
  grader: string;
  availabilityChecked: boolean;
  profileChecked: boolean;
  meetLink: string;
};

const INITIAL_SUBMISSIONS: Submission[] = [
  { id: "1", student: "Nguyễn Văn Anh", skill: "Writing", time: "15/06 14:20", grader: "Ms. Hoa", availabilityChecked: true, profileChecked: true, meetLink: "https://meet.google.com/abc-defg-hij" },
  { id: "2", student: "Trần Thị Bình", skill: "Speaking", time: "15/06 15:45", grader: "Mr. Jay", availabilityChecked: false, profileChecked: true, meetLink: "" },
  { id: "3", student: "Lê Hoàng Châu", skill: "Writing", time: "16/06 09:10", grader: "Unassigned", availabilityChecked: false, profileChecked: false, meetLink: "" },
];

export default function HeThongWsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>(INITIAL_SUBMISSIONS);
  const [successMsg, setSuccessMsg] = useState("");

  const handleCheckAvailability = (id: string) => {
    setSubmissions((prev) =>
      prev.map((sub) => (sub.id === id ? { ...sub, availabilityChecked: true } : sub))
    );
    triggerAlert("Đã check mới lịch khả dụng của giáo viên!");
  };

  const handleCheckProfile = (id: string) => {
    setSubmissions((prev) =>
      prev.map((sub) => (sub.id === id ? { ...sub, profileChecked: true } : sub))
    );
    triggerAlert("Đã kiểm tra thông tin hồ sơ học sinh!");
  };

  const handleGraderChange = (id: string, grader: string) => {
    setSubmissions((prev) =>
      prev.map((sub) => (sub.id === id ? { ...sub, grader } : sub))
    );
  };

  const handleMeetLinkChange = (id: string, meetLink: string) => {
    setSubmissions((prev) =>
      prev.map((sub) => (sub.id === id ? { ...sub, meetLink } : sub))
    );
  };

  const handleSend = (sub: Submission) => {
    if (sub.grader === "Unassigned") {
      alert("Vui lòng chọn giáo viên chấm trước khi gửi!");
      return;
    }
    triggerAlert(`Đã gửi yêu cầu chấm bài cho ${sub.grader}! Link Meet: ${sub.meetLink || "N/A"}`);
  };

  const triggerAlert = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  return (
    <AcaLayout>
      <AcaTopbar
        title="Hệ thống chấm Writing - Speaking (W-S)"
        subtitle="Quản lý bài nộp, phân công giáo viên chấm bài, kiểm tra lịch khả dụng và gửi link Meet."
      />
      <main className="mx-auto w-full px-6 py-6 pb-16 md:px-8 space-y-6">

        {successMsg && (
          <div className="rounded-xl bg-success/10 border border-success/20 p-4 text-xs font-bold text-success animate-in fade-in duration-300">
            {successMsg}
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-[10px] font-black uppercase tracking-widest text-muted">
                  <th className="px-6 py-4">Học viên</th>
                  <th className="px-6 py-4 text-center">Kỹ năng</th>
                  <th className="px-6 py-4">Thời gian nộp</th>
                  <th className="px-6 py-4">Người chấm (Assigned)</th>
                  <th className="px-6 py-4 text-center">Lịch giáo viên</th>
                  <th className="px-6 py-4 text-center">Hồ sơ học sinh</th>
                  <th className="px-6 py-4">Link Google Meet</th>
                  <th className="px-6 py-4 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-semibold text-zinc-700">
                {submissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-zinc-50/55 align-middle">
                    <td className="px-6 py-4 font-black text-foreground">{sub.student}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={[
                        "rounded-lg px-2 py-0.5 font-black uppercase text-[9px]",
                        sub.skill === "Writing" ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary"
                      ].join(" ")}>
                        {sub.skill}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-500 tabular-nums">{sub.time}</td>
                    <td className="px-6 py-4">
                      <select
                        value={sub.grader}
                        onChange={(e) => handleGraderChange(sub.id, e.target.value)}
                        className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs font-bold text-foreground outline-none focus:border-primary/45"
                      >
                        <option value="Unassigned">Chọn giáo viên...</option>
                        <option value="Ms. Hoa">Ms. Hoa</option>
                        <option value="Mr. Jay">Mr. Jay</option>
                        <option value="Mr. Paul">Mr. Paul</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {sub.availabilityChecked ? (
                        <span className="inline-flex items-center gap-1 text-[9px] font-black text-success uppercase">
                          ✓ Mới check
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleCheckAvailability(sub.id)}
                          className="rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-600 px-2 py-1 text-[9px] font-black uppercase"
                        >
                          Check lịch
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {sub.profileChecked ? (
                        <span className="inline-flex items-center gap-1 text-[9px] font-black text-success uppercase">
                          ✓ Đã check
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleCheckProfile(sub.id)}
                          className="rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-600 px-2 py-1 text-[9px] font-black uppercase"
                        >
                          Kiểm tra
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        placeholder="Nhập link Google Meet..."
                        value={sub.meetLink}
                        onChange={(e) => handleMeetLinkChange(sub.id, e.target.value)}
                        className="w-full min-w-[150px] rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs outline-none focus:border-primary/45"
                      />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleSend(sub)}
                        className="rounded-lg bg-primary hover:bg-primary/95 text-white px-3 py-1.5 text-xs font-bold shadow-sm"
                      >
                        Gửi bài chấm
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </AcaLayout>
  );
}
