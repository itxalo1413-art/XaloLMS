import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UsersService } from '../users/users.service';
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

import { AcaPracticeStudent, AcaPracticeStudentDocument } from '../aca/schemas/aca-practice-student.schema';
import { AcaStudent, AcaStudentDocument } from '../aca/schemas/aca-student.schema';

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

export type PracticeRegistrationAcaPublic = {
  studentId: string;
  studentName: string;
  slotId: PracticeSlotId;
  slotTitle: string;
  slotSchedule: string;
  registeredAt: string;
};

@Injectable()
export class PracticeClassService {
  constructor(
    @InjectModel(PracticeClassSchedule.name)
    private readonly scheduleModel: Model<PracticeClassScheduleDocument>,
    @InjectModel(PracticeClassRegistration.name)
    private readonly registrationModel: Model<PracticeClassRegistrationDocument>,
    @InjectModel(AcaPracticeStudent.name)
    private readonly practiceStudentModel: Model<AcaPracticeStudentDocument>,
    @InjectModel(AcaStudent.name)
    private readonly acaStudentModel: Model<AcaStudentDocument>,
    private readonly usersService: UsersService,
  ) {}

  private async syncStudentPracticeSchedule(userId: string): Promise<void> {
    try {
      // 1. Get the current active weekRangeLabel from the schedule doc
      const scheduleDoc = await this.scheduleModel.findOne({ key: PRACTICE_SCHEDULE_KEY }).lean().exec();
      let currentWeekRange = scheduleDoc?.weekRangeLabel?.trim() || '';
      
      // Fallback to the latest week from aca_practice_weeks if empty
      if (!currentWeekRange) {
        const weeksColl = this.scheduleModel.db.collection('aca_practice_weeks');
        const latestWeeks = await weeksColl.find({}).sort({ _id: -1 }).limit(1).toArray();
        if (latestWeeks && latestWeeks.length > 0 && latestWeeks[0].weekRange) {
          currentWeekRange = latestWeeks[0].weekRange.trim();
        }
      }
      
      if (!currentWeekRange) return;

      // 2. Get user info
      const user = await this.usersService.findPublicById(userId);
      if (!user) return;

      // 3. Find any matching AcaStudent to see if we have their phone number
      const acaStudent = await this.acaStudentModel.findOne({ email: user.email }).lean().exec();
      const phone = acaStudent?.phone || '';

      // 4. Find all practice registrations for this student
      const registrations = await this.registrationModel.find({ userId: new Types.ObjectId(userId) }).lean().exec();
      const registeredSlotIds = new Set(registrations.map(r => r.slotId));

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
    return {
      ...base,
      dayLabel: override.dayLabel?.trim() || base.dayLabel,
      time: override.time?.trim() || base.time,
      title: override.title?.trim() || base.title,
      detail: override.detail?.trim() || base.detail,
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
      const title = raw?.title?.trim() || base.title;
      const detail = raw?.detail?.trim() || base.detail;
      const dateNote = raw?.dateNote?.trim();
      normalized[id] = {
        dayLabel,
        time,
        title,
        detail,
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
        { upsert: true, returnDocument: 'after' },
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
    let existing = await this.registrationModel
      .findOne({
        userId: new Types.ObjectId(userId),
        slotId,
      })
      .lean()
      .exec();
    if (!existing) {
      const created = await this.registrationModel.create({
        userId: new Types.ObjectId(userId),
        slotId,
      });
      existing = created.toObject();
    }
    try {
      await this.syncStudentPracticeSchedule(userId);
    } catch (err) {
      console.warn('Warning during syncStudentPracticeSchedule:', err);
    }
    const doc = existing as PracticeClassRegistration & { createdAt?: Date };
    return {
      slotId: doc.slotId as PracticeSlotId,
      registeredAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
    };
  }

  async listAllRegistrationsForAca(): Promise<PracticeRegistrationAcaPublic[]> {
    const [rows, schedule] = await Promise.all([
      this.registrationModel.find().sort({ createdAt: -1 }).lean().exec(),
      this.getSchedule(),
    ]);
    const userIds = [...new Set(rows.map((row) => row.userId.toString()))];
    const names = await this.usersService.findNamesByIds(userIds);
    const slotById = Object.fromEntries(schedule.slots.map((slot) => [slot.id, slot]));

    return rows.map((row) => {
      const studentId = row.userId.toString();
      const slot = slotById[row.slotId as PracticeSlotId];
      return {
        studentId,
        studentName: names.get(studentId) ?? studentId,
        slotId: row.slotId as PracticeSlotId,
        slotTitle: slot?.title ?? row.slotId,
        slotSchedule: slot ? `${slot.dayLabel} · ${slot.time}` : '—',
        registeredAt:
          (row as { createdAt?: Date }).createdAt?.toISOString() ??
          new Date(0).toISOString(),
      };
    });
  }

  async unregisterSlot(userId: string, slotId: string): Promise<void> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('userId không hợp lệ');
    }
    if (!isPracticeSlotId(slotId)) {
      throw new BadRequestException('slotId không hợp lệ');
    }
    await this.registrationModel
      .deleteOne({
        userId: new Types.ObjectId(userId),
        slotId,
      })
      .exec();
    try {
      await this.syncStudentPracticeSchedule(userId);
    } catch (err) {
      console.warn('Warning during syncStudentPracticeSchedule:', err);
    }
  }
}
