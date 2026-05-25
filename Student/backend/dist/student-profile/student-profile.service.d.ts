import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { Model } from 'mongoose';
import { UsersService } from '../users/users.service';
import { UpdateStudentProfileDto } from './dto/update-student-profile.dto';
import { type StudentProfileStoreDocument } from './schemas/student-profile-store.schema';
import { type StudentProfile } from './student-profile.types';
export declare class StudentProfileService {
    private readonly store;
    private readonly users;
    private readonly cloudinary;
    private readonly logger;
    constructor(store: Model<StudentProfileStoreDocument>, users: UsersService, cloudinary: CloudinaryService);
    private mergeWithDefaults;
    private defaultForUser;
    getProfile(userId: string): Promise<StudentProfile>;
    private persist;
    updateProfile(userId: string, payload: UpdateStudentProfileDto): Promise<StudentProfile>;
    updateAvatar(userId: string, file: Express.Multer.File): Promise<StudentProfile>;
}
