import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  TeacherAttendance,
  type TeacherAttendanceDocument,
} from './schemas/teacher-attendance.schema';

@Injectable()
export class TeacherAttendanceService {
  constructor(
    @InjectModel(TeacherAttendance.name)
    private readonly attendanceModel: Model<TeacherAttendanceDocument>,
  ) {}

  async getAttendanceMap(teacherEmail: string): Promise<Record<string, boolean>> {
    if (!teacherEmail) return {};
    const email = teacherEmail.trim().toLowerCase();
    const records = await this.attendanceModel.find({ teacherEmail: email }).lean().exec();
    const map: Record<string, boolean> = {};
    for (const r of records) {
      map[r.sessionId] = r.attended;
    }
    return map;
  }

  async toggleAttendance(
    teacherEmail: string,
    sessionId: string,
    attended?: boolean,
  ): Promise<Record<string, boolean>> {
    const email = teacherEmail.trim().toLowerCase();
    const existing = await this.attendanceModel.findOne({ teacherEmail: email, sessionId }).exec();
    const nextValue = attended !== undefined ? attended : !(existing?.attended ?? false);

    await this.attendanceModel.findOneAndUpdate(
      { teacherEmail: email, sessionId },
      { $set: { attended: nextValue } },
      { upsert: true },
    ).exec();

    return this.getAttendanceMap(email);
  }
}
