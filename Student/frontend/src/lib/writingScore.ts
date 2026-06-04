import type { WritingTask1CriterionScores } from "@/lib/writingTask1BandDescriptors";
import type { WritingTask2CriterionScores } from "@/lib/writingTask2BandDescriptors";

/** Làm tròn band IELTS bước 0.5 (6.17 → 6.0, 6.25 → 6.5). */
export function roundBandHalf(raw: number): number {
  if (!Number.isFinite(raw)) return 0;
  return Math.round(raw * 2) / 2;
}

/** Trung bình 4 tiêu chí (mỗi tiêu chí 0–9), làm tròn 0.5. */
export function computeTaskBandFromCriteria(scores: number[]): number {
  if (scores.length === 0) return 0;
  const mean = scores.reduce((sum, n) => sum + n, 0) / scores.length;
  return roundBandHalf(mean);
}

export function computeWritingTask1Band(scores: WritingTask1CriterionScores): number {
  return computeTaskBandFromCriteria([
    scores.taskAchievement,
    scores.coherenceCohesion,
    scores.lexicalResource,
    scores.grammaticalRange,
  ]);
}

export function computeWritingTask2Band(scores: WritingTask2CriterionScores): number {
  return computeTaskBandFromCriteria([
    scores.taskResponse,
    scores.coherenceCohesion,
    scores.lexicalResource,
    scores.grammaticalRange,
  ]);
}

/** Điểm Writing overall: (Task 1 + Task 2 × 2) / 3, làm tròn 0.5. */
export function computeWritingOverallBand(task1Band: number, task2Band: number): number {
  return roundBandHalf((task1Band + task2Band * 2) / 3);
}

export type WritingCriterionInput = {
  task1: WritingTask1CriterionScores;
  task2: WritingTask2CriterionScores;
};

export function resolveWritingBands(input: WritingCriterionInput) {
  const task1Band = computeWritingTask1Band(input.task1);
  const task2Band = computeWritingTask2Band(input.task2);
  const writingOverall = computeWritingOverallBand(task1Band, task2Band);
  return { task1Band, task2Band, writingOverall };
}
