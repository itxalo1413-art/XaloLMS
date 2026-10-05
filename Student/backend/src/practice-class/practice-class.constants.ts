export const DEFAULT_PRACTICE_ZOOM_ID = '851 5452 5397';
export const DEFAULT_PRACTICE_ZOOM_PASSWORD = '123456';
export const DEFAULT_PRACTICE_ZALO_LINK = 'https://zalo.me/g/e2vslsobotb3em3nh8gr';
export const DEFAULT_PRACTICE_ZOOM_JOIN_URL = 'https://zoom.us/j/85154525397';

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
  title?: string;
  detail?: string;
  dateNote?: string;
  materialsUrl?: string;
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

/** Lịch luyện đề cố định: Thứ 3 / 5 / 7 (dayOfWeek 2 / 4 / 6). */
export const PRACTICE_SLOT_DEFINITIONS: PracticeSlotDefinition[] = [
  {
    id: 'tue-lrw',
    dayOfWeek: 2,
    dayLabel: 'Thứ 3',
    time: '19h45 – 21h45',
    title: 'Luyện tập Speaking theo chuyên đề',
    detail:
      'Tham gia qua Zoom, học với Giáo viên, được cung cấp từ vựng/phương pháp tiếp cận và luyện tập trực tiếp với Giáo viên.',
    platform: 'Zoom',
  },
  {
    id: 'sun-lrw',
    dayOfWeek: 4,
    dayLabel: 'Thứ 5',
    time: '19h45 – 21h45',
    title: 'Chữa đề L-R-W',
    detail:
      'Tham gia qua Zoom, học với Giáo viên, tập trung chữa đề W và các giải đáp thắc mắc về L-R.',
    platform: 'Zoom',
  },
  {
    id: 'sat-speaking',
    dayOfWeek: 6,
    dayLabel: 'Thứ 7',
    time: '19h – 21h30',
    title: 'Làm đề L-R-W tập trung',
    detail:
      'Tham gia qua Zoom, làm bài trên Google Docs, có Giáo viên canh thời gian làm bài và các bạn học viên khác tham gia.',
    platform: 'Zoom',
  },
];

export function isPracticeSlotId(value: string): value is PracticeSlotId {
  return (PRACTICE_SLOT_IDS as readonly string[]).includes(value);
}
