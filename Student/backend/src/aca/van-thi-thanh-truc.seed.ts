/** BCB đầu vào — Văn Thị Thanh Trúc (Entrance). */

export const VAN_THI_THANH_TRUC = {
  name: 'Văn Thị Thanh Trúc',
  email: 'thankxetai0911@gmail.com',
  phone: '',
  aim: '7.0',
  /** Ngày thi dự kiến trên LMS. */
  examDate: '2026-08-27',
  /**
   * Mốc tính countdown (không dùng ngày máy).
   * 29/04/2026 → 27/08/2026 ≈ 120 ngày.
   */
  examCountdownAnchor: '2026-04-29',
};

/** Support Speaking đã chấm — Test 1 → 11. month = JS getMonth() (0–11). */
export const VAN_THI_THANH_TRUC_SUPPORT_SPEAKING: Array<{
  n: number;
  score: string;
  day: number;
  month: number;
  year: number;
}> = [
  { n: 1, score: '6.5', day: 21, month: 5, year: 2026 },
  { n: 2, score: '6.5', day: 28, month: 5, year: 2026 },
  { n: 3, score: '6.5', day: 5, month: 6, year: 2026 },
  { n: 4, score: '6.5', day: 12, month: 6, year: 2026 },
  { n: 5, score: '6.5', day: 19, month: 6, year: 2026 },
  { n: 6, score: '6.5', day: 26, month: 6, year: 2026 },
  { n: 7, score: '6.5', day: 2, month: 7, year: 2026 },
  { n: 8, score: '7.0', day: 9, month: 7, year: 2026 },
  { n: 9, score: '7.0', day: 16, month: 7, year: 2026 },
  { n: 10, score: '6.5', day: 23, month: 7, year: 2026 },
  { n: 11, score: '6.5', day: 30, month: 7, year: 2026 },
];

/** Lớp luyện đề — cột L / R / W. */
export const VAN_THI_THANH_TRUC_LUYEN_DE: Array<{
  examWeekNumber: number;
  weekRange: string;
  scoreL: string;
  scoreR: string;
  scoreW: string;
}> = [
  {
    examWeekNumber: 34,
    weekRange: '06/04/2026 - 12/04/2026',
    scoreL: '7.0',
    scoreR: '7.5',
    scoreW: '7.0',
  },
  {
    examWeekNumber: 35,
    weekRange: '13/04/2026 - 19/04/2026',
    scoreL: '7.0',
    scoreR: '8.0',
    scoreW: '',
  },
];

function errRate(correct: number, total: number): number {
  if (!total) return 0;
  return Math.round(((total - correct) / total) * 100);
}

export function vanThiThanhTrucDiagnosis() {
  return {
    studentName: VAN_THI_THANH_TRUC.name,
    studentEmail: VAN_THI_THANH_TRUC.email,
    studentPhone: VAN_THI_THANH_TRUC.phone,
    aim: VAN_THI_THANH_TRUC.aim,
    examDate: VAN_THI_THANH_TRUC.examDate,
    examCountdownAnchor: VAN_THI_THANH_TRUC.examCountdownAnchor,
    bcbOverviewTitle: 'Người dùng Khá (Competent User)',
    bcbOverviewSummary:
      'Overall 6.5. Sử dụng ngôn ngữ hiệu quả ở các kỹ năng; Listening 6.5 / Reading 7.0 vững hơn Writing 6.0 và Speaking 6.0. Cần siết Task 1 (ý chưa rõ, từ nối) và Matching Headings / Multiple Choice – Matching ở Listening.',
    scores: {
      listening: 6.5,
      reading: 7.0,
      writing: 6.0,
      speaking: 6.0,
      overall: 6.5,
    },
    listeningCorrect: 29,
    readingCorrect: 30,
    skillSummaries: {
      listening:
        'Tại trình độ này, bạn có thể hiểu được phần lớn từ vựng trong một số chủ đề nhất định, bao gồm các thuật ngữ học thuật trong tiếng Anh. Bạn có thể hiểu được thông tin, thái độ, ý kiến, mục đích của người nói khi chúng được đề cập trực tiếp. Bên cạnh đó, bạn cũng có thể hiểu được ý kiến tán thành, không tán thành giữa nhiều người nói khác nhau trong các chủ đề tổng quát và chủ đề học thuật. Người nghe ở trình độ này có thể hiểu được bài nói mà không cần phải nghe từng chữ, câu và có thể nhớ được nội dung bài nói (như các đối tượng được đề cập trong bài, ý kiến, thông tin).',
      reading:
        'Bạn có thể giải quyết một loạt các văn bản học thuật và bài viết nêu quan điểm cá nhân tương đối phức tạp và dày đặc thông tin. Bạn có sự hiểu biết tốt về từ vựng, cả trong và qua các câu, về các chủ đề chung và một số chủ đề chuyên ngành. Bằng cách sử dụng chiến thuật làm bài như đọc lướt và quét, tổng hợp thông tin và rút ra suy luận, bạn có thể hiểu lập luận và phân biệt giữa ý chính và chi tiết hỗ trợ, đồng thời hiểu rõ các thái độ, quan điểm và hàm ý.',
      speaking:
        'Ở trình độ này, bạn thường có thể nói dài dòng, mặc dù đôi khi kém rõ ràng hoặc kém trôi chảy hơn vì lặp lại, tự sửa sai hoặc do dự khi tìm kiếm từ hoặc ngữ pháp. Bài nói thường được tổ chức tốt và các ý tưởng thường được liên kết tốt, nhưng có một số lỗi. Bạn có đủ vốn từ vựng để thảo luận các chủ đề rõ ràng và dài, mặc dù thường có sai sót và bạn thường có thể diễn đạt tốt. Bạn có thể sử dụng các cấu trúc ngữ pháp đơn giản và phức tạp nhưng với phạm vi bị giới hạn. Có thể có lỗi ngữ pháp thường xuyên, đặc biệt là trong các cấu trúc phức tạp hơn, nhưng ngôn ngữ thường dễ hiểu. Phát âm có thể rõ ràng và hiệu quả, nhưng có thể có một chút vấn đề. Phát âm thường dễ hiểu, mặc dù đôi khi từ ngữ có thể không rõ ràng.',
    },
    writingCriteria: {
      task1: {
        taskAchievement: 4,
        coherenceCohesion: 5,
        lexicalResource: 5,
        grammaticalRange: 6,
      },
      task2: {
        taskResponse: 7,
        coherenceCohesion: 7,
        lexicalResource: 6,
        grammaticalRange: 7,
      },
    },
    writingSummary: {
      task1:
        'Bạn trả lời được tất cả các yêu cầu / đặc điểm chính trong đề bài, nhưng một vài yêu cầu / đặc điểm chính được trả lời / tả kĩ hơn các phần còn lại. Đa số các ý trong bài của bạn thuộc về đúng với đề tài / yêu cầu. Tuy nhiên, bạn còn tả sai một vài thông tin hoặc tả một vài ý không liên quan đến đề bài. Bạn có đưa ra được quan điểm cá nhân (Point of View / Position), nhưng kết luận còn thiếu rõ ràng, thiếu câu chốt hoặc chốt chưa rõ ý. Bài Task 1 có đoạn tả thông tin khái quát (Overview). Nhìn chung, trình tự các ý trong bài viết được sắp xếp khá hợp lý từ đầu đến cuối. Bạn cũng dùng được một số từ nối đúng cách, nhưng số còn lại còn chưa chính xác. Bạn biết cách chia đoạn, nhưng đôi khi còn chưa hợp lý. Vốn từ vựng của mình đủ để viết cả bài, và dùng được một số từ hơi nâng cao. Điểm yếu phần từ vựng của bạn là bạn còn đánh vần sai từ, nhưng những lỗi này không gây khó khăn cho người đọc trong việc đọc hiểu. Về mặt ngữ pháp, bạn có dùng được câu đơn (Simple Sentence) và câu phức tạp (Complex Sentence) trong bài, dù mắc lỗi ngữ pháp và lỗi dùng dấu câu (Punctuation). Đa số các lỗi ngữ pháp này không gây khó khăn cho người đọc. Task 1 band 5.0: đúng yêu cầu đề và đủ ý chính nhưng ý tả chưa rõ / lặp / sai thông tin. Format phù hợp, Overview rõ. Tổ chức bài hiểu được logic nhưng thừa/thiếu từ nối, ít reference/substitution. Từ vựng vừa đủ, lặp khá nhiều; ngữ pháp có câu phức dù còn sai punctuation.',
      task2:
        'Task 2 band 6.5. Thỏa mãn yêu cầu đề, viết đủ ý; ý triển khai đủ nhưng luận điểm đôi khi chưa rõ / luận cứ chung chung. Format phù hợp, có quan điểm và câu chốt rõ. Tổ chức mạch lạc, từ nối khá đúng và đa dạng. Từ vựng có từ khó nhưng còn lặp và chưa tự nhiên. Ngữ pháp nhiều cấu trúc, dùng khá điêu luyện, đôi khi còn sai.',
    },
    writingLinks: { task1: '', task2: '' },
    speakingCriteria: {
      fluencyCoherence: 6,
      lexicalResource: 6,
      grammaticalRangeAccuracy: 6,
      pronunciation: 6,
    },
    bcbListening: [
      {
        id: 'dl-ac',
        title: 'Form, Note, Flow-chart, Table, Summary, Sentence Completion',
        tag: 'DL_AC_00_001',
        correct: 18,
        total: 24,
        errorRate: errRate(18, 24),
        flagged: false,
        diagnosis:
          'Sai nhiều câu thuộc dạng bài Form, Note, Flow-chart, Table, Summary Completion. Chưa quen đọc thông tin trong bảng (Table) hoặc lưu đồ (Flow Chart), dẫn đến việc lúng túng hoặc điền sai câu trả lời.',
      },
      {
        id: 'dl-ls',
        title: 'List Selection',
        tag: 'DL_LS_00_001',
        correct: 5,
        total: 6,
        errorRate: errRate(5, 6),
        flagged: false,
        diagnosis:
          'Sai nhiều câu thuộc dạng bài List Selection. Sai dây chuyền do không làm từng câu hỏi mà chỉ áp dụng phương pháp loại trừ đáp án.',
      },
      {
        id: 'dl-ad',
        title: 'Plan, Map, Diagram Labelling',
        tag: 'DL_AD_00_001',
        correct: 0,
        total: 0,
        errorRate: 0,
        flagged: false,
        diagnosis:
          'Sai nhiều câu thuộc dạng bài Plan, Map, Diagram Labelling. Chưa hiểu được mối liên kết giữa ngôn ngữ và dữ kiện hình ảnh (bài nói mô tả một bản đồ của địa danh, etc.). Chưa hiểu được hoặc theo kịp ngôn ngữ chỉ phương hướng (đi thẳng, rẽ trái, ở phía đối diện, etc.). Thiếu từ vựng chỉ phương hướng hoặc chưa sử dụng thành thạo.',
      },
      {
        id: 'dl-mc',
        title: 'Multiple Choice',
        tag: 'DL_MC_00_001',
        correct: 4,
        total: 6,
        errorRate: errRate(4, 6),
        flagged: true,
        diagnosis: 'Sai nhiều câu thuộc dạng bài Multiple Choice.',
      },
      {
        id: 'dl-am',
        title: 'Matching',
        tag: 'DL_AM_00_001',
        correct: 2,
        total: 4,
        errorRate: errRate(2, 4),
        flagged: true,
        diagnosis:
          'Sai nhiều câu thuộc dạng bài Matching. Sai dây chuyền do không làm từng câu hỏi mà chỉ áp dụng phương pháp loại trừ đáp án.',
      },
      {
        id: 'dl-sq',
        title: 'Short-answer questions',
        tag: 'DL_SQ_00_001',
        correct: 0,
        total: 0,
        errorRate: 0,
        flagged: false,
        diagnosis:
          'Sai nhiều câu thuộc dạng bài Short-answer questions. Hiểu sai hoặc chưa hiểu câu hỏi do không quen với ngữ pháp câu hỏi (Câu hỏi bắt đầu bằng Wh-, How, Auxiliary Verb, etc.).',
      },
    ],
    bcbReading: [
      {
        id: 'dr-mf',
        title: 'Matching Features',
        tag: 'DR_MF_00_001',
        correct: 5,
        total: 5,
        errorRate: 0,
        flagged: false,
        diagnosis:
          'Sai nhiều câu thuộc dạng bài Matching Features. Không tìm được dữ kiện để trả lời câu hỏi. Có thể do bỏ lỡ các tên riêng/các thông tin liên quan đến tên riêng trong bài hoặc không nhận biết được các đại từ nhân xưng được dùng để nhắc đến đối tượng nào. Lẫn lộn dữ kiện để trả lời câu hỏi, dẫn đến trả lời sai. Do nhận biết sai các đại từ nhân xưng được dùng để nhắc đến đối tượng nào.',
      },
      {
        id: 'dr-mh',
        title: 'Matching Headings',
        tag: 'DR_MH_00_001',
        correct: 2,
        total: 6,
        errorRate: errRate(2, 6),
        flagged: true,
        diagnosis:
          'Sai nhiều câu thuộc dạng bài Matching Headings. Không nắm / tóm tắt được ý chính mà đoạn văn đang muốn nói đến. Không hiểu ý nghĩa của Heading mà đề đưa ra.',
      },
      {
        id: 'dr-mi',
        title: 'Matching (Paragraph) Information',
        tag: 'DR_MI_00_001',
        correct: 0,
        total: 0,
        errorRate: 0,
        flagged: false,
        diagnosis: 'Sai nhiều câu thuộc dạng bài Matching (Paragraph) Information.',
      },
      {
        id: 'dr-ac',
        title: 'Summary, Note, Table, Flow Chart, Sentence Completion',
        tag: 'DR_AC_00_001',
        correct: 11,
        total: 11,
        errorRate: 0,
        flagged: false,
        diagnosis:
          'Sai nhiều câu thuộc dạng bài Summary, Note, Table, Flow Chart, Sentence Completion. Chưa quen đọc thông tin trong bảng (Table) hoặc lưu đồ (Flow Chart), dẫn đến việc lúng túng hoặc điền sai câu trả lời.',
      },
      {
        id: 'dr-dl',
        title: 'Diagram Label Completion',
        tag: 'DR_DL_00_001',
        correct: 0,
        total: 0,
        errorRate: 0,
        flagged: false,
        diagnosis:
          'Sai nhiều câu thuộc dạng bài Diagram Label Completion. Chưa hiểu được mối liên kết giữa ngôn ngữ và dữ kiện hình ảnh (hình minh họa, hình vẽ thiết kế, etc.).',
      },
      {
        id: 'dr-tf',
        title: 'True/False/Not Given, Yes/No/Not Given',
        tag: 'DR_TF_00_001',
        correct: 6,
        total: 11,
        errorRate: errRate(6, 11),
        flagged: false,
        diagnosis:
          'Sai nhiều câu thuộc dạng bài True/False/Not Given, Yes/No/Not Given. Nhầm lẫn giữa False/No và Not Given. Chưa biết cách phân biệt.',
      },
      {
        id: 'dr-mc',
        title: 'Multiple Choice, List Selection, Global Multiple Choice',
        tag: 'DR_MC_00_001',
        correct: 6,
        total: 7,
        errorRate: errRate(6, 7),
        flagged: false,
        diagnosis: 'Sai nhiều câu thuộc dạng bài Multiple Choice.',
      },
      {
        id: 'dr-sq',
        title: 'Short-answer Question',
        tag: 'DR_SQ_00_001',
        correct: 0,
        total: 0,
        errorRate: 0,
        flagged: false,
        diagnosis:
          'Sai nhiều câu thuộc dạng bài Short-answer Question. Hiểu sai hoặc chưa hiểu câu hỏi do không quen với ngữ pháp câu hỏi (Câu hỏi bắt đầu bằng Wh-, How, Auxiliary Verb, etc.).',
      },
    ],
    updatedAt: new Date().toISOString(),
  };
}

/** RLP Soar 246 — chặng Writing / Listening, 18 buổi. */
export const VAN_THI_THANH_TRUC_SOAR_RLP: Array<{ skill: string; contents: string }> = [
  {
    skill: 'Writing',
    contents:
      'Introduction to Writing IELTS Task 1\nIntroduction to Structure and Grammar in WT1\n- Hiểu và làm đúng yêu cầu đề\n- Học và sử dụng từ vựng thuộc dạng bài\n- Phân tích biểu đồ, lựa chọn và sắp xếp thông tin\n- Luyện tập',
  },
  {
    skill: 'Writing',
    contents:
      'Introduction to Writing IELTS Task 2\nIntroduction to Argument essay\n- Hiểu loại đề và yêu cầu đề\n- Phân tích đề\n- Chiến lược viết Introduction\n- Luyện tập viết Introduction',
  },
  {
    skill: 'Listening',
    contents:
      'Introduction to Listening IELTS (2/4/2025)\nIntroduction to Listening Completion (Section 1 + Section 4)\n- Hiểu và làm đúng yêu cầu đề\n- Chiến thuật làm bài\n- Luyện tập, áp dụng chiến thuật',
  },
  {
    skill: 'Writing',
    contents:
      'Introduction to Line Graph and Bar Chart\n- Hiểu và làm đúng yêu cầu đề\n- Học và sử dụng từ vựng thuộc dạng bài\n- Phân tích biểu đồ, lựa chọn và sắp xếp thông tin\n- Luyện tập',
  },
  {
    skill: 'Writing',
    contents:
      'Argument essay\n- Hiểu yêu cầu đề và phân tích đề\n- Sử dụng discourse marker (linking words)\n- Chiến lược viết Supporting paragraph\n- Luyện tập viết Supporting paragraph',
  },
  {
    skill: 'Listening',
    contents:
      'Introduction to Multiple choice (Section 2 + Section 3)\n- Hiểu và làm đúng yêu cầu đề\n- Chiến thuật làm bài\n- Luyện tập, áp dụng chiến thuật\n- Sửa và lưu ý cách giải quyết cho các vấn đề liên quan đến dạng Completion',
  },
  {
    skill: 'Writing',
    contents:
      'Introduction to Table and Pie Chart\n- Hiểu và làm đúng yêu cầu đề\n- Học và sử dụng từ vựng thuộc dạng bài\n- Phân tích biểu đồ, lựa chọn và sắp xếp thông tin\n- Luyện tập',
  },
  {
    skill: 'Writing',
    contents:
      'Argument essay\n- Hiểu yêu cầu đề và phân tích đề\n- Chiến lược viết Conclusion\n- Chiến lược đảm bảo Coherence và Cohesion\n- Luyện tập viết Conclusion và tổ chức bài',
  },
  {
    skill: 'Listening',
    contents:
      'Introduction to List selection (Multiple choice: many answers) (section 2 + section 3)\n- Hiểu và làm đúng yêu cầu đề\n- Chiến thuật làm bài\n- Luyện tập, áp dụng chiến thuật',
  },
  {
    skill: 'Writing',
    contents:
      'Introduction to Process (Natural Process và Man-made Process)\n- Hiểu và làm đúng yêu cầu đề\n- Học và sử dụng từ vựng thuộc dạng bài\n- Phân tích biểu đồ, lựa chọn và sắp xếp thông tin\n- Luyện tập',
  },
  {
    skill: 'Writing',
    contents:
      'Introduction to Discuss essay\n- Hiểu loại đề và yêu cầu đề\n- Phân tích đề\n- Chiến lược viết Introduction\n- Luyện tập viết Introduction',
  },
  {
    skill: 'Listening',
    contents:
      'Introduction to Labeling Plan, Map, Diagram (Section 2)\n- Hiểu và làm đúng yêu cầu đề\n- Chiến thuật làm bài\n- Luyện tập, áp dụng chiến thuật',
  },
  {
    skill: 'Writing',
    contents:
      'Introduction to Map\n(Compare 1 map with changes through time,\nCompare 2 maps with no changes through time)\n- Hiểu và làm đúng yêu cầu đề\n- Học và sử dụng từ vựng thuộc dạng bài\n- Phân tích biểu đồ, lựa chọn và sắp xếp thông tin\n- Luyện tập',
  },
  {
    skill: 'Writing',
    contents:
      'Discussion essay\n- Hiểu yêu cầu đề và phân tích đề\n- Sử dụng discourse marker (linking words)\n- Chiến lược viết Supporting paragraph\n- Luyện tập viết Supporting paragraph',
  },
  {
    skill: 'Listening',
    contents:
      'Introduction to Matching (section 2 + section 3)\n- Hiểu và làm đúng yêu cầu đề\n- Chiến thuật làm bài\n- Luyện tập, áp dụng chiến thuật',
  },
  {
    skill: 'Writing',
    contents:
      'Discussion essay\n- Hiểu yêu cầu đề và phân tích đề\n- Chiến lược viết Conclusion\n- Chiến lược đảm bảo Coherence và Cohesion\n- Luyện tập viết Conclusion và tổ chức bài',
  },
  {
    skill: 'Writing',
    contents:
      'Ôn tập và kiểm tra\n- Ôn tập các kiến thức và chiến thuật làm các dạng bài\n- Kiểm tra với mock test và sửa bài\n- Lưu ý về các vấn đề phát sinh, định hướng tự luyện tập',
  },
  {
    skill: 'Listening',
    contents:
      'Ôn tập và kiểm tra\n- Ôn tập các kiến thức và chiến thuật làm các dạng bài\n- Kiểm tra với mock test và sửa bài\n- Lưu ý về các vấn đề phát sinh, định hướng tự luyện tập',
  },
];
