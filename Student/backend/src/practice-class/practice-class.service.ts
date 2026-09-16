import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UsersService } from '../users/users.service';
import { UpdatePracticeScheduleDto } from './dto/update-practice-schedule.dto';
import {
  isPracticeSlotId,
  DEFAULT_PRACTICE_ZOOM_ID,
  DEFAULT_PRACTICE_ZOOM_PASSWORD,
  PRACTICE_SCHEDULE_KEY,
  PRACTICE_SLOT_DEFINITIONS,
  PRACTICE_SLOT_IDS,
  type PracticeSlotDefinition,
  type PracticeSlotId,
  type PracticeSlotOverride,
} from './practice-class.constants';
import {
  PracticeClassRegistration,
  type PracticeClassRegistrationDocument,
} from './schemas/practice-class-registration.schema';
import {
  PracticeClassSchedule,
  type PracticeClassScheduleDocument,
} from './schemas/practice-class-schedule.schema';

import { AcaPracticeStudent, AcaPracticeStudentDocument } from '../aca/schemas/aca-practice-student.schema';
import { AcaStudent, AcaStudentDocument } from '../aca/schemas/aca-student.schema';
import {
  AcaPracticeWeek,
  AcaPracticeWeekDocument,
} from '../aca/schemas/aca-practice-week.schema';
import {
  PracticeClassWeeklyScore,
  PracticeClassWeeklyScoreDocument,
} from './schemas/practice-class-weekly-score.schema';
import {
  findPracticeWeekForDate,
  getCurrentRealtimePracticeWeekRange,
  registrationMatchesWeekRange,
  resolveExamWeekNumber,
  resolveWeekRangeForTimestamp,
  type PracticeWeekLean,
} from './practice-class-week.util';

export type PracticeClassSlotPublic = PracticeSlotDefinition & {
  dateNote?: string;
  materialsUrl?: string;
};

export type PracticeSchedulePublic = {
  weekRangeLabel: string;
  updatedAt: string | null;
  zoomId: string;
  zoomPassword: string;
  slots: PracticeClassSlotPublic[];
};

export type PracticeRegistrationPublic = {
  slotId: PracticeSlotId;
  registeredAt: string;
  weekRange?: string;
  linkFolder?: string;
  scoreR?: string;
  scoreL?: string;
  scoreW?: string;
};

export type PracticeRegistrationAcaPublic = {
  id: string;
  studentId: string;
  studentName: string;
  slotId: PracticeSlotId;
  slotTitle: string;
  slotSchedule: string;
  registeredAt: string;
  weekRange?: string;
  linkFolder?: string;
  scoreR?: string;
  scoreL?: string;
  scoreW?: string;
};

export type PracticeCurrentWeekPublic = {
  weekRange: string;
  examWeekNumber: number;
  announcement: string;
  linkTab: string;
  linkMeet: string;
  linkFolder: string;
  zoomId: string;
  zoomPassword: string;
};

export type PracticeWeeklyScorePublic = {
  test: string;
  weekRange: string;
  examWeekNumber: number;
  l: string;
  r: string;
  w: string;
};

@Injectable()
export class PracticeClassService implements OnModuleInit {
  constructor(
    @InjectModel(PracticeClassSchedule.name)
    private readonly scheduleModel: Model<PracticeClassScheduleDocument>,
    @InjectModel(PracticeClassRegistration.name)
    private readonly registrationModel: Model<PracticeClassRegistrationDocument>,
    @InjectModel(AcaPracticeStudent.name)
    private readonly practiceStudentModel: Model<AcaPracticeStudentDocument>,
    @InjectModel(AcaStudent.name)
    private readonly acaStudentModel: Model<AcaStudentDocument>,
    @InjectModel(AcaPracticeWeek.name)
    private readonly practiceWeekModel: Model<AcaPracticeWeekDocument>,
    @InjectModel(PracticeClassWeeklyScore.name)
    private readonly weeklyScoreModel: Model<PracticeClassWeeklyScoreDocument>,
    private readonly usersService: UsersService,
  ) {}

  async onModuleInit() {
    try {
      await this.registrationModel.collection.dropIndex('userId_1_slotId_1');
    } catch {
      // index cũ có thể đã bị xóa
    }
    try {
      await this.registrationModel.syncIndexes();
    } catch (err) {
      console.warn('practice_class_registrations syncIndexes:', err);
    }
    try {
      await this.backfillRegistrationWeekRanges();
    } catch (err) {
      console.warn('practice_class_registrations weekRange backfill:', err);
    }
  }

  /** Gán weekRange cho bản ghi cũ (1 tick = 1 tuần, không còn “cả đời”). */
  private async backfillRegistrationWeekRanges(): Promise<void> {
    const legacy = await this.registrationModel
      .find({
        $or: [
          { weekRange: { $exists: false } },
          { weekRange: null },
          { weekRange: '' },
        ],
      })
      .lean()
      .exec();
    if (legacy.length === 0) return;

    const weeks = await this.listPracticeWeeksLean();
    let updated = 0;
    for (const row of legacy) {
      const weekRange = resolveWeekRangeForTimestamp(
        (row as { createdAt?: Date }).createdAt,
        weeks,
      );
      try {
        await this.registrationModel
          .updateOne({ _id: row._id }, { $set: { weekRange } })
          .exec();
        updated += 1;
      } catch (err) {
        // Trùng unique (userId+slotId+weekRange): giữ bản ghi đã có weekRange
        console.warn(
          `Skip backfill registration ${String(row._id)} → ${weekRange}:`,
          err,
        );
      }
    }
    if (updated > 0) {
      console.log(
        `Backfilled weekRange for ${updated}/${legacy.length} practice_class_registrations`,
      );
    }
  }

  /** Tuần đang dùng cho đăng ký / lọc — ưu tiên tuần lịch ACA hiện tại. */
  private async resolveActiveWeekRange(): Promise<string> {
    const current = await this.resolveCurrentPracticeWeek();
    if (current?.weekRange?.trim()) return current.weekRange.trim();
    const scheduleDoc = await this.scheduleModel
      .findOne({ key: PRACTICE_SCHEDULE_KEY })
      .lean()
      .exec();
    const fromSchedule = scheduleDoc?.weekRangeLabel?.trim();
    if (fromSchedule) return fromSchedule;
    return getCurrentRealtimePracticeWeekRange();
  }

  private async syncStudentPracticeSchedule(userId: string): Promise<void> {
    try {
      const currentWeekRange = await this.resolveActiveWeekRange();
      if (!currentWeekRange) return;

      // 2. Get user info
      const user = await this.usersService.findPublicById(userId);
      if (!user) return;

      // 3. Find any matching AcaStudent to see if we have their phone number
      const acaStudent = await this.acaStudentModel.findOne({ email: user.email }).lean().exec();
      const phone = acaStudent?.phone || '';

      // 4. Chỉ đăng ký của tuần hiện tại (không lấy tick cả đời)
      const registrations = await this.registrationModel
        .find({ userId: new Types.ObjectId(userId) })
        .lean()
        .exec();
      const registeredSlotIds = new Set(
        registrations
          .filter((row) =>
            registrationMatchesWeekRange(
              {
                weekRange: row.weekRange,
                createdAt: (row as { createdAt?: Date }).createdAt,
              },
              currentWeekRange,
            ),
          )
          .map((r) => r.slotId),
      );

      // Determine the values for scheduleTue, scheduleSat, scheduleSun based on registrations
      const scheduleTue = registeredSlotIds.has('tue-lrw') ? 'Ca 1 (19h45-21h45)' : 'Không học';
      const scheduleSat = registeredSlotIds.has('sat-speaking') ? 'Ca 1 (19h-21h30)' : 'Không học';
      const scheduleSun = registeredSlotIds.has('sun-lrw') ? 'Có tham gia' : 'Không học';

      // 5. Look for AcaPracticeStudent entry for this user
      const query: any = {
        weekRange: currentWeekRange,
      };
      const escapedName = user.name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (phone) {
        query.$or = [
          { phone: phone },
          { name: { $regex: new RegExp(`^${escapedName}$`, 'i') } }
        ];
      } else {
        query.name = { $regex: new RegExp(`^${escapedName}$`, 'i') };
      }

      const practiceStudent = await this.practiceStudentModel.findOne(query).exec();
      if (practiceStudent) {
        // 6. Update practice student's schedule fields
        practiceStudent.scheduleTue = scheduleTue;
        practiceStudent.scheduleSat = scheduleSat;
        practiceStudent.scheduleSun = scheduleSun;
        practiceStudent.testScheduleSunday = scheduleSun;
        practiceStudent.scheduleTueSat = `${scheduleTue !== "Không học" ? `T3: ${scheduleTue}` : ""}${scheduleTue !== "Không học" && scheduleSat !== "Không học" ? ", " : ""}${scheduleSat !== "Không học" ? `T7: ${scheduleSat}` : ""}`;
        
        await practiceStudent.save();
      }
    } catch (err) {
      console.error('Lỗi khi đồng bộ đăng ký lớp luyện đề: ', err);
    }
  }

  private mergeSlot(
    base: PracticeSlotDefinition,
    override?: PracticeSlotOverride,
  ): PracticeClassSlotPublic {
    if (!override) return { ...base };
    const dateNote = override.dateNote?.trim();
    const materialsUrl = override.materialsUrl?.trim();
    return {
      ...base,
      // Luôn neo ngày theo lịch cố định T3/T5/T7 — không để override cũ lệch lịch.
      dayLabel: base.dayLabel,
      time: override.time?.trim() || base.time,
      title: override.title?.trim() || base.title,
      detail: override.detail?.trim() || base.detail,
      ...(dateNote ? { dateNote } : {}),
      ...(materialsUrl ? { materialsUrl } : {}),
    };
  }

  private resolveZoom(doc: { zoomId?: string; zoomPassword?: string } | null) {
    const zoomId = doc?.zoomId?.trim() || DEFAULT_PRACTICE_ZOOM_ID;
    const zoomPassword = doc?.zoomPassword?.trim() || DEFAULT_PRACTICE_ZOOM_PASSWORD;
    return { zoomId, zoomPassword };
  }

  private buildScheduleResponse(
    doc: { weekRangeLabel?: string; updatedAt?: Date; zoomId?: string; zoomPassword?: string } | null,
    overrides: Record<string, PracticeSlotOverride>,
  ): PracticeSchedulePublic {
    const { zoomId, zoomPassword } = this.resolveZoom(doc);
    return {
      weekRangeLabel: doc?.weekRangeLabel?.trim() ?? '',
      updatedAt: doc?.updatedAt?.toISOString() ?? null,
      zoomId,
      zoomPassword,
      slots: PRACTICE_SLOT_DEFINITIONS.map((base) =>
        this.mergeSlot(base, overrides[base.id]),
      ),
    };
  }

  async getSchedule(): Promise<PracticeSchedulePublic> {
    const doc = await this.scheduleModel
      .findOne({ key: PRACTICE_SCHEDULE_KEY })
      .lean()
      .exec();
    const overrides =
      (doc?.slotOverrides as Record<string, PracticeSlotOverride>) ?? {};
    const hasOverrides = Object.keys(overrides).length > 0;
    if (!hasOverrides || !doc?.weekRangeLabel?.trim()) {
      const current = await this.resolveCurrentPracticeWeek();
      if (current) {
        return this.applyPracticeWeekToSchedule(current);
      }
    }
    return this.buildScheduleResponse(doc, overrides);
  }

  private async listPracticeWeeksLean(): Promise<PracticeWeekLean[]> {
    const rows = await this.practiceWeekModel.find().lean().exec();
    return rows as PracticeWeekLean[];
  }

  async resolveCurrentPracticeWeek(): Promise<PracticeWeekLean | null> {
    const weeks = await this.listPracticeWeeksLean();
    const current = findPracticeWeekForDate(weeks, new Date());
    if (current) return current;
    const scheduleDoc = await this.scheduleModel
      .findOne({ key: PRACTICE_SCHEDULE_KEY })
      .lean()
      .exec();
    const label = scheduleDoc?.weekRangeLabel?.trim();
    if (label) {
      const match = weeks.find((w) => w.weekRange === label);
      if (match) return match;
    }
    if (weeks.length === 0) return null;
    const sorted = [...weeks].sort((a, b) => {
      const ar = a.weekRange;
      const br = b.weekRange;
      return br.localeCompare(ar);
    });
    return sorted[0] ?? null;
  }

  async applyPracticeWeekToSchedule(
    week: PracticeWeekLean,
  ): Promise<PracticeSchedulePublic> {
    const linkTab = week.linkTab?.trim() ?? '';
    return this.updateSchedule({
      weekRangeLabel: week.weekRange,
      zoomId: week.zoomId?.trim(),
      zoomPassword: week.zoomPassword?.trim(),
      slots: {
        'tue-lrw': {
          dayLabel: 'Thứ 3',
          time: week.scheduleTueTime?.trim() || undefined,
          title: week.scheduleTueTitle?.trim() || undefined,
          detail: week.scheduleTueInfo?.trim() || undefined,
          materialsUrl: linkTab || undefined,
        },
        'sun-lrw': {
          dayLabel: 'Thứ 5',
          time: week.scheduleThuTime?.trim() || undefined,
          title: week.scheduleThuTitle?.trim() || undefined,
          detail: week.scheduleThuInfo?.trim() || undefined,
          materialsUrl: linkTab || undefined,
        },
        'sat-speaking': {
          dayLabel: 'Thứ 7',
          time: week.scheduleSatTime?.trim() || undefined,
          title: week.scheduleSatTitle?.trim() || undefined,
          detail: week.scheduleSatInfo?.trim() || undefined,
          materialsUrl: linkTab || undefined,
        },
      },
    });
  }

  async syncCurrentPracticeWeekToSchedule(): Promise<PracticeSchedulePublic | null> {
    const current = await this.resolveCurrentPracticeWeek();
    if (!current) return null;
    return this.applyPracticeWeekToSchedule(current);
  }

  async getCurrentWeekPublic(): Promise<PracticeCurrentWeekPublic> {
    const weeks = await this.listPracticeWeeksLean();
    let week = await this.resolveCurrentPracticeWeek();
    if (!week) {
      const range = getCurrentRealtimePracticeWeekRange();
      week = { weekRange: range };
    }
    const examWeekNumber = resolveExamWeekNumber(week, weeks);
    const schedule = await this.getSchedule();
    return {
      weekRange: week.weekRange,
      examWeekNumber,
      announcement: week.announcement?.trim() ?? '',
      linkTab: week.linkTab?.trim() ?? '',
      linkMeet: week.linkMeet?.trim() ?? '',
      linkFolder: week.linkFolder?.trim() ?? '',
      zoomId: schedule.zoomId,
      zoomPassword: schedule.zoomPassword,
    };
  }

  async getStudentWeeklyScores(
    userId: string,
  ): Promise<PracticeWeeklyScorePublic[]> {
    if (!Types.ObjectId.isValid(userId)) return [];
    const rows = await this.weeklyScoreModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ examWeekNumber: -1, updatedAt: -1 })
      .lean()
      .exec();
    return rows.map((row) => ({
      test: `LĐ${row.examWeekNumber || '—'}`,
      weekRange: row.weekRange,
      examWeekNumber: row.examWeekNumber ?? 0,
      l: row.scoreL?.trim() || '—',
      r: row.scoreR?.trim() || '—',
      w: row.scoreW?.trim() || '—',
    }));
  }

  async upsertWeeklyScoreForUser(
    userId: string,
    input: {
      weekRange: string;
      examWeekNumber: number;
      scoreL?: string;
      scoreR?: string;
      scoreW?: string;
    },
  ): Promise<void> {
    await this.upsertWeeklyScoreSnapshot(userId, input.weekRange, input.examWeekNumber, {
      scoreL: input.scoreL,
      scoreR: input.scoreR,
      scoreW: input.scoreW,
    });
  }

  private async upsertWeeklyScoreSnapshot(
    userId: string,
    weekRange: string,
    examWeekNumber: number,
    scores: { scoreR?: string; scoreL?: string; scoreW?: string },
  ): Promise<void> {
    if (!Types.ObjectId.isValid(userId) || !weekRange.trim()) return;
    const hasField =
      scores.scoreR !== undefined ||
      scores.scoreL !== undefined ||
      scores.scoreW !== undefined;
    if (!hasField) return;

    const existing = await this.weeklyScoreModel
      .findOne({
        userId: new Types.ObjectId(userId),
        weekRange: weekRange.trim(),
      })
      .exec();

    if (existing) {
      // Cho phép xóa điểm (chuỗi rỗng) khi ACA gửi field rõ ràng
      if (scores.scoreR !== undefined) existing.scoreR = scores.scoreR.trim();
      if (scores.scoreL !== undefined) existing.scoreL = scores.scoreL.trim();
      if (scores.scoreW !== undefined) existing.scoreW = scores.scoreW.trim();
      if (!existing.examWeekNumber) existing.examWeekNumber = examWeekNumber;
      await existing.save();
      return;
    }

    const hasScore =
      (scores.scoreR?.trim() ?? '') !== '' ||
      (scores.scoreL?.trim() ?? '') !== '' ||
      (scores.scoreW?.trim() ?? '') !== '';
    if (!hasScore) return;

    await this.weeklyScoreModel.create({
      userId: new Types.ObjectId(userId),
      weekRange: weekRange.trim(),
      examWeekNumber,
      scoreR: scores.scoreR?.trim() ?? '',
      scoreL: scores.scoreL?.trim() ?? '',
      scoreW: scores.scoreW?.trim() ?? '',
    });
  }

  async updateSchedule(
    payload: UpdatePracticeScheduleDto,
  ): Promise<PracticeSchedulePublic> {
    const normalized: Record<string, PracticeSlotOverride> = {};
    for (const id of PRACTICE_SLOT_IDS) {
      const base = PRACTICE_SLOT_DEFINITIONS.find((s) => s.id === id)!;
      const raw = payload.slots?.[id];
      const dayLabel = raw?.dayLabel?.trim() || base.dayLabel;
      const time = raw?.time?.trim() || base.time;
      const title = raw?.title?.trim() || base.title;
      const detail = raw?.detail?.trim() || base.detail;
      const dateNote = raw?.dateNote?.trim();
      const materialsUrl = raw?.materialsUrl?.trim();
      normalized[id] = {
        dayLabel: base.dayLabel,
        time,
        title,
        detail,
        ...(dateNote ? { dateNote } : {}),
        ...(materialsUrl ? { materialsUrl } : {}),
      };
    }

    const existing = await this.scheduleModel
      .findOne({ key: PRACTICE_SCHEDULE_KEY })
      .lean()
      .exec();
    const existingOverrides =
      (existing?.slotOverrides as Record<string, PracticeSlotOverride>) ?? {};
    for (const id of PRACTICE_SLOT_IDS) {
      if (payload.slots?.[id] === undefined && existingOverrides[id]) {
        normalized[id] = existingOverrides[id];
      }
    }

    const zoomId =
      payload.zoomId?.trim() ||
      existing?.zoomId?.trim() ||
      DEFAULT_PRACTICE_ZOOM_ID;
    const zoomPassword =
      payload.zoomPassword?.trim() ||
      existing?.zoomPassword?.trim() ||
      DEFAULT_PRACTICE_ZOOM_PASSWORD;

    const doc = await this.scheduleModel
      .findOneAndUpdate(
        { key: PRACTICE_SCHEDULE_KEY },
        {
          $set: {
            key: PRACTICE_SCHEDULE_KEY,
            weekRangeLabel: payload.weekRangeLabel?.trim() ?? existing?.weekRangeLabel?.trim() ?? '',
            slotOverrides: normalized,
            zoomId,
            zoomPassword,
          },
        },
        { upsert: true, returnDocument: 'after' },
      )
      .lean()
      .exec();

    return this.buildScheduleResponse(
      doc,
      (doc?.slotOverrides as Record<string, PracticeSlotOverride>) ?? normalized,
    );
  }

  async listRegistrations(
    userId: string,
    weekRange?: string,
  ): Promise<PracticeRegistrationPublic[]> {
    if (!Types.ObjectId.isValid(userId)) return [];
    const activeWeek = (weekRange || '').trim() || (await this.resolveActiveWeekRange());
    const rows = await this.registrationModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: 1 })
      .lean()
      .exec();
    return rows
      .filter((row) =>
        registrationMatchesWeekRange(
          {
            weekRange: row.weekRange,
            createdAt: (row as { createdAt?: Date }).createdAt,
          },
          activeWeek,
        ),
      )
      .map((row) => ({
        slotId: row.slotId as PracticeSlotId,
        registeredAt:
          (row as { createdAt?: Date }).createdAt?.toISOString() ??
          new Date(0).toISOString(),
        weekRange: String(row.weekRange || '').trim() || activeWeek,
        linkFolder: row.linkFolder?.trim() ?? '',
      }));
  }

  async updateZoom(payload: {
    zoomId?: string;
    zoomPassword?: string;
  }): Promise<PracticeSchedulePublic> {
    const zoomId = payload.zoomId?.trim() || DEFAULT_PRACTICE_ZOOM_ID;
    const zoomPassword = payload.zoomPassword?.trim() || DEFAULT_PRACTICE_ZOOM_PASSWORD;
    const doc = await this.scheduleModel
      .findOneAndUpdate(
        { key: PRACTICE_SCHEDULE_KEY },
        {
          $set: {
            key: PRACTICE_SCHEDULE_KEY,
            zoomId,
            zoomPassword,
          },
        },
        { upsert: true, returnDocument: 'after' },
      )
      .lean()
      .exec();
    const overrides =
      (doc?.slotOverrides as Record<string, PracticeSlotOverride>) ?? {};
    return this.buildScheduleResponse(doc, overrides);
  }

  async updateSlotMaterials(
    slotId: string,
    materialsUrl: string,
  ): Promise<PracticeSchedulePublic> {
    if (!isPracticeSlotId(slotId)) {
      throw new BadRequestException('slotId không hợp lệ');
    }
    const existing = await this.scheduleModel
      .findOne({ key: PRACTICE_SCHEDULE_KEY })
      .lean()
      .exec();
    const overrides =
      (existing?.slotOverrides as Record<string, PracticeSlotOverride>) ?? {};
    const base = PRACTICE_SLOT_DEFINITIONS.find((s) => s.id === slotId)!;
    const current = overrides[slotId] ?? {
      dayLabel: base.dayLabel,
      time: base.time,
      title: base.title,
      detail: base.detail,
    };
    overrides[slotId] = {
      ...current,
      materialsUrl: materialsUrl.trim(),
    };
    const doc = await this.scheduleModel
      .findOneAndUpdate(
        { key: PRACTICE_SCHEDULE_KEY },
        {
          $set: {
            key: PRACTICE_SCHEDULE_KEY,
            slotOverrides: overrides,
          },
        },
        { upsert: true, returnDocument: 'after' },
      )
      .lean()
      .exec();
    return this.buildScheduleResponse(
      doc,
      (doc?.slotOverrides as Record<string, PracticeSlotOverride>) ?? overrides,
    );
  }

  async updateStudentLinkFolder(
    studentId: string,
    linkFolder: string,
    weekRange?: string,
  ): Promise<{ linkFolder: string; weekRange: string }> {
    if (!Types.ObjectId.isValid(studentId)) {
      throw new BadRequestException('studentId không hợp lệ');
    }
    const normalized = linkFolder.trim();
    const activeWeek = (weekRange || '').trim() || (await this.resolveActiveWeekRange());
    const rows = await this.registrationModel
      .find({ userId: new Types.ObjectId(studentId) })
      .lean()
      .exec();
    const ids = rows
      .filter((row) =>
        registrationMatchesWeekRange(
          {
            weekRange: row.weekRange,
            createdAt: (row as { createdAt?: Date }).createdAt,
          },
          activeWeek,
        ),
      )
      .map((row) => row._id);
    if (ids.length === 0) {
      throw new BadRequestException(
        'Chưa có đăng ký lớp luyện đề tuần này — đăng ký ca trước khi gắn folder cá nhân',
      );
    }
    await this.registrationModel
      .updateMany({ _id: { $in: ids } }, { $set: { linkFolder: normalized } })
      .exec();
    return { linkFolder: normalized, weekRange: activeWeek };
  }

  /** Folder cá nhân theo tuần đang active — không lấy folder tuần cũ. */
  async getStudentLinkFolder(
    studentId: string,
    weekRange?: string,
  ): Promise<string> {
    if (!Types.ObjectId.isValid(studentId)) return '';
    const activeWeek = (weekRange || '').trim() || (await this.resolveActiveWeekRange());
    const rows = await this.registrationModel
      .find({ userId: new Types.ObjectId(studentId) })
      .lean()
      .exec();
    const match = rows.find(
      (row) =>
        registrationMatchesWeekRange(
          {
            weekRange: row.weekRange,
            createdAt: (row as { createdAt?: Date }).createdAt,
          },
          activeWeek,
        ) && Boolean(row.linkFolder?.trim()),
    );
    return match?.linkFolder?.trim() ?? '';
  }

  async registerSlot(
    userId: string,
    slotId: string,
  ): Promise<PracticeRegistrationPublic> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('userId không hợp lệ');
    }
    if (!isPracticeSlotId(slotId)) {
      throw new BadRequestException('slotId không hợp lệ');
    }
    const weekRange = await this.resolveActiveWeekRange();
    let existing = await this.registrationModel
      .findOne({
        userId: new Types.ObjectId(userId),
        slotId,
        weekRange,
      })
      .lean()
      .exec();
    if (!existing) {
      try {
        const created = await this.registrationModel.create({
          userId: new Types.ObjectId(userId),
          slotId,
          weekRange,
        });
        existing = created.toObject();
      } catch (err: unknown) {
        // Race: unique index hit — re-read
        existing = await this.registrationModel
          .findOne({
            userId: new Types.ObjectId(userId),
            slotId,
            weekRange,
          })
          .lean()
          .exec();
        if (!existing) throw err;
      }
    }
    try {
      await this.syncStudentPracticeSchedule(userId);
    } catch (err) {
      console.warn('Warning during syncStudentPracticeSchedule:', err);
    }
    const doc = existing as PracticeClassRegistration & { createdAt?: Date };
    return {
      slotId: doc.slotId as PracticeSlotId,
      registeredAt: doc.createdAt
        ? new Date(doc.createdAt).toISOString()
        : new Date().toISOString(),
      weekRange,
      linkFolder: doc.linkFolder?.trim() ?? '',
    };
  }

  async listAllRegistrationsForAca(
    weekRange?: string,
  ): Promise<PracticeRegistrationAcaPublic[]> {
    const activeWeek = (weekRange || '').trim() || (await this.resolveActiveWeekRange());
    const [rows, schedule] = await Promise.all([
      this.registrationModel.find().sort({ createdAt: -1 }).lean().exec(),
      this.getSchedule(),
    ]);
    const filtered = rows.filter((row) =>
      registrationMatchesWeekRange(
        {
          weekRange: row.weekRange,
          createdAt: (row as { createdAt?: Date }).createdAt,
        },
        activeWeek,
      ),
    );
    const userIds = [...new Set(filtered.map((row) => row.userId.toString()))];
    const names = await this.usersService.findNamesByIds(userIds);
    const slotById = Object.fromEntries(schedule.slots.map((slot) => [slot.id, slot]));

    return filtered.map((row: any) => {
      const studentId = row.userId.toString();
      const slot = slotById[row.slotId as PracticeSlotId];
      return {
        id: row._id.toString(),
        studentId,
        studentName: names.get(studentId) ?? studentId,
        slotId: row.slotId as PracticeSlotId,
        slotTitle: slot?.title ?? row.slotId,
        slotSchedule: slot ? `${slot.dayLabel} · ${slot.time}` : '—',
        registeredAt:
          (row as { createdAt?: Date }).createdAt?.toISOString() ??
          new Date(0).toISOString(),
        weekRange: String(row.weekRange || '').trim() || activeWeek,
        linkFolder: row.linkFolder ?? '',
        scoreR: row.scoreR ?? '',
        scoreL: row.scoreL ?? '',
        scoreW: row.scoreW ?? '',
      };
    });
  }

  async updateRegistrationDetails(
    registrationId: string,
    payload: {
      linkFolder?: string;
      scoreR?: string;
      scoreL?: string;
      scoreW?: string;
      weekRange?: string;
    },
  ): Promise<PracticeRegistrationAcaPublic> {
    if (!Types.ObjectId.isValid(registrationId)) {
      throw new BadRequestException('registrationId không hợp lệ');
    }
    const reg = await this.registrationModel.findById(registrationId).exec();
    if (!reg) {
      throw new NotFoundException('Không tìm thấy đăng ký');
    }

    const weeks = await this.listPracticeWeeksLean();
    const fromPayload = String(payload.weekRange || '').trim();
    const fromReg = String(reg.weekRange || '').trim();
    const fromCreated = resolveWeekRangeForTimestamp(
      (reg as { createdAt?: Date }).createdAt,
      weeks,
    );
    // Ưu tiên tuần ACA đang chọn → weekRange đã lưu → suy từ createdAt.
    // Không dùng resolveActiveWeekRange() để tránh điểm nhảy sang tuần hiện tại.
    const weekRange = fromPayload || fromReg || fromCreated;
    if (!weekRange) {
      throw new BadRequestException('Thiếu weekRange cho điểm tuần');
    }
    if (fromPayload) {
      const belongs = registrationMatchesWeekRange(
        {
          weekRange: reg.weekRange,
          createdAt: (reg as { createdAt?: Date }).createdAt,
        },
        fromPayload,
      );
      if (!belongs) {
        throw new BadRequestException(
          'Đăng ký không thuộc tuần đang chọn — không lưu điểm lệch tuần',
        );
      }
    }

    if (payload.linkFolder !== undefined) reg.linkFolder = payload.linkFolder.trim();
    if (payload.scoreR !== undefined) reg.scoreR = payload.scoreR.trim();
    if (payload.scoreL !== undefined) reg.scoreL = payload.scoreL.trim();
    if (payload.scoreW !== undefined) reg.scoreW = payload.scoreW.trim();
    reg.weekRange = weekRange;
    await reg.save();

    // Đồng bộ điểm/folder sang mọi slot cùng HV + cùng tuần (T3/T5/T7)
    const siblingSet: Record<string, string> = {};
    if (payload.linkFolder !== undefined) siblingSet.linkFolder = reg.linkFolder ?? '';
    if (payload.scoreR !== undefined) siblingSet.scoreR = reg.scoreR ?? '';
    if (payload.scoreL !== undefined) siblingSet.scoreL = reg.scoreL ?? '';
    if (payload.scoreW !== undefined) siblingSet.scoreW = reg.scoreW ?? '';
    if (Object.keys(siblingSet).length > 0) {
      await this.registrationModel
        .updateMany(
          {
            userId: reg.userId,
            weekRange,
            _id: { $ne: reg._id },
          },
          { $set: siblingSet },
        )
        .exec();
    }

    const week =
      weeks.find((w) => w.weekRange === weekRange) ??
      ({ weekRange } as PracticeWeekLean);
    const examWeekNumber = resolveExamWeekNumber(week, weeks);
    await this.upsertWeeklyScoreSnapshot(reg.userId.toString(), weekRange, examWeekNumber, {
      scoreR: payload.scoreR !== undefined ? reg.scoreR : undefined,
      scoreL: payload.scoreL !== undefined ? reg.scoreL : undefined,
      scoreW: payload.scoreW !== undefined ? reg.scoreW : undefined,
    });

    const [user, schedule] = await Promise.all([
      this.usersService.findPublicById(reg.userId.toString()),
      this.getSchedule(),
    ]);
    const slotById = Object.fromEntries(schedule.slots.map((slot) => [slot.id, slot]));
    const slot = slotById[reg.slotId as PracticeSlotId];

    return {
      id: reg._id.toString(),
      studentId: reg.userId.toString(),
      studentName: user?.name ?? reg.userId.toString(),
      slotId: reg.slotId as PracticeSlotId,
      slotTitle: slot?.title ?? reg.slotId,
      slotSchedule: slot ? `${slot.dayLabel} · ${slot.time}` : '—',
      registeredAt: (reg as any).createdAt?.toISOString() ?? new Date().toISOString(),
      weekRange,
      linkFolder: reg.linkFolder ?? '',
      scoreR: reg.scoreR ?? '',
      scoreL: reg.scoreL ?? '',
      scoreW: reg.scoreW ?? '',
    };
  }

  async unregisterSlot(userId: string, slotId: string): Promise<void> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('userId không hợp lệ');
    }
    if (!isPracticeSlotId(slotId)) {
      throw new BadRequestException('slotId không hợp lệ');
    }
    const weekRange = await this.resolveActiveWeekRange();
    const deleted = await this.registrationModel
      .deleteOne({
        userId: new Types.ObjectId(userId),
        slotId,
        weekRange,
      })
      .exec();
    // Legacy: bản ghi cũ chưa có weekRange — chỉ xóa nếu thuộc tuần hiện tại
    if (deleted.deletedCount === 0) {
      const legacy = await this.registrationModel
        .find({
          userId: new Types.ObjectId(userId),
          slotId,
          $or: [{ weekRange: { $exists: false } }, { weekRange: '' }],
        })
        .lean()
        .exec();
      const ids = legacy
        .filter((row) =>
          registrationMatchesWeekRange(
            {
              weekRange: row.weekRange,
              createdAt: (row as { createdAt?: Date }).createdAt,
            },
            weekRange,
          ),
        )
        .map((row) => row._id);
      if (ids.length > 0) {
        await this.registrationModel.deleteMany({ _id: { $in: ids } }).exec();
      }
    }
    try {
      await this.syncStudentPracticeSchedule(userId);
    } catch (err) {
      console.warn('Warning during syncStudentPracticeSchedule:', err);
    }
  }
}
