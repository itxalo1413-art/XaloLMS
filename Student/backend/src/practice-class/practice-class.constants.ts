export const PRACTICE_SCHEDULE_KEY = 'current';

export const PRACTICE_SLOT_IDS = [
  'sun-lrw',
  'tue-lrw',
  'sat-speaking',
] as const;

export type PracticeSlotId = (typeof PRACTICE_SLOT_IDS)[number];

export type PracticeSlotOverride = {
  dayLabel: string;
  time: string;
  dateNote?: string;
};

export type PracticeSlotDefinition = {
  id: PracticeSlotId;
  dayOfWeek: number;
  dayLabel: string;
  time: string;
  title: string;
  detail: string;
  platform: string;
};

export const PRACTICE_SLOT_DEFINITIONS: PracticeSlotDefinition[] = [
  {
    id: 'sun-lrw',
    dayOfWeek: 0,
    dayLabel: 'CN',
    time: '9h – 11h30',
    title: 'Làm đề L-R-W tập trung',
    detail:
      'Tham gia bằng link Google Meet, làm bài trên Google Docs, có nhân viên canh thời gian làm bài và các bạn học viên khác tham gia.',
    platform: 'Google Meet',
  },
  {
    id: 'tue-lrw',
    dayOfWeek: 2,
    dayLabel: 'Thứ 3',
    time: '19h45 – 21h45',
    title: 'Chữa đề L-R-W',
    detail:
      'Tham gia bằng Zoom, học với Giáo viên, tập trung chữa đề Writing và các thắc mắc về Listening – Reading.',
    platform: 'Zoom',
  },
  {
    id: 'sat-speaking',
    dayOfWeek: 6,
    dayLabel: 'Thứ 7',
    time: '19h45 – 21h45',
    title: 'Chữa đề Speaking',
    detail:
      'Tham gia bằng Zoom, học với Giáo viên, phân tích bộ đề Speaking 3 part, được cung cấp từ vựng/phương pháp tiếp cận và luyện tập trực tiếp với Giáo viên.',
    platform: 'Zoom',
  },
];

export function isPracticeSlotId(value: string): value is PracticeSlotId {
  return (PRACTICE_SLOT_IDS as readonly string[]).includes(value);
}
