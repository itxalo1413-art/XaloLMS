import { AcaLayout } from "@/components/aca/AcaLayout";
import { AcaTopbar } from "@/components/aca/AcaTopbar";
import { DailyNoteEditorSection } from "@/components/aca/DailyNoteEditorSection";

export default function AcaDailyNotePage() {
  return (
    <AcaLayout>
      <AcaTopbar
        title="Note học viên"
        subtitle="Word of the Day — từ và giải nghĩa hiển thị trên LMS học viên."
      />
      <main className="mx-auto max-w-3xl px-6 py-6 pb-16 md:px-8">
        <DailyNoteEditorSection />
      </main>
    </AcaLayout>
  );
}
