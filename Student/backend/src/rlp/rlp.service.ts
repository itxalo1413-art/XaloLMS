import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateRlpSessionDto } from './dto/create-rlp-session.dto';
import { UpdateRlpSessionDto } from './dto/update-rlp-session.dto';
import { DEFAULT_RLP_SESSIONS } from './rlp-defaults';
import type { HomeworkStatus, RlpSessionRecord } from './rlp.types';
import {
  RLP_COURSE_KEY,
  RlpCourseStore,
  type RlpCourseStoreDocument,
} from './schemas/rlp-course-store.schema';
import {
  RlpTemplate,
  type RlpTemplateDocument,
} from './schemas/rlp-template.schema';
import { DEFAULT_RLP_TEMPLATES } from './rlp-templates.seed';
import {
  ApplyClassRlpDto,
  ApplyRlpTemplateDto,
  CreateRlpTemplateDto,
  UpdateRlpTemplateDto,
} from './dto/rlp-template.dto';
import { AcaStudent, AcaStudentDocument } from '../aca/schemas/aca-student.schema';
import { AcaClass, AcaClassDocument } from '../aca/schemas/aca-class.schema';
import { AcademicWarningService } from '../academic-warning/academic-warning.service';
import {
  lookupStudentAttendance,
  resolveStudentHomework,
} from './rlp-progress.util';
import {
  buildRlpSchedulePlan,
  formatViDate,
  parseViDate,
  resolveRlpTargetDays,
  walkMeetingDates,
  type RlpSchedulePlan,
} from './rlp-schedule.util';
import {
  buildRlpStoreKey,
  legacyRlpStoreKey,
  resolveClassCohortKey,
} from './rlp-cohort.util';

@Injectable()
export class RlpService implements OnModuleInit {
  constructor(
    @InjectModel(RlpCourseStore.name)
    private readonly storeModel: Model<RlpCourseStoreDocument>,
    @InjectModel(RlpTemplate.name)
    private readonly templateModel: Model<RlpTemplateDocument>,
    @InjectModel(AcaStudent.name)
    private readonly studentModel: Model<AcaStudentDocument>,
    @InjectModel(AcaClass.name)
    private readonly classModel: Model<AcaClassDocument>,
    private readonly academicWarnings: AcademicWarningService,
  ) {}

  async onModuleInit() {
    try {
      for (const t of DEFAULT_RLP_TEMPLATES) {
        await this.templateModel.updateOne(
          { key: t.key },
          { $setOnInsert: t },
          { upsert: true },
        );
      }
    } catch (err) {
      console.warn('Không thể khởi tạo seed RLP Templates:', err);
    }
  }

  private cloneDefaults(): RlpSessionRecord[] {
    return DEFAULT_RLP_SESSIONS.map((s) => ({
      lessonFileUrl: '',
      homeworkFileUrl: '',
      recordingUrl: '',
      ...s,
    }));
  }

  private blankSession(no: number, date = ''): RlpSessionRecord {
    const template = DEFAULT_RLP_SESSIONS[(no - 1) % DEFAULT_RLP_SESSIONS.length];
    let deadline = '';
    const parsed = parseViDate(date);
    if (parsed) {
      const due = new Date(parsed);
      due.setDate(due.getDate() + 7);
      deadline = formatViDate(due);
    }
    return {
      no,
      date,
      skill: template?.skill || 'Speaking',
      contents: template?.contents || '—',
      teacherNote: '—',
      deadline,
      homeworkStatus: 'not_assigned',
      attendance: 'present',
      lessonFileUrl: '',
      homeworkFileUrl: '',
      recordingUrl: '',
    };
  }

  private buildSessionsForPlan(
    plan: RlpSchedulePlan,
    existing?: RlpSessionRecord[],
  ): RlpSessionRecord[] {
    const byNo = new Map((existing ?? []).map((s) => [s.no, s]));
    const total = plan.dates.length;
    const sessions: RlpSessionRecord[] = [];
    for (let i = 0; i < total; i++) {
      const no = i + 1;
      const date = plan.dates[i] || '';
      const prev = byNo.get(no);
      if (prev) {
        sessions.push({
          ...prev,
          no,
          date: prev.date?.trim() ? prev.date : date,
        });
      } else {
        sessions.push(this.blankSession(no, date));
      }
    }
    return sessions;
  }

  private schedulePlanForClass(cls: {
    name?: string;
    classCode?: string;
    phaseStartDate?: string;
    openDate?: string;
    nextPhaseStartDate?: string;
    endDate?: string;
    phaseDurationDays?: number;
  } | null): RlpSchedulePlan | null {
    if (!cls) return null;
    const startDateStr = cls.phaseStartDate || cls.openDate;
    if (!startDateStr?.trim()) return null;
    return buildRlpSchedulePlan({
      className: cls.name || cls.classCode || '',
      classCode: cls.classCode || '',
      phaseStartDate: cls.phaseStartDate,
      openDate: cls.openDate,
      nextPhaseStartDate: cls.nextPhaseStartDate,
      endDate: cls.endDate,
      phaseDurationDays: cls.phaseDurationDays,
    });
  }

  /**
   * Resolve store key theo đợt (cohort).
   * - Active class: class.rlpCohortKey (từ openDate)
   * - Student: student.rlpCohortKey nếu đã pin (đợt họ học)
   * - Legacy `rlp_store_${classId}` được migrate sang key có cohort 1 lần.
   */
  private async resolveClassStoreContext(
    classId: string,
    cohortOverride?: string,
  ): Promise<{
    classId: string;
    cohortKey: string;
    storeKey: string;
    cls: AcaClass | null;
  }> {
    const cls = (await this.classModel.findById(classId).lean().exec()) as AcaClass | null;
    let cohortKey = String(cohortOverride || '').trim();
    if (!cohortKey) {
      cohortKey = resolveClassCohortKey(cls || {});
    }

    if (cls && !String(cls.rlpCohortKey || '').trim()) {
      await this.classModel
        .updateOne({ _id: classId }, { $set: { rlpCohortKey: cohortKey } })
        .exec();
    }

    const storeKey = buildRlpStoreKey(classId, cohortKey);
    const legacyKey = legacyRlpStoreKey(classId);

    const existing = await this.storeModel.findOne({ key: storeKey }).lean().exec();
    if (!existing?.sessions?.length) {
      const legacy = await this.storeModel.findOne({ key: legacyKey }).lean().exec();
      if (legacy?.sessions?.length) {
        // Migrate store cũ → key có cohort (giữ nguyên dữ liệu đợt hiện tại).
        await this.storeModel.collection.updateOne(
          { key: storeKey },
          {
            $set: {
              sessions: legacy.sessions,
              classId,
              cohortKey,
            },
          },
          { upsert: true },
        );
        await this.storeModel.collection.updateOne(
          { key: legacyKey },
          { $set: { migratedTo: storeKey, migratedAt: new Date() } },
        );
      }
    }

    return { classId, cohortKey, storeKey, cls };
  }

  private async ensureStoreForClass(
    classId: string,
    cohortOverride?: string,
  ): Promise<RlpSessionRecord[]> {
    if (!classId) {
      return this.ensureStore();
    }

    const { storeKey, cls, cohortKey } = await this.resolveClassStoreContext(
      classId,
      cohortOverride,
    );
    let doc = await this.storeModel.findOne({ key: storeKey }).lean().exec();
    const plan = this.schedulePlanForClass(cls);

    if (doc?.sessions?.length) {
      const sessions = doc.sessions as RlpSessionRecord[];
      // Không ép lại số buổi theo lịch seed — GV/ACA có thể thêm/xoá buổi.
      // Chỉ điền ngày trống từ plan khi buổi chưa có date.
      if (plan?.dates.length) {
        let modified = false;
        const byNo = new Map(sessions.map((s) => [s.no, s]));
        const updatedSessions = sessions.map((s) => {
          if (s.date?.trim()) return s;
          const planDate = plan.dates[s.no - 1] || plan.dates[byNo.size - 1];
          if (!planDate) return s;
          modified = true;
          return { ...s, date: planDate };
        });
        if (modified) {
          await this.storeModel.collection.updateOne(
            { key: storeKey },
            { $set: { sessions: updatedSessions } },
          );
          return updatedSessions;
        }
      }
      return sessions;
    }

    // Store đợt mới / lần đầu — lịch sạch, không clone từ đợt cũ hay `main`.
    const baseSessions = plan?.dates.length
      ? this.buildSessionsForPlan(plan)
      : this.cloneDefaults().map((s) => ({
          ...s,
          teacherNote: '—',
          homeworkStatus: 'not_assigned' as const,
          recordingUrl: '',
          lessonFileUrl: '',
          homeworkFileUrl: '',
          studentAttendance: {},
          studentHomework: {},
        }));

    await this.storeModel.collection.updateOne(
      { key: storeKey },
      {
        $set: {
          sessions: baseSessions,
          classId,
          cohortKey,
        },
      },
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
    const escaped = email.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const student = await this.studentModel
      .findOne({ email: new RegExp(`^${escaped}$`, 'i') })
      .lean()
      .exec();
    if (!student || !student.classId || student.classId === 'cls_placeholder') {
      return this.listSessions();
    }
    // HV xem RLP đúng đợt họ được pin; thiếu pin → đợt đang active của lớp.
    const studentCohort = String((student as { rlpCohortKey?: string }).rlpCohortKey || '').trim();
    const classSessions = await this.ensureStoreForClass(
      student.classId,
      studentCohort || undefined,
    );
    const cls = await this.classModel.findById(student.classId).lean().exec();
    const classTeacher = String(cls?.teacher || '').trim();

    // Auto-pin cohort lần đầu HV mở RLP (đợt hiện tại của lớp).
    if (!studentCohort && cls) {
      const activeCohort = resolveClassCohortKey(cls);
      await this.studentModel
        .updateOne(
          { _id: student._id },
          { $set: { rlpCohortKey: activeCohort } },
        )
        .exec();
    }

    const identity = {
      id: String(student._id),
      email: student.email,
      name: student.name,
      phone: student.phone,
    };

    // Chỉ đọc store của lớp HV — không merge với RLP `main` dùng chung.
    const merged = classSessions.map((s) => {
      const personalAtt = lookupStudentAttendance(s, identity);
      return {
        ...s,
        responsibleTeacher:
          String(s.responsibleTeacher || '').trim() || classTeacher || '',
        homeworkStatus: resolveStudentHomework(s, identity),
        // Điểm danh cá nhân; nếu chưa ĐD thì không bịa từ class-level.
        attendance: personalAtt ?? s.attendance,
        studentAttendance: personalAtt
          ? { [identity.id]: personalAtt }
          : {},
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
    if (payload.studentHomework !== undefined) {
      patchObj.studentHomework = {
        ...(mainSessions[mainIdx].studentHomework ?? {}),
        ...payload.studentHomework,
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

    // Chỉ cập nhật template `main` — không lan sang store từng lớp.
    await this.storeModel.collection.updateOne(
      { key: RLP_COURSE_KEY },
      { $set: { sessions: mainSessions } },
      { upsert: true },
    );

    this.refreshAcademicWarnings();
    return updatedMain;
  }

  private refreshAcademicWarnings() {
    void this.academicWarnings.syncFromRlp(true).catch((err) => {
      console.warn('Không đồng bộ được cảnh báo học tập từ RLP:', err);
    });
  }

  async updateSessionForClass(
    classId: string,
    no: number,
    payload: UpdateRlpSessionDto,
  ): Promise<RlpSessionRecord> {
    if (!classId) {
      return this.updateSession(no, payload);
    }
    const { storeKey } = await this.resolveClassStoreContext(classId);
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
    if (payload.studentHomework !== undefined) {
      patchObj.studentHomework = {
        ...(current.studentHomework ?? {}),
        ...payload.studentHomework,
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

    // Chỉ ghi store đợt active của lớp này — không đẩy sang `main` / lớp khác / đợt cũ.
    this.refreshAcademicWarnings();
    return updated;
  }

  async addSessionForClass(
    classId: string,
    dto: CreateRlpSessionDto = {},
  ): Promise<RlpSessionRecord> {
    if (!classId) {
      throw new BadRequestException('Thiếu classId');
    }
    const { storeKey } = await this.resolveClassStoreContext(classId);
    const sessions = await this.ensureStoreForClass(classId);
    const existingNos = new Set(sessions.map((s) => s.no));
    const no =
      dto.no ??
      (sessions.length > 0 ? Math.max(...sessions.map((s) => s.no)) + 1 : 1);
    if (existingNos.has(no)) {
      throw new BadRequestException(`Buổi số ${no} đã tồn tại`);
    }

    const base = this.blankSession(no, dto.date?.trim() || '');
    const newSession: RlpSessionRecord = {
      ...base,
      skill: dto.skill?.trim() || base.skill,
      contents: dto.contents?.trim() || base.contents,
      teacherNote: dto.teacherNote?.trim() || '—',
      deadline: dto.deadline?.trim() || base.deadline,
      homeworkStatus: dto.homeworkStatus ?? 'not_assigned',
      attendance: dto.attendance ?? 'present',
      lessonFileUrl: dto.lessonFileUrl?.trim() ?? '',
      homeworkFileUrl: dto.homeworkFileUrl?.trim() ?? '',
      recordingUrl: dto.recordingUrl?.trim() ?? '',
      studentAttendance: {},
      studentHomework: {},
    };

    const updated = [...sessions, newSession].sort((a, b) => a.no - b.no);
    await this.storeModel.collection.updateOne(
      { key: storeKey },
      { $set: { sessions: updated } },
      { upsert: true },
    );
    this.refreshAcademicWarnings();
    return newSession;
  }

  async deleteSessionForClass(
    classId: string,
    no: number,
  ): Promise<{ deleted: boolean }> {
    if (!classId) {
      throw new BadRequestException('Thiếu classId');
    }
    const { storeKey } = await this.resolveClassStoreContext(classId);
    const sessions = await this.ensureStoreForClass(classId);
    const idx = sessions.findIndex((s) => s.no === no);
    if (idx < 0) {
      throw new NotFoundException(`Không tìm thấy buổi RLP số ${no}`);
    }
    sessions.splice(idx, 1);
    await this.storeModel.collection.updateOne(
      { key: storeKey },
      { $set: { sessions } },
    );
    this.refreshAcademicWarnings();
    return { deleted: true };
  }

  async updateHomeworkForStudent(
    email: string,
    no: number,
    status: HomeworkStatus,
    homeworkFileUrl?: string,
  ): Promise<RlpSessionRecord> {
    const student = await this.studentModel.findOne({ email }).lean().exec();
    if (!student || !student.classId || student.classId === 'cls_placeholder') {
      throw new NotFoundException('Không tìm thấy lớp của học viên');
    }
    const studentId = String(student._id);
    const patch: Record<string, HomeworkStatus> = { [studentId]: status };
    if (student.email) patch[student.email.trim()] = status;
    const payload: UpdateRlpSessionDto = {
      studentHomework: patch,
    };
    if (typeof homeworkFileUrl === 'string') {
      payload.homeworkFileUrl = homeworkFileUrl.trim();
    }
    const session = await this.updateSessionForClass(student.classId, no, payload);
    const identity = {
      id: studentId,
      email: student.email,
      name: student.name,
      phone: student.phone,
    };
    return {
      ...session,
      homeworkStatus: resolveStudentHomework(session, identity),
    };
  }

  /* =========================================================
   * RLP TEMPLATES (RLP MẪU)
   * ========================================================= */

  /** Catalog RLP từ các lớp ACA thật đang tồn tại (không dùng seed cấp độ). */
  async listClassRlpCatalog(): Promise<
    Array<{
      classId: string;
      className: string;
      classCode: string;
      teacher: string;
      openDate: string;
      phaseStartDate: string;
      totalSessions: number;
      filledSessions: number;
      sessions: Array<{
        no: number;
        skill: string;
        contents: string;
        teacherNote?: string;
        lessonFileUrl?: string;
        homeworkFileUrl?: string;
        recordingUrl?: string;
      }>;
    }>
  > {
    const classes = await this.classModel.find().sort({ name: 1 }).lean().exec();
    const rows: Array<{
      classId: string;
      className: string;
      classCode: string;
      teacher: string;
      openDate: string;
      phaseStartDate: string;
      totalSessions: number;
      filledSessions: number;
      sessions: Array<{
        no: number;
        skill: string;
        contents: string;
        teacherNote?: string;
        lessonFileUrl?: string;
        homeworkFileUrl?: string;
        recordingUrl?: string;
      }>;
    }> = [];

    for (const cls of classes) {
      const classId = String((cls as { _id?: { toString(): string } })._id || '');
      if (!classId) continue;
      const classSessions = await this.ensureStoreForClass(classId);
      const sessions = (classSessions || []).map((s) => ({
        no: s.no,
        skill: s.skill || '',
        contents: s.contents || '',
        teacherNote: s.teacherNote || '',
        lessonFileUrl: s.lessonFileUrl || '',
        homeworkFileUrl: s.homeworkFileUrl || '',
        recordingUrl: s.recordingUrl || '',
      }));
      const filledSessions = sessions.filter((s) => {
        const c = (s.contents || '').trim();
        return c.length > 0 && c !== '—';
      }).length;

      rows.push({
        classId,
        className: String((cls as { name?: string }).name || ''),
        classCode: String((cls as { classCode?: string }).classCode || ''),
        teacher: String((cls as { teacher?: string }).teacher || ''),
        openDate: String((cls as { openDate?: string }).openDate || ''),
        phaseStartDate: String((cls as { phaseStartDate?: string }).phaseStartDate || ''),
        totalSessions: sessions.length,
        filledSessions,
        sessions,
      });
    }

    return rows;
  }

  async getClassRlpSource(sourceClassId: string) {
    const catalog = await this.listClassRlpCatalog();
    const hit = catalog.find((c) => c.classId === sourceClassId);
    if (!hit) {
      throw new NotFoundException('Không tìm thấy lớp nguồn RLP.');
    }
    return hit;
  }

  private async applySessionItemsToClass(
    sourceTitle: string,
    templateSessions: Array<{
      no: number;
      skill: string;
      contents: string;
      teacherNote?: string;
      lessonFileUrl?: string;
      homeworkFileUrl?: string;
      recordingUrl?: string;
    }>,
    dto: ApplyRlpTemplateDto | ApplyClassRlpDto,
  ): Promise<{
    applied: boolean;
    templateTitle: string;
    totalSessions: number;
    sessions: RlpSessionRecord[];
  }> {
    const { classId, scheduleMode = 'auto', startDate } = dto;
    if (!classId) {
      throw new BadRequestException('Thiếu classId khi áp dụng RLP.');
    }
    if (!templateSessions.length) {
      throw new BadRequestException(
        'Lớp nguồn chưa có buổi RLP để áp dụng. Hãy điền nội dung trên lớp mẫu trước.',
      );
    }

    const { storeKey, cls, cohortKey } = await this.resolveClassStoreContext(classId);
    const existingDoc = await this.storeModel.findOne({ key: storeKey }).lean().exec();
    const existingSessions: RlpSessionRecord[] =
      (existingDoc?.sessions as RlpSessionRecord[]) || [];

    const className = cls?.name || '';
    const classCode = cls?.classCode || '';
    const targetDays = resolveRlpTargetDays(className, classCode);

    const baseStart =
      parseViDate(startDate) ||
      parseViDate(cls?.phaseStartDate) ||
      parseViDate(cls?.openDate) ||
      new Date();

    const total = templateSessions.length;

    let computedDates: string[] = [];
    if (scheduleMode === 'keep_dates' && existingSessions.length > 0) {
      computedDates = existingSessions.map((s) => s.date || '');
      while (computedDates.length < total) {
        computedDates.push('');
      }
    } else {
      const dates = walkMeetingDates(baseStart, total, targetDays);
      computedDates = dates.map(formatViDate);
    }

    const newSessions: RlpSessionRecord[] = templateSessions.map((item, idx) => {
      const sessionDate = computedDates[idx] || '';
      let deadline = '';
      const parsed = parseViDate(sessionDate);
      if (parsed) {
        const due = new Date(parsed);
        due.setDate(due.getDate() + 7);
        deadline = formatViDate(due);
      }

      const existing = existingSessions.find((s) => s.no === item.no);

      return {
        no: item.no,
        date: sessionDate,
        skill: item.skill || 'Speaking',
        contents: item.contents || '',
        teacherNote:
          existing?.teacherNote && existing.teacherNote !== '—'
            ? existing.teacherNote
            : item.teacherNote || '—',
        lessonFileUrl: item.lessonFileUrl || existing?.lessonFileUrl || '',
        homeworkFileUrl: item.homeworkFileUrl || existing?.homeworkFileUrl || '',
        recordingUrl: existing?.recordingUrl || item.recordingUrl || '',
        deadline,
        homeworkStatus: 'not_assigned' as const,
        attendance: 'present' as const,
        studentAttendance: existing?.studentAttendance || {},
        studentHomework: existing?.studentHomework || {},
      };
    });

    await this.storeModel.collection.updateOne(
      { key: storeKey },
      {
        $set: {
          sessions: newSessions,
          classId,
          cohortKey,
        },
      },
      { upsert: true },
    );

    this.refreshAcademicWarnings();

    return {
      applied: true,
      templateTitle: sourceTitle,
      totalSessions: newSessions.length,
      sessions: newSessions,
    };
  }

  async applyClassRlpToClass(sourceClassId: string, dto: ApplyClassRlpDto) {
    if (String(sourceClassId).trim() === String(dto.classId || '').trim()) {
      throw new BadRequestException('Lớp nguồn và lớp đích phải khác nhau.');
    }
    const source = await this.getClassRlpSource(sourceClassId);
    const title = source.classCode
      ? `[${source.classCode}] ${source.className}`
      : source.className || 'RLP lớp nguồn';
    return this.applySessionItemsToClass(title, source.sessions, dto);
  }

  async listTemplates(): Promise<RlpTemplate[]> {
    const list = await this.templateModel.find().sort({ createdAt: 1 }).lean().exec();
    if (list.length === 0) {
      return DEFAULT_RLP_TEMPLATES as unknown as RlpTemplate[];
    }
    return list;
  }

  async getTemplate(idOrKey: string): Promise<RlpTemplate> {
    const query = idOrKey.match(/^[0-9a-fA-F]{24}$/)
      ? { $or: [{ _id: idOrKey }, { key: idOrKey }] }
      : { key: idOrKey };

    const template = await this.templateModel.findOne(query).lean().exec();
    if (!template) {
      const fallback = DEFAULT_RLP_TEMPLATES.find((t) => t.key === idOrKey);
      if (fallback) return fallback as unknown as RlpTemplate;
      throw new NotFoundException(`Không tìm thấy RLP Mẫu "${idOrKey}"`);
    }
    return template;
  }

  async createTemplate(
    dto: CreateRlpTemplateDto,
    createdBy = 'Học vụ (ACA)',
  ): Promise<RlpTemplate> {
    const existing = await this.templateModel.findOne({ key: dto.key }).lean().exec();
    if (existing) {
      throw new BadRequestException(`Mã mẫu "${dto.key}" đã tồn tại.`);
    }
    const created = await this.templateModel.create({
      ...dto,
      createdBy,
      totalSessions: dto.sessions?.length || dto.totalSessions || 18,
      isDefault: dto.isDefault ?? false,
    });
    return created.toObject();
  }

  async updateTemplate(
    idOrKey: string,
    dto: UpdateRlpTemplateDto,
  ): Promise<RlpTemplate> {
    const query = idOrKey.match(/^[0-9a-fA-F]{24}$/)
      ? { $or: [{ _id: idOrKey }, { key: idOrKey }] }
      : { key: idOrKey };

    let doc = await this.templateModel.findOne(query).exec();
    if (!doc) {
      const fallback = DEFAULT_RLP_TEMPLATES.find((t) => t.key === idOrKey);
      if (fallback) {
        const created = await this.templateModel.create({
          ...fallback,
          ...dto,
          key: fallback.key,
          totalSessions: dto.sessions?.length || fallback.sessions?.length || 18,
        });
        return created.toObject();
      }
      throw new NotFoundException(`Không tìm thấy RLP Mẫu "${idOrKey}" để cập nhật.`);
    }

    if (dto.title !== undefined) doc.title = dto.title;
    if (dto.level !== undefined) doc.level = dto.level;
    if (dto.description !== undefined) doc.description = dto.description;
    if (dto.totalSessions !== undefined) doc.totalSessions = dto.totalSessions;
    if (dto.sessions !== undefined) {
      doc.sessions = dto.sessions as any;
      doc.totalSessions = dto.sessions.length;
    }
    if (dto.isDefault !== undefined) doc.isDefault = dto.isDefault;

    await doc.save();
    return doc.toObject();
  }

  async deleteTemplate(idOrKey: string): Promise<{ deleted: boolean }> {
    const query = idOrKey.match(/^[0-9a-fA-F]{24}$/)
      ? { $or: [{ _id: idOrKey }, { key: idOrKey }] }
      : { key: idOrKey };

    const doc = await this.templateModel.findOne(query).lean().exec();
    if (!doc) {
      throw new NotFoundException(`Không tìm thấy RLP Mẫu "${idOrKey}" để xóa.`);
    }
    await this.templateModel.deleteOne(query).exec();
    return { deleted: true };
  }

  async applyTemplateToClass(
    idOrKey: string,
    dto: ApplyRlpTemplateDto,
  ): Promise<{
    applied: boolean;
    templateTitle: string;
    totalSessions: number;
    sessions: RlpSessionRecord[];
  }> {
    const template = await this.getTemplate(idOrKey);
    return this.applySessionItemsToClass(
      template.title,
      (template.sessions || []).map((item) => ({
        no: item.no,
        skill: item.skill,
        contents: item.contents,
        teacherNote: item.teacherNote,
        lessonFileUrl: item.lessonFileUrl,
        homeworkFileUrl: item.homeworkFileUrl,
        recordingUrl: item.recordingUrl,
      })),
      dto,
    );
  }
}
