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
    return DEFAULT_RLP_SESSIONS.map((s) => ({
      lessonFileUrl: '',
      homeworkFileUrl: '',
      recordingUrl: '',
      ...s,
    }));
  }

  private generateClassScheduleDates(
    startDateStr: string,
    nextPhaseStartDateStr: string | undefined,
    className: string,
    totalSessions = 20,
  ): string[] {
    const is357 = className.includes('357');
    const targetDays = is357 ? [2, 4, 6] : [1, 3, 5]; // 246 = Mon(1), Wed(3), Fri(5); 357 = Tue(2), Thu(4), Sat(6)

    const parseDate = (dStr: string) => {
      const parts = dStr.split('/');
      if (parts.length !== 3) return new Date();
      return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
    };

    const startDate = parseDate(startDateStr);

    const walkDates = (start: Date, count: number) => {
      const dates: Date[] = [];
      const curr = new Date(start);
      let guard = 0;
      while (dates.length < count && guard < 1000) {
        if (targetDays.includes(curr.getDay())) {
          dates.push(new Date(curr));
        }
        curr.setDate(curr.getDate() + 1);
        guard++;
      }
      return dates;
    };

    const phase1Dates = walkDates(startDate, 12);
    const result: string[] = [];
    phase1Dates.forEach((d) => {
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      result.push(`${dd}/${mm}/${d.getFullYear()}`);
    });

    let phase2Start: Date;
    if (nextPhaseStartDateStr) {
      phase2Start = parseDate(nextPhaseStartDateStr);
    } else {
      phase2Start = new Date(phase1Dates[phase1Dates.length - 1] || startDate);
      phase2Start.setDate(phase2Start.getDate() + 2);
    }

    const phase2Dates = walkDates(phase2Start, totalSessions - 12);
    phase2Dates.forEach((d) => {
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      result.push(`${dd}/${mm}/${d.getFullYear()}`);
    });

    return result;
  }

  private async ensureStoreForClass(classId: string): Promise<RlpSessionRecord[]> {
    if (!classId) {
      return this.ensureStore();
    }
    const storeKey = `rlp_store_${classId}`;
    let doc = await this.storeModel.findOne({ key: storeKey }).lean().exec();
    const mainSessions = await this.ensureStore();
    const mainMap = new Map(mainSessions.map((s) => [s.no, s]));
    const cls = await this.classModel.findById(classId).lean().exec();

    const className = cls?.name || cls?.classCode || '';
    const startDateStr = cls?.phaseStartDate || cls?.openDate;
    const computedDates = startDateStr
      ? this.generateClassScheduleDates(startDateStr, cls?.nextPhaseStartDate, className, mainSessions.length)
      : [];

    if (doc?.sessions?.length) {
      let modified = false;
      const updatedSessions = (doc.sessions as RlpSessionRecord[]).map((s, idx) => {
        const main = mainMap.get(s.no);
        let sUpdated = false;
        const next = { ...s };

        if (computedDates[idx] && next.date !== computedDates[idx]) {
          next.date = computedDates[idx];
          sUpdated = true;
        }

        if (main) {
          if (!next.recordingUrl && main.recordingUrl) {
            next.recordingUrl = main.recordingUrl;
            sUpdated = true;
          }
          if ((!next.teacherNote || next.teacherNote === '—') && main.teacherNote && main.teacherNote !== '—') {
            next.teacherNote = main.teacherNote;
            sUpdated = true;
          }
          if ((!next.homeworkStatus || next.homeworkStatus === 'not_assigned') && main.homeworkStatus && main.homeworkStatus !== 'not_assigned') {
            next.homeworkStatus = main.homeworkStatus;
            sUpdated = true;
          }
        }
        if (sUpdated) modified = true;
        return next;
      });

      if (modified) {
        await this.storeModel.collection.updateOne(
          { key: storeKey },
          { $set: { sessions: updatedSessions } },
        );
        return updatedSessions;
      }
      return doc.sessions as RlpSessionRecord[];
    }

    // Find class to align session dates
    const baseSessions = mainSessions.map((s, idx) => {
      const copy = { ...s };
      if (computedDates[idx]) {
        copy.date = computedDates[idx];
      }
      return copy;
    });

    await this.storeModel.collection.updateOne(
      { key: storeKey },
      { $set: { sessions: baseSessions } },
      { upsert: true },
    );
    return baseSessions;
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
    const MOCK_NOTES = new Set([
      "Đã nắm được đủ cấu trúc trả lời Part 1, mở rộng ví linh hoạt được.",
      "Hiểu yêu cầu Part 2, thiếu từ vựng cụ thể, cần luyện thêm chèn story.",
      "Nắm cách định vị đáp án Completion, làm được từ khóa T/F/NG.",
      "Cần chú ý hạ giọng khi phát âm, đã biết ở cuối câu hay cụm từ.",
      "Nắm được cách kéo dài để suy nghĩ idea cho Part 3.",
      "Hiểu cách đọc dày để áp dụng vào bài Matching headings.",
      "Hiểu ứng dụng cleft sentence, cần luyện thêm để thành nhuần nhuyễn.",
      "Nắm mẫu câu tạo ngữ căn bản, cần luyện phát âm nguyên âm đôi.",
      "Xử lý tốt dạng multiple choice đoạn học thuật.",
      "Diễn đạt hẹp hơn, nắm thành phần câu cơ bản.",
      "Luyện cụm động từ danh từ, đa phần hình thành cụm danh từ cơ bản.",
      "Nắm cách đọc lấy thông tin và so sánh với câu hỏi.",
    ]);

    return sessions.map((s) => {
      const note = s.teacherNote?.trim() ?? "";
      const isMockNote = MOCK_NOTES.has(note);
      return {
        ...s,
        teacherNote: isMockNote || !note ? "—" : note,
        lessonFileUrl: s.lessonFileUrl?.trim() ?? '',
        homeworkFileUrl: s.homeworkFileUrl?.trim() ?? '',
        recordingUrl: s.recordingUrl?.trim() ?? '',
      };
    });
  }

  async listSessions(): Promise<RlpSessionRecord[]> {
    return this.normalizeSessions(await this.ensureStore());
  }

  async listSessionsForStudent(email: string): Promise<RlpSessionRecord[]> {
    if (!email) return this.listSessions();
    const student = await this.studentModel.findOne({ email }).lean().exec();
    if (!student || !student.classId || student.classId === 'cls_placeholder') {
      return this.listSessions();
    }
    const classSessions = await this.ensureStoreForClass(student.classId);
    const mainSessions = await this.ensureStore();
    const mainMap = new Map(mainSessions.map((s) => [s.no, s]));

    const merged = classSessions.map((s) => {
      const main = mainMap.get(s.no);
      if (!main) return s;
      return {
        ...s,
        recordingUrl: (s.recordingUrl && s.recordingUrl.trim() !== '') ? s.recordingUrl : (main.recordingUrl || ''),
        teacherNote: (s.teacherNote && s.teacherNote !== '—') ? s.teacherNote : (main.teacherNote || s.teacherNote),
        homeworkStatus: (s.homeworkStatus && s.homeworkStatus !== 'not_assigned') ? s.homeworkStatus : (main.homeworkStatus || s.homeworkStatus),
        attendance: s.attendance || main.attendance || 'present',
      };
    });

    return this.normalizeSessions(merged);
  }

  async listSessionsForClass(classId: string): Promise<RlpSessionRecord[]> {
    if (!classId) return this.listSessions();
    return this.normalizeSessions(await this.ensureStoreForClass(classId));
  }

  async updateSession(
    no: number,
    payload: UpdateRlpSessionDto,
  ): Promise<RlpSessionRecord> {
    const mainSessions = await this.ensureStore();
    const mainIdx = mainSessions.findIndex((s) => s.no === no);
    if (mainIdx < 0) {
      throw new NotFoundException('Không tìm thấy buổi RLP');
    }

    const patchObj: Partial<RlpSessionRecord> = {};
    if (payload.attendance !== undefined) patchObj.attendance = payload.attendance;
    if (payload.studentAttendance !== undefined) {
      patchObj.studentAttendance = {
        ...(mainSessions[mainIdx].studentAttendance ?? {}),
        ...payload.studentAttendance,
      };
    }
    if (payload.homeworkStatus !== undefined) patchObj.homeworkStatus = payload.homeworkStatus;
    if (payload.teacherNote !== undefined) patchObj.teacherNote = payload.teacherNote.trim();
    if (payload.lessonFileUrl !== undefined) patchObj.lessonFileUrl = payload.lessonFileUrl.trim();
    if (payload.homeworkFileUrl !== undefined) patchObj.homeworkFileUrl = payload.homeworkFileUrl.trim();
    if (payload.recordingUrl !== undefined) patchObj.recordingUrl = payload.recordingUrl.trim();
    if (payload.contents !== undefined) patchObj.contents = payload.contents.trim();
    if (payload.date !== undefined) patchObj.date = payload.date.trim();
    if (payload.deadline !== undefined) patchObj.deadline = payload.deadline.trim();
    if (payload.skill !== undefined) patchObj.skill = payload.skill.trim();

    const updatedMain = { ...mainSessions[mainIdx], ...patchObj };
    mainSessions[mainIdx] = updatedMain;

    await this.storeModel.collection.updateOne(
      { key: RLP_COURSE_KEY },
      { $set: { sessions: mainSessions } },
      { upsert: true },
    );

    const allStores = await this.storeModel.find({}).lean().exec();
    for (const store of allStores) {
      if (store.key === RLP_COURSE_KEY) continue;
      const cSessions = (store.sessions as RlpSessionRecord[]) || [];
      const cIdx = cSessions.findIndex((s) => s.no === no);
      if (cIdx >= 0) {
        cSessions[cIdx] = { ...cSessions[cIdx], ...patchObj };
        await this.storeModel.collection.updateOne(
          { key: store.key },
          { $set: { sessions: cSessions } },
        );
      }
    }

    return updatedMain;
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
    const patchObj: Partial<RlpSessionRecord> = {};
    if (payload.attendance !== undefined) patchObj.attendance = payload.attendance;
    if (payload.studentAttendance !== undefined) {
      patchObj.studentAttendance = {
        ...(current.studentAttendance ?? {}),
        ...payload.studentAttendance,
      };
    }
    if (payload.homeworkStatus !== undefined) patchObj.homeworkStatus = payload.homeworkStatus;
    if (payload.teacherNote !== undefined) patchObj.teacherNote = payload.teacherNote.trim();
    if (payload.lessonFileUrl !== undefined) patchObj.lessonFileUrl = payload.lessonFileUrl.trim();
    if (payload.homeworkFileUrl !== undefined) patchObj.homeworkFileUrl = payload.homeworkFileUrl.trim();
    if (payload.recordingUrl !== undefined) patchObj.recordingUrl = payload.recordingUrl.trim();
    if (payload.contents !== undefined) patchObj.contents = payload.contents.trim();
    if (payload.date !== undefined) patchObj.date = payload.date.trim();
    if (payload.deadline !== undefined) patchObj.deadline = payload.deadline.trim();
    if (payload.skill !== undefined) patchObj.skill = payload.skill.trim();

    const updated = { ...current, ...patchObj };
    sessions[index] = updated;
    await this.storeModel.collection.updateOne(
      { key: storeKey },
      { $set: { sessions } },
    );

    const mainSessions = await this.ensureStore();
    const mainIdx = mainSessions.findIndex((s) => s.no === no);
    if (mainIdx >= 0) {
      mainSessions[mainIdx] = { ...mainSessions[mainIdx], ...patchObj };
      await this.storeModel.collection.updateOne(
        { key: RLP_COURSE_KEY },
        { $set: { sessions: mainSessions } },
        { upsert: true },
      );
    }

    return updated;
  }
}
