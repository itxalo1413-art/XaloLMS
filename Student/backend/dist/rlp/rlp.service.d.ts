import { Model } from 'mongoose';
import { UpdateRlpSessionDto } from './dto/update-rlp-session.dto';
import type { RlpSessionRecord } from './rlp.types';
import { type RlpCourseStoreDocument } from './schemas/rlp-course-store.schema';
import { AcaStudentDocument } from '../aca/schemas/aca-student.schema';
import { AcaClassDocument } from '../aca/schemas/aca-class.schema';
export declare class RlpService {
    private readonly storeModel;
    private readonly studentModel;
    private readonly classModel;
    constructor(storeModel: Model<RlpCourseStoreDocument>, studentModel: Model<AcaStudentDocument>, classModel: Model<AcaClassDocument>);
    private cloneDefaults;
    private ensureStoreForClass;
    private ensureStore;
    private normalizeSessions;
    listSessions(): Promise<RlpSessionRecord[]>;
    listSessionsForStudent(email: string): Promise<RlpSessionRecord[]>;
    listSessionsForClass(classId: string): Promise<RlpSessionRecord[]>;
    updateSession(no: number, payload: UpdateRlpSessionDto): Promise<RlpSessionRecord>;
    updateSessionForClass(classId: string, no: number, payload: UpdateRlpSessionDto): Promise<RlpSessionRecord>;
}
