import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UsersService } from '../users/users.service';
import { CreateMockTestDto } from './dto/create-mock-test.dto';
import { RecordMockTestResultDto } from './dto/record-mock-test-result.dto';
import { ReviewMockTestDto } from './dto/review-mock-test.dto';
import { isMockTestStatus, type MockTestStatus } from './mock-test.constants';
import {
  MockTestRequest,
  type MockTestRequestDocument,
} from './schemas/mock-test-request.schema';

export type MockTestRequestPublic = {
  id: string;
  studentId: string;
  studentName: string;
  skill: string;
  day: number;
  month: number;
  year: number;
  status: MockTestStatus;
  requestedAt: string;
  examTime?: string;
  examTeacher?: string;
  reviewedAt?: string;
  score?: string;
  examLink?: string;
};

type MockTestLean = MockTestRequest & {
  _id: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
};

@Injectable()
export class MockTestService {
  constructor(
    @InjectModel(MockTestRequest.name)
    private readonly model: Model<MockTestRequestDocument>,
    private readonly users: UsersService,
  ) {}

  private toPublic(doc: MockTestLean): MockTestRequestPublic {
    const status = isMockTestStatus(doc.status) ? doc.status : 'pending';
    const reviewedAt =
      status !== 'pending' ? doc.updatedAt?.toISOString() : undefined;
    return {
      id: doc._id.toString(),
      studentId: doc.studentId.toString(),
      studentName: doc.studentName,
      skill: doc.skill,
      day: doc.day,
      month: doc.month,
      year: doc.year,
      status,
      requestedAt: doc.createdAt?.toISOString() ?? new Date(0).toISOString(),
      examTime: doc.examTime,
      examTeacher: doc.examTeacher,
      reviewedAt,
      score: doc.score,
      examLink: doc.examLink,
    };
  }

  private isSpeakingMockTest(skill: string): boolean {
    const s = skill.toLowerCase();
    return s.includes('speaking') && !s.includes('luyện');
  }

  private async findByIdOrThrow(id: string): Promise<MockTestLean> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Không tìm thấy yêu cầu');
    }
    const doc = await this.model.findById(id).lean().exec();
    if (!doc) throw new NotFoundException('Không tìm thấy yêu cầu');
    return doc as MockTestLean;
  }

  private async hasDuplicateSlot(
    studentId: string,
    skill: string,
    day: number,
    month: number,
    year: number,
    excludeId?: string,
  ): Promise<boolean> {
    if (!Types.ObjectId.isValid(studentId)) return false;
    const filter: Record<string, unknown> = {
      studentId: new Types.ObjectId(studentId),
      skill: skill.trim(),
      day,
      month,
      year,
      status: { $in: ['pending', 'approved'] },
    };
    if (excludeId && Types.ObjectId.isValid(excludeId)) {
      filter._id = { $ne: new Types.ObjectId(excludeId) };
    }
    const count = await this.model.countDocuments(filter).exec();
    return count > 0;
  }

  async listForStudent(studentId: string): Promise<MockTestRequestPublic[]> {
    if (!Types.ObjectId.isValid(studentId)) return [];
    const rows = await this.model
      .find({ studentId: new Types.ObjectId(studentId) })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    return (rows as MockTestLean[]).map((r) => this.toPublic(r));
  }

  async listForAca(status?: string): Promise<MockTestRequestPublic[]> {
    const filter: Record<string, unknown> = {};
    if (status && status !== 'all' && isMockTestStatus(status)) {
      filter.status = status;
    }
    const rows = await this.model
      .find(filter)
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    return (rows as MockTestLean[]).map((r) => this.toPublic(r));
  }

  async createForStudent(
    studentId: string,
    payload: CreateMockTestDto,
  ): Promise<MockTestRequestPublic> {
    if (!Types.ObjectId.isValid(studentId)) {
      throw new BadRequestException('userId không hợp lệ');
    }
    const skill = payload.skill?.trim();
    if (!skill) throw new BadRequestException('Thiếu kỹ năng (skill)');

    const day = Number(payload.day);
    const month = Number(payload.month);
    const year = Number(payload.year);
    if (
      !Number.isInteger(day) ||
      day < 1 ||
      day > 31 ||
      !Number.isInteger(month) ||
      month < 0 ||
      month > 11 ||
      !Number.isInteger(year)
    ) {
      throw new BadRequestException('Ngày tháng không hợp lệ');
    }

    if (await this.hasDuplicateSlot(studentId, skill, day, month, year)) {
      throw new ConflictException(
        'Bạn đã có đăng ký cho kỹ năng và ngày này',
      );
    }

    let studentName = 'Học viên';
    try {
      const user = await this.users.getPublicById(studentId);
      studentName = user.name;
    } catch {
      // keep default
    }

    const created = await this.model.create({
      studentId: new Types.ObjectId(studentId),
      studentName,
      skill,
      day,
      month,
      year,
      status: payload.status?.trim() || 'pending',
      examTime: payload.examTime?.trim() || undefined,
      examTeacher: payload.examTeacher?.trim() || undefined,
    });

    return this.toPublic(created.toObject() as MockTestLean);
  }

  async cancelPending(studentId: string, id: string): Promise<void> {
    const doc = await this.findByIdOrThrow(id);
    if (doc.studentId.toString() !== studentId) {
      throw new NotFoundException('Không tìm thấy yêu cầu');
    }
    if (doc.status !== 'pending') {
      throw new BadRequestException('Chỉ huỷ được yêu cầu đang chờ duyệt');
    }
    await this.model.deleteOne({ _id: doc._id }).exec();
  }

  async approve(id: string, payload: ReviewMockTestDto): Promise<MockTestRequestPublic> {
    const doc = await this.findByIdOrThrow(id);
    if (doc.status !== 'pending') {
      throw new BadRequestException('Yêu cầu không còn ở trạng thái chờ duyệt');
    }
    const examTime = payload.examTime?.trim() || doc.examTime || '09:00';
    const examTeacher = payload.examTeacher?.trim() || doc.examTeacher;
    const updated = await this.model
      .findByIdAndUpdate(
        doc._id,
        {
          $set: {
            status: 'approved',
            examTime,
            examTeacher,
          },
        },
        { new: true },
      )
      .lean()
      .exec();
    return this.toPublic(updated as MockTestLean);
  }

  async listForTeacher(teacherName: string): Promise<MockTestRequestPublic[]> {
    const teacher = teacherName.trim();
    if (!teacher) return [];
    const rows = await this.model
      .find({
        status: 'approved',
        examTeacher: teacher,
      })
      .sort({ year: 1, month: 1, day: 1, createdAt: -1 })
      .lean()
      .exec();
    return (rows as MockTestLean[])
      .filter((r) => this.isSpeakingMockTest(r.skill))
      .map((r) => this.toPublic(r));
  }

  async recordResult(
    id: string,
    teacherName: string,
    payload: RecordMockTestResultDto,
  ): Promise<MockTestRequestPublic> {
    const doc = await this.findByIdOrThrow(id);
    if (doc.status !== 'approved') {
      throw new BadRequestException('Chỉ nhập kết quả cho ca đã duyệt');
    }
    const teacher = teacherName.trim();
    if (!teacher || (doc.examTeacher ?? '').trim() !== teacher) {
      throw new BadRequestException('Ca mock test không thuộc giáo viên này');
    }
    if (!this.isSpeakingMockTest(doc.skill)) {
      throw new BadRequestException('Chỉ nhập kết quả Mock Test Speaking');
    }
    const score = payload.score?.trim();
    if (!score) {
      throw new BadRequestException('Thiếu điểm');
    }
    const examLink = payload.examLink?.trim() || doc.examLink;
    const updated = await this.model
      .findByIdAndUpdate(
        doc._id,
        {
          $set: {
            score,
            examLink,
          },
        },
        { new: true },
      )
      .lean()
      .exec();
    return this.toPublic(updated as MockTestLean);
  }

  async reject(id: string): Promise<MockTestRequestPublic> {
    const doc = await this.findByIdOrThrow(id);
    if (doc.status !== 'pending') {
      throw new BadRequestException('Yêu cầu không còn ở trạng thái chờ duyệt');
    }
    const updated = await this.model
      .findByIdAndUpdate(doc._id, { $set: { status: 'rejected' } }, { new: true })
      .lean()
      .exec();
    return this.toPublic(updated as MockTestLean);
  }
}
