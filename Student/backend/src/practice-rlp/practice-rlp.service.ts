import { Injectable, BadRequestException, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { RlpSessionRecord, HomeworkStatus } from '../rlp/rlp.types';
import { User, type UserDocument } from '../users/schemas/user.schema';
import {
  PracticeRlpStore,
  type PracticeRlpStoreDocument,
} from './schemas/practice-rlp-store.schema';
import {
  CreatePracticeRlpSessionDto,
  UpdatePracticeRlpSessionDto,
} from './dto/practice-rlp.dto';
import { PRACTICE_RLP_DEMO_SESSIONS } from './practice-rlp.seed';

@Injectable()
export class PracticeRlpService implements OnModuleInit {
  constructor(
    @InjectModel(PracticeRlpStore.name)
    private readonly storeModel: Model<PracticeRlpStoreDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seedDemoSessionsIfEmpty();
  }

  private async seedDemoSessionsIfEmpty(): Promise<void> {
    const email = (
      process.env.STUDENT_SEED_EMAIL ?? 'nguyenduong939705@gmail.com'
    )
      .trim()
      .toLowerCase();
    const user = await this.userModel.findOne({ email }).lean().exec();
    if (!user) return;

    const studentId = user._id.toString();
    const existing = await this.storeModel.findOne({ studentId }).lean().exec();
    if (existing?.sessions?.length) return;

    await this.storeModel.updateOne(
      { studentId },
      { $set: { sessions: PRACTICE_RLP_DEMO_SESSIONS } },
      { upsert: true },
    );
  }

  // ── Ensure document exists for student ──────────────────────────────────────
  private async ensureStore(studentId: string): Promise<RlpSessionRecord[]> {
    let doc = await this.storeModel.findOne({ studentId }).lean().exec();
    if (!doc) {
      await this.storeModel.create({ studentId, sessions: [] });
      return [];
    }
    return (doc.sessions as RlpSessionRecord[]) ?? [];
  }

  // ── List all sessions for a student ─────────────────────────────────────────
  async listSessions(studentId: string): Promise<RlpSessionRecord[]> {
    return this.ensureStore(studentId);
  }

  /** Học viên đã có RLP luyện đề hoặc đã từng đăng ký ca — cho Minh Tâm/ACA chọn. */
  async listKnownStudents(): Promise<
    { id: string; name: string; email: string }[]
  > {
    const storeIds = (
      await this.storeModel.distinct('studentId').exec()
    ).map((id) => String(id));

    let regIds: string[] = [];
    try {
      const raw = await this.storeModel.db
        .collection('practice_class_registrations')
        .distinct('userId');
      regIds = raw.map((id) => String(id));
    } catch {
      regIds = [];
    }

    const allIds = [...new Set([...storeIds, ...regIds])].filter(Boolean);
    if (allIds.length === 0) return [];

    const objectIds = allIds.filter((id) => /^[a-f\d]{24}$/i.test(id));
    const users = await this.userModel
      .find({ _id: { $in: objectIds } })
      .select({ name: 1, email: 1 })
      .lean()
      .exec();

    return users
      .map((u) => ({
        id: u._id.toString(),
        name: String(u.name || '').trim() || u._id.toString(),
        email: String(u.email || '').trim(),
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  }

  // ── Add a new session ────────────────────────────────────────────────────────
  async addSession(
    studentId: string,
    dto: CreatePracticeRlpSessionDto,
  ): Promise<RlpSessionRecord> {
    const sessions = await this.ensureStore(studentId);
    // Prevent duplicate 'no'
    const existingNos = new Set(sessions.map((s) => s.no));
    const no = dto.no ?? (sessions.length > 0 ? Math.max(...sessions.map((s) => s.no)) + 1 : 1);
    if (existingNos.has(no)) {
      throw new Error(`Buổi số ${no} đã tồn tại`);
    }
    const newSession: RlpSessionRecord = {
      no,
      date: dto.date ?? '',
      skill: dto.skill ?? 'Speaking',
      contents: dto.contents ?? '',
      teacherNote: dto.teacherNote?.trim() ?? '—',
      deadline: dto.deadline ?? '',
      homeworkStatus: dto.homeworkStatus ?? 'not_assigned',
      attendance: dto.attendance ?? 'present',
      lessonFileUrl: dto.lessonFileUrl?.trim() ?? '',
      homeworkFileUrl: dto.homeworkFileUrl?.trim() ?? '',
      recordingUrl: dto.recordingUrl?.trim() ?? '',
    };
    const updated = [...sessions, newSession].sort((a, b) => a.no - b.no);
    await this.storeModel.collection.updateOne(
      { studentId },
      { $set: { sessions: updated } },
    );
    return newSession;
  }

  // ── Update an existing session ───────────────────────────────────────────────
  async updateSession(
    studentId: string,
    no: number,
    dto: UpdatePracticeRlpSessionDto,
  ): Promise<RlpSessionRecord> {
    const sessions = await this.ensureStore(studentId);
    const idx = sessions.findIndex((s) => s.no === no);
    if (idx < 0) throw new NotFoundException(`Không tìm thấy buổi RLP số ${no}`);

    const patch: Partial<RlpSessionRecord> = {};
    if (dto.attendance !== undefined) patch.attendance = dto.attendance;
    if (dto.homeworkStatus !== undefined) patch.homeworkStatus = dto.homeworkStatus;
    if (dto.teacherNote !== undefined) patch.teacherNote = dto.teacherNote.trim();
    if (dto.lessonFileUrl !== undefined) patch.lessonFileUrl = dto.lessonFileUrl.trim();
    if (dto.homeworkFileUrl !== undefined) patch.homeworkFileUrl = dto.homeworkFileUrl.trim();
    if (dto.recordingUrl !== undefined) patch.recordingUrl = dto.recordingUrl.trim();
    if (dto.contents !== undefined) patch.contents = dto.contents.trim();
    if (dto.date !== undefined) patch.date = dto.date.trim();
    if (dto.deadline !== undefined) patch.deadline = dto.deadline.trim();
    if (dto.skill !== undefined) patch.skill = dto.skill.trim();

    const updated = { ...sessions[idx], ...patch };
    sessions[idx] = updated;
    await this.storeModel.collection.updateOne(
      { studentId },
      { $set: { sessions } },
    );
    return updated;
  }

  /** Học viên chỉ được đánh dấu nộp / hủy nộp BTVN. */
  async updateStudentHomework(
    studentId: string,
    no: number,
    homeworkStatus: HomeworkStatus,
  ): Promise<RlpSessionRecord> {
    const allowed: HomeworkStatus[] = ['in_progress', 'overdue', 'submitted_waiting'];
    if (!allowed.includes(homeworkStatus)) {
      throw new BadRequestException('Học viên chỉ có thể đánh dấu Chưa nộp hoặc Đã nộp');
    }

    const sessions = await this.ensureStore(studentId);
    const idx = sessions.findIndex((s) => s.no === no);
    if (idx < 0) throw new NotFoundException(`Không tìm thấy buổi RLP số ${no}`);

    const current = sessions[idx].homeworkStatus;
    if (current === 'submitted') {
      throw new BadRequestException('Bài đã được chấm, không thể thay đổi trạng thái');
    }
    if (current === 'not_assigned' && homeworkStatus === 'submitted_waiting') {
      throw new BadRequestException('Buổi học này chưa có bài tập');
    }

    return this.updateSession(studentId, no, { homeworkStatus });
  }

  // ── Delete a session ─────────────────────────────────────────────────────────
  async deleteSession(studentId: string, no: number): Promise<{ deleted: boolean }> {
    const sessions = await this.ensureStore(studentId);
    const idx = sessions.findIndex((s) => s.no === no);
    if (idx < 0) throw new NotFoundException(`Không tìm thấy buổi RLP số ${no}`);
    sessions.splice(idx, 1);
    await this.storeModel.collection.updateOne(
      { studentId },
      { $set: { sessions } },
    );
    return { deleted: true };
  }
}
