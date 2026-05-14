import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UpdateStudentProfileDto } from './dto/update-student-profile.dto';
import {
  isAllowedStudyValue,
  type StudySelectionField,
} from './student-profile-study-options';
import {
  StudentProfileStore,
  type StudentProfileStoreDocument,
} from './schemas/student-profile-store.schema';
import {
  DEFAULT_STUDENT_PROFILE,
  type StudentProfile,
} from './student-profile.types';

const STUDY_FIELDS: StudySelectionField[] = [
  'method',
  'weeklyHours',
  'classEnvironment',
  'ieltsMeaning',
  'previousBand',
  'focusSkills',
];

const SINGLETON_KEY = 'default';

@Injectable()
export class StudentProfileService {
  constructor(
    @InjectModel(StudentProfileStore.name)
    private readonly store: Model<StudentProfileStoreDocument>,
  ) {}

  private mergeWithDefaults(
    stored: Record<string, unknown> | undefined,
  ): StudentProfile {
    return {
      ...DEFAULT_STUDENT_PROFILE,
      ...(stored ?? {}),
    };
  }

  async getProfile(): Promise<StudentProfile> {
    const doc = await this.store
      .findOne({ singletonKey: SINGLETON_KEY })
      .lean()
      .exec();
    return this.mergeWithDefaults(doc?.profileData);
  }

  async updateProfile(
    payload: UpdateStudentProfileDto,
  ): Promise<StudentProfile> {
    for (const field of STUDY_FIELDS) {
      const raw = payload[field];
      if (raw === undefined || raw === null) continue;
      if (typeof raw !== 'string' || !isAllowedStudyValue(field, raw)) {
        throw new BadRequestException(
          `Giá trị không hợp lệ cho trường: ${field}`,
        );
      }
    }
    const current = await this.getProfile();
    const next = {
      ...current,
      ...payload,
    } as StudentProfile;
    await this.store
      .findOneAndUpdate(
        { singletonKey: SINGLETON_KEY },
        {
          $set: { profileData: { ...next } },
          $setOnInsert: { singletonKey: SINGLETON_KEY },
        },
        { upsert: true, new: true },
      )
      .exec();
    return next;
  }

  async updateAvatar(file: Express.Multer.File): Promise<StudentProfile> {
    const mime = file.mimetype || 'image/png';
    const base64 = file.buffer.toString('base64');
    const avatarUrl = `data:${mime};base64,${base64}`;
    const current = await this.getProfile();
    const next: StudentProfile = {
      ...current,
      avatarUrl,
    };
    await this.store
      .findOneAndUpdate(
        { singletonKey: SINGLETON_KEY },
        {
          $set: { profileData: { ...next } },
          $setOnInsert: { singletonKey: SINGLETON_KEY },
        },
        { upsert: true, new: true },
      )
      .exec();
    return next;
  }
}
