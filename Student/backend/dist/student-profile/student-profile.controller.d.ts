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
    updateProfile(req: AuthedRequest, payload: UpdateStudentProfileDto): Promise<import("./student-profile.types").StudentProfile>;
    uploadAvatar(req: AuthedRequest, file: Express.Multer.File): Promise<import("./student-profile.types").StudentProfile>;
}
export {};
