import type { RlpSessionRecord } from './rlp.types';

export const CORE_UPSTREAM_MOMENTUM_SESSIONS: Array<{
  no: number;
  skill: string;
  contents: string;
  teacherNote?: string;
  stageTarget?: string;
}> = [
  // ── CHẶNG 1 (Buổi 1 - 18): WRITING & LISTENING ──
  // Giai đoạn 1: Writing & Listening Foundations (Buổi 1 - 9)
  {
    no: 1,
    skill: 'Writing',
    contents:
      'Introduction to Writing IELTS Task 1 & Structure/Grammar in WT1: Hiểu và làm đúng yêu cầu đề; Học và sử dụng từ vựng thuộc dạng bài; Phân tích biểu đồ, lựa chọn và sắp xếp thông tin; Luyện tập.',
    teacherNote:
      'WRITING & LISTENING FOUNDATIONS: Nắm vững cấu trúc 4 đoạn chuẩn WT1 và ngữ pháp mô tả dữ liệu.',
    stageTarget: 'WRITING AND LISTENING FOUNDATIONS',
  },
  {
    no: 2,
    skill: 'Writing',
    contents:
      'Introduction to Writing IELTS Task 2 & Argument essay: Hiểu loại đề và yêu cầu đề; Phân tích đề; Chiến lược viết Introduction; Luyện tập viết Introduction.',
    teacherNote:
      'Chiến lược paraphrase đề bài và viết Thesis Statement rõ ràng cho dạng Argumentative.',
    stageTarget: 'WRITING AND LISTENING FOUNDATIONS',
  },
  {
    no: 3,
    skill: 'Listening',
    contents:
      'Introduction to Listening IELTS & Listening Completion: Hiểu và làm đúng yêu cầu đề; Chiến thuật làm bài; Luyện tập, áp dụng chiến thuật.',
    teacherNote:
      'Rèn kỹ năng gạch chân từ khóa trong 30 giây chuẩn bị và nghe bắt thông tin điền từ.',
    stageTarget: 'WRITING AND LISTENING FOUNDATIONS',
  },
  {
    no: 4,
    skill: 'Writing',
    contents:
      'Introduction to Line Graph and Bar Chart: Hiểu và làm đúng yêu cầu đề; Học và sử dụng từ vựng thuộc dạng bài; Phân tích biểu đồ, lựa chọn và sắp xếp thông tin; Luyện tập.',
    teacherNote:
      'Ngôn ngữ biến thiên xu hướng thời gian (trend & rate of change) và chọn lọc key features.',
    stageTarget: 'WRITING AND LISTENING FOUNDATIONS',
  },
  {
    no: 5,
    skill: 'Writing',
    contents:
      'Argument essay: Hiểu yêu cầu đề và phân tích đề; Sử dụng discourse marker (linking words); Chiến lược viết Supporting paragraph; Luyện tập viết Supporting paragraph.',
    teacherNote:
      'Cấu trúc PEEL (Point - Explanation - Example - Link) cho từng thân bài luận.',
    stageTarget: 'WRITING AND LISTENING FOUNDATIONS',
  },
  {
    no: 6,
    skill: 'Listening',
    contents:
      'Introduction to Multiple choice: Hiểu và làm đúng yêu cầu đề; Chiến thuật làm bài; Luyện tập, áp dụng chiến thuật; Sửa và lưu ý cách giải quyết cho các vấn đề liên quan đến dạng Completion.',
    teacherNote:
      'Kỹ năng loại trừ bẫy đáp án (distractors) và nhận diện paraphrasing.',
    stageTarget: 'WRITING AND LISTENING FOUNDATIONS',
  },
  {
    no: 7,
    skill: 'Writing',
    contents:
      'Introduction to Table and Pie Chart: Hiểu và làm đúng yêu cầu đề; Học và sử dụng từ vựng thuộc dạng bài; Phân tích biểu đồ, lựa chọn và sắp xếp thông tin; Luyện tập.',
    teacherNote:
      'Ngôn ngữ so sánh hơn, so sánh nhất, tỉ lệ phần trăm và nhóm thông tin logic.',
    stageTarget: 'WRITING AND LISTENING FOUNDATIONS',
  },
  {
    no: 8,
    skill: 'Writing',
    contents:
      'Argument essay: Hiểu yêu cầu đề và phân tích đề; Chiến lược viết Conclusion; Chiến lược đảm bảo Coherence và Cohesion; Luyện tập viết Conclusion và tổ chức bài.',
    teacherNote:
      'Đảm bảo tính nhất quán giữa Introduction và Conclusion; kiểm soát liên từ nối logic.',
    stageTarget: 'WRITING AND LISTENING FOUNDATIONS',
  },
  {
    no: 9,
    skill: 'Listening',
    contents:
      'Introduction to List selection: Hiểu và làm đúng yêu cầu đề; Chiến thuật làm bài; Luyện tập, áp dụng chiến thuật.',
    teacherNote:
      'Chiến thuật chọn 2 trong 5 đáp án; bắt bẫy chuyển ý giữa các speaker.',
    stageTarget: 'WRITING AND LISTENING FOUNDATIONS',
  },
  // Giai đoạn 2: Writing & Listening Expansion (Buổi 10 - 18)
  {
    no: 10,
    skill: 'Writing',
    contents:
      'Introduction to Process (Natural Process & Man-made Process): Hiểu và làm đúng yêu cầu đề; Học và sử dụng từ vựng thuộc dạng bài; Phân tích biểu đồ, lựa chọn và sắp xếp thông tin; Luyện tập.',
    teacherNote:
      'WRITING & LISTENING EXPANSION: Thể bị động (Passive voice) và từ nối trình tự thời gian.',
    stageTarget: 'WRITING AND LISTENING EXPANSION',
  },
  {
    no: 11,
    skill: 'Writing',
    contents:
      'Introduction to Discuss essay: Hiểu loại đề và yêu cầu đề; Phân tích đề; Chiến lược viết Introduction; Luyện tập viết Introduction.',
    teacherNote:
      'Phân biệt rõ Discussion Essay vs Argument Essay; thể hiện quan điểm khách quan.',
    stageTarget: 'WRITING AND LISTENING EXPANSION',
  },
  {
    no: 12,
    skill: 'Listening',
    contents:
      'Introduction to Labeling Plan, Map, Diagram: Hiểu và làm đúng yêu cầu đề; Chiến thuật làm bài; Luyện tập, áp dụng chiến thuật.',
    teacherNote:
      'Từ vựng chỉ phương hướng, vị trí không gian (opposite, adjacent, junction) trong sơ đồ.',
    stageTarget: 'WRITING AND LISTENING EXPANSION',
  },
  {
    no: 13,
    skill: 'Writing',
    contents:
      'Introduction to Map (Compare 1 map with changes through time, Compare 2 maps with no changes through time): Hiểu và làm đúng yêu cầu đề; Học và sử dụng từ vựng biến đổi quy hoạch; Phân tích biểu đồ, lựa chọn và sắp xếp thông tin; Luyện tập.',
    teacherNote:
      'Từ vựng quy hoạch đô thị (demolish, construct, expand, convert).',
    stageTarget: 'WRITING AND LISTENING EXPANSION',
  },
  {
    no: 14,
    skill: 'Writing',
    contents:
      'Discussion essay: Hiểu yêu cầu đề và phân tích đề; Sử dụng discourse marker (linking words); Chiến lược viết Supporting paragraph; Luyện tập viết Supporting paragraph.',
    teacherNote:
      'Cách phân tích cân bằng 2 mặt quan điểm trước khi đưa ra lập trường cá nhân.',
    stageTarget: 'WRITING AND LISTENING EXPANSION',
  },
  {
    no: 15,
    skill: 'Listening',
    contents:
      'Introduction to Matching: Hiểu và làm đúng yêu cầu đề; Chiến thuật làm bài; Luyện tập, áp dụng chiến thuật.',
    teacherNote:
      'Kỹ năng theo dõi mạch hội thoại Section 3 và nối đặc điểm tương ứng.',
    stageTarget: 'WRITING AND LISTENING EXPANSION',
  },
  {
    no: 16,
    skill: 'Writing',
    contents:
      'Discussion essay: Hiểu yêu cầu đề và phân tích đề; Chiến lược viết Conclusion; Chiến lược đảm bảo Coherence và Cohesion; Luyện tập viết Conclusion và tổ chức bài.',
    teacherNote:
      'Tối ưu hóa điểm Lexical Resource và Cohesive Devices toàn bài Task 2.',
    stageTarget: 'WRITING AND LISTENING EXPANSION',
  },
  {
    no: 17,
    skill: 'Writing',
    contents:
      'Ôn tập và kiểm tra Writing: Ôn tập các kiến thức và chiến thuật làm các dạng bài; Kiểm tra với mock test và sửa bài; Lưu ý về các vấn đề phát sinh, định hướng tự luyện tập.',
    teacherNote:
      'Bấm giờ thi thử Task 1 (20p) + Task 2 (40p), nhận xét chi tiết 4 tiêu chí chấm bài.',
    stageTarget: 'WRITING AND LISTENING EXPANSION',
  },
  {
    no: 18,
    skill: 'Listening',
    contents:
      'Ôn tập và kiểm tra Listening: Ôn tập các kiến thức và chiến thuật làm các dạng bài; Kiểm tra với mock test và sửa bài; Lưu ý về các vấn đề phát sinh, định hướng tự luyện tập.',
    teacherNote:
      'Đánh giá kết thúc Chặng 1 Writing & Listening, tổng kết điểm chuyển tiếp sang Chặng 2.',
    stageTarget: 'WRITING AND LISTENING EXPANSION',
  },

  // ── CHẶNG 2 (Buổi 19 - 36): READING & SPEAKING ──
  // Giai đoạn 3: Reading & Speaking Foundations (Buổi 19 - 27)
  {
    no: 19,
    skill: 'Speaking',
    contents:
      'Introduction to Speaking IELTS & Introduction to Speaking Part 1: Hiểu tính chất của Part 1 và trả lời với độ dài phù hợp; Chiến thuật trả lời các câu hỏi trong Part 1 (Work-Study, Hometown, Hobbies, Travel-Holiday,...); Luyện tập, áp dụng chiến thuật.',
    teacherNote:
      'READING & SPEAKING FOUNDATIONS: Xây dựng phản xạ trả lời 3-4 câu hoàn chỉnh với A.R.E.A framework.',
    stageTarget: 'READING AND SPEAKING FOUNDATIONS',
  },
  {
    no: 20,
    skill: 'Speaking',
    contents:
      'Introduction to Speaking Part 2: Hiểu tính chất của Part 2 và trả lời trong khung thời gian cho phép; Chiến thuật trả lời các câu hỏi mang tính chất miêu tả - Descriptive language trong Part 2 (Describe a person); Luyện tập, áp dụng chiến thuật.',
    teacherNote:
      'Chiến thuật take notes trong 1 phút chuẩn bị và mở rộng cốt truyện miêu tả người.',
    stageTarget: 'READING AND SPEAKING FOUNDATIONS',
  },
  {
    no: 21,
    skill: 'Reading',
    contents:
      'Introduction to Reading IELTS & Diagram label Completion / Sentence Completion: Hiểu và làm đúng yêu cầu đề; Chiến thuật làm bài; Luyện tập, áp dụng chiến thuật.',
    teacherNote:
      'Kỹ năng Skimming & Scanning, xác định loại từ cần điền và giới hạn số từ (Word limit).',
    stageTarget: 'READING AND SPEAKING FOUNDATIONS',
  },
  {
    no: 22,
    skill: 'Speaking',
    contents:
      'Speaking Part 2: Hiểu tính chất của Part 2 và trả lời trong khung thời gian cho phép; Chiến thuật trả lời các câu hỏi mang tính chất miêu tả - Descriptive language trong Part 2 (Describe an item); Luyện tập, áp dụng chiến thuật.',
    teacherNote:
      'Vận dụng tính từ miêu tả đồ vật, công dụng và cảm nhận cá nhân.',
    stageTarget: 'READING AND SPEAKING FOUNDATIONS',
  },
  {
    no: 23,
    skill: 'Speaking',
    contents:
      'Introduction to Speaking Part 3: Hiểu tính chất của Part 3 và trả lời với độ dài phù hợp; Chiến thuật trả lời các câu hỏi trong Part 3; Luyện tập và áp dụng chiến thuật.',
    teacherNote:
      'Mở rộng góc nhìn từ cá nhân sang xã hội; luyện filler phrases tự nhiên.',
    stageTarget: 'READING AND SPEAKING FOUNDATIONS',
  },
  {
    no: 24,
    skill: 'Reading',
    contents:
      'Introduction to Multiple choice: Hiểu và làm đúng yêu cầu đề; Chiến thuật làm bài; Luyện tập, áp dụng chiến thuật.',
    teacherNote:
      'Phân tích câu hỏi trắc nghiệm Passage 2, gạch chân key ideas và đối chiếu paraphrase.',
    stageTarget: 'READING AND SPEAKING FOUNDATIONS',
  },
  {
    no: 25,
    skill: 'Speaking',
    contents:
      'Speaking Part 2: Hiểu tính chất của Part 2 và trả lời trong khung thời gian cho phép; Chiến thuật trả lời các câu hỏi mang tính chất miêu tả - Descriptive language trong Part 2 (Describe a place); Luyện tập, áp dụng chiến thuật.',
    teacherNote:
      'Miêu tả địa điểm, không gian và kỷ niệm gắn liền; vận dụng câu chẻ (Cleft sentences).',
    stageTarget: 'READING AND SPEAKING FOUNDATIONS',
  },
  {
    no: 26,
    skill: 'Speaking',
    contents:
      'Speaking Part 2 and Part 3: Chiến thuật trả lời liên tục Part 2 và Part 3; Luyện tập duy trì độ bền về ngôn ngữ, tư duy ý tưởng; Luyện tập, áp dụng chiến thuật.',
    teacherNote:
      'Mô phỏng áp lực thi Speaking liên tục, chỉnh ngắt nghỉ và ngữ điệu tự nhiên.',
    stageTarget: 'READING AND SPEAKING FOUNDATIONS',
  },
  {
    no: 27,
    skill: 'Reading',
    contents:
      'Introduction to Information Identification (T/F/NG, Y/N/NG): Hiểu và làm đúng yêu cầu đề; Chiến thuật làm bài; Luyện tập, áp dụng chiến thuật.',
    teacherNote:
      'Phân biệt False/No vs Not Given; bám sát nội dung bài đọc, không suy diễn cá nhân.',
    stageTarget: 'READING AND SPEAKING FOUNDATIONS',
  },
  // Giai đoạn 4: Reading & Speaking Expansion (Buổi 28 - 36)
  {
    no: 28,
    skill: 'Speaking',
    contents:
      'Speaking Part 1: Hiểu tính chất của Part 1 và trả lời với độ dài phù hợp; Chiến thuật trả lời các câu hỏi trong Part 1 (Accommodation, Sport-Exercise, Transportation,...); Luyện tập, áp dụng chiến thuật.',
    teacherNote:
      'READING & SPEAKING EXPANSION: Nâng cao vốn từ topic-specific và độ trôi chảy (Fluency).',
    stageTarget: 'READING AND SPEAKING EXPANSION',
  },
  {
    no: 29,
    skill: 'Speaking',
    contents:
      'Introduction to Speaking Part 2: Hiểu tính chất của Part 2 và trả lời trong khung thời gian cho phép; Chiến thuật trả lời các câu hỏi mang tính chất kể chuyện - Story telling trong Part 2 (Describe an event); Luyện tập, áp dụng chiến thuật.',
    teacherNote:
      'Kỹ thuật kể chuyện theo tuyến thời gian, kết hợp thì quá khứ đơn và tiếp diễn mượt mà.',
    stageTarget: 'READING AND SPEAKING EXPANSION',
  },
  {
    no: 30,
    skill: 'Reading',
    contents:
      'Introduction to Matching features và Matching information: Hiểu và làm đúng yêu cầu đề; Chiến thuật làm bài; Luyện tập, áp dụng chiến thuật.',
    teacherNote:
      'Chiến thuật quét tên riêng/thời gian và nối luận điểm với người nói tương ứng.',
    stageTarget: 'READING AND SPEAKING EXPANSION',
  },
  {
    no: 31,
    skill: 'Speaking',
    contents:
      'Speaking Part 2: Hiểu tính chất của Part 2 và trả lời trong khung thời gian cho phép; Chiến thuật trả lời các câu hỏi mang tính chất kể chuyện - Story telling trong Part 2 (Describe a situation); Luyện tập, áp dụng chiến thuật.',
    teacherNote:
      'Tạo tình huống kịch tính và cảm xúc để câu chuyện thêm hấp dẫn và tự nhiên.',
    stageTarget: 'READING AND SPEAKING EXPANSION',
  },
  {
    no: 32,
    skill: 'Speaking',
    contents:
      'Speaking Part 3: Hiểu tính chất của Part 3 và trả lời với độ dài phù hợp; Chiến thuật trả lời các câu hỏi trong Part 3; Luyện tập và áp dụng chiến thuật.',
    teacherNote:
      'Nâng cấp từ vựng học thuật C1/C2 và cấu trúc câu điều kiện phức tạp.',
    stageTarget: 'READING AND SPEAKING EXPANSION',
  },
  {
    no: 33,
    skill: 'Reading',
    contents:
      'Introduction to Matching headings và Matching sentence endings: Hiểu và làm đúng yêu cầu đề; Chiến thuật làm bài; Luyện tập, áp dụng chiến thuật.',
    teacherNote:
      'Kỹ thuật đọc câu chủ đề đoạn văn và tránh bẫy từ khóa trùng bề mặt trong Matching Headings.',
    stageTarget: 'READING AND SPEAKING EXPANSION',
  },
  {
    no: 34,
    skill: 'Speaking',
    contents:
      'Speaking Part 2: Hiểu tính chất của Part 2 và trả lời trong khung thời gian cho phép; Chiến thuật trả lời các câu hỏi mang tính chất kể chuyện - Story telling trong Part 2 (Describe an excursion); Luyện tập, áp dụng chiến thuật.',
    teacherNote:
      'Luyện nói tự tin 2 phút trọn vẹn, kiểm soát tốt phát âm và trọng âm câu.',
    stageTarget: 'READING AND SPEAKING EXPANSION',
  },
  {
    no: 35,
    skill: 'Speaking',
    contents:
      'Ôn tập và kiểm tra Speaking: Ôn tập các kiến thức và chiến thuật full test; Kiểm tra với mock test và sửa bài; Lưu ý về các vấn đề phát sinh, định hướng tự luyện tập.',
    teacherNote:
      'Mô phỏng thi Speaking hoàn chỉnh 15 phút với Examiner, chấm theo 4 tiêu chí rubric.',
    stageTarget: 'READING AND SPEAKING EXPANSION',
  },
  {
    no: 36,
    skill: 'Reading',
    contents:
      'Ôn tập và kiểm tra Reading: Ôn tập các kiến thức và chiến thuật làm các dạng bài; Kiểm tra với mock test và sửa bài; Lưu ý về các vấn đề phát sinh, định hướng tự luyện tập.',
    teacherNote:
      'Final Mock Test kết thúc khóa Core (Upstream/Momentum) - Đánh giá band score & Lập Bảng Chẩn Bệnh (BCB).',
    stageTarget: 'READING AND SPEAKING EXPANSION',
  },
];

export const CORE_IELTS_36_SESSIONS = CORE_UPSTREAM_MOMENTUM_SESSIONS;

export const DEFAULT_RLP_SESSIONS: RlpSessionRecord[] = CORE_UPSTREAM_MOMENTUM_SESSIONS.map((s) => ({
  no: s.no,
  date: '',
  skill: s.skill,
  contents: s.contents,
  teacherNote: s.teacherNote || '—',
  deadline: '',
  homeworkStatus: 'not_assigned' as const,
  attendance: 'present' as const,
  lessonFileUrl: `https://drive.google.com/file/d/core-s${s.no}-slides`,
  homeworkFileUrl: `https://docs.google.com/document/d/core-s${s.no}-hw`,
  recordingUrl: '',
}));
