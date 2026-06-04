import {
  getWritingTask1CriterionDescriptor,
  type WritingTask1CriterionKey,
} from "@/lib/writingTask1BandDescriptors";

export type WritingTask2CriterionKey =
  | "taskResponse"
  | "coherenceCohesion"
  | "lexicalResource"
  | "grammaticalRange";

export type WritingTask2CriterionScores = Record<WritingTask2CriterionKey, number>;

export const WRITING_TASK2_CRITERIA: {
  key: WritingTask2CriterionKey;
  name: string;
  label: string;
  description: string;
}[] = [
  {
    key: "taskResponse",
    name: "Task Response",
    label: "TR",
    description:
      "Trả lời yêu cầu đề bài — mức độ giải quyết câu hỏi, logic, phát triển ý và ví dụ minh họa.",
  },
  {
    key: "coherenceCohesion",
    name: "Coherence and Cohesion",
    label: "CC",
    description: "Mạch lạc và gắn kết — chia đoạn hợp lý và liên kết các câu.",
  },
  {
    key: "lexicalResource",
    name: "Lexical Resource",
    label: "LR",
    description: "Vốn từ vựng — độ chính xác, đa dạng và phù hợp ngữ cảnh.",
  },
  {
    key: "grammaticalRange",
    name: "Grammatical Range and Accuracy",
    label: "GRA",
    description: "Ngữ pháp — đa dạng cấu trúc câu và độ chính xác (chia thì, dấu câu).",
  },
];

const TASK_RESPONSE_BY_BAND: Record<number, string[]> = {
  9: [
    "Hoàn toàn thỏa mãn mọi yêu cầu đề bài.",
    "Quan điểm rõ ràng, ý được phát triển toàn diện và thuyết phục.",
  ],
  8: [
    "Thỏa mãn đầy đủ yêu cầu; trình bày và minh họa ý chính rõ ràng.",
    "Quan điểm nhất quán, triển khai logic với ví dụ phù hợp.",
  ],
  7: [
    "Thỏa mãn yêu cầu bài thi; quan điểm rõ.",
    "Ý được triển khai đủ nhưng đôi khi luận điểm chưa sắc sảo hoặc thiếu chiều sâu.",
  ],
  6: [
    "Đáp ứng cơ bản yêu cầu nhưng có thể thiếu chi tiết hoặc chưa đầy đủ các phần.",
    "Quan điểm có nhưng phát triển ý chưa sâu.",
  ],
  5: [
    "Chỉ đáp ứng một phần yêu cầu; quan điểm chưa rõ hoặc chưa nhất quán.",
    "Ý còn chung chung, thiếu ví dụ cụ thể.",
  ],
  4: [
    "Nỗ lực trả lời nhưng không bao quát đủ ý chính.",
    "Luận điểm lộn xộn hoặc lệch đề.",
  ],
  3: [
    "Không đáp ứng đúng yêu cầu; ý hạn chế, lặp hoặc không phù hợp.",
  ],
  2: ["Bài làm hầu như không liên quan đến đề bài."],
  1: ["Không truyền đạt được ý tưởng liên quan đến đề."],
  0: ["Không làm bài hoặc chỉ sao chép đề bài."],
};

function clampBand(band: number): number {
  return Math.min(9, Math.max(0, Math.round(band)));
}

const SHARED_TASK2_KEYS: WritingTask1CriterionKey[] = [
  "coherenceCohesion",
  "lexicalResource",
  "grammaticalRange",
];

export function getWritingTask2CriterionDescriptor(
  band: number,
  criterion: WritingTask2CriterionKey,
): string[] {
  const b = clampBand(band);
  if (criterion === "taskResponse") {
    return TASK_RESPONSE_BY_BAND[b] ?? [];
  }
  if (SHARED_TASK2_KEYS.includes(criterion as WritingTask1CriterionKey)) {
    return getWritingTask1CriterionDescriptor(band, criterion as WritingTask1CriterionKey);
  }
  return [];
}
