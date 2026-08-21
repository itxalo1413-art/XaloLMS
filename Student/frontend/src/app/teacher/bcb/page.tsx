"use client";

import { useEffect, useMemo, useState } from "react";
import { TeacherLayout } from "@/components/teacher/TeacherLayout";
import { TeacherTopbar } from "@/components/teacher/TeacherTopbar";
import { DiagnosisEditorSection } from "@/components/shared/DiagnosisEditorSection";
import { StudentProfileEditorSection } from "@/components/shared/StudentProfileEditorSection";
import { StudentRecordPicker } from "@/components/shared/StudentRecordPicker";
import { fetchAcaStudents, type AcaStudent } from "@/lib/acaManagementApi";

export default function TeacherBcbPage() {
  const [studentId, setStudentId] = useState("");
  const [students, setStudents] = useState<AcaStudent[]>([]);

  useEffect(() => {
    void fetchAcaStudents().then(setStudents).catch(() => setStudents([]));
  }, []);

  const selectedStudent = useMemo(
    () => students.find((s) => s.id === studentId) ?? null,
    [students, studentId],
  );

  return (
    <TeacherLayout>
      <TeacherTopbar
        title="Chẩn đoán học viên"
        subtitle="Cập nhật BCB, điểm và hồ sơ theo từng học viên."
      />
      <main className="mx-auto max-w-4xl space-y-8 px-6 py-6 pb-16 md:px-8">
        <StudentRecordPicker value={studentId} onChange={setStudentId} />
        <StudentProfileEditorSection portalLabel="Giáo viên" studentId={studentId} />
        <DiagnosisEditorSection
          variant="student"
          portalLabel="Giáo viên"
          studentId={studentId}
          studentEmail={selectedStudent?.email}
          studentName={selectedStudent?.name}
        />
      </main>
    </TeacherLayout>
  );
}
