export type BcbQuestionTypeRow = {
  id: string;
  title: string;
  tag?: string;
  /** Tỷ lệ sai 0–100 */
  errorRate: number;
  diagnosis: string;
};

export type BcbGrammarRow = {
  id: string;
  topic: string;
  errorCount: number;
  severity: "red" | "yellow" | "green";
  description: string;
  examples?: string;
};

export const WEAK_BCB_ERROR_RATE_THRESHOLD = 50;

export function isWeakBcbQuestion(row: BcbQuestionTypeRow): boolean {
  return row.errorRate > WEAK_BCB_ERROR_RATE_THRESHOLD;
}

export const GUEST_BCB_LISTENING: BcbQuestionTypeRow[] = [
  {
    id: "dl-map",
    title: "Plan, Map, Diagram Labelling",
    tag: "DL_MAP_00_001",
    errorRate: 68,
    diagnosis:
      "Chưa hiểu được hoặc theo kịp ngôn ngữ chỉ phương hướng. Thiếu từ vựng chỉ phương hướng hoặc chưa sử dụng thành thạo.",
  },
  {
    id: "dl-form",
    title: "Form, Note, Summary Completion",
    tag: "DL_FORM_00_002",
    errorRate: 55,
    diagnosis:
      "Chưa quen đọc thông tin trong bảng (Table) hoặc lưu đồ (Flow Chart), dẫn đến lúng túng hoặc điền sai.",
  },
  {
    id: "dl-mc",
    title: "Multiple Choice & Matching",
    tag: "DL_MC_00_001",
    errorRate: 62,
    diagnosis:
      "Dễ bị bẫy bởi distractors do nghe bắt từ đơn lẻ thay vì nghe hiểu toàn bộ ngữ cảnh.",
  },
  {
    id: "dl-sa",
    title: "Short-answer Questions",
    errorRate: 48,
    diagnosis:
      "Hiểu sai hoặc chưa hiểu câu hỏi do không quen cấu trúc ngữ pháp câu hỏi phức tạp.",
  },
  {
    id: "dl-sent",
    title: "Sentence Completion",
    tag: "DL_SC_00_003",
    errorRate: 35,
    diagnosis: "Nắm được ý chính nhưng còn chậm khi nghe từ ghép và giới hạn từ cho phép.",
  },
  {
    id: "dl-class",
    title: "Classification",
    tag: "DL_CL_00_004",
    errorRate: 28,
    diagnosis: "Phân loại thông tin ổn khi chủ đề quen thuộc; còn nhầm khi có nhiều nhóm tương tự.",
  },
];

export const GUEST_BCB_READING: BcbQuestionTypeRow[] = [
  {
    id: "dr-mh",
    title: "Matching Headings",
    tag: "DR_MH_00_001",
    errorRate: 65,
    diagnosis:
      "Không tóm tắt được ý chính đoạn. Dễ bị đánh lừa bởi từ khóa lặp ở câu đầu trong khi chủ đề nằm ở giữa.",
  },
  {
    id: "dr-mf",
    title: "Matching Features",
    tag: "DR_MF_00_001",
    errorRate: 58,
    diagnosis:
      "Không tìm được dữ kiện trả lời. Bỏ lỡ tên riêng hoặc không nhận biết đại từ thay thế.",
  },
  {
    id: "dr-tfng",
    title: "True / False / Not Given",
    tag: "DR_TFNG_00_002",
    errorRate: 42,
    diagnosis:
      "Phân biệt False và Not Given còn chưa vững; đôi khi suy diễn quá mức từ văn bản.",
  },
  {
    id: "dr-mc",
    title: "Multiple Choice",
    tag: "DR_MC_00_003",
    errorRate: 38,
    diagnosis: "Định vị đoạn tốt nhưng còn mắc bẫy paraphrase trong phương án gây nhiễu.",
  },
  {
    id: "dr-sum",
    title: "Summary / Note Completion",
    tag: "DR_SUM_00_004",
    errorRate: 30,
    diagnosis: "Điền từ ổn khi biết loại từ cần (danh từ/tính từ); thiếu chính tả học thuật.",
  },
  {
    id: "dr-sent",
    title: "Sentence Completion",
    tag: "DR_SENT_00_005",
    errorRate: 22,
    diagnosis: "Nắm ngữ cảnh câu tốt; ít lỗi hơn các dạng matching.",
  },
];

export const GUEST_BCB_GRAMMAR: BcbGrammarRow[] = [
  {
    id: "gr-sv",
    topic: "S-V Agreement",
    errorCount: 11,
    severity: "red",
    description: "Chủ ngữ và động từ không hòa hợp số ít/số nhiều, đặc biệt với danh từ tập hợp.",
    examples: "The number of students have increased → has increased.",
  },
  {
    id: "gr-np",
    topic: "Noun Phrase",
    errorCount: 5,
    severity: "red",
    description: "Cụm danh từ thiếu mạo từ, thứ tự tính từ hoặc số lượng không chính xác.",
    examples: "a important issue → an important issue.",
  },
  {
    id: "gr-art",
    topic: "Articles (a/an/the)",
    errorCount: 4,
    severity: "yellow",
    description: "Dùng thừa hoặc thiếu mạo từ xác định/không xác định.",
    examples: "in the university (general) → at university.",
  },
  {
    id: "gr-prep",
    topic: "Prepositions",
    errorCount: 3,
    severity: "yellow",
    description: "Giới từ cố định và collocation chưa chính xác.",
    examples: "depend of → depend on.",
  },
  {
    id: "gr-tense",
    topic: "Verb Tense",
    errorCount: 2,
    severity: "green",
    description: "Lẫn thì hiện tại hoàn thành và quá khứ đơn trong mô tả biểu đồ.",
    examples: "Sales increased last year and has peaked → peaked.",
  },
  {
    id: "gr-punct",
    topic: "Punctuation",
    errorCount: 1,
    severity: "green",
    description: "Dấu phẩy và chấm câu trong câu ghép còn chưa nhất quán.",
    examples: "However therefore, → However, therefore,",
  },
];
