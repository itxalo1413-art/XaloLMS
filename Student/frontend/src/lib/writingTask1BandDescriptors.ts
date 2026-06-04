export type WritingTask1CriterionKey =
  | "taskAchievement"
  | "coherenceCohesion"
  | "lexicalResource"
  | "grammaticalRange";

export type WritingTask1CriterionScores = Record<WritingTask1CriterionKey, number>;

export type WritingTask1BandRow = {
  band: number;
  taskAchievement: string[];
  coherenceCohesion: string[];
  lexicalResource: string[];
  grammaticalRange: string[];
};

export const WRITING_TASK1_CRITERIA: {
  key: WritingTask1CriterionKey;
  name: string;
  label: string;
  description: string;
}[] = [
  {
    key: "taskAchievement",
    name: "Task Achievement",
    label: "TA",
    description:
      "Độ hoàn thành yêu cầu đề — tóm tắt, xu hướng, điểm nổi bật và so sánh số liệu/biểu đồ.",
  },
  {
    key: "coherenceCohesion",
    name: "Coherence and Cohesion",
    label: "CC",
    description: "Mạch lạc và gắn kết — sắp xếp thông tin và sử dụng từ nối.",
  },
  {
    key: "lexicalResource",
    name: "Lexical Resource",
    label: "LR",
    description:
      "Vốn từ vựng — độ chính xác, đa dạng và từ vựng chuyên ngành.",
  },
  {
    key: "grammaticalRange",
    name: "Grammatical Range and Accuracy",
    label: "GRA",
    description:
      "Ngữ pháp — đa dạng cấu trúc câu và độ chính xác (chia thì, dấu câu).",
  },
];

function clampBand(band: number): number {
  return Math.min(9, Math.max(0, Math.round(band)));
}

export function getWritingTask1CriterionDescriptor(
  band: number,
  criterion: WritingTask1CriterionKey,
): string[] {
  const row = WRITING_TASK1_BAND_DESCRIPTORS.find((r) => r.band === clampBand(band));
  return row?.[criterion] ?? [];
}

/** Tiêu chí chấm IELTS Writing Task 1 theo band (TA, CC, LR, GRA). */
export const WRITING_TASK1_BAND_DESCRIPTORS: WritingTask1BandRow[] = [
  {
    band: 9,
    taskAchievement: [
      "Đáp ứng đầy đủ mọi yêu cầu của đề bài.",
      "Trình bày câu trả lời phát triển toàn diện.",
    ],
    coherenceCohesion: [
      "Sử dụng liên kết một cách tự nhiên, không gây chú ý.",
      "Sắp xếp đoạn văn khéo léo.",
    ],
    lexicalResource: [
      "Sử dụng vốn từ đa dạng với khả năng kiểm soát từ vựng tự nhiên và tinh tế; lỗi nhỏ hiếm xảy ra (nếu có).",
    ],
    grammaticalRange: [
      "Dùng cấu trúc đa dạng với tính linh hoạt và độ chính xác cao; lỗi nhỏ chỉ xảy ra rất hiếm (nếu có).",
    ],
  },
  {
    band: 8,
    taskAchievement: [
      "Bao quát đầy đủ yêu cầu, trình bày và minh họa các đặc điểm chính rõ ràng, hợp lý.",
    ],
    coherenceCohesion: [
      "Sắp xếp thông tin và ý tưởng một cách logic.",
      "Quản lý tốt các khía cạnh liên kết.",
      "Sử dụng đoạn văn hợp lý và đầy đủ.",
    ],
    lexicalResource: [
      "Sử dụng vốn từ rộng, lưu loát và linh hoạt để truyền tải ý nghĩa chính xác.",
      "Dùng từ hiếm có kỹ năng, đôi khi sai lựa chọn từ hoặc ghép từ.",
    ],
    grammaticalRange: [
      "Sử dụng cấu trúc đa dạng.",
      "Phần lớn câu không có lỗi.",
      "Chỉ mắc lỗi rất hiếm hoặc không phù hợp.",
    ],
  },
  {
    band: 7,
    taskAchievement: [
      "Đáp ứng yêu cầu bài thi.",
      "Trình bày một cái nhìn tổng quan rõ ràng về các xu hướng chính, khác biệt hoặc giai đoạn.",
      "Làm nổi bật các đặc điểm chính nhưng có thể mở rộng thêm.",
    ],
    coherenceCohesion: [
      "Tổ chức thông tin và ý tưởng logic, có sự tiến triển rõ ràng.",
      "Sử dụng thiết bị liên kết phù hợp, nhưng đôi khi bị lạm dụng hoặc thiếu.",
    ],
    lexicalResource: [
      "Vốn từ đủ rộng để linh hoạt và chính xác.",
      "Dùng từ ít phổ biến với một số nhận thức về phong cách và sự kết hợp từ.",
    ],
    grammaticalRange: [
      "Dùng đa dạng cấu trúc phức tạp.",
      "Tạo nhiều câu không lỗi.",
      "Kiểm soát tốt ngữ pháp và dấu câu, nhưng có thể mắc vài lỗi nhỏ.",
    ],
  },
  {
    band: 6,
    taskAchievement: [
      "Đáp ứng cơ bản yêu cầu của đề bài.",
      "Cung cấp cái nhìn tổng quan phù hợp nhưng đôi khi thiếu chi tiết hoặc không chính xác.",
    ],
    coherenceCohesion: [
      "Tổ chức thông tin và ý tưởng hợp lý, nhưng sự liên kết đôi lúc máy móc.",
      "Tham chiếu không phải lúc nào cũng rõ ràng hoặc phù hợp.",
    ],
    lexicalResource: [
      "Sử dụng vốn từ vừa đủ cho bài thi.",
      "Cố gắng dùng từ ít phổ biến nhưng đôi lúc không chính xác.",
    ],
    grammaticalRange: [
      "Kết hợp câu đơn và câu phức.",
      "Một số lỗi ngữ pháp và dấu câu không làm giảm ý nghĩa.",
    ],
  },
  {
    band: 5,
    taskAchievement: [
      "Đáp ứng yêu cầu một cách chung chung, định dạng có thể chưa phù hợp.",
      "Trình bày chi tiết một cách máy móc, không có cái nhìn tổng quan rõ ràng.",
    ],
    coherenceCohesion: [
      "Trình bày thông tin nhưng tổ chức ý tưởng chưa tốt, thiếu sự tiến triển rõ ràng.",
      "Sử dụng thiết bị liên kết không chính xác hoặc quá mức.",
    ],
    lexicalResource: ["Vốn từ hạn chế, đôi lúc gây khó hiểu cho người đọc."],
    grammaticalRange: [
      "Sử dụng cấu trúc đơn giản với nỗ lực tạo câu phức nhưng độ chính xác thấp.",
      "Lỗi ngữ pháp thường xuyên, gây khó khăn cho người đọc.",
    ],
  },
  {
    band: 4,
    taskAchievement: [
      "Nỗ lực đáp ứng yêu cầu nhưng không bao quát đầy đủ các ý chính.",
      "Nội dung có thể lộn xộn, không rõ ràng hoặc không phù hợp với định dạng.",
    ],
    coherenceCohesion: [
      "Tổ chức ý tưởng không mạch lạc, thiếu sự tiến triển trong bài viết.",
      "Dùng liên kết cơ bản nhưng không chính xác hoặc lặp lại.",
    ],
    lexicalResource: [
      "Vốn từ đơn giản, lặp lại nhiều, đôi khi không phù hợp với đề bài.",
    ],
    grammaticalRange: [
      "Chỉ dùng cấu trúc cơ bản, lỗi sai chiếm ưu thế, dấu câu thường không chính xác.",
    ],
  },
  {
    band: 3,
    taskAchievement: [
      "Không đáp ứng đúng yêu cầu, có thể hiểu sai đề bài.",
      "Ý tưởng hạn chế, lặp lại hoặc không phù hợp.",
    ],
    coherenceCohesion: [
      "Không tổ chức ý tưởng logic.",
      "Sử dụng rất ít thiết bị liên kết hoặc dùng sai.",
    ],
    lexicalResource: ["Vốn từ hạn chế nghiêm trọng; lỗi làm biến dạng ý nghĩa."],
    grammaticalRange: [
      "Nỗ lực tạo câu nhưng lỗi ngữ pháp và dấu câu làm sai lệch ý nghĩa.",
    ],
  },
  {
    band: 2,
    taskAchievement: ["Bài làm hầu như không liên quan đến đề bài."],
    coherenceCohesion: ["Gần như không kiểm soát được các yếu tố tổ chức."],
    lexicalResource: [
      "Vốn từ cực kỳ hạn chế; không kiểm soát được lỗi chính tả hoặc hình thành từ.",
    ],
    grammaticalRange: ["Không thể tạo câu ngoài các cụm từ ghi nhớ."],
  },
  {
    band: 1,
    taskAchievement: ["Không liên quan đến đề bài, không truyền đạt được ý tưởng."],
    coherenceCohesion: ["Không có sự tổ chức ý tưởng."],
    lexicalResource: ["Chỉ sử dụng được vài từ riêng lẻ."],
    grammaticalRange: ["Không thể tạo câu hoàn chỉnh."],
  },
  {
    band: 0,
    taskAchievement: ["Không làm bài hoặc chỉ sao chép lại đề bài."],
    coherenceCohesion: ["Không áp dụng."],
    lexicalResource: ["Không áp dụng."],
    grammaticalRange: ["Không áp dụng."],
  },
];
