import { TeacherLayout } from "@/components/teacher/TeacherLayout";
import { TeacherTopbar } from "@/components/teacher/TeacherTopbar";

const MATERIALS = [
  { id: "mat-1", name: "IELTS Core Curriculum Folder", type: "Google Drive Folder", link: "https://drive.google.com/drive/folders/demo-core", note: "Thư mục tài liệu lý thuyết & slide bài giảng chính khóa" },
  { id: "mat-2", name: "IELTS Intensive Curriculum Folder", type: "Google Drive Folder", link: "https://drive.google.com/drive/folders/demo-intensive", note: "Giáo trình nâng cao & bài tập thực hành bổ trợ" },
  { id: "mat-3", name: "Mock Test Speaking Rubric & Band Descriptors", type: "PDF Document", link: "https://docs.google.com/document/d/demo-speaking-rubric", note: "Tiêu chuẩn chấm điểm bài Speaking Mock Test và quy đổi band" },
  { id: "mat-4", name: "Writing Task 1 & 2 Grading Guideline", type: "Google Docs", link: "https://docs.google.com/document/d/demo-writing-grading", note: "Hướng dẫn sửa bài & chấm lỗi chi tiết cho phần thi Writing" },
  { id: "mat-5", name: "Xalo English Brand Identity Handbook", type: "PDF Document", link: "https://drive.google.com/open?id=demo-brand-identity", note: "Quy chuẩn thương hiệu, màu sắc, font chữ và logo XLO" },
];

export default function TeachingMaterialsPage() {
  return (
    <TeacherLayout>
      <TeacherTopbar
        title="Teaching Materials"
        subtitle="Quản lý và truy cập các tài nguyên học thuật, tài liệu giảng dạy chính thức."
      />
      <main className="mx-auto max-w-6xl px-6 py-6 pb-16 md:px-8 space-y-6">
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-soft">
          <div className="p-5 border-b border-zinc-100">
            <h3 className="text-sm font-bold text-zinc-950">Thư viện tài liệu giảng dạy</h3>
            <p className="text-xs text-zinc-500 mt-1">
              Tất cả các tài liệu giảng dạy, giáo án RLP, biểu mẫu chấm điểm và thư mục chia sẻ tài nguyên.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 border-b border-zinc-200 text-[10px] font-black uppercase tracking-widest text-muted">
                <tr>
                  <th className="px-6 py-4">Tên tài liệu / Thư mục</th>
                  <th className="px-6 py-4">Loại tài liệu</th>
                  <th className="px-6 py-4">Mô tả chi tiết</th>
                  <th className="px-6 py-4 text-right">Liên kết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-semibold text-zinc-700">
                {MATERIALS.map((mat) => (
                  <tr key={mat.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-zinc-950">{mat.name}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase ${
                        mat.type.includes("Folder")
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-blue-50 text-blue-700 border border-blue-200"
                      }`}>
                        {mat.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-500 max-w-md font-medium">{mat.note}</td>
                    <td className="px-6 py-4 text-right">
                      <a
                        href={mat.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex rounded-lg bg-primary/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-primary hover:bg-primary/15 transition-colors"
                      >
                        Mở liên kết
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </TeacherLayout>
  );
}
