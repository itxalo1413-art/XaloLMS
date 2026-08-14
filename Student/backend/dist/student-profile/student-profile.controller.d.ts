import type { Request } from 'express';
import type { JwtPayload } from '../auth/auth.types';
import { UpdateStudentProfileDto } from './dto/update-student-profile.dto';
import { StudentProfileService } from './student-profile.service';
type AuthedRequest = Request & {
    user: JwtPayload;
};
export declare class StudentProfileController {
    private readonly studentProfileService;
    constructor(studentProfileService: StudentProfileService);
    getProfile(req: AuthedRequest): Promise<import("./student-profile.types").StudentProfile>;
    getDiagnosis(req: AuthedRequest): Promise<{
        name: string;
        email: string;
        phone: string;
        classId: string;
        bcbLink: string;
        scores: {
            listening: number;
            reading: number;
            writing: number;
            speaking: number;
            overall: number;
        };
        finalScores: {
            listening: number;
            reading: number;
            writing: number;
            speaking: number;
            overall: number;
        };
    } | null>;
    getClassInfo(req: AuthedRequest): Promise<{
        course: string;
        instructor: string;
        room: string;
        zoomPassword: string;
        schedule: string[];
        phases: {
            name: string;
            date: string;
        }[];
        openDate: string;
        endDate: string;
    }>;
    updateProfile(req: AuthedRequest, payload: UpdateStudentProfileDto): Promise<import("./student-profile.types").StudentProfile>;
    uploadAvatar(req: AuthedRequest, file: Express.Multer.File): Promise<import("./student-profile.types").StudentProfile>;
}
export {};
