import { TeacherLayout } from "@/components/teacher/TeacherLayout";
import { TeacherTopbar } from "@/components/teacher/TeacherTopbar";
import { StudentDetailSection } from "@/components/teacher/StudentDetailSection";
import { getStudent } from "@/components/teacher/mockData";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function HocSinhDetailPage({ params }: PageProps) {
  const { id } = await params;
  const student = getStudent(id);

  return (
    <TeacherLayout>
      <TeacherTopbar
        title={student?.name ?? "Học sinh"}
        subtitle={
          student ? `${student.group}` : "Chi tiết hồ sơ & nhận xét (demo)"
        }
      />
      <main className="mx-auto max-w-6xl px-6 py-6 pb-16 md:px-8">
        <StudentDetailSection studentId={id} />
      </main>
    </TeacherLayout>
  );
}
