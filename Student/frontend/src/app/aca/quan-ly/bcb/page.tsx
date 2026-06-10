"use client";

import { useState } from "react";
import { AcaLayout } from "@/components/aca/AcaLayout";
import { AcaTopbar } from "@/components/aca/AcaTopbar";
import { DiagnosisEditorSection } from "@/components/shared/DiagnosisEditorSection";
import { StudentProfileEditorSection } from "@/components/shared/StudentProfileEditorSection";
import { StudentRecordPicker } from "@/components/shared/StudentRecordPicker";
import { DEFAULT_STUDENT_ID } from "@/lib/studentRoster";

export default function AcaBcbPage() {
  const [tab, setTab] = useState<"student" | "guest">("student");
  const [studentId, setStudentId] = useState(DEFAULT_STUDENT_ID);

  return (
    <AcaLayout>
      <AcaTopbar
        title="Chẩn đoán BCB"
        subtitle="Chỉnh điểm, BCB và hồ sơ theo từng học viên."
      />
      <main className="mx-auto max-w-4xl space-y-8 px-6 py-6 pb-16 md:px-8">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTab("student")}
            className={[
              "rounded-xl px-4 py-2 text-xs font-bold",
              tab === "student" ? "bg-primary text-white" : "bg-zinc-100",
            ].join(" ")}
          >
            Học viên
          </button>
          <button
            type="button"
            onClick={() => setTab("guest")}
            className={[
              "rounded-xl px-4 py-2 text-xs font-bold",
              tab === "guest" ? "bg-primary text-white" : "bg-zinc-100",
            ].join(" ")}
          >
            Khách (Guest)
          </button>
        </div>
        {tab === "student" ? (
          <>
            <StudentRecordPicker value={studentId} onChange={setStudentId} />
            <StudentProfileEditorSection portalLabel="ACA" studentId={studentId} />
            <DiagnosisEditorSection variant="student" portalLabel="ACA" studentId={studentId} />
          </>
        ) : (
          <DiagnosisEditorSection variant="guest" portalLabel="ACA" />
        )}
      </main>
    </AcaLayout>
  );
}
