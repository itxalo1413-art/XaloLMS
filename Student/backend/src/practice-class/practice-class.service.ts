import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UpdatePracticeScheduleDto } from './dto/update-practice-schedule.dto';
import {
  isPracticeSlotId,
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

export type PracticeClassSlotPublic = PracticeSlotDefinition & {
  dateNote?: string;
};

export type PracticeSchedulePublic = {
  weekRangeLabel: string;
  updatedAt: string | null;
  slots: PracticeClassSlotPublic[];
};

export type PracticeRegistrationPublic = {
  slotId: PracticeSlotId;
  registeredAt: string;
};

@Injectable()
export class PracticeClassService {
  constructor(
    @InjectModel(PracticeClassSchedule.name)
    private readonly scheduleModel: Model<PracticeClassScheduleDocument>,
    @InjectModel(PracticeClassRegistration.name)
    private readonly registrationModel: Model<PracticeClassRegistrationDocument>,
  ) {}

  private mergeSlot(
    base: PracticeSlotDefinition,
    override?: PracticeSlotOverride,
  ): PracticeClassSlotPublic {
    if (!override) return { ...base };
    const dateNote = override.dateNote?.trim();
    return {
      ...base,
      dayLabel: override.dayLabel?.trim() || base.dayLabel,
      time: override.time?.trim() || base.time,
      ...(dateNote ? { dateNote } : {}),
    };
  }

  private buildScheduleResponse(
    doc: { weekRangeLabel?: string; updatedAt?: Date } | null,
    overrides: Record<string, PracticeSlotOverride>,
  ): PracticeSchedulePublic {
    return {
      weekRangeLabel: doc?.weekRangeLabel?.trim() ?? '',
      updatedAt: doc?.updatedAt?.toISOString() ?? null,
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
    return this.buildScheduleResponse(doc, overrides);
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
      const dateNote = raw?.dateNote?.trim();
      normalized[id] = {
        dayLabel,
        time,
        ...(dateNote ? { dateNote } : {}),
      };
    }

    const doc = await this.scheduleModel
      .findOneAndUpdate(
        { key: PRACTICE_SCHEDULE_KEY },
        {
          $set: {
            key: PRACTICE_SCHEDULE_KEY,
            weekRangeLabel: payload.weekRangeLabel?.trim() ?? '',
            slotOverrides: normalized,
          },
        },
        { upsert: true, new: true },
      )
      .lean()
      .exec();

    return this.buildScheduleResponse(
      doc,
      (doc?.slotOverrides as Record<string, PracticeSlotOverride>) ?? normalized,
    );
  }

  async listRegistrations(userId: string): Promise<PracticeRegistrationPublic[]> {
    if (!Types.ObjectId.isValid(userId)) return [];
    const rows = await this.registrationModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: 1 })
      .lean()
      .exec();
    return rows.map((row) => ({
      slotId: row.slotId as PracticeSlotId,
      registeredAt:
        (row as { createdAt?: Date }).createdAt?.toISOString() ??
        new Date(0).toISOString(),
    }));
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
    const existing = await this.registrationModel
      .findOne({
        userId: new Types.ObjectId(userId),
        slotId,
      })
      .lean()
      .exec();
    if (existing) {
      throw new ConflictException('Đã đăng ký buổi này');
    }
    const created = await this.registrationModel.create({
      userId: new Types.ObjectId(userId),
      slotId,
    });
    const doc = created.toObject() as PracticeClassRegistration & {
      createdAt?: Date;
    };
    return {
      slotId: doc.slotId as PracticeSlotId,
      registeredAt: doc.createdAt?.toISOString() ?? new Date().toISOString(),
    };
  }

  async unregisterSlot(userId: string, slotId: string): Promise<void> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('userId không hợp lệ');
    }
    if (!isPracticeSlotId(slotId)) {
      throw new BadRequestException('slotId không hợp lệ');
    }
    const result = await this.registrationModel
      .deleteOne({
        userId: new Types.ObjectId(userId),
        slotId,
      })
      .exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException('Chưa đăng ký buổi này');
    }
  }
}
