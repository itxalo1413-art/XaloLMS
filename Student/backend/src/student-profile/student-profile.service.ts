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
import { AcaStudent, AcaStudentDocument } from '../aca/schemas/aca-student.schema';
import { AcaClass, AcaClassDocument } from '../aca/schemas/aca-class.schema';

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
    @InjectModel(AcaStudent.name)
    private readonly acaStudentModel: Model<AcaStudentDocument>,
    @InjectModel(AcaClass.name)
    private readonly acaClassModel: Model<AcaClassDocument>,
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
        { upsert: true, returnDocument: 'after' },
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

  async getStudentDiagnosis(email: string) {
    if (!email) return null;
    const cleanEmail = email.trim().toLowerCase();
    
    // Find AcaStudent matching the email
    const student = await this.acaStudentModel
      .findOne({ email: cleanEmail })
      .lean()
      .exec();

    if (!student) {
      return null;
    }

    // Map database fields to the frontend structure
    return {
      name: student.name,
      email: student.email,
      phone: student.phone,
      classId: student.classId,
      bcbLink: student.bcbLink || '',
      scores: {
        listening: student.scores?.l !== undefined && student.scores?.l !== '-' ? Number(student.scores.l) : 0,
        reading: student.scores?.r !== undefined && student.scores?.r !== '-' ? Number(student.scores.r) : 0,
        writing: student.scores?.w !== undefined && student.scores?.w !== '-' ? Number(student.scores.w) : 0,
        speaking: student.scores?.s !== undefined && student.scores?.s !== '-' ? Number(student.scores.s) : 0,
        overall: student.scores?.o !== undefined && student.scores?.o !== '-' ? Number(student.scores.o) : 0,
      },
      finalScores: {
        listening: student.finalScores?.l !== undefined && student.finalScores?.l !== '-' ? Number(student.finalScores.l) : 0,
        reading: student.finalScores?.r !== undefined && student.finalScores?.r !== '-' ? Number(student.finalScores.r) : 0,
        writing: student.finalScores?.w !== undefined && student.finalScores?.w !== '-' ? Number(student.finalScores.w) : 0,
        speaking: student.finalScores?.s !== undefined && student.finalScores?.s !== '-' ? Number(student.finalScores.s) : 0,
        overall: student.finalScores?.o !== undefined && student.finalScores?.o !== '-' ? Number(student.finalScores.o) : 0,
      }
    };
  }

  async getClassInfoForStudent(email: string) {
    const defaultInfo = {
      course: 'Offline Momentum',
      instructor: 'Nghiêm Doãn Quỳnh Châu',
      room: 'Phòng 3.1',
      zoomPassword: '—',
      schedule: [
        'Thứ 3: 19h45 - 21h30',
        'Thứ 5: 19h45 - 21h30',
        'Thứ 7: 19h45 - 21h30',
      ],
      phases: [
        { name: 'Chặng 1: Speaking - Reading', date: '09/10/2025' },
        { name: 'Chặng 2: Writing - Listening', date: '30/04/2026' },
      ],
      openDate: '09/10/2025',
      endDate: '27/05/2026',
    };

    if (!email) return defaultInfo;

    const student = await this.acaStudentModel
      .findOne({ email: email.trim().toLowerCase() })
      .lean()
      .exec();

    if (!student) {
      return defaultInfo;
    }

    let cls: AcaClass | null = null;
    if (student.classId && Types.ObjectId.isValid(student.classId)) {
      cls = await this.acaClassModel.findById(student.classId).lean().exec();
    }
    if (!cls && (student.l1 || student.l2 || student.l3)) {
      const code = (student.l1 || student.l2 || student.l3 || '').trim();
      const codeBase = code.replace(/-\d+$/i, '');
      if (codeBase) {
        cls = await this.acaClassModel
          .findOne({
            $or: [
              { classCode: new RegExp(`^${codeBase}$`, 'i') },
              { name: new RegExp(codeBase, 'i') },
            ],
          })
          .lean()
          .exec();
      }
    }

    const phases: { name: string; date: string }[] = [];
    if (cls) {
      if (cls.currentPhase || cls.phaseStartDate || cls.openDate) {
        phases.push({
          name: cls.currentPhase || 'Chặng 1: Speaking - Reading',
          date: cls.phaseStartDate || cls.openDate || '09/10/2025',
        });
      }
      if (cls.nextPhase || cls.nextPhaseStartDate) {
        phases.push({
          name: cls.nextPhase || 'Chặng 2: Writing - Listening',
          date: cls.nextPhaseStartDate || '30/04/2026',
        });
      }
    }

    if (phases.length === 0) {
      phases.push(
        { name: 'Chặng 1: Speaking - Reading', date: cls?.openDate || '09/10/2025' },
        { name: 'Chặng 2: Writing - Listening', date: '30/04/2026' },
      );
    }

    const className = cls?.name || cls?.classCode || '';
    const is357 = className.includes('357');
    const classSchedule = is357
      ? [
          'Thứ 3: 19h45 - 21h30',
          'Thứ 5: 19h45 - 21h30',
          'Thứ 7: 19h45 - 21h30',
        ]
      : [
          'Thứ 2: 19h45 - 21h30',
          'Thứ 4: 19h45 - 21h30',
          'Thứ 6: 19h45 - 21h30',
        ];

    return {
      course: cls?.name || 'Offline Momentum',
      instructor: cls?.teacher || 'Nghiêm Doãn Quỳnh Châu',
      room: 'Phòng 3.1',
      zoomPassword: '—',
      schedule: classSchedule,
      phases,
      openDate: cls?.openDate || '09/10/2025',
      endDate: cls?.endDate || '27/05/2026',
    };
  }
}
