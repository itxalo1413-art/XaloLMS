export type SpeakingCriterionKey =
  | "fluencyCoherence"
  | "lexicalResource"
  | "grammaticalRangeAccuracy"
  | "pronunciation";

export type SpeakingCriterionScores = Record<SpeakingCriterionKey, number>;

export const SPEAKING_CRITERIA: {
  key: SpeakingCriterionKey;
  name: string;
  label: string;
  description: string;
}[] = [
  {
    key: "fluencyCoherence",
    name: "Fluency and Coherence",
    label: "FC",
    description:
      "Độ trôi chảy và mạch lạc: nói liên tục, phát triển ý có logic, dùng từ nối tự nhiên.",
  },
  {
    key: "lexicalResource",
    name: "Lexical Resource",
    label: "LR",
    description:
      "Vốn từ vựng: phạm vi từ, độ chính xác ngữ cảnh, paraphrase, collocation/thành ngữ.",
  },
  {
    key: "grammaticalRangeAccuracy",
    name: "Grammatical Range and Accuracy",
    label: "GRA",
    description:
      "Phạm vi và độ chính xác ngữ pháp: đa dạng cấu trúc câu, dùng thì và cấu trúc phức đúng.",
  },
  {
    key: "pronunciation",
    name: "Pronunciation",
    label: "PRN",
    description:
      "Phát âm: độ rõ, trọng âm, ngữ điệu, nhịp điệu; accent không cản trở việc hiểu.",
  },
];

type SpeakingBandRow = {
  band: number;
  fluencyCoherence: string[];
  lexicalResource: string[];
  grammaticalRangeAccuracy: string[];
  pronunciation: string[];
};

function clampBand(band: number): number {
  return Math.min(9, Math.max(4, Math.round(band)));
}

export function getSpeakingCriterionDescriptor(
  band: number,
  criterion: SpeakingCriterionKey,
): string[] {
  const row = SPEAKING_BAND_DESCRIPTORS.find((r) => r.band === clampBand(band));
  return row?.[criterion] ?? [];
}

export const SPEAKING_WEIGHT_NOTE =
  "4 tiêu chí Speaking (FC, LR, GRA, PRN) đóng góp ngang nhau: mỗi tiêu chí chiếm 25% điểm Speaking.";

const SPEAKING_BAND_DESCRIPTORS: SpeakingBandRow[] = [
  {
    band: 9,
    fluencyCoherence: [
      "Nói hoàn toàn tự nhiên, không ngập ngừng vì thiếu từ/cấu trúc.",
      "Liên kết ý cực kỳ mượt mà, logic rõ ràng và nội dung phát triển phong phú.",
    ],
    lexicalResource: [
      "Từ vựng linh hoạt và chính xác trong mọi bối cảnh.",
      "Dùng collocations/thành ngữ tự nhiên, paraphrase mượt, không lỗi chọn từ.",
    ],
    grammaticalRangeAccuracy: [
      "Dùng chính xác, tự nhiên các cấu trúc ngữ pháp phức tạp.",
      "Hầu như không mắc lỗi ngữ pháp.",
    ],
    pronunciation: [
      "Phát âm gần như hoàn hảo, cực kỳ dễ nghe.",
      "Trọng âm, ngữ điệu, nối âm và chunking tự nhiên như người bản xứ.",
    ],
  },
  {
    band: 8,
    fluencyCoherence: [
      "Nói rất trôi chảy; khoảng dừng chủ yếu để nghĩ ý, không phải tìm từ.",
      "Ý tưởng tổ chức rõ ràng, mạch lạc và dễ theo dõi.",
    ],
    lexicalResource: [
      "Vốn từ phong phú, diễn đạt chính xác bằng từ phù hợp ngữ cảnh.",
      "Dùng từ nâng cao/collocations tự nhiên, paraphrase linh hoạt.",
    ],
    grammaticalRangeAccuracy: [
      "Sử dụng linh hoạt nhiều loại câu phức.",
      "Hầu hết câu đúng ngữ pháp, chỉ còn lỗi nhỏ không đáng kể.",
    ],
    pronunciation: [
      "Trọng âm từ/câu và ngữ điệu tự nhiên.",
      "Hầu như không có lỗi phát âm ảnh hưởng đến sự hiểu.",
    ],
  },
  {
    band: 7,
    fluencyCoherence: [
      "Nói trôi chảy với ít ngập ngừng, lặp từ hoặc tự sửa lỗi.",
      "Mở rộng câu trả lời tốt, dùng từ nối linh hoạt hơn.",
    ],
    lexicalResource: [
      "Vốn từ khá rộng, dùng được từ ít gặp và một số collocations.",
      "Paraphrase khá hiệu quả, đôi lúc vẫn chọn từ chưa tối ưu.",
    ],
    grammaticalRangeAccuracy: [
      "Dùng được câu ghép/câu phức với độ ổn định khá.",
      "Đôi khi có lỗi nhỏ nhưng không ảnh hưởng đáng kể đến hiểu nghĩa.",
    ],
    pronunciation: [
      "Phát âm rõ, ít lỗi; accent không cản trở người nghe.",
      "Biết dùng trọng âm/ngữ điệu/nối âm ở mức khá tốt.",
    ],
  },
  {
    band: 6,
    fluencyCoherence: [
      "Có thể nói dài nhưng đôi lúc mất mạch do ngập ngừng, lặp hoặc tự sửa.",
      "Dùng từ nối nhưng chưa hoàn toàn tự nhiên hoặc đôi lúc chưa phù hợp.",
    ],
    lexicalResource: [
      "Từ vựng đủ cho chủ đề quen/không quen nhưng còn lỗi chọn từ.",
      "Có nỗ lực paraphrase nhưng chưa tự nhiên.",
    ],
    grammaticalRangeAccuracy: [
      "Dùng được một số cấu trúc phức nhưng phạm vi chưa thật đa dạng.",
      "Lỗi ngữ pháp còn xuất hiện nhưng thường không làm mất ý chính.",
    ],
    pronunciation: [
      "Phát âm khá rõ nhưng đôi khi có lỗi gây khó hiểu cục bộ.",
      "Trọng âm/ngữ điệu có dùng nhưng chưa ổn định.",
    ],
  },
  {
    band: 5,
    fluencyCoherence: [
      "Nói ngắt quãng khá thường xuyên, mạch ý chưa đều.",
      "Khó duy trì câu trả lời dài và chuyển ý mượt.",
    ],
    lexicalResource: [
      "Từ vựng còn hạn chế, lặp từ nhiều.",
      "Paraphrase yếu, đôi lúc dùng từ sai ngữ cảnh.",
    ],
    grammaticalRangeAccuracy: [
      "Chủ yếu câu đơn; nỗ lực dùng câu phức còn hạn chế.",
      "Lỗi ngữ pháp xuất hiện thường xuyên hơn.",
    ],
    pronunciation: [
      "Một số lỗi phát âm khiến người nghe phải cố gắng hơn để hiểu.",
      "Trọng âm và ngữ điệu chưa ổn định.",
    ],
  },
  {
    band: 4,
    fluencyCoherence: [
      "Nói chậm, ngập ngừng nhiều; khó phát triển ý liên tục.",
      "Liên kết ý yếu, câu trả lời rời rạc.",
    ],
    lexicalResource: [
      "Chỉ diễn đạt được ý cơ bản với vốn từ hạn chế.",
      "Lỗi chọn từ thường xuyên, paraphrase rất ít.",
    ],
    grammaticalRangeAccuracy: [
      "Phần lớn là cấu trúc đơn giản; câu phức hiếm và dễ sai.",
      "Lỗi ngữ pháp thường xuyên gây cản trở hiểu nghĩa.",
    ],
    pronunciation: [
      "Lỗi phát âm xuất hiện nhiều, độ rõ chưa ổn định.",
      "Nhịp điệu/ngữ điệu còn gượng, làm giảm mức độ tự nhiên.",
    ],
  },
];
