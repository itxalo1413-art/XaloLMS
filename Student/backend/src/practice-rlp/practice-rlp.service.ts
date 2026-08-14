import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { RlpSessionRecord } from '../rlp/rlp.types';
import {
  PracticeRlpStore,
  type PracticeRlpStoreDocument,
} from './schemas/practice-rlp-store.schema';
import {
  CreatePracticeRlpSessionDto,
  UpdatePracticeRlpSessionDto,
} from './dto/practice-rlp.dto';

@Injectable()
export class PracticeRlpService {
  constructor(
    @InjectModel(PracticeRlpStore.name)
    private readonly storeModel: Model<PracticeRlpStoreDocument>,
  ) {}

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
