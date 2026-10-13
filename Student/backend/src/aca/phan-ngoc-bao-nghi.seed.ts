/** BCB đầu vào + Lớp Online 1:1 — Phan Ngọc Bảo Nghi. */

export const PHAN_NGOC_BAO_NGHI = {
  name: 'Phan Ngọc Bảo Nghi',
  email: 'bnghi0206@gmail.com',
  phone: '0968700681',
  dob: '',
  zodiac: 'Capricorn',
  aim: '6.5',
  examDate: '14/11/2026',
  examCountdownAnchor: '2026-10-13',
  teacher: 'Nguyễn Thị Hoàng Sa',
  schedule: 'Online 1:1 · 2 hours/session · 3 sessions/week (6 weeks)',
  className: 'Online 1:1 Phan Ngọc Bảo Nghi',
  classCode: 'ONL11_BAONGHI',
  startDate: '13/10/2026',
  endDate: '14/11/2026',
};

function errRate(correct: number, total: number): number {
  if (!total) return 0;
  return Math.round(((total - correct) / total) * 100);
}

export function phanNgocBaoNghiDiagnosis() {
  return {
    studentName: PHAN_NGOC_BAO_NGHI.name,
    studentEmail: PHAN_NGOC_BAO_NGHI.email,
    studentPhone: PHAN_NGOC_BAO_NGHI.phone,
    aim: PHAN_NGOC_BAO_NGHI.aim,
    examDate: PHAN_NGOC_BAO_NGHI.examDate,
    examCountdownAnchor: PHAN_NGOC_BAO_NGHI.examCountdownAnchor,
    bcbOverviewTitle: 'Người dùng Giới hạn (Limited User)',
    bcbOverviewSummary:
      'Overall 4.5 (Listening 4.5, Reading 4.0, Writing 4.0, Speaking 4.5) · Target: 6.5. Năng lực sử dụng ngôn ngữ còn hạn chế, chỉ vận dụng được ở các tình huống quen thuộc và thường gặp khó khăn trong việc hiểu và diễn đạt các cấu trúc phức tạp. Cần tổng lực bồi đắp ngữ pháp câu phức (cả Writing & Speaking), mở rộng vốn từ vựng học thuật, rèn luyện kỹ năng định vị thông tin Reading và nghe bắt ý chính Listening để bứt phá lên mục tiêu 6.5.',
    scores: {
      listening: 4.5,
      reading: 4.0,
      writing: 4.0,
      speaking: 4.5,
      overall: 4.5,
    },
    listeningCorrect: 13,
    readingCorrect: 12,
    skillSummaries: {
      listening:
        'Ở band điểm này, bạn có thể hiểu được từ vựng ở các chủ đề quen thuộc. Đối với các chủ đề không quen thuộc, bạn chỉ có thể xử lý được thông tin ở các bài nói ngắn, tuy nhiên, các bạn cần phải rất tập trung mới có thể hiểu được từ vựng, ngữ pháp của bài nói, đồng thời, các bạn sẽ khó khăn để hiểu được ý nghĩa tổng quát của bài. Người nghe ở mức điểm này có thể dựa vào tông giọng của người nói (tích cực, tiêu cực) và cách nhấn nhá để hiểu được ý chính của bài.',
      reading:
        'Khả năng xử lý các văn bản học thuật và bài viết nêu quan điểm cá nhân của bạn còn hạn chế. Bạn có thể hiểu được từ vựng, ở trong và qua các câu, về các chủ đề chung. Đôi khi, bạn có thể sử dụng chiến thuật làm bài, bao gồm đọc nhanh và đọc kĩ. Bạn xác định được vị trí thông tin và hiểu các ý tưởng chính. Bạn cũng có thể hiểu các quan điểm được trình bày và lập luận đơn giản.',
      speaking:
        'Bạn thường nói với những khoảng dừng đáng kể. Bài nói có thể chậm và có thể có sự lặp lại thường xuyên hoặc tự sửa lỗi. Có sự liên kết cơ bản về mặt ý tưởng nhưng đôi khi các ý tưởng có thể khó theo dõi hoặc hiểu được. Bạn có đủ vốn từ vựng để nói về các chủ đề quen thuộc, nhưng rất hay mắc lỗi, và chỉ có thể trả lời đơn giản về các chủ đề không quen thuộc. Bạn hiếm khi cố gắng sử dụng cách diễn đạt lại ý thưởng bằng lời văn của riêng mình (paraphrase). Bạn có thể sử dụng các cấu trúc ngữ pháp cơ bản và những cấu trúc này đôi khi chính xác, nhưng việc áp dụng các cấu trúc ngữ pháp phức tạp là rất hiếm. Lỗi ngữ pháp thường xuyên có thể gây ra hiểu lầm. Có rất nhiều vấn đề với phát âm. Các từ thường phát âm sai và điều này gây khó khăn cho người nghe.',
    },
    writingCriteria: {
      task1: {
        taskAchievement: 4,
        coherenceCohesion: 4,
        lexicalResource: 4,
        grammaticalRange: 4,
      },
      task2: {
        taskResponse: 5,
        coherenceCohesion: 5,
        lexicalResource: 5,
        grammaticalRange: 4,
      },
    },
    writingSummary: {
      task1:
        'Task 1 (Band 4.0): Đáp ứng đúng yêu cầu đề cơ bản (4+) nhưng chưa tả hết các ý chính (4). Ý diễn đạt chưa rõ, lặp ý hoặc sai lệch thông tin nhiều (4). Format bài viết chưa phù hợp (4) và thiếu hẳn Overview khái quát (5). Tổ chức bài thiếu logic, cách chia đoạn chưa hợp lý (5). Rất ít từ nối, hay lặp hoặc đa số dùng từ nối sai (4). Vốn từ hạn chế, chỉ dùng từ cơ bản, lặp từ nhiều, hay sai chính tả và dùng từ sai (4). Câu đơn chiếm đa số, phần lớn bài viết sai ngữ pháp và punctuation gây khó khăn cho người đọc (4).',
      task2:
        'Task 2 (Band 4.5): Thỏa mãn một phần yêu cầu đề bài (5), viết đủ ý nhưng chưa trọn vẹn (5). Đa số ý có trọng tâm nhưng không xuyên suốt bài viết (5), format chưa phù hợp ở một số chỗ (5). Có câu giới thiệu và quan điểm nhưng không được diễn giải hoặc thiếu câu chốt quan điểm (5). Người đọc phải đọc lại để hiểu logic bài (5). Thừa/thiếu từ nối, còn sai khá nhiều, lặp từ vựng do thiếu referencing/substitution (5). Vốn từ vựng vừa đủ, lặp từ khá nhiều dù người đọc vẫn hiểu được ý (5). Câu đơn chiếm đa số, hiếm khi dùng mệnh đề phụ, phần lớn bài viết mắc lỗi ngữ pháp và dấu câu (4).',
    },
    writingLinks: { task1: '', task2: '' },
    speakingCriteria: {
      fluencyCoherence: 5,
      lexicalResource: 4,
      grammaticalRangeAccuracy: 4,
      pronunciation: 5,
    },
    bcbListening: [
      {
        id: 'dl-ac',
        title: 'Form, Note, Flow-chart, Table, Summary, Sentence Completion',
        tag: 'DL_AC_00_001',
        correct: 6,
        total: 24,
        errorRate: errRate(6, 24),
        flagged: true,
        diagnosis:
          'Sai nhiều câu thuộc dạng bài Form, Note, Flow-chart, Table, Summary Completion. Chưa quen đọc thông tin trong bảng (Table) hoặc lưu đồ (Flow Chart), dẫn đến việc lúng túng hoặc điền sai câu trả lời.',
      },
      {
        id: 'dl-ls',
        title: 'List Selection',
        tag: 'DL_LS_00_001',
        correct: 2,
        total: 6,
        errorRate: errRate(2, 6),
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
        diagnosis: '',
      },
      {
        id: 'dl-mc',
        title: 'Multiple Choice',
        tag: 'DL_MC_00_001',
        correct: 2,
        total: 6,
        errorRate: errRate(2, 6),
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
        diagnosis: '',
      },
      {
        id: 'dl-sq',
        title: 'Short-answer questions',
        tag: 'DL_SQ_00_001',
        correct: 0,
        total: 0,
        errorRate: 0,
        flagged: false,
        diagnosis: '',
      },
    ],
    bcbReading: [
      {
        id: 'dr-mf',
        title: 'Matching Features',
        tag: 'DR_MF_00_001',
        correct: 2,
        total: 5,
        errorRate: errRate(2, 5),
        flagged: true,
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
        diagnosis: '',
      },
      {
        id: 'dr-ac',
        title: 'Summary, Note, Table, Flow Chart, Sentence Completion',
        tag: 'DR_AC_00_001',
        correct: 3,
        total: 11,
        errorRate: errRate(3, 11),
        flagged: true,
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
        diagnosis: '',
      },
      {
        id: 'dr-tf',
        title: 'True/False/Not Given, Yes/No/Not Given',
        tag: 'DR_TF_00_001',
        correct: 4,
        total: 11,
        errorRate: errRate(4, 11),
        flagged: true,
        diagnosis:
          'Sai nhiều câu thuộc dạng bài True/False/Not Given, Yes/No/Not Given. Nhầm lẫn giữa False/No và Not Given. Chưa biết cách phân biệt.',
      },
      {
        id: 'dr-mc',
        title: 'Multiple Choice, List Selection, Global Multiple Choice',
        tag: 'DR_MC_00_001',
        correct: 1,
        total: 7,
        errorRate: errRate(1, 7),
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
        diagnosis: '',
      },
    ],
    rubricDetails: {
      writing: {
        task1: [
          { code: 'DW_TA_RF_104', criterion: 'Task Achievement', sub: 'Requirements', score: '4+', desc: 'Đúng yêu cầu đề bài.' },
          { code: 'DW_TA_NF_104', criterion: 'Task Achievement', sub: 'Number of Features', score: '4', desc: 'Chưa tả hết các ý chính.' },
          { code: 'DW_TA_DF_104', criterion: 'Task Achievement', sub: 'Quality of Features', score: '4', desc: 'Ý được tả không rõ. | Hoặc lặp ý nhiều. | Hoặc sai thông tin nhiều.' },
          { code: 'DW_TA_WF_104', criterion: 'Task Achievement', sub: 'Format', score: '4', desc: 'Format không phù hợp.' },
          { code: 'DW_TA_OV_105', criterion: 'Task Achievement', sub: 'Overview', score: '5', desc: 'Không có Overview. | Hoặc Overview không rõ.' },
          { code: 'DW_CC_OF_105', criterion: 'Coherence & Cohesion', sub: 'Organization', score: '5', desc: 'Thiếu logic hoặc phát triển ý | Hoặc các đoạn chưa hợp lý, không thấy được chủ ý (Theme) mỗi đoạn.' },
          { code: 'DW_CC_CD_104', criterion: 'Coherence & Cohesion', sub: 'Cohesive Devices', score: '4', desc: 'Rất ít từ nối. Hay lặp từ nối. | Hoặc đa số từ nối sai.' },
          { code: 'DW_LR_RV_104', criterion: 'Lexical Resources', sub: 'Range & Variety', score: '4', desc: 'Chỉ dùng từ vựng cơ bản, không đủ thể hiện ý. | Lặp từ rất nhiều.' },
          { code: 'DW_LR_AV_104', criterion: 'Lexical Resources', sub: 'Accuracy', score: '4', desc: 'Hiểu được nhưng rất khó. | Hay sai chính tả, chọn từ sai.' },
          { code: 'DW_GR_RG_104', criterion: 'Grammar', sub: 'Range & Complexity', score: '4', desc: 'Câu đơn chiếm đa số. Không hoặc hiếm khi kết hợp vế bổ trợ (Subordinate Clause).' },
          { code: 'DW_GR_AG_104', criterion: 'Grammar', sub: 'Accuracy', score: '4', desc: 'Hiểu được nhưng rất khó. | Phần lớn bài viết sai ngữ pháp, punctuation.' },
        ],
        task2: [
          { code: 'DW_TR_RF_205', criterion: 'Task Response', sub: 'Requirements', score: '5', desc: 'Thỏa mãn một phần yêu cầu đề.' },
          { code: 'DW_TR_NF_205', criterion: 'Task Response', sub: 'Number of Features', score: '5', desc: 'Viết đủ ý nhưng chưa trọn vẹn.' },
          { code: 'DW_TR_DF_205', criterion: 'Task Response', sub: 'Quality of Features', score: '5', desc: 'Đa số ý có trọng tâm nhưng không xuyên suốt.' },
          { code: 'DW_TR_WF_205', criterion: 'Task Response', sub: 'Format', score: '5', desc: 'Format chưa phù hợp ở một số chỗ.' },
          { code: 'DW_TR_PO_205', criterion: 'Task Response', sub: 'Position', score: '5', desc: 'Có quan điểm, câu giới thiệu rõ. | Nhưng quan điểm không được diễn giải. | Hoặc không chốt quan điểm.' },
          { code: 'DW_CC_OF_205', criterion: 'Coherence & Cohesion', sub: 'Organization', score: '5', desc: 'Phải đọc lại 1 lần để cố hiểu logic bài. | Hoặc các đoạn chưa hợp lý, không thấy được chủ ý (Theme) mỗi đoạn.' },
          { code: 'DW_CC_CD_205', criterion: 'Coherence & Cohesion', sub: 'Cohesive Devices', score: '5', desc: 'Hoặc thừa / thiếu từ nối. Nhiều từ nối sai. | Không reference và substitute. Lặp từ vựng khi muốn nhắc lại.' },
          { code: 'DW_LR_RV_205', criterion: 'Lexical Resources', sub: 'Range & Variety', score: '5', desc: 'Dùng ít từ vựng, vừa đủ để thể hiện ý | Lặp từ khá nhiều.' },
          { code: 'DW_LR_AV_206', criterion: 'Lexical Resources', sub: 'Accuracy', score: '6', desc: 'Luôn hiểu được ý. Nhưng nhiều từ không tự nhiên / phù hợp | Còn sai chính tả, chọn từ sai.' },
          { code: 'DW_GR_RG_204', criterion: 'Grammar', sub: 'Range & Complexity', score: '4', desc: 'Câu đơn chiếm đa số. Không hoặc hiếm khi kết hợp vế bổ trợ (Subordinate Clause).' },
          { code: 'DW_GR_AG_204', criterion: 'Grammar', sub: 'Accuracy', score: '4', desc: 'Hiểu được nhưng rất khó. | Phần lớn bài viết sai ngữ pháp, punctuation.' },
        ],
      },
      speaking: [
        { code: 'DS_FC_FL_005', criterion: 'Fluency & Coherence', sub: 'Fluency', score: '5', desc: 'Với ý đơn giản: trả lời khá lưu loát. | Với ý lạ, khó: luôn nói chậm, nhiều khoảng lặng, vấp hoặc quay lại sửa lỗi. Thường có thể duy trì bài nói, nhưng bằng cách tự lặp lại hoặc nói chậm' },
        { code: 'DS_FC_CD_005', criterion: 'Fluency & Coherence', sub: 'Connectives & Discourse Markers', score: '5', desc: 'Lạm dụng từ nối' },
        { code: 'DS_LE_AC_004', criterion: 'Lexical Resource', sub: 'Accuracy & Appropriateness', score: '4', desc: 'Hiểu được nhưng rất khó. | Hay chọn từ sai.' },
        { code: 'DS_LE_RF_004', criterion: 'Lexical Resource', sub: 'Range & Flexibility', score: '4', desc: 'Tả được ý cơ bản. Khó tả ý không quen. | Không hoặc rất ít paraphrase.' },
        { code: 'DS_GR_CO_004', criterion: 'Grammar', sub: 'Complexity', score: '4', desc: 'Dùng đa số câu đơn. Không hoặc hiếm khi kết hợp vế bổ trợ (Subordinate Clause).' },
        { code: 'DS_GR_EF_004', criterion: 'Grammar', sub: 'Error Frequency', score: '4', desc: 'Hiểu được nhưng rất khó. | Phần lớn bài nói sai ngữ pháp.' },
        { code: 'DS_PR_IN_005', criterion: 'Pronunciation', sub: 'Intelligibility & Features', score: '5', desc: 'Giữa 4 và 6.' },
      ],
    },
    updatedAt: new Date().toISOString(),
  };
}
