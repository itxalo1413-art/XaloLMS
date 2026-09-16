/** BCB đầu vào + lớp ONL 1:1 — Thiều Thảo Chi. */

export const THIEU_THAO_CHI = {
  name: 'Thiều Thảo Chi',
  email: 'tchithieu@gmail.com',
  phone: '0934608009',
  dob: '2009-07-08',
  zodiac: 'Leo',
  aim: '7.0',
  teacher: 'Nguyễn Văn Đăng Duy',
  /** Mock test Speaking — T3 & T5 17h30 */
  supportSpeakingMeet: 'https://meet.google.com/hdk-qacp-jbe',
  supportSpeakingExamTime: '17:30',
};

/**
 * Support Speaking đã chấm — month = JS getMonth() (0–11).
 * Bỏ dòng “Tổng hợp VOCAB…” (không phải ca test).
 */
export const THIEU_THAO_CHI_SUPPORT_SPEAKING: Array<{
  n: number;
  label: string;
  score: string;
  day: number;
  month: number;
  year: number;
}> = [
  { n: 1, label: 'Speaking Support Test 1', score: '5.5', day: 5, month: 4, year: 2026 },
  { n: 2, label: 'Speaking Practice Test 2', score: '5.5-6.0', day: 7, month: 4, year: 2026 },
  { n: 3, label: 'Speaking Support Test 3', score: '5.5-6.0', day: 12, month: 4, year: 2026 },
  { n: 4, label: 'Speaking Support Test 4', score: '6.0', day: 14, month: 4, year: 2026 },
  { n: 5, label: 'Speaking Support Test 5', score: '6.0', day: 21, month: 4, year: 2026 },
  { n: 6, label: 'Speaking Support Test 6', score: '6.0', day: 26, month: 4, year: 2026 },
  { n: 7, label: 'Speaking Support Test 7', score: '6.0', day: 28, month: 4, year: 2026 },
  {
    n: 8,
    label: 'Speaking Support Test - Q2/2026 - Test 1',
    score: '6.0-6.5',
    day: 2,
    month: 5,
    year: 2026,
  },
  {
    n: 9,
    label: 'Speaking Support Test - Q2/2026 - Test 2',
    score: '6.0',
    day: 4,
    month: 5,
    year: 2026,
  },
  {
    n: 10,
    label: 'Speaking Support Test - Q2/2026 - Test 3',
    score: '6.0-6.5',
    day: 9,
    month: 5,
    year: 2026,
  },
  {
    n: 11,
    label: 'Speaking Support Test - Q2/2026 - Test 4',
    score: '6.0-6.5',
    day: 18,
    month: 5,
    year: 2026,
  },
  {
    n: 12,
    label: 'Speaking Support Test - Q2/2026 - Test 5',
    score: '6.0-6.5',
    day: 19,
    month: 5,
    year: 2026,
  },
  {
    n: 13,
    label: 'Speaking Support Test - Q2/2026 - Test 6',
    score: '6.5',
    day: 23,
    month: 5,
    year: 2026,
  },
  {
    n: 14,
    label: 'Speaking Support Test - Q2/2026 - Test 7',
    score: '6.5',
    day: 25,
    month: 5,
    year: 2026,
  },
  {
    n: 15,
    label: 'Speaking Support Test - Q2/2026 - Test 8',
    score: '6.0',
    day: 30,
    month: 5,
    year: 2026,
  },
];

function errRate(correct: number, total: number): number {
  if (!total) return 0;
  return Math.round(((total - correct) / total) * 100);
}

export function thieuThaoChiDiagnosis() {
  return {
    studentName: THIEU_THAO_CHI.name,
    studentEmail: THIEU_THAO_CHI.email,
    studentPhone: THIEU_THAO_CHI.phone,
    aim: THIEU_THAO_CHI.aim,
    examDate: '',
    bcbOverviewTitle: 'Người dùng khá (Competent User)',
    bcbOverviewSummary:
      'Overall 6.0 · Aim 7.0. Bạn sử dụng ngôn ngữ tương đối hiệu quả, mặc dù vẫn còn những lỗi, dùng từ chưa phù hợp và có thể hiểu nhầm. Bạn có thể sử dụng và hiểu ngôn ngữ phức tạp ở mức độ nhất định, đặc biệt trong các tình huống quen thuộc. Reading 7.0 vững hơn Listening / Writing 6.0; Speaking 5.0 cần siết Fluency, Grammar và Pronunciation.',
    scores: {
      listening: 6.0,
      reading: 7.0,
      writing: 6.0,
      speaking: 5.0,
      overall: 6.0,
    },
    listeningCorrect: 26,
    readingCorrect: 31,
    skillSummaries: {
      listening:
        'Tại trình độ này, bạn có thể hiểu được phần lớn từ vựng trong một số chủ đề nhất định, bao gồm các thuật ngữ học thuật trong tiếng Anh. Bạn có thể hiểu được thông tin, thái độ, ý kiến, mục đích của người nói khi chúng được đề cập trực tiếp. Bên cạnh đó, bạn cũng có thể hiểu được ý kiến tán thành, không tán thành giữa nhiều người nói khác nhau trong các chủ đề tổng quát và chủ đề học thuật. Người nghe ở trình độ này có thể hiểu được bài nói mà không cần phải nghe từng chữ, câu và có thể nhớ được nội dung bài nói (như các đối tượng được đề cập trong bài, ý kiến, thông tin).',
      reading:
        'Bạn có thể giải quyết một loạt các văn bản học thuật và bài viết nêu quan điểm cá nhân tương đối phức tạp và dày đặc thông tin. Bạn có sự hiểu biết tốt về từ vựng, cả trong và qua các câu, về các chủ đề chung và một số chủ đề chuyên ngành. Bằng cách sử dụng chiến thuật làm bài như đọc lướt và quét, tổng hợp thông tin và rút ra suy luận, bạn có thể hiểu lập luận và phân biệt giữa ý chính và chi tiết hỗ trợ, đồng thời hiểu rõ các thái độ, quan điểm và hàm ý.',
      speaking:
        'Ở band điểm này bạn thường có thể nói liên tục, nhưng có thể thường xuyên lặp lại, tự sửa lỗi, nói chậm hoặc do dự khi tìm kiếm từ hoặc ngữ pháp. Bài nói của bạn không phải lúc nào cũng rõ ràng và được liên kết tốt, và thường lạm dụng một số từ hoặc cụm từ liên kết nhất định. Mặc dù bạn có thể nói trôi chảy về các chủ đề đơn giản, nhưng sẽ thấy khó khăn khi gặp các chủ đề và ngôn ngữ ít quen thuộc hơn. Bạn có đủ vốn từ vựng để nói về các chủ đề quen thuộc và không quen thuộc, nhưng phạm vi có hạn. Một số lỗi hay lặp đi lặp lại và khả năng diễn giải có thể bị hạn chế. Bạn có thể sử dụng các cấu trúc ngữ pháp đơn giản và những cấu trúc này khá chính xác. Không có nhiều cấu trúc ngữ pháp phức tạp và những cấu trúc này thường có lỗi và có thể khó hiểu. Phát âm có thể rõ ràng và hiệu quả, nhưng cũng có thể có những vấn đề khiến người nghe đôi khi khó hiểu.',
    },
    writingCriteria: {
      task1: {
        taskAchievement: 6,
        coherenceCohesion: 6,
        lexicalResource: 6,
        grammaticalRange: 5,
      },
      task2: {
        taskResponse: 7,
        coherenceCohesion: 7,
        lexicalResource: 7,
        grammaticalRange: 6,
      },
    },
    writingSummary: {
      task1:
        'Task 1 band 5.5. Bạn trả lời được tất cả các yêu cầu / đặc điểm chính trong đề bài, nhưng một vài yêu cầu / đặc điểm chính được trả lời / tả kĩ hơn các phần còn lại. Đa số các ý trong bài của bạn thuộc về đúng với đề tài / yêu cầu. Tuy nhiên, bạn còn tả sai một vài thông tin hoặc tả một vài ý không liên quan đến đề bài. Bạn có đưa ra được quan điểm cá nhân (Point of View / Position), nhưng kết luận còn thiếu rõ ràng, thiếu câu chốt hoặc chốt chưa rõ ý. Bài Task 1 có đoạn tả thông tin khái quát (Overview). Nhìn chung, trình tự các ý trong bài viết được sắp xếp khá hợp lý từ đầu đến cuối. Bạn cũng dùng được một số từ nối đúng cách, nhưng số còn lại còn chưa chính xác. Bạn biết cách chia đoạn, nhưng đôi khi còn chưa hợp lý. Vốn từ vựng của mình đủ để viết cả bài, và dùng được một số từ hơi nâng cao. Điểm yếu phần từ vựng của bạn là bạn còn đánh vần sai từ, nhưng những lỗi này không gây khó khăn cho người đọc trong việc đọc hiểu. Về mặt ngữ pháp, bạn có dùng được câu đơn (Simple Sentence) và câu phức tạp (Complex Sentence) trong bài, dù mắc lỗi ngữ pháp và lỗi dùng dấu câu (Punctuation). Đa số các lỗi ngữ pháp này không gây khó khăn cho người đọc.',
      task2:
        'Task 2 band 6.5. Thỏa mãn tất cả yêu cầu đề, viết đủ ý; ý triển khai đủ nhưng luận điểm đôi khi chưa rõ / luận cứ chung chung. Format phù hợp, có quan điểm và câu chốt rõ. Tổ chức mạch lạc; từ nối khá đúng và đa dạng, đôi khi thừa/thiếu. Từ vựng phong phú, collocation khá phù hợp, đôi khi sai chính tả. Ngữ pháp có câu phức, còn sai punctuation.',
    },
    writingLinks: { task1: '', task2: '' },
    speakingCriteria: {
      fluencyCoherence: 5,
      lexicalResource: 6,
      grammaticalRangeAccuracy: 5,
      pronunciation: 5,
    },
    bcbListening: [
      {
        id: 'dl-ac',
        title: 'Form, Note, Flow-chart, Table, Summary, Sentence Completion',
        tag: 'DL_AC_00_001',
        correct: 15,
        total: 24,
        errorRate: errRate(15, 24),
        flagged: false,
        diagnosis:
          'Sai nhiều câu thuộc dạng bài Form, Note, Flow-chart, Table, Summary Completion. Chưa quen đọc thông tin trong bảng (Table) hoặc lưu đồ (Flow Chart), dẫn đến việc lúng túng hoặc điền sai câu trả lời.',
      },
      {
        id: 'dl-ls',
        title: 'List Selection',
        tag: 'DL_LS_00_001',
        correct: 3,
        total: 6,
        errorRate: errRate(3, 6),
        flagged: true,
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
        correct: 5,
        total: 6,
        errorRate: errRate(5, 6),
        flagged: true,
        diagnosis: 'Sai nhiều câu thuộc dạng bài Multiple Choice.',
      },
      {
        id: 'dl-am',
        title: 'Matching',
        tag: 'DL_AM_00_001',
        correct: 3,
        total: 4,
        errorRate: errRate(3, 4),
        flagged: false,
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
        correct: 5,
        total: 6,
        errorRate: errRate(5, 6),
        flagged: false,
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
        flagged: true,
        diagnosis:
          'Sai nhiều câu thuộc dạng bài True/False/Not Given, Yes/No/Not Given. Nhầm lẫn giữa False/No và Not Given. Chưa biết cách phân biệt.',
      },
      {
        id: 'dr-mc',
        title: 'Multiple Choice, List Selection, Global Multiple Choice',
        tag: 'DR_MC_00_001',
        correct: 4,
        total: 7,
        errorRate: errRate(4, 7),
        flagged: true,
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

/** 18 buổi ONL 1:1 — date = dd/MM/yyyy. */
export const THIEU_THAO_CHI_ONL_11_RLP: Array<{
  date: string;
  skill: string;
  contents: string;
  time: string;
}> = [
  {
    date: '02/05/2026',
    skill: 'Writing',
    time: '16:00–18:00',
    contents:
      'Writing IELTS Task 1 - STATIC\n- Hiểu và làm đúng yêu cầu đề\n- Học và sử dụng từ vựng thuộc dạng bài\n- Phân tích biểu đồ, lựa chọn và sắp xếp thông tin\n- Luyện tập',
  },
  {
    date: '06/05/2026',
    skill: 'Writing',
    time: '19:00–21:00',
    contents:
      'Writing IELTS Task 1 - DYNAMIC\n- Hiểu và làm đúng yêu cầu đề\n- Học và sử dụng từ vựng thuộc dạng bài\n- Phân tích biểu đồ, lựa chọn và sắp xếp thông tin\n- Luyện tập',
  },
  {
    date: '08/05/2026',
    skill: 'Listening',
    time: '19:00–21:00',
    contents: 'Listening Part 1&4 Practice ',
  },
  {
    date: '09/05/2026',
    skill: 'Speaking',
    time: '16:00–18:00',
    contents:
      'Speaking IELTS\nSpeaking Part 1\n- Answering strategies for Part 1\n- Identify and correct main mistakes and misunderstandings about Part 1\n- Student level diagnosis\n- Practice and apply strategies (using quarterly forecast questions)',
  },
  {
    date: '13/05/2026',
    skill: 'Speaking',
    time: '19:00–21:00',
    contents:
      'Introduction to Speaking Part 2\n- Hiểu tính chất của Part 2 và trả lời trong khung thời gian cho phép\n- Chiến thuật trả lời các câu hỏi mang tính chất miêu tả \n- Descriptive language trong Part 2 (Describe a person)\n- Luyện tập, áp dụng chiến thuật',
  },
  {
    date: '15/05/2026',
    skill: 'Listening',
    time: '19:00–21:00',
    contents: 'Listening MCQs',
  },
  {
    date: '16/05/2026',
    skill: 'Writing',
    time: '16:00–18:00',
    contents:
      'Writing IELTS Task 2\nTwo views (Opinion Essay)\n- Hiểu loại đề và yêu cầu đề\n- Chiến thuật về tổ chức structure bài\n- Tập trung vào Task response và Coherence-Cohesion (7.0+)',
  },
  {
    date: '20/05/2026',
    skill: 'Writing',
    time: '19:00–21:00',
    contents:
      'Writing IELTS Task 2\nCause-Effect and Problem-Solution\n- Hiểu loại đề và yêu cầu đề\n- Chiến thuật về tổ chức structure bài\n- Tập trung vào Task response và Coherence-Cohesion (7.0+)',
  },
  {
    date: '22/05/2026',
    skill: 'Listening',
    time: '19:00–21:00',
    contents: 'Listening Matching',
  },
  {
    date: '23/05/2026',
    skill: 'Speaking',
    time: '16:00–18:00',
    contents:
      'Speaking Part 2\n- Hiểu tính chất của Part 2 và trả lời trong khung thời gian cho phép\n- Chiến thuật trả lời các câu hỏi mang tính chất kể chuyện - Story telling trong Part 2 (Describe a situation and event)\n- Luyện tập, áp dụng chiến thuật',
  },
  {
    date: '29/05/2026',
    skill: 'Speaking',
    time: '19:00–21:00',
    contents:
      'Speaking Part 3 \n- Further Practice for Story telling Techniques\n- Mock test with Speaking Part 3 questions if possible ',
  },
  {
    date: '03/06/2026',
    skill: 'Listening',
    time: '19:00–21:00',
    contents: 'Listening Mock test',
  },
  {
    date: '05/06/2026',
    skill: 'Writing',
    time: '16:00–18:00',
    contents:
      'Writing IELTS Task 1 - Graphs with no data\nMaps\n- Hiểu và làm đúng yêu cầu đề\n- Học và sử dụng từ vựng thuộc dạng bài\n- Phân tích biểu đồ, lựa chọn và sắp xếp thông tin\n- Luyện tập',
  },
  {
    date: '06/06/2026',
    skill: 'Writing',
    time: '19:00–21:00',
    contents:
      'Writing IELTS Task 1 - Graphs with no data\nProcess and Diagram\n- Hiểu và làm đúng yêu cầu đề\n- Học và sử dụng từ vựng thuộc dạng bài\n- Phân tích biểu đồ, lựa chọn và sắp xếp thông tin\n- Luyện tập',
  },
  {
    date: '17/06/2026',
    skill: 'Speaking',
    time: '19:00–21:00',
    contents:
      'Speaking Part 3\n- Answering strategies for Part 3\n- Identify and correct main mistakes and misunderstandings about Part 3\n- Practice and apply strategies (using quarterly forecast questions)',
  },
  {
    date: '20/06/2026',
    skill: 'Writing',
    time: '16:00–18:00',
    contents:
      'Writing IELTS Task 2\nAgree-Disagree & Positive-Negative essay\n- Hiểu loại đề và yêu cầu đề\n- Chiến thuật về tổ chức structure bài\n- Tập trung vào Task response và Coherence-Cohesion (7.0+)',
  },
  {
    date: '25/06/2026',
    skill: 'Writing',
    time: '19:00–21:00',
    contents:
      'Writing IELTS Task 2\nAdvantages - Disadvantages (outweigh)\n- Hiểu loại đề và yêu cầu đề\n- Chiến thuật về tổ chức structure bài\n- Tập trung vào Task response và Coherence-Cohesion (7.0+)',
  },
  {
    date: '27/06/2026',
    skill: 'W & S',
    time: '19:00–21:00',
    contents: 'Writing Correction\nSpeaking Practice and Mock test',
  },
];
