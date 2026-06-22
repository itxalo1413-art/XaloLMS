import { Model } from 'mongoose';
import { UpdateRlpSessionDto } from './dto/update-rlp-session.dto';
import type { RlpSessionRecord } from './rlp.types';
import { type RlpCourseStoreDocument } from './schemas/rlp-course-store.schema';
export declare class RlpService {
    private readonly storeModel;
    constructor(storeModel: Model<RlpCourseStoreDocument>);
    private cloneDefaults;
    private ensureStore;
    private normalizeSessions;
    listSessions(): Promise<RlpSessionRecord[]>;
    updateSession(no: number, payload: UpdateRlpSessionDto): Promise<RlpSessionRecord>;
}
