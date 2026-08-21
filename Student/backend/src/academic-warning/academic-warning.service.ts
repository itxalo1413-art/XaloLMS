import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import {
  AcademicWarning,
  AcademicWarningDocument,
  type AcademicWarningHandledStatus,
  type AcademicWarningRiskLevel,
  type AcademicWarningType,
} from './schemas/academic-warning.schema';
import {
  AcaStudent,
  type AcaStudentDocument,
} from '../aca/schemas/aca-student.schema';
import {
  AcaClass,
  type AcaClassDocument,
} from '../aca/schemas/aca-class.schema';
import {
  RlpCourseStore,
  type RlpCourseStoreDocument,
} from '../rlp/schemas/rlp-course-store.schema';
import type { RlpSessionRecord } from '../rlp/rlp.types';
import { computeStudentRlpProgress } from '../rlp/rlp-progress.util';
import {
  buildWarningTypes,
  deriveRiskLevel,
  hasCompletedFirstStage,
  isAcaTableWarning,
  shouldNotifyAbsentSoft,
} from './academic-warning.rules';

@Injectable()
export class AcademicWarningService {
  private lastSyncAt = 0;

  constructor(
    @InjectModel(AcademicWarning.name)
    private readonly model: Model<AcademicWarningDocument>,
    @InjectModel(AcaStudent.name)
    private readonly studentModel: Model<AcaStudentDocument>,
    @InjectModel(AcaClass.name)
    private readonly classModel: Model<AcaClassDocument>,
    @InjectModel(RlpCourseStore.name)
    private readonly rlpStoreModel: Model<RlpCourseStoreDocument>,
  ) {}

  private escapeRegex(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private toPublic(doc: any, opts?: { forStudent?: boolean }) {
    const firstStageCompleted = hasCompletedFirstStage({
      firstStageCompleted: doc.firstStageCompleted,
      totalSessionsElapsed: doc.totalSessionsElapsed,
      classOpenDate: doc.classOpenDate,
      phaseStartDate: doc.phaseStartDate,
      nextPhaseStartDate: doc.nextPhaseStartDate,
      phaseDurationDays: doc.phaseDurationDays,
    });
    const warningTypes = buildWarningTypes(
      Number(doc.absentCount) || 0,
      Number(doc.homeworkSubmitted) || 0,
      Number(doc.homeworkTotal) || 0,
    );
    const riskLevel = deriveRiskLevel(warningTypes);
    const row = {
      id: doc._id.toString(),
      studentId: doc.studentId ?? '',
      studentName: doc.studentName ?? '',
      studentPhone: doc.studentPhone ?? '',
      studentEmail: doc.studentEmail ?? '',
      classId: doc.classId ?? '',
      className: doc.className ?? '',
      teacherName: doc.teacherName ?? '',
      courseDurationMonths: doc.courseDurationMonths ?? 3,
      checkpointPhase: doc.checkpointPhase ?? '',
      totalSessionsElapsed: doc.totalSessionsElapsed ?? 0,
      absentCount: doc.absentCount ?? 0,
      attendanceRate: doc.attendanceRate ?? 0,
      homeworkSubmitted: doc.homeworkSubmitted ?? 0,
      homeworkTotal: doc.homeworkTotal ?? 0,
      homeworkRate: doc.homeworkRate ?? 0,
      warningTypes,
      notificationSentToStudent: Boolean(doc.notificationSentToStudent),
      studentNotificationDismissed: Boolean(doc.studentNotificationDismissed),
      riskLevel,
      handledStatus: (doc.handledStatus ??
        'pending') as AcademicWarningHandledStatus,
      handlingNote: opts?.forStudent ? '' : (doc.handlingNote ?? ''),
      notificationMessage: doc.notificationMessage ?? '',
      lastContactedAt: doc.lastContactedAt ?? '',
      classOpenDate: doc.classOpenDate ?? '',
      firstStageCompleted,
      createdAt:
        doc.createdAt instanceof Date
          ? doc.createdAt.toISOString()
          : (doc.createdAt ?? new Date().toISOString()),
      updatedAt:
        doc.updatedAt instanceof Date
          ? doc.updatedAt.toISOString()
          : doc.updatedAt,
    };
    return row;
  }

  private isActive(row: { warningTypes: AcademicWarningType[] }) {
    return (row.warningTypes?.length ?? 0) > 0;
  }

  /** Bảng học vụ: chỉ t4+ vắng / BTVN ≥4 và chưa gửi noti xử lý. */
  private isPendingAcaTableRow(row: {
    warningTypes: AcademicWarningType[];
    handledStatus: AcademicWarningHandledStatus;
  }) {
    return (
      isAcaTableWarning(row.warningTypes) &&
      (row.handledStatus === 'pending' || !row.handledStatus)
    );
  }

  private normalizePatch(input: Record<string, unknown>) {
    const patch: Record<string, unknown> = {};
    const str = (key: string) => {
      if (input[key] === undefined) return;
      patch[key] = String(input[key] ?? '').trim();
    };
    const num = (key: string) => {
      if (input[key] === undefined) return;
      const n = Number(input[key]);
      patch[key] = Number.isFinite(n) ? n : 0;
    };
    const bool = (key: string) => {
      if (input[key] === undefined) return;
      patch[key] = Boolean(input[key]);
    };

    str('studentId');
    str('studentName');
    str('studentPhone');
    str('studentEmail');
    str('classId');
    str('className');
    str('teacherName');
    num('courseDurationMonths');
    str('checkpointPhase');
    num('totalSessionsElapsed');
    num('absentCount');
    num('attendanceRate');
    num('homeworkSubmitted');
    num('homeworkTotal');
    num('homeworkRate');
    bool('notificationSentToStudent');
    bool('studentNotificationDismissed');
    str('handlingNote');
    str('notificationMessage');
    str('lastContactedAt');
    str('classOpenDate');
    bool('firstStageCompleted');
    num('phaseDurationDays');
    str('phaseStartDate');
    str('nextPhaseStartDate');

    if (input.handledStatus !== undefined) {
      patch.handledStatus = String(input.handledStatus);
    }
    if (input.riskLevel !== undefined) {
      patch.riskLevel = String(input.riskLevel) as AcademicWarningRiskLevel;
    }

    const merged = {
      firstStageCompleted: Boolean(
        patch.firstStageCompleted ?? input.firstStageCompleted,
      ),
      totalSessionsElapsed: Number(
        patch.totalSessionsElapsed ?? input.totalSessionsElapsed ?? 0,
      ),
      classOpenDate: String(patch.classOpenDate ?? input.classOpenDate ?? ''),
      phaseStartDate: String(patch.phaseStartDate ?? input.phaseStartDate ?? ''),
      nextPhaseStartDate: String(
        patch.nextPhaseStartDate ?? input.nextPhaseStartDate ?? '',
      ),
      phaseDurationDays: Number(
        patch.phaseDurationDays ?? input.phaseDurationDays ?? 0,
      ),
      absentCount: Number(patch.absentCount ?? input.absentCount ?? 0),
      homeworkSubmitted: Number(
        patch.homeworkSubmitted ?? input.homeworkSubmitted ?? 0,
      ),
      homeworkTotal: Number(patch.homeworkTotal ?? input.homeworkTotal ?? 0),
    };
    const firstStageCompleted = hasCompletedFirstStage(merged);
    const warningTypes = buildWarningTypes(
      merged.absentCount,
      merged.homeworkSubmitted,
      merged.homeworkTotal,
    );
    patch.firstStageCompleted = firstStageCompleted;
    patch.warningTypes = warningTypes;
    patch.riskLevel = deriveRiskLevel(warningTypes);
    return patch;
  }

  private async findDoc(id: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('ID cảnh báo không hợp lệ');
    }
    const doc = await this.model.findById(id).exec();
    if (!doc) throw new NotFoundException('Không tìm thấy bản ghi cảnh báo');
    return doc;
  }

  async listAll(filters?: { classId?: string; teacherName?: string }) {
    await this.syncFromRlp();
    const query: Record<string, unknown> = {};
    if (filters?.classId?.trim()) {
      const classId = filters.classId.trim();
      query.$or = [
        { classId },
        { className: classId },
      ];
    }
    if (filters?.teacherName?.trim()) {
      const name = filters.teacherName.trim();
      query.teacherName = new RegExp(this.escapeRegex(name), 'i');
    }
    const rows = await this.model.find(query).sort({ createdAt: -1 }).lean().exec();
    return rows
      .map((r) => this.toPublic(r))
      .filter((r) => this.isPendingAcaTableRow(r));
  }

  async listForTeacher(teacherName: string) {
    await this.syncFromRlp();
    const name = teacherName.trim();
    if (!name) return [];
    const words = name.split(/\s+/).filter(Boolean);
    const lastTwo = words.length >= 2 ? words.slice(-2).join(' ') : name;
    const rows = await this.model
      .find({
        teacherName: {
          $regex: this.escapeRegex(lastTwo),
          $options: 'i',
        },
      })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    return rows
      .map((r) => this.toPublic(r))
      .filter((r) => this.isPendingAcaTableRow(r));
  }

  async listForStudent(identity: {
    studentId?: string;
    email?: string;
    name?: string;
  }) {
    const clauses: Record<string, unknown>[] = [];
    if (identity.studentId?.trim()) {
      clauses.push({ studentId: identity.studentId.trim() });
    }
    if (identity.email?.trim()) {
      clauses.push({
        studentEmail: new RegExp(
          `^${this.escapeRegex(identity.email.trim())}$`,
          'i',
        ),
      });
    }
    if (identity.name?.trim()) {
      clauses.push({
        studentName: new RegExp(this.escapeRegex(identity.name.trim()), 'i'),
      });
    }
    if (!clauses.length) return [];

    await this.syncFromRlp();

    const rows = await this.model
      .find({ $or: clauses })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    return rows
      .map((r) => this.toPublic(r, { forStudent: true }))
      .filter(
        (r) => this.isActive(r) && r.notificationSentToStudent,
      );
  }

  async create(input: Record<string, unknown>) {
    const studentId = String(input.studentId ?? '').trim();
    const classId = String(input.classId ?? '').trim();
    const studentName = String(input.studentName ?? '').trim();
    if (!studentId || !classId || !studentName) {
      throw new BadRequestException(
        'Thiếu studentId, classId hoặc studentName',
      );
    }

    const existing = await this.model
      .findOne({ studentId, classId })
      .exec();
    if (existing) {
      return this.update(existing._id.toString(), input);
    }

    const patch = this.normalizePatch(input);
    const doc = await this.model.create({
      studentId,
      classId,
      studentName,
      ...patch,
    });
    return this.toPublic(doc);
  }

  async update(id: string, input: Record<string, unknown>) {
    const doc = await this.findDoc(id);
    const current = doc.toObject();
    const patch = this.normalizePatch({ ...current, ...input });
    Object.assign(doc, patch);
    await doc.save();
    return this.toPublic(doc);
  }

  async notifyStudent(id: string, body?: { message?: string }) {
    const message =
      typeof body?.message === 'string' ? body.message.trim() : '';
    return this.update(id, {
      notificationSentToStudent: true,
      studentNotificationDismissed: false,
      handledStatus: 'contacted',
      lastContactedAt: new Date().toISOString(),
      ...(message ? { notificationMessage: message } : {}),
    });
  }

  async dismissForStudent(id: string) {
    return this.update(id, { studentNotificationDismissed: true });
  }

  async delete(id: string) {
    await this.findDoc(id);
    await this.model.findByIdAndDelete(id).exec();
    return { ok: true };
  }

  private sessionsForClass(
    classId: string,
    classes: Array<{
      _id: unknown;
      name?: string;
      classCode?: string;
    }>,
    rlpMap: Map<string, RlpSessionRecord[]>,
  ): RlpSessionRecord[] {
    const direct = rlpMap.get(`rlp_store_${classId}`);
    if (direct?.length) return direct;

    const cls = classes.find(
      (c) =>
        String(c._id) === classId ||
        c.name === classId ||
        (c.classCode && c.classCode === classId),
    );
    if (!cls) return [];

    const relatedIds = classes
      .filter(
        (c) =>
          String(c._id) === String(cls._id) ||
          (cls.classCode && c.classCode === cls.classCode) ||
          (cls.name && c.name === cls.name),
      )
      .map((c) => String(c._id));

    for (const id of relatedIds) {
      const sessions = rlpMap.get(`rlp_store_${id}`);
      if (sessions?.length) return sessions;
    }
    return [];
  }

  /** Đếm điểm danh/BTVN từ RLP rồi upsert cảnh báo cho học viên vượt ngưỡng. */
  async syncFromRlp(force = false): Promise<{ upserted: number; scanned: number }> {
    const now = Date.now();
    if (!force && now - this.lastSyncAt < 8000) {
      return { upserted: 0, scanned: 0 };
    }
    this.lastSyncAt = now;

    const [students, classes, stores] = await Promise.all([
      this.studentModel.find().lean().exec(),
      this.classModel.find().lean().exec(),
      this.rlpStoreModel.find().lean().exec(),
    ]);

    const rlpMap = new Map<string, RlpSessionRecord[]>();
    for (const store of stores) {
      rlpMap.set(store.key, (store.sessions as RlpSessionRecord[]) || []);
    }
    const classById = new Map(classes.map((c) => [String(c._id), c]));

    let upserted = 0;
    for (const st of students) {
      const studentId = String(st._id);
      const classId = String(st.classId || '').trim();
      if (!classId || classId === 'cls_placeholder') continue;

      const sessions = this.sessionsForClass(classId, classes, rlpMap);
      if (!sessions.length) continue;

      const progress = computeStudentRlpProgress(sessions, {
        id: studentId,
        email: st.email,
        name: st.name,
        phone: st.phone,
      });
      if (progress.totalSessionsElapsed <= 0 && progress.homeworkTotal <= 0) {
        continue;
      }

      const cls =
        classById.get(classId) ||
        classes.find((c) => c.name === classId || c.classCode === classId);
      const classOpenDate = cls?.openDate || '';
      const phaseStartDate = cls?.phaseStartDate || '';
      const nextPhaseStartDate = cls?.nextPhaseStartDate || '';
      const phaseDurationDays = Number(cls?.phaseDurationDays) || 0;
      const firstStageCompleted = hasCompletedFirstStage({
        totalSessionsElapsed: progress.totalSessionsElapsed,
        classOpenDate,
        phaseStartDate,
        nextPhaseStartDate,
        phaseDurationDays,
      });
      const warningTypes = buildWarningTypes(
        progress.absentCount,
        progress.homeworkSubmitted,
        progress.homeworkTotal,
      );

      const existing = await this.model.findOne({ studentId, classId }).exec();
      if (warningTypes.length === 0) {
        if (existing) {
          Object.assign(existing, {
            ...progress,
            studentName: st.name,
            studentPhone: st.phone || '',
            studentEmail: st.email || '',
            className: cls?.name || existing.className || '',
            teacherName: cls?.teacher || existing.teacherName || '',
            classOpenDate,
            phaseStartDate,
            nextPhaseStartDate,
            phaseDurationDays,
            firstStageCompleted,
            warningTypes,
            riskLevel: deriveRiskLevel(warningTypes),
            checkpointPhase:
              cls?.currentPhase ||
              `Chặng 1 (${progress.totalSessionsElapsed} buổi)`,
          });
          await existing.save();
          upserted += 1;
        }
        continue;
      }

      const unfinished =
        progress.homeworkTotal - progress.homeworkSubmitted;
      const existingUnfinished = existing
        ? (existing.homeworkTotal || 0) - (existing.homeworkSubmitted || 0)
        : 0;
      const prevAbsent = existing?.absentCount || 0;
      const worsened =
        existing &&
        (progress.absentCount > prevAbsent || unfinished > existingUnfinished);

      const onAcaTable = isAcaTableWarning(warningTypes);
      // Lần đầu chạm t3 (vắng ≥ 3): tự gửi soft noti cho học viên.
      const firstSoftAbsent =
        shouldNotifyAbsentSoft(progress.absentCount) && prevAbsent < 3;
      // Lần đầu đủ điều kiện lên bảng học vụ (t4+ / BTVN): mở lại pending.
      const firstAcaVisible =
        onAcaTable &&
        (!existing || !isAcaTableWarning(existing.warningTypes || []));

      let handledStatus: AcademicWarningHandledStatus =
        (existing?.handledStatus as AcademicWarningHandledStatus) || 'pending';
      if (onAcaTable && (firstAcaVisible || worsened)) {
        handledStatus = 'pending';
      } else if (!onAcaTable) {
        // Soft t3: không cần học vụ xử lý trên bảng
        handledStatus = existing?.handledStatus === 'contacted' ? 'contacted' : 'pending';
      }

      const shouldAutoNotifyStudent = firstSoftAbsent;
      const reopenStudentAlert =
        shouldAutoNotifyStudent ||
        (onAcaTable && worsened && Boolean(existing?.notificationSentToStudent));

      const payload = {
        studentId,
        studentName: st.name,
        studentPhone: st.phone || '',
        studentEmail: st.email || '',
        classId,
        className: cls?.name || '',
        teacherName: cls?.teacher || '',
        courseDurationMonths: 3,
        checkpointPhase:
          cls?.currentPhase || `Chặng 1 (${progress.totalSessionsElapsed} buổi)`,
        ...progress,
        warningTypes,
        riskLevel: deriveRiskLevel(warningTypes),
        classOpenDate,
        phaseStartDate,
        nextPhaseStartDate,
        phaseDurationDays,
        firstStageCompleted,
        handledStatus,
        notificationSentToStudent: shouldAutoNotifyStudent
          ? true
          : Boolean(existing?.notificationSentToStudent),
        studentNotificationDismissed: reopenStudentAlert
          ? false
          : Boolean(existing?.studentNotificationDismissed),
        ...(shouldAutoNotifyStudent && !existing?.notificationMessage
          ? {
              notificationMessage: `Bạn đã vắng ${progress.absentCount} buổi. Vui lòng chú ý chuyên cần; từ buổi vắng thứ 4 học vụ sẽ theo dõi và liên hệ bạn.`,
            }
          : {}),
      };

      if (existing) {
        Object.assign(existing, payload);
        await existing.save();
      } else {
        await this.model.create({
          ...payload,
        });
      }
      upserted += 1;
    }

    return { upserted, scanned: students.length };
  }
}
