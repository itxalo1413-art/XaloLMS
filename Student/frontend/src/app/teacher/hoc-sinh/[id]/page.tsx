"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { TeacherLayout } from "@/components/teacher/TeacherLayout";
import { TeacherTopbar } from "@/components/teacher/TeacherTopbar";
import { StudentDetailSection } from "@/components/teacher/StudentDetailSection";
import { fetchAcaStudents, type AcaStudent } from "@/lib/acaManagementApi";

export default function HocSinhDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const [student, setStudent] = useState<AcaStudent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void fetchAcaStudents()
      .then((rows) => {
        if (cancelled) return;
        setStudent(rows.find((s) => s.id === id) ?? null);
      })
      .catch(() => {
        if (!cancelled) setStudent(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <TeacherLayout>
      <TeacherTopbar
        title={loading ? "Học sinh" : student?.name ?? "Học sinh"}
        subtitle={student ? student.email || student.phone || "" : "Chi tiết hồ sơ học viên"}
      />
      <main className="mx-auto max-w-6xl px-6 py-6 pb-16 md:px-8">
        <StudentDetailSection studentId={id} student={student} loading={loading} />
      </main>
    </TeacherLayout>
  );
}
