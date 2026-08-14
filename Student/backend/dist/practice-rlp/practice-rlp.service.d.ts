import { Model } from 'mongoose';
import type { RlpSessionRecord } from '../rlp/rlp.types';
import { type PracticeRlpStoreDocument } from './schemas/practice-rlp-store.schema';
import { CreatePracticeRlpSessionDto, UpdatePracticeRlpSessionDto } from './dto/practice-rlp.dto';
export declare class PracticeRlpService {
    private readonly storeModel;
    constructor(storeModel: Model<PracticeRlpStoreDocument>);
    private ensureStore;
    listSessions(studentId: string): Promise<RlpSessionRecord[]>;
    addSession(studentId: string, dto: CreatePracticeRlpSessionDto): Promise<RlpSessionRecord>;
    updateSession(studentId: string, no: number, dto: UpdatePracticeRlpSessionDto): Promise<RlpSessionRecord>;
    deleteSession(studentId: string, no: number): Promise<{
        deleted: boolean;
    }>;
}
