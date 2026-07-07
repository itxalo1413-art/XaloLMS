import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UpdateRlpSessionDto } from './dto/update-rlp-session.dto';
import { DEFAULT_RLP_SESSIONS } from './rlp-defaults';
import type { RlpSessionRecord } from './rlp.types';
import {
  RLP_COURSE_KEY,
  RlpCourseStore,
  type RlpCourseStoreDocument,
} from './schemas/rlp-course-store.schema';
import { AcaStudent, AcaStudentDocument } from '../aca/schemas/aca-student.schema';
import { AcaClass, AcaClassDocument } from '../aca/schemas/aca-class.schema';

@Injectable()
export class RlpService {
  constructor(
    @InjectModel(RlpCourseStore.name)
    private readonly storeModel: Model<RlpCourseStoreDocument>,
    @InjectModel(AcaStudent.name)
    private readonly studentModel: Model<AcaStudentDocument>,
    @InjectModel(AcaClass.name)
    private readonly classModel: Model<AcaClassDocument>,
  ) {}

  private cloneDefaults(): RlpSessionRecord[] {
    return DEFAULT_RLP_SESSIONS.map((s) => ({ ...s }));
  }

  private async ensureStoreForClass(classId: string): Promise<RlpSessionRecord[]> {
    if (!classId) {
      return this.ensureStore();
    }
    const storeKey = `rlp_store_${classId}`;
    let doc = await this.storeModel.findOne({ key: storeKey }).lean().exec();
    if (!doc?.sessions?.length) {
      // Find class to align session dates
      const cls = await this.classModel.findById(classId).lean().exec();
      const baseSessions = this.cloneDefaults();
      if (cls && (cls.phaseStartDate || cls.openDate)) {
        const dateStr = cls.phaseStartDate || cls.openDate;
        const parts = dateStr.split('/');
        if (parts.length === 3) {
          const d = parseInt(parts[0], 10);
          const m = parseInt(parts[1], 10);
          const y = parseInt(parts[2], 10);
          const startDate = new Date(y, m - 1, d);
          
          baseSessions.forEach((session, idx) => {
            const currentSessionDate = new Date(startDate);
            currentSessionDate.setDate(startDate.getDate() + Math.round(idx * 3.5));
            const dd = String(currentSessionDate.getDate()).padStart(2, '0');
            const mm = String(currentSessionDate.getMonth() + 1).padStart(2, '0');
            const yyyy = currentSessionDate.getFullYear();
            session.date = `${dd}/${mm}/${yyyy}`;
            
            const deadlineDate = new Date(currentSessionDate);
            deadlineDate.setDate(currentSessionDate.getDate() + 7);
            const ddd = String(deadlineDate.getDate()).padStart(2, '0');
            const mmm = String(deadlineDate.getMonth() + 1).padStart(2, '0');
            const yyyyy = deadlineDate.getFullYear();
            session.deadline = `${ddd}/${mmm}/${yyyyy}`;
            
            session.teacherNote = '—';
            session.homeworkStatus = 'not_assigned';
            session.attendance = 'present';
          });
        }
      }
      
      const created = await this.storeModel.create({
        key: storeKey,
        sessions: baseSessions,
      });
      doc = created.toObject();
    }
    return doc.sessions as RlpSessionRecord[];
  }

  private async ensureStore(): Promise<RlpSessionRecord[]> {
    let doc = await this.storeModel.findOne({ key: RLP_COURSE_KEY }).lean().exec();
    if (!doc?.sessions?.length) {
      const created = await this.storeModel.create({
        key: RLP_COURSE_KEY,
        sessions: this.cloneDefaults(),
      });
      doc = created.toObject();
    }
    return doc.sessions as RlpSessionRecord[];
  }

  private normalizeSessions(sessions: RlpSessionRecord[]): RlpSessionRecord[] {
    return sessions.map((s) => ({
      ...s,
      lessonFileUrl: s.lessonFileUrl?.trim() ?? '',
    }));
  }

  async listSessions(): Promise<RlpSessionRecord[]> {
    return this.normalizeSessions(await this.ensureStore());
  }

  async listSessionsForStudent(email: string): Promise<RlpSessionRecord[]> {
    if (!email) return this.listSessions();
    const student = await this.studentModel.findOne({ email }).lean().exec();
    if (!student || !student.classId) {
      return this.listSessions();
    }
    return this.normalizeSessions(await this.ensureStoreForClass(student.classId));
  }

  async listSessionsForClass(classId: string): Promise<RlpSessionRecord[]> {
    if (!classId) return this.listSessions();
    return this.normalizeSessions(await this.ensureStoreForClass(classId));
  }

  async updateSession(
    no: number,
    payload: UpdateRlpSessionDto,
  ): Promise<RlpSessionRecord> {
    const sessions = await this.ensureStore();
    const index = sessions.findIndex((s) => s.no === no);
    if (index < 0) {
      throw new NotFoundException('Không tìm thấy buổi RLP');
    }
    const current = sessions[index];
    const next: RlpSessionRecord = {
      ...current,
      ...(payload.attendance !== undefined
        ? { attendance: payload.attendance }
        : {}),
      ...(payload.homeworkStatus !== undefined
        ? { homeworkStatus: payload.homeworkStatus }
        : {}),
      ...(payload.teacherNote !== undefined
        ? { teacherNote: payload.teacherNote.trim() }
        : {}),
      ...(payload.lessonFileUrl !== undefined
        ? { lessonFileUrl: payload.lessonFileUrl.trim() }
        : {}),
    };
    sessions[index] = next;
    await this.storeModel
      .findOneAndUpdate(
        { key: RLP_COURSE_KEY },
        { $set: { sessions } },
        { upsert: true },
      )
      .exec();
    return next;
  }

  async updateSessionForClass(
    classId: string,
    no: number,
    payload: UpdateRlpSessionDto,
  ): Promise<RlpSessionRecord> {
    if (!classId) {
      return this.updateSession(no, payload);
    }
    const storeKey = `rlp_store_${classId}`;
    const sessions = await this.ensureStoreForClass(classId);
    const index = sessions.findIndex((s) => s.no === no);
    if (index < 0) {
      throw new NotFoundException('Không tìm thấy buổi RLP');
    }
    const current = sessions[index];
    const next: RlpSessionRecord = {
      ...current,
      ...(payload.attendance !== undefined
        ? { attendance: payload.attendance }
        : {}),
      ...(payload.homeworkStatus !== undefined
        ? { homeworkStatus: payload.homeworkStatus }
        : {}),
      ...(payload.teacherNote !== undefined
        ? { teacherNote: payload.teacherNote.trim() }
        : {}),
      ...(payload.lessonFileUrl !== undefined
        ? { lessonFileUrl: payload.lessonFileUrl.trim() }
        : {}),
    };
    sessions[index] = next;
    await this.storeModel
      .findOneAndUpdate(
        { key: storeKey },
        { $set: { sessions } },
        { upsert: true },
      )
      .exec();
    return next;
  }
}
