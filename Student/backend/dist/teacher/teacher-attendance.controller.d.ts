import type { Request } from 'express';
import type { JwtPayload } from '../auth/auth.types';
import { TeacherAttendanceService } from './teacher-attendance.service';
type AuthedRequest = Request & {
    user: JwtPayload;
};
export declare class TeacherAttendanceController {
    private readonly attendanceService;
    constructor(attendanceService: TeacherAttendanceService);
    getAttendance(req: AuthedRequest): Promise<Record<string, boolean>>;
    toggleAttendance(req: AuthedRequest, sessionId: string, body: {
        attended?: boolean;
    }): Promise<Record<string, boolean>>;
}
export {};
