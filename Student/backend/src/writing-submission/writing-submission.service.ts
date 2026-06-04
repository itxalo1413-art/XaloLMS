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

    const created = await this.model.create({
      studentId,
      studentName: name,
      examLink,
      testDateTime,
      status: 'pending',
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

    const score = payload.score?.trim() || doc.score;
    const examLink = payload.examLink?.trim() || doc.examLink;

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
          },
        },
        { new: true },
      )
      .lean()
      .exec();

    return this.toPublic(updated as WritingSubmissionLean);
  }
}
