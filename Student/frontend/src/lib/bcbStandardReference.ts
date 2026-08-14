/** Standard IELTS Writing & Speaking Reference Descriptions for BCB Diagnosis */

import { WRITING_TASK1_BAND_DESCRIPTORS } from "./writingTask1BandDescriptors";
import { getWritingTask2CriterionDescriptor } from "./writingTask2BandDescriptors";

export const WRITING_TASK1_STANDARD_DESCRIPTIONS = {
  taskAchievement: `Tiêu chí Task Achievement (IELTS Writing Task 1) sẽ được đánh giá dựa trên khả năng đáp ứng yêu cầu đề bài của thí sinh. Thí sinh sẽ đạt được số điểm cao trong tiêu chí này khi bài viết của thí sinh giải quyết được tất cả các yêu cầu của đề bài thông qua việc sử dụng luận điểm và dữ liệu chính xác xuyên suốt trong bài viết.`,
  coherenceCohesion: `Tiêu chí Coherence và Cohesion sẽ được đánh giá dựa trên tính mạch lạc liên kết giữa các câu, các đoạn trong bài văn về cả ý nghĩa và cấu trúc.\nCoherence sẽ nhấn mạnh về mặt tính mạch lạc của bài viết. Coherence được đánh giá thông qua khả năng xây dựng, liên kết và làm rõ được một cách khách quan các luận điểm chính và phụ trong bài viết, từ đó tạo nên tính thống nhất của toàn bài.\nCohesion sẽ nhấn mạnh về cách nối và liên kết câu. Cohesion được đánh giá thông qua việc bài viết của thí sinh có được chia đoạn và sử dụng các từ nối để liên kết các câu, các đoạn một cách hợp lý hay không.`,
  lexicalResource: `Tiêu chí Lexical Resource sẽ được đánh giá dựa trên chất lượng của từ vựng được sử dụng trong bài viết. Bài viết có từ vựng càng đa dạng, đồng thời vận dụng được chính xác các từ vựng khó sẽ được đánh giá cao.`,
  grammaticalRange: `Tiêu chí Grammatical Range and Accuracy sẽ được đánh giá dựa trên chất lượng của các cấu trúc ngữ pháp được sử dụng trong bài viết. Bài viết sử dụng chính xác và đa dạng nhiều cấu trúc ngữ pháp (cả cơ bản và nâng cao) sẽ được đánh giá cao. Bên cạnh đó, việc sử dụng chính xác các dấu câu cũng sẽ được đánh giá trong tiêu chí này.`,
};

export const WRITING_TASK2_STANDARD_DESCRIPTIONS = {
  taskResponse: `Tiêu chí Task Response (IELTS Writing Task 2) đánh giá khả năng hoàn thành yêu cầu đề bài, nhấn mạnh việc thể hiện quan điểm của người viết một cách rõ ràng, chặt chẽ và nhất quán xuyên suốt bài viết.`,
  coherenceCohesion: `Tiêu chí Coherence và Cohesion đánh giá tính mạch lạc và liên kết giữa các câu, đoạn văn cả về cấu trúc lẫn ý nghĩa, đảm bảo các luận điểm được phân đoạn và nối kết tự nhiên.`,
  lexicalResource: `Tiêu chí Lexical Resource đánh giá chất lượng từ vựng, độ đa dạng, linh hoạt và độ chính xác khi sử dụng từ vựng nâng cao/collocations theo ngữ cảnh.`,
  grammaticalRange: `Tiêu chí Grammatical Range and Accuracy đánh giá việc sử dụng đa dạng, chính xác các cấu trúc câu (cơ bản & phức tạp) cùng với việc sử dụng dấu câu chuẩn xác.`,
};

export function getWritingTask1StandardDescription(band: number): string {
  const rounded = Math.min(9, Math.max(1, Math.round(band)));
  const row = WRITING_TASK1_BAND_DESCRIPTORS.find((r) => r.band === rounded);
  if (!row) return WRITING_TASK1_STANDARD_DESCRIPTIONS.taskAchievement;

  const ta = row.taskAchievement.join(" ");
  const cc = row.coherenceCohesion.join(" ");
  const lr = row.lexicalResource.join(" ");
  const gra = row.grammaticalRange.join(" ");

  return `Task Achievement: ${ta}\nCoherence & Cohesion: ${cc}\nLexical Resource: ${lr}\nGrammatical Range: ${gra}`;
}

export function getWritingTask2StandardDescription(band: number): string {
  const rounded = Math.min(9, Math.max(1, Math.round(band)));
  const row = WRITING_TASK1_BAND_DESCRIPTORS.find((r) => r.band === rounded);

  const trList = getWritingTask2CriterionDescriptor(rounded, "taskResponse");
  const tr = trList.join(" ");
  const cc = (row?.coherenceCohesion || []).join(" ");
  const lr = (row?.lexicalResource || []).join(" ");
  const gra = (row?.grammaticalRange || []).join(" ");

  return `Task Response: ${tr}\nCoherence & Cohesion: ${cc}\nLexical Resource: ${lr}\nGrammatical Range: ${gra}`;
}

export const SPEAKING_BAND_DESCRIPTIONS: Record<number, string> = {
  9: `Nói trôi chảy và hiếm khi lặp lại hay tự điều chỉnh, sửa lỗi.
Mọi sự do dự, ngập ngừng trong lúc nói đều liên quan đến nội dung, không phải là tìm từ hoặc ngữ pháp.
Nói mạch lạc, phù hợp với ngữ cảnh, sử dụng các đặc trưng liên kết một cách hoàn toàn thích hợp.
Phát triển các chủ đề một cách mạch lạc, đầy đủ và hợp lý.`,
  8: `Nói một cách trôi chảy, hiếm khi lặp lại hoặc tự sửa lỗi.
Ngập ngừng chủ yếu do tìm nội dung, ý diễn đạt, ít khi phải dừng để tìm từ ngữ hay ngữ pháp.
Phát triển các chủ đề một cách mạch lạc và phù hợp.`,
  7: `Có thể kéo dài câu nói mà không cần nỗ lực nhiều.
Đôi khi có thể thể hiện sự ngập ngừng, một số sự lặp lại và / hoặc tự điều chỉnh, sửa lỗi ở giữa câu nói, liên quan đến việc tìm kiếm ngôn ngữ phù hợp nhưng không ảnh hưởng đến độ mạch lạc.
Sử dụng nhiều, đa dạng và linh hoạt các phép nối cũng như discourse markers.`,
  6: `Có khả năng và mong muốn kéo dài câu nói.
Đôi khi có thể mất độ mạch lạc do thỉnh thoại lặp lại, tự sửa lỗi hoặc do ngập ngừng.
Sử dụng nhiều các phép nối và discourse markers nhưng không phải lúc nào cũng thích hợp.`,
  5: `Thường có thể duy trì được độ trôi chảy của lời nói nhưng phải lặp lại, tự sửa lỗi và/hoặc nói chậm để có thể nói liên tục.
Thường ngập ngừng để tìm kiếm những từ vựng và ngữ pháp khá căn bản.
Có thể lạm dụng (sử dụng quá mức) một số từ nối, phép nối và discourse markers.
Tạo ra được những lời nói đơn giản và lưu loát, nhưng việc truyền đạt các nội dung phức tạp hơn thường thiếu trôi chảy.`,
  4: `Trong lúc trả lời vẫn có những khoảng dừng đáng chú ý và có thể nói chậm, thường xuyên bị lặp và tự sửa lỗi.
Liên kết được các câu cơ bản nhưng sử dụng lặp đi lặp lại các phép liên kết đơn giản cũng cùng với những gián đoạn trong độ mạch lạc.`,
  3: `Nói với những khoảng dừng dài và thường xuyên để tìm từ vựng.
Khả năng liên kết các câu đơn còn hạn chế.
Chỉ đưa ra được những câu trả lời đơn giản và thường không thể truyền tải thông điệp cơ bản.`,
  2: `Có các khoảng dừng dài trước hầu hết các từ.
Có thể nói các từ đơn nhưng khả năng truyền đạt thấp, hầu như không có ý nghĩa giao tiếp.`,
  1: `Không thể giao tiếp và truyền đạt.
Bài nói hoàn toàn rời rạc.`,
};

export function getSpeakingStandardDescription(band: number): string {
  const rounded = Math.min(9, Math.max(1, Math.round(band)));
  return SPEAKING_BAND_DESCRIPTIONS[rounded] || SPEAKING_BAND_DESCRIPTIONS[6];
}
