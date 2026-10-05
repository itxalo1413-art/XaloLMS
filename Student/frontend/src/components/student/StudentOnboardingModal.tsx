"use client";

import * as React from "react";

export const STUDENT_ONBOARDING_KEY = "xalo.studentOnboardingSeen";

export interface StudentOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TabGuideItem {
  id: string;
  tabLabel: string;
  heading: string;
  summary: string;
  sections: {
    label: string;
    description: string;
  }[];
  note?: string;
}

const GUIDE_TABS: TabGuideItem[] = [
  {
    id: "student-info",
    tabLabel: "Thông tin học viên",
    heading: "1. Tab Thông tin học viên (Trang chủ)",
    summary:
      "Nơi quản lý toàn bộ hồ sơ học tập cá nhân, mục tiêu điểm số IELTS, lịch luyện đề và báo cáo năng lực chi tiết.",
    sections: [
      {
        label: "Mục tiêu band điểm & Ngày thi",
        description:
          "Theo dõi band điểm mục tiêu Overall và từng kỹ năng (L - R - W - S) cùng thời gian thi dự kiến để bám sát kế hoạch học.",
      },
      {
        label: "Báo Cáo Ban Đầu (BCB)",
        description:
          "Bảng chẩn đoán năng lực chi tiết theo từng dạng câu hỏi (Listening, Reading, Writing, Speaking), chỉ rõ dạng bài đang làm tốt và dạng bài còn yếu cần ưu tiên cải thiện.",
      },
      {
        label: "Lớp luyện đề bổ trợ tuần (T3 - T5 - T7)",
        description:
          "Theo dõi lịch học bổ trợ, kiểm tra tình trạng điểm danh các buổi T3, T5, T7 và mở trực tiếp link folder bài làm cá nhân trên Google Drive.",
      },
      {
        label: "Thói quen học tập & Kỹ năng trọng tâm (Focus Skills)",
        description:
          "Tự điều chỉnh số giờ học mỗi tuần và chọn các kỹ năng trọng tâm để hệ thống gợi ý bài luyện tập tự học sát với nhu cầu của bạn.",
      },
    ],
    note: "Nếu có thông báo nghỉ học hoặc nhắc nhở từ Học vụ, mục Cảnh báo học tập sẽ hiển thị ngay đầu trang.",
  },
  {
    id: "course-info",
    tabLabel: "Thông tin khóa học",
    heading: "2. Tab Thông tin khóa học",
    summary:
      "Nắm vững lộ trình đào tạo chuẩn RLP 36 buổi, tài liệu bài học và video record của từng buổi.",
    sections: [
      {
        label: "Lộ trình đào tạo chuẩn 36 buổi",
        description:
          "Chi tiết nội dung giảng dạy của từng buổi học, phân bổ đều theo 4 kỹ năng chính kết hợp ngữ pháp và từ vựng học thuật.",
      },
      {
        label: "Tài liệu bài học & Slide bài giảng",
        description:
          "Tải tài liệu PDF bài học, slide trình chiếu và bài tập về nhà theo hướng dẫn của giảng viên phụ trách lớp.",
      },
      {
        label: "Link Video Record từng buổi",
        description:
          "Xem lại video ghi hình của các buổi học đã diễn ra để ôn tập lại kiến thức khó hoặc học bù khi bạn phải vắng mặt.",
      },
    ],
    note: "Bạn có thể sử dụng bộ lọc kỹ năng để tìm nhanh buổi học cần xem lại tài liệu.",
  },
  {
    id: "self-study",
    tabLabel: "Hỗ trợ tự học",
    heading: "3. Tab Hỗ trợ tự học",
    summary:
      "Không gian thi thử và nhận phản hồi trực tiếp từ đội ngũ Grader chuyên môn của Xa Lộ English.",
    sections: [
      {
        label: "Đăng ký Mock Test Speaking 1-1",
        description:
          "Chủ động chọn ngày và khung giờ rảnh phù hợp. Hệ thống sẽ kết nối với Grader và cấp link phòng Google Meet trực tuyến.",
      },
      {
        label: "Nộp bài chấm Writing chi tiết",
        description:
          "Gửi link Google Docs bài viết của bạn. Bài sẽ được chấm và nhận xét chi tiết theo 4 tiêu chí chấm thi IELTS (Task Achievement, Coherence & Cohesion, Lexical Resource, Grammatical Range & Accuracy).",
      },
      {
        label: "Kho bài tập tự học theo kỹ năng",
        description:
          "Luyện thêm các bài tập bổ trợ được phân loại rõ ràng theo kỹ năng và mức band điểm mục tiêu.",
      },
    ],
    note: "Sau buổi thi Speaking, điểm số và nhận xét sẽ được cập nhật vào tab Lưu trữ bài test.",
  },
  {
    id: "materials",
    tabLabel: "Kho tài liệu",
    heading: "4. Tab Kho tài liệu",
    summary:
      "Thư viện tài liệu học tập mở rộng, đề thi mẫu và tài nguyên chia sẻ từ Học vụ.",
    sections: [
      {
        label: "Tài liệu bổ trợ độc quyền",
        description:
          "Tổng hợp sổ tay từ vựng theo chủ đề, cẩm nang ngữ pháp, bộ đề thi dự đoán và bài mẫu Writing/Speaking band 7.0+.",
      },
      {
        label: "Thư mục Google Drive lớp học",
        description:
          "Liên kết nhanh tới Drive dùng chung của lớp để xem và tải về toàn bộ tài nguyên học tập một cách thuận tiện.",
      },
    ],
    note: "Kho tài liệu được cập nhật định kỳ theo từng tuần và chặng học.",
  },
  {
    id: "test-archive",
    tabLabel: "Lưu trữ bài test",
    heading: "5. Tab Lưu trữ bài test",
    summary:
      "Nơi lưu trữ tập trung toàn bộ kết quả các bài kiểm tra đánh giá năng lực trong suốt quá trình học.",
    sections: [
      {
        label: "Bảng điểm tổng hợp tất cả bài thi",
        description:
          "Theo dõi điểm số từng kỹ năng của các bài Entrance Test đầu vào, bài kiểm tra giữa kỳ, bài Mock Test và Final Test cuối khóa.",
      },
      {
        label: "Xem bài làm & Bài chấm chữa",
        description:
          "Bấm trực tiếp vào đường link để xem lại bài làm của bạn hoặc file nhận xét chấm chữa chi tiết của giáo viên.",
      },
      {
        label: "Mở lại hướng dẫn sử dụng bất cứ lúc nào",
        description:
          "Nếu cần xem lại hướng dẫn này, bạn chỉ cần bấm vào nút Hướng dẫn ở góc dưới thanh Sidebar bên trái.",
      },
    ],
    note: "Chúc bạn có trải nghiệm học tập hiệu quả và sớm đạt được band điểm IELTS mục tiêu!",
  },
];

export function StudentOnboardingModal({ isOpen, onClose }: StudentOnboardingModalProps) {
  const [activeTabIdx, setActiveTabIdx] = React.useState(0);
  const [neverShowAgain, setNeverShowAgain] = React.useState(true);

  React.useEffect(() => {
    if (isOpen) {
      setActiveTabIdx(0);
    }
  }, [isOpen]);

  // Keyboard navigation
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleDismiss();
      } else if (e.key === "ArrowRight") {
        if (activeTabIdx < GUIDE_TABS.length - 1) {
          setActiveTabIdx((prev) => prev + 1);
        }
      } else if (e.key === "ArrowLeft") {
        if (activeTabIdx > 0) {
          setActiveTabIdx((prev) => prev - 1);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, activeTabIdx, neverShowAgain]);

  const handleDismiss = () => {
    if (neverShowAgain && typeof window !== "undefined") {
      try {
        localStorage.setItem(STUDENT_ONBOARDING_KEY, "true");
      } catch {
        // ignore
      }
    }
    onClose();
  };

  const handleNext = () => {
    if (activeTabIdx < GUIDE_TABS.length - 1) {
      setActiveTabIdx((prev) => prev + 1);
    } else {
      handleDismiss();
    }
  };

  const handlePrev = () => {
    if (activeTabIdx > 0) {
      setActiveTabIdx((prev) => prev - 1);
    }
  };

  if (!isOpen) return null;

  const currentTab = GUIDE_TABS[activeTabIdx];
  const isLast = activeTabIdx === GUIDE_TABS.length - 1;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fadeIn">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-zinc-950/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={handleDismiss}
      />

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="guide-heading"
        className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-primary/20 overflow-hidden flex flex-col my-auto z-10"
      >
        {/* Top Header */}
        <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-zinc-100 bg-white">
          <div className="flex items-center gap-3">
            <img src="/Logo_XLE.svg" alt="Xa Lộ English" className="h-7 w-auto object-contain" />
            <div>
              <h2 className="text-sm font-black text-foreground uppercase tracking-wider">
                Hướng dẫn sử dụng website học viên
              </h2>
              <p className="text-[11px] text-zinc-500 font-medium">
                Khám phá 5 phân hệ chính của Xa Lộ English LMS
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            className="w-8 h-8 rounded-xl border border-zinc-200 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 flex items-center justify-center transition-all cursor-pointer"
            aria-label="Đóng hướng dẫn"
          >
            <span className="text-base font-bold leading-none">✕</span>
          </button>
        </div>

        {/* Tab Navigation Row (Styled matching web folder tabs) */}
        <div className="flex items-center px-4 pt-2 bg-zinc-50/70 border-b border-zinc-200 overflow-x-auto no-scrollbar gap-1">
          {GUIDE_TABS.map((tab, idx) => {
            const active = idx === activeTabIdx;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTabIdx(idx)}
                className={`relative px-4 py-2.5 text-xs font-black transition-all select-none shrink-0 rounded-t-xl cursor-pointer ${
                  active
                    ? "bg-white text-primary border-t border-x border-zinc-200 -mb-[1px] shadow-2xs"
                    : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100/70"
                }`}
              >
                <span>{tab.tabLabel}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="p-6 md:p-8 flex-1 overflow-y-auto max-h-[60vh] space-y-5 bg-white">
          {/* Section Heading & Summary */}
          <div className="space-y-1.5 pb-2 border-b border-zinc-100">
            <h3 id="guide-heading" className="text-base font-black text-foreground">
              {currentTab.heading}
            </h3>
            <p className="text-xs md:text-sm text-zinc-600 font-medium leading-relaxed">
              {currentTab.summary}
            </p>
          </div>

          {/* Clean Text List of Features (No icon boxes, no card lines) */}
          <div className="space-y-4 pt-1">
            {currentTab.sections.map((sec, sIdx) => (
              <div key={sIdx} className="space-y-0.5 text-xs md:text-sm leading-relaxed">
                <div className="font-bold text-zinc-900">
                  <span className="text-primary mr-1.5">•</span>
                  {sec.label}
                </div>
                <div className="text-zinc-600 pl-3.5 font-medium leading-relaxed">
                  {sec.description}
                </div>
              </div>
            ))}
          </div>

          {/* Simple Note */}
          {currentTab.note && (
            <div className="pt-2 text-[11px] md:text-xs text-zinc-500 italic pl-3.5 border-l-2 border-primary/30">
              {currentTab.note}
            </div>
          )}
        </div>

        {/* Bottom Action Footer */}
        <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Checkbox: Don't show again */}
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-zinc-600 hover:text-zinc-900 transition-colors">
            <input
              type="checkbox"
              checked={neverShowAgain}
              onChange={(e) => setNeverShowAgain(e.target.checked)}
              className="w-4 h-4 rounded text-primary border-zinc-300 focus:ring-primary cursor-pointer transition-all"
            />
            <span>Đã hiểu, không tự động hiện lại khi vào trang</span>
          </label>

          {/* Prev / Next Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {activeTabIdx > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="h-9 px-4 rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100 font-bold text-xs transition-all shadow-2xs cursor-pointer"
              >
                Quay lại
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className={`h-9 px-5 rounded-xl font-black text-xs transition-all cursor-pointer ${
                isLast
                  ? "bg-primary text-white hover:bg-primary/90 shadow-soft"
                  : "bg-primary text-white hover:bg-primary/90 shadow-soft"
              }`}
            >
              {isLast ? "Bắt đầu học" : "Tiếp theo"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
