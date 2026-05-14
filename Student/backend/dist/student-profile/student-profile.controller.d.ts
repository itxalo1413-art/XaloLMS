import { UpdateStudentProfileDto } from './dto/update-student-profile.dto';
import { StudentProfileService } from './student-profile.service';
export declare class StudentProfileController {
    private readonly studentProfileService;
    constructor(studentProfileService: StudentProfileService);
    getProfile(): Promise<import("./student-profile.types").StudentProfile>;
    updateProfile(payload: UpdateStudentProfileDto): Promise<import("./student-profile.types").StudentProfile>;
    uploadAvatar(file: Express.Multer.File): Promise<import("./student-profile.types").StudentProfile>;
}
