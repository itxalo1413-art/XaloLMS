import { Model } from 'mongoose';
import { type TeacherAttendanceDocument } from './schemas/teacher-attendance.schema';
export declare class TeacherAttendanceService {
    private readonly attendanceModel;
    constructor(attendanceModel: Model<TeacherAttendanceDocument>);
    getAttendanceMap(teacherEmail: string): Promise<Record<string, boolean>>;
    toggleAttendance(teacherEmail: string, sessionId: string, attended?: boolean): Promise<Record<string, boolean>>;
}
