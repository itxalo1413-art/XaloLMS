import { Model } from 'mongoose';
import { UpdateStudentProfileDto } from './dto/update-student-profile.dto';
import { type StudentProfileStoreDocument } from './schemas/student-profile-store.schema';
import { type StudentProfile } from './student-profile.types';
export declare class StudentProfileService {
    private readonly store;
    constructor(store: Model<StudentProfileStoreDocument>);
    private mergeWithDefaults;
    getProfile(): Promise<StudentProfile>;
    updateProfile(payload: UpdateStudentProfileDto): Promise<StudentProfile>;
    updateAvatar(file: Express.Multer.File): Promise<StudentProfile>;
}
