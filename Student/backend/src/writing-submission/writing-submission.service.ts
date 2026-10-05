import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import type { JwtPayload } from '../auth/auth.types';
import { UsersService } from '../users/users.service';
import { CreateWritingSubmissionDto } from './dto/create-writing-submission.dto';
import { GradeWritingSubmissionDto } from './dto/grade-writing-submission.dto';
import {
  computeWritingDueDateFromSubmitted,
  resolveWritingDueDateStored,
} from './writing-deadline.util';
import {
  isWritingSubmissionStatus,
  type WritingSubmissionStatus,
} from './writing-submission.constants';
import {
  WritingSubmission,
  type WritingSubmissionDocument,
} from './schemas/writing-submission.schema';
import {
  EntranceTestBooking,
  type EntranceTestBookingDocument,
} from '../aca/schemas/entrance-test-booking.schema';
import {
  FinalTest,
  type FinalTestDocument,
} from '../aca/schemas/final-test.schema';

export const ACA_GRADERS = [
  'Huỳnh Gia Phú',
  'Lê Thị Diệu Linh',
  'Nguyễn Văn Đăng Duy',
  'Huỳnh Minh Phương',
  'Nguyễn Thị Hoàng Sa',
] as const;

const GRADER_NAME_ALIASES: Record<string, (typeof ACA_GRADERS)[number]> = {
  'grader 1': 'Huỳnh Gia Phú',
  'bộ phận grader 1': 'Huỳnh Gia Phú',
  'gia phú': 'Huỳnh Gia Phú',
  'huỳnh gia phú': 'Huỳnh Gia Phú',
  'grader 2': 'Lê Thị Diệu Linh',
  'bộ phận grader 2': 'Lê Thị Diệu Linh',
  'diệu linh': 'Lê Thị Diệu Linh',
  'lê thị diệu linh': 'Lê Thị Diệu Linh',
  'grader 3': 'Nguyễn Văn Đăng Duy',
  'bộ phận grader 3': 'Nguyễn Văn Đăng Duy',
  'grader hệ thống': 'Nguyễn Văn Đăng Duy',
  'đăng duy': 'Nguyễn Văn Đăng Duy',
  'nguyễn văn đăng duy': 'Nguyễn Văn Đăng Duy',
  'minh phương': 'Huỳnh Minh Phương',
  'huỳnh minh phương': 'Huỳnh Minh Phương',
  'hoàng sa': 'Nguyễn Thị Hoàng Sa',
  'nguyễn thị hoàng sa': 'Nguyễn Thị Hoàng Sa',
};

export function normalizeAssignedGraderName(
  raw?: string | null,
): (typeof ACA_GRADERS)[number] | '' {
  const clean = String(raw || '').trim();
  if (!clean) return '';
  if ((ACA_GRADERS as readonly string[]).includes(clean)) {
    return clean as (typeof ACA_GRADERS)[number];
  }
  const key = clean.toLowerCase();
  if (GRADER_NAME_ALIASES[key]) return GRADER_NAME_ALIASES[key];
  for (const [alias, canonical] of Object.entries(GRADER_NAME_ALIASES)) {
    if (key.includes(alias) || alias.includes(key)) return canonical;
  }
  for (const g of ACA_GRADERS) {
    if (key === g.toLowerCase() || key.includes(g.toLowerCase())) return g;
  }
  return '';
}

const LEGACY_GRADER_EMAILS = new Set([
  'aca_1@gmail.com',
  'aca_2@gmail.com',
  'aca@xalo.internal',
  'grader.phuong@xalo.internal',
  'grader.sa@xalo.internal',
]);

function isGraderActor(actor?: JwtPayload | null): boolean {
  if (!actor) return false;
  const role = String(actor.role || '').toUpperCase();
  if (role === 'GRADER') return true;
  const email = String(actor.email || '').trim().toLowerCase();
  return role === 'ACA' && LEGACY_GRADER_EMAILS.has(email);
}

function resolveGraderIdentity(actor?: JwtPayload | null): string {
  if (!actor) return '';
  const email = String(actor.email || '').trim().toLowerCase();
  const name = String(actor.name || '').trim();
  if (email === 'aca_1@gmail.com') return 'Huỳnh Gia Phú';
  if (email === 'aca_2@gmail.com') return 'Lê Thị Diệu Linh';
  if (email === 'aca@xalo.internal') return 'Nguyễn Văn Đăng Duy';
  if (email === 'grader.phuong@xalo.internal') return 'Huỳnh Minh Phương';
  if (email === 'grader.sa@xalo.internal') return 'Nguyễn Thị Hoàng Sa';
  return normalizeAssignedGraderName(name) || name;
}

function isAssignedToGrader(
  assignedRaw: string | undefined | null,
  graderIdentity: string,
): boolean {
  const mine = normalizeAssignedGraderName(graderIdentity) || graderIdentity.trim();
  if (!mine) return false;
  const assigned =
    normalizeAssignedGraderName(assignedRaw) || String(assignedRaw || '').trim();
  if (!assigned) return false;
  return assigned.toLowerCase() === mine.toLowerCase();
}

export type WritingSubmissionPublic = {
  id: string;
  studentId: string;
  studentName: string;
  examLink: string;
  testDateTime: string;
  submittedAt: string;
  status: WritingSubmissionStatus;
  score?: string;
  gradedAt?: string;
  dueDate?: string;
  studentGmail?: string;
  type?: string;
  task1?: string;
  task2?: string;
  note?: string;
  assignedGrader?: string;
  source?: string;
  submittedByRole?: string;
  entranceBookingId?: string;
  finalTestId?: string;
  criteriaScores?: Record<string, unknown> | null;
};

type WritingSubmissionLean = WritingSubmission & {
  _id: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
};

@Injectable()
export class WritingSubmissionService {
  constructor(
    @InjectModel(WritingSubmission.name)
    private readonly model: Model<WritingSubmissionDocument>,
    @InjectModel(EntranceTestBooking.name)
    private readonly entranceBookingModel: Model<EntranceTestBookingDocument>,
    @InjectModel(FinalTest.name)
    private readonly finalTestModel: Model<FinalTestDocument>,
    private readonly users: UsersService,
  ) {}

  private async selectNextGrader(): Promise<string> {
    const allSubmissions = await this.model.find().lean().exec();
    const counts: Record<string, number> = {};
    for (const g of ACA_GRADERS) {
      counts[g] = 0;
    }
    for (const s of allSubmissions) {
      const g = normalizeAssignedGraderName(s.assignedGrader);
      if (g && counts[g] !== undefined) {
        counts[g]++;
      }
    }
    let minCount = Infinity;
    let selected: string = ACA_GRADERS[0];
    for (const g of ACA_GRADERS) {
      if (counts[g] < minCount) {
        minCount = counts[g];
        selected = g;
      }
    }
    return selected;
  }

  private resolveSubmittedByRole(doc: WritingSubmissionLean): string {
    const stored = String(doc.submittedByRole || '').trim();
    if (stored === 'sale' || stored === 'student' || stored === 'staff') return stored;
    if (doc.entranceBookingId || doc.source === 'entrance') return 'sale';
    if (doc.source === 'final' || doc.finalTestId || doc.source === 'support') {
      return 'student';
    }
    return 'staff';
  }

  private toPublic(doc: WritingSubmissionLean): WritingSubmissionPublic {
    const status = isWritingSubmissionStatus(doc.status)
      ? doc.status
      : 'pending';
    return {
      id: doc._id.toString(),
      studentId: doc.studentId,
      studentName: doc.studentName,
      examLink: doc.examLink,
      testDateTime: doc.testDateTime,
      submittedAt: doc.createdAt?.toISOString() ?? new Date(0).toISOString(),
      status,
      score: doc.score,
      gradedAt: doc.gradedAt,
      dueDate: resolveWritingDueDateStored(doc.dueDate, doc.createdAt),
      studentGmail: doc.studentGmail,
      type: doc.type,
      task1: doc.task1,
      task2: doc.task2,
      note: doc.note,
      assignedGrader: normalizeAssignedGraderName(doc.assignedGrader) || doc.assignedGrader || '',
      source: doc.source || 'support',
      submittedByRole: this.resolveSubmittedByRole(doc),
      entranceBookingId: doc.entranceBookingId || '',
      finalTestId: doc.finalTestId || '',
      criteriaScores: (doc.criteriaScores as Record<string, unknown> | null) ?? null,
    };
  }

  private async findByIdOrThrow(id: string): Promise<WritingSubmissionLean> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Không tìm thấy bài nộp');
    }
    const doc = await this.model.findById(id).lean().exec();
    if (!doc) throw new NotFoundException('Không tìm thấy bài nộp');
    return doc as WritingSubmissionLean;
  }

  private async resolveStudentName(
    studentId: string,
    fallback?: string,
  ): Promise<string> {
    if (fallback?.trim()) return fallback.trim();
    if (Types.ObjectId.isValid(studentId)) {
      try {
        const user = await this.users.getPublicById(studentId);
        return user.name;
      } catch {
        // fall through
      }
    }
    return 'Học viên';
  }

  async listForStudent(studentId: string): Promise<WritingSubmissionPublic[]> {
    const rows = await this.model
      .find({
        studentId,
        source: { $nin: ['entrance', 'final'] },
      })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    return (rows as WritingSubmissionLean[]).map((r) => this.toPublic(r));
  }

  async listForTeacher(
    status?: string,
    actor?: JwtPayload,
  ): Promise<WritingSubmissionPublic[]> {
    // Chuẩn hoá tên Grader cũ + backfill bài chưa gán
    try {
      const legacy = await this.model
        .find({
          assignedGrader: {
            $exists: true,
            $nin: [...ACA_GRADERS, '', null],
          },
        })
        .select('_id assignedGrader')
        .lean()
        .exec();
      for (const row of legacy) {
        const next = normalizeAssignedGraderName(row.assignedGrader);
        if (next && next !== row.assignedGrader) {
          await this.model
            .updateOne({ _id: row._id }, { $set: { assignedGrader: next } })
            .exec();
        }
      }

      const unassigned = await this.model
        .find({
          $or: [
            { assignedGrader: { $exists: false } },
            { assignedGrader: '' },
            { assignedGrader: null },
          ],
        })
        .select('_id')
        .lean()
        .exec();
      for (const row of unassigned) {
        try {
          const grader = await this.selectNextGrader();
          await this.model
            .updateOne({ _id: row._id }, { $set: { assignedGrader: grader } })
            .exec();
        } catch (err) {
          console.warn('Writing grader backfill skipped:', err);
        }
      }
    } catch (err) {
      console.warn('Writing grader backfill failed:', err);
    }

    const filter: Record<string, unknown> = {};
    if (status && status !== 'all' && isWritingSubmissionStatus(status)) {
      filter.status = status;
    }

    // Grader chỉ thấy bài được phân cho mình; ACA/GV thấy tất cả.
    if (isGraderActor(actor)) {
      const mine = resolveGraderIdentity(actor);
      if (mine) {
        filter.assignedGrader = mine;
      }
    }

    const rows = await this.model
      .find(filter)
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    return (rows as WritingSubmissionLean[]).map((r) => this.toPublic(r));
  }

  async createForStudent(
    studentId: string,
    studentName: string | undefined,
    payload: CreateWritingSubmissionDto,
  ): Promise<WritingSubmissionPublic> {
    const examLink = payload.examLink?.trim();
    if (!examLink) {
      throw new BadRequestException('Thiếu link bài làm');
    }

    const now = new Date();
    const testDateTime = payload.testDateTime?.trim() || now.toISOString();
    const name = await this.resolveStudentName(studentId, studentName);

    const existing = await this.model
      .findOne({
        studentId,
        status: { $in: ['pending', 'grading'] },
        source: { $nin: ['entrance', 'final'] },
      })
      .sort({ createdAt: -1 })
      .exec();

    if (existing) {
      existing.examLink = examLink;
      existing.testDateTime = testDateTime;
      existing.status = 'pending';
      existing.score = undefined;
      existing.gradedAt = undefined;
      existing.dueDate = computeWritingDueDateFromSubmitted(now);
      if (!existing.assignedGrader) {
        existing.assignedGrader = await this.selectNextGrader();
      }
      const updated = await existing.save();
      return this.toPublic(updated.toObject() as WritingSubmissionLean);
    }

    const assignedGrader = payload.assignedGrader?.trim() || await this.selectNextGrader();

    // Check weekly quota limit (maximum 6 submissions per week per student)
    const startOfWeek = new Date();
    startOfWeek.setHours(0, 0, 0, 0);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);

    const countThisWeek = await this.model.countDocuments({
      studentId,
      createdAt: { $gte: startOfWeek },
    });

    if (countThisWeek >= 6) {
      throw new BadRequestException('Bạn đã đạt hạn ngạch tối đa 6 bài Writing trong tuần này.');
    }

    const created = await this.model.create({
      studentId,
      studentName: name,
      examLink,
      testDateTime,
      status: 'pending',
      dueDate:
        payload.dueDate?.trim() ||
        computeWritingDueDateFromSubmitted(now),
      studentGmail: payload.studentGmail?.trim() || '',
      type: payload.type?.trim() || 'Support',
      task1: payload.task1?.trim() || '',
      task2: payload.task2?.trim() || '',
      note: payload.note?.trim() || '',
      assignedGrader,
      source: 'support',
      submittedByRole: 'student',
    });

    return this.toPublic(created.toObject() as WritingSubmissionLean);
  }

  async grade(
    id: string,
    payload: GradeWritingSubmissionDto,
    actor?: JwtPayload,
  ): Promise<WritingSubmissionPublic> {
    const doc = await this.findByIdOrThrow(id);
    const nextStatus = payload.status ?? doc.status;
    if (!isWritingSubmissionStatus(nextStatus)) {
      throw new BadRequestException('Trạng thái không hợp lệ');
    }

    const score = payload.score?.trim() !== undefined ? payload.score.trim() : doc.score;
    const examLink = payload.examLink?.trim() !== undefined ? payload.examLink.trim() : doc.examLink;
    const dueDate =
      payload.dueDate?.trim() !== undefined
        ? payload.dueDate.trim()
        : resolveWritingDueDateStored(doc.dueDate, doc.createdAt);
    const studentGmail = payload.studentGmail?.trim() !== undefined ? payload.studentGmail.trim() : doc.studentGmail;
    const type = payload.type?.trim() !== undefined ? payload.type.trim() : doc.type;
    const task1 = payload.task1?.trim() !== undefined ? payload.task1.trim() : doc.task1;
    const task2 = payload.task2?.trim() !== undefined ? payload.task2.trim() : doc.task2;
    const note = payload.note?.trim() !== undefined ? payload.note.trim() : doc.note;
    // Grader chỉ được chấm bài của mình và không được đổi phân công.
    const graderOnly = isGraderActor(actor);
    if (graderOnly) {
      const mine = resolveGraderIdentity(actor);
      if (mine && !isAssignedToGrader(doc.assignedGrader, mine)) {
        throw new ForbiddenException(
          'Bạn chỉ được chấm bài Writing được phân công cho mình',
        );
      }
    }
    let assignedGrader = doc.assignedGrader;
    if (!graderOnly) {
      assignedGrader =
        payload.assignedGrader?.trim() !== undefined
          ? payload.assignedGrader.trim()
          : doc.assignedGrader;
    }
    const criteriaScores =
      payload.criteriaScores !== undefined ? payload.criteriaScores : doc.criteriaScores;

    if (nextStatus === 'graded' && !score) {
      throw new BadRequestException('Cần nhập điểm khi chấm xong');
    }

    const gradedAt =
      nextStatus === 'graded'
        ? new Date().toISOString()
        : nextStatus === 'pending'
          ? undefined
          : doc.gradedAt;

    const updated = await this.model
      .findByIdAndUpdate(
        doc._id,
        {
          $set: {
            status: nextStatus,
            score: score || undefined,
            examLink,
            gradedAt,
            dueDate,
            studentGmail,
            type,
            task1,
            task2,
            note,
            assignedGrader,
            criteriaScores: criteriaScores ?? null,
          },
        },
        { returnDocument: 'after' },
      )
      .lean()
      .exec();

    if (!updated) {
      throw new NotFoundException('Không tìm thấy bài nộp');
    }

    const publicRow = this.toPublic(updated as WritingSubmissionLean);
    if (nextStatus === 'graded') {
      try {
        await this.syncLinkedWritingScore(publicRow);
      } catch (err) {
        console.warn('syncLinkedWritingScore failed:', err);
      }
    }
    return publicRow;
  }

  private async syncLinkedWritingScore(row: WritingSubmissionPublic): Promise<void> {
    const criteria = row.criteriaScores ?? null;
    const bookingId = row.entranceBookingId?.trim();
    if (bookingId && Types.ObjectId.isValid(bookingId)) {
      const existing = await this.entranceBookingModel.findById(bookingId).lean().exec();
      if (existing) {
        const prevBcb =
          ((existing as { bcbData?: Record<string, unknown> | null }).bcbData as Record<
            string,
            unknown
          > | null) || {};
        const prevWriting =
          (prevBcb.writing as Record<string, unknown> | undefined) || {};
        const t1 = (criteria?.task1 as Record<string, unknown> | undefined) || {};
        const t2 = (criteria?.task2 as Record<string, unknown> | undefined) || {};
        const nextBcb = criteria
          ? {
              ...prevBcb,
              writing: {
                ...prevWriting,
                task1: {
                  ta: String(t1.taskAchievement ?? ''),
                  cc: String(t1.coherenceCohesion ?? ''),
                  lr: String(t1.lexicalResource ?? ''),
                  gra: String(t1.grammaticalRange ?? ''),
                  notes: (prevWriting.task1 as { notes?: string } | undefined)?.notes,
                },
                task2: {
                  tr: String(t2.taskResponse ?? ''),
                  cc: String(t2.coherenceCohesion ?? ''),
                  lr: String(t2.lexicalResource ?? ''),
                  gra: String(t2.grammaticalRange ?? ''),
                  notes: (prevWriting.task2 as { notes?: string } | undefined)?.notes,
                },
              },
            }
          : undefined;

        await this.entranceBookingModel
          .findByIdAndUpdate(bookingId, {
            $set: {
              scoreWriting: row.score ?? '',
              status: 'graded',
              examLink: row.examLink || undefined,
              ...(criteria ? { writingCriteria: criteria } : {}),
              ...(nextBcb ? { bcbData: nextBcb } : {}),
            },
          })
          .exec();
      }
    }

    const finalId = row.finalTestId?.trim();
    if (finalId && Types.ObjectId.isValid(finalId)) {
      const existing = await this.finalTestModel.findById(finalId).lean().exec();
      if (!existing) return;
      const testType = String((existing as { testType?: string }).testType || '');
      const hasSpeaking = Boolean((existing as { scoreSpeaking?: string }).scoreSpeaking);
      const status =
        testType === 'full_4_skills' && !hasSpeaking ? 'in_progress' : 'graded';

      const prevBcb =
        ((existing as { bcbData?: Record<string, unknown> | null }).bcbData as Record<
          string,
          unknown
        > | null) || {};
      const prevWriting =
        (prevBcb.writing as Record<string, unknown> | undefined) || {};
      const t1 = (criteria?.task1 as Record<string, unknown> | undefined) || {};
      const t2 = (criteria?.task2 as Record<string, unknown> | undefined) || {};
      const nextBcb = criteria
        ? {
            ...prevBcb,
            writing: {
              ...prevWriting,
              task1: {
                ta: String(t1.taskAchievement ?? ''),
                cc: String(t1.coherenceCohesion ?? ''),
                lr: String(t1.lexicalResource ?? ''),
                gra: String(t1.grammaticalRange ?? ''),
                notes: (prevWriting.task1 as { notes?: string } | undefined)?.notes,
              },
              task2: {
                tr: String(t2.taskResponse ?? ''),
                cc: String(t2.coherenceCohesion ?? ''),
                lr: String(t2.lexicalResource ?? ''),
                gra: String(t2.grammaticalRange ?? ''),
                notes: (prevWriting.task2 as { notes?: string } | undefined)?.notes,
              },
            },
          }
        : undefined;

      await this.finalTestModel
        .findByIdAndUpdate(finalId, {
          $set: {
            scoreWriting: row.score ?? '',
            status,
            submissionLink: row.examLink || undefined,
            hasTakenTest: true,
            isChecked: false,
            isDone: false,
            releasedAt: '',
            releasedBy: '',
            ...(nextBcb ? { bcbData: nextBcb } : {}),
          },
        })
        .exec();
    }
  }
}
