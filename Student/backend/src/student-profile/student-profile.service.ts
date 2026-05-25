import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UsersService } from '../users/users.service';
import { isAllowedAvatarImageMime } from './avatar-image.util';
import { UpdateStudentProfileDto } from './dto/update-student-profile.dto';
import {
  StudentProfileStore,
  type StudentProfileStoreDocument,
} from './schemas/student-profile-store.schema';
import {
  isAllowedStudyValue,
  type StudySelectionField,
} from './student-profile-study-options';
import { normalizeFocusSkills, parseFocusSkillsPayload } from './focus-skills.util';
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

@Injectable()
export class StudentProfileService {
  private readonly logger = new Logger(StudentProfileService.name);

  constructor(
    @InjectModel(StudentProfileStore.name)
    private readonly store: Model<StudentProfileStoreDocument>,
    private readonly users: UsersService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  private mergeWithDefaults(
    stored: Record<string, unknown> | undefined,
  ): StudentProfile {
    const merged = {
      ...DEFAULT_STUDENT_PROFILE,
      ...(stored ?? {}),
    } as StudentProfile;
    merged.focusSkills = normalizeFocusSkills(
      stored?.focusSkills ?? merged.focusSkills,
    );
    if (merged.focusSkills.length === 0) {
      merged.focusSkills = [...DEFAULT_STUDENT_PROFILE.focusSkills];
    }
    return merged;
  }

  private async defaultForUser(userId: string): Promise<StudentProfile> {
    const base = { ...DEFAULT_STUDENT_PROFILE };
    try {
      const user = await this.users.getPublicById(userId);
      base.name = user.name;
      base.email = user.email;
    } catch {
      // keep defaults
    }
    return base;
  }

  async getProfile(userId: string): Promise<StudentProfile> {
    if (!Types.ObjectId.isValid(userId)) {
      return this.defaultForUser(userId);
    }
    const doc = await this.store
      .findOne({ userId: new Types.ObjectId(userId) })
      .lean()
      .exec();
    if (!doc?.profileData) {
      return this.defaultForUser(userId);
    }
    return this.mergeWithDefaults(doc.profileData);
  }

  private async persist(userId: string, next: StudentProfile): Promise<StudentProfile> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('userId không hợp lệ');
    }
    await this.store
      .findOneAndUpdate(
        { userId: new Types.ObjectId(userId) },
        {
          $set: { profileData: { ...next } },
          $setOnInsert: { userId: new Types.ObjectId(userId) },
        },
        { upsert: true, new: true },
      )
      .exec();
    return next;
  }

  async updateProfile(
    userId: string,
    payload: UpdateStudentProfileDto,
  ): Promise<StudentProfile> {
    for (const field of STUDY_FIELDS) {
      if (field === 'focusSkills') continue;
      const raw = payload[field];
      if (raw === undefined || raw === null) continue;
      if (typeof raw !== 'string' || !isAllowedStudyValue(field, raw)) {
        throw new BadRequestException(
          `Giá trị không hợp lệ cho trường: ${field}`,
        );
      }
    }
    const focusSkillsUpdate = parseFocusSkillsPayload(payload.focusSkills);
    if (payload.focusSkills !== undefined && focusSkillsUpdate === undefined) {
      throw new BadRequestException(
        'Giá trị không hợp lệ cho trường: focusSkills',
      );
    }
    const current = await this.getProfile(userId);
    const { focusSkills: _fs, ...rest } = payload;
    const next = {
      ...current,
      ...rest,
      ...(focusSkillsUpdate !== undefined
        ? { focusSkills: focusSkillsUpdate }
        : {}),
    } as StudentProfile;
    return this.persist(userId, next);
  }

  async updateAvatar(
    userId: string,
    file: Express.Multer.File,
  ): Promise<StudentProfile> {
    const mime = file.mimetype || '';
    if (!isAllowedAvatarImageMime(mime)) {
      throw new BadRequestException(
        'Chỉ chấp nhận ảnh: JPEG, PNG, GIF, WebP, SVG.',
      );
    }
    let avatarUrl: string;
    if (this.cloudinary.isConfigured()) {
      try {
        avatarUrl = await this.cloudinary.uploadAvatar(userId, file);
      } catch (err) {
        this.logger.warn(
          `Cloudinary upload failed, fallback base64: ${err instanceof Error ? err.message : err}`,
        );
        const base64 = file.buffer.toString('base64');
        avatarUrl = `data:${mime.split(';')[0]};base64,${base64}`;
      }
    } else {
      const base64 = file.buffer.toString('base64');
      avatarUrl = `data:${mime.split(';')[0]};base64,${base64}`;
    }
    const current = await this.getProfile(userId);
    const next: StudentProfile = {
      ...current,
      avatarUrl,
    };
    return this.persist(userId, next);
  }
}
