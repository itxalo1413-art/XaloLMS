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

@Injectable()
export class RlpService {
  constructor(
    @InjectModel(RlpCourseStore.name)
    private readonly storeModel: Model<RlpCourseStoreDocument>,
  ) {}

  private cloneDefaults(): RlpSessionRecord[] {
    return DEFAULT_RLP_SESSIONS.map((s) => ({ ...s }));
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
}
