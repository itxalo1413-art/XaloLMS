import { BadRequestException, Injectable, Logger, OnModuleInit } from '@nestjs/common';
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
  sanitizeStudyString,
  studyStringOrDefault,
  type StudySelectionField,
} from './student-profile-study-options';
import { normalizeFocusSkills, parseFocusSkillsPayload } from './focus-skills.util';
import {
  DEFAULT_STUDENT_PROFILE,
  type StudentProfile,
} from './student-profile.types';
import { AcaStudent, AcaStudentDocument } from '../aca/schemas/aca-student.schema';
import { AcaClass, AcaClassDocument } from '../aca/schemas/aca-class.schema';
import { Aca11Class, Aca11ClassDocument } from '../aca/schemas/aca-11-class.schema';
import {
  CourseSettings,
  CourseSettingsDocument,
} from '../aca/schemas/course-settings.schema';
import {
  GuestDiagnosisLead,
  GuestDiagnosisLeadDocument,
} from '../aca/schemas/guest-diagnosis-lead.schema';

const STUDY_FIELDS: StudySelectionField[] = [
  'method',
  'weeklyHours',
  'classEnvironment',
  'ieltsMeaning',
  'previousBand',
  'focusSkills',
];

@Injectable()
export class StudentProfileService implements OnModuleInit {
  private readonly logger = new Logger(StudentProfileService.name);

  constructor(
    @InjectModel(StudentProfileStore.name)
    private readonly store: Model<StudentProfileStoreDocument>,
    @InjectModel(AcaStudent.name)
    private readonly acaStudentModel: Model<AcaStudentDocument>,
    @InjectModel(AcaClass.name)
    private readonly acaClassModel: Model<AcaClassDocument>,
    @InjectModel(Aca11Class.name)
    private readonly aca11Model: Model<Aca11ClassDocument>,
    @InjectModel(CourseSettings.name)
    private readonly courseSettingsModel: Model<CourseSettingsDocument>,
    @InjectModel(GuestDiagnosisLead.name)
    private readonly guestLeadModel: Model<GuestDiagnosisLeadDocument>,
    private readonly users: UsersService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  async onModuleInit() {
    try {
      await this.store.collection.dropIndex('singletonKey_1');
      this.logger.log('Dropped obsolete unique index student_profiles.singletonKey_1');
    } catch (err) {
      const code = (err as { code?: number; codeName?: string })?.code;
      const codeName = (err as { codeName?: string })?.codeName;
      if (code !== 27 && codeName !== 'IndexNotFound') {
        this.logger.warn(
          `Could not drop student_profiles.singletonKey_1: ${(err as Error).message}`,
        );
      }
    }
  }

  private digits(value?: string | null): string {
    return String(value || '').replace(/\D/g, '');
  }

  private normalizeName(value?: string | null): string {
    return String(value || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ');
  }

  private namesFit(a?: string | null, b?: string | null): boolean {
    const na = this.normalizeName(a);
    const nb = this.normalizeName(b);
    if (!na || !nb) return false;
    return na === nb || na.includes(nb) || nb.includes(na);
  }

  private escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /** Khớp học viên: (tên + email) hoặc (tên + SĐT). Không bắt buộc đủ 3. */
  private async findAcaStudent(identity: {
    email?: string;
    name?: string;
    phone?: string;
  }): Promise<(AcaStudent & { _id: Types.ObjectId }) | null> {
    const email = (identity.email || '').trim().toLowerCase();
    const name = (identity.name || '').trim();
    const phoneTail = this.digits(identity.phone).slice(-9);
    const hasName = Boolean(name);
    const hasEmail = Boolean(email);
    const hasPhone = phoneTail.length >= 9;

    if (hasEmail) {
      const byEmail = await this.acaStudentModel
        .findOne({
          email: new RegExp(`^${this.escapeRegex(email)}$`, 'i'),
        })
        .lean()
        .exec();
      if (byEmail) {
        return byEmail as AcaStudent & { _id: Types.ObjectId };
      }
    }

    if (hasName && hasPhone) {
      const candidates = await this.acaStudentModel
        .find({ phone: { $exists: true, $ne: '' } })
        .lean()
        .exec();
      const hit = candidates.find(
        (s) =>
          this.digits(s.phone).slice(-9) === phoneTail &&
          this.namesFit(s.name, name),
      );
      if (hit) return hit as AcaStudent & { _id: Types.ObjectId };
    }

    return null;
  }

  private async findAcaStudentByEmail(email?: string) {
    const clean = (email || '').trim().toLowerCase();
    if (!clean) return null;
    const byEmail = await this.acaStudentModel
      .findOne({ email: new RegExp(`^${this.escapeRegex(clean)}$`, 'i') })
      .lean()
      .exec();
    return (byEmail as (AcaStudent & { _id: Types.ObjectId }) | null) ?? null;
  }

  private async findAcaStudentById(studentId?: string) {
    const id = String(studentId || '').trim();
    if (!id || !Types.ObjectId.isValid(id)) return null;
    const doc = await this.acaStudentModel.findById(id).lean().exec();
    return (doc as (AcaStudent & { _id: Types.ObjectId }) | null) ?? null;
  }

  /** Ưu tiên studentId (ổn định khi đổi email), sau đó email / tên+SĐT. */
  private async resolveAcaStudent(identity: {
    studentId?: string;
    email?: string;
    name?: string;
    phone?: string;
  }): Promise<(AcaStudent & { _id: Types.ObjectId }) | null> {
    const byId = await this.findAcaStudentById(identity.studentId);
    if (byId) return byId;
    return this.findAcaStudent({
      email: identity.email,
      name: identity.name,
      phone: identity.phone,
    });
  }

  private async findLeadDiagnosis(identity: {
    email?: string;
    name?: string;
    phone?: string;
  }): Promise<Record<string, unknown> | null> {
    const email = (identity.email || '').trim().toLowerCase();
    const name = (identity.name || '').trim();
    const phoneTail = this.digits(identity.phone).slice(-9);
    const hasName = Boolean(name);
    const hasEmail = Boolean(email);
    const hasPhone = phoneTail.length >= 9;

    if (!hasName || (!hasEmail && !hasPhone)) return null;

    const or: Record<string, unknown>[] = [];
    if (hasEmail) {
      or.push({ email: new RegExp(`^${this.escapeRegex(email)}$`, 'i') });
    }
    if (hasName) {
      or.push({ name: new RegExp(this.escapeRegex(name), 'i') });
    }

    const leads = await this.guestLeadModel
      .find(or.length ? { $or: or } : {})
      .sort({ updatedAt: -1 })
      .limit(40)
      .lean()
      .exec();

    const match = leads.find((l) => {
      if (!this.namesFit(l.name, name)) return false;
      if (hasEmail && (l.email || '').trim().toLowerCase() === email) return true;
      if (hasPhone && this.digits(l.phone).slice(-9) === phoneTail) return true;
      return false;
    });
    if (!match) return null;
    const diagnosis = (match as { diagnosis?: Record<string, unknown> | null })
      .diagnosis;
    if (diagnosis && typeof diagnosis === 'object') {
      return {
        ...diagnosis,
        aim: (diagnosis as { aim?: string }).aim || match.aim || '',
      };
    }
    if (match.aim) return { aim: match.aim };
    return null;
  }

  private stripDeprecatedBcbFields(
    data: Record<string, unknown> | null | undefined,
  ): Record<string, unknown> {
    if (!data || typeof data !== 'object') return {};
    const next = { ...data };
    delete next.bcbLink;
    delete next.listeningLink;
    delete next.readingLink;
    delete next.bcbGrammar;
    return next;
  }

  private hasSpeakingBcb(data: unknown): boolean {
    if (!data || typeof data !== 'object') return false;
    const d = data as Record<string, unknown>;
    const c = d.speakingCriteria as
      | {
          fluencyCoherence?: number;
          lexicalResource?: number;
          grammaticalRangeAccuracy?: number;
          pronunciation?: number;
        }
      | undefined;
    const scores = [
      Number(c?.fluencyCoherence || 0),
      Number(c?.lexicalResource || 0),
      Number(c?.grammaticalRangeAccuracy || 0),
      Number(c?.pronunciation || 0),
    ];
    const text = String(
      (d.skillSummaries as { speaking?: string } | undefined)?.speaking || '',
    ).trim();
    return scores.some((n) => n > 0) || text.length > 0;
  }

  private hasOverviewBcb(data: unknown): boolean {
    if (!data || typeof data !== 'object') return false;
    const d = data as Record<string, unknown>;
    return Boolean(
      String(d.bcbOverviewTitle || '').trim() ||
        String(d.bcbOverviewSummary || '').trim(),
    );
  }

  private hasListeningReadingBcb(data: unknown): boolean {
    if (!data || typeof data !== 'object') return false;
    const d = data as Record<string, unknown>;
    const summaries = d.skillSummaries as
      | { listening?: string; reading?: string }
      | undefined;
    const listeningRows = d.bcbListening as unknown[] | undefined;
    const readingRows = d.bcbReading as unknown[] | undefined;
    return Boolean(
      String(summaries?.listening || '').trim() ||
        String(summaries?.reading || '').trim() ||
        listeningRows?.length ||
        readingRows?.length,
    );
  }

  private hasWritingBcb(data: unknown): boolean {
    if (!data || typeof data !== 'object') return false;
    const d = data as Record<string, unknown>;
    const wc = d.writingCriteria as
      | { task1?: { taskAchievement?: number }; task2?: { taskResponse?: number } }
      | undefined;
    const ws = d.writingSummary as { task1?: string; task2?: string } | undefined;
    return (
      Number(wc?.task1?.taskAchievement || 0) > 0 ||
      Number(wc?.task2?.taskResponse || 0) > 0 ||
      Boolean(String(ws?.task1 || '').trim()) ||
      Boolean(String(ws?.task2 || '').trim())
    );
  }

  private diagnosisRichness(data: unknown): number {
    if (!data || typeof data !== 'object') return 0;
    const d = data as Record<string, unknown>;
    let n = Object.keys(d).length;
    if (this.hasWritingBcb(d)) n += 150;
    if (this.hasSpeakingBcb(d)) n += 80;
    if (this.hasOverviewBcb(d)) n += 40;
    if (this.hasListeningReadingBcb(d)) n += 60;
    return n;
  }

  private async loadDiagnosisDoc(
    studentId: Types.ObjectId,
    userId?: string,
  ) {
    const ids: Types.ObjectId[] = [studentId];
    if (userId && Types.ObjectId.isValid(userId)) {
      ids.push(new Types.ObjectId(userId));
    }
    const docs = await this.store
      .find({ userId: { $in: ids } })
      .lean()
      .exec();
    if (!docs.length) return null;
    const merged: Record<string, unknown> = {};
    const ranked = [...docs].sort(
      (a, b) =>
        this.diagnosisRichness((a as { diagnosisData?: unknown }).diagnosisData) -
        this.diagnosisRichness((b as { diagnosisData?: unknown }).diagnosisData),
    );
    for (const doc of ranked) {
      const payload = (doc as { diagnosisData?: unknown }).diagnosisData;
      if (payload && typeof payload === 'object') {
        Object.assign(merged, payload);
      }
    }
    const richest = ranked[ranked.length - 1] as {
      diagnosisData?: unknown;
      profileData?: unknown;
    };
    let profileData =
      (richest.profileData && typeof richest.profileData === 'object'
        ? { ...(richest.profileData as Record<string, unknown>) }
        : {}) as Record<string, unknown>;
    for (const doc of ranked) {
      const pd = (doc as { profileData?: Record<string, unknown> }).profileData;
      if (!pd || typeof pd !== 'object') continue;
      const exam = String(pd.examDate || '').trim();
      if (exam) profileData = { ...profileData, ...pd, examDate: exam };
    }
    return {
      profileData,
      diagnosisData: Object.keys(merged).length ? merged : richest.diagnosisData,
    };
  }

  private mergeWithDefaults(
    stored: Record<string, unknown> | undefined,
  ): StudentProfile {
    const merged = {
      ...DEFAULT_STUDENT_PROFILE,
      ...(stored ?? {}),
    } as StudentProfile;
    merged.method = studyStringOrDefault('method', merged.method);
    merged.weeklyHours = studyStringOrDefault('weeklyHours', merged.weeklyHours);
    merged.classEnvironment = studyStringOrDefault(
      'classEnvironment',
      merged.classEnvironment,
    );
    merged.ieltsMeaning = studyStringOrDefault('ieltsMeaning', merged.ieltsMeaning);
    merged.previousBand = studyStringOrDefault('previousBand', merged.previousBand);
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

  async getProfile(
    userId: string,
    identity?: { email?: string; name?: string },
  ): Promise<StudentProfile> {
    let stored: Record<string, unknown> | undefined;
    if (Types.ObjectId.isValid(userId)) {
      const doc = await this.store
        .findOne({ userId: new Types.ObjectId(userId) })
        .lean()
        .exec();
      stored = doc?.profileData as Record<string, unknown> | undefined;
    }
    const merged = stored
      ? this.mergeWithDefaults(stored)
      : await this.defaultForUser(userId);

    const email = identity?.email || merged.email;
    const student = await this.findAcaStudent({
      email,
      name: identity?.name || merged.name,
      phone: merged.phone,
    });
    if (!student) return merged;

    const scores = this.rosterSkillScores(student);
    const aim = String(student.aim || '').trim();
    const dob = String(student.dob || '').trim();
    const zodiac = String(student.zodiac || '').trim();

    const pick = (profileValue?: string, rosterValue?: string) => {
      const a = String(profileValue || '').trim();
      const b = String(rosterValue || '').trim();
      return a || b;
    };

    return this.mergeWithDefaults({
      ...merged,
      name: pick(merged.name, student.name),
      email: pick(merged.email, student.email),
      phone: pick(merged.phone, student.phone),
      dob: pick(merged.dob, dob),
      zodiac: pick(merged.zodiac, zodiac),
      avatarUrl: pick(merged.avatarUrl, student.avatarUrl),
      examDate: pick(merged.examDate, (student as { examDate?: string }).examDate),
      method: pick(merged.method, student.method) || merged.method,
      weeklyHours: pick(merged.weeklyHours, student.weeklyHours) || merged.weeklyHours,
      classEnvironment:
        pick(merged.classEnvironment, student.classEnvironment) ||
        merged.classEnvironment,
      ieltsMeaning: pick(merged.ieltsMeaning, student.ieltsMeaning) || merged.ieltsMeaning,
      previousBand: pick(merged.previousBand, student.previousBand) || merged.previousBand,
      focusSkills:
        (merged.focusSkills?.length ? merged.focusSkills : student.focusSkills) ||
        merged.focusSkills,
      scores,
      aim: pick(merged.aim, aim),
    });
  }

  private async persist(userId: string, next: StudentProfile): Promise<StudentProfile> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('userId không hợp lệ');
    }
    await this.store
      .findOneAndUpdate(
        { userId: new Types.ObjectId(userId) },
        {
          $set: {
            profileData: { ...next },
            'diagnosisData.examDate': String(next.examDate || ''),
          },
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
    identity?: { email?: string; name?: string },
  ): Promise<StudentProfile> {
    const incoming: UpdateStudentProfileDto = { ...payload };
    for (const field of STUDY_FIELDS) {
      if (field === 'focusSkills') continue;
      const raw = incoming[field];
      if (raw === undefined || raw === null) continue;
      const sanitized = sanitizeStudyString(field, raw);
      if (!sanitized) {
        delete incoming[field];
        continue;
      }
      incoming[field] = sanitized;
    }
    if (incoming.examDate !== undefined && incoming.examDate !== null) {
      const exam = String(incoming.examDate).trim();
      if (exam && !/^\d{4}-\d{2}-\d{2}$/.test(exam)) {
        throw new BadRequestException('Ngày thi dự kiến không hợp lệ');
      }
    }
    const parsedSkills =
      incoming.focusSkills === undefined
        ? undefined
        : parseFocusSkillsPayload(incoming.focusSkills);
    const focusSkillsUpdate =
      parsedSkills && parsedSkills.length > 0 ? parsedSkills : undefined;
    const current = await this.getProfile(userId, identity);
    const { focusSkills: _fs, ...rest } = incoming;
    const next = {
      ...current,
      ...rest,
      ...(focusSkillsUpdate !== undefined
        ? { focusSkills: focusSkillsUpdate }
        : {}),
    } as StudentProfile;
    const saved = await this.persist(userId, next);
    await this.syncIdentityToRoster(saved, {
      email: identity?.email || saved.email,
      name: identity?.name || saved.name,
      phone: saved.phone,
    });
    try {
      await this.users.updateProfileByUserId(userId, {
        name: saved.name,
        phone: saved.phone,
      });
    } catch {
      // Tài khoản HS có thể chưa gắn userId hợp lệ — roster vẫn đã sync.
    }
    return saved;
  }

  async saveStudentIdentityByEmail(
    email: string,
    data: {
      studentId?: string;
      name?: string;
      email?: string;
      phone?: string;
      dob?: string;
      zodiac?: string;
      avatarUrl?: string;
    },
  ) {
    const cleanEmail = (data.email || email || '').trim().toLowerCase();
    if (!cleanEmail && !data.studentId) return { ok: false, error: 'Thiếu email' };
    const student = await this.resolveAcaStudent({
      studentId: data.studentId,
      email: cleanEmail || email,
      name: data.name,
      phone: data.phone,
    });
    if (!student) return { ok: false, error: 'Không tìm thấy học viên' };

    const dob = String(data.dob ?? student.dob ?? '').trim();
    const zodiac = String(data.zodiac ?? student.zodiac ?? '').trim();
    const patch = {
      name: String(data.name ?? student.name ?? '').trim(),
      email: cleanEmail || String(student.email || '').trim(),
      phone: String(data.phone ?? student.phone ?? '').trim(),
      dob,
      zodiac,
      avatarUrl: String(data.avatarUrl ?? student.avatarUrl ?? '').trim(),
    };
    await this.acaStudentModel.updateOne({ _id: student._id }, { $set: patch }).exec();

    const user =
      (await this.users.findByEmail(patch.email)) ||
      (email ? await this.users.findByEmail(email) : null);
    if (user?._id) {
      const current = await this.getProfile(String(user._id), {
        email: patch.email,
        name: patch.name,
      });
      await this.persist(String(user._id), {
        ...current,
        ...patch,
      });
    }
    return { ok: true, ...patch };
  }

  private async syncIdentityToRoster(
    profile: StudentProfile,
    identity: { email?: string; name?: string; phone?: string },
  ) {
    const student = await this.findAcaStudent(identity);
    if (!student) return;
    const dob = profile.dob || '';
    const examDate = String(profile.examDate || '').trim();
    await this.acaStudentModel
      .updateOne(
        { _id: student._id },
        {
          $set: {
            name: profile.name || student.name,
            email: profile.email || student.email,
            phone: profile.phone || student.phone,
            dob,
            zodiac: profile.zodiac || '',
            avatarUrl: profile.avatarUrl || student.avatarUrl || '',
            examDate,
            method: profile.method || '',
            weeklyHours: profile.weeklyHours || '',
            classEnvironment: profile.classEnvironment || '',
            ieltsMeaning: profile.ieltsMeaning || '',
            previousBand: profile.previousBand || '',
            focusSkills: profile.focusSkills || [],
          },
        },
      )
      .exec();

    // Đồng bộ ngày thi vào diagnosisData trên cả hồ sơ roster + tài khoản HS
    // để Sale/GV đọc BCB thấy cùng ngày học viên vừa đổi.
    const persistIds: Types.ObjectId[] = [student._id as Types.ObjectId];
    const email = String(profile.email || student.email || identity.email || '').trim();
    if (email) {
      const user = await this.users.findByEmail(email);
      if (user?._id) persistIds.push(user._id as Types.ObjectId);
    }
    for (const userId of persistIds) {
      await this.store
        .findOneAndUpdate(
          { userId },
          {
            $set: {
              'profileData.examDate': examDate,
              'diagnosisData.examDate': examDate,
            },
            $setOnInsert: { userId },
          },
          { upsert: true, returnDocument: 'after' },
        )
        .exec();
    }
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
    const saved = await this.persist(userId, next);
    await this.syncIdentityToRoster(saved, {
      email: saved.email,
      name: saved.name,
      phone: saved.phone,
    });
    return saved;
  }

  private parseBand(value: unknown): number {
    if (value === undefined || value === null || value === '' || value === '-') {
      return 0;
    }
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : 0;
    }
    const raw = String(value).trim().replace(',', '.');
    const slash = raw.match(/^(\d+(?:\.\d+)?)\s*\//);
    if (slash) return Number(slash[1]) || 0;
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
  }

  private rosterSkillScores(student: {
    scores?: unknown;
    cycles?: { scores?: unknown }[];
  }) {
    const top = this.skillScoresFrom(
      student.scores as Record<string, unknown> | null,
    );
    if (this.hasAnyScore(top)) return top;
    const cycles = student.cycles || [];
    for (let i = cycles.length - 1; i >= 0; i--) {
      const fromCycle = this.skillScoresFrom(
        cycles[i]?.scores as Record<string, unknown> | undefined,
      );
      if (this.hasAnyScore(fromCycle)) return fromCycle;
    }
    return top;
  }

  private rosterFinalSkillScores(student: {
    finalScores?: unknown;
    cycles?: { finalScores?: unknown }[];
  }) {
    const top = this.skillScoresFrom(
      student.finalScores as Record<string, unknown> | null,
    );
    if (this.hasAnyScore(top)) return top;
    const cycles = student.cycles || [];
    for (let i = cycles.length - 1; i >= 0; i--) {
      const fromCycle = this.skillScoresFrom(
        cycles[i]?.finalScores as Record<string, unknown> | undefined,
      );
      if (this.hasAnyScore(fromCycle)) return fromCycle;
    }
    return top;
  }

  private skillScoresFrom(
    src?: {
      listening?: unknown;
      reading?: unknown;
      writing?: unknown;
      speaking?: unknown;
      overall?: unknown;
      l?: unknown;
      r?: unknown;
      w?: unknown;
      s?: unknown;
      o?: unknown;
    } | null,
  ) {
    if (!src) {
      return {
        listening: 0,
        reading: 0,
        writing: 0,
        speaking: 0,
        overall: 0,
      };
    }
    return {
      listening: this.parseBand(src.listening ?? src.l),
      reading: this.parseBand(src.reading ?? src.r),
      writing: this.parseBand(src.writing ?? src.w),
      speaking: this.parseBand(src.speaking ?? src.s),
      overall: this.parseBand(src.overall ?? src.o),
    };
  }

  private hasAnyScore(scores: {
    listening: number;
    reading: number;
    writing: number;
    speaking: number;
    overall: number;
  }) {
    return (
      scores.listening > 0 ||
      scores.reading > 0 ||
      scores.writing > 0 ||
      scores.speaking > 0 ||
      scores.overall > 0
    );
  }

  private mergeSkillScores(
    primary: {
      listening: number;
      reading: number;
      writing: number;
      speaking: number;
      overall: number;
    },
    fallback: {
      listening: number;
      reading: number;
      writing: number;
      speaking: number;
      overall: number;
    },
  ) {
    return {
      listening: primary.listening || fallback.listening,
      reading: primary.reading || fallback.reading,
      writing: primary.writing || fallback.writing,
      speaking: primary.speaking || fallback.speaking,
      overall: primary.overall || fallback.overall,
    };
  }

  async getStudentDiagnosis(identity: {
    userId?: string;
    studentId?: string;
    email?: string;
    name?: string;
    phone?: string;
  } | string) {
    const info =
      typeof identity === 'string'
        ? { email: identity, name: '', phone: '', userId: '', studentId: '' }
        : identity;
    const email = (info.email || '').trim();
    const student = await this.resolveAcaStudent({
      studentId: info.studentId,
      email,
      name: info.name,
      phone: info.phone,
    });
    const leadDiagnosis = await this.findLeadDiagnosis({
      email: email || student?.email,
      name: info.name || student?.name,
      phone: info.phone || student?.phone,
    });

    if (!student) {
      if (!leadDiagnosis) return null;
      const leadScores = this.skillScoresFrom(
        (leadDiagnosis as { scores?: Record<string, unknown> }).scores,
      );
      return {
        name: info.name || '',
        email,
        phone: info.phone || '',
        classId: '',
        aim: String((leadDiagnosis as { aim?: string }).aim || ''),
        examDate: String((leadDiagnosis as { examDate?: string }).examDate || ''),
        scores: leadScores,
        finalScores: this.skillScoresFrom(null),
        diagnosisData: this.stripDeprecatedBcbFields(
          leadDiagnosis as Record<string, unknown>,
        ),
      };
    }

    const profileDoc = await this.loadDiagnosisDoc(
      student._id as Types.ObjectId,
      info.userId,
    );
    const storedDiagnosis =
      (profileDoc as { diagnosisData?: Record<string, unknown> } | null)
        ?.diagnosisData ?? null;
    const diagnosisData = storedDiagnosis || leadDiagnosis;
    const scores = this.mergeSkillScores(
      this.rosterSkillScores(student),
      this.skillScoresFrom(
        (diagnosisData as { scores?: Record<string, unknown> } | null)?.scores,
      ),
    );
    const rosterAim = String(student.aim || '').trim();
    const nestedAim = String(
      (diagnosisData as { aim?: string } | null)?.aim || '',
    ).trim();
    const aim = nestedAim || rosterAim;
    const storedProfileExam = String(
      (profileDoc as { profileData?: { examDate?: string } } | null)?.profileData
        ?.examDate || '',
    );
    let jwtProfileExam = '';
    if (info.userId && Types.ObjectId.isValid(info.userId)) {
      const jwtDoc = await this.store
        .findOne({ userId: new Types.ObjectId(info.userId) })
        .lean()
        .exec();
      jwtProfileExam = String(
        (jwtDoc as { profileData?: { examDate?: string } } | null)?.profileData
          ?.examDate || '',
      );
    }
    const rosterExam = String(
      (student as { examDate?: string }).examDate || '',
    ).trim();
    const examDate = String(
      rosterExam ||
        jwtProfileExam ||
        storedProfileExam ||
        (diagnosisData as { examDate?: string } | null)?.examDate ||
        '',
    );

    const stored =
      typeof diagnosisData === 'object' && diagnosisData
        ? this.stripDeprecatedBcbFields(diagnosisData as Record<string, unknown>)
        : {};
    const storedFinal = this.skillScoresFrom(
      (stored as { finalScores?: Record<string, unknown> }).finalScores,
    );
    const finalScores = this.mergeSkillScores(
      this.rosterFinalSkillScores(student),
      storedFinal,
    );

    return {
      name: student.name,
      email: student.email || email,
      phone: student.phone,
      classId: student.classId,
      aim,
      examDate,
      examCountdownAnchor: String(
        (stored as { examCountdownAnchor?: string }).examCountdownAnchor || '',
      ),
      scores,
      finalScores,
      writingCriteria: stored.writingCriteria ?? null,
      writingSummary: stored.writingSummary ?? null,
      speakingCriteria: stored.speakingCriteria ?? null,
      skillSummaries: stored.skillSummaries ?? null,
      writingLinks: stored.writingLinks ?? null,
      bcbListening: stored.bcbListening ?? null,
      bcbReading: stored.bcbReading ?? null,
      bcbOverviewTitle: stored.bcbOverviewTitle ?? '',
      bcbOverviewSummary: stored.bcbOverviewSummary ?? '',
      diagnosisData: {
        ...stored,
        scores: {
          listening: scores.listening,
          reading: scores.reading,
          writing: scores.writing,
          speaking: scores.speaking,
          overall: scores.overall,
        },
        aim,
        examDate,
        finalScores: {
          listening: finalScores.listening,
          reading: finalScores.reading,
          writing: finalScores.writing,
          speaking: finalScores.speaking,
          overall: finalScores.overall,
        },
      },
    };
  }

  async getClassInfoForStudent(email: string, name?: string) {
    const emptyInfo = {
      course: '',
      instructor: '',
      room: '',
      zoomPassword: '—',
      zoomLink: '',
      schedule: [] as string[],
      phases: [] as { name: string; date: string }[],
      openDate: '',
      endDate: '',
      links: [] as { id: string; label: string; value: string; url: string }[],
      classId: '',
      mode: '' as '' | 'group' | 'one-to-one',
      oneToOne: null as null | {
        id: string;
        className: string;
        teacher: string;
        schedule: string;
        zoomLink: string;
        successorLink: string;
        materials: string;
        status: string;
        startDate: string;
        endDate: string;
        progress: string;
      },
    };

    const student = await this.findAcaStudent({ email, name });
    const globalSettings = await this.courseSettingsModel
      .findOne({ $or: [{ classId: '' }, { classId: { $exists: false } }] })
      .lean()
      .exec();
    const globalLinks = Array.isArray((globalSettings as any)?.links)
      ? (globalSettings as any).links
      : [];

    // Resolve group class
    let cls: AcaClass | null = null;
    if (student) {
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
    }

    // Resolve 1:1
    const emailNorm = String(email || '').trim().toLowerCase();
    const nameNorm = this.normalizeName(name || student?.name);
    const or11: Record<string, unknown>[] = [];
    if (emailNorm) {
      or11.push({
        studentEmail: new RegExp(
          `^${emailNorm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
          'i',
        ),
      });
    }
    if (student?._id) {
      or11.push({ studentId: String(student._id) });
    }
    if (nameNorm) {
      or11.push({
        studentName: new RegExp(
          `^${nameNorm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
          'i',
        ),
      });
      or11.push({
        className: new RegExp(nameNorm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
      });
    }
    let oneToOne: any = null;
    if (or11.length > 0) {
      const rows = await this.aca11Model.find({ $or: or11 }).lean().exec();
      if (rows.length) {
        rows.sort((a: any, b: any) => {
          const rank = (s: string) =>
            s === 'Đang diễn ra' ? 3 : s === 'Bảo lưu' ? 2 : 1;
          return rank(String(b.status || '')) - rank(String(a.status || ''));
        });
        oneToOne = rows[0];
      }
    }

    if (!cls && !oneToOne) {
      return emptyInfo;
    }

    if (cls) {
      const phases: { name: string; date: string }[] = [];
      if (cls.currentPhase || cls.phaseStartDate || cls.openDate) {
        phases.push({
          name: cls.currentPhase || 'Chặng 1',
          date: cls.phaseStartDate || cls.openDate || '',
        });
      }
      if (cls.nextPhase || cls.nextPhaseStartDate) {
        phases.push({
          name: cls.nextPhase || 'Chặng 2',
          date: cls.nextPhaseStartDate || '',
        });
      }

      const rawSchedule = String((cls as { schedule?: string }).schedule || '').trim();
      const schedule = rawSchedule
        ? rawSchedule
            .split(/\n+/)
            .map((line) => line.trim())
            .filter(Boolean)
        : [];

      const classLinks = Array.isArray((cls as any).links) ? (cls as any).links : [];
      const zoomPassword =
        String((cls as any).zoomPassword || '').trim() ||
        String((globalSettings as any)?.zoomPassword || '').trim() ||
        '—';

      return {
        course: cls.classCode || cls.name || '',
        instructor: cls.teacher || '',
        room: String((cls as any).room || '').trim() || 'Zoom Online',
        zoomPassword,
        zoomLink: String((cls as any).zoomLink || '').trim(),
        schedule,
        phases,
        openDate: cls.openDate || '',
        endDate: cls.endDate || '',
        links: classLinks.length > 0 ? classLinks : globalLinks,
        classId: String((cls as any)._id || student?.classId || ''),
        mode: 'group' as const,
        oneToOne: oneToOne
          ? {
              id: String(oneToOne._id),
              className: oneToOne.className || '',
              teacher: oneToOne.teacher || '',
              schedule: oneToOne.schedule || '',
              zoomLink: oneToOne.zoomLink || '',
              successorLink: oneToOne.successorLink || '',
              materials: oneToOne.materials || '',
              status: oneToOne.status || '',
              startDate: oneToOne.startDate || '',
              endDate: oneToOne.endDate || '',
              progress: oneToOne.progress || '',
            }
          : null,
      };
    }

    // Chỉ có 1:1
    const schedule11 = String(oneToOne.schedule || '')
      .split(/\n+/)
      .map((line: string) => line.trim())
      .filter(Boolean);

    return {
      course: oneToOne.className || 'Lớp 1:1',
      instructor: oneToOne.teacher || '',
      room: 'Zoom 1:1',
      zoomPassword: '—',
      zoomLink: oneToOne.zoomLink || '',
      schedule: schedule11,
      phases: [],
      openDate: oneToOne.startDate || '',
      endDate: oneToOne.endDate || '',
      links: [
        ...(oneToOne.successorLink
          ? [
              {
                id: 'rlp',
                label: 'RLP 1:1',
                value: oneToOne.className || 'RLP',
                url: oneToOne.successorLink,
              },
            ]
          : []),
        ...(oneToOne.materials
          ? [
              {
                id: 'materials',
                label: 'TÀI LIỆU 1:1',
                value: 'Drive / folder',
                url: oneToOne.materials,
              },
            ]
          : []),
        ...globalLinks.filter((l: any) => l.id !== 'rlp'),
      ],
      classId: '',
      mode: 'one-to-one' as const,
      oneToOne: {
        id: String(oneToOne._id),
        className: oneToOne.className || '',
        teacher: oneToOne.teacher || '',
        schedule: oneToOne.schedule || '',
        zoomLink: oneToOne.zoomLink || '',
        successorLink: oneToOne.successorLink || '',
        materials: oneToOne.materials || '',
        status: oneToOne.status || '',
        startDate: oneToOne.startDate || '',
        endDate: oneToOne.endDate || '',
        progress: oneToOne.progress || '',
      },
    };
  }

  async saveStudentDiagnosisByEmail(email: string, diagnosisData: Record<string, unknown>) {
    return this.saveStudentDiagnosis(
      {
        email,
        studentId: String(
          (diagnosisData as { studentId?: string }).studentId || '',
        ),
        name: String((diagnosisData as { studentName?: string }).studentName || ''),
        phone: String((diagnosisData as { studentPhone?: string }).studentPhone || ''),
      },
      diagnosisData,
    );
  }

  async saveStudentDiagnosis(
    identity: {
      studentId?: string;
      email?: string;
      name?: string;
      phone?: string;
    },
    diagnosisData: Record<string, unknown>,
  ) {
    const student = await this.resolveAcaStudent(identity);
    if (!student) return { ok: false, error: 'Không tìm thấy học viên' };

    const rosterEmail = String(student.email || identity.email || '').trim();
    const {
      email: _email,
      studentId: _studentId,
      ...rawPayload
    } = diagnosisData;
    const bcbPayload = this.stripDeprecatedBcbFields(rawPayload);
    const studentOid = student._id as Types.ObjectId;
    const existingDoc = await this.loadDiagnosisDoc(studentOid);
    const existing =
      (existingDoc as { diagnosisData?: Record<string, unknown> } | null)
        ?.diagnosisData ?? {};
    const existingCriteria =
      (existing as { writingCriteria?: Record<string, unknown> }).writingCriteria ||
      {};
    const incomingCriteria =
      (bcbPayload as { writingCriteria?: Record<string, unknown> }).writingCriteria ||
      {};
    const existingSummary =
      (existing as { writingSummary?: Record<string, unknown> }).writingSummary ||
      {};
    const incomingSummary =
      (bcbPayload as { writingSummary?: Record<string, unknown> }).writingSummary ||
      {};
    const existingSpeaking =
      (existing as { speakingCriteria?: Record<string, unknown> }).speakingCriteria ||
      {};
    const incomingSpeaking =
      (bcbPayload as { speakingCriteria?: Record<string, unknown> }).speakingCriteria ||
      {};
    const existingSummaries =
      (existing as { skillSummaries?: Record<string, unknown> }).skillSummaries ||
      {};
    const incomingSummaries =
      (bcbPayload as { skillSummaries?: Record<string, unknown> }).skillSummaries ||
      {};
    const keepWriting = this.hasWritingBcb(existing) && !this.hasWritingBcb(bcbPayload);
    const keepSpeaking = this.hasSpeakingBcb(existing) && !this.hasSpeakingBcb(bcbPayload);
    const keepOverview = this.hasOverviewBcb(existing) && !this.hasOverviewBcb(bcbPayload);
    const keepLr =
      this.hasListeningReadingBcb(existing) && !this.hasListeningReadingBcb(bcbPayload);
    const incomingExam = String((bcbPayload as { examDate?: string }).examDate || '').trim();
    const existingExam = String((existing as { examDate?: string }).examDate || '').trim();
    const existingListening = (existing as { bcbListening?: unknown[] }).bcbListening || [];
    const incomingListening = (bcbPayload as { bcbListening?: unknown[] }).bcbListening || [];
    const existingReading = (existing as { bcbReading?: unknown[] }).bcbReading || [];
    const incomingReading = (bcbPayload as { bcbReading?: unknown[] }).bcbReading || [];
    const mergedScores = this.mergeSkillScores(
      this.skillScoresFrom((bcbPayload as { scores?: Record<string, unknown> }).scores),
      this.skillScoresFrom((existing as { scores?: Record<string, unknown> }).scores),
    );
    const mergedDiagnosis = {
      ...(typeof existing === 'object' && existing ? existing : {}),
      ...bcbPayload,
      scores: mergedScores,
      examDate: incomingExam || existingExam,
      bcbOverviewTitle: keepOverview
        ? String((existing as { bcbOverviewTitle?: string }).bcbOverviewTitle || '')
        : String(
            (bcbPayload as { bcbOverviewTitle?: string }).bcbOverviewTitle ||
              (existing as { bcbOverviewTitle?: string }).bcbOverviewTitle ||
              '',
          ),
      bcbOverviewSummary: keepOverview
        ? String((existing as { bcbOverviewSummary?: string }).bcbOverviewSummary || '')
        : String(
            (bcbPayload as { bcbOverviewSummary?: string }).bcbOverviewSummary ||
              (existing as { bcbOverviewSummary?: string }).bcbOverviewSummary ||
              '',
          ),
      writingCriteria: keepWriting
        ? existingCriteria
        : {
            ...(typeof existingCriteria === 'object' ? existingCriteria : {}),
            ...incomingCriteria,
            task1: {
              ...((existingCriteria as { task1?: object }).task1 || {}),
              ...((incomingCriteria as { task1?: object }).task1 || {}),
            },
            task2: {
              ...((existingCriteria as { task2?: object }).task2 || {}),
              ...((incomingCriteria as { task2?: object }).task2 || {}),
            },
          },
      writingSummary: keepWriting
        ? existingSummary
        : {
            ...(typeof existingSummary === 'object' ? existingSummary : {}),
            ...incomingSummary,
          },
      speakingCriteria: keepSpeaking
        ? existingSpeaking
        : {
            ...(typeof existingSpeaking === 'object' ? existingSpeaking : {}),
            ...incomingSpeaking,
          },
      bcbListening: keepLr
        ? existingListening
        : incomingListening.length
          ? incomingListening
          : existingListening,
      bcbReading: keepLr
        ? existingReading
        : incomingReading.length
          ? incomingReading
          : existingReading,
      skillSummaries: {
        ...(typeof existingSummaries === 'object' ? existingSummaries : {}),
        ...incomingSummaries,
        listening: keepLr
          ? String(existingSummaries.listening || '')
          : String(
              incomingSummaries.listening || existingSummaries.listening || '',
            ),
        reading: keepLr
          ? String(existingSummaries.reading || '')
          : String(incomingSummaries.reading || existingSummaries.reading || ''),
        speaking: keepSpeaking
          ? String(existingSummaries.speaking || '')
          : String(incomingSummaries.speaking || existingSummaries.speaking || ''),
      },
    };

    const persistIds: Types.ObjectId[] = [studentOid];
    const user =
      (rosterEmail ? await this.users.findByEmail(rosterEmail) : null) ||
      (identity.email ? await this.users.findByEmail(identity.email) : null);
    if (user?._id) persistIds.push(user._id as Types.ObjectId);

    const examDate = String((mergedDiagnosis as { examDate?: string }).examDate || '').trim();
    for (const userId of persistIds) {
      await this.store
        .findOneAndUpdate(
          { userId },
          {
            $set: {
              diagnosisData: mergedDiagnosis,
              ...(examDate ? { 'profileData.examDate': examDate } : {}),
            },
            $setOnInsert: { userId },
          },
          { upsert: true, returnDocument: 'after' },
        )
        .exec();
    }

    const incomingScores = this.skillScoresFrom(
      (bcbPayload as { scores?: Record<string, unknown> }).scores,
    );
    const rosterPatch: Record<string, unknown> = {};
    if (this.hasAnyScore(incomingScores)) {
      const existingRoster = await this.acaStudentModel
        .findById(studentOid)
        .select('scores')
        .lean()
        .exec();
      const prevScores = (existingRoster as { scores?: Record<string, unknown> } | null)
        ?.scores || {};
      const pick = (incoming: number, prevKey: string) => {
        if (incoming > 0) return String(incoming);
        const prev = String(prevScores[prevKey] ?? '').trim();
        return prev && prev !== '-' ? prev : '-';
      };
      rosterPatch.scores = {
        l: pick(incomingScores.listening, 'l'),
        r: pick(incomingScores.reading, 'r'),
        w: pick(incomingScores.writing, 'w'),
        s: pick(incomingScores.speaking, 's'),
        o: pick(incomingScores.overall, 'o'),
      };
    }
    const aim = String((diagnosisData as { aim?: string }).aim || '').trim();
    if (aim) rosterPatch.aim = aim;
    if (Object.keys(rosterPatch).length > 0) {
      await this.acaStudentModel
        .updateOne({ _id: studentOid }, { $set: rosterPatch })
        .exec();
    }
    return { ok: true };
  }

  async getStudentDiagnosisExtended(email: string, studentId?: string) {
    if (!email && !studentId) return null;
    return this.getStudentDiagnosis({ email, studentId });
  }
}
