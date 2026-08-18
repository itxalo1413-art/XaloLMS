import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UsersService } from '../users/users.service';
import { CreateWritingSubmissionDto } from './dto/create-writing-submission.dto';
import { GradeWritingSubmissionDto } from './dto/grade-writing-submission.dto';
import {
  isWritingSubmissionStatus,
  type WritingSubmissionStatus,
} from './writing-submission.constants';
import {
  WritingSubmission,
  type WritingSubmissionDocument,
} from './schemas/writing-submission.schema';

export const ACA_GRADERS = [
  'Grader 1',
  'Grader 2',
  'Grader 3',
] as const;

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
    private readonly users: UsersService,
  ) {}

  private async selectNextGrader(): Promise<string> {
    const allSubmissions = await this.model.find().lean().exec();
    const counts: Record<string, number> = {};
    for (const g of ACA_GRADERS) {
      counts[g] = 0;
    }
    for (const s of allSubmissions) {
      if (s.assignedGrader && counts[s.assignedGrader] !== undefined) {
        counts[s.assignedGrader]++;
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
      dueDate: doc.dueDate,
      studentGmail: doc.studentGmail,
      type: doc.type,
      task1: doc.task1,
      task2: doc.task2,
      note: doc.note,
      assignedGrader: doc.assignedGrader || '',
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
      .find({ studentId })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    return (rows as WritingSubmissionLean[]).map((r) => this.toPublic(r));
  }

  async listForTeacher(
    status?: string,
  ): Promise<WritingSubmissionPublic[]> {
    // Backfill any existing submissions missing assignedGrader
    const unassigned = await this.model.find({ $or: [{ assignedGrader: { $exists: false } }, { assignedGrader: '' }] }).exec();
    for (const doc of unassigned) {
      doc.assignedGrader = await this.selectNextGrader();
      await doc.save();
    }

    const filter: Record<string, unknown> = {};
    if (status && status !== 'all' && isWritingSubmissionStatus(status)) {
      filter.status = status;
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
      .findOne({ studentId, status: { $in: ['pending', 'grading'] } })
      .sort({ createdAt: -1 })
      .exec();

    if (existing) {
      existing.examLink = examLink;
      existing.testDateTime = testDateTime;
      existing.status = 'pending';
      existing.score = undefined;
      existing.gradedAt = undefined;
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
      dueDate: payload.dueDate?.trim() || '',
      studentGmail: payload.studentGmail?.trim() || '',
      type: payload.type?.trim() || '',
      task1: payload.task1?.trim() || '',
      task2: payload.task2?.trim() || '',
      note: payload.note?.trim() || '',
      assignedGrader,
    });

    return this.toPublic(created.toObject() as WritingSubmissionLean);
  }

  async grade(
    id: string,
    payload: GradeWritingSubmissionDto,
  ): Promise<WritingSubmissionPublic> {
    const doc = await this.findByIdOrThrow(id);
    const nextStatus = payload.status ?? doc.status;
    if (!isWritingSubmissionStatus(nextStatus)) {
      throw new BadRequestException('Trạng thái không hợp lệ');
    }

    const score = payload.score?.trim() !== undefined ? payload.score.trim() : doc.score;
    const examLink = payload.examLink?.trim() !== undefined ? payload.examLink.trim() : doc.examLink;
    const dueDate = payload.dueDate?.trim() !== undefined ? payload.dueDate.trim() : doc.dueDate;
    const studentGmail = payload.studentGmail?.trim() !== undefined ? payload.studentGmail.trim() : doc.studentGmail;
    const type = payload.type?.trim() !== undefined ? payload.type.trim() : doc.type;
    const task1 = payload.task1?.trim() !== undefined ? payload.task1.trim() : doc.task1;
    const task2 = payload.task2?.trim() !== undefined ? payload.task2.trim() : doc.task2;
    const note = payload.note?.trim() !== undefined ? payload.note.trim() : doc.note;
    const assignedGrader = payload.assignedGrader?.trim() !== undefined ? payload.assignedGrader.trim() : doc.assignedGrader;

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
          },
        },
        { returnDocument: 'after' },
      )
      .lean()
      .exec();

    return this.toPublic(updated as WritingSubmissionLean);
  }
}
